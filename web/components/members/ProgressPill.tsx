type ProgressPillProps = {
  readonly answered: number;
  readonly total: number;
};

/** 投票待ち画面の横長プログレスバー（Figma 473:4905）。track 48px・primary塗りで回答状況を表す。 */
export default function ProgressPill({ answered, total }: ProgressPillProps) {
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
  return (
    <div className="text-center">
      <div className="h-12 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary motion-safe:transition-[width] motion-safe:duration-300 motion-safe:ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2.5 font-bold text-foreground">
        {answered}/{total}人が投票済み
      </p>
    </div>
  );
}
