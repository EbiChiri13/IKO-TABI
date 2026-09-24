"use client";

import { useState } from "react";
import { CopyIcon, CheckIcon } from "@/components/icons";

type TicketCardProps = {
  readonly groupId: string;
  readonly name: string;
  readonly start: string;
  readonly end: string;
  readonly photoUrl?: string;
  readonly tagline?: string;
  /** 横スクロールのカルーセル（design: ホーム画面）で使うときの固定幅（px） */
  readonly width?: number;
  /** "lg" = ホーム画面のカルーセル用の大きめ比率（写真が広い）。既定は招待／計画確定画面の従来比率 */
  readonly size?: "default" | "lg";
};

/** 搭乗券風のチケット（design: グループ結成／計画確定／ホーム画面）。写真は無いのでダミー画像を使う。 */
export default function TicketCard({
  groupId,
  name,
  start,
  end,
  photoUrl,
  tagline = "Let's invite someone to go with you.",
  width,
  size = "default",
}: TicketCardProps) {
  const [copied, setCopied] = useState(false);

  async function copyId() {
    try {
      await navigator.clipboard.writeText(groupId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  }

  return (
    <div
      className={`ticket ${size === "lg" ? "ticket--lg" : ""}`}
      style={width ? { width, flex: `0 0 ${width}px`, margin: 0 } : undefined}
    >
      <div className="photo" style={photoUrl ? { backgroundImage: `url(${photoUrl})` } : undefined} />
      <div className="notch notch-left" aria-hidden="true" />
      <div className="notch notch-right" aria-hidden="true" />
      <div className="body">
        <p className="name">{name}</p>
        <p className="dates">
          <span>{start}</span>
          <img className="dots" src="/ticket/date-arrow.svg" alt="" aria-hidden="true" />
          <span>{end}</span>
        </p>
        <button type="button" className="id" onClick={copyId}>
          <span>ID：{groupId}</span>
          {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
        </button>
      </div>
      <div className="perforation" aria-hidden="true" />
      <div className="stub">
        <p className="tagline">{tagline}</p>
        <img className="barcode" src="/ticket/barcode.svg" alt="" aria-hidden="true" />
      </div>
      <style jsx>{`
        .ticket {
          position: relative;
          background: var(--white);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-pop);
          margin: -40px 20px 0;
          scroll-snap-align: start;
        }
        .photo {
          height: 96px;
          background: var(--line) center/cover no-repeat;
        }
        .body {
          background: var(--teal-600);
          color: var(--white);
          padding: 12px 20px 14px;
          text-align: center;
        }
        .name { font-size: 1.05rem; font-weight: 800; margin-bottom: 4px; }
        .dates {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;
        }
        .dots {
          flex: none; width: 28px; height: auto;
        }
        .id {
          display: inline-flex; align-items: center; gap: 6px;
          background: transparent; border: 0; color: color-mix(in srgb, var(--white) 85%, transparent);
          font-size: 0.74rem; cursor: pointer; padding: 1px 4px;
        }
        .perforation {
          position: relative;
          height: 0;
          border-top: 2px dashed color-mix(in srgb, var(--teal-700) 60%, white);
        }
        .notch {
          position: absolute; z-index: 2;
          width: 18px; height: 18px; border-radius: 50%;
          background: var(--cream-200);
          top: 154px;
        }
        .notch-left { left: -9px; }
        .notch-right { right: -9px; }
        .stub {
          background: var(--teal-600);
          padding: 10px 20px 14px;
          text-align: center;
        }
        .tagline { color: color-mix(in srgb, var(--white) 85%, transparent); font-size: 0.72rem; margin-bottom: 8px; }
        .barcode {
          display: block; height: 22px; width: auto; max-width: 100%; margin: 0 auto;
        }

        /* design: ホーム画面（node 473:5133）のチケットカルーセル用比率 */
        .ticket--lg { border-radius: 22px; }
        .ticket--lg .photo { height: 201px; }
        .ticket--lg .body { background: #48bfae; padding: 14px 20px 0; }
        .ticket--lg .name { font-size: 20px; font-weight: 500; margin-bottom: 10px; }
        .ticket--lg .dates { font-size: 14px; font-weight: 500; margin-bottom: 14px; }
        .ticket--lg .dots { width: 34px; }
        .ticket--lg .id { font-size: 10px; margin-bottom: 16px; }
        .ticket--lg .perforation { border-top-color: rgba(255, 255, 255, 0.55); margin: 0 20px; }
        .ticket--lg .notch { top: 300px; width: 22px; height: 22px; }
        .ticket--lg .notch-left { left: -11px; }
        .ticket--lg .notch-right { right: -11px; }
        .ticket--lg .stub { background: #48bfae; padding: 16px 20px 20px; }
        .ticket--lg .tagline { font-size: 10px; margin-bottom: 12px; }
        .ticket--lg .barcode { height: 32px; }
      `}</style>
    </div>
  );
}
