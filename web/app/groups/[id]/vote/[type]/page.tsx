"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import CandidateList from "@/components/candidates/CandidateList";
import StepHeader from "@/components/layout/StepHeader";
import BottomBar from "@/components/ui/BottomBar";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Toast from "@/components/ui/Toast";
import type { CandidateItem, CandidatesView, TargetType } from "@/lib/api";
import { api, connectRealtime, tokenFor } from "@/lib/api";

/** Figma完成版の選定画面（473:4723 行き先 / 473:4766 宿泊 / 473:4852 食事 / 473:4809 観光地）の見出しコピー */
const META = {
  destination: { title: "行き先を決定する", subtitle: "候補の中から、行きたい行き先を1つ投票しましょう" },
  lodging: { title: "宿泊先を決定する", subtitle: "候補の中から、泊まりたい宿泊先に投票しましょう" },
  food: { title: "食事場所を決定する", subtitle: "候補の中から、行きたいご飯屋さんに投票しましょう" },
  spot: { title: "観光スポットを決定する", subtitle: "候補の中から、行きたいスポットに投票しましょう" },
} satisfies Record<TargetType, { readonly title: string; readonly subtitle: string }>;

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
  const [isHost, setIsHost] = useState(false);
  const [selected, setSelected] = useState<Set<CandidateItem["id"]>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reconsidering, setReconsidering] = useState(false);

  const load = useCallback(async () => {
    if (!token || !type) return;
    const [group, candidates] = await Promise.all([api.getGroup(groupId, token), api.candidates(groupId, token, type)]);
    setData(candidates);
    setIsHost(group.me.role === "host");
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

  async function reconsider() {
    if (!token || !type) return;
    setReconsidering(true);
    setError(null);
    try {
      await api.reconsider(groupId, token, type);
      setSelected(new Set());
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message || "再計算できませんでした" : "再計算できませんでした");
    } finally {
      setReconsidering(false);
    }
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

  if (!type) return <Spinner label="投票の種類が正しくありません" />;
  if (!data) return <Spinner />;

  const meta = META[type];
  const alreadyVoted = data.items.some((i) => i.my_vote);

  return (
    <div className="screen">
      <StepHeader
        step={STEP_OF[type]}
        left="back"
        href={`/groups/${groupId}`}
        title={meta.title}
        subtitle={meta.subtitle}
      />
      <div className="bg-map-band px-5 pt-2 pb-2">
        <div
          aria-hidden="true"
          className="mx-auto aspect-square w-full max-w-[373px] bg-contain bg-center bg-no-repeat"
          style={{ backgroundImage: "url(/figma/japan-map.svg)" }}
        />
      </div>
      <main className="flex flex-1 flex-col px-5 pt-4 pb-5">
        <div className="mx-auto w-full max-w-[380px]">
          {data.relaxed && type === "destination" && (
            <p className="mb-3.5 rounded-sm bg-muted px-3.5 py-2.5 text-[0.85rem] text-foreground/80">
              選んだ地域だけでは3件そろわなかったので、地域の条件を外して選んでいます。
            </p>
          )}
          <div className="mb-3.5 flex flex-col gap-2 rounded-sm bg-muted px-3.5 py-2.5">
            <p className="text-[0.8rem] text-foreground/80">
              候補が少なすぎる・合わないと感じたら、地域や予算の条件を外して選び直せます。
            </p>
            {isHost ? (
              <Button variant="quiet" size="sm" disabled={reconsidering} onClick={reconsider}>
                {reconsidering ? "再計算しています…" : "条件を外して再考慮する"}
              </Button>
            ) : (
              <p className="text-[0.75rem] text-muted-foreground">※幹事だけが操作できます</p>
            )}
          </div>
          <p className="mb-3! text-[0.85rem] font-bold text-muted-foreground">
            投票済み {data.voted_count} / {data.member_total} 人 ・ {selected.size}/{data.vote_limit} 個選択中
          </p>
          <CandidateList items={data.items} type={type} onToggle={toggle} locked={!data.open} selectedIds={selected} />
        </div>
      </main>
      <BottomBar>
        <Button variant="primary" block disabled={selected.size === 0 || busy} onClick={submit}>
          {busy ? "送信しています…" : alreadyVoted ? "投票を変更する" : "投票する"}
        </Button>
      </BottomBar>
      <Toast message={error} />
    </div>
  );
}
