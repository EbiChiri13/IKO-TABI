"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import WelcomeIllustration from "@/components/home/WelcomeIllustration";
import { myGroups } from "@/lib/api";

/** スプラッシュ画面（design: いこ！たび + 二人のイラスト）。
 *  参加中のグループが端末にあれば、そのままホームへ促す。
 *  アカウントは使わないので「ログイン」はなく、参加はすべて招待リンク経由【Q3】。
 */
export default function WelcomePage() {
  const [hasGroups, setHasGroups] = useState(false);

  useEffect(() => {
    setHasGroups(Object.keys(myGroups()).length > 0);
  }, []);

  return (
    <div className="screen">
      <main className="hero">
        <p className="tagline">
          みんなの<span className="bubble">行きたい</span>を叶える
        </p>
        <h1 className="logo ikotabi-logo">いこ！たび</h1>
        <WelcomeIllustration />
      </main>
      <div className="cta">
        <Link href="/groups/new">
          <Button variant="mint" block>旅行グループをつくる</Button>
        </Link>
        <Link href="/home">
          <Button variant="ghost" block>
            {hasGroups ? "参加中のグループを見る" : "招待リンクから参加する"}
          </Button>
        </Link>
      </div>
      <style jsx>{`
        .screen { background: linear-gradient(180deg, var(--teal-600), var(--teal-500)); }
        .hero {
          flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 18px; padding: 40px 24px 20px; text-align: center; color: var(--white);
        }
        .tagline { font-weight: 700; display: flex; align-items: center; gap: 6px; font-size: 0.95rem; }
        .bubble {
          background: var(--white); color: var(--teal-700); padding: 3px 10px;
          border-radius: var(--radius-pill); font-weight: 800; transform: rotate(-3deg); display: inline-block;
        }
        .logo { font-size: 2.6rem; }
        .cta {
          background: var(--cream-200); border-radius: 28px 28px 0 0;
          padding: 24px 24px calc(28px + env(safe-area-inset-bottom));
          display: flex; flex-direction: column; gap: 10px;
        }
      `}</style>
    </div>
  );
}
