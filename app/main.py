"""いこたび サーバー（FastAPI）。API は仕様書B 8章。

起動: uvicorn app.main:app --reload
"""

import asyncio
import logging
import os
from contextlib import asynccontextmanager
from datetime import date
from typing import Annotated

from dotenv import load_dotenv
from fastapi import FastAPI, Header, Query, WebSocket, WebSocketDisconnect
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, EmailStr, Field, StringConstraints, model_validator

from app import db, schemas, service
from app.embedding import Embedder
from app.engine import Engine
from app.realtime import hub
from app.schemas import TargetType

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
log = logging.getLogger("ikotabi.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_pool()
    db.create_schema()
    db.seed()
    await asyncio.to_thread(db.backfill_destination_images)
    embedder = await asyncio.to_thread(
        Embedder, os.environ.get("BERT_MODEL", "sonoisa/sentence-bert-base-ja-mean-tokens-v2")
    )
    # BERTのベクトル計算（数十秒かかることがある）はDB接続を閉じてから行う。
    # 開いたまま行うと、リモートDB（Railway等）で接続が切られることがある。
    with db.tx() as conn:
        destination_rows = conn.execute("SELECT * FROM destinations ORDER BY id").fetchall()
        place_rows = conn.execute("SELECT * FROM places ORDER BY id").fetchall()
    service.engine = await asyncio.to_thread(Engine, destination_rows, place_rows, embedder)
    hub.bind_loop(asyncio.get_running_loop())
    yield
    db.close_pool()


app = FastAPI(title="いこたび", lifespan=lifespan)

# フロントエンド（Vercel／ローカル開発）からのブラウザfetchを許可する。
# CORS_ORIGINS でカンマ区切りの追加オリジンを environments から足せるようにしておく。
_default_origins = [
    "https://ikotabi.vercel.app",
    "http://localhost:3000",
    "http://localhost:3100",
]
_extra_origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://ikotabi.*\.vercel\.app",
    allow_origins=_default_origins + _extra_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=20)]
Token = Annotated[str | None, Header(alias="X-Member-Token")]
UserToken = Annotated[str | None, Header(alias="X-User-Token")]


class RequestBody(BaseModel):
    """未知のフィールドは誤りとして弾きます（余分な項目を黙って無視しない）。"""

    model_config = ConfigDict(extra="forbid")


class RegisterIn(RequestBody):
    display_name: Name
    email: EmailStr
    password: str = Field(min_length=8, max_length=100)


class LoginIn(RequestBody):
    email: EmailStr
    password: str = Field(min_length=1, max_length=100)


class GroupIn(RequestBody):
    name: Name
    start_date: date
    end_date: date
    member_limit: int = Field(ge=2, le=4)
    nickname: Name

    @model_validator(mode="after")
    def _dates_in_order(self):
        if self.end_date < self.start_date:
            raise ValueError("帰る日は出発日より後にしてください")
        return self


class JoinIn(RequestBody):
    nickname: Name


class SelectionsIn(RequestBody):
    tag_ids: list[Annotated[int, Field(ge=1)]] = Field(max_length=65)
    share_answers: bool = False


class MustHaveIn(RequestBody):
    tag_id: int = Field(ge=1)


class VoteIn(RequestBody):
    type: TargetType
    target_ids: list[Annotated[int, Field(ge=1)]] = Field(max_length=3)


# ───────── 入力エラーの日本語化 ─────────

# Pydantic のエラーは英語で返るため、そのまま画面に出せる日本語に置き換えます。
# detail を文字列にすることで、フロントエンド側のエラー表示がそのまま使えます。
_FIELD_LABELS = {
    "display_name": "ニックネーム",
    "nickname": "ニックネーム",
    "name": "グループ名",
    "email": "メールアドレス",
    "password": "パスワード",
    "member_limit": "定員",
    "start_date": "出発日",
    "end_date": "帰る日",
    "tag_ids": "希望のタグ",
    "tag_id": "タグ",
    "share_answers": "回答の公開",
    "type": "種類",
    "target_ids": "投票先",
}


def _validation_message(errors: list[dict]) -> str:
    """最初の1件を、画面にそのまま出せる日本語にします。"""
    first = errors[0]
    loc = [str(p) for p in first.get("loc", [])]
    kind = first.get("type", "")
    ctx = first.get("ctx") or {}
    field = next((p for p in reversed(loc) if not p.isdigit()), "")
    label = _FIELD_LABELS.get(field, field or "入力値")

    if kind == "missing":
        return f"{label}を入力してください"
    if kind == "extra_forbidden":
        return f"{label}は指定できません"
    if kind == "string_too_short":
        return f"{label}は{ctx.get('min_length')}文字以上で入力してください"
    if kind == "string_too_long":
        return f"{label}は{ctx.get('max_length')}文字以内で入力してください"
    if kind in ("too_short", "list_too_short"):
        return f"{label}は{ctx.get('min_length')}件以上必要です"
    if kind in ("too_long", "list_too_long"):
        return f"{label}は{ctx.get('max_length')}件までです"
    if kind in ("greater_than_equal", "greater_than"):
        return f"{label}は{ctx.get('ge', ctx.get('gt'))}以上で指定してください"
    if kind in ("less_than_equal", "less_than"):
        return f"{label}は{ctx.get('le', ctx.get('lt'))}以下で指定してください"
    if kind == "value_error":
        # モデル全体の検証で書いた日本語メッセージはそのまま使います。
        if "email" in loc:
            return "メールアドレスの形式が正しくありません"
        return str(first.get("msg", "")).removeprefix("Value error, ") or f"{label}が正しくありません"
    if kind == "literal_error":
        return f"{label}の値が正しくありません"
    return f"{label}の形式が正しくありません"


@app.exception_handler(RequestValidationError)
async def on_validation_error(_request, exc: RequestValidationError):
    errors = exc.errors()
    log.warning("リクエストの検証に失敗しました: %s", errors)
    return JSONResponse(status_code=422, content={"detail": _validation_message(errors)})


# ───────── REST ─────────


@app.post("/api/auth/register", response_model=schemas.AuthResult)
def register(body: RegisterIn):
    with db.tx() as conn:
        return service.register_user(conn, body.display_name, body.email, body.password)


@app.post("/api/auth/login", response_model=schemas.AuthResult)
def login(body: LoginIn):
    with db.tx() as conn:
        return service.login_user(conn, body.email, body.password)


@app.get("/api/auth/me", response_model=schemas.AccountMe)
def me(token: UserToken = None):
    with db.tx() as conn:
        user = service.auth_user(conn, token)
        return {"display_name": user["display_name"], "email": user["email"]}


@app.post("/api/groups", response_model=schemas.CreateGroupResult)
def create_group(body: GroupIn):
    with db.tx() as conn:
        return service.create_group(conn, body.name, body.start_date, body.end_date, body.member_limit, body.nickname)


@app.get("/api/groups/{group_id}", response_model=schemas.GroupView)
def get_group(group_id: str, token: Token = None):
    with db.tx() as conn:
        me = service.auth_member(conn, group_id, token)
        return service.group_view(conn, group_id, me)


@app.post("/api/groups/{group_id}/invites", response_model=schemas.InviteToken)
def create_invite(group_id: str, token: Token = None):
    with db.tx() as conn:
        me = service.auth_member(conn, group_id, token)
        return service.create_invite(conn, group_id, me)


@app.delete("/api/groups/{group_id}/invites", response_model=schemas.RevokeResult)
def revoke_invites(group_id: str, token: Token = None):
    with db.tx() as conn:
        me = service.auth_member(conn, group_id, token)
        return service.revoke_open_invites(conn, group_id, me)


@app.get("/api/invites/{invite_token}", response_model=schemas.InviteInfo)
def get_invite(invite_token: str):
    with db.tx() as conn:
        return service.get_invite(conn, invite_token)


@app.post("/api/invites/{invite_token}/join", response_model=schemas.JoinResult)
def join(invite_token: str, body: JoinIn):
    with db.tx() as conn:
        result, events = service.join(conn, invite_token, body.nickname)
    hub.notify(result["group_id"], events)
    return result


@app.get("/api/tags", response_model=list[schemas.TagCategory])
def tags():
    with db.tx() as conn:
        return service.list_tags(conn)


@app.get("/api/groups/{group_id}/tag-summary", response_model=schemas.TagSummary)
def tag_summary(group_id: str, token: Token = None):
    """投票結果画面：カテゴリごとにどのタグが何人に選ばれたかの集計。"""
    with db.tx() as conn:
        service.auth_member(conn, group_id, token)
        return service.tag_summary(conn, group_id)


@app.get("/api/groups/{group_id}/selections/me", response_model=schemas.MySelections)
def get_selections(group_id: str, token: Token = None):
    with db.tx() as conn:
        me = service.auth_member(conn, group_id, token)
        return service.get_my_selections(conn, me)


@app.put("/api/groups/{group_id}/selections/me", response_model=schemas.EmptyResult)
def put_selections(group_id: str, body: SelectionsIn, token: Token = None):
    with db.tx() as conn:
        me = service.auth_member(conn, group_id, token)
        result = service.save_my_selections(conn, group_id, me, body.tag_ids, body.share_answers)
    hub.notify(group_id, ["answers"])
    return result


@app.put("/api/groups/{group_id}/selections/me/must-have", response_model=schemas.SaveMustHaveResult)
def put_must_have(group_id: str, body: MustHaveIn, token: Token = None):
    """お気に入り選定：選んだタグの中から「今回の旅行で譲れないこと」を1つ確定する。"""
    with db.tx() as conn:
        me = service.auth_member(conn, group_id, token)
        result, events = service.save_must_have(conn, group_id, me, body.tag_id)
    hub.notify(group_id, events)
    return result


@app.get("/api/groups/{group_id}/candidates", response_model=schemas.CandidatesView)
def candidates(group_id: str, type: TargetType = Query(...), token: Token = None):
    with db.tx() as conn:
        me = service.auth_member(conn, group_id, token)
        return service.candidates(conn, group_id, me, type)


@app.post("/api/groups/{group_id}/votes", response_model=schemas.OkResult)
def vote(group_id: str, body: VoteIn, token: Token = None):
    with db.tx() as conn:
        me = service.auth_member(conn, group_id, token)
        events = service.vote(conn, group_id, me, body.type, body.target_ids)
    hub.notify(group_id, events)
    return {"ok": True}


@app.post("/api/groups/{group_id}/candidates/reconsider", response_model=schemas.OkResult)
def reconsider(group_id: str, type: TargetType = Query(...), token: Token = None):
    """候補が合わないとき、幹事が地域・予算などの条件を外して候補を計算し直す。"""
    with db.tx() as conn:
        me = service.auth_member(conn, group_id, token)
        events = service.reconsider(conn, group_id, me, type)
    hub.notify(group_id, events)
    return {"ok": True}


@app.get("/api/groups/{group_id}/summary", response_model=schemas.GroupSummary)
def summary(group_id: str, token: Token = None):
    with db.tx() as conn:
        service.auth_member(conn, group_id, token)
        return service.summary(conn, group_id)


@app.get("/api/health", response_model=schemas.Health)
def health():
    """死活確認です。DB に到達でき、かつマッチング用のモデルが準備できているときだけ 200 を返します。"""
    try:
        with db.tx(timeout=2.0) as conn:
            conn.execute("SELECT 1")
        db_ok = True
    except Exception:  # noqa: BLE001  DB に触れられない場合も 503 として返すため、ここでは握りつぶします
        db_ok = False
    model_ready = service.engine is not None
    ok = db_ok and model_ready
    return JSONResponse(
        status_code=200 if ok else 503,
        content={
            "ok": ok,
            "db": db_ok,
            "model": model_ready,
            "embedding": service.engine.sim.embedder_name if service.engine else None,
        },
    )


# ───────── WebSocket ─────────


@app.websocket("/ws/groups/{group_id}")
async def ws_group(ws: WebSocket, group_id: str, token: str = Query("")):
    # ブラウザの WebSocket はヘッダーを付けられないので、トークンはクエリで受け取る
    def check():
        with db.tx() as conn:
            service.auth_member(conn, group_id, token)

    try:
        await asyncio.to_thread(check)
    except Exception:  # noqa: BLE001
        await ws.close(code=4403)
        return

    await ws.accept()
    await hub.join(group_id, ws)
    try:
        while True:
            await ws.receive_text()  # クライアントからは ping だけ
    except WebSocketDisconnect:
        pass
    finally:
        hub.leave(group_id, ws)
