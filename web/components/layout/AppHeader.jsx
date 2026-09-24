"use client";

import Link from "next/link";
import { BackIcon } from "@/components/icons";
import PlaneTrail from "./PlaneTrail";

/**
 * グループ作成・招待・回答待ちなどで使う、ティール地の見出しヘッダー。
 * dark にすると「決定まとめ」などで使う濃紺のチケット風ヘッダーになる。
 */
export default function AppHeader({ eyebrow, title, backHref, dark = false, decorate = true, children }) {
  return (
    <header className={`head ${dark ? "head--dark" : ""}`}>
      {decorate && <PlaneTrail />}
      <div className="head-top">
        {backHref ? (
          <Link href={backHref} className="back" aria-label="戻る"><BackIcon /></Link>
        ) : (
          <span />
        )}
      </div>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="title">{title}</h1>
      {children}
      <style jsx>{`
        .head {
          position: relative;
          overflow: hidden;
          background: var(--teal-600);
          color: var(--white);
          padding: 14px 20px 24px;
        }
        .head--dark { background: var(--teal-900); }
        .head-top { display: flex; margin-bottom: 8px; min-height: 28px; }
        .back {
          display: inline-flex;
          text-decoration: none;
          color: var(--white);
        }
        .eyebrow { font-size: 0.85rem; font-weight: 700; opacity: 0.9; margin-bottom: 4px; }
        .title { font-size: 1.5rem; position: relative; z-index: 1; white-space: pre-line; }
      `}</style>
    </header>
  );
}
