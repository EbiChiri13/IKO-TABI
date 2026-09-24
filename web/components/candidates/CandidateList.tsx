import CandidateCard from "./CandidateCard";
import type { CandidateItem, TargetType } from "@/lib/api";

type CandidateListProps = {
  readonly items: readonly CandidateItem[];
  readonly type: TargetType;
  readonly onToggle: (id: CandidateItem["id"]) => void;
  readonly locked: boolean;
};

/** 候補一覧（行き先・宿・ごはん・スポット共通） */
export default function CandidateList({ items, type, onToggle, locked }: CandidateListProps) {
  return (
    <div className="flex flex-col">
      {items.map((item) => (
        <CandidateCard key={item.id} item={item} type={type} onToggle={onToggle} locked={locked} />
      ))}
    </div>
  );
}
