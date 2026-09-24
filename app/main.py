"""いこたび サーバー（FastAPI）。API は仕様書B 8章。

起動: uvicorn app.main:app --reload
"""

import asyncio
import logging
import os
from contextlib import asynccontextmanager
from datetime import date
from pathlib import Path
from typing import Annotated, Literal

from dotenv import load_dotenv
from fastapi import FastAPI, Header, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, StringConstraints

from app import db, service
from app.embedding import Embedder
from app.engine import Engine
from app.realtime import hub

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")

STATIC = Path(__file__).resolve().parent.parent / "static"


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_pool()
    db.create_schema()
    db.seed()
    await asyncio.to_thread(db.backfill_destination_images)
    embedder = await asyncio.to_thread(Embedder, os.environ.get("BERT_MODEL", "sonoisa/sentence-bert-base-ja-mean-tokens-v2"))
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
TargetType = Literal["destination", "lodging", "food", "spot"]


class GroupIn(BaseModel):
    name: Name
    start_date: date
    end_date: date
    member_limit: int = Field(ge=2, le=4)
    nickname: Name


class JoinIn(BaseModel):
    nickname: Name


class SelectionsIn(BaseModel):
    tag_ids: list[int] = Field(max_length=65)
    share_answers: bool = False


class MustHaveIn(BaseModel):
    tag_id: int


class VoteIn(BaseModel):
    type: TargetType
    target_ids: list[int] = Field(max_length=3)


# ───────── REST ─────────

@app.post("/api/groups")
def create_group(body: GroupIn):
    with db.tx() as conn:
        return service.create_group(conn, body.name, body.start_date, body.end_date, body.member_limit, body.nickname)


@app.get("/api/groups/{group_id}")
def get_group(group_id: str, token: Token = None):
    with db.tx() as conn:
        me = service.auth_member(conn, group_id, token)
        return service.group_view(conn, group_id, me)


@app.post("/api/groups/{group_id}/invites")
def create_invite(group_id: str, token: Token = None):
    with db.tx() as conn:
        me = service.auth_member(conn, group_id, token)
        return service.create_invite(conn, group_id, me)


@app.delete("/api/groups/{group_id}/invites")
def revoke_invites(group_id: str, token: Token = None):
    with db.tx() as conn:
        me = service.auth_member(conn, group_id, token)
        return service.revoke_open_invites(conn, group_id, me)


@app.get("/api/invites/{invite_token}")
def get_invite(invite_token: str):
    with db.tx() as conn:
        return service.get_invite(conn, invite_token)


@app.post("/api/invites/{invite_token}/join")
def join(invite_token: str, body: JoinIn):
    with db.tx() as conn:
        result, events = service.join(conn, invite_token, body.nickname)
    hub.notify(result["group_id"], events)
    return result


@app.get("/api/tags")
def tags():
    with db.tx() as conn:
        return service.list_tags(conn)


@app.get("/api/groups/{group_id}/tag-summary")
def tag_summary(group_id: str, token: Token = None):
    """投票結果画面：カテゴリごとにどのタグが何人に選ばれたかの集計。"""
    with db.tx() as conn:
        service.auth_member(conn, group_id, token)
        return service.tag_summary(conn, group_id)


@app.get("/api/groups/{group_id}/selections/me")
def get_selections(group_id: str, token: Token = None):
    with db.tx() as conn:
        me = service.auth_member(conn, group_id, token)
        return service.get_my_selections(conn, me)


@app.put("/api/groups/{group_id}/selections/me")
def put_selections(group_id: str, body: SelectionsIn, token: Token = None):
    with db.tx() as conn:
        me = service.auth_member(conn, group_id, token)
        result = service.save_my_selections(conn, group_id, me, body.tag_ids, body.share_answers)
    hub.notify(group_id, ["answers"])
    return result


@app.put("/api/groups/{group_id}/selections/me/must-have")
def put_must_have(group_id: str, body: MustHaveIn, token: Token = None):
    """お気に入り選定：選んだタグの中から「今回の旅行で譲れないこと」を1つ確定する。"""
    with db.tx() as conn:
        me = service.auth_member(conn, group_id, token)
        result, events = service.save_must_have(conn, group_id, me, body.tag_id)
    hub.notify(group_id, events)
    return result


@app.post("/api/groups/{group_id}/start")
def start(group_id: str, token: Token = None):
    with db.tx() as conn:
        me = service.auth_member(conn, group_id, token)
        events = service.start(conn, group_id, me)
    hub.notify(group_id, events)
    return {"ok": True}


@app.get("/api/groups/{group_id}/candidates")
def candidates(group_id: str, type: TargetType = Query(...), token: Token = None):
    with db.tx() as conn:
        me = service.auth_member(conn, group_id, token)
        return service.candidates(conn, group_id, me, type)


@app.post("/api/groups/{group_id}/votes")
def vote(group_id: str, body: VoteIn, token: Token = None):
    with db.tx() as conn:
        me = service.auth_member(conn, group_id, token)
        events = service.vote(conn, group_id, me, body.type, body.target_ids)
    hub.notify(group_id, events)
    return {"ok": True}


@app.post("/api/groups/{group_id}/decide")
def decide(group_id: str, token: Token = None):
    with db.tx() as conn:
        me = service.auth_member(conn, group_id, token)
        events = service.decide(conn, group_id, me)
    hub.notify(group_id, events)
    return {"ok": True}


@app.get("/api/groups/{group_id}/summary")
def summary(group_id: str, token: Token = None):
    with db.tx() as conn:
        service.auth_member(conn, group_id, token)
        return service.summary(conn, group_id)


@app.get("/api/health")
def health():
    return {"ok": True, "embedding": service.engine.sim.embedder_name if service.engine else None}


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


# ───────── 画面 ─────────

app.mount("/static", StaticFiles(directory=STATIC), name="static")


@app.get("/")
def index():
    return FileResponse(STATIC / "index.html")
