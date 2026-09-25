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
const CODE_CLASS = "rounded-[6px] bg-muted px-1.5 py-px text-[0.85em]";

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
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-[720px] px-5 pt-8 pb-20">
      <header className="mb-8">
        <p className="mb-1 text-[0.85rem] font-extrabold text-primary">いこたび UIライブラリ</p>
        <h1 className="mb-2.5 text-[1.6rem]">コンポーネント一覧</h1>
        <p className="max-w-[56ch] text-foreground opacity-70">
          Figma完成デザインのトークン（Tailwind v4 + CSS変数）に合わせた部品集。
          ここでの見た目の変更は<code className={CODE_CLASS}>components/ui/primitives</code>・<code className={CODE_CLASS}>components/ui</code>を直せば全画面に反映される。
        </p>
      </header>

      <Section title="カラートークン">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
          {([
            ["--primary", "メイン（#48BFAE）"],
            ["--foreground", "文字（#272727）"],
            ["--background", "画面背景（白）"],
            ["--secondary", "差し色"],
            ["--border", "枠線"],
            ["--muted", "ミュート"],
          ] as const).map(([token, label]) => (
            <div className="flex flex-col gap-1" key={token}>
              <span className="block h-10 w-full rounded-[10px] border border-border" style={{ background: `var(${token})` }} />
              <code className={CODE_CLASS}>{token}</code>
              <span className="text-[0.82rem] text-muted-foreground">{label}</span>
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
        <div className="max-w-[360px]">
          <TextField label="部屋の名前" placeholder="例：卒業旅行メンバー" hint="20文字まで" />
          <TextField label="エラー例" defaultValue="12345" error="正しい形式で入力してください" />
          <DateRangeField start={start} end={end} onChangeStart={setStart} onChangeEnd={setEnd} />
          <Stepper label="人数" value={stepper} onChange={setStepper} />
        </div>
      </Section>

      <Section title="Switch">
        <div className="max-w-[360px]">
          <Card>
            <Switch checked={switchOn} onChange={setSwitchOn} label="選んだタグをメンバーに見せる" sub="初期値はオフ" />
          </Card>
        </div>
      </Section>

      <Section title="Chip（ハッシュタグ）">
        <div className="flex flex-wrap gap-2">
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
        <div className="max-w-[360px]">
          <Card>
            <h3>カード見出し</h3>
            <p className="text-[0.82rem] text-muted-foreground">白背景・角丸・薄い枠線のベースコンポーネント。</p>
          </Card>
        </div>
      </Section>

      <Section title="AppHeader / ProgressSteps">
        <div className="max-w-[380px] overflow-hidden rounded-md border border-dashed border-border">
          <AppHeader eyebrow="グループ作成" title={"旅行のグループを\n作りましょう！"} backHref="#">
            <SpeechBubbleSticker />
          </AppHeader>
          <ProgressSteps status="destination" />
        </div>
        <div className="mt-3 max-w-[380px] overflow-hidden rounded-md border border-dashed border-border">
          <AppHeader dark eyebrow="2026.11.20 〜 11.21" title="決定まとめ" />
        </div>
      </Section>

      <Section title="BottomBar / Toast / Spinner">
        <div className="max-w-[380px] overflow-hidden rounded-md border border-dashed border-border">
          <BottomBar note="幹事はいつでも今の投票で決められます">
            <Button variant="primary" block>
              投票する
            </Button>
          </BottomBar>
        </div>
        <Row className="mt-3">
          <Button variant="quiet" onClick={() => setToastOn(true)}>
            トーストを表示
          </Button>
        </Row>
        <div className="mt-3 max-w-[380px] overflow-hidden rounded-md border border-dashed border-border">
          <Spinner />
        </div>
        {toastOn && <Toast message="保存しました" />}
      </Section>
    </div>
  );
}

function Section({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-3.5 border-b-2 border-border pb-2 text-[1rem]">{title}</h2>
      {children}
    </section>
  );
}

function Row({
  children,
  className,
  style,
}: {
  readonly children: ReactNode;
  readonly className?: string;
  readonly style?: CSSProperties;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className ?? ""}`} style={style}>
      {children}
    </div>
  );
}
