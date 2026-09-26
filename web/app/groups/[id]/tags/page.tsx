"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import StepHeader from "@/components/layout/StepHeader";
import TagCategory from "@/components/tags/TagCategory";
import BottomBar from "@/components/ui/BottomBar";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Toast from "@/components/ui/Toast";
import type { Tag, TagCategory as TagCategoryData } from "@/lib/api";
import { api, tokenFor } from "@/lib/api";

/** ハッシュタグ選択画面（Figma 473:4521）。自由入力はなく、用意された65語から選ぶ【Q6】 */
export default function TagsPage() {
  const { id: groupId } = useParams<{ id: string }>();
  const router = useRouter();
  const token = tokenFor(groupId);

  const [categories, setCategories] = useState<TagCategoryData[] | null>(null);
  const [selected, setSelected] = useState<Set<Tag["id"]>>(new Set());
  const [share, setShare] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const [cats, mine] = await Promise.all([api.listTags(), api.getMySelections(groupId, token)]);
      setCategories(cats);
      setSelected(new Set(mine.tag_ids));
      setShare(mine.share_answers);
    })().catch((e: unknown) => setError(e instanceof Error ? e.message : "読み込みに失敗しました"));
  }, [groupId, token]);

  function toggle(id: Tag["id"]) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allAnswered = useMemo(
    () => categories?.every((c) => c.tags.some((t) => selected.has(t.id))) ?? false,
    [categories, selected],
  );

  async function submit() {
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      await api.saveMySelections(groupId, token, [...selected], share);
      router.push(`/groups/${groupId}/favorite`);
    } catch (e) {
      setError(e instanceof Error ? e.message || "保存に失敗しました" : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  if (!categories) return <Spinner />;

  return (
    <div className="screen">
      <StepHeader
        step={1}
        left="home"
        href="/home"
        title="今回の旅行でやりたいことは？"
        subtitle="気になるものを選んでみましょう（あとから変更できます）"
      />
      <main className="flex-1 px-5 pt-7 pb-6">
        <div className="mx-auto flex w-full max-w-[337px] flex-col gap-5">
          {categories.map((c) => (
            <TagCategory key={c.key} label={c.label} tags={c.tags} selectedIds={selected} onToggle={toggle} />
          ))}
        </div>
      </main>
      {/* CTA はコンテンツの末尾に置く。スクロール中にカードの途中へ
          固定表示されないため、モバイルでも選択肢を隠さない。 */}
      <BottomBar>
        <Button
          variant="primary"
          block
          disabled={!allAnswered || saving}
          onClick={submit}
          className="border-foreground bg-foreground text-background shadow-pop hover:bg-foreground/90 hover:text-background"
        >
          {saving ? "送信しています…" : "次へ"}
        </Button>
      </BottomBar>
      <Toast message={error} />
    </div>
  );
}
