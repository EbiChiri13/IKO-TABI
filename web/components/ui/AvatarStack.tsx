import { cn } from "@/lib/utils";

/** メンバーの丸アイコンを少し重ねて並べる（グループ一覧・カードで使用） */
type AvatarStackProps = {
  readonly names?: readonly string[];
  readonly max?: number;
};

const AVATAR_CLASS =
  "-ml-2.5 grid size-[30px] place-items-center rounded-full border-2 border-background bg-border text-[0.8rem] font-bold text-foreground first:ml-0";

export default function AvatarStack({ names = [], max = 4 }: AvatarStackProps) {
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;
  return (
    <span className="inline-flex" role="img" aria-label={`メンバー ${names.length}人`}>
      {shown.map((name, i) => (
        <span
          className={AVATAR_CLASS}
          // biome-ignore lint/suspicious/noArrayIndexKey: 並び替えの無い静的な表示なので index をキーにして問題ない
          key={i}
          style={{ zIndex: shown.length - i }}
          title={name}
        >
          {name ? name[0] : ""}
        </span>
      ))}
      {extra > 0 && <span className={cn(AVATAR_CLASS, "bg-muted text-muted-foreground")}>+{extra}</span>}
    </span>
  );
}
