"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import ProgressSteps from "@/components/layout/ProgressSteps";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import BottomBar from "@/components/ui/BottomBar";
import Spinner from "@/components/ui/Spinner";
import Toast from "@/components/ui/Toast";
import MemberRow from "@/components/members/MemberRow";
import { api } from "@/lib/api";
import { useLiveGroup } from "@/lib/useLiveGroup";

/** 回答待ち画面（仕様書B 4.2）。全員回答で自動遷移、幹事は2人以上で先へ進める【Q8】 */
export default function WaitingPage() {
  const { id: groupId } = useParams();
  const router = useRouter();
  const { group, token, loading, error, refresh } = useLiveGroup(groupId);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState(null);

  useEffect(() => {
    if (group && group.status !== "collecting") {
      router.replace(`/groups/${groupId}/vote/destination`);
    }
  }, [group, groupId, router]);

  async function startNow() {
    setStarting(true);
    setStartError(null);
    try {
      await api.start(groupId, token);
      await refresh();
    } catch (e) {
      setStartError(e.message || "まだ開始できません");
    } finally {
      setStarting(false);
    }
  }

  if (loading || !group) return <Spinner />;

  const canStart = group.me.role === "host" && group.answered_count >= group.min_to_start;

  return (
    <div className="screen">
      <AppHeader eyebrow="回答待ち" title={group.name} backHref={`/groups/${groupId}`} />
      <ProgressSteps status={group.status} />
      <main className="body">
        <Card>
          <p className="lead">
            回答済み {group.answered_count} / {group.member_limit} 人
          </p>
          <ul className="members">
            {group.members.map((m) => (
              <MemberRow key={m.id} {...m} />
            ))}
          </ul>
        </Card>
        <Button
          variant="quiet"
          block
          onClick={() => router.push(`/groups/${groupId}/tags`)}
        >
          希望を直す
        </Button>
      </main>
      {canStart && (
        <BottomBar note="全員そろわなくても、今いるメンバーだけで探せます">
          <Button variant="primary" block onClick={startNow} disabled={starting}>
            {starting ? "探しています…" : "今いるメンバーの希望で行き先を探す"}
          </Button>
        </BottomBar>
      )}
      <Toast message={error?.message || startError} />
      <style jsx>{`
        .body { flex: 1; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
        .lead { font-weight: 700; margin-bottom: 6px; }
        .members { list-style: none; margin: 0; padding: 0; }
      `}</style>
    </div>
  );
}
