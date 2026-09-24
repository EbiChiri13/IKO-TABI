"""PostgreSQL への接続（psycopg）。WebSocket ではなく通常の DB 接続を使う【Q12】。"""

import os
from contextlib import contextmanager
from pathlib import Path

from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from app.data.destinations import DESTINATIONS
from app.data.hashtags import CATEGORIES

_pool: ConnectionPool | None = None


def init_pool(url: str | None = None) -> None:
    global _pool
    url = url or os.environ.get("DATABASE_URL", "postgresql://ikotabi:ikotabi@localhost:5432/ikotabi")
    _pool = ConnectionPool(url, min_size=1, max_size=10, kwargs={"row_factory": dict_row}, open=True)
    _pool.wait()


def close_pool() -> None:
    global _pool
    if _pool is not None:
        _pool.close()
        _pool = None


@contextmanager
def tx():
    """1リクエスト分のトランザクション。with を抜けるとコミット、例外ならロールバック。"""
    assert _pool is not None, "init_pool() を先に呼ぶ"
    with _pool.connection() as conn:
        with conn.transaction():
            yield conn


def create_schema() -> None:
    sql = (Path(__file__).parent / "schema.sql").read_text(encoding="utf-8")
    with tx() as conn:
        conn.execute(sql)


def seed() -> None:
    """ハッシュタグと行き先データを入れる。すでに入っていれば何もしない。

    リモートのDB（Railway等）はネットワーク越しになるため、1行ずつ INSERT すると
    往復のたびに遅延が積み重なる。まとめて executemany で送ることで、
    起動時間を大きく縮める（デプロイ先のヘルスチェック・タイムアウト対策）。
    """
    with tx() as conn:
        if conn.execute("SELECT count(*) AS n FROM hashtag_categories").fetchone()["n"] == 0:
            hashtag_rows = []
            with conn.cursor() as cur:
                for ci, cat in enumerate(CATEGORIES):
                    cat_id = cur.execute(
                        "INSERT INTO hashtag_categories (key, label, sort) VALUES (%s, %s, %s) RETURNING id",
                        (cat["key"], cat["label"], ci),
                    ).fetchone()["id"]
                    hashtag_rows += [
                        (cat_id, label, kind, value, ti) for ti, (label, kind, value) in enumerate(cat["tags"])
                    ]
                cur.executemany(
                    "INSERT INTO hashtags (category_id, label, kind, value, sort) VALUES (%s, %s, %s, %s, %s)",
                    hashtag_rows,
                )

        if conn.execute("SELECT count(*) AS n FROM destinations").fetchone()["n"] == 0:
            place_rows = []
            with conn.cursor() as cur:
                for d in DESTINATIONS:
                    dest_id = cur.execute(
                        """INSERT INTO destinations (prefecture, area, region, near, band, description, tags)
                           VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                        (d["prefecture"], d["area"], d["region"], d["near"], d["band"], d["description"], d["tags"]),
                    ).fetchone()["id"]
                    place_rows += [
                        (dest_id, p["type"], p["name"], p["tags"], p["price"], p["ticket"]) for p in d["places"]
                    ]
                cur.executemany(
                    """INSERT INTO places (destination_id, type, name, tags, price, ticket)
                       VALUES (%s, %s, %s, %s, %s, %s)""",
                    place_rows,
                )


def backfill_destination_images() -> None:
    """まだ写真の無い行き先に、Wikipediaの都道府県写真を1回だけ取ってきて保存する。

    宿・ごはん・スポットは架空の名前なので対象外（ダミー画像のまま）。
    既に image_url が入っている行はスキップするので、再起動のたびに叩き直すことはない。
    起動を遅くしないよう、47件でも数秒で終わるように並列で取得する。
    """
    from concurrent.futures import ThreadPoolExecutor

    from app.wikipedia_images import fetch_thumbnail

    with tx() as conn:
        rows = conn.execute(
            "SELECT id, prefecture FROM destinations WHERE image_url IS NULL"
        ).fetchall()
        if not rows:
            return
        with ThreadPoolExecutor(max_workers=5) as pool:
            urls = list(pool.map(lambda r: fetch_thumbnail(r["prefecture"]), rows))
        with conn.cursor() as cur:
            for r, url in zip(rows, urls):
                if url:
                    cur.execute("UPDATE destinations SET image_url = %s WHERE id = %s", (url, r["id"]))
