"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const [selected, setSelected] = useState<Set<CandidateItem["id"]>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // 他メンバーが投票するたびに load() が重複起動しうるため、
  // 古いリクエストが後から返ってきて投票済み人数を巻き戻さないよう、最新のリクエストだけ反映する。
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    if (!token || !type) return;
    const requestId = ++requestIdRef.current;
    const [group, candidates] = await Promise.all([api.getGroup(groupId, token), api.candidates(groupId, token, type)]);
    if (requestId !== requestIdRef.current) return;
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

  async function submit(targetIds: CandidateItem["id"][] = [...selected]) {
    if (!token || !type) return;
    setBusy(true);
    setError(null);
    try {
      await api.vote(groupId, token, type, targetIds);
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
        left="none"
        title={meta.title}
        subtitle={meta.subtitle}
        contentClassName={type === "destination" ? "translate-x-[17px] -translate-y-[9px]" : undefined}
      />
      <section
        className={`relative h-[395px] shrink-0 ${type === "destination" ? "mt-[11px] bg-[#bde3ff]" : "mt-0 bg-map-band"}`}
        aria-label="候補地の地図"
      >
        <div
          aria-hidden="true"
          className="absolute top-[18px] left-1/2 aspect-square w-[373px] max-w-full -translate-x-1/2 bg-contain bg-center bg-no-repeat"
          style={{ backgroundImage: "url(/figma/japan-map.svg)" }}
        />
        {type === "destination" &&
          data.items.slice(0, 2).map((item, index) => (
            <span
              key={item.id}
              aria-hidden="true"
              className={`absolute z-10 grid size-[24px] rotate-[-45deg] place-items-center rounded-full rounded-bl-none border-2 border-white bg-primary text-[10px] font-bold text-foreground shadow ${index === 0 ? "top-[69%] left-[52%]" : "top-[8%] left-[59%]"}`}
            >
              <span className="grid size-[14px] rotate-[45deg] place-items-center rounded-full bg-white text-[10px] leading-none text-primary">
                {index + 1}
              </span>
            </span>
          ))}
        {type === "destination" && (
          <div aria-hidden="true" className="absolute inset-x-0 top-[355px] h-[335px] rounded-t-[23px] bg-background" />
        )}
      </section>
      <main
        className={`relative z-10 flex flex-1 flex-col pb-5 ${type === "destination" ? "-mt-[9px] px-[11px]" : "px-5 pt-4"}`}
      >
        <div className="mx-auto w-full max-w-[380px]">
          {type !== "destination" && (
            <p className="mb-3.5 text-[0.85rem] font-bold text-muted-foreground">
              投票済み {data.voted_count} / {data.member_total} 人 ・ {selected.size}/{data.vote_limit} 個選択中
            </p>
          )}
          <CandidateList
            items={data.items}
            type={type}
            onToggle={toggle}
            onVote={type === "destination" ? (id) => submit([id]) : undefined}
            locked={!data.open || busy}
            selectedIds={selected}
            voteLimit={data.vote_limit}
          />
        </div>
      </main>
      {type !== "destination" && (
        <BottomBar>
          <Button variant="primary" block disabled={selected.size === 0 || busy} onClick={() => submit()}>
            {busy ? "送信しています…" : alreadyVoted ? "投票を変更する" : "投票する"}
          </Button>
        </BottomBar>
      )}
      <Toast message={error} />
    </div>
  );
}
