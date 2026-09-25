import type { ReactNode } from "react";

import { Badge as PrimitiveBadge } from "@/components/ui/primitives/badge";
import { cn } from "@/lib/utils";

const TONE_CLASS = {
  wait: "border-border bg-muted text-muted-foreground",
  ok: "border-transparent bg-secondary text-secondary-foreground",
  host: "border-transparent bg-primary/15 text-foreground",
} as const;

type BadgeTone = keyof typeof TONE_CLASS;

type BadgeProps = {
  readonly tone?: BadgeTone;
  readonly children: ReactNode;
};

/** 「未定」「回答済み」「幹事」などの小さな丸バッジ */
export default function Badge({ tone = "wait", children }: BadgeProps) {
  return (
    <PrimitiveBadge
      variant="outline"
      className={cn("rounded-full px-2.5 py-[3px] text-[0.72rem] font-bold", TONE_CLASS[tone] ?? TONE_CLASS.wait)}
    >
      {children}
    </PrimitiveBadge>
  );
}
