"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import ProgressSteps from "@/components/layout/ProgressSteps";
import CandidateList from "@/components/candidates/CandidateList";
import BottomBar from "@/components/ui/BottomBar";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Toast from "@/components/ui/Toast";
import { api, connectRealtime, tokenFor } from "@/lib/api";
import type { CandidatesView, CandidateItem, GroupStatus, MemberRole, TargetType } from "@/lib/api";

const META = {
  destination: { title: "行き先を選ぼう", eyebrow: "候補は3件" },
  lodging: { title: "宿を選ぼう", eyebrow: "1つに投票" },
  food: { title: "ごはんを選ぼう", eyebrow: "2つまで投票" },
  spot: { title: "スポットを選ぼう", eyebrow: "3つまで投票" },
} satisfies Record<TargetType, { readonly title: string; readonly eyebrow: string }>;

const NEXT = { destination: "lodging", lodging: "food", food: "spot", spot: "summary" } as const;
const STEP_OF = { destination: 3, lodging: 4, food: 5, spot: 6 } satisfies Record<TargetType, number>;

function isTargetType(value: string): value is TargetType {
  return value === "destination" || value === "lodging" || value === "food" || value === "spot";
}

export default function VoteTypePage() {
  const { id: groupId, type: routeType } = useParams<{ id: string; type: string }>();
  const router = useRouter();
  const type = isTargetType(routeType) ? routeType : null;
  const token = tokenFor(groupId);

  const [data, setData] = useState<CandidatesView | null>(null);
  const [role, setRole] = useState<MemberRole | null>(null);
  const [selected, setSelected] = useState<Set<CandidateItem["id"]>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token || !type) return;
    const [group, candidates] = await Promise.all([api.getGroup(groupId, token), api.candidates(groupId, token, type)]);
    setRole(group.me.role);
    setData(candidates);
    setSelected(new Set(candidates.items.filter((i) => i.my_vote).map((i) => i.id)));

    if (group.status !== type) {
      const path = group.status === "done" ? `/groups/${groupId}/summary` : `/groups/${groupId}/vote/${group.status}`;
      router.replace(path);
    }
  }, [groupId, token, type, router]);

  useEffect(() => {
    load().catch((e: unknown) => setError(e instanceof Error ? e.message : "読み込みに失敗しました"));
  }, [load]);

  useEffect(() => {
    if (!token || !type) return;
    return connectRealtime(groupId, token, (msg) => {
      if (msg.changed?.some((k) => ["votes", "status"].includes(k))) {
        load().catch((e: unknown) => setError(e instanceof Error ? e.message : "読み込みに失敗しました"));
      }
    });
  }, [groupId, token, type, load]);

  function toggle(id: CandidateItem["id"]) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (!data) return next;
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < data.vote_limit) {
        next.add(id);
      }
      return next;
    });
  }

  async function submit() {
    if (!token || !type) return;
    setBusy(true);
    setError(null);
    try {
      await api.vote(groupId, token, type, [...selected]);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message || "投票できませんでした" : "投票できませんでした");
    } finally {
      setBusy(false);
    }
  }

  async function decideNow() {
    if (!token || !type) return;
    setBusy(true);
    setError(null);
    try {
      await api.decide(groupId, token);
      router.push(`/groups/${groupId}/${NEXT[type] === "summary" ? "summary" : `vote/${NEXT[type]}`}`);
    } catch (e) {
      setError(e instanceof Error ? e.message || "締め切れませんでした" : "締め切れませんでした");
    } finally {
      setBusy(false);
    }
  }

  if (!type) return <Spinner label="投票の種類が正しくありません" />;
  if (!data) return <Spinner />;

  const meta = META[type];
  const alreadyVoted = data.items.some((i) => i.my_vote);

  return (
    <div className="screen">
      <AppHeader eyebrow={meta.eyebrow} title={meta.title} backHref={`/groups/${groupId}`} />
      <ProgressSteps step={STEP_OF[type]} />
      <main className="body">
        {data.relaxed && type === "destination" && (
          <p className="notice">選んだ地域だけでは3件そろわなかったので、地域の条件を外して選んでいます。</p>
        )}
        <p className="progress">
          投票済み {data.voted_count} / {data.member_total} 人 ・ {selected.size}/{data.vote_limit} 個選択中
        </p>
        <CandidateList items={data.items} type={type} onToggle={toggle} locked={!data.open} />
      </main>
      <BottomBar note={role === "host" ? "幹事はいつでも今の投票で決められます" : undefined}>
        <Button variant="primary" block disabled={selected.size === 0 || busy} onClick={submit}>
          {busy ? "送信しています…" : alreadyVoted ? "投票を変更する" : "投票する"}
        </Button>
        {role === "host" && (
          <Button variant="ghost" onClick={decideNow} disabled={busy}>
            今の投票で決める
          </Button>
        )}
      </BottomBar>
      <Toast message={error} />
      <style jsx>{`
        .body { flex: 1; padding: 20px; }
        .notice { background: #fff3cd; color: #7a5a00; border-radius: 12px; padding: 10px 14px; font-size: 0.85rem; margin-bottom: 14px; }
        .progress { font-size: 0.85rem; color: var(--ink-400); font-weight: 700; margin-bottom: 12px; }
      `}</style>
    </div>
  );
}
