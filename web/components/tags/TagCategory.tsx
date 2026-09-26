import Card from "@/components/ui/Card";
import { Button as PrimitiveButton } from "@/components/ui/primitives/button";
import type { TagCategory as ApiTagCategory, Tag } from "@/lib/api";
import { cn } from "@/lib/utils";

type TagCategoryProps = Pick<ApiTagCategory, "label" | "tags"> & {
  readonly selectedIds: ReadonlySet<Tag["id"]>;
  readonly onToggle: (id: Tag["id"]) => void;
};

/** 4つの質問のうち1つぶん（Figma 473:4521 の白い選択カード・33pxチップ）。1つ以上選ぶと ok 表示になる【F-04】 */
export default function TagCategory({ label, tags, selectedIds, onToggle }: TagCategoryProps) {
  return (
    <Card as="section">
      <h3 className="text-[15px] font-bold">{label}</h3>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {tags.map((t) => {
          const selected = selectedIds.has(t.id);
          return (
            <PrimitiveButton
              key={t.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onToggle(t.id)}
              variant="outline"
              className={cn(
                "h-[33px] cursor-pointer whitespace-pre rounded-full border-[0.5px] px-3.5 py-0 text-[13px] shadow-none transition-colors duration-150",
                selected
                  ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-foreground/5 hover:text-foreground",
              )}
            >
              {selected ? `✕  ${t.label}` : t.label}
            </PrimitiveButton>
          );
        })}
      </div>
    </Card>
  );
}
