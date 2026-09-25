"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import CreateGroupForm from "@/components/group/CreateGroupForm";
import { BackIcon } from "@/components/icons";
import type { CreateGroupInput } from "@/lib/api";
import { api, saveMembership } from "@/lib/api";

/** グループ作成画面（Figma 363:7047 — 402x874 / ヘッダー213px濃紺・ティール飾り）。仕様書B 4.2「グループ作成」 */
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
      {/* ヒーロー（Figma: 高さ213pxの濃紺地にティールのミニチケット飾り） */}
      <header className="relative h-[213px] shrink-0 overflow-hidden bg-foreground px-5 pt-3.5 pb-6 text-background">
        <div className="mb-2 flex min-h-[28px]">
          <Link href="/" className="inline-flex text-inherit no-underline" aria-label="戻る">
            <BackIcon />
          </Link>
        </div>
        <p className="mb-1! text-[0.85rem] font-bold opacity-90">グループ作成</p>
        <h1 className="relative z-[1] text-[1.5rem]! whitespace-pre-line">{"旅行のグループを\n作りましょう！"}</h1>
        {/* ティールのミニチケット＋バーコード飾り（public/figma/create-*） */}
        <div
          className="pointer-events-none absolute right-[-32px] bottom-[-12px] w-[270px] rotate-[-5deg]"
          aria-hidden="true"
        >
          <div className="relative aspect-[316/98]">
            <img src="/figma/create-mini-ticket.svg" alt="" className="absolute inset-0 h-full w-full" />
            <img src="/figma/create-stub-line.svg" alt="" className="absolute left-[8%] top-1/2 w-[24%]" />
            <img
              src="/figma/create-stub-barcode-a.svg"
              alt=""
              className="absolute left-[42%] top-[34%] h-[32%] w-[7%]"
            />
            <img
              src="/figma/create-stub-barcode-b.svg"
              alt=""
              className="absolute left-[76%] top-[34%] h-[32%] w-[16%]"
            />
          </div>
        </div>
      </header>
      <CreateGroupForm onSubmit={handleSubmit} submitting={submitting} error={error} />
    </div>
  );
}
