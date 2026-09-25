import type { CandidateItem, TargetType } from "@/lib/api";
import CandidateCard from "./CandidateCard";

type CandidateListProps = {
  readonly items: readonly CandidateItem[];
  readonly type: TargetType;
  readonly onToggle: (id: CandidateItem["id"]) => void;
  readonly locked: boolean;
  readonly selectedIds: ReadonlySet<CandidateItem["id"]>;
};

/** 候補一覧（行き先・宿・ごはん・スポット共通） */
export default function CandidateList({ items, type, onToggle, locked, selectedIds }: CandidateListProps) {
  return (
    <div className="flex w-full max-w-[380px] flex-col gap-4">
      {items.map((item) => (
        <CandidateCard
          key={item.id}
          item={item}
          type={type}
          onToggle={onToggle}
          locked={locked}
          selected={selectedIds.has(item.id)}
        />
      ))}
    </div>
  );
}
