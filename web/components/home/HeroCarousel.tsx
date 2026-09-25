"use client";

import { useRef, useState } from "react";
import TripCard, { type TripCardProps } from "@/components/home/TripCard";

export type HeroSlide = TripCardProps & {
  readonly id: string;
  readonly href: string;
};

type HeroCarouselProps = {
  readonly slides?: readonly HeroSlide[];
};

const SLIDE_WIDTH = 279; // Figma 473:5133: チケット 279x443
const PITCH = SLIDE_WIDTH + 23;

/** ホーム上部の旅行チケットカルーセル（Figma 473:5133）。横スクロールで次カードが覗く。 */
export default function HeroCarousel({ slides = [] }: HeroCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  if (slides.length === 0) return null;

  const goTo = (index: number) => {
    const el = trackRef.current?.children[index];
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      setActive(index);
    }
  };

  return (
    <div>
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-[23px] overflow-x-auto px-[calc((100%_-_279px)/2)] pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={(e) => {
          const track = e.currentTarget;
          const index = Math.round(track.scrollLeft / PITCH);
          setActive(Math.min(slides.length - 1, Math.max(0, index)));
        }}
      >
        {slides.map((slide) => (
          <div key={slide.id} className="h-[443px] w-[279px] shrink-0 snap-center">
            <TripCard
              groupId={slide.groupId}
              href={slide.href}
              photoUrl={slide.photoUrl}
              name={slide.name}
              start={slide.start}
              end={slide.end}
            />
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5" role="group" aria-label="旅行チケット切り替え">
          {slides.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`${idx + 1}枚目`}
              aria-current={idx === active ? "true" : undefined}
              className={
                idx === active
                  ? "h-1.5 w-4 rounded-full bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  : "h-1.5 w-1.5 rounded-full bg-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              }
              onClick={() => goTo(idx)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
