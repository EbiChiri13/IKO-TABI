"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "@/components/icons";

type InviteLinkBoxProps = {
  readonly url: string;
};

/** 招待リンクの表示＋コピー（Figma: 共有リンク入力欄、radius-sm）。 */
export default function InviteLinkBox({ url }: InviteLinkBoxProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setCopyError(false);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
      setCopyError(true);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-sm border-[1.5px] border-border bg-card px-3.5 py-2.5">
      <input
        readOnly
        value={url}
        onFocus={(e) => e.target.select()}
        aria-label="招待リンク"
        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[0.85rem] text-foreground outline-none"
      />
      <button
        type="button"
        onClick={copy}
        aria-label="リンクをコピー"
        className="inline-flex shrink-0 items-center justify-center rounded-full p-1.5 text-foreground transition-colors duration-150 hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
      <span aria-live="polite" className={copyError ? "w-full text-xs text-destructive" : "sr-only"}>
        {copyError
          ? "コピーできませんでした。リンクを選択してコピーしてください"
          : copied
            ? "リンクをコピーしました"
            : ""}
      </span>
    </div>
  );
}
