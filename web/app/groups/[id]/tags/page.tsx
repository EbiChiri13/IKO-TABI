"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BackIcon } from "@/components/icons";
import ProgressSteps from "@/components/layout/ProgressSteps";
import TagCategory from "@/components/tags/TagCategory";
import BottomBar from "@/components/ui/BottomBar";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Switch from "@/components/ui/Switch";
import Toast from "@/components/ui/Toast";
import type { Tag, TagCategory as TagCategoryData } from "@/lib/api";
import { api, tokenFor } from "@/lib/api";

/** ハッシュタグ選択画面（Figma 363:6485）。自由入力はなく、用意された65語から選ぶ【Q6】 */
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
      <header>
        <div className="flex min-h-[28px] px-5 pt-4">
          <Link href={`/groups/${groupId}`} aria-label="戻る" className="inline-flex text-foreground no-underline">
            <BackIcon />
          </Link>
        </div>
        <ProgressSteps step={1} />
        <div className="px-5 pt-12">
          <h1 className="text-[20px] font-extrabold text-foreground">今回の旅行でやりたいことは？</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            気になるものを選んでみましょう（あとから変更できます）
          </p>
        </div>
      </header>
      <main className="flex-1 px-5 pt-7 pb-6">
        <div className="mx-auto flex w-full max-w-[337px] flex-col gap-5">
          {categories.map((c) => (
            <TagCategory key={c.key} label={c.label} tags={c.tags} selectedIds={selected} onToggle={toggle} />
          ))}
        </div>
        <section className="mx-auto mt-3 w-full max-w-[337px] py-1">
          <Switch
            checked={share}
            onChange={setShare}
            label="選んだタグをメンバーに見せる"
            sub="オフのままだと「回答済み」とだけ表示されます"
          />
        </section>
      </main>
      <BottomBar note={allAnswered ? undefined : "それぞれの質問で1つ以上選んでください"}>
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
