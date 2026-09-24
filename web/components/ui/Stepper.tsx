"use client";

type StepperProps = {
  readonly label?: string;
  readonly value: number;
  readonly min?: number;
  readonly max?: number;
  readonly onChange: (value: number) => void;
};

/** 人数などの +/- 入力（グループ作成画面：2〜4人） */
export default function Stepper({ label, value, min = 2, max = 4, onChange }: StepperProps) {
  return (
    <div className="field">
      {label && <span className="field-label">{label}</span>}
      <div className="stepper" role="group" aria-label={label}>
        <button
          type="button"
          className="stepper-btn"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label="減らす"
        >
          −
        </button>
        <span className="stepper-value" aria-live="polite">{value}</span>
        <button
          type="button"
          className="stepper-btn"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label="増やす"
        >
          ＋
        </button>
      </div>
      <style jsx>{`
        .field { margin-bottom: 16px; font-weight: 700; }
        .field-label { display: block; margin-bottom: 6px; }
        .stepper { display: inline-flex; align-items: center; gap: 16px; }
        .stepper-btn {
          appearance: none; cursor: pointer;
          width: 40px; height: 40px; border-radius: 50%;
          border: 1.5px solid var(--line); background: var(--white);
          font-size: 1.1rem; font-weight: 700; color: var(--teal-700);
          display: grid; place-items: center;
        }
        .stepper-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .stepper-value { min-width: 1.5em; text-align: center; font-size: 1.2rem; font-weight: 800; }
      `}</style>
    </div>
  );
}
