"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProgressSteps from "@/components/layout/ProgressSteps";
import ProgressPill from "@/components/members/ProgressPill";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import BottomBar from "@/components/ui/BottomBar";
import Spinner from "@/components/ui/Spinner";
import Toast from "@/components/ui/Toast";
import TagChipList from "@/components/tags/TagChipList";
import { HomeIcon } from "@/components/icons";
import { api } from "@/lib/api";
import type { Tag } from "@/lib/api";
import { useLiveGroup } from "@/lib/useLiveGroup";

/** 回答待ち画面（design: 完成版 投票待ち画面）。全員回答で自動的に結果画面へ遷移する */
export default function WaitingPage() {
  const { id: groupId } = useParams<{ id: string }>();
  const router = useRouter();
  const { group, token, loading, error } = useLiveGroup(groupId);
  const [myTags, setMyTags] = useState<Tag[] | null>(null);
  const [myMustHave, setMyMustHave] = useState<string | null>(null);

  useEffect(() => {
    if (group && group.status !== "collecting") {
      router.replace(`/groups/${groupId}/results`);
    }
  }, [group, groupId, router]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const [cats, mine] = await Promise.all([api.listTags(), api.getMySelections(groupId, token)]);
      const all = cats.flatMap((c) => c.tags);
      const mySet = new Set(mine.tag_ids);
      setMyTags(all.filter((t) => mySet.has(t.id)));
      setMyMustHave(all.find((t) => t.id === mine.must_have_tag_id)?.label ?? null);
    })().catch(() => {
      /* タグの表示に失敗しても待機画面自体は表示する */
    });
  }, [groupId, token]);

  if (loading || !group) return <Spinner />;

  const allAnswered = group.answered_count >= group.member_limit;

  return (
    <div className="screen">
      <ProgressSteps status={group.status} step={group.status === "collecting" ? 2 : undefined} />
      <main className="flex-1 px-5 pt-8 pb-5 flex flex-col gap-[18px] text-center">
        <h1 className="ikotabi-logo text-[2.2rem] mb-1">いこ！たび</h1>
        <h2 className="text-[1.15rem] text-left">
          グループ全員の投票が完了するまで
          <br />
          しばらくお待ちください
        </h2>

        <ProgressPill answered={group.answered_count} total={group.member_limit} />
        <p className="text-[0.82rem] text-ink-400 -mt-2">みんなの行きたいがそろうまで、もう少しです</p>

        {myTags && myTags.length > 0 && (
          <Card>
            <p className="font-bold mb-2.5 text-left">あなたが選んだハッシュタグはこちら</p>
            <TagChipList labels={myTags.map((t) => t.label)} highlight={myMustHave} />
          </Card>
        )}

        <Button variant="quiet" block onClick={() => router.push(`/groups/${groupId}/tags`)}>
          希望を直す
        </Button>
      </main>

      <BottomBar note="全員の投票が完了すると結果を見ることが出来ます。">
        <Button variant="quiet" block disabled={!allAnswered}>
          結果を見る
        </Button>
        <Link
          href="/home"
          className="w-full flex items-center justify-center gap-2 min-h-[52px] rounded-pill border border-ink-900 bg-white text-ink-900 font-medium text-base no-underline"
        >
          <HomeIcon size={22} />
          ホームへ戻る
        </Link>
      </BottomBar>
      <Toast message={error instanceof Error ? error.message : null} />
    </div>
  );
}
