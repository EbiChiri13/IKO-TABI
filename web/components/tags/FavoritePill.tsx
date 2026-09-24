"use client";

type FavoritePillProps = {
  readonly label: string;
  readonly selected: boolean;
  readonly onClick: () => void;
};

/** お気に入り選定画面の丸ボタン。選ばれたもの（＝譲れないこと）だけ黄色になる。 */
export default function FavoritePill({ label, selected, onClick }: FavoritePillProps) {
  return (
    <button type="button" className={`pill ${selected ? "pill--picked" : ""}`} aria-pressed={selected} onClick={onClick}>
      {label}
      <style jsx>{`
        .pill {
          display: block; width: 100%; text-align: center;
          appearance: none; cursor: pointer;
          min-height: 56px; padding: 14px 20px;
          border-radius: var(--radius-pill); border: 0;
          background: var(--teal-600); color: var(--white);
          font-weight: 800; font-size: 1.02rem;
          box-shadow: var(--shadow-card);
          transition: background 0.15s, color 0.15s, transform 0.06s;
        }
        .pill:active { transform: scale(0.99); }
        .pill--picked {
          background: #ffd400; color: var(--ink-900);
        }
      `}</style>
    </button>
  );
}
