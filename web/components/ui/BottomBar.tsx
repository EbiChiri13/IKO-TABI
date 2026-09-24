import type { ReactNode } from "react";

type BottomBarProps = {
  readonly children: ReactNode;
  readonly note?: ReactNode;
};

/** 画面下に固定される操作バー（決定ボタン＋補足） */
export default function BottomBar({ children, note }: BottomBarProps) {
  return (
    <div className="sticky bottom-0 z-10 bg-cream-200/92 backdrop-blur-[6px] border-t border-line px-5 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
      <div className="flex flex-col gap-2.5">{children}</div>
      {note && <p className="mt-2 text-center text-[0.8rem] text-ink-400">{note}</p>}
    </div>
  );
}
