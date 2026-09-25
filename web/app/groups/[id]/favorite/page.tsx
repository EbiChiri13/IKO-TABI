"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { BackIcon } from "@/components/icons";
import ProgressSteps from "@/components/layout/ProgressSteps";
import FavoritePill from "@/components/tags/FavoritePill";
import BottomBar from "@/components/ui/BottomBar";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Toast from "@/components/ui/Toast";
import { api, tokenFor } from "@/lib/api";
import type { Tag } from "@/lib/api";

/** お気に入り選定画面（Figma 363:7030）。選んだタグの中から「今回の旅行で譲れないこと」を1つ選ぶ。 */
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
      <header>
        <div className="flex min-h-[28px] px-5 pt-4">
          <Link href={`/groups/${groupId}/tags`} aria-label="戻る" className="inline-flex text-foreground no-underline">
            <BackIcon />
          </Link>
        </div>
        <ProgressSteps step={2} />
        <div className="px-5 pt-12">
          <h1 className="text-[20px] font-extrabold text-foreground">今回の旅行で譲れないことは？</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            選んだ中から、さらに「これだけは外せない！」
            <br />
            というものを1つ選びましょう
          </p>
        </div>
      </header>
      <main className="flex-1 px-5 pt-7 pb-6">
        <div className="mx-auto grid w-full max-w-[337px] grid-cols-2 gap-x-[29px] gap-y-[14px]">
          {tags.map((t) => (
            <FavoritePill key={t.id} label={t.label} selected={pickedId === t.id} onClick={() => setPickedId(t.id)} />
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
