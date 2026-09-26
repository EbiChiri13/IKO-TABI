"""テスト全体で共有する設定です。

PostgreSQL を使うテスト（tests/test_api.py）は、TEST_DATABASE_URL が設定されているときだけ
実行します。未設定の場合はスキップとして報告されます。
"""

import os

import psycopg
import pytest


def _reset_schema(database_url: str) -> None:
    with psycopg.connect(database_url, autocommit=True) as conn:
        conn.execute("DROP SCHEMA public CASCADE; CREATE SCHEMA public;")


@pytest.fixture
def client(monkeypatch):
    """API 結合テスト用のクライアントです。

    次の3点をテスト用に切り替え、実行結果がネットワークや外部状態に左右されないようにします。

    - テストごとに DB のスキーマを作り直し、テスト間の状態を共有しません。
    - BERT_MODEL を空にして、モデルのダウンロードとベクトル計算を行いません。
    - 起動時の Wikipedia への画像取得を無効化します。
    """
    database_url = os.environ.get("TEST_DATABASE_URL")
    if not database_url:
        pytest.skip("TEST_DATABASE_URL が未設定のため、PostgreSQL を使うテストを省略します")

    _reset_schema(database_url)
    monkeypatch.setenv("DATABASE_URL", database_url)
    monkeypatch.setenv("BERT_MODEL", "")

    from app import db as db_module

    monkeypatch.setattr(db_module, "backfill_destination_images", lambda: None)

    from fastapi.testclient import TestClient

    from app.main import app

    with TestClient(app) as c:
        yield c

    _reset_schema(database_url)
