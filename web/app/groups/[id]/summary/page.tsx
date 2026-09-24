"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppHeader from "@/components/layout/AppHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import PlaceList from "@/components/summary/PlaceList";
import MemberWinsList from "@/components/summary/MemberWinsList";
import { api, tokenFor } from "@/lib/api";
import type { GroupSummary } from "@/lib/api";

/** 決定まとめ画面（仕様書B 4.2）。旅の内容と、全員の希望がかなったかを確認する */
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
      <AppHeader dark eyebrow={`${summary.start_date} 〜 ${summary.end_date}`} title={summary.name} />
      <main className="body">
        {summary.destination && (
          <div className="dest">
            <p className="label">行き先</p>
            <p className="pref">{summary.destination.name}</p>
            <p className="area">{summary.destination.area}</p>
          </div>
        )}

        <Card>
          <PlaceList title="宿" places={summary.lodging} />
          <PlaceList title="ごはん" places={summary.food} />
          <PlaceList title="スポット" places={summary.spot} />
        </Card>

        <Card>
          <h2 className="section-title">みんなの希望、かなったかな？</h2>
          <MemberWinsList members={summary.members} />
        </Card>

        <Link href="/home">
          <Button variant="primary" block>ホームへ</Button>
        </Link>
      </main>
      <style jsx>{`
        .body { flex: 1; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
        .dest { text-align: center; padding: 12px 0 4px; }
        .label { font-size: 0.8rem; color: var(--ink-400); font-weight: 700; }
        .pref { font-size: 2rem; font-weight: 900; color: var(--teal-700); line-height: 1.2; }
        .area { color: var(--ink-400); }
        .section-title { font-size: 1rem; margin-bottom: 10px; }
      `}</style>
    </div>
  );
}
