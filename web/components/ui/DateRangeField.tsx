"use client";

import { Input } from "@/components/ui/primitives/input";

type DateRangeFieldProps = {
  readonly label?: string;
  readonly start: string;
  readonly end: string;
  readonly onChangeStart: (value: string) => void;
  readonly onChangeEnd: (value: string) => void;
  readonly error?: string;
};

const INPUT_CLASS = "h-auto min-h-[47px] rounded-md border-[1.5px] px-4 py-2 text-base font-medium md:text-base";

/** グループ作成画面の「日程」欄：出発日 → 帰る日 */
export default function DateRangeField({
  label = "日程",
  start,
  end,
  onChangeStart,
  onChangeEnd,
  error,
}: DateRangeFieldProps) {
  return (
    <div className="mb-4 font-sans font-bold">
      <span className="mb-1.5 block">{label}</span>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <Input
          type="date"
          className={INPUT_CLASS}
          value={start}
          onChange={(e) => onChangeStart(e.target.value)}
          aria-label="出発日"
        />
        <span aria-hidden="true" className="font-bold text-muted-foreground">
          →
        </span>
        <Input
          type="date"
          className={INPUT_CLASS}
          value={end}
          onChange={(e) => onChangeEnd(e.target.value)}
          aria-label="帰る日"
          min={start || undefined}
        />
      </div>
      {error && <span className="mt-1.5 block font-medium text-[0.82rem] text-destructive">{error}</span>}
    </div>
  );
}
