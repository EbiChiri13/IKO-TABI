"use client";

import type { MouseEventHandler } from "react";

import { Button as PrimitiveButton } from "@/components/ui/primitives/button";
import { cn } from "@/lib/utils";

type ChipProps = {
  readonly label: string;
  readonly selected?: boolean;
  readonly onClick?: MouseEventHandler<HTMLButtonElement>;
  readonly disabled?: boolean;
};

/** ハッシュタグ選択の丸ピル。#付きで表示する */
export default function Chip({ label, selected = false, onClick, disabled = false }: ChipProps) {
  return (
    <PrimitiveButton
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      disabled={disabled}
      variant="outline"
      className={cn(
        "h-auto min-h-[42px] cursor-pointer gap-0.5 rounded-pill border-[1.5px] px-4 py-2 text-[0.92rem] font-bold shadow-none transition-colors duration-150 disabled:pointer-events-auto disabled:cursor-not-allowed",
        selected
          ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
          : "border-border bg-background text-foreground hover:bg-foreground/5 hover:text-foreground",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(selected ? "text-primary-foreground/75" : "text-muted-foreground")}
      >
        #
      </span>
      {label}
    </PrimitiveButton>
  );
}
