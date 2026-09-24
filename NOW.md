# いこたび - 現状まとめ (NOW.md)

最終更新: 2026-09-24

## デプロイ済みURL

- **フロントエンド**: https://ikotabi.vercel.app （Vercel、手動デプロイ運用）
- **バックエンド**: https://web-production-8b8e2.up.railway.app （Railway、GitHub連携で自動デプロイ）
- **GitHubリポジトリ**: https://github.com/EbiChiri13/IKO-TABI （main ブランチ）

## 構成

- `app/` - バックエンド（FastAPI + PostgreSQL）。仕様書B準拠。日本語Sentence-BERTでマッチング。
- `web/` - フロントエンド（Next.js App Router + TypeScript）。もとはJSXで自作したが、
  チームメイト（`My`, `yume417`）が丸ごとTypeScript化したものをマージして現行版になっている。
- `docs/spec-b.md`, `docs/spec-c.md` - 仕様書。spec-cはspec-bからの差分（フロント技術・デザイン反映・実装状況）。
- `tests/` - pytest（バックエンドのロジック・API結合テスト、11件）。

## デプロイ運用（重要）

- **Railway（バックエンド）**: GitHubと連携済み。`git push`するだけで自動的に再デプロイされる。
- **Vercel（フロントエンド）**: GitHub連携が権限の問題でできていない（`EbiChiri13`アカウント側のGitHub App設定が原因、試したが未解決）。
  そのため **`git push`だけではVercel側は更新されない**。毎回 `cd web && npx vercel --prod --yes` を手動で実行する必要がある。
- Railwayの起動は遅いことがある（BERTモデルのダウンロード＋423件のベクトル計算のため）。
  デプロイ直後に502が出ても、数十秒〜数分待てば復旧することが多い。心配なら
  `railway logs --service web` でログを見て `Application startup complete` が出るのを待つ。

## これまでの主な作業

1. **バックエンド実装**（FastAPI）: グループ作成・招待・ハッシュタグ選定・マッチング・投票・決定まとめ、
   WebSocketでのリアルタイム通知。pytest 11件パス。
2. **フロントエンド一式**（Next.js）: Figma「サマーハッカソン2026」の「緑変えてみた」デザインを元に
   全画面実装 → その後チームメイトがTypeScript化 → マージ済み。
3. **Railway + Vercelへのデプロイ**: 両方とも本番稼働中。
4. **Figma「完成版」との突き合わせ**: 実際のFigmaファイルから完成版セクション（node 321:1185）を発見し、
   投票待ち画面・投票結果画面（新規追加）・決定まとめ画面をデザイン通りに作り直した。
5. **「今回の旅行で譲れないこと」機能を新規追加**: ハッシュタグ選定の後に1つだけ選ぶ画面を追加し、
   選んだタグは黄色でハイライト。マッチングのスコア計算にも反映（`app/matching.py` の `must_have_fit`）。
6. **起動画面（スプラッシュ）をFigmaから実装**: 実際のイラスト素材（2人のキャラクター、ロゴのリボン、
   ワードマーク、後光のグロー）をFigmaから書き出して `web/public/splash/` に配置し、座標を再現。
7. **重要なバグ発見・修正**: `next/link` に直接 `className` でstyled-jsxのスタイルを当てると、
   スコープ用のハッシュクラスが注入されずスタイルが一切効かない問題を発見。
   影響していたのは「戻るボタン」（ほぼ全画面のヘッダー）と「所属グループ一覧」（ホーム画面）。
   `:global()` を使うか、内側に素のDOM要素（span等）を挟むことで解決。
   **今後 `<Link className="...">` を新しく書くときは同じ罠に注意すること。**

## 既知の未対応・今後の課題

- **食事選定のデータ構造**: Figma完成版では「行き先ごとに朝食/昼食/夕食を選ぶ」形になっているが、
  今の実装は「ごはん屋さん一覧から2つ投票」のまま（ユーザーの指示で今回はスコープ外とした）。
- **行き先/宿泊/食事/観光地選定の日本地図ピン表示**: Figmaにはあるが、まだ実装していない
  （今は写真カードのみ）。
- **ダミー画像**: 実写真がないので `picsum.photos` のシード画像で代用中（DBには保存せず、IDから
  毎回URLを生成する方式）。本番用の実写真に差し替えたい場合は `app/service.py` の
  `placeholder_image()` を差し替える。
- **Vercelの自動デプロイ**: GitHub連携ができれば `git push` だけで両方自動更新されるようになる。
  `EbiChiri13` アカウント側でVercelのGitHub App設定を見直す余地がある
  （`github.com/settings/installations` を `EbiChiri13` としてログインした状態で確認）。
- **WebSocketの複数プロセス対応**: 現状は1プロセス前提（`app/realtime.py`）。将来Railwayで
  複数インスタンスにスケールする場合はRedis pub/sub等の橋渡しが必要（spec-c.mdに記載済み）。

## ローカルでの動かし方

```powershell
# バックエンド
cd IKO-TABI
.venv\Scripts\activate
$env:DATABASE_URL = "postgresql://ikotabi:ikotabi@localhost:5432/ikotabi"
.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000

# フロントエンド（別ターミナル）
cd IKO-TABI\web
npm install
npm run dev
```

テスト実行: `TEST_DATABASE_URL=postgresql://... .venv/Scripts/python -m pytest -q`

## 本番更新の手順（このセッションでの運用）

```bash
git add -A && git commit -m "..." && git push   # Railwayは自動更新
cd web && npx vercel --prod --yes                # Vercelは手動デプロイが必要
```
