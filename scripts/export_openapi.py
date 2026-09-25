"""FastAPI の OpenAPI 仕様を web/openapi.json に書き出します。

フロントエンドの Zod スキーマ（web/lib/generated/schemas.ts）はこのファイルから Orval で
生成します。バックエンドのモデルを変えたら `npm run api:generate` を実行してください。
サーバーを起動せず、DB にも接続せずに書き出せます。
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from app.main import app  # noqa: E402

OUT = ROOT / "web" / "openapi.json"


def main() -> None:
    spec = app.openapi()
    OUT.write_text(json.dumps(spec, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{OUT.relative_to(ROOT)} を書き出しました（{len(spec['paths'])} エンドポイント）")


if __name__ == "__main__":
    main()
