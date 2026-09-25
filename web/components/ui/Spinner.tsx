type SpinnerProps = {
  readonly label?: string;
};

export default function Spinner({ label = "読み込み中…" }: SpinnerProps) {
  return (
    <div className="py-[60px] text-center font-sans font-bold text-muted-foreground" role="status">
      {label}
    </div>
  );
}
