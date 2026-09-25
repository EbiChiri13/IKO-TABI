"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import TicketButton from "@/components/invite/TicketButton";
import ProgressPill from "@/components/members/ProgressPill";
import TagChipList from "@/components/tags/TagChipList";
import BottomBar from "@/components/ui/BottomBar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Toast from "@/components/ui/Toast";
import type { Tag } from "@/lib/api";
import { api } from "@/lib/api";
import { useLiveGroup } from "@/lib/useLiveGroup";

/** 回答待ち画面（Figma 363:6861）。全員回答で自動遷移、幹事は2人以上で先へ進める【Q8】 */
export default function WaitingPage() {
  const { id: groupId } = useParams<{ id: string }>();
  const router = useRouter();
  const { group, token, loading, error, refresh } = useLiveGroup(groupId);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
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
    })().catch((e: unknown) => {
      setStartError(e instanceof Error ? e.message : "タグを読み込めませんでした");
    });
  }, [groupId, token]);

  async function startNow() {
    if (!token) return;
    setStarting(true);
    setStartError(null);
    try {
      await api.start(groupId, token);
      await refresh();
    } catch (e) {
      setStartError(e instanceof Error ? e.message || "まだ開始できません" : "まだ開始できません");
    } finally {
      setStarting(false);
    }
  }

  if (loading || !group) return <Spinner />;

  const canStart = group.me.role === "host" && group.answered_count >= group.min_to_start;

  return (
    <div className="screen">
      <main className="flex flex-1 flex-col gap-[18px] px-5 pt-[73px] pb-5 text-center">
        <h1 className="text-left text-[20px] font-black text-foreground">
          グループ全員の投票が完了するまで
          <br />
          しばらくお待ちください
        </h1>

        <ProgressPill answered={group.answered_count} total={group.member_limit} />
        <p className="-mt-2 text-[0.82rem] text-muted-foreground">みんなの行きたいがそろうまで、もう少しです</p>

        {myTags && myTags.length > 0 && (
          <Card>
            <p className="mb-2.5 text-left font-bold">あなたが選んだハッシュタグはこちら</p>
            <TagChipList labels={myTags.map((t) => t.label)} highlight={myMustHave} />
          </Card>
        )}

        <Button variant="quiet" block onClick={() => router.push(`/groups/${groupId}/tags`)}>
          希望を直す
        </Button>
      </main>

      {canStart && (
        <BottomBar note="全員そろわなくても、今いるメンバーだけで探せます">
          <TicketButton onClick={startNow} busy={starting}>
            チケットを切って出発する
          </TicketButton>
        </BottomBar>
      )}
      {!canStart && (
        <BottomBar note="全員の投票が完了すると結果を見ることが出来ます。">
          <Button variant="quiet" block disabled className="border-foreground bg-foreground/20 text-foreground/60">
            結果を見る
          </Button>
        </BottomBar>
      )}
      <Toast message={(error instanceof Error ? error.message : null) || startError} />
    </div>
  );
}
