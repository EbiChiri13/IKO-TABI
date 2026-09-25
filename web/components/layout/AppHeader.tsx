"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BackIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import PlaneTrail from "./PlaneTrail";

type AppHeaderProps = {
  readonly eyebrow?: string;
  readonly title: string;
  readonly backHref?: string;
  readonly dark?: boolean;
  readonly decorate?: boolean;
  readonly children?: ReactNode;
};

/**
 * グループ作成・招待・回答待ちなどで使う、ティール地の見出しヘッダー。
 * dark にすると「決定まとめ」などで使う濃紺のチケット風ヘッダーになる。
 */
export default function AppHeader({ eyebrow, title, backHref, dark = false, decorate = true, children }: AppHeaderProps) {
  return (
    <header
      className={cn(
        "relative overflow-hidden px-5 pt-3.5 pb-6 font-sans",
        dark ? "bg-foreground text-background" : "bg-primary text-primary-foreground",
      )}
    >
      {decorate && <PlaneTrail />}
      <div className="mb-2 flex min-h-[28px]">
        {backHref ? (
          <Link href={backHref} className="inline-flex text-inherit no-underline" aria-label="戻る"><BackIcon /></Link>
        ) : (
          <span />
        )}
      </div>
      {eyebrow && <p className="mb-1! text-[0.85rem] font-bold opacity-90">{eyebrow}</p>}
      <h1 className="relative z-[1] text-[1.5rem]! whitespace-pre-line">{title}</h1>
      {children}
    </header>
  );
}
