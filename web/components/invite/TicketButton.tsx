"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { PlaneIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

type TicketButtonProps = {
  readonly children: ReactNode;
  readonly onClick?: () => void;
  readonly disabled?: boolean;
  readonly busy?: boolean;
};

/**
 * 「チケットを切って出発する」ボタン（飛行機のチケットを切るUI）。
 * 幹事が全員そろわなくても先へ進めるとき（旧: 今いるメンバーの希望で行き先を探す）に使う。
 * 押すとミシン目に沿って切り離れるアニメーションをしてから onClick を呼ぶ。
 * Figma の CTA と同じ ink-on-teal（--primary-foreground on --primary）。
 */
export default function TicketButton({ children, onClick, disabled, busy }: TicketButtonProps) {
  const [tearing, setTearing] = useState(false);

  function handleClick() {
    if (disabled || busy || tearing) return;
    setTearing(true);
    setTimeout(() => onClick?.(), 260);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || busy}
      aria-busy={busy || tearing}
      className={cn(
        "grid min-h-[52px] w-full cursor-pointer grid-cols-[auto_auto_1fr] items-stretch overflow-hidden rounded-full",
        "border border-foreground bg-primary text-primary-foreground shadow-pop",
        "font-sans text-[0.98rem] font-extrabold transition-transform duration-75 active:scale-[0.98] disabled:active:scale-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground",
        "disabled:cursor-not-allowed disabled:opacity-50",
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center bg-foreground/10 px-[18px] transition-[transform,opacity] duration-200 motion-reduce:transition-none",
          tearing && "-translate-x-3.5 -rotate-6 opacity-0",
        )}
      >
        <PlaneIcon size={16} />
      </span>
      <span aria-hidden="true" className="w-0 border-l-2 border-dashed border-background/50" />
      <span
        className={cn(
          "flex items-center justify-center px-[18px] transition-transform duration-200 motion-reduce:transition-none",
          tearing && "translate-x-2.5",
        )}
      >
        {busy ? "出発しています…" : children}
      </span>
    </button>
  );
}
