"use client";

const VARIANT_CLASS = {
  primary: "btn btn--primary",
  mint: "btn btn--mint",
  ghost: "btn btn--ghost",
  quiet: "btn btn--quiet",
};

/**
 * ピル形のボタン。variant: primary(ティール) / mint(差し色の緑) / ghost(枠線) / quiet(地味)
 */
export default function Button({
  variant = "primary",
  size = "md",
  block = false,
  disabled = false,
  type = "button",
  onClick,
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${VARIANT_CLASS[variant] ?? VARIANT_CLASS.primary} ${size === "sm" ? "btn--sm" : ""} ${
        block ? "btn--block" : ""
      }`}
      {...rest}
    >
      {children}
      <style jsx>{`
        .btn {
          appearance: none;
          border: 0;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 52px;
          padding: 12px 24px;
          border-radius: var(--radius-pill);
          font-weight: 700;
          font-size: 1rem;
          transition: transform 0.06s ease, opacity 0.15s, box-shadow 0.15s;
        }
        .btn:active { transform: scale(0.98); }
        .btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .btn--sm { min-height: 40px; padding: 8px 18px; font-size: 0.9rem; }
        .btn--block { width: 100%; }
        .btn--primary { background: var(--teal-600); color: var(--white); box-shadow: var(--shadow-pop); }
        .btn--mint { background: var(--mint-400); color: var(--ink-900); box-shadow: var(--shadow-pop); }
        .btn--ghost { background: transparent; color: var(--teal-600); border: 2px solid var(--teal-600); }
        .btn--quiet { background: var(--white); color: var(--ink-900); border: 1.5px solid var(--line); }
      `}</style>
    </button>
  );
}
