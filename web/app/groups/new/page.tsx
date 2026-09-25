"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import CreateGroupForm from "@/components/group/CreateGroupForm";
import { BackIcon } from "@/components/icons";
import PlaneTrail from "@/components/layout/PlaneTrail";
import type { CreateGroupInput } from "@/lib/api";
import { api, saveMembership } from "@/lib/api";

/** グループ作成画面（Figma 473:5101 — 402x874 / ヘッダー213px濃紺・ティール飾り）。仕様書B 4.2「グループ作成」 */
export default function NewGroupPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: CreateGroupInput) {
    setSubmitting(true);
    setError(null);
    try {
      const { group_id, token } = await api.createGroup(values);
      saveMembership(group_id, token, values.nickname);
      router.push(`/groups/${group_id}/invite`);
    } catch (e) {
      setError(e instanceof Error ? e.message || "作成に失敗しました" : "作成に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="screen">
      {/*
        ヒーロー。Figma 473:5101 の座標どおりに置く：
        濃紺の地 0-213 / 戻る矢印 (27,72) 30px / ラベルは中央で y78 /
        ティールのチケット x44-360（幅316）× y160-258 で回転なし /
        見出しは y190 から2行（各行の後ろに濃紺のバーが入る）
      */}
      <header className="relative h-[213px] shrink-0 bg-panel-dark text-background">
        <Link
          href="/"
          className="absolute top-[72px] left-[27px] inline-flex text-inherit no-underline"
          aria-label="戻る"
        >
          <BackIcon size={30} />
        </Link>
        <p className="absolute top-[75px] left-0 w-full text-center text-[1rem]! font-bold opacity-90">グループ作成</p>
        {/* 右上の飛行機＋飛行機雲（Figma 473:5101。機体は約 x380,y84、雲は左下の約 x236,y140 へ） */}
        <PlaneTrail className="top-[61px] left-[225px] h-[109px] w-[210px] text-background/25" />
        {/* ティールのミニチケット＋バーコード飾り（public/figma/create-*） */}
        <div
          className="pointer-events-none absolute top-[160px] left-1/2 w-[316px] -translate-x-1/2"
          aria-hidden="true"
        >
          <div className="relative aspect-[316/98]">
            <img src="/figma/create-mini-ticket.svg" alt="" className="absolute inset-0 h-full w-full" />
            {/* ミシン目。Figma は切り欠き（チケット内 x219-235）に重なる縦の破線なので、横線の素材を90度回す */}
            <img
              src="/figma/create-stub-line.svg"
              alt=""
              className="absolute top-1/2 left-[70.6%] w-[74px] -translate-x-1/2 -translate-y-1/2 rotate-90"
            />
            {/* バーコード。Figma は横棒（チケット内 x270-299 / 高さ46）なので縦棒の素材を90度回す */}
            <img
              src="/figma/create-stub-barcode-b.svg"
              alt=""
              className="absolute top-1/2 left-[90%] h-[27px] w-[46px] -translate-x-1/2 -translate-y-1/2 rotate-90"
            />
          </div>
        </div>
        <h1 className="absolute top-[190px] left-[59px] z-[1] text-[1.25rem]! leading-[1.5]">
          <span className="inline-block bg-panel-dark px-[7px]">旅行のグループを</span>
          <br />
          <span className="inline-block bg-panel-dark px-[7px]">作りましょう！</span>
        </h1>
      </header>
      <CreateGroupForm onSubmit={handleSubmit} submitting={submitting} error={error} />
    </div>
  );
}
