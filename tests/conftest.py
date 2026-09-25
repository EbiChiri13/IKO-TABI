"""テスト全体で共有する設定です。

PostgreSQL を使うテスト（tests/test_api.py）は、TEST_DATABASE_URL が設定されているときだけ
実行します。未設定の場合はスキップとして報告されます。
"""

import os

import psycopg
import pytest

TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL")


def _reset_schema() -> None:
    with psycopg.connect(TEST_DATABASE_URL, autocommit=True) as conn:
        conn.execute("DROP SCHEMA public CASCADE; CREATE SCHEMA public;")


@pytest.fixture(scope="session")
def client():
    """API 結合テスト用のクライアントです。

    次の3点をテスト用に切り替え、実行結果がネットワークや外部状態に左右されないようにします。

    - テスト用 DB のスキーマを開始時と終了時に作り直します（後始末を残しません）。
    - BERT_MODEL を空にして、モデルのダウンロードとベクトル計算を行いません。
    - 起動時の Wikipedia への画像取得を無効化します。
    """
    if not TEST_DATABASE_URL:
        pytest.skip("TEST_DATABASE_URL が未設定のため、PostgreSQL を使うテストを省略します")

    _reset_schema()
    os.environ["DATABASE_URL"] = TEST_DATABASE_URL
    os.environ["BERT_MODEL"] = ""

    from app import db as db_module

    db_module.backfill_destination_images = lambda: None

    from fastapi.testclient import TestClient

    from app.main import app

    with TestClient(app) as c:
        yield c

    _reset_schema()
