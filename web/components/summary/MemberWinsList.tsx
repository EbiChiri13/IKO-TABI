import type { SummaryMemberWin } from "@/lib/api";

type MemberWinsListProps = {
  readonly members: readonly SummaryMemberWin[];
};

/** 決定まとめ：メンバーごとに、かなった希望の数を表示する【Q2】 */
export default function MemberWinsList({ members }: MemberWinsListProps) {
  return (
    <ul className="list">
      {members.map((m) => (
        <li key={m.nickname} className="row">
          <span className="wins">
            <span className="num">{m.wins}</span>
            <span className="unit">個かなった</span>
          </span>
          <span className="name">{m.nickname}</span>
          <span className="detail">
            {m.detail.destination > 0 && "行き先"}
            {m.detail.lodging > 0 && " ・宿"}
            {m.detail.food > 0 && ` ・ごはん×${m.detail.food}`}
            {m.detail.spot > 0 && ` ・スポット×${m.detail.spot}`}
          </span>
        </li>
      ))}
      <style jsx>{`
        .list { list-style: none; margin: 0; padding: 0; }
        .row {
          display: grid; grid-template-columns: auto 1fr; gap: 2px 14px;
          padding: 10px 0; border-top: 1px dashed var(--line);
        }
        .row:first-child { border-top: 0; }
        .wins { grid-row: span 2; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .num { font-size: 1.5rem; font-weight: 900; color: var(--teal-700); line-height: 1; }
        .unit { font-size: 0.65rem; color: var(--ink-400); }
        .name { font-weight: 800; align-self: end; }
        .detail { font-size: 0.8rem; color: var(--ink-400); }
      `}</style>
    </ul>
  );
}
