type ProgressPillProps = {
  readonly answered: number;
  readonly total: number;
};

/** 投票待ち画面の横長プログレスバー（design: 完成版 投票待ち画面） */
export default function ProgressPill({ answered, total }: ProgressPillProps) {
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
  return (
    <div className="text-center">
      <div className="h-11 rounded-pill bg-line overflow-hidden">
        <div className="h-full bg-teal-600 rounded-pill transition-[width] duration-300 ease-out" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2.5 font-bold text-ink-600">
        {answered}/{total}人が投票済み
      </p>
    </div>
  );
}
