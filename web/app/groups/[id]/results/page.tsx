"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import BottomBar from "@/components/ui/BottomBar";
import Spinner from "@/components/ui/Spinner";
import Toast from "@/components/ui/Toast";
import TagResultBar from "@/components/tags/TagResultBar";
import { api, tokenFor } from "@/lib/api";
import type { TagSummary } from "@/lib/api";

/** 投票結果画面（design: 完成版 投票確認画面）。ハッシュタグ集計をもとに行き先を決めていく橋渡し画面。 */
export default function ResultsPage() {
  const { id: groupId } = useParams<{ id: string }>();
  const router = useRouter();
  const token = tokenFor(groupId);

  const [summary, setSummary] = useState<TagSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api
      .tagSummary(groupId, token)
      .then(setSummary)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "読み込みに失敗しました"));
  }, [groupId, token]);

  if (!summary) return <Spinner />;

  return (
    <div className="screen">
      <main className="body">
        <h1 className="ikotabi-logo logo">いこ！たび</h1>
        <h2 className="title">投票結果</h2>
        <p className="lead">この結果をもとに、行き先をきめていきます</p>

        {summary.categories.map((c) => (
          <Card key={c.key}>
            <p className="card-title">{c.label}</p>
            {c.tags.map((t) => (
              <TagResultBar key={t.label} label={t.label} count={t.count} total={summary.member_count} />
            ))}
          </Card>
        ))}
      </main>
      <BottomBar>
        <Button variant="primary" block onClick={() => router.push(`/groups/${groupId}/vote/destination`)}>
          行き先を見る
        </Button>
      </BottomBar>
      <Toast message={error} />
      <style jsx>{`
        .body { flex: 1; padding: 32px 20px 20px; display: flex; flex-direction: column; gap: 14px; text-align: center; }
        .logo { font-size: 2rem; }
        .title { font-size: 1.3rem; }
        .lead { font-size: 0.82rem; color: var(--ink-400); margin-bottom: 8px; }
        .card-title { font-weight: 800; margin-bottom: 12px; text-align: left; }
      `}</style>
    </div>
  );
}
