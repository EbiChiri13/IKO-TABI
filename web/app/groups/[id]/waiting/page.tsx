"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProgressSteps from "@/components/layout/ProgressSteps";
import ProgressPill from "@/components/members/ProgressPill";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import BottomBar from "@/components/ui/BottomBar";
import Spinner from "@/components/ui/Spinner";
import Toast from "@/components/ui/Toast";
import TagChipList from "@/components/tags/TagChipList";
import TicketButton from "@/components/invite/TicketButton";
import { api, tokenFor } from "@/lib/api";
import type { Tag } from "@/lib/api";
import { useLiveGroup } from "@/lib/useLiveGroup";

/** 回答待ち画面（design: 完成版 投票待ち画面）。全員回答で自動遷移、幹事は2人以上で先へ進める【Q8】 */
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
    })().catch(() => {
      /* タグの表示に失敗しても待機画面自体は表示する */
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
      <ProgressSteps status={group.status} step={group.status === "collecting" ? 2 : undefined} />
      <main className="body">
        <h1 className="ikotabi-logo logo">いこ！たび</h1>
        <h2 className="headline">
          グループ全員の投票が完了するまで
          <br />
          しばらくお待ちください
        </h2>

        <ProgressPill answered={group.answered_count} total={group.member_limit} />
        <p className="sub">みんなの行きたいがそろうまで、もう少しです</p>

        {myTags && myTags.length > 0 && (
          <Card>
            <p className="card-title">あなたが選んだハッシュタグはこちら</p>
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
          <Button variant="quiet" block disabled>
            結果を見る
          </Button>
        </BottomBar>
      )}
      <Toast message={(error instanceof Error ? error.message : null) || startError} />
      <style jsx>{`
        .body { flex: 1; padding: 32px 20px 20px; display: flex; flex-direction: column; gap: 18px; text-align: center; }
        .logo { font-size: 2.2rem; margin-bottom: 4px; }
        .headline { font-size: 1.15rem; text-align: left; }
        .sub { font-size: 0.82rem; color: var(--ink-400); margin-top: -8px; }
        .card-title { font-weight: 700; margin-bottom: 10px; text-align: left; }
      `}</style>
    </div>
  );
}
