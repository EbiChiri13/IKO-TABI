"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import StepHeader from "@/components/layout/StepHeader";
import FavoritePill from "@/components/tags/FavoritePill";
import BottomBar from "@/components/ui/BottomBar";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Toast from "@/components/ui/Toast";
import type { Tag } from "@/lib/api";
import { api, tokenFor } from "@/lib/api";

/** お気に入り選定画面（Figma 473:5083）。選んだタグの中から「今回の旅行で譲れないこと」を1つ選ぶ。 */
export default function FavoritePage() {
  const { id: groupId } = useParams<{ id: string }>();
  const router = useRouter();
  const token = tokenFor(groupId);

  const [tags, setTags] = useState<Tag[] | null>(null); // 自分が選んだタグ
  const [pickedId, setPickedId] = useState<Tag["id"] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const [cats, mine] = await Promise.all([api.listTags(), api.getMySelections(groupId, token)]);
      const mySet = new Set(mine.tag_ids);
      setTags(cats.flatMap((c) => c.tags).filter((t) => mySet.has(t.id)));
      setPickedId(mine.must_have_tag_id ?? null);
      if (mine.tag_ids.length === 0) {
        // まだタグを選んでいなければ選択画面へ戻す
        router.replace(`/groups/${groupId}/tags`);
      }
    })().catch((e: unknown) => setError(e instanceof Error ? e.message : "読み込みに失敗しました"));
  }, [groupId, token, router]);

  async function submit() {
    if (!token || !pickedId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await api.saveMustHave(groupId, token, pickedId);
      router.push(res.started ? `/groups/${groupId}/results` : `/groups/${groupId}/waiting`);
    } catch (e) {
      setError(e instanceof Error ? e.message || "保存に失敗しました" : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  if (!tags) return <Spinner />;

  return (
    <div className="screen">
      <StepHeader
        step={2}
        left="back"
        href={`/groups/${groupId}/tags`}
        title="今回の旅行で譲れないことは？"
        subtitle={
          <>
            選んだ中から、さらに「これだけは外せない！」
            <br />
            というものを1つ選びましょう
          </>
        }
      />
      <main className="flex-1 px-5 pt-7 pb-6">
        <div className="mx-auto grid w-full max-w-[337px] grid-cols-2 gap-x-[29px] gap-y-[14px]">
          {tags.map((t) => (
            <FavoritePill
              key={t.id}
              label={t.label}
              selected={pickedId === t.id}
              dimmed={pickedId !== null && pickedId !== t.id}
              onClick={() => setPickedId((prev) => (prev === t.id ? null : t.id))}
            />
          ))}
        </div>
      </main>
      <BottomBar>
        <Button variant="primary" block disabled={!pickedId || saving} onClick={submit}>
          {saving ? "送信しています…" : "投票する"}
        </Button>
      </BottomBar>
      <Toast message={error} />
    </div>
  );
}
