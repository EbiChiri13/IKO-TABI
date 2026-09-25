# Figma「完成版」と実装の突き合わせ記録

Figma の「完成版」セクション（file `i9wGtdI2N3ZJhjQlStMIIx` の node `473:4355`、402pt の画面19枚）を
正として `web/` の実装を突き合わせ、差分を修正した記録。

- 参照画像（Figma）: `.figma-ref/473-4355/*.png`
- 参照画像（実装・402px幅・fullPage）: `.figma-ref/impl/*.png`
- 比較方法: `get_screenshot` の画像と、`next dev` を起動して Playwright で撮った実画面を並べる。
  数値（余白・色・高さ）は `get_metadata` の座標と DOM の `getBoundingClientRect()`、
  画像のピクセル値で確認した（文字の読み取りは目視・vision に頼ると数え間違いが出るため）。

## 直した差分

| # | 画面 | Figma ノード | 見つけた差分 | 対応 |
| --- | --- | --- | --- | --- |
| 1 | ハッシュタグ選定 `/groups/[id]/tags` | `473:4521` | 左上が**戻る矢印**だった。Figma は**ホームアイコン**（32×32） | `HomeIcon` を使い `/home` へ。`HomeIcon` は定義済みなのに未使用だった |
| 2 | 同上 | `473:4521` | 進み具合バーが**画面幅いっぱい**（362px）で、アイコンの下の行にあった | アイコンと**同じ行**に置き、中央寄せの 264px（1本38px＋すきま7px）に |
| 3 | 同上 | `473:4521` | チップが 36px 高・枠線1.5px・太字 | Figma どおり **33px 高・枠線0.5px・通常の太さ**、すきま 8→6px |
| 4 | お気に入り選定 `/groups/[id]/favorite` | `473:5083` | 進み具合バーの幅と位置が同上 | 共通ヘッダーに寄せて統一 |
| 5 | 行き先/宿泊/食事/観光地の選定 `/groups/[id]/vote/[type]` | `473:4723` / `473:4766` / `473:4852` / `473:4809` | 見出しが **y52** にあり、Figma の **y113** より60px高かった | 共通ヘッダー化して y113 に |
| 6 | 同上 | `473:4723` ほか | **「今の投票で決める」ボタンと幹事向けの注記が残っていた**（Figma には無い） | ボタン・注記・`decideNow()`・未使用になった `NEXT` 定数を削除 |
| 7 | 同上 | `473:4723` Rectangle 58 | 地図の帯の色が `#E2F5F2`（ミント）だった | Figma は **`#BDE3FF`**（水色）。トークン `--map-band` を追加して差し替え |
| 8 | 投票待ち `/groups/[id]/waiting` | `473:4905` / `473:4930` / `473:4955` | 左上に**戻る矢印が無かった** | 戻る矢印（32px）を追加し、見出しを y113 に |
| 9 | 同上 | `473:4905` | 下部に**「ホームへ戻る」（ホームアイコン付き）が無かった** | 追加 |
| 10 | ホーム `/home` | `473:5133` | 右上の**ハンバーガーメニューが無かった** | `HomeMenu` を新設（ログイン／ログアウト・グループ新規作成） |
| 11 | 同上 | `473:5133` Group 15 | 「所属グループ」の左の**ピンアイコンが無かった** | Figma から書き出し済みで未使用だった `web/public/home/pin.svg` を表示 |
| 12 | グループ作成 `/groups/new` | `473:5101` | ヘッダーの地色が `#272727`（暗いグレー）だった | Figma は **`#0C3239`**。トークン `--panel-dark` を追加（`invite-header.svg` / `summary-hero.svg` と同じ色） |
| 13 | 同上 | `473:5101` | ラベルと見出しが**左寄せ**、チケット飾りが**右寄せで見切れ**ていた | ラベル・見出しを中央寄せ、見出しをヘッダー下部へ、チケットを中央に |
| 14 | サインアップ `/register` | `473:4439` | 入力ラベルが「表示名」 | Figma どおり **「ニックネーム」** |
| 15 | 同上 | `473:4439` | 下部リンクが「アカウントをお持ちの方はこちら」 | Figma どおり **「ログインはこちら」** |
| 16 | グループ結成 `/groups/[id]/invite` | `473:4566` | **「計画を始める」ボタンが無かった**。「あとで」が塗りボタンだった | 「計画を始める」を追加（カレンダーアイコン付き）、「あとで」は文字リンクに |
| 17 | 全画面 | — | コメント中の Figma ノードIDが旧番号（`363:xxxx`）のまま | `473:xxxx`（今回の正）へ更新 |

### 追加したもの
- `web/components/layout/StepHeader.tsx` … 選定系6画面の共通ヘッダー（左上アイコン＋進み具合バー＋見出し）
- `web/components/home/HomeMenu.tsx` … ホーム右上のメニュー
- `MenuIcon`（`web/components/icons/index.tsx`）
- デザイントークン `--panel-dark` / `--map-band`（`web/app/globals.css`）

## 意図的に変えなかった差分

| 画面 | Figma との差 | 理由 |
| --- | --- | --- |
| サインアップ `473:4439` | 「Googleでサインイン」ボタンがある | バックエンドに Google 認証が無い。実装しない（`web/DESIGN.md` の accepted debt と同じ扱い） |
| グループ作成 `473:5101` | 入力欄は「部屋の名前／日程／人数」の3つだけ | `POST /api/groups` がニックネーム必須（グループ参加に必要）なので「あなたのニックネーム」は残す |
| 選定画面 `473:4723` ほか | 候補カードは「写真＋名前＋チップ3つ＋投票ボタン」のみ | 実装は一致率・理由文・「N人中M人の希望にマッチ」も出す。`app/reason.py` の「なぜ選ばれたか」は製品の中心機能なので残す |
| 全選定画面 | Figma のアイコン・バーは y67〜79（スマホのステータスバーぶん下） | Web にはステータスバーが無いため、**見出しの y113 を合わせる**ことを優先（両者で一致） |
| 進み具合バー | タグ/お気に入りは 225px、投票系は 264px と Figma 内でも不揃い | 6画面中4画面の 264px に統一 |
| ハッシュタグ選定 `473:4521` | 「選んだタグをメンバーに見せる」スイッチと下部の注記が描かれていない | 仕様書B Q16（初期値は非公開）の機能なので残す |
| 投票待ち `473:4905` | 局面ごとに3状態（タグのみ／行き先＋タグ／行き先＋宿＋食事）ある | 実装は1画面でタグのカードのみ。「あなたが選んだ行き先はこちら」を出すには API の追加が必要なため今回は据え置き |
| ホーム `473:5133` | チケットの写真が実写 | 実写真が無く `D9D9D9` のプレースホルダ（既知の課題のまま） |
| 選定画面 | Figma の地図は `emojione:map-of-japan` | 実装は書き出し済みの `/figma/japan-map.svg`。ピン表示は今回スコープ外（ユーザー判断） |
| 食事選定 `473:4852` | 行き先ごとに朝食/昼食/夕食を選ぶ形 | データ構造の変更は今回スコープ外（ユーザー判断） |

## 再現手順

```bash
# 参照画像の取得（Figma MCP。`cmd mcp list` に figma が必要）
#   19画面を .figma-ref/473-4355/ へ get_screenshot で書き出す

# ローカルで動かす
docker compose up -d db
python -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt   # または uv
DATABASE_URL=postgresql://ikotabi:ikotabi@localhost:5432/ikotabi BERT_MODEL="" \
  python -m uvicorn app.main:app --port 8000     # BERT_MODEL を空にすると簡易類似度で速く起動する
cd web && npm run dev

# 実画面の撮影（Playwright / ビューポート402px・deviceScaleFactor 2）
#   グループ作成→招待→タグ選定→開始→投票 まで進めたデータを用意して各ルートを fullPage 撮影
```

## 環境メモ

- この突き合わせで使った Figma MCP はリモート（`https://mcp.figma.com/mcp`）に OAuth の
  アクセストークンをヘッダで渡している。動的クライアント登録（`api.figma.com/v1/oauth/mcp/register`）が
  `403` で塞がれているため `cmd mcp auth figma` は通らない。
  トークンは `~/.commandcode/projects/home-yuki-iko-tabi/mcp.json` にあり、有効期限は 2026-12-23。
  切れたら `cmd mcp add-json figma '{"type":"http","url":"https://mcp.figma.com/mcp","headers":{"Authorization":"Bearer <token>"}}'` で入れ直す。
- `next dev` の初回起動で `web/tsconfig.json` の `include` に `.next/dev/dev/types/**/*.ts` が自動追加される
  （Next.js の挙動。今回の差分に含まれる）。
