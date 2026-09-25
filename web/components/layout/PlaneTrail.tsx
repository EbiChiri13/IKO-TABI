import { cn } from "@/lib/utils";

/** ヘッダーの奥に薄く見える飛行機雲の飾り（デザインの「行きたい」系ヘッダーに共通） */
type PlaneTrailProps = {
  /** 位置と大きさの上書き（既定は AppHeader 用） */
  readonly className?: string;
};

export default function PlaneTrail({ className }: PlaneTrailProps = {}) {
  return (
    <svg
      className={cn("pointer-events-none absolute top-1.5 right-1 h-[66px] w-[110px] text-background/55", className)}
      viewBox="0 0 200 120"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10 90 C 70 90, 90 40, 150 25"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="6 5"
        strokeLinecap="round"
      />
      <path d="M150 25 L138 22 M150 25 L145 36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
