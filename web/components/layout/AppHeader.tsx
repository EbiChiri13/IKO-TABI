"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BackIcon, HomeIcon } from "@/components/icons";
import PlaneTrail from "./PlaneTrail";

type AppHeaderProps = {
  readonly eyebrow?: string;
  readonly title: string;
  readonly backHref?: string;
  readonly homeHref?: string;
  readonly dark?: boolean;
  readonly decorate?: boolean;
  readonly children?: ReactNode;
};

/**
 * グループ作成・招待・回答待ちなどで使う、ティール地の見出しヘッダー。
 * dark にすると「決定まとめ」などで使う濃紺のチケット風ヘッダーになる。
 * homeHref を指定すると、戻る矢印の代わりにホームアイコンを表示する（design: ハッシュタグ選定＝最初のステップなのでホームへ戻る導線）。
 */
export default function AppHeader({ eyebrow, title, backHref, homeHref, dark = false, decorate = true, children }: AppHeaderProps) {
  return (
    <header className={`relative overflow-hidden px-5 pt-3.5 pb-6 text-white ${dark ? "bg-teal-900" : "bg-teal-600"}`}>
      {decorate && <PlaneTrail />}
      <div className="flex mb-2 min-h-[28px]">
        {homeHref ? (
          <Link href={homeHref} className="inline-flex text-white no-underline" aria-label="ホームへ戻る"><HomeIcon /></Link>
        ) : backHref ? (
          <Link href={backHref} className="inline-flex text-white no-underline" aria-label="戻る"><BackIcon /></Link>
        ) : (
          <span />
        )}
      </div>
      {eyebrow && <p className="text-[0.85rem] font-bold opacity-90 mb-1">{eyebrow}</p>}
      <h1 className="relative z-[1] text-2xl whitespace-pre-line">{title}</h1>
      {children}
    </header>
  );
}
