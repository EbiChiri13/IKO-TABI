import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import type { CandidateItem, TargetType } from "@/lib/api";
import { cn } from "@/lib/utils";

type CandidateCardProps = {
  readonly item: CandidateItem;
  readonly type: TargetType;
  readonly onToggle: (id: CandidateItem["id"]) => void;
  readonly locked: boolean;
  readonly selected: boolean;
};

/** 行き先・宿・ごはん・スポットに共通の候補カード（Figma投票カード：写真＋タイトル＋タグ＋teal/ink投票CTA） */
export default function CandidateCard({ item, type, onToggle, locked, selected }: CandidateCardProps) {
  const selectable = !locked && !item.decided;
  return (
    <Card
      className={cn("w-full max-w-[380px] gap-0 overflow-hidden p-0", (selected || item.decided) && "bg-primary/10")}
    >
      <div className="mx-auto mt-2.5 h-1 w-9 rounded-full bg-border" aria-hidden="true" />
      <div
        className="mt-2 h-[170px] bg-border bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${item.image})` }}
      >
        <div className="flex items-start justify-between p-3">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-background text-[0.85rem] font-black text-foreground shadow-card">
            {item.rank}
          </span>
          {item.decided && (
            <span className="rounded-full bg-primary px-3 py-[3px] text-xs font-extrabold text-primary-foreground">
              決定！
            </span>
          )}
        </div>
        {item.image_credit && (
          <span className="ml-3 inline-block rounded-full bg-black/45 px-2 py-0.5 text-[0.65rem] text-white">
            {item.image_credit}
          </span>
        )}
      </div>
      <div className="flex flex-col px-[18px] pt-3.5 pb-[18px]">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-xl font-bold">
            {item.name}
            {type === "destination" && (
              <span className="text-sm font-medium text-muted-foreground">（{item.area}）</span>
            )}
          </h3>
          <span className="flex-none text-[1.3rem] leading-none font-black text-foreground">
            {item.match}
            <small className="text-xs">%</small>
          </span>
        </div>

        <p className="mt-2 flex flex-wrap gap-1.5">
          {item.tags.slice(0, 4).map((t) => (
            <span key={t} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-foreground/80">
              #{t}
            </span>
          ))}
        </p>

        <p className="mt-2 text-sm text-foreground/80">{item.reason}</p>

        <div className="mt-2.5 mb-3.5 flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
          <span className="rounded-full bg-secondary px-2.5 py-0.5 font-bold text-secondary-foreground">
            {item.member_count}人中{item.matched_count}人の希望にマッチ
          </span>
          {item.price !== undefined && (
            <span>{item.price > 0 ? `1人あたり ${item.price.toLocaleString()}円〜` : "無料"}</span>
          )}
          {item.ticket && <span>チケット必要</span>}
        </div>

        <Button
          type="button"
          block
          variant="primary"
          aria-pressed={selected}
          disabled={!selectable}
          onClick={() => selectable && onToggle(item.id)}
          className={cn(selected && "border-foreground bg-foreground text-background hover:bg-foreground/90")}
        >
          {item.decided
            ? "この候補に決定しました"
            : selected
              ? locked
                ? "投票済み"
                : "選択中（タップで取り消す）"
              : "この行き先に投票する"}
          <span className="text-sm font-bold opacity-85">{item.votes}票</span>
        </Button>
      </div>
    </Card>
  );
}
