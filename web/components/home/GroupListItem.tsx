import Link from "next/link";
import Badge from "@/components/ui/Badge";
import AvatarStack from "@/components/ui/AvatarStack";
import type { GroupStatus } from "@/lib/api";

const STATUS_LABEL = {
  collecting: "希望集め中",
  destination: "行き先を投票中",
  lodging: "宿を投票中",
  food: "ごはんを投票中",
  spot: "スポットを投票中",
  done: "決定ずみ",
} satisfies Record<GroupStatus, string>;

type GroupListItemProps = {
  readonly groupId: string;
  readonly name: string;
  readonly dateLabel: string;
  readonly note?: string;
  readonly memberNames?: readonly string[];
  readonly status: keyof typeof STATUS_LABEL;
};

/** ホーム画面「所属グループ」の1行（design: エビチリ / 同期仲良しグル） */
export default function GroupListItem({ groupId, name, dateLabel, note, memberNames = [], status }: GroupListItemProps) {
  return (
    <Link href={`/groups/${groupId}`} className="item">
      <span className="avatar" aria-hidden="true">
        {name ? name[0] : "?"}
      </span>
      <span className="body">
        <span className="row1">
          <Badge tone={status === "done" ? "ok" : "wait"}>
            {STATUS_LABEL[status] ?? "未定"}
          </Badge>
          <span className="name">{name}</span>
          <span className="date">{dateLabel}</span>
        </span>
        {note && <span className="note">{note}</span>}
      </span>
      <AvatarStack names={memberNames} max={2} />
      <span className="chev" aria-hidden="true">›</span>
      <style jsx>{`
        .item {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 0; text-decoration: none; color: inherit;
          border-top: 1px solid var(--line);
        }
        .item:first-child { border-top: 0; }
        .avatar {
          width: 40px; height: 40px; border-radius: 12px; flex: none;
          background: var(--cream-100); color: var(--ink-400);
          display: grid; place-items: center; font-weight: 800;
        }
        .body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .row1 { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
        .name { font-weight: 800; }
        .date { font-size: 0.78rem; color: var(--ink-400); }
        .note { font-size: 0.8rem; color: var(--ink-400); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .chev { color: var(--ink-400); font-size: 1.3rem; }
      `}</style>
    </Link>
  );
}
