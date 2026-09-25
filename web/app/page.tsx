"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { myGroups } from "@/lib/api";

/**
 * スプラッシュ画面（起動画面）。Figma node 473:4356（402x874）のトプ画。
 * 素材（吹き出し・ワードマーク・後光・人物）は public/splash に配置済み。
 * 人物はシート（y691）をまたいで足元 y710 まで見えるため、シートより上のレイヤーに置く。
 * 参加中のグループがあればホームへ促す。参加はすべて招待リンク経由【Q3】。
 */
export default function WelcomePage() {
  const [hasGroups, setHasGroups] = useState(false);

  useEffect(() => {
    setHasGroups(Object.keys(myGroups()).length > 0);
  }, []);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-primary">
      {/* アート領域（Figma 402x691）。座標はこの領域に対する百分率 */}
      <div className="relative z-20 aspect-[402/691] w-full shrink-0">
        <img
          className="absolute left-[31.34%] top-[22.43%] w-[35.32%] rotate-[-2.01deg]"
          src="/splash/tag-bubble.svg"
          alt=""
          aria-hidden="true"
        />
        <p className="absolute left-[13.9%] top-[27.8%] whitespace-nowrap text-[clamp(13px,3.6vw,16px)] font-extrabold text-background">
          みんなの
        </p>
        <p className="absolute left-[35.6%] top-[24.3%] origin-left rotate-[-6.37deg] whitespace-nowrap text-[clamp(19px,5.2vw,24px)] font-extrabold text-background">
          行きたい
        </p>
        <p className="absolute left-[65.2%] top-[27.8%] whitespace-nowrap text-[clamp(13px,3.6vw,16px)] font-extrabold text-background">
          を叶える
        </p>
        <img className="absolute left-[13.93%] top-[31.69%] w-[74.88%]" src="/splash/wordmark.svg" alt="いこ！たび" />

        {/* 後光だけは横にはみ出すためこの枠で切る */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            className="absolute left-[-26.1%] top-[55.7%] w-[155%] max-w-none"
            src="/splash/glow.svg"
            alt=""
            aria-hidden="true"
          />
        </div>
        {/* 人物は足元（y710）がシートに重なるので枠外へ逃がす。
            透過余白付きPNGを幅だけで縮小すると半分の大きさになるため、
            Figma通りスロット寸法（男119x325 / 女153x304）のaspect枠にobject-coverで充填する */}
        <div className="absolute left-[10.7%] top-[55.72%] w-[29.6%] aspect-[119/325]">
          <img
            className="size-full object-cover object-center"
            src="/splash/person-man.png"
            alt=""
            aria-hidden="true"
          />
        </div>
        <div className="absolute left-[56.97%] top-[58.75%] w-[38.06%] aspect-[153/304]">
          <img
            className="size-full object-cover object-center"
            src="/splash/person-woman.png"
            alt=""
            aria-hidden="true"
          />
        </div>
      </div>

      {/* 白シート */}
      <div className="relative z-10 flex flex-1 flex-col items-center gap-[11px] rounded-t-[27px] bg-background px-6 pt-[30px] pb-[46px]">
        <Link
          href="/register"
          className="flex h-[50px] w-full max-w-[315px] items-center justify-center rounded-full border border-foreground bg-primary text-base font-medium text-foreground no-underline transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          新規登録
        </Link>
        <Link
          href={hasGroups ? "/home" : "/login"}
          className="flex h-[46px] w-full max-w-[315px] items-center justify-center rounded-full border border-foreground bg-background text-base font-medium text-foreground no-underline transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {hasGroups ? "参加中のグループを見る" : "ログイン"}
        </Link>

        {/* ハッカソンのデモ用。アカウント登録を飛ばして進められる導線 */}
        <div className="mt-2 flex w-full max-w-[315px] gap-2">
          <Link
            href="/groups/new"
            className="flex h-[40px] flex-1 items-center justify-center rounded-full border border-dashed border-muted-foreground text-[0.82rem] font-medium text-muted-foreground no-underline transition-opacity hover:opacity-70"
          >
            デモ版を開始
          </Link>
          <Link
            href="/demo/join"
            className="flex h-[40px] flex-1 items-center justify-center rounded-full border border-dashed border-muted-foreground text-[0.82rem] font-medium text-muted-foreground no-underline transition-opacity hover:opacity-70"
          >
            デモ版で参加
          </Link>
        </div>
      </div>
    </div>
  );
}
