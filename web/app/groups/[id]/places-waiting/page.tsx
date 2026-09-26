"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HomeIcon } from "@/components/icons";
import ProgressPill from "@/components/members/ProgressPill";
import BottomBar from "@/components/ui/BottomBar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Toast from "@/components/ui/Toast";
import type { CandidatesView } from "@/lib/api";
import { api, tokenFor } from "@/lib/api";
import { useLiveGroup } from "@/lib/useLiveGroup";

const LABEL = { lodging: "宿泊", food: "食事", spot: "観光地" } as const;

/** 宿泊・食事・観光地をすべて投票し終えたあとの投票待ち画面。全員が決まると自動でチケット画面へ進む。 */
export default function PlacesWaitingPage() {
  const { id: groupId } = useParams<{ id: string }>();
  const router = useRouter();
  const token = tokenFor(groupId);
  const { group, loading, error } = useLiveGroup(groupId);
  const [actionError, setActionError] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<"lodging" | "food" | "spot", CandidatesView> | null>(null);

  useEffect(() => {
    if (!group) return;
    if (group.status === "done") {
      router.replace(`/groups/${groupId}/summary`);
    } else if (group.status === "collecting" || group.status === "destination") {
      router.replace(`/groups/${groupId}`);
    }
  }, [group, groupId, router]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const [lodging, food, spot] = await Promise.all([
        api.candidates(groupId, token, "lodging"),
        api.candidates(groupId, token, "food"),
        api.candidates(groupId, token, "spot"),
      ]);
      setProgress({ lodging, food, spot });
    })().catch((e: unknown) => {
      setActionError(e instanceof Error ? e.message : "読み込めませんでした");
    });
  }, [groupId, token]);

  if (loading || !group) return <Spinner />;

  return (
    <div className="screen">
      <header className="px-5 pt-4">
        <div className="flex h-8 items-center">
          <Link href="/home" aria-label="ホームへ戻る" className="inline-flex text-foreground no-underline">
            <HomeIcon size={32} />
          </Link>
        </div>
        <h1 className="pt-[65px] text-left text-[20px] font-black text-foreground">
          グループ全員の投票が完了するまで
          <br />
          しばらくお待ちください
        </h1>
      </header>
      <main className="flex flex-col gap-[18px] px-5 pt-[51px] pb-5 text-center">
        {progress && (
          <Card>
            <div className="flex flex-col gap-4">
              {(Object.keys(LABEL) as (keyof typeof LABEL)[]).map((key) => (
                <div key={key}>
                  <p className="mb-1.5 text-left text-sm font-bold text-foreground">{LABEL[key]}</p>
                  <ProgressPill current={progress[key].voted_count} total={progress[key].member_total} unit="投票" />
                </div>
              ))}
            </div>
          </Card>
        )}
        <p className="-mt-2 text-[0.82rem] text-muted-foreground">みんなの行きたいがそろうまで、もう少しです</p>
      </main>

      <BottomBar note="全員の投票が完了すると結果を見ることが出来ます。">
        <Button variant="quiet" block disabled className="border-foreground bg-foreground/20 text-foreground/60">
          結果を見る
        </Button>
      </BottomBar>
      <Toast message={(error instanceof Error ? error.message : null) || actionError} />
    </div>
  );
}
