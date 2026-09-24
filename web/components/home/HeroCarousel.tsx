"use client";

import { useState } from "react";

type HeroSlide = {
  readonly caption: string;
  readonly photoUrl: string | null;
};

type HeroCarouselProps = {
  readonly slides?: readonly HeroSlide[];
};

/** ホーム画面いちばん上の「上半期おすすめ旅行先TOP5」カルーセル */
export default function HeroCarousel({ slides = [] }: HeroCarouselProps) {
  const [i, setI] = useState(0);
  if (slides.length === 0) return null;
  const slide = slides[i];
  return (
    <div className="hero">
      <div
        className="hero-photo"
        style={slide.photoUrl ? { backgroundImage: `url(${slide.photoUrl})` } : undefined}
        role="img"
        aria-label={slide.caption}
      />
      <p className="caption">{slide.caption}</p>
      <div className="dots" role="tablist" aria-label="おすすめ旅行先">
        {slides.map((s, idx) => (
          <button
            key={s.caption}
            role="tab"
            aria-selected={idx === i}
            aria-label={`${idx + 1}枚目`}
            className={idx === i ? "dot dot--on" : "dot"}
            onClick={() => setI(idx)}
          />
        ))}
      </div>
      <style jsx>{`
        .hero { position: relative; height: 170px; overflow: hidden; }
        .hero-photo { position: absolute; inset: 0; background: var(--line) center/cover no-repeat; }
        .caption {
          position: absolute; left: 12px; bottom: 24px; color: var(--white);
          font-size: 0.78rem; font-weight: 700;
          text-shadow: 0 1px 4px rgba(0,0,0,.5);
        }
        .dots { position: absolute; right: 10px; bottom: 8px; display: flex; gap: 4px; }
        .dot { width: 6px; height: 6px; border-radius: 50%; border: 0; background: rgba(255,255,255,.5); padding: 0; cursor: pointer; }
        .dot--on { background: var(--white); width: 16px; border-radius: 4px; }
      `}</style>
    </div>
  );
}
