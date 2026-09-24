"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { myGroups } from "@/lib/api";

/**
 * スプラッシュ画面（起動画面）。Figma「サマーハッカソン2026」完成版のトプ画（node 473:4356）を
 * そのまま実装したもの。素材（ロゴのリボン・ワードマーク・後光・二人のイラスト）は
 * Figmaから書き出して public/splash に配置している。二人のイラストは新しいAI生成イラストに更新。
 *
 * 参加中のグループが端末にあれば、そのままホームへ促す。
 * アカウントは使わないので実際のログインフォームはなく、参加はすべて招待リンク経由【Q3】。
 * ボタンの見た目・配置はFigma通り（新規登録＝黒フチの塗り、ログイン＝黒フチの白抜き）。
 */
export default function WelcomePage() {
  const [hasGroups, setHasGroups] = useState(false);

  useEffect(() => {
    setHasGroups(Object.keys(myGroups()).length > 0);
  }, []);

  return (
    <div className="screen">
      <div className="hero">
        <img className="tag-bubble" src="/splash/tag-bubble.svg" alt="" aria-hidden="true" />
        <p className="tagline-left">みんなの</p>
        <p className="tagline-pill">行きたい</p>
        <p className="tagline-right">を叶える</p>
        <img className="wordmark" src="/splash/wordmark.svg" alt="いこ！たび" />

        <img className="glow" src="/splash/glow.svg" alt="" aria-hidden="true" />
        <span className="person person-man" aria-hidden="true">
          <img src="/splash/person-man.png" alt="" />
        </span>
        <span className="person person-woman" aria-hidden="true">
          <img src="/splash/person-woman.png" alt="" />
        </span>
      </div>

      <div className="cta">
        <Link href="/groups/new" className="btn-link">
          <span className="btn btn--fill">新規登録</span>
        </Link>
        <Link href={hasGroups ? "/home" : "/login"} className="btn-link">
          <span className="btn btn--outline">{hasGroups ? "参加中のグループを見る" : "ログイン"}</span>
        </Link>
      </div>
      <style jsx>{`
        .screen {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          max-width: 480px;
          margin: 0 auto;
          background: #48bfae;
        }
        .hero {
          position: relative;
          width: 100%;
          aspect-ratio: 402 / 691;
          overflow: hidden;
        }
        .tag-bubble {
          position: absolute; left: 31.3%; top: 22.4%; width: 35.4%; height: auto;
          transform: rotate(-2.01deg); transform-origin: center;
        }
        .tagline-left, .tagline-right {
          position: absolute; top: 27.8%; margin: 0;
          color: #fff; font-weight: 800; font-size: clamp(13px, 3.6vw, 16px);
          white-space: nowrap;
        }
        .tagline-left { left: 13.9%; }
        .tagline-right { left: 65.2%; }
        .tagline-pill {
          position: absolute; left: 35.6%; top: 24.3%; margin: 0;
          transform: rotate(-6.37deg); transform-origin: left center;
          color: #fff; font-weight: 800; font-size: clamp(19px, 5.2vw, 24px);
          white-space: nowrap;
        }
        .wordmark {
          position: absolute; left: 13.9%; top: 31.7%; width: 70%; height: auto; max-width: 70%;
        }
        .glow {
          position: absolute; left: -26.1%; top: 55.7%; width: 155%; height: auto;
        }
        .person {
          position: absolute; display: block; overflow: hidden;
        }
        .person img {
          display: block; width: 100%; height: 100%; object-fit: cover;
        }
        .person-man { left: 10.7%; top: 55.72%; width: 29.6%; aspect-ratio: 119 / 325; }
        .person-woman { left: 56.97%; top: 58.76%; width: 38.06%; aspect-ratio: 153 / 304; }

        .cta {
          background: var(--cream-200, #fffaf0);
          border-radius: 27px 27px 0 0;
          margin-top: -16px;
          position: relative;
          z-index: 1;
          flex: 1;
          padding: 30px 20px calc(24px + env(safe-area-inset-bottom));
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .btn {
          display: flex; align-items: center; justify-content: center;
          min-height: 50px; border-radius: 34px;
          border: 1px solid #272727;
          font-weight: 500; font-size: 16px; color: #272727;
        }
        .btn--fill { background: #48bfae; }
        .btn--outline { background: #fff; }
        :global(.btn-link) { display: block; text-decoration: none; }
      `}</style>
    </div>
  );
}
