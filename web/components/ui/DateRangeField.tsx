"use client";

type DateRangeFieldProps = {
  readonly label?: string;
  readonly start: string;
  readonly end: string;
  readonly onChangeStart: (value: string) => void;
  readonly onChangeEnd: (value: string) => void;
  readonly error?: string;
};

/** グループ作成画面の「日程」欄：出発日 → 帰る日 */
export default function DateRangeField({ label = "日程", start, end, onChangeStart, onChangeEnd, error }: DateRangeFieldProps) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className="range">
        <input
          type="date"
          className="range-input"
          value={start}
          onChange={(e) => onChangeStart(e.target.value)}
          aria-label="出発日"
        />
        <span className="arrow" aria-hidden="true">→</span>
        <input
          type="date"
          className="range-input"
          value={end}
          onChange={(e) => onChangeEnd(e.target.value)}
          aria-label="帰る日"
          min={start || undefined}
        />
      </div>
      {error && <span className="field-error">{error}</span>}
      <style jsx>{`
        .field { margin-bottom: 16px; font-weight: 700; }
        .field-label { display: block; margin-bottom: 6px; }
        .range { display: grid; grid-template-columns: 1fr auto 1fr; gap: 8px; align-items: center; }
        .range-input {
          min-height: 52px; padding: 10px 12px; width: 100%;
          border: 1.5px solid var(--line); border-radius: var(--radius-sm);
          background: var(--white); color: var(--ink-900); font: inherit; font-size: 0.95rem;
        }
        .range-input:focus-visible {
          outline: 3px solid color-mix(in srgb, var(--teal-600) 45%, transparent);
        }
        .arrow { color: var(--ink-400); font-weight: 700; }
        .field-error { display: block; margin-top: 6px; color: var(--danger); font-size: 0.82rem; font-weight: 500; }
      `}</style>
    </div>
  );
}
