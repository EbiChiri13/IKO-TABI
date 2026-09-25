import Card from "@/components/ui/Card";
import { Button as PrimitiveButton } from "@/components/ui/primitives/button";
import { cn } from "@/lib/utils";
import type { Tag, TagCategory as ApiTagCategory } from "@/lib/api";

type TagCategoryProps = Pick<ApiTagCategory, "label" | "tags"> & {
  readonly selectedIds: ReadonlySet<Tag["id"]>;
  readonly onToggle: (id: Tag["id"]) => void;
};

/** 4つの質問のうち1つぶん（Figma 363:6485 の白い選択カード・13pxチップ）。1つ以上選ぶと ok 表示になる【F-04】 */
export default function TagCategory({ label, tags, selectedIds, onToggle }: TagCategoryProps) {
  const count = tags.filter((t) => selectedIds.has(t.id)).length;
  return (
    <Card as="section">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-[15px] font-bold">{label}</h3>
        <span className={cn("whitespace-nowrap text-[12px]", count > 0 ? "font-bold text-foreground" : "text-muted-foreground")}>
          {count > 0 ? `${count}個選択中` : "1つ以上選んでください"}
        </span>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2">
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
                "h-auto min-h-[34px] cursor-pointer whitespace-pre rounded-full border-[1.5px] px-3.5 py-1.5 text-[13px] font-bold shadow-none transition-colors duration-150",
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
