/** ヘッダーの奥に薄く見える飛行機雲の飾り（デザインの「行きたい」系ヘッダーに共通） */
export default function PlaneTrail() {
  return (
    <svg className="plane-trail" viewBox="0 0 200 120" fill="none" aria-hidden="true">
      <path
        d="M10 90 C 70 90, 90 40, 150 25"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="1 8"
        strokeLinecap="round"
      />
      <path d="M150 25 L138 22 M150 25 L145 36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <style jsx>{`
        .plane-trail {
          position: absolute;
          top: 6px;
          right: 4px;
          width: 110px;
          height: 66px;
          color: color-mix(in srgb, var(--white) 55%, transparent);
          pointer-events: none;
        }
      `}</style>
    </svg>
  );
}
