/** 「行きたい」の吹き出しシール（グループ作成ヘッダーの飾り） */
type SpeechBubbleStickerProps = {
  readonly text?: string;
};

export default function SpeechBubbleSticker({ text = "行きたい" }: SpeechBubbleStickerProps) {
  return (
    <span className="absolute -top-1.5 right-3.5 rotate-[-6deg] rounded-pill bg-background px-3.5 py-1.5 text-[0.8rem] font-extrabold text-foreground shadow-pop">
      {text}
      <svg className="absolute -bottom-2 left-[18px] h-2.5 w-3.5 text-background" viewBox="0 0 20 14" aria-hidden="true">
        <path d="M0 0 L20 0 L4 14 Z" fill="currentColor" />
      </svg>
    </span>
  );
}
