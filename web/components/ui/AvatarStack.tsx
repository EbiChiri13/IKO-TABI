/** メンバーの丸アイコンを少し重ねて並べる（グループ一覧・カードで使用） */
type AvatarStackProps = {
  readonly names?: readonly string[];
  readonly max?: number;
};

export default function AvatarStack({ names = [], max = 4 }: AvatarStackProps) {
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;
  return (
    <span className="stack" aria-label={`メンバー ${names.length}人`}>
      {shown.map((name, i) => (
        <span className="avatar" key={i} style={{ zIndex: shown.length - i }} title={name}>
          {name ? name[0] : ""}
        </span>
      ))}
      {extra > 0 && <span className="avatar avatar--extra">+{extra}</span>}
      <style jsx>{`
        .stack { display: inline-flex; }
        .avatar {
          width: 30px; height: 30px; border-radius: 50%;
          background: var(--line); color: var(--ink-600);
          border: 2px solid var(--white);
          display: grid; place-items: center;
          font-size: 0.8rem; font-weight: 700;
          margin-left: -10px;
        }
        .avatar:first-child { margin-left: 0; }
        .avatar--extra { background: var(--cream-100); color: var(--ink-400); }
      `}</style>
    </span>
  );
}
