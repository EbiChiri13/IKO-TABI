import Badge from "@/components/ui/Badge";
import type { GroupMember } from "@/lib/api";

/** メンバー1人分の行（回答待ち画面）。公開を選んだ人だけタグが見える【Q16】 */
export default function MemberRow({ nickname, role, answered, is_me: isMe, tags }: GroupMember) {
  return (
    <li className="border-t border-border py-2.5 first:border-t-0">
      <div className="flex items-center gap-2">
        <span className="font-extrabold">
          {nickname}
          {isMe && <span className="text-[0.82rem] font-medium text-muted-foreground">（あなた）</span>}
        </span>
        {role === "host" && <Badge tone="host">幹事</Badge>}
        <span className="flex-1" />
        <Badge tone={answered ? "ok" : "wait"}>{answered ? "回答済み" : "未回答"}</Badge>
      </div>
      {tags && (
        <p className="mt-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="mr-1 mt-0.5 inline-block rounded-full bg-muted px-[9px] py-[2px] text-[0.75rem] text-foreground"
            >
              #{t}
            </span>
          ))}
        </p>
      )}
    </li>
  );
}
