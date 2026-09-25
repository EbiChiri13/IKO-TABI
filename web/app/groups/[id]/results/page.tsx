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

/** 投票結果画面（Figma 363:6634）。ハッシュタグ集計をもとに行き先を決めていく橋渡し画面。 */
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
      <main className="flex flex-1 flex-col gap-[14px] px-5 pt-[91px] pb-5 text-center">
        <h1 className="text-[24px] font-black text-foreground">投票結果</h1>
        <p className="mb-2 text-[11px] text-muted-foreground">この結果をもとに、行き先をきめていきます</p>

        {summary.categories.map((c) => (
          <Card key={c.key}>
            <p className="mb-3 text-left font-extrabold">{c.label}</p>
            {c.tags.map((t) => (
              <TagResultBar key={t.label} label={t.label} count={t.count} total={summary.member_count} />
            ))}
          </Card>
        ))}
      </main>
      <BottomBar>
        <Button variant="primary" block className="border-foreground bg-foreground text-background hover:bg-foreground/90 hover:text-background" onClick={() => router.push(`/groups/${groupId}/vote/destination`)}>
          行き先を見る
        </Button>
      </BottomBar>
      <Toast message={error} />
    </div>
  );
}
