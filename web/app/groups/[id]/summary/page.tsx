"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import TicketCard from "@/components/invite/TicketCard";
import MemberWinsList from "@/components/summary/MemberWinsList";
import PlaceTimeline from "@/components/summary/PlaceTimeline";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import type { GroupSummary } from "@/lib/api";
import { api, tokenFor } from "@/lib/api";

/** 決定まとめ画面（Figma 473:4979 完成版 計画確定）。旅の内容と、全員の希望がかなったかを確認する */
export default function SummaryPage() {
  const { id: groupId } = useParams<{ id: string }>();
  const router = useRouter();
  const token = tokenFor(groupId);
  const [summary, setSummary] = useState<GroupSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api
      .summary(groupId, token)
      .then((s) => {
        if (s.status !== "done") {
          router.replace(`/groups/${groupId}`);
        } else {
          setSummary(s);
        }
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "読み込みに失敗しました"));
  }, [groupId, token, router]);

  if (error) return <p className="p-6 text-destructive">{error}</p>;
  if (!summary) return <Spinner />;

  return (
    <div className="screen">
      {/* 暗色チケット風ヘッダー（public/figma/summary-hero.svg / summary-title.svg） */}
      <header className="relative h-[213px] shrink-0 overflow-hidden">
        <img
          src="/figma/summary-hero.svg"
          alt=""
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[247px] w-full"
        />
        <img
          src="/figma/summary-title.svg"
          alt="いこ！たび"
          className="relative mx-auto mt-[60px] block h-[54px] w-[174px]"
        />
        <h1 className="sr-only">旅の計画が確定しました</h1>
      </header>
      <main className="flex flex-1 flex-col gap-5 px-5 pb-[calc(24px+env(safe-area-inset-bottom))]">
        {summary.destination && (
          /* ヘッダーに重ねる（Figma: チケット上端 y=151 → 62px オーバーラップ） */
          <div className="-mt-[22px] flex flex-col">
            <TicketCard
              groupId={groupId}
              name={`${summary.name}（${summary.destination.name}）`}
              start={summary.start_date}
              end={summary.end_date}
              photoUrl={summary.destination.image}
              tagline="良い旅になりますように"
            />
          </div>
        )}

        <div className="mt-8 flex flex-col gap-9">
          <PlaceTimeline label="観光地" places={summary.spot} />
          <PlaceTimeline label="食事先" places={summary.food} />
          <PlaceTimeline label="宿泊先" places={summary.lodging} />
        </div>

        <Card>
          <h2 className="mb-2.5 text-base font-bold">みんなの希望、かなったかな？</h2>
          <MemberWinsList members={summary.members} />
        </Card>

        {(() => {
          const credits = Array.from(
            new Set([...summary.lodging, ...summary.food].map((p) => p.image_credit).filter((c): c is string => !!c)),
          );
          return credits.length > 0 ? (
            <p className="text-center text-[0.7rem] text-muted-foreground">{credits.join(" / ")}</p>
          ) : null;
        })()}

        <div className="mx-auto w-full max-w-[315px]">
          <Link
            href="/home"
            className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full border border-foreground bg-primary px-6 py-3 text-base font-medium text-primary-foreground shadow-pop transition-transform duration-75 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            ホームに戻る
          </Link>
        </div>
      </main>
    </div>
  );
}
