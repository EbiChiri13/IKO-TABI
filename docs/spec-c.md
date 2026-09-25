# いこたび 仕様書C

13班「えびちり」／2026年9月

本書は[仕様書B](./spec-b.md)をもとに、実装（`IKO-TABI`リポジトリ、コミット`f8b13a2`時点）に合わせて更新した版である。バックエンドの仕様（3〜9章相当）は仕様書Bからの変更なし。変わったのは主に**画面側の実装技術とデザイン**（10章）と、**実装・検証の状況**（11章）。仕様書Bとの差分は10章末の表にまとめる。

---

## 1〜9章：仕様書Bを継承

課題背景・サービス概要・提供価値・機能要件・データベース・API・セキュリティは[仕様書B](./spec-b.md)の1〜3章、5章、7〜9章のとおりで変更ない。実装は以下の構成である。

```
IKO-TABI/
├─ app/            バックエンド（FastAPI）。仕様書B 6〜9章の実装そのもの
│  ├─ main.py         APIエンドポイント（8章）
│  ├─ service.py       画面操作ごとの処理（グループ作成・投票・決定など）
│  ├─ matching.py       マッチングのスコア計算（5.2）
│  ├─ decide.py         投票からの決定ロジック（5.3）
│  ├─ reason.py         理由文のテンプレート生成（5.4）
│  ├─ embedding.py       日本語Sentence-BERTのラッパー
│  ├─ engine.py         起動時に候補データとベクトルをメモリに用意
│  ├─ realtime.py        WebSocketの配信
│  ├─ db.py / schema.sql  PostgreSQL接続とテーブル定義（7章）
│  └─ data/            ハッシュタグ65語・47都道府県423件のデータ（5.1・5.2・Q17）
├─ tests/           pytest（ロジック単体＋API結合テスト、10章参照）
├─ pyproject.toml   uv によるバックエンドの依存管理（uv.lock を含む）
├─ web/             現行のフロントエンド（10章で詳述）
└─ docs/spec-b.md, spec-c.md
```

アーキテクチャ図・採用技術（6章）はサーバー側（Python/FastAPI、PostgreSQL、BERT、WebSocket）は仕様書Bのまま。フロントエンドのみ10章のとおり更新した。

## 10. 画面（フロントエンド）の更新

### 10.1 変更の理由

仕様書Bの6.2では「画面はビルド不要の素のJavaScript」としていたが、以下の理由でNext.js（React）に切り替えた。

- デザイナーがFigmaで作った最新デザイン（「緑変えてみた」フレーム）を反映するにあたり、コンポーネント単位で管理できたほうが以後の修正がしやすい
- 画面数が10画面に増え、進み具合バーやカードなど共通パーツが多いため、コンポーネント分割の恩恵が大きい
- チームメンバーへのプレビュー共有（`npm run dev`＋トンネル）がしやすい

サーバー側の設計思想（Q13：開発言語をなるべく揃える）に対する変更ではない。UIの実装言語は仕様書Aの時点から「ブラウザで動く言語はJavaScriptのみ」としており、Reactもその範囲内のJavaScript／TypeScript系フレームワークである。

### 10.2 技術構成

| 技術 | 用途 |
| --- | --- |
| Next.js（App Router） | 画面のルーティングとレンダリング |
| React | コンポーネント |
| styled-jsx（Next.js標準） | コンポーネント単位のスタイリング（ビルドツール追加なし） |
| next.config.mjs の rewrites | 開発時に `/api/*` をFastAPI（`app/main.py`）へ橋渡し |

本番では、Next.jsのビルド成果物とFastAPIを同一オリジンで配信するか、リバースプロキシ（nginx等）で束ねる想定は仕様書Bの6.2から変更ない。

開発中にトンネル（cloudflared等）越しにプレビューする場合は、`next.config.mjs`の`allowedDevOrigins`にトンネルのホスト名を追加する必要がある（Next.jsの開発サーバーは既定で他ドメインからのCSS/フォント/HMRリクエストを安全のためブロックするため。未設定だとスタイルが当たらず画面が崩れて見える）。

### 10.3 デザイン

Figma「緑変えてみた」フレームをもとにしたデザイントークン。

| 用途 | 色 |
| --- | --- |
| ヘッダー・主要ボタン（ティール） | `#2e9b84` |
| 決定まとめ等の濃色ヘッダー | `#123b34` |
| 差し色ボタン・スプラッシュ背景（ミント） | `#a8e6c0` |
| 画面背景（クリーム） | `#fff8ea` |
| 本文・見出し文字（焦げ茶） | `#3b2a1f` |

ロゴ「いこ！たび」は手書き風フォント（Google Fonts「Yomogi」）＋白フチ＋影で表現。本文は丸ゴシック（Google Fonts「Zen Maru Gothic」）。ボタンはピル形、カードは角丸＋薄い枠線というFigmaのトンマナに合わせている。

### 10.4 画面とルーティング

仕様書B 4.2の画面構成をNext.jsのApp Routerで実装した。

| 画面 | パス | 対応するAPI |
| --- | --- | --- |
| スプラッシュ | `/` | なし（端末の参加履歴を見るだけ） |
| ホーム | `/home` | `GET /api/groups/{id}`（保存済みの各グループ） |
| グループ作成 | `/groups/new` | `POST /api/groups` |
| 招待 | `/groups/{id}/invite` | `POST /api/groups/{id}/invites` |
| 招待参加 | `/join/{token}` | `GET /api/invites/{token}`, `POST /api/invites/{token}/join` |
| ハッシュタグ選択 | `/groups/{id}/tags` | `GET /api/tags`, `GET/PUT /api/groups/{id}/selections/me` |
| 回答待ち | `/groups/{id}/waiting` | `GET /api/groups/{id}`, `POST /api/groups/{id}/start` |
| 行き先／宿／ごはん／スポット候補 | `/groups/{id}/vote/{type}` | `GET /api/groups/{id}/candidates`, `POST /api/groups/{id}/votes`, `POST /api/groups/{id}/decide` |
| 決定まとめ | `/groups/{id}/summary` | `GET /api/groups/{id}/summary` |
| グループの入口（進み具合に応じて自動振り分け） | `/groups/{id}` | `GET /api/groups/{id}` |

`/groups/{id}` は状態遷移の分岐だけを行うルートで、`group.status`に応じて上記のいずれかへ自動的に`router.replace`する。

### 10.5 コンポーネント構成

```
web/
├─ app/                  各画面（上表のルーティング）
├─ components/
│  ├─ ui/                Button, TextField, Chip, Switch, Card, Badge,
│  │                     Stepper, DateRangeField, AvatarStack, BottomBar,
│  │                     Toast, Spinner
│  ├─ layout/            AppHeader, ProgressSteps（4段の進み具合）,
│  │                     PlaneTrail・SpeechBubbleSticker（装飾）
│  ├─ home/              HeroCarousel, TripCard, GroupListItem, WelcomeIllustration
│  ├─ group/             CreateGroupForm
│  ├─ invite/            InviteHero, InviteLinkBox
│  ├─ tags/              TagCategory
│  ├─ members/           MemberRow
│  ├─ candidates/        CandidateCard, CandidateList（行き先/宿/ごはん/スポット共通）
│  └─ summary/           PlaceList, MemberWinsList
└─ lib/
   ├─ api.js             FastAPIを呼ぶ薄いクライアント。グループごとのトークンを
   │                     localStorageに保存（アカウント不要【Q3】）
   └─ useLiveGroup.js     グループの状態取得＋WebSocketで自動更新するフック
```

候補カード（`CandidateCard`）は行き先・宿・ごはん・スポットの4種類で共通化し、`type`ごとに投票数の上限だけ変えている（仕様書B 5.3の投票数表に対応）。

### 10.6 データの扱いに関する補足

- 個人のタグは公開設定（`share_answers`）を選んだ人のものだけがAPIレスポンスに含まれ、フロント側でもそれ以外は表示しない（Q16は引き続きサーバー側で担保、フロントは受け取った範囲をそのまま出すだけ）
- WebSocket通知（`/ws/groups/{id}`）は「何が変わったか」の種類（`members`/`answers`/`status`/`votes`）だけを受け取り、`useLiveGroup`がそれを見て該当データをREST APIで取り直す。個人のタグの中身はWebSocketに乗らない

## 11. 実装・検証の状況

| 項目 | 状況 |
| --- | --- |
| バックエンド単体テスト | `tests/test_logic.py`（マッチングスコア・投票決定ロジック） |
| バックエンドAPI結合テスト | `tests/test_api.py`（グループ作成〜決定まとめまでの一連の流れ、招待リンクの再利用不可、公開設定によるタグの見え方などを含め10件） |
| 日本語BERTの実機確認 | `sonoisa/sentence-bert-base-ja-mean-tokens-v2`を実際に読み込み、タグと候補文の類似度が意味的に妥当な値になることを確認 |
| フロント〜バックエンド結合 | Next.js経由でグループ作成→招待→参加→タグ選択→自動開始→行き先/宿/ごはん/スポット投票→決定まとめまでを実サーバーに対して実行し、状態遷移とごはん/スポットの「全員の希望を1つずつ入れる」ロジック（Q2）が意図通り動くことを確認 |
| WebSocketのリアルタイム通知 | 別メンバーの回答時に`{"changed":["answers"]}`が即座に届くことを実機で確認 |
| `next build` | 静的解析・ビルドエラーなしで成功 |

現時点でBERTモデル未読込時のフォールバック（文字2-gramによる簡易類似度、`embedding.py`）も用意しているが、実運用では日本語BERTを前提とする。

## 12. 仕様書Bからの差分まとめ

| 項目 | 仕様書B | 仕様書C（本書） |
| --- | --- | --- |
| 画面の実装技術 | ビルド不要の素のJavaScript | Next.js（React）＋styled-jsx |
| デザイン | 未確定（仕様のみ） | Figma「緑変えてみた」を反映（ティール×ミント×クリーム、手書きロゴ） |
| コンポーネント分割 | 記載なし | `components/ui`・`layout`・画面別ディレクトリに分割 |
| バックエンド・DB・API・マッチングロジック | — | 変更なし |
| 検証状況 | 仕様のみ | 単体・結合テスト、実機でのBERT・WebSocket動作確認まで実施 |

## 13. 今後の課題

仕様書Bの11章（デザインの反映・AI生成データの確認・スコアの重みの調整・Q1の人数拡大・Q11の理由文のLLM化）は引き続き未着手。加えて以下を今後の課題とする。

- **本番デプロイ**：現状は開発者のローカル環境＋一時的なトンネル（cloudflared等）でのプレビューのみ。Next.jsのビルド成果物とFastAPIを同一オリジンで配信する構成、または両者をまとめてホスティングする構成を決める
- **WebSocket通知の複数プロセス対応**：[realtime.py](../app/realtime.py)の`Hub`は接続情報を1プロセスのメモリだけに持つ。現状（uvicorn単一プロセス）では問題ないが、将来的にサーバーを複数プロセス／複数インスタンスで動かす場合は、プロセスをまたいで通知を配れないため、Redisのpub/sub等でプロセス間を橋渡しする仕組みが別途必要になる（Q14で見送った「マッチング用ベクトルのキャッシュ」とは別の用途）
- **`static/`配下の旧バニラJS版**：読み込んでいた`app.js`が存在せず動作しないため削除した（`web/`に一本化済み）
- **画面の細部確認**：招待画面・投票画面など、実ブラウザでの見た目の最終チェック（現時点ではAPI結合テストと`next build`のみで検証し、主要フローの画面遷移をトンネル経由で目視確認した段階）
