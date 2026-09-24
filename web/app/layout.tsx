import { Zen_Maru_Gothic, Yomogi } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

// 本文用の丸ゴシック
const body = Zen_Maru_Gothic({
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  variable: "--font-body",
  display: "swap",
});

// 「いこ！たび」ロゴ用の手書き風フォント
const logo = Yomogi({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-logo",
  display: "swap",
});

export const metadata = {
  title: "いこたび",
  description: "みんなの「行きたい」を叶える、グループ旅行の希望集めサービス",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2e9b84",
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="ja" className={`${body.variable} ${logo.variable}`}>
      <body>{children}</body>
    </html>
  );
}
