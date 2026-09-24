import type { CandidateItem, TargetType } from "@/lib/api";

type CandidateCardProps = {
  readonly item: CandidateItem;
  readonly type: TargetType;
  readonly onToggle: (id: CandidateItem["id"]) => void;
  readonly locked: boolean;
};

/** 行き先・宿・ごはん・スポットに共通の候補カード（仕様書B 4.2・5.2・5.4） */
export default function CandidateCard({ item, type, onToggle, locked }: CandidateCardProps) {
  const selectable = !locked && !item.decided;
  return (
    <button
      type="button"
      className={`pick ${item.decided ? "pick--decided" : ""}`}
      aria-pressed={item.my_vote}
      onClick={() => selectable && onToggle(item.id)}
      disabled={!selectable}
    >
      <span className="rank">
        {item.rank}位候補
        {item.decided && <span className="chosen">決定！</span>}
      </span>
      <h3>
        {item.name}
        {type === "destination" && <span className="area">（{item.area}）</span>}
      </h3>

      <span className="match">
        <b>
          {item.match}
          <small>%</small>
        </b>
        <span className="who">
          {item.member_count}人中{item.matched_count}人の希望にマッチ
        </span>
      </span>

      <p className="reason">{item.reason}</p>

      <p className="tags">
        {item.tags.slice(0, 6).map((t) => (
          <span key={t} className="tag">
            #{t}
          </span>
        ))}
      </p>

      <div className="meta">
        {item.price !== undefined && <span>{item.price > 0 ? `1人あたり ${item.price.toLocaleString()}円〜` : "無料"}</span>}
        {item.ticket && <span>チケット必要</span>}
        <span className="votes">{item.votes}票</span>
      </div>

      <span className="check" aria-hidden="true">✓</span>
      <style jsx>{`
        .pick {
          position: relative; text-align: left; cursor: pointer; width: 100%;
          background: var(--white); border: 1.5px solid var(--line); border-radius: var(--radius-md);
          padding: 16px; margin-bottom: 12px; box-shadow: var(--shadow-card);
          transition: border-color 0.12s, background 0.12s;
          font: inherit; color: inherit;
        }
        .pick:disabled { cursor: default; }
        .pick[aria-pressed="true"] {
          border-color: var(--teal-600); border-width: 2px; padding: 15px;
          background: color-mix(in srgb, var(--mint-400) 20%, var(--white));
        }
        .pick--decided { border-color: var(--teal-600); }
        .rank { font-size: 0.78rem; color: var(--ink-400); font-weight: 700; display: block; margin-bottom: 2px; }
        .chosen {
          display: inline-block; margin-left: 8px; background: var(--teal-600); color: var(--white);
          font-size: 0.72rem; padding: 1px 10px; border-radius: var(--radius-pill);
        }
        h3 { font-size: 1.1rem; padding-right: 36px; }
        .area { font-size: 0.85rem; color: var(--ink-400); font-weight: 500; }
        .match { display: flex; align-items: baseline; gap: 10px; margin: 8px 0; flex-wrap: wrap; }
        .match b { font-size: 1.6rem; color: var(--teal-700); font-weight: 900; line-height: 1; }
        .match b small { font-size: 0.8rem; }
        .who { font-size: 0.8rem; background: color-mix(in srgb, var(--mint-400) 45%, white); color: var(--teal-700); padding: 2px 10px; border-radius: var(--radius-pill); font-weight: 700; }
        .reason { font-size: 0.88rem; background: var(--cream-100); border-radius: 12px; padding: 10px 12px; margin: 6px 0 10px; }
        .tags { margin: 0 0 10px; }
        .tag { display: inline-block; font-size: 0.72rem; padding: 2px 9px; border-radius: var(--radius-pill); background: var(--cream-100); color: var(--ink-400); margin: 0 4px 4px 0; }
        .meta { display: flex; gap: 14px; flex-wrap: wrap; font-size: 0.82rem; color: var(--ink-400); }
        .votes { font-weight: 800; color: var(--ink-900); }
        .check {
          position: absolute; top: 14px; right: 14px; width: 26px; height: 26px; border-radius: 50%;
          border: 2px solid var(--line); background: var(--white);
          display: grid; place-items: center; font-size: 0.85rem; color: transparent;
        }
        .pick[aria-pressed="true"] .check { background: var(--teal-600); border-color: var(--teal-600); color: var(--white); }
      `}</style>
    </button>
  );
}
