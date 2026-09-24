"use client";

import type { MouseEventHandler } from "react";

type ChipProps = {
  readonly label: string;
  readonly selected?: boolean;
  readonly onClick?: MouseEventHandler<HTMLButtonElement>;
  readonly disabled?: boolean;
};

/** ハッシュタグ選択の丸ピル。#付きで表示する */
export default function Chip({ label, selected = false, onClick, disabled = false }: ChipProps) {
  return (
    <button
      type="button"
      className="chip"
      aria-pressed={selected}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="hash" aria-hidden="true">#</span>
      {label}
      <style jsx>{`
        .chip {
          appearance: none; cursor: pointer;
          display: inline-flex; align-items: center; gap: 2px;
          min-height: 42px; padding: 8px 16px;
          border-radius: var(--radius-pill);
          border: 1.5px solid var(--line);
          background: var(--white); color: var(--ink-900);
          font-size: 0.92rem; font-weight: 700;
          transition: background 0.12s, border-color 0.12s, color 0.12s;
        }
        .chip:disabled { opacity: 0.5; cursor: not-allowed; }
        .chip[aria-pressed="true"] {
          background: var(--teal-600); border-color: var(--teal-600); color: var(--white);
        }
        .hash { color: var(--ink-400); }
        .chip[aria-pressed="true"] .hash { color: color-mix(in srgb, var(--white) 75%, transparent); }
        .chip:focus-visible {
          outline: 3px solid color-mix(in srgb, var(--teal-600) 45%, transparent); outline-offset: 2px;
        }
      `}</style>
    </button>
  );
}
