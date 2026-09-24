/** 行き先・宿・ごはん・スポットに共通の候補カード（design: 行き先選定＝写真＋番号バッジ＋大きなボタン） */
export default function CandidateCard({ item, type, rankLabel, onToggle, locked }) {
  const selectable = !locked && !item.decided;
  return (
    <div className={`card ${item.my_vote ? "card--picked" : ""} ${item.decided ? "card--decided" : ""}`}>
      <div className="handle" aria-hidden="true" />
      <div className="photo" style={{ backgroundImage: `url(${item.image})` }}>
        <span className="badge">{item.rank}</span>
        {item.decided && <span className="chosen">決定！</span>}
      </div>
      <div className="info">
        <div className="head">
          <h3>
            {item.name}
            {type === "destination" && <span className="area">（{item.area}）</span>}
          </h3>
          <span className="match">
            {item.match}
            <small>%</small>
          </span>
        </div>

        <p className="tags">
          {item.tags.slice(0, 4).map((t) => (
            <span key={t} className="tag">
              #{t}
            </span>
          ))}
        </p>

        <p className="reason">{item.reason}</p>

        <div className="meta">
          <span className="who">
            {item.member_count}人中{item.matched_count}人の希望にマッチ
          </span>
          {"price" in item && (
            <span>{item.price > 0 ? `1人あたり ${item.price.toLocaleString()}円〜` : "無料"}</span>
          )}
          {item.ticket && <span>チケット必要</span>}
        </div>

        <button
          type="button"
          className="vote-btn"
          aria-pressed={item.my_vote}
          disabled={!selectable}
          onClick={() => selectable && onToggle(item.id)}
        >
          {item.decided ? "この候補に決定しました" : item.my_vote ? "投票済み（タップで取り消す）" : "この行き先に投票する"}
          <span className="votes">{item.votes}票</span>
        </button>
      </div>
      <style jsx>{`
        .card {
          background: var(--white);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-card);
          margin-bottom: 16px;
          border: 2px solid transparent;
        }
        .card--picked { border-color: var(--teal-600); }
        .card--decided { border-color: var(--teal-600); }
        .handle {
          width: 36px; height: 4px; border-radius: 2px; background: var(--line);
          margin: 10px auto 0;
        }
        .photo {
          position: relative;
          height: 170px;
          margin-top: 8px;
          background: var(--line) center/cover no-repeat;
        }
        .badge {
          position: absolute; top: 12px; left: 12px;
          width: 28px; height: 28px; border-radius: 50%;
          background: var(--white); color: var(--teal-700);
          display: grid; place-items: center;
          font-weight: 900; font-size: 0.85rem;
          box-shadow: var(--shadow-card);
        }
        .chosen {
          position: absolute; top: 12px; right: 12px;
          background: var(--teal-600); color: var(--white);
          font-size: 0.72rem; font-weight: 800; padding: 3px 12px; border-radius: var(--radius-pill);
        }
        .info { padding: 14px 18px 18px; }
        .head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
        h3 { font-size: 1.25rem; }
        .area { font-size: 0.82rem; color: var(--ink-400); font-weight: 500; }
        .match { font-size: 1.3rem; font-weight: 900; color: var(--teal-700); flex: none; }
        .match small { font-size: 0.7rem; }
        .tags { margin: 8px 0 0; }
        .tag {
          display: inline-block; font-size: 0.75rem; padding: 2px 10px; border-radius: var(--radius-pill);
          background: var(--cream-100); color: var(--ink-600); margin: 0 6px 4px 0;
        }
        .reason { font-size: 0.85rem; color: var(--ink-600); margin: 8px 0 0; }
        .meta {
          display: flex; gap: 10px; flex-wrap: wrap; align-items: center;
          margin: 10px 0 14px; font-size: 0.78rem; color: var(--ink-400);
        }
        .who {
          background: color-mix(in srgb, var(--mint-400) 45%, white); color: var(--teal-700);
          padding: 2px 10px; border-radius: var(--radius-pill); font-weight: 700;
        }
        .vote-btn {
          appearance: none; cursor: pointer; width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          min-height: 52px; border: 0; border-radius: var(--radius-pill);
          background: var(--teal-600); color: var(--white);
          font-weight: 800; font-size: 0.98rem;
        }
        .vote-btn:disabled { opacity: 0.6; cursor: default; }
        .vote-btn[aria-pressed="true"] { background: var(--teal-900); }
        .votes { font-weight: 700; font-size: 0.82rem; opacity: 0.85; }
      `}</style>
    </div>
  );
}
