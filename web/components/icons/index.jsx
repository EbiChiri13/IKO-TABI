/**
 * Figmaで使われているアイコンセット（eva-icons / ant-design / heroicons / akar-icons）の
 * 代わりに、同じ見た目・線の太さで自作した最小限のインラインSVGアイコン集。
 * 外部アイコンパッケージを増やさずに済ませる。
 */

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function BackIcon({ size = 24, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} {...rest}>
      <path d="M15 5 L8 12 L15 19" />
    </svg>
  );
}

export function CalendarIcon({ size = 18, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} {...rest}>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

export function UserGroupIcon({ size = 18, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} {...rest}>
      <circle cx="9" cy="8" r="3" />
      <path d="M2.5 20c0-3.3 2.9-6 6.5-6s6.5 2.7 6.5 6" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M15.5 14.2c2.8.4 4.8 2.6 4.8 5.8" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 20, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} {...rest}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function ShareIcon({ size = 18, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} {...rest}>
      <circle cx="18" cy="5" r="2.6" />
      <circle cx="6" cy="12" r="2.6" />
      <circle cx="18" cy="19" r="2.6" />
      <path d="M8.3 10.7l7.4-4.4M8.3 13.3l7.4 4.4" />
    </svg>
  );
}

export function PlaneIcon({ size = 22, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...rest}>
      <path d="M21 12.5 3 6l1.6 4.4L13 12l-8.4 1.6L3 18l18-5.5z" />
    </svg>
  );
}

export function CopyIcon({ size = 16, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} {...rest}>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

export function CheckIcon({ size = 16, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} {...rest}>
      <path d="M4 12.5l5 5L20 6" />
    </svg>
  );
}
