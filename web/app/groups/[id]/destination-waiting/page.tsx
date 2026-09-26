"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HomeIcon } from "@/components/icons";
import ProgressPill from "@/components/members/ProgressPill";
import TagChipList from "@/components/tags/TagChipList";
import BottomBar from "@/components/ui/BottomBar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Toast from "@/components/ui/Toast";
import type { CandidateItem, Tag } from "@/lib/api";
import { api, tokenFor } from "@/lib/api";
import { useLiveGroup } from "@/lib/useLiveGroup";

/** 行き先投票後の投票待ち画面。全員の投票が揃うと自動で宿泊選定へ進む。 */
export default function DestinationWaitingPage() {
  const { id: groupId } = useParams<{ id: string }>();
  const router = useRouter();
  const token = tokenFor(groupId);
  const { group, loading, error } = useLiveGroup(groupId);
  const [actionError, setActionError] = useState<string | null>(null);
  const [myVoted, setMyVoted] = useState<CandidateItem | null>(null);
  const [myTags, setMyTags] = useState<Tag[] | null>(null);
  const [myMustHave, setMyMustHave] = useState<string | null>(null);

  useEffect(() => {
    if (!group) return;
    if (group.status === "places") {
      router.replace(`/groups/${groupId}/vote/lodging`);
    } else if (group.status === "done") {
      router.replace(`/groups/${groupId}/summary`);
    } else if (group.status === "collecting") {
      router.replace(`/groups/${groupId}`);
    }
  }, [group, groupId, router]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const [candidates, cats, mine] = await Promise.all([
        api.candidates(groupId, token, "destination"),
        api.listTags(),
        api.getMySelections(groupId, token),
      ]);
      setMyVoted(candidates.items.find((i) => i.my_vote) ?? null);
      const all = cats.flatMap((c) => c.tags);
      const mySet = new Set(mine.tag_ids);
      setMyTags(all.filter((t) => mySet.has(t.id)));
      setMyMustHave(all.find((t) => t.id === mine.must_have_tag_id)?.label ?? null);
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
        <ProgressPill current={group.voted_count ?? 0} total={group.member_limit} unit="投票" />
        <p className="-mt-2 text-[0.82rem] text-muted-foreground">みんなの行きたいがそろうまで、もう少しです</p>

        {myVoted && (
          <Card>
            <p className="mb-2.5 text-left font-bold">あなたが投票した行き先はこちら</p>
            <TagChipList labels={[myVoted.name]} />
          </Card>
        )}

        {myTags && myTags.length > 0 && (
          <Card>
            <p className="mb-2.5 text-left font-bold">あなたが選んだハッシュタグはこちら</p>
            <TagChipList labels={myTags.map((t) => t.label)} highlight={myMustHave} />
          </Card>
        )}
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
