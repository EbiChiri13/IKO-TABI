/** 「行きたい」の吹き出しシール（グループ作成ヘッダーの飾り） */
export default function SpeechBubbleSticker({ text = "行きたい" }) {
  return (
    <span className="sticker">
      {text}
      <svg className="tail" viewBox="0 0 20 14" aria-hidden="true">
        <path d="M0 0 L20 0 L4 14 Z" fill="currentColor" />
      </svg>
      <style jsx>{`
        .sticker {
          position: absolute;
          top: -6px;
          right: 14px;
          background: var(--white);
          color: var(--teal-700);
          font-weight: 800;
          font-size: 0.8rem;
          padding: 6px 14px;
          border-radius: var(--radius-pill);
          transform: rotate(-6deg);
          box-shadow: var(--shadow-pop);
        }
        .tail {
          position: absolute;
          bottom: -8px;
          left: 18px;
          width: 14px;
          height: 10px;
          color: var(--white);
        }
      `}</style>
    </span>
  );
}
