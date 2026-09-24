type TagResultBarProps = {
  readonly label: string;
  readonly count: number;
  readonly total: number;
};

/** 投票結果画面の横棒（design: 完成版 投票確認画面）。何人が選んだかの割合を表す。 */
export default function TagResultBar({ label, count, total }: TagResultBarProps) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="row">
      <span className="label">{label}</span>
      <span className="track">
        <span className="fill" style={{ width: `${pct}%` }} />
      </span>
      <style jsx>{`
        .row { display: grid; grid-template-columns: 84px 1fr; align-items: center; gap: 12px; margin-bottom: 12px; }
        .label { font-size: 0.85rem; font-weight: 700; color: var(--ink-600); text-align: right; }
        .track { height: 30px; border-radius: var(--radius-pill); background: var(--line); overflow: hidden; }
        .fill { display: block; height: 100%; background: var(--teal-600); border-radius: var(--radius-pill); }
      `}</style>
    </div>
  );
}
