import type { PlaceSummary } from "@/lib/api";
import { cardSurface } from "@/components/ui/primitives/card";
import { cn } from "@/lib/utils";

type PlaceTimelineProps = {
  readonly label: string;
  readonly places: readonly PlaceSummary[];
};

/** 決定まとめの縦タイムライン（Figma 363:6926 計画確定）。観光地／食事先／宿泊先で使う。 */
export default function PlaceTimeline({ label, places }: PlaceTimelineProps) {
  if (places.length === 0) return null;
  return (
    <section className="relative">
      {/* 左レール：ティールの破線＋各行動ドット（Figma Line 8–10 / Ellipse 32–39） */}
      <span aria-hidden="true" className="absolute top-[18px] bottom-[48px] left-[40px] w-0 border-l-2 border-dashed border-primary" />
      <div className="relative flex min-h-[35px] items-center pl-[57px]">
        <span aria-hidden="true" className="absolute top-1/2 left-[36px] size-2.5 -translate-y-1/2 rounded-full bg-primary" />
        {/* 旗ラベル（public/figma/section-flag.svg、Figma Rectangle 75） */}
        <span className="relative inline-flex h-[35px] w-[102px] items-center pl-[23px]">
          <img src="/figma/section-flag.svg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full" />
          <span className="relative text-base leading-none font-extrabold text-primary-foreground">{label}</span>
        </span>
      </div>
      <ul className="relative mt-[13px] m-0 flex list-none flex-col gap-[9px] pl-[57px]">
        {places.map((p) => (
          <li key={p.id} className={cn(cardSurface, "relative flex h-[95px] items-center gap-2.5 px-[18px]")}>
            <span aria-hidden="true" className="absolute top-1/2 left-[-21px] size-2.5 -translate-y-1/2 rounded-full bg-primary" />
            <div
              className="size-[51px] shrink-0 rounded-sm bg-muted bg-cover bg-center"
              style={{ backgroundImage: `url(${p.image})` }}
            />
            <div className="min-w-0">
              <p className="truncate text-base font-extrabold">{p.name}</p>
              <p className="mt-1 flex flex-wrap gap-1">
                {p.tags.slice(0, 3).map((t) => (
                  <span
                    key={t}
                    className="inline-flex h-6 items-center rounded-full bg-muted px-2.5 text-[0.72rem] text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
