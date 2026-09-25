import Link from "next/link";
import { CalendarIcon, ChevronRightIcon } from "@/components/icons";
import AvatarStack from "@/components/ui/AvatarStack";

type GroupListItemProps = {
  readonly groupId: string;
  readonly name: string;
  readonly dateLabel: string;
  readonly memberNames?: readonly string[];
};

/** ホーム「所属グループ」の1行（Figma 473:5133）：サムネ／名前／日付／アバター／シェブロン */
export default function GroupListItem({ groupId, name, dateLabel, memberNames = [] }: GroupListItemProps) {
  return (
    <Link
      href={`/groups/${groupId}`}
      className="flex h-[45px] items-center gap-3 border-b border-border bg-background px-4 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        className="grid size-11 shrink-0 place-items-center rounded-sm bg-secondary text-[13px] font-black text-secondary-foreground"
        aria-hidden="true"
      >
        {name ? name[0] : "?"}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[17px] font-normal leading-none">{name}</span>
        <span className="flex items-center gap-1 text-[10px] leading-none text-muted-foreground">
          <CalendarIcon size={11} />
          {dateLabel}
        </span>
      </span>
      <AvatarStack names={memberNames} max={2} />
      <ChevronRightIcon size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  );
}
