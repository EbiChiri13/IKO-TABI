"""画面の操作ごとの処理。各関数は1つのトランザクション（conn）の中で呼ぶ。

戻り値の events は、コミット後に WebSocket で知らせる「何が変わったか」（members / answers / votes / status）。
個人のタグは events に入れない【Q16】。
"""

import hashlib
import re
import secrets
from datetime import date

from fastapi import HTTPException

from app.data.hashtags import CATEGORIES
from app.decide import PICK_COUNT, VOTE_LIMIT, choose
from app.engine import Engine
from app.matching import MemberPrefs, is_matched, rank, rank_destinations
from app.reason import reason_text

TARGETS = ["destination", "lodging", "food", "spot"]


def placeholder_image(target_type: str, target_id: int) -> str:
    """写真素材がまだ無いので、IDから決まるダミー画像を返す（同じ候補なら毎回同じ画像になる）。"""
    return f"https://picsum.photos/seed/ikotabi-{target_type}-{target_id}/640/480"


NEXT_STATUS = {"destination": "lodging", "lodging": "food", "food": "spot", "spot": "done"}
MIN_MEMBERS_TO_START = 2

engine: Engine | None = None  # main.py の起動時に入れる


def new_token() -> str:
    return secrets.token_urlsafe(24)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _fail(status: int, message: str):
    raise HTTPException(status_code=status, detail=message)


# ───────── アカウント（メール＋パスワード） ─────────

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_PBKDF2_ITERATIONS = 200_000


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), _PBKDF2_ITERATIONS).hex()
    return f"{salt}${digest}"


def verify_password(password: str, stored: str) -> bool:
    salt, _, digest = stored.partition("$")
    if not digest:
        return False
    check = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), _PBKDF2_ITERATIONS).hex()
    return secrets.compare_digest(check, digest)


def register_user(conn, display_name: str, email: str, password: str) -> dict:
    email = email.strip().lower()
    if not _EMAIL_RE.match(email):
        _fail(400, "メールアドレスの形式が正しくありません")
    if len(password) < 8:
        _fail(400, "パスワードは8文字以上にしてください")
    if conn.execute("SELECT id FROM users WHERE email = %s", (email,)).fetchone():
        _fail(409, "このメールアドレスは既に登録されています")
    token = new_token()
    conn.execute(
        "INSERT INTO users (display_name, email, password_hash, token_hash) VALUES (%s, %s, %s, %s)",
        (display_name, email, hash_password(password), hash_token(token)),
    )
    return {"token": token, "display_name": display_name}


def login_user(conn, email: str, password: str) -> dict:
    email = email.strip().lower()
    user = conn.execute("SELECT * FROM users WHERE email = %s", (email,)).fetchone()
    if user is None or not verify_password(password, user["password_hash"]):
        _fail(401, "メールアドレスまたはパスワードが違います")
    token = new_token()
    conn.execute("UPDATE users SET token_hash = %s WHERE id = %s", (hash_token(token), user["id"]))
    return {"token": token, "display_name": user["display_name"]}


def auth_user(conn, token: str | None) -> dict:
    if not token:
        _fail(401, "ログインしていません")
    user = conn.execute("SELECT * FROM users WHERE token_hash = %s", (hash_token(token),)).fetchone()
    if user is None:
        _fail(403, "ログインしていません")
    return user


# ───────── 本人確認・権限 ─────────


def auth_member(conn, group_id: str, token: str | None) -> dict:
    """グループのメンバー以外はグループの情報を見られない。"""
    if not token:
        _fail(401, "このグループに参加していません")
    member = conn.execute(
        "SELECT * FROM group_members WHERE token_hash = %s AND group_id = %s",
        (hash_token(token), group_id),
    ).fetchone()
    if member is None:
        _fail(403, "このグループに参加していません")
    return member


def _require_host(member: dict) -> None:
    if member["role"] != "host":
        _fail(403, "幹事だけができる操作です")


def _lock_group(conn, group_id: str) -> dict:
    """同じグループへの同時操作（最後の2人が同時に投票など）を1つずつ処理する。"""
    group = conn.execute("SELECT * FROM groups WHERE id = %s FOR UPDATE", (group_id,)).fetchone()
    if group is None:
        _fail(404, "グループが見つかりません")
    return group


# ───────── グループ・招待 ─────────


def create_group(conn, name: str, start: date, end: date, member_limit: int, nickname: str) -> dict:
    if end < start:
        _fail(400, "帰る日は出発日より後にしてください")
    group_id = secrets.token_urlsafe(9)
    conn.execute(
        "INSERT INTO groups (id, name, start_date, end_date, member_limit) VALUES (%s, %s, %s, %s, %s)",
        (group_id, name, start, end, member_limit),
    )
    token = new_token()
    conn.execute(
        "INSERT INTO group_members (group_id, nickname, role, token_hash) VALUES (%s, %s, 'host', %s)",
        (group_id, nickname, hash_token(token)),
    )
    return {"group_id": group_id, "token": token}


def _counts(conn, group_id: str) -> dict:
    return conn.execute(
        """SELECT
             (SELECT count(*) FROM group_members WHERE group_id = %(g)s) AS members,
             (SELECT count(*) FROM group_members WHERE group_id = %(g)s AND answered_at IS NOT NULL) AS answered,
             (SELECT count(*) FROM invites WHERE group_id = %(g)s AND used_at IS NULL) AS open_invites""",
        {"g": group_id},
    ).fetchone()


def create_invite(conn, group_id: str, member: dict) -> dict:
    """グループにつき1本の招待リンクを作る。人数分だけ何度でも使い回せる（誰ごとにもリンクは変わらない）。"""
    _require_host(member)
    group = _lock_group(conn, group_id)
    if group["status"] != "collecting":
        _fail(409, "行き先選びが始まったので、もう招待できません")
    n = _counts(conn, group_id)
    if n["members"] >= group["member_limit"]:
        _fail(409, "定員に達しています")
    token = new_token()
    conn.execute("INSERT INTO invites (group_id, token_hash) VALUES (%s, %s)", (group_id, hash_token(token)))
    return {"token": token}


def revoke_open_invites(conn, group_id: str, member: dict) -> dict:
    """送ったけれど使われていないリンクを無効にして、定員の枠を空ける。"""
    _require_host(member)
    _lock_group(conn, group_id)
    n = conn.execute("DELETE FROM invites WHERE group_id = %s AND used_at IS NULL", (group_id,)).rowcount
    return {"revoked": n}


def _invite_row(conn, token: str, lock: bool = False) -> dict:
    row = conn.execute(
        "SELECT * FROM invites WHERE token_hash = %s" + (" FOR UPDATE" if lock else ""),
        (hash_token(token),),
    ).fetchone()
    if row is None:
        _fail(404, "この招待リンクは使えません")
    return row


def get_invite(conn, token: str) -> dict:
    inv = _invite_row(conn, token)
    group = conn.execute("SELECT * FROM groups WHERE id = %s", (inv["group_id"],)).fetchone()
    n = _counts(conn, group["id"])
    usable = group["status"] == "collecting" and n["members"] < group["member_limit"]
    return {
        "group_name": group["name"],
        "start_date": group["start_date"].isoformat(),
        "end_date": group["end_date"].isoformat(),
        "members": n["members"],
        "member_limit": group["member_limit"],
        "usable": usable,
    }


def join(conn, token: str, nickname: str) -> tuple[dict, list[str]]:
    """招待リンクは1グループにつき1本で、全員が同じリンクから参加する（定員に達するまで何度でも使える）。"""
    inv = _invite_row(conn, token, lock=True)
    group = _lock_group(conn, inv["group_id"])
    if group["status"] != "collecting":
        _fail(409, "行き先選びが始まったので、もう参加できません")
    if _counts(conn, group["id"])["members"] >= group["member_limit"]:
        _fail(409, "定員に達しています")
    member_token = new_token()
    member_id = conn.execute(
        """INSERT INTO group_members (group_id, nickname, role, token_hash)
           VALUES (%s, %s, 'member', %s) RETURNING id""",
        (group["id"], nickname, hash_token(member_token)),
    ).fetchone()["id"]
    conn.execute("UPDATE invites SET used_at = now(), used_by = %s WHERE id = %s", (member_id, inv["id"]))
    return {"group_id": group["id"], "token": member_token, "group_name": group["name"]}, ["members"]


def group_view(conn, group_id: str, me: dict) -> dict:
    group = conn.execute("SELECT * FROM groups WHERE id = %s", (group_id,)).fetchone()
    members = conn.execute("SELECT * FROM group_members WHERE group_id = %s ORDER BY id", (group_id,)).fetchall()
    shared = _shared_tags(conn, group_id)
    n = _counts(conn, group_id)

    voted = None
    if group["status"] in TARGETS:
        voted = conn.execute(
            "SELECT count(DISTINCT member_id) AS n FROM votes WHERE group_id = %s AND target_type = %s",
            (group_id, group["status"]),
        ).fetchone()["n"]

    return {
        "id": group["id"],
        "name": group["name"],
        "start_date": group["start_date"].isoformat(),
        "end_date": group["end_date"].isoformat(),
        "member_limit": group["member_limit"],
        "status": group["status"],
        "me": {
            "id": me["id"],
            "nickname": me["nickname"],
            "role": me["role"],
            "share_answers": me["share_answers"],
            "answered": me["answered_at"] is not None,
        },
        "members": [
            {
                "id": m["id"],
                "nickname": m["nickname"],
                "role": m["role"],
                "answered": m["answered_at"] is not None,
                "is_me": m["id"] == me["id"],
                # 本人が公開を選んだときだけタグを返す【Q16】
                "tags": shared.get(m["id"]) if m["share_answers"] else None,
            }
            for m in members
        ],
        "answered_count": n["answered"],
        "open_invites": n["open_invites"] if me["role"] == "host" else None,
        "voted_count": voted,
        "min_to_start": MIN_MEMBERS_TO_START,
    }


def _shared_tags(conn, group_id: str) -> dict[int, list[str]]:
    rows = conn.execute(
        """SELECT s.member_id, h.label
           FROM user_hashtag_selections s
           JOIN group_members m ON m.id = s.member_id AND m.share_answers
           JOIN hashtags h ON h.id = s.hashtag_id
           JOIN hashtag_categories c ON c.id = h.category_id
           WHERE s.group_id = %s ORDER BY c.sort, h.sort""",
        (group_id,),
    ).fetchall()
    out: dict[int, list[str]] = {}
    for r in rows:
        out.setdefault(r["member_id"], []).append(r["label"])
    return out


# ───────── ハッシュタグ ─────────


def list_tags(conn) -> list[dict]:
    cats = conn.execute("SELECT * FROM hashtag_categories ORDER BY sort").fetchall()
    tags = conn.execute("SELECT * FROM hashtags ORDER BY category_id, sort").fetchall()
    return [
        {
            "key": c["key"],
            "label": c["label"],
            "tags": [
                {"id": t["id"], "label": t["label"], "kind": t["kind"]} for t in tags if t["category_id"] == c["id"]
            ],
        }
        for c in cats
    ]


def tag_summary(conn, group_id: str) -> dict:
    """カテゴリごとの集計（投票結果画面）。誰が選んだかは出さず、件数だけを見せる【Q16】。"""
    rows = conn.execute(
        """SELECT c.key, c.label AS category_label, h.label AS tag_label, count(*) AS n
           FROM user_hashtag_selections s
           JOIN hashtags h ON h.id = s.hashtag_id
           JOIN hashtag_categories c ON c.id = h.category_id
           JOIN group_members m ON m.id = s.member_id AND m.answered_at IS NOT NULL
           WHERE s.group_id = %s
           GROUP BY c.sort, c.key, c.label, h.sort, h.label
           ORDER BY c.sort, n DESC, h.sort""",
        (group_id,),
    ).fetchall()
    answered = conn.execute(
        "SELECT count(*) AS n FROM group_members WHERE group_id = %s AND answered_at IS NOT NULL", (group_id,)
    ).fetchone()["n"]

    categories: dict[str, dict] = {}
    for r in rows:
        cat = categories.setdefault(r["key"], {"key": r["key"], "label": r["category_label"], "tags": []})
        cat["tags"].append({"label": r["tag_label"], "count": r["n"]})
    return {"member_count": answered, "categories": list(categories.values())}


def get_my_selections(conn, member: dict) -> dict:
    rows = conn.execute("SELECT hashtag_id FROM user_hashtag_selections WHERE member_id = %s", (member["id"],))
    return {
        "tag_ids": [r["hashtag_id"] for r in rows],
        "share_answers": member["share_answers"],
        "must_have_tag_id": member["must_have_hashtag_id"],
    }


def save_my_selections(conn, group_id: str, member: dict, tag_ids: list[int], share: bool) -> dict:
    """ハッシュタグ選定画面の保存。この時点ではまだ「回答済み」にしない
    （次の「お気に入り選定」で譲れないタグを1つ選んでもらってから確定する）。
    """
    group = _lock_group(conn, group_id)
    if group["status"] != "collecting":
        _fail(409, "行き先選びが始まったので、希望はもう変えられません")

    tag_ids = sorted(set(tag_ids))
    rows = conn.execute(
        """SELECT h.id, c.key FROM hashtags h JOIN hashtag_categories c ON c.id = h.category_id
           WHERE h.id = ANY(%s)""",
        (tag_ids,),
    ).fetchall()
    if len(rows) != len(tag_ids):
        _fail(400, "存在しないタグが含まれています")
    missing = [c["label"] for c in CATEGORIES if c["key"] not in {r["key"] for r in rows}]
    if missing:
        _fail(400, "それぞれの質問で1つ以上選んでください：" + "、".join(missing))

    conn.execute("DELETE FROM user_hashtag_selections WHERE member_id = %s", (member["id"],))
    with conn.cursor() as cur:
        cur.executemany(
            "INSERT INTO user_hashtag_selections (group_id, member_id, hashtag_id) VALUES (%s, %s, %s)",
            [(group_id, member["id"], t) for t in tag_ids],
        )
    # タグを選び直したら「譲れないこと」も選び直してもらう
    conn.execute(
        "UPDATE group_members SET share_answers = %s, must_have_hashtag_id = NULL, answered_at = NULL WHERE id = %s",
        (share, member["id"]),
    )
    return {}


def save_must_have(conn, group_id: str, member: dict, tag_id: int) -> tuple[dict, list[str]]:
    """「お気に入り選定」画面。選んだタグの中から1つを「譲れないこと」として確定し、回答済みにする。"""
    group = _lock_group(conn, group_id)
    if group["status"] != "collecting":
        _fail(409, "行き先選びが始まったので、希望はもう変えられません")

    mine = {
        r["hashtag_id"]
        for r in conn.execute("SELECT hashtag_id FROM user_hashtag_selections WHERE member_id = %s", (member["id"],))
    }
    if tag_id not in mine:
        _fail(400, "自分が選んだタグの中から選んでください")

    conn.execute(
        "UPDATE group_members SET must_have_hashtag_id = %s, answered_at = now() WHERE id = %s",
        (tag_id, member["id"]),
    )

    events = ["answers"]
    # 定員がそろって全員が回答したら、自動で行き先候補を出す【Q8】
    n = _counts(conn, group_id)
    if n["members"] == group["member_limit"] and n["answered"] == n["members"]:
        _start_destination(conn, group_id)
        events.append("status")
    return {"started": "status" in events}, events


# ───────── マッチング ─────────


def _prefs(conn, group_id: str) -> list[MemberPrefs]:
    rows = conn.execute(
        """SELECT m.id AS member_id, c.key, h.label, h.kind, h.value
           FROM group_members m
           JOIN user_hashtag_selections s ON s.member_id = m.id
           JOIN hashtags h ON h.id = s.hashtag_id
           JOIN hashtag_categories c ON c.id = h.category_id
           WHERE m.group_id = %s AND m.answered_at IS NOT NULL
           ORDER BY m.id""",
        (group_id,),
    ).fetchall()
    prefs: dict[int, MemberPrefs] = {}
    for r in rows:
        p = prefs.setdefault(r["member_id"], MemberPrefs(r["member_id"], {}))
        if r["kind"] == "budget":
            p.budgets.add(int(r["value"]))
        elif r["kind"] == "region":
            p.regions.add(r["value"])
        else:
            p.semantic.setdefault(r["key"], []).append(r["label"])

    must_haves = conn.execute(
        """SELECT m.id AS member_id, h.label
           FROM group_members m JOIN hashtags h ON h.id = m.must_have_hashtag_id
           WHERE m.group_id = %s AND m.answered_at IS NOT NULL""",
        (group_id,),
    ).fetchall()
    for r in must_haves:
        if r["member_id"] in prefs:
            prefs[r["member_id"]].must_have = r["label"]

    return list(prefs.values())


def _save_results(conn, group_id: str, target_type: str, ranked, members, relaxed: bool) -> None:
    conn.execute("DELETE FROM matching_results WHERE group_id = %s AND target_type = %s", (group_id, target_type))
    for i, r in enumerate(ranked, start=1):
        c = r.candidate
        if target_type == "destination":
            d = engine.destinations[c.id]
            text = reason_text(r, members, d["area"], d["description"], engine.sim)
        else:
            p = engine.places[c.id]
            detail = f"1人あたり{p['price']:,}円が目安です。" if p["price"] else "無料で楽しめます。"
            text = reason_text(r, members, p["name"], detail, engine.sim)
        conn.execute(
            """INSERT INTO matching_results
               (group_id, target_type, target_id, rank, score, matched_count, member_count, relaxed, reason_text)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (group_id, target_type, c.id, i, r.score, r.matched_count, len(members), relaxed, text),
        )


def _start_destination(conn, group_id: str) -> None:
    members = _prefs(conn, group_id)
    ranked, relaxed = rank_destinations(engine.destination_candidates(), members, engine.sim, n=3)
    _save_results(conn, group_id, "destination", ranked, members, relaxed)
    conn.execute("UPDATE groups SET status = 'destination' WHERE id = %s", (group_id,))


def _start_places(conn, group_id: str, destination_id: int) -> None:
    """行き先が決まったら、その中の宿・ごはん・スポットを並べる【Q7】。"""
    members = _prefs(conn, group_id)
    for t in ("lodging", "food", "spot"):
        ranked = rank(engine.place_candidates(destination_id, t), members, engine.sim)
        _save_results(conn, group_id, t, ranked, members, False)


def start(conn, group_id: str, member: dict) -> list[str]:
    """幹事は2人以上が回答した時点で先に進められる【Q8】。"""
    _require_host(member)
    group = _lock_group(conn, group_id)
    if group["status"] != "collecting":
        _fail(409, "行き先選びはもう始まっています")
    if _counts(conn, group_id)["answered"] < MIN_MEMBERS_TO_START:
        _fail(409, f"{MIN_MEMBERS_TO_START}人以上が回答すると行き先を探せます")
    _start_destination(conn, group_id)
    # 招待したけれど間に合わなかったリンクは使えなくする
    conn.execute("DELETE FROM invites WHERE group_id = %s AND used_at IS NULL", (group_id,))
    return ["status"]


# ───────── 候補・投票・決定 ─────────


def candidates(conn, group_id: str, member: dict, target_type: str) -> dict:
    if target_type not in TARGETS:
        _fail(400, "type は destination / lodging / food / spot のどれかです")
    group = conn.execute("SELECT * FROM groups WHERE id = %s", (group_id,)).fetchone()
    rows = conn.execute(
        """SELECT r.*,
             (SELECT count(*) FROM votes v WHERE v.group_id = r.group_id
                AND v.target_type = r.target_type AND v.target_id = r.target_id) AS votes,
             EXISTS (SELECT 1 FROM votes v WHERE v.member_id = %s
                AND v.target_type = r.target_type AND v.target_id = r.target_id) AS my_vote,
             EXISTS (SELECT 1 FROM decisions d WHERE d.group_id = r.group_id
                AND d.target_type = r.target_type AND d.target_id = r.target_id) AS decided
           FROM matching_results r
           WHERE r.group_id = %s AND r.target_type = %s ORDER BY r.rank""",
        (member["id"], group_id, target_type),
    ).fetchall()
    total = conn.execute("SELECT count(*) AS n FROM group_members WHERE group_id = %s", (group_id,)).fetchone()["n"]
    voted = conn.execute(
        "SELECT count(DISTINCT member_id) AS n FROM votes WHERE group_id = %s AND target_type = %s",
        (group_id, target_type),
    ).fetchone()["n"]

    items = []
    for r in rows:
        item = {
            "id": r["target_id"],
            "rank": r["rank"],
            "match": round(r["score"] * 100),
            "matched_count": r["matched_count"],
            "member_count": r["member_count"],
            "reason": r["reason_text"],
            "votes": r["votes"],
            "my_vote": r["my_vote"],
            "decided": r["decided"],
        }
        if target_type == "destination":
            d = engine.destinations[r["target_id"]]
            item.update(
                name=d["prefecture"],
                area=d["area"],
                region=d["region"],
                description=d["description"],
                tags=d["tags"],
                image=d["image_url"] or placeholder_image(target_type, r["target_id"]),
            )
        else:
            p = engine.places[r["target_id"]]
            item.update(
                name=p["name"],
                tags=p["tags"],
                price=p["price"],
                ticket=p["ticket"],
                image=placeholder_image(target_type, r["target_id"]),
            )
        items.append(item)

    return {
        "type": target_type,
        "open": group["status"] == target_type,
        "relaxed": bool(rows) and rows[0]["relaxed"],
        "vote_limit": VOTE_LIMIT[target_type],
        "pick_count": PICK_COUNT[target_type],
        "voted_count": voted,
        "member_total": total,
        "items": items,
    }


def vote(conn, group_id: str, member: dict, target_type: str, target_ids: list[int]) -> list[str]:
    group = _lock_group(conn, group_id)
    if group["status"] != target_type:
        _fail(409, "いまはこの項目の投票はできません")
    target_ids = sorted(set(target_ids))
    if not 1 <= len(target_ids) <= VOTE_LIMIT[target_type]:
        _fail(400, f"1〜{VOTE_LIMIT[target_type]}つ選んで投票してください")
    valid = {
        r["target_id"]
        for r in conn.execute(
            "SELECT target_id FROM matching_results WHERE group_id = %s AND target_type = %s",
            (group_id, target_type),
        )
    }
    if not set(target_ids) <= valid:
        _fail(400, "候補にないものには投票できません")

    conn.execute("DELETE FROM votes WHERE member_id = %s AND target_type = %s", (member["id"], target_type))
    with conn.cursor() as cur:
        cur.executemany(
            "INSERT INTO votes (group_id, member_id, target_type, target_id) VALUES (%s, %s, %s, %s)",
            [(group_id, member["id"], target_type, t) for t in target_ids],
        )

    events = ["votes"]
    total = conn.execute("SELECT count(*) AS n FROM group_members WHERE group_id = %s", (group_id,)).fetchone()["n"]
    voted = conn.execute(
        "SELECT count(DISTINCT member_id) AS n FROM votes WHERE group_id = %s AND target_type = %s",
        (group_id, target_type),
    ).fetchone()["n"]
    if voted >= total:  # 全員が投票すると自動で決まる【Q2】
        _decide(conn, group_id, target_type)
        events.append("status")
    return events


def decide(conn, group_id: str, member: dict) -> list[str]:
    """幹事はいつでも今の投票で締め切れる。"""
    _require_host(member)
    group = _lock_group(conn, group_id)
    if group["status"] not in TARGETS:
        _fail(409, "いまは締め切るものがありません")
    _decide(conn, group_id, group["status"])
    return ["status"]


def _decide(conn, group_id: str, target_type: str) -> None:
    scores = {
        r["target_id"]: r["score"]
        for r in conn.execute(
            "SELECT target_id, score FROM matching_results WHERE group_id = %s AND target_type = %s",
            (group_id, target_type),
        )
    }
    votes: dict[int, set[int]] = {}
    for r in conn.execute(
        "SELECT member_id, target_id FROM votes WHERE group_id = %s AND target_type = %s",
        (group_id, target_type),
    ):
        votes.setdefault(r["member_id"], set()).add(r["target_id"])

    chosen = choose(votes, scores, PICK_COUNT[target_type])
    conn.execute("DELETE FROM decisions WHERE group_id = %s AND target_type = %s", (group_id, target_type))
    for t in chosen:
        conn.execute(
            "INSERT INTO decisions (group_id, target_type, target_id) VALUES (%s, %s, %s)",
            (group_id, target_type, t),
        )
    if target_type == "destination":
        _start_places(conn, group_id, chosen[0])
    conn.execute("UPDATE groups SET status = %s WHERE id = %s", (NEXT_STATUS[target_type], group_id))


# ───────── 決定まとめ ─────────


def summary(conn, group_id: str) -> dict:
    group = conn.execute("SELECT * FROM groups WHERE id = %s", (group_id,)).fetchone()
    decided: dict[str, list[int]] = {t: [] for t in TARGETS}
    for r in conn.execute(
        """SELECT d.target_type, d.target_id FROM decisions d
           LEFT JOIN matching_results r ON r.group_id = d.group_id
             AND r.target_type = d.target_type AND r.target_id = d.target_id
           WHERE d.group_id = %s ORDER BY r.rank""",
        (group_id,),
    ):
        decided[r["target_type"]].append(r["target_id"])

    def place(pid: int) -> dict:
        p = engine.places[pid]
        return {
            "id": pid,
            "name": p["name"],
            "tags": p["tags"],
            "price": p["price"],
            "ticket": p["ticket"],
            "image": placeholder_image(p["type"], pid),
        }

    dest = None
    if decided["destination"]:
        d = engine.destinations[decided["destination"][0]]
        dest = {
            "id": d["id"],
            "name": d["prefecture"],
            "area": d["area"],
            "description": d["description"],
            "image": d["image_url"] or placeholder_image("destination", d["id"]),
        }

    # メンバーごとに、かなった希望の数を数える【Q2】
    members = conn.execute("SELECT * FROM group_members WHERE group_id = %s ORDER BY id", (group_id,)).fetchall()
    my_votes: dict[int, dict[str, set[int]]] = {}
    for r in conn.execute("SELECT member_id, target_type, target_id FROM votes WHERE group_id = %s", (group_id,)):
        my_votes.setdefault(r["member_id"], {}).setdefault(r["target_type"], set()).add(r["target_id"])
    prefs = {p.member_id: p for p in _prefs(conn, group_id)}

    results = []
    for m in members:
        v = my_votes.get(m["id"], {})
        dest_ok = False
        if dest:
            voted_it = dest["id"] in v.get("destination", set())
            p = prefs.get(m["id"])
            dest_ok = voted_it or (p is not None and is_matched(p, engine.candidates[("destination", dest["id"])]))
        detail = {
            "destination": int(dest_ok),
            "lodging": len(set(decided["lodging"]) & v.get("lodging", set())),
            "food": len(set(decided["food"]) & v.get("food", set())),
            "spot": len(set(decided["spot"]) & v.get("spot", set())),
        }
        results.append({"nickname": m["nickname"], "wins": sum(detail.values()), "detail": detail})

    return {
        "name": group["name"],
        "start_date": group["start_date"].isoformat(),
        "end_date": group["end_date"].isoformat(),
        "status": group["status"],
        "destination": dest,
        "lodging": [place(i) for i in decided["lodging"]],
        "food": [place(i) for i in decided["food"]],
        "spot": [place(i) for i in decided["spot"]],
        "members": results,
    }
