type WelcomeIllustrationProps = Record<string, never>;

/** スプラッシュ画面のイラスト（悩む人 × 提案する人）を簡易な線画で表現 */
export default function WelcomeIllustration({}: WelcomeIllustrationProps = {}) {
  return (
    <svg className="illust" viewBox="0 0 300 180" fill="none" aria-hidden="true">
      <ellipse cx="150" cy="170" rx="130" ry="10" fill="var(--teal-500)" opacity="0.35" />
      {/* 左：悩む人 */}
      <circle cx="95" cy="60" r="22" fill="#f4d9b8" />
      <path d="M78 52 Q95 30 112 52" stroke="var(--ink-900)" strokeWidth="4" fill="none" strokeLinecap="round" />
      <rect x="72" y="82" width="46" height="60" rx="18" fill="#eee6da" />
      <path d="M85 100 q10 10 0 18" stroke="var(--ink-900)" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* 右：提案する人 */}
      <circle cx="205" cy="55" r="22" fill="#f4d9b8" />
      <path d="M188 46 Q205 26 222 46" stroke="var(--ink-900)" strokeWidth="4" fill="none" strokeLinecap="round" />
      <rect x="180" y="77" width="50" height="65" rx="20" fill="#9fb3d6" />
      <path d="M168 95 q-14 6 -8 22" stroke="var(--ink-900)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M240 92 q14 4 10 20" stroke="var(--ink-900)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <style jsx>{`
        .illust { width: 100%; max-width: 280px; height: auto; }
      `}</style>
    </svg>
  );
}
