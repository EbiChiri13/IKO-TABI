"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import CandidateList from "@/components/candidates/CandidateList";
import { BackIcon } from "@/components/icons";
import ProgressSteps from "@/components/layout/ProgressSteps";
import BottomBar from "@/components/ui/BottomBar";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Toast from "@/components/ui/Toast";
import type { CandidateItem, CandidatesView, MemberRole, TargetType } from "@/lib/api";
import { api, connectRealtime, tokenFor } from "@/lib/api";

/** Figma完成版の選定画面（363:6679 行き先 / 363:6722 宿泊 / 363:6808 食事 / 363:6765 観光地）の見出しコピー */
const META = {
  destination: { title: "行き先を決定する", subtitle: "候補の中から、行きたい行き先を1つ投票しましょう" },
  lodging: { title: "宿泊先を決定する", subtitle: "候補の中から、泊まりたい宿泊先に投票しましょう" },
  food: { title: "食事場所を決定する", subtitle: "候補の中から、行きたいご飯屋さんに投票しましょう" },
  spot: { title: "観光スポットを決定する", subtitle: "候補の中から、行きたいスポットに投票しましょう" },
} satisfies Record<TargetType, { readonly title: string; readonly subtitle: string }>;

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
      <header className="bg-background px-5 pt-3.5">
        <div className="flex items-center gap-3">
          <Link href={`/groups/${groupId}`} className="inline-flex text-foreground no-underline" aria-label="戻る">
            <BackIcon size={30} />
          </Link>
          <div className="flex-1 [&>ol]:px-0! [&>ol]:pt-0! [&>ol]:pb-0!">
            <ProgressSteps step={STEP_OF[type]} />
          </div>
        </div>
        <h1 className="mt-2! text-[1.25rem]! leading-tight font-bold text-foreground">{meta.title}</h1>
        <p className="mt-1! text-[0.7rem] text-muted-foreground">{meta.subtitle}</p>
      </header>
      <div className="bg-secondary px-5 pt-2 pb-2">
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
          <p className="mb-3! text-[0.85rem] font-bold text-muted-foreground">
            投票済み {data.voted_count} / {data.member_total} 人 ・ {selected.size}/{data.vote_limit} 個選択中
          </p>
          <CandidateList items={data.items} type={type} onToggle={toggle} locked={!data.open} selectedIds={selected} />
        </div>
      </main>
      <BottomBar note={role === "host" ? "幹事はいつでも今の投票で決められます" : undefined}>
        <Button
          variant="primary"
          block
          className="min-w-0 flex-1 px-3"
          disabled={selected.size === 0 || busy}
          onClick={submit}
        >
          {busy ? "送信しています…" : alreadyVoted ? "投票を変更する" : "投票する"}
        </Button>
        {role === "host" && (
          <Button variant="ghost" className="shrink-0 px-3 text-sm" onClick={decideNow} disabled={busy}>
            今の投票で決める
          </Button>
        )}
      </BottomBar>
      <Toast message={error} />
    </div>
  );
}
