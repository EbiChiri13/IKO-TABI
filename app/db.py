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
    """ハッシュタグと行き先データを入れる。すでに入っていれば何もしない。"""
    with tx() as conn:
        if conn.execute("SELECT count(*) AS n FROM hashtag_categories").fetchone()["n"] == 0:
            for ci, cat in enumerate(CATEGORIES):
                cat_id = conn.execute(
                    "INSERT INTO hashtag_categories (key, label, sort) VALUES (%s, %s, %s) RETURNING id",
                    (cat["key"], cat["label"], ci),
                ).fetchone()["id"]
                for ti, (label, kind, value) in enumerate(cat["tags"]):
                    conn.execute(
                        "INSERT INTO hashtags (category_id, label, kind, value, sort) VALUES (%s, %s, %s, %s, %s)",
                        (cat_id, label, kind, value, ti),
                    )

        if conn.execute("SELECT count(*) AS n FROM destinations").fetchone()["n"] == 0:
            for d in DESTINATIONS:
                dest_id = conn.execute(
                    """INSERT INTO destinations (prefecture, area, region, near, band, description, tags)
                       VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                    (d["prefecture"], d["area"], d["region"], d["near"], d["band"], d["description"], d["tags"]),
                ).fetchone()["id"]
                for p in d["places"]:
                    conn.execute(
                        """INSERT INTO places (destination_id, type, name, tags, price, ticket)
                           VALUES (%s, %s, %s, %s, %s, %s)""",
                        (dest_id, p["type"], p["name"], p["tags"], p["price"], p["ticket"]),
                    )
