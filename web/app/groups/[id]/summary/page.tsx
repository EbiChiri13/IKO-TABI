"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import TicketCard from "@/components/invite/TicketCard";
import PlaneTrail from "@/components/layout/PlaneTrail";
import PlaceTimeline from "@/components/summary/PlaceTimeline";
import MemberWinsList from "@/components/summary/MemberWinsList";
import { api, tokenFor } from "@/lib/api";
import type { GroupSummary } from "@/lib/api";

/** 決定まとめ画面（design: 完成版 計画確定）。旅の内容と、全員の希望がかなったかを確認する */
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

  if (error) return <p style={{ padding: 24, color: "var(--danger)" }}>{error}</p>;
  if (!summary) return <Spinner />;

  return (
    <div className="screen">
      <header className="hero">
        <PlaneTrail />
        <p className="eyebrow">旅の計画が確定しました</p>
      </header>
      <main className="body">
        {summary.destination && (
          <TicketCard
            groupId={groupId}
            name={`${summary.name}（${summary.destination.name}）`}
            start={summary.start_date}
            end={summary.end_date}
            photoUrl={summary.destination.image}
            tagline="良い旅になりますように"
          />
        )}

        <div className="timelines">
          <PlaceTimeline label="観光地" places={summary.spot} />
          <PlaceTimeline label="食事先" places={summary.food} />
          <PlaceTimeline label="宿泊先" places={summary.lodging} />
        </div>

        <Card>
          <h2 className="section-title">みんなの希望、かなったかな？</h2>
          <MemberWinsList members={summary.members} />
        </Card>

        <Link href="/home">
          <Button variant="primary" block>ホームに戻る</Button>
        </Link>
      </main>
      <style jsx>{`
        .hero {
          position: relative; overflow: hidden;
          background: var(--teal-900); color: var(--white);
          padding: 18px 20px 30px; text-align: center;
        }
        .eyebrow { font-weight: 700; position: relative; z-index: 1; }
        .body { flex: 1; padding: 20px; display: flex; flex-direction: column; gap: 20px; }
        .timelines { display: flex; flex-direction: column; gap: 18px; margin-top: 8px; }
        .section-title { font-size: 1rem; margin-bottom: 10px; }
      `}</style>
    </div>
  );
}
