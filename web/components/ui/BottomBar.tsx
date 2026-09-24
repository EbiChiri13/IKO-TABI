/** 画面下に固定される操作バー（決定ボタン＋補足） */
export default function BottomBar({ children, note }) {
  return (
    <div className="bar">
      <div className="bar-inner">{children}</div>
      {note && <p className="bar-note">{note}</p>}
      <style jsx>{`
        .bar {
          position: sticky; bottom: 0; z-index: 10;
          background: color-mix(in srgb, var(--cream-200) 92%, transparent);
          backdrop-filter: blur(6px);
          border-top: 1px solid var(--line);
          padding: 12px 20px calc(12px + env(safe-area-inset-bottom));
        }
        .bar-inner { display: flex; gap: 10px; }
        .bar-note { margin-top: 8px; text-align: center; font-size: 0.8rem; color: var(--ink-400); }
      `}</style>
    </div>
  );
}
