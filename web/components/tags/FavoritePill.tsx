"use client";

import { Button as PrimitiveButton } from "@/components/ui/primitives/button";
import { cn } from "@/lib/utils";

type FavoritePillProps = {
  readonly label: string;
  readonly selected: boolean;
  /** 他のピルが既に選ばれていて、これは選べない状態（disabled + 薄いグレー表示） */
  readonly dimmed: boolean;
  readonly onClick: () => void;
};

/**
 * お気に入り選定画面のピル（Figma 473:5083 の 154×66 2列グリッド）。
 * 選んだもの（＝譲れないこと）はダーク表示のまま残し、他の未選択のピルは disabled + 薄いグレーにして
 * 「選んだかどうか分からない」を防ぐ（単一選択なので、選択中のピルをもう一度タップすると選び直せる）。
 */
export default function FavoritePill({ label, selected, dimmed, onClick }: FavoritePillProps) {
  return (
    <PrimitiveButton
      type="button"
      aria-pressed={selected}
      disabled={dimmed}
      onClick={onClick}
      variant="ghost"
      className={cn(
        "h-[66px] w-full rounded-full px-3 text-base font-extrabold shadow-card transition-transform duration-75 active:scale-[0.98] disabled:active:scale-100",
        selected
          ? "cursor-pointer border-foreground bg-foreground text-background hover:bg-foreground/90"
          : dimmed
            ? "cursor-not-allowed border-border bg-muted text-muted-foreground shadow-none"
            : "cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
      )}
    >
      {label}
    </PrimitiveButton>
  );
}
