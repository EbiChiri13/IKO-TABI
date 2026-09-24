type SpinnerProps = {
  readonly label?: string;
};

export default function Spinner({ label = "読み込み中…" }: SpinnerProps) {
  return (
    <div className="spinner" role="status">
      {label}
      <style jsx>{`
        .spinner { text-align: center; color: var(--ink-400); padding: 60px 0; font-weight: 700; }
      `}</style>
    </div>
  );
}
