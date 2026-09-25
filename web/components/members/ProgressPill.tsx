type ProgressPillProps = {
  readonly current: number;
  readonly total: number;
  /** 何の進み具合か（例: 回答 / 投票） */
  readonly unit: string;
};

/** 投票待ち画面の横長プログレスバー（Figma 473:4905）。track 48px・primary塗りで進み具合を表す。 */
export default function ProgressPill({ current, total, unit }: ProgressPillProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="text-center">
      <div className="h-12 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary motion-safe:transition-[width] motion-safe:duration-300 motion-safe:ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2.5 font-bold text-foreground">
        {current}/{total}人が{unit}済み
      </p>
    </div>
  );
}
