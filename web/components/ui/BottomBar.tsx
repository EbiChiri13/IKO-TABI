import type { ReactNode } from "react";

type BottomBarProps = {
  readonly children: ReactNode;
  readonly note?: ReactNode;
};

/** スクロールに追従しない操作バー（決定ボタン＋補足）。 */
export default function BottomBar({ children, note }: BottomBarProps) {
  return (
    <div className="shrink-0 border-t border-border bg-background/92 px-5 pt-3 pb-[calc(12px_+_env(safe-area-inset-bottom))] backdrop-blur-[6px]">
      <div className="flex gap-2.5">{children}</div>
      {note && <p className="mt-2! text-center font-sans text-[0.8rem] text-muted-foreground">{note}</p>}
    </div>
  );
}
