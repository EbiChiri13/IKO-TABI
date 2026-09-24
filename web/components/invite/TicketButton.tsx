"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { PlaneIcon } from "@/components/icons";

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
      className={`ticket-btn ${tearing ? "tearing" : ""}`}
      onClick={handleClick}
      disabled={disabled || busy}
      aria-busy={busy || tearing}
    >
      <span className="stub left">
        <PlaneIcon size={16} />
      </span>
      <span className="perf" aria-hidden="true" />
      <span className="stub right">{busy ? "出発しています…" : children}</span>
      <style jsx>{`
        .ticket-btn {
          appearance: none; border: 0; cursor: pointer; width: 100%;
          display: grid; grid-template-columns: auto auto 1fr; align-items: stretch;
          min-height: 52px; border-radius: var(--radius-pill); overflow: hidden;
          background: var(--teal-600); color: var(--white);
          font: inherit; font-weight: 800; font-size: 0.98rem;
          box-shadow: var(--shadow-pop);
          transition: transform 0.18s ease, opacity 0.18s;
        }
        .ticket-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .stub { display: flex; align-items: center; justify-content: center; padding: 0 18px; }
        .stub.left { background: color-mix(in srgb, var(--teal-900) 35%, var(--teal-600)); }
        .perf {
          width: 0; border-left: 2px dashed color-mix(in srgb, var(--white) 55%, transparent);
        }
        .tearing .stub.left {
          transform: translateX(-14px) rotate(-6deg);
          opacity: 0;
        }
        .tearing .stub.right {
          transform: translateX(10px);
        }
        .stub.left, .stub.right { transition: transform 0.22s ease, opacity 0.22s ease; }
      `}</style>
    </button>
  );
}
