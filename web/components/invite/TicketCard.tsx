"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckIcon, CopyIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

type TicketCardProps = {
  /** 公開グループID。招待トークンは能力トークンなので渡さない（ID表示・コピーは実在時のみ） */
  readonly groupId?: string;
  readonly name: string;
  readonly start: string;
  readonly end: string;
  readonly photoUrl?: string;
  readonly tagline?: string;
  readonly href?: string;
  readonly overlap?: boolean;
};

/**
 * 搭乗券風のチケット（Figma 473:4566 / 279×443）。
 * 上部に写真エリア（279×201、photoUrl は動的）、teal のノッチ付き本体に
 * 日付・ID、ミシン目（y309）とバーコードのスタブ。
 * 写真が無いときは ticket-photo-placeholder.svg を表示する。
 */
export default function TicketCard({
  groupId,
  name,
  start,
  end,
  photoUrl,
  tagline = "Let's invite someone to go with you.",
  href,
  overlap = true,
}: TicketCardProps) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copyId() {
    if (!groupId) return;
    try {
      await navigator.clipboard.writeText(groupId);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 1500);
    } catch {
      setCopyStatus("failed");
    }
  }

  return (
    <div
      className={cn(
        "relative mx-auto h-[443px] w-[279px] [filter:drop-shadow(var(--shadow-pop))]",
        overlap && "-mt-10",
      )}
    >
      <img src="/figma/ticket-silhouette.svg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full" />
      {href && (
        <Link
          href={href}
          aria-label={`${name}の旅行を開く`}
          className="absolute inset-0 z-10 rounded-[22px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      )}
      <div className="relative flex h-full flex-col">
        <div
          className="h-[201px] shrink-0 overflow-hidden rounded-t-[22px] bg-media-placeholder bg-cover bg-center"
          style={photoUrl ? { backgroundImage: `url(${photoUrl})` } : undefined}
        >
          {!photoUrl && (
            <div className="flex h-full w-full items-center justify-center">
              <img src="/figma/ticket-photo-placeholder.svg" alt="" aria-hidden="true" className="size-28" />
            </div>
          )}
        </div>

        <div className="flex h-[108px] shrink-0 flex-col items-center justify-center gap-1 px-6 text-center">
          <p className="max-w-full truncate text-[1.15rem] font-extrabold leading-snug text-background">{name}</p>
          <p className="flex max-w-full items-center justify-center gap-1 whitespace-nowrap px-2 text-[12px] font-bold text-background">
            <span className="shrink-0">{start}</span>
            <img src="/figma/ticket-date-dots.svg" alt="" aria-hidden="true" className="w-[68px] shrink-0" />
            <span className="shrink-0">{end}</span>
          </p>
          {groupId && (
            <>
              <button
                type="button"
                onClick={copyId}
                className="relative z-20 inline-flex max-w-full items-center gap-1.5 rounded-full px-2 py-1 text-[0.78rem] text-background/85 transition-colors duration-150 hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background"
              >
                <span className="max-w-[170px] truncate" title={groupId}>
                  ID：{groupId}
                </span>
                {copyStatus === "copied" ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
              </button>
              <span
                aria-live="polite"
                className={copyStatus === "failed" ? "text-[0.72rem] font-bold text-background" : "sr-only"}
              >
                {copyStatus === "copied"
                  ? "IDをコピーしました"
                  : copyStatus === "failed"
                    ? "コピーできませんでした。IDを選択してコピーしてください"
                    : ""}
              </span>
            </>
          )}
        </div>

        <div className="relative h-[134px] shrink-0">
          {/* ミシン目：シルエットのノッチ中心（y309）に合わせる */}
          <div
            aria-hidden="true"
            className="absolute inset-x-[22px] top-0 border-t-2 border-dashed border-background/50"
          />
          <div className="flex h-full flex-col items-center justify-center gap-2.5 px-5">
            <p className="text-[0.78rem] text-background/85">{tagline}</p>
            <img src="/figma/ticket-barcode.svg" alt="" aria-hidden="true" className="w-[179px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
