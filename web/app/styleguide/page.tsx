"use client";

import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import Button from "@/components/ui/Button";
import TextField from "@/components/ui/TextField";
import DateRangeField from "@/components/ui/DateRangeField";
import Stepper from "@/components/ui/Stepper";
import Switch from "@/components/ui/Switch";
import Chip from "@/components/ui/Chip";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import AvatarStack from "@/components/ui/AvatarStack";
import BottomBar from "@/components/ui/BottomBar";
import Toast from "@/components/ui/Toast";
import Spinner from "@/components/ui/Spinner";
import AppHeader from "@/components/layout/AppHeader";
import ProgressSteps from "@/components/layout/ProgressSteps";
import SpeechBubbleSticker from "@/components/layout/SpeechBubbleSticker";

/**
 * UIライブラリ（スタイルガイド）。components/ui・components/layout の部品を
 * 一覧して確認するための開発用ページ。本番の画面フローには含めない。
 */
export default function StyleguidePage() {
  const [switchOn, setSwitchOn] = useState(true);
  const [selectedChips, setSelectedChips] = useState(new Set(["温泉"]));
  const [stepper, setStepper] = useState(2);
  const [start, setStart] = useState("2026-11-01");
  const [end, setEnd] = useState("2026-11-02");
  const [toastOn, setToastOn] = useState(false);

  function toggleChip(label: string) {
    setSelectedChips((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }

  return (
    <div className="page">
      <header className="intro">
        <p className="eyebrow">いこたび UIライブラリ</p>
        <h1>コンポーネント一覧</h1>
        <p className="lead">
          Figma「緑変えてみた」のトンマナに合わせた部品集。ここでの見た目の変更は
          <code>components/ui</code>・<code>components/layout</code>を直せば全画面に反映される。
        </p>
      </header>

      <Section title="カラートークン">
        <div className="swatches">
          {([
            ["--teal-900", "濃色ヘッダー"],
            ["--teal-600", "メインカラー"],
            ["--mint-400", "差し色"],
            ["--cream-200", "画面背景"],
            ["--ink-900", "文字色"],
            ["--line", "枠線"],
          ] as const).map(([token, label]) => (
            <div className="swatch" key={token}>
              <span className="chip-color" style={{ background: `var(${token})` }} />
              <code>{token}</code>
              <span className="muted">{label}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Button">
        <Row>
          <Button variant="primary">primary</Button>
          <Button variant="mint">mint</Button>
          <Button variant="ghost">ghost</Button>
          <Button variant="quiet">quiet</Button>
          <Button variant="primary" disabled>
            disabled
          </Button>
          <Button variant="primary" size="sm">
            small
          </Button>
        </Row>
      </Section>

      <Section title="TextField / DateRangeField / Stepper">
        <div className="narrow">
          <TextField label="部屋の名前" placeholder="例：卒業旅行メンバー" hint="20文字まで" />
          <TextField label="エラー例" defaultValue="12345" error="正しい形式で入力してください" />
          <DateRangeField start={start} end={end} onChangeStart={setStart} onChangeEnd={setEnd} />
          <Stepper label="人数" value={stepper} onChange={setStepper} />
        </div>
      </Section>

      <Section title="Switch">
        <div className="narrow">
          <Card>
            <Switch checked={switchOn} onChange={setSwitchOn} label="選んだタグをメンバーに見せる" sub="初期値はオフ" />
          </Card>
        </div>
      </Section>

      <Section title="Chip（ハッシュタグ）">
        <div className="chips-demo">
          {["温泉", "のんびり", "関東", "食べ歩き", "写真映え"].map((label) => (
            <Chip key={label} label={label} selected={selectedChips.has(label)} onClick={() => toggleChip(label)} />
          ))}
        </div>
      </Section>

      <Section title="Badge / AvatarStack">
        <Row>
          <Badge tone="wait">未回答</Badge>
          <Badge tone="ok">回答済み</Badge>
          <Badge tone="host">幹事</Badge>
          <AvatarStack names={["えび", "ちり", "たび", "ほか"]} />
        </Row>
      </Section>

      <Section title="Card">
        <div className="narrow">
          <Card>
            <h3>カード見出し</h3>
            <p className="muted">白背景・角丸・薄い枠線のベースコンポーネント。</p>
          </Card>
        </div>
      </Section>

      <Section title="AppHeader / ProgressSteps">
        <div className="frame">
          <AppHeader eyebrow="グループ作成" title={"旅行のグループを\n作りましょう！"} backHref="#">
            <SpeechBubbleSticker />
          </AppHeader>
          <ProgressSteps status="destination" />
        </div>
        <div className="frame" style={{ marginTop: 12 }}>
          <AppHeader dark eyebrow="2026.11.20 〜 11.21" title="決定まとめ" />
        </div>
      </Section>

      <Section title="BottomBar / Toast / Spinner">
        <div className="frame">
          <BottomBar note="幹事はいつでも今の投票で決められます">
            <Button variant="primary" block>
              投票する
            </Button>
          </BottomBar>
        </div>
        <Row style={{ marginTop: 12 }}>
          <Button variant="quiet" onClick={() => setToastOn(true)}>
            トーストを表示
          </Button>
        </Row>
        <div className="frame" style={{ marginTop: 12 }}>
          <Spinner />
        </div>
        {toastOn && <Toast message="保存しました" />}
      </Section>

      <style jsx>{`
        .page {
          max-width: 720px;
          margin: 0 auto;
          padding: 32px 20px 80px;
        }
        .intro { margin-bottom: 32px; }
        .eyebrow { color: var(--teal-700); font-weight: 800; font-size: 0.85rem; margin-bottom: 4px; }
        h1 { font-size: 1.6rem; margin-bottom: 10px; }
        .lead { color: var(--ink-600); max-width: 56ch; }
        code {
          background: var(--cream-100); padding: 1px 6px; border-radius: 6px; font-size: 0.85em;
        }
        .swatches { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
        .swatch { display: flex; flex-direction: column; gap: 4px; }
        .chip-color { display: block; width: 100%; height: 40px; border-radius: 10px; border: 1px solid var(--line); }
        .muted { color: var(--ink-400); font-size: 0.82rem; }
        .narrow { max-width: 360px; }
        .chips-demo { display: flex; flex-wrap: wrap; gap: 8px; }
        .frame {
          border: 1px dashed var(--line); border-radius: var(--radius-md); overflow: hidden;
          max-width: 380px;
        }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <section className="section">
      <h2>{title}</h2>
      {children}
      <style jsx>{`
        .section { margin-bottom: 40px; }
        h2 {
          font-size: 1rem; margin-bottom: 14px; padding-bottom: 8px;
          border-bottom: 2px solid var(--line);
        }
      `}</style>
    </section>
  );
}

function Row({ children, style }: { readonly children: ReactNode; readonly style?: CSSProperties }) {
  return (
    <div className="row" style={style}>
      {children}
      <style jsx>{`
        .row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
      `}</style>
    </div>
  );
}
