import type { GroupStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

const STEPS = ["ハッシュタグ", "お気に入り", "行き先", "宿泊", "食事", "観光地"] as const;

// グループの status から、6段のうち何段目にあたるかへ変換（favorite だけは
// バックエンド側に専用のstatusが無いので、呼び出し側で明示的に step を渡す）
const STEP_INDEX: Record<GroupStatus, number> = {
  collecting: 0,
  destination: 2,
  places: 3,
  done: 5,
};

type ProgressStepsProps = {
  readonly status?: GroupStatus;
  /** 1〜6。渡すとこちらを優先し、省略時は status から推定する */
  readonly step?: number;
  readonly className?: string;
};

/**
 * 上部に出す6分割の進み具合バー。Figma 完成版（473:4521 / 473:4723 等）では
 * 画面幅いっぱいではなく中央寄せの 264px（1本38px＋すきま7px）で描かれている。
 */
export default function ProgressSteps({ status, step, className }: ProgressStepsProps) {
  const current = step ? step - 1 : ((status ? STEP_INDEX[status] : 0) ?? 0);
  return (
    <ol
      className={cn("m-0! flex w-[264px] list-none! items-center gap-[7px] bg-transparent p-0!", className)}
      aria-label="旅行を決める進み具合"
    >
      {STEPS.map((label, i) => (
        <li
          key={label}
          className={cn("h-[7px] flex-1 rounded-[4px]", i <= current ? "bg-primary" : "bg-border")}
          aria-current={i === current}
        >
          <span className="visually-hidden">{label}</span>
        </li>
      ))}
    </ol>
  );
}
