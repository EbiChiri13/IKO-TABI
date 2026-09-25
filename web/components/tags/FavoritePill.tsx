"use client";

import { Button as PrimitiveButton } from "@/components/ui/primitives/button";
import { cn } from "@/lib/utils";

type FavoritePillProps = {
  readonly label: string;
  readonly selected: boolean;
  readonly onClick: () => void;
};

/** お気に入り選定画面のピル（Figma 363:7030 の 154×66 2列グリッド）。選ばれたもの（＝譲れないこと）だけ黄色になる。 */
export default function FavoritePill({ label, selected, onClick }: FavoritePillProps) {
  return (
    <PrimitiveButton
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      variant="ghost"
      className={cn(
        "h-[66px] w-full cursor-pointer rounded-full px-3 text-base font-extrabold shadow-card transition-transform duration-75 active:scale-[0.98]",
        selected
          ? "bg-highlight text-foreground hover:bg-highlight hover:text-foreground"
          : "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
      )}
    >
      {label}
    </PrimitiveButton>
  );
}
