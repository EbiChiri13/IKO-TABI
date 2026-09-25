import { cn } from "@/lib/utils";

type TagChipListProps = {
  readonly labels: readonly string[];
  readonly highlight?: string | null;
};

/** タグを丸ピルで並べて表示するだけの表示用コンポーネント。譲れないタグは黄色にする。 */
export default function TagChipList({ labels, highlight }: TagChipListProps) {
  return (
    <p className="m-0 flex flex-wrap gap-2">
      {labels.map((label) => (
        <span
          key={label}
          className={cn(
            "inline-block rounded-full px-4 py-2 text-[0.88rem] font-bold",
            label === highlight ? "bg-highlight text-foreground" : "bg-primary text-primary-foreground",
          )}
        >
          {label}
        </span>
      ))}
    </p>
  );
}
