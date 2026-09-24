"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "@/components/icons";

/** 招待リンクの表示＋コピー（design: https://konosaitonolinkdesu の入力欄） */
export default function InviteLinkBox({ url }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* クリップボードが使えない環境では何もしない */
    }
  }

  return (
    <div className="box">
      <input readOnly value={url} onFocus={(e) => e.target.select()} aria-label="招待リンク" />
      <button type="button" onClick={copy} aria-label="リンクをコピー">
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
      <style jsx>{`
        .box {
          display: flex; align-items: center; gap: 8px;
          border: 1.5px solid var(--line); border-radius: var(--radius-sm);
          padding: 10px 14px; background: var(--white);
        }
        input {
          flex: 1; border: 0; background: transparent; font-size: 0.85rem;
          color: var(--ink-600); min-width: 0;
        }
        button {
          display: inline-flex; border: 0; background: transparent; cursor: pointer;
          color: var(--teal-600); flex: none;
        }
      `}</style>
    </div>
  );
}
