import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP, Yomogi } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

// デザインシステム標準書体（Figma完成版・Noto Sans JP）— body から全画面で既定
const noto = Noto_Sans_JP({
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"],
  variable: "--font-noto",
  display: "swap",
});

// 「いこ！たび」ロゴ用の手書き風フォント
const logo = Yomogi({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-logo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "いこたび",
  description: "みんなの「行きたい」を叶える、グループ旅行の希望集めサービス",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      {
        url: "/apple-touch-icon-180x180.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#48bfae",
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="ja" className={`${noto.variable} ${logo.variable}`}>
      <body>{children}</body>
    </html>
  );
}
