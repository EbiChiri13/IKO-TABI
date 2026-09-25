# いこたび (IKO-TABI)

グループ旅行の「行き先・宿・ごはん・観光スポット」を、メンバー全員の希望から自動でマッチングして決める Web アプリです。

各メンバーが 65 語のハッシュタグから希望を選び、日本語 Sentence-BERT でタグ同士の意味的な近さを計算します。単純な多数決ではなく「平均・最小値・ばらつき」と「今回の旅行で譲れないこと（must-have）」を加味することで、**誰か一人だけの意見に偏らない**候補を提示します。全員の投票が終わると宿・ごはん・観光スポットも同様に決まり、最後に「みんなの希望がどれだけかなったか」を確認できます。

- **本番フロントエンド**: https://ikotabi.vercel.app
- **本番バックエンド**: https://web-production-8b8e2.up.railway.app
- **リポジトリ**: https://github.com/EbiChiri13/IKO-TABI

## 主な機能

- **グループ作成 / 招待リンク参加**: アカウント不要。グループにつき 1 本の招待リンクを、定員（2〜4 人）に達するまで全員で使い回す。
- **アカウント機能（メール + パスワード）**: `/register`・`/login`。グループ参加とは独立して共存する。
- **ハッシュタグ選定**: 用意された 65 語（カテゴリ別）から希望を選ぶ。個人のタグ公開設定は初期値「非公開」。
- **「今回の旅行で譲れないこと」**: 選んだタグの中から 1 つだけ確定し、スコア計算（`must_have_fit`）に反映する。
- **マッチング**: Sentence-BERT の埋め込みで意味的な近さを計算し、平均・最小値・ばらつきを合成してランキングを作る。
- **投票**: 行き先 → 宿泊 → 食事 → 観光地の順に、候補へ投票する（誰か一人の希望は必ず 1 つ通る）。
- **決定まとめ**: 決定した行き先・宿・ごはん・スポットと、各メンバーの希望が何件かなったかを表示する。
- **リアルタイム通知**: WebSocket でグループ内の変更（回答・投票など）を通知する。
- **写真表示**: 実在する都道府県は Wikipedia 日本語版のページ概要 API から実写真を取得。宿・ごはん・スポットは架空の名前のためダミー画像（picsum.photos）。

## 技術スタック

| 領域 | 使用技術 |
| --- | --- |
| バックエンド | Python 3.12 / FastAPI / Uvicorn / psycopg (PostgreSQL) |
| マッチング | sentence-transformers + 日本語 Sentence-BERT (`sonoisa/sentence-bert-base-ja-mean-tokens-v2`) / NumPy |
| DB | PostgreSQL 16 |
| フロントエンド | Next.js 16 (App Router) / React 19 / TypeScript / Tailwind CSS v4 / Radix UI |
| テスト | pytest / httpx |
| リンタ / フォーマッタ | Ruff（バックエンド） / Biome（フロントエンド） |
| インフラ | Railway（バックエンド + DB, Docker）/ Vercel（フロントエンド）/ Docker Compose（ローカル DB） |

## ディレクトリ構成

```
IKO-TABI/
├── app/                     # バックエンド (FastAPI)
│   ├── main.py              #   エンドポイント定義（仕様書B 8章）
│   ├── service.py           #   グループ作成・招待・選定・投票・決定の処理
│   ├── matching.py          #   マッチングのスコア計算（must_have_fit 含む）
│   ├── decide.py            #   投票結果からの決定ロジック
│   ├── reason.py            #   候補の理由文テンプレート
│   ├── embedding.py         #   日本語 Sentence-BERT のラッパー
│   ├── engine.py            #   起動時のベクトル準備
│   ├── realtime.py          #   WebSocket による変更通知
│   ├── wikipedia_images.py  #   都道府県写真の取得
│   ├── db.py / schema.sql   #   PostgreSQL 接続・テーブル定義
│   └── data/                #   ハッシュタグ 65 語 / 47 都道府県・423 件のデータ
├── web/                     # フロントエンド (Next.js)
│   ├── app/                 #   画面（home / groups / join / login / register / styleguide）
│   ├── components/          #   ui（基礎部品）/ layout（ヘッダー等）
│   ├── biome.json           #   Biome（リンタ / フォーマッタ）の設定
│   └── lib/api.ts           #   バックエンドを呼ぶ薄いクライアント
├── static/                  # ビルド不要の素の JS 版（初期プロトタイプ）
├── tests/                   # pytest（ロジック単体 + API 結合、計 11 件）
├── docs/                    # 仕様書（spec-b.md / spec-c.md）
├── ruff.toml                # Ruff（リンタ / フォーマッタ）の設定
├── Dockerfile               # バックエンド用イメージ（BERT モデル焼き込み）
├── docker-compose.yml       # ローカル PostgreSQL
├── railway.json             # Railway ビルド/デプロイ設定
└── Procfile                 # 起動コマンド（Railway）
```

## 必要な環境

- Python **3.12**（`.python-version` 参照）
- Node.js **20 以上**（Next.js 16 の要件）
- Docker / Docker Compose（ローカル DB 用。ローカルの PostgreSQL でも可）

## ローカルでの動かし方

### 1. リポジトリの取得

```bash
git clone https://github.com/EbiChiri13/IKO-TABI.git
cd IKO-TABI
```

### 2. データベースの起動

```bash
docker compose up -d db
```

`docker-compose.yml` の定義により、以下で接続できます。

```
postgresql://ikotabi:ikotabi@localhost:5432/ikotabi
```

### 3. バックエンドの起動

```bash
python -m venv .venv
source .venv/bin/activate           # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env                 # DATABASE_URL / BERT_MODEL を必要に応じて編集
set -a && source .env && set +a      # Windows: $env:DATABASE_URL = "postgresql://ikotabi:ikotabi@localhost:5432/ikotabi"

python -m uvicorn app.main:app --reload --port 8000
```

初回起動時にスキーマ作成・初期データ投入（ハッシュタグ / 423 件の行き先）と、BERT のベクトル計算が走ります。BERT の読み込み・計算には数十秒かかることがあります。

- ヘルスチェック: http://localhost:8000/api/health
- API ドキュメント: http://localhost:8000/docs
- 素の JS 版プロトタイプ: http://localhost:8000/

### 4. フロントエンドの起動

別ターミナルで:

```bash
cd web
npm install
npm run dev
```

http://localhost:3000 で開きます。`next.config.mjs` の `rewrites` により、`/api/*` へのリクエストは自動的にバックエンド（既定 `http://localhost:8000`）へ転送されます。

## テスト

```bash
# バックエンド（結合テストは実際の PostgreSQL を使う）
TEST_DATABASE_URL=postgresql://ikotabi:ikotabi@localhost:5432/ikotabi \
  python -m pytest -q

# フロントエンド
cd web
npm run typecheck
```

## リンタ / フォーマッタ

バックエンドは **Ruff**、フロントエンドは **Biome** を使います（設定は `ruff.toml` と `web/biome.json`）。

```bash
# バックエンド: Ruff（app / tests が対象）
ruff check .          # 指摘のチェック
ruff check --fix .    # 自動修正できる指摘を反映
ruff format .         # フォーマット

# フロントエンド: Biome（web 配下が対象）
cd web
npm run lint          # チェック（フォーマット + リンタ + import の整理）
npm run lint:fix      # 自動修正できる指摘を反映
npm run format        # フォーマットのみ
```

`ruff` は `requirements.txt` に含まれているので、セットアップの `pip install -r requirements.txt` で入ります。
`biome` は `web` の devDependencies に含まれているので、`npm install` で入ります。

## 環境変数

### バックエンド

| 変数名 | 既定値 | 説明 |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://ikotabi:ikotabi@localhost:5432/ikotabi` | PostgreSQL への接続文字列 |
| `BERT_MODEL` | `sonoisa/sentence-bert-base-ja-mean-tokens-v2` | 使用する日本語 Sentence-BERT モデル。空文字にすると簡易類似度に切り替わる |
| `CORS_ORIGINS` | （空） | 追加で許可するオリジン。カンマ区切り |
| `HF_TOKEN` | （空） | Hugging Face のアクセストークン。ビルド時にモデルを取得する際のレート制限対策 |
| `HF_HOME` | `/app/.cache/huggingface`（Docker 内） | モデルキャッシュの場所 |

### フロントエンド

| 変数名 | 既定値 | 説明 |
| --- | --- | --- |
| `IKOTABI_API_ORIGIN` | `http://localhost:8000` | `/api/*` のrewrite先（バックエンドのオリジン）。本番では Railway の URL を指定 |
| `NEXT_PUBLIC_API_WS_HOST` | `window.location.host` | WebSocket (`/ws/groups/...`) の接続先ホスト。本番では Railway のホストを指定 |
| `IKOTABI_DEV_ORIGINS` | （空） | ngrok / cloudflared 等のトンネル経由で開発するときの許可ホスト。カンマ区切り |

## デプロイ

### バックエンド: Railway（+ PostgreSQL）

Railway と GitHub を連携済みで、**`git push` するだけで自動デプロイ**されます。DB は Railway 上の PostgreSQL サービスを使います。

1. Railway プロジェクトに PostgreSQL サービスを追加し、`DATABASE_URL` がバックエンドサービスに注入されるようにする。
2. バックエンドサービスの環境変数を設定する（`BERT_MODEL`、`HF_TOKEN`、必要に応じて `CORS_ORIGINS`）。
3. `railway.json` の設定でビルドします。
   - builder: `DOCKERFILE`（`Dockerfile` をビルド）
   - `build.watchPatterns`: `app/**`, `static/**`, `requirements.txt`, `Dockerfile`, `railway.json` のみ
     → **`web/` の変更ではバックエンドが再デプロイされない**
   - 起動コマンド: `sh -c 'uvicorn app.main:app --host 0.0.0.0 --port $PORT'`
4. `git push`（main ブランチ）で自動反映。

> **ポイント**: `Dockerfile` ではビルド時に日本語 BERT モデルをイメージへ焼き込み、実行時は `HF_HUB_OFFLINE=1` / `TRANSFORMERS_OFFLINE=1` でネットワークに一切出ません。これによりコンテナ再起動ごとのモデル問い合わせが無くなり、起動が数十秒〜数分から数秒に短縮されます（ヘルスチェックのタイムアウト対策）。

デプロイ直後は起動に時間がかかることがあり、一時的に 502 が返ることがあります。ログは次のコマンドで確認できます。

```bash
railway logs --service web      # "Application startup complete" を待つ
```

### フロントエンド: Vercel

**GitHub 連携は権限の問題で利用できていないため、CLI から手動デプロイします。** `git push` だけでは Vercel 側は更新されません。

```bash
cd web
npx vercel --prod --yes
```

Vercel 側には以下を環境変数として設定してください。

- `IKOTABI_API_ORIGIN` … Railway のバックエンド URL（例: `https://web-production-8b8e2.up.railway.app`）
- `NEXT_PUBLIC_API_WS_HOST` … Railway のバックエンド ホスト（例: `web-production-8b8e2.up.railway.app`、スキームなし）

### 本番更新の手順

```bash
# バックエンド（Railway は自動デプロイ）
git add -A && git commit -m "..." && git push

# フロントエンド（手動デプロイが必要）
cd web && npx vercel --prod --yes
```

### バックエンドを単体の Docker コンテナで動かす場合

```bash
docker build -t ikotabi-backend .
docker run --rm -p 8000:8000 \
  -e DATABASE_URL="postgresql://ikotabi:ikotabi@host:5432/ikotabi" \
  -e BERT_MODEL="sonoisa/sentence-bert-base-ja-mean-tokens-v2" \
  ikotabi-backend
```

## API 概要

| メソッド | パス | 説明 |
| --- | --- | --- |
| POST | `/api/auth/register` | アカウント登録 |
| POST | `/api/auth/login` | ログイン |
| GET | `/api/auth/me` | ログイン中ユーザー情報 |
| POST | `/api/groups` | グループ作成 |
| GET | `/api/groups/{id}` | グループ詳細 |
| POST / DELETE | `/api/groups/{id}/invites` | 招待リンクの発行 / 失効 |
| GET | `/api/invites/{token}` | 招待情報の取得 |
| POST | `/api/invites/{token}/join` | 招待リンクで参加 |
| GET | `/api/tags` | ハッシュタグ一覧 |
| GET | `/api/groups/{id}/tag-summary` | タグ集計（投票結果画面用） |
| GET / PUT | `/api/groups/{id}/selections/me` | 自分の選定の取得 / 保存 |
| PUT | `/api/groups/{id}/selections/me/must-have` | 「譲れないこと」の確定 |
| POST | `/api/groups/{id}/start` | 投票フェーズの開始 |
| GET | `/api/groups/{id}/candidates` | 候補一覧（`type` 指定） |
| POST | `/api/groups/{id}/votes` | 投票 |
| POST | `/api/groups/{id}/decide` | 決定 |
| GET | `/api/groups/{id}/summary` | 決定まとめ |
| GET | `/api/health` | ヘルスチェック |
| WS | `/ws/groups/{id}?token=...` | 変更通知 |

認証は 2 系統あります。グループ参加は `X-Member-Token` ヘッダー、アカウントは `X-User-Token` ヘッダー。WebSocket はブラウザの制約上トークンをクエリで渡します。

## 開発上の注意点

- **`next/link` に直接 `className` で styled-jsx を当てない**: スコープ用のハッシュクラスが注入されずスタイルが効きません。`:global()` を使うか、内側に素の DOM 要素を挟んでください。
- **リモート DB への初期データ投入は `executemany` でまとめる**: 1 行ずつ INSERT すると Railway 等で起動タイムアウトの原因になります。
- **BERT のベクトル計算は DB 接続を閉じてから行う**: 接続を開いたままだとリモート DB で切断されることがあります。
- **WebSocket は 1 プロセス前提**（`app/realtime.py`）。複数インスタンスへスケールする場合は Redis pub/sub 等の橋渡しが必要です。
- **Tailwind CSS v4 は部分導入**。CSS 変数をテーマにマッピングし、移行済みの画面のみ Tailwind、それ以外は styled-jsx のままです。

## 既知の未対応・今後の課題

- 行き先 / 宿泊 / 食事 / 観光地の日本地図ピン表示（Figma 完成版にはあるが、都道府県の座標データが無く未実装）
- 食事選定のデータ構造を Figma 完成版（行き先ごとに朝食 / 昼食 / 夕食）へ合わせるかどうかは保留
- Vercel の GitHub 自動連携（リポジトリ所有者側の GitHub App 設定が原因で未解決）
- アカウント機能とグループ参加（ゲスト）の紐付けは未設計（現在は完全に別系統）

## 関連ドキュメント

- [NOW.md](NOW.md) — 現状まとめ（デプロイ URL・運用・課題）
- [first.md](first.md) — これまでの経緯・作業内容
- [time.md](time.md) — 日付ごとの変更履歴
- [NEMUI.md](NEMUI.md) — 直近セッションのまとめ
- [docs/spec-b.md](docs/spec-b.md) — 仕様書 B（機能要件・DB 設計・API 設計）
- [docs/spec-c.md](docs/spec-c.md) — 仕様書 C（spec-b からの差分）
