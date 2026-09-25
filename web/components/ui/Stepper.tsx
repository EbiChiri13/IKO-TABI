"use client";

import { Button as PrimitiveButton } from "@/components/ui/primitives/button";

type StepperProps = {
  readonly label?: string;
  readonly value: number;
  readonly min?: number;
  readonly max?: number;
  readonly onChange: (value: number) => void;
};

const BTN_CLASS =
  "size-[25px] cursor-pointer rounded-full border border-border bg-background p-0 text-[0.95rem] font-bold text-foreground shadow-none hover:bg-foreground/5 hover:text-foreground disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-40";

/**
 * 人数などの +/- 入力（グループ作成画面：2〜4人）。
 * Figma 473:5101 は 118×40 の角丸を1つ置き、その中に 25×25 の − / 数値 / ＋ を並べる形。
 */
export default function Stepper({ label, value, min = 2, max = 4, onChange }: StepperProps) {
  return (
    <div className="mb-4 font-sans font-bold">
      {label && <span className="mb-1.5 block">{label}</span>}
      <div
        className="inline-flex h-[40px] w-[118px] items-center justify-between rounded-md border-[1.5px] border-border bg-background px-2.5"
        role="group"
        aria-label={label}
      >
        <PrimitiveButton
          type="button"
          variant="outline"
          size="icon"
          className={BTN_CLASS}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label="減らす"
        >
          −
        </PrimitiveButton>
        <span className="min-w-[1.5em] text-center text-[1.2rem] font-extrabold" aria-live="polite">
          {value}
        </span>
        <PrimitiveButton
          type="button"
          variant="outline"
          size="icon"
          className={BTN_CLASS}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label="増やす"
        >
          ＋
        </PrimitiveButton>
      </div>
    </div>
  );
}
