import CandidateCard from "./CandidateCard";

/** 候補一覧（行き先・宿・ごはん・スポット共通） */
export default function CandidateList({ items, type, onToggle, locked }) {
  return (
    <div className="list">
      {items.map((item) => (
        <CandidateCard key={item.id} item={item} type={type} onToggle={onToggle} locked={locked} />
      ))}
      <style jsx>{`
        .list { display: flex; flex-direction: column; }
      `}</style>
    </div>
  );
}
