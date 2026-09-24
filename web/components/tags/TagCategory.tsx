import Chip from "@/components/ui/Chip";

/** 4つの質問のうち1つぶん（例：どこ行きたい？）。1つ以上選ぶと ok 表示になる【F-04】 */
export default function TagCategory({ label, tags, selectedIds, onToggle }) {
  const count = tags.filter((t) => selectedIds.has(t.id)).length;
  return (
    <section className="q">
      <div className="q-head">
        <h3>{label}</h3>
        <span className={count > 0 ? "count count--ok" : "count"}>{count > 0 ? `${count}個選択中` : "1つ以上選んでください"}</span>
      </div>
      <div className="chips">
        {tags.map((t) => (
          <Chip key={t.id} label={t.label} selected={selectedIds.has(t.id)} onClick={() => onToggle(t.id)} />
        ))}
      </div>
      <style jsx>{`
        .q { margin-bottom: 24px; }
        .q-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; gap: 8px; }
        h3 { font-size: 1rem; }
        .count { font-size: 0.78rem; color: var(--ink-400); white-space: nowrap; }
        .count--ok { color: var(--teal-700); font-weight: 700; }
        .chips { display: flex; flex-wrap: wrap; gap: 8px; }
      `}</style>
    </section>
  );
}
