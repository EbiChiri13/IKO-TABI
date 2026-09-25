type TagResultBarProps = {
  readonly label: string;
  readonly count: number;
  readonly total: number;
};

/** 投票結果画面の横棒（Figma 473:4678、バー高25px）。何人が選んだかの割合を表す。 */
export default function TagResultBar({ label, count, total }: TagResultBarProps) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="mb-3 grid grid-cols-[84px_1fr] items-center gap-3">
      <span className="text-right text-[0.85rem] font-bold text-foreground">{label}</span>
      <span className="block h-[25px] overflow-hidden rounded-full bg-border">
        <span className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </span>
    </div>
  );
}
