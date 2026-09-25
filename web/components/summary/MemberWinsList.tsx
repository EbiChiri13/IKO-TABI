import type { SummaryMemberWin } from "@/lib/api";

type MemberWinsListProps = {
  readonly members: readonly SummaryMemberWin[];
};

/** 決定まとめ：メンバーごとに、かなった希望の数を表示する【Q2】 */
export default function MemberWinsList({ members }: MemberWinsListProps) {
  return (
    <ul className="m-0 list-none p-0">
      {members.map((m) => (
        <li
          key={m.nickname}
          className="grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-0.5 border-t border-dashed border-border py-2.5 first:border-t-0"
        >
          <span className="row-span-2 flex flex-col items-center justify-center">
            <span className="text-[1.5rem] leading-none font-black text-foreground">{m.wins}</span>
            <span className="text-[0.65rem] text-muted-foreground">個かなった</span>
          </span>
          <span className="self-end font-extrabold">{m.nickname}</span>
          <span className="text-[0.8rem] text-muted-foreground">
            {m.detail.destination > 0 && "行き先"}
            {m.detail.lodging > 0 && " ・宿"}
            {m.detail.food > 0 && ` ・ごはん×${m.detail.food}`}
            {m.detail.spot > 0 && ` ・スポット×${m.detail.spot}`}
          </span>
        </li>
      ))}
    </ul>
  );
}
