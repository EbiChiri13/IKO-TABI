const TONE = {
  wait: { bg: "var(--cream-100)", fg: "var(--ink-400)", border: "var(--line)" },
  ok: { bg: "color-mix(in srgb, var(--mint-400) 55%, white)", fg: "var(--teal-700)", border: "transparent" },
  host: { bg: "color-mix(in srgb, var(--teal-600) 15%, white)", fg: "var(--teal-700)", border: "transparent" },
};

/** 「未定」「回答済み」「幹事」などの小さな丸バッジ */
export default function Badge({ tone = "wait", children }) {
  const t = TONE[tone] ?? TONE.wait;
  return (
    <span className="badge" style={{ background: t.bg, color: t.fg, borderColor: t.border }}>
      {children}
      <style jsx>{`
        .badge {
          display: inline-block;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: var(--radius-pill);
          border: 1px solid transparent;
          white-space: nowrap;
        }
      `}</style>
    </span>
  );
}
