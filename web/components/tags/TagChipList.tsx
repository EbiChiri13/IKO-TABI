type TagChipListProps = {
  readonly labels: readonly string[];
  readonly highlight?: string | null;
};

/** タグを丸ピルで並べて表示するだけの表示用コンポーネント。譲れないタグは黄色にする。 */
export default function TagChipList({ labels, highlight }: TagChipListProps) {
  return (
    <p className="chips">
      {labels.map((label) => (
        <span key={label} className={`chip ${label === highlight ? "chip--picked" : ""}`}>
          {label}
        </span>
      ))}
      <style jsx>{`
        .chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; }
        .chip {
          display: inline-block; padding: 8px 16px; border-radius: var(--radius-pill);
          background: var(--teal-600); color: var(--white); font-weight: 700; font-size: 0.88rem;
        }
        .chip--picked { background: #ffd400; color: var(--ink-900); }
      `}</style>
    </p>
  );
}
