import type { PlaceSummary } from "@/lib/api";

type PlaceTimelineProps = {
  readonly label: string;
  readonly places: readonly PlaceSummary[];
};

/** 決定まとめの縦タイムライン（design: 完成版 計画確定画面）。観光地／食事先／宿泊先で使う。 */
export default function PlaceTimeline({ label, places }: PlaceTimelineProps) {
  if (places.length === 0) return null;
  return (
    <section className="section">
      <span className="flag">{label}</span>
      <ul className="list">
        {places.map((p) => (
          <li key={p.id} className="item">
            <span className="dot" aria-hidden="true" />
            <div className="thumb" style={{ backgroundImage: `url(${p.image})` }} />
            <div className="info">
              <p className="name">{p.name}</p>
              <p className="tags">
                {p.tags.slice(0, 3).map((t) => (
                  <span key={t} className="tag">
                    {t}
                  </span>
                ))}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <style jsx>{`
        .section { position: relative; margin-bottom: 8px; }
        .flag {
          display: inline-block; background: var(--teal-600); color: var(--white);
          font-weight: 800; font-size: 0.85rem; padding: 6px 18px 6px 14px;
          border-radius: 6px 14px 14px 6px; margin-bottom: 10px;
        }
        .list { list-style: none; margin: 0 0 0 12px; padding: 0; border-left: 2px dotted var(--line); }
        .item { position: relative; display: flex; gap: 12px; padding: 10px 0 10px 20px; align-items: center; }
        .dot {
          position: absolute; left: -7px; top: 50%; transform: translateY(-50%);
          width: 12px; height: 12px; border-radius: 50%; background: var(--teal-600);
          border: 2px solid var(--white); box-shadow: 0 0 0 1px var(--line);
        }
        .thumb { width: 56px; height: 56px; border-radius: 14px; background: var(--line) center/cover no-repeat; flex: none; }
        .info { min-width: 0; }
        .name { font-weight: 800; }
        .tags { margin: 2px 0 0; }
        .tag {
          display: inline-block; font-size: 0.72rem; color: var(--ink-400);
          background: var(--cream-100); border-radius: var(--radius-pill); padding: 1px 9px; margin: 2px 4px 0 0;
        }
      `}</style>
    </section>
  );
}
