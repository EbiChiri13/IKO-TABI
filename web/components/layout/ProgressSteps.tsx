import type { GroupStatus } from "@/lib/api";

const STEPS = ["ハッシュタグ", "お気に入り", "行き先", "宿泊", "食事", "観光地"] as const;

// グループの status から、6段のうち何段目にあたるかへ変換（favorite だけは
// バックエンド側に専用のstatusが無いので、呼び出し側で明示的に step を渡す）
const STEP_INDEX: Record<GroupStatus, number> = {
  collecting: 0,
  destination: 2,
  lodging: 3,
  food: 4,
  spot: 5,
  done: 5,
};

type ProgressStepsProps = {
  readonly status?: GroupStatus;
  /** 1〜6。渡すとこちらを優先し、省略時は status から推定する */
  readonly step?: number;
};

/** 全画面の上部に出す、6分割の進み具合バー（Figma「緑変えてみた」準拠）。 */
export default function ProgressSteps({ status, step }: ProgressStepsProps) {
  const current = step ? step - 1 : (status ? STEP_INDEX[status] : 0) ?? 0;
  return (
    <ol className="steps" aria-label="旅行を決める進み具合">
      {STEPS.map((label, i) => (
        <li key={label} className={i < current ? "done" : i === current ? "now" : ""} aria-current={i === current}>
          <span className="visually-hidden">{label}</span>
        </li>
      ))}
      <style jsx>{`
        .steps {
          list-style: none; margin: 0; padding: 14px 20px 0;
          display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px;
          background: var(--cream-200);
        }
        li {
          height: 7px; border-radius: 4px; background: var(--line);
        }
        li.done, li.now { background: var(--teal-600); }
      `}</style>
    </ol>
  );
}
