import AvatarStack from "@/components/ui/AvatarStack";

/** ホーム画面「直近の旅行」カード */
export default function TripCard({ photoUrl, name, place, nights, dateLabel, note, memberNames = [] }) {
  return (
    <div className="trip">
      <div className="photo" style={photoUrl ? { backgroundImage: `url(${photoUrl})` } : undefined} />
      <div className="info">
        <div className="head">
          <h3>{name}</h3>
          <span className="meta">
            {place} {nights}
          </span>
        </div>
        <p className="date">{dateLabel}</p>
        {note && <p className="note">{note}</p>}
        <div className="foot">
          <AvatarStack names={memberNames} />
          <span className="count">{memberNames.length}名参加中</span>
        </div>
      </div>
      <style jsx>{`
        .trip {
          background: var(--white); border: 1px solid var(--line);
          border-radius: var(--radius-md); overflow: hidden; box-shadow: var(--shadow-card);
        }
        .photo {
          height: 140px; background: var(--line) center/cover no-repeat;
        }
        .info { padding: 14px 16px; }
        .head { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
        .meta { font-size: 0.8rem; color: var(--ink-400); white-space: nowrap; }
        .date { font-size: 0.8rem; color: var(--ink-400); margin-top: 2px; }
        .note { font-size: 0.85rem; margin-top: 6px; }
        .foot {
          display: flex; align-items: center; justify-content: space-between;
          margin-top: 12px; padding-top: 10px; border-top: 1px dashed var(--line);
        }
        .count { font-size: 0.8rem; color: var(--ink-400); font-weight: 700; }
      `}</style>
    </div>
  );
}
