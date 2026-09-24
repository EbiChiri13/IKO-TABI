type ProgressPillProps = {
  readonly answered: number;
  readonly total: number;
};

/** 投票待ち画面の横長プログレスバー（design: 完成版 投票待ち画面） */
export default function ProgressPill({ answered, total }: ProgressPillProps) {
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
  return (
    <div className="wrap">
      <div className="track">
        <div className="fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="count">
        {answered}/{total}人が投票済み
      </p>
      <style jsx>{`
        .wrap { text-align: center; }
        .track {
          height: 44px; border-radius: var(--radius-pill);
          background: var(--line); overflow: hidden;
        }
        .fill {
          height: 100%; background: var(--teal-600);
          border-radius: var(--radius-pill);
          transition: width 0.3s ease;
        }
        .count { margin-top: 10px; font-weight: 700; color: var(--ink-600); }
      `}</style>
    </div>
  );
}
