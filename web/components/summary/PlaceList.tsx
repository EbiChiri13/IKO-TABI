import type { PlaceSummary } from "@/lib/api";

type PlaceListProps = {
  readonly title: string;
  readonly places: readonly PlaceSummary[];
};

/** 決定まとめ：宿・ごはん・スポットの決定内容 */
export default function PlaceList({ title, places }: PlaceListProps) {
  if (!places || places.length === 0) return null;
  return (
    <section className="section">
      <h3>{title}</h3>
      <ul className="list">
        {places.map((p) => (
          <li key={p.id} className="row">
            <span className="name">{p.name}</span>
            <span className="price">{p.price > 0 ? `${p.price.toLocaleString()}円〜` : "無料"}</span>
          </li>
        ))}
      </ul>
      <style jsx>{`
        .section { margin-bottom: 18px; }
        h3 { font-size: 0.9rem; color: var(--ink-400); margin-bottom: 8px; }
        .list { list-style: none; margin: 0; padding: 0; }
        .row {
          display: flex; justify-content: space-between; padding: 8px 0;
          border-top: 1px solid var(--line); font-weight: 700;
        }
        .row:first-child { border-top: 0; }
        .price { color: var(--ink-400); font-weight: 500; font-size: 0.85rem; }
      `}</style>
    </section>
  );
}
