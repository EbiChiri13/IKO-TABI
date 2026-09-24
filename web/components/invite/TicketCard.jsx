"use client";

import { useState } from "react";
import { CopyIcon, CheckIcon } from "@/components/icons";

/** 搭乗券風の招待チケット（design: グループ結成画面）。写真は無いのでダミー画像を使う。 */
export default function TicketCard({ groupId, name, start, end, photoUrl }) {
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
    <div className="ticket">
      <div className="photo" style={photoUrl ? { backgroundImage: `url(${photoUrl})` } : undefined} />
      <div className="notch notch-left" aria-hidden="true" />
      <div className="notch notch-right" aria-hidden="true" />
      <div className="body">
        <p className="name">{name}</p>
        <p className="dates">
          <span>{start}</span>
          <span className="dots" aria-hidden="true" />
          <span>{end}</span>
        </p>
        <button type="button" className="id" onClick={copyId}>
          <span>ID：{groupId}</span>
          {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
        </button>
      </div>
      <div className="perforation" aria-hidden="true" />
      <div className="stub">
        <p className="tagline">Let&apos;s invite someone to go with you.</p>
        <div className="barcode" aria-hidden="true" />
      </div>
      <style jsx>{`
        .ticket {
          position: relative;
          background: var(--white);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-pop);
          margin: -40px 20px 0;
        }
        .photo {
          height: 140px;
          background: var(--line) center/cover no-repeat;
        }
        .body {
          background: var(--teal-600);
          color: var(--white);
          padding: 16px 20px 18px;
          text-align: center;
        }
        .name { font-size: 1.2rem; font-weight: 800; margin-bottom: 6px; }
        .dates {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          font-size: 0.85rem; font-weight: 700; margin-bottom: 8px;
        }
        .dots {
          flex: 0 0 40px; height: 1px;
          background: repeating-linear-gradient(90deg, currentColor 0 4px, transparent 4px 8px);
          opacity: 0.8;
        }
        .id {
          display: inline-flex; align-items: center; gap: 6px;
          background: transparent; border: 0; color: color-mix(in srgb, var(--white) 85%, transparent);
          font-size: 0.78rem; cursor: pointer; padding: 2px 4px;
        }
        .perforation {
          position: relative;
          height: 0;
          border-top: 2px dashed color-mix(in srgb, var(--teal-700) 60%, white);
        }
        .notch {
          position: absolute; z-index: 2;
          width: 24px; height: 24px; border-radius: 50%;
          background: var(--cream-200);
          top: 210px;
        }
        .notch-left { left: -12px; }
        .notch-right { right: -12px; }
        .stub {
          background: var(--teal-600);
          padding: 14px 20px 20px;
          text-align: center;
        }
        .tagline { color: color-mix(in srgb, var(--white) 85%, transparent); font-size: 0.78rem; margin-bottom: 12px; }
        .barcode {
          height: 34px; margin: 0 auto; max-width: 220px;
          background: repeating-linear-gradient(
            90deg, var(--white) 0 2px, transparent 2px 4px, var(--white) 4px 7px, transparent 7px 8px,
            var(--white) 8px 9px, transparent 9px 12px
          );
        }
      `}</style>
    </div>
  );
}
