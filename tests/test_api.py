"""API を通しで動かすテストです。PostgreSQL が必要です。

  TEST_DATABASE_URL=postgresql://.../ikotabi_test pytest

テスト用 DB のテーブルは毎回作り直します。BERT は読み込まず簡易類似度で動かします。
共通のクライアントは tests/conftest.py の client フィクスチャで用意します。
"""


def h(token):
    return {"X-Member-Token": token}


def tag_ids(client, labels):
    by_label = {t["label"]: t["id"] for c in client.get("/api/tags").json() for t in c["tags"]}
    return [by_label[label] for label in labels]


def answer(client, gid, tok, labels, share=False, must_have=None):
    """ハッシュタグ選定 → お気に入り選定（譲れないタグ）を1回で済ませるテスト用ヘルパー。"""
    client.put(
        f"/api/groups/{gid}/selections/me",
        headers=h(tok),
        json={"tag_ids": tag_ids(client, labels), "share_answers": share},
    )
    tag_id = tag_ids(client, [must_have or labels[0]])[0]
    return client.put(f"/api/groups/{gid}/selections/me/must-have", headers=h(tok), json={"tag_id": tag_id})


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["ok"] is True and body["db"] is True and body["model"] is True


def test_tags(client):
    cats = client.get("/api/tags").json()
    assert [c["key"] for c in cats] == ["style", "where", "what", "stay"]
    assert sum(len(c["tags"]) for c in cats) == 65


def test_account_register_and_login(client):
    body = {"display_name": "テスター", "email": "tester@example.com", "password": "hunter2222"}
    r = client.post("/api/auth/register", json=body)
    assert r.status_code == 200, r.text
    token = r.json()["token"]
    assert r.json()["display_name"] == "テスター"

    # 同じメールアドレスでは登録できない
    assert client.post("/api/auth/register", json=body).status_code == 409

    # パスワードが短すぎると登録できない
    short = {**body, "email": "short@example.com", "password": "abc"}
    assert client.post("/api/auth/register", json=short).status_code == 422

    me = client.get("/api/auth/me", headers={"X-User-Token": token})
    assert me.status_code == 200 and me.json()["email"] == "tester@example.com"

    # 間違ったパスワードではログインできない
    assert client.post("/api/auth/login", json={"email": "tester@example.com", "password": "wrong"}).status_code == 401

    r2 = client.post("/api/auth/login", json={"email": "tester@example.com", "password": "hunter2222"})
    assert r2.status_code == 200
    assert client.get("/api/auth/me", headers={"X-User-Token": r2.json()["token"]}).status_code == 200
    # ログインし直すと古いトークンは無効になる
    assert client.get("/api/auth/me", headers={"X-User-Token": token}).status_code == 403


def test_full_flow(client):
    r = client.post(
        "/api/groups",
        json={
            "name": "卒業旅行",
            "start_date": "2026-11-01",
            "end_date": "2026-11-02",
            "member_limit": 3,
            "nickname": "えび",
        },
    )
    assert r.status_code == 200, r.text
    gid, host = r.json()["group_id"], r.json()["token"]

    # メンバー以外は見られない
    assert client.get(f"/api/groups/{gid}").status_code == 401
    assert client.get(f"/api/groups/{gid}", headers=h("x")).status_code == 403

    # 招待リンク：グループにつき1本で、定員に達するまで全員が同じリンクから参加できる
    inv = client.post(f"/api/groups/{gid}/invites", headers=h(host)).json()["token"]

    info = client.get(f"/api/invites/{inv}").json()
    assert info["group_name"] == "卒業旅行" and info["usable"] and info["members"] == 1

    a = client.post(f"/api/invites/{inv}/join", json={"nickname": "ちり"}).json()["token"]
    # 幹事以外は招待できない
    assert client.post(f"/api/groups/{gid}/invites", headers=h(a)).status_code == 403
    # 同じリンクのまま、定員に達するまで続けて参加できる
    b = client.post(f"/api/invites/{inv}/join", json={"nickname": "たび"}).json()["token"]
    # 定員（3人）に達すると同じリンクでも参加できない
    assert client.post(f"/api/invites/{inv}/join", json={"nickname": "だれか"}).status_code == 409
    assert client.post(f"/api/groups/{gid}/invites", headers=h(host)).status_code == 409

    # 各質問1つ以上
    bad = client.put(f"/api/groups/{gid}/selections/me", headers=h(host), json={"tag_ids": tag_ids(client, ["温泉"])})
    assert bad.status_code == 400

    prefs = {
        host: (["3〜5万円", "のんびり", "関東", "温泉", "歴史・寺社", "温泉付き"], True),
        a: (["節約", "アクティブ", "近場", "食べ歩き", "夜景", "コスパ重視"], False),
    }
    for tok, (labels, share) in prefs.items():
        r = answer(client, gid, tok, labels, share)
        assert r.status_code == 200 and r.json()["started"] is False

    # お気に入り選定：自分が選んでいないタグは指定できない
    other_tag = tag_ids(client, ["雪遊び"])[0]
    assert (
        client.put(
            f"/api/groups/{gid}/selections/me/must-have", headers=h(host), json={"tag_id": other_tag}
        ).status_code
        == 400
    )

    # 公開を選んだ人のタグだけ見える【Q16】
    view = client.get(f"/api/groups/{gid}", headers=h(b)).json()
    tags_by_name = {m["nickname"]: m["tags"] for m in view["members"]}
    assert "温泉" in tags_by_name["えび"]
    assert tags_by_name["ちり"] is None
    assert view["answered_count"] == 2

    # 最後の1人が回答すると自動で開始【Q8】
    r = answer(client, gid, b, ["6〜8万円", "エモい", "中部", "写真映え", "旅館"])
    assert r.json()["started"] is True
    assert client.get(f"/api/groups/{gid}", headers=h(b)).json()["status"] == "destination"

    dest = client.get(f"/api/groups/{gid}/candidates?type=destination", headers=h(a)).json()
    assert len(dest["items"]) == 3
    for it in dest["items"]:
        assert 0 <= it["match"] <= 100 and it["member_count"] == 3
        assert it["reason"]
        assert "えび" not in it["reason"] and "ちり" not in it["reason"]
    top = dest["items"][0]["id"]

    # 投票：全員が入れたら自動で決まる
    for tok in (host, a):
        assert (
            client.post(
                f"/api/groups/{gid}/votes", headers=h(tok), json={"type": "destination", "target_ids": [top]}
            ).status_code
            == 200
        )
    assert (
        client.post(
            f"/api/groups/{gid}/votes",
            headers=h(b),
            json={"type": "destination", "target_ids": [top, dest["items"][1]["id"]]},
        ).status_code
        == 400
    )
    client.post(f"/api/groups/{gid}/votes", headers=h(b), json={"type": "destination", "target_ids": [top]})
    assert client.get(f"/api/groups/{gid}", headers=h(b)).json()["status"] == "lodging"

    # 宿：幹事が締め切る
    lodging = client.get(f"/api/groups/{gid}/candidates?type=lodging", headers=h(a)).json()
    assert len(lodging["items"]) == 2
    client.post(
        f"/api/groups/{gid}/votes", headers=h(a), json={"type": "lodging", "target_ids": [lodging["items"][1]["id"]]}
    )
    assert client.post(f"/api/groups/{gid}/decide", headers=h(a)).status_code == 403
    assert client.post(f"/api/groups/{gid}/decide", headers=h(host)).status_code == 200

    # ごはん：2人がXとY、1人がZ → Z も必ず入る【Q2】
    food = client.get(f"/api/groups/{gid}/candidates?type=food", headers=h(a)).json()
    x, y, z = [it["id"] for it in food["items"]]
    client.post(f"/api/groups/{gid}/votes", headers=h(host), json={"type": "food", "target_ids": [x, y]})
    client.post(f"/api/groups/{gid}/votes", headers=h(a), json={"type": "food", "target_ids": [x, y]})
    client.post(f"/api/groups/{gid}/votes", headers=h(b), json={"type": "food", "target_ids": [z]})
    food = client.get(f"/api/groups/{gid}/candidates?type=food", headers=h(a)).json()
    chosen = {it["id"] for it in food["items"] if it["decided"]}
    assert len(chosen) == 2 and z in chosen

    spot = client.get(f"/api/groups/{gid}/candidates?type=spot", headers=h(a)).json()
    assert len(spot["items"]) == 4
    ids = [it["id"] for it in spot["items"]]
    for tok in (host, a, b):
        client.post(f"/api/groups/{gid}/votes", headers=h(tok), json={"type": "spot", "target_ids": ids[:3]})

    s = client.get(f"/api/groups/{gid}/summary", headers=h(a)).json()
    assert s["status"] == "done"
    assert s["destination"]["id"] == top
    assert len(s["lodging"]) == 1 and len(s["food"]) == 2 and len(s["spot"]) == 3
    wins = {m["nickname"]: m for m in s["members"]}
    assert wins["たび"]["detail"]["food"] == 1
    assert wins["ちり"]["detail"]["lodging"] == 1
    assert all(m["wins"] >= 1 for m in s["members"])  # 全員の希望が1つはかなう

    # 開始後は参加も回答変更もできない
    assert (
        client.put(
            f"/api/groups/{gid}/selections/me",
            headers=h(a),
            json={"tag_ids": tag_ids(client, ["節約", "近場", "温泉", "旅館"])},
        ).status_code
        == 409
    )


def test_host_can_start_early_and_invites_expire(client):
    r = client.post(
        "/api/groups",
        json={
            "name": "家族旅行",
            "start_date": "2026-12-28",
            "end_date": "2026-12-30",
            "member_limit": 4,
            "nickname": "父",
        },
    ).json()
    gid, host = r["group_id"], r["token"]
    inv = client.post(f"/api/groups/{gid}/invites", headers=h(host)).json()["token"]
    spare = client.post(f"/api/groups/{gid}/invites", headers=h(host)).json()["token"]
    kid = client.post(f"/api/invites/{inv}/join", json={"nickname": "子"}).json()["token"]

    labels = ["沖縄", "のんびり", "マリンスポーツ", "オーシャンビュー"]
    answer(client, gid, host, labels)
    assert client.post(f"/api/groups/{gid}/start", headers=h(host)).status_code == 409  # 1人だけ
    answer(client, gid, kid, labels)
    assert client.post(f"/api/groups/{gid}/start", headers=h(kid)).status_code == 403
    assert client.post(f"/api/groups/{gid}/start", headers=h(host)).status_code == 200

    dest = client.get(f"/api/groups/{gid}/candidates?type=destination", headers=h(kid)).json()
    assert dest["items"][0]["name"] == "沖縄"
    assert dest["relaxed"] is True  # 沖縄だけでは3件に満たない
    assert client.get(f"/api/invites/{spare}").status_code == 404  # 開始時に未使用リンクは無効
