"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import ProgressSteps from "@/components/layout/ProgressSteps";
import TagCategory from "@/components/tags/TagCategory";
import Switch from "@/components/ui/Switch";
import Card from "@/components/ui/Card";
import BottomBar from "@/components/ui/BottomBar";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Toast from "@/components/ui/Toast";
import { api, tokenFor } from "@/lib/api";

/** ハッシュタグ選択画面（仕様書B 4.2・5.1）。自由入力はなく、用意された65語から選ぶ【Q6】 */
export default function TagsPage() {
  const { id: groupId } = useParams();
  const router = useRouter();
  const token = tokenFor(groupId);

  const [categories, setCategories] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [share, setShare] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const [cats, mine] = await Promise.all([api.listTags(), api.getMySelections(groupId, token)]);
      setCategories(cats);
      setSelected(new Set(mine.tag_ids));
      setShare(mine.share_answers);
    })().catch((e) => setError(e.message));
  }, [groupId, token]);

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const allAnswered = useMemo(
    () => categories?.every((c) => c.tags.some((t) => selected.has(t.id))) ?? false,
    [categories, selected]
  );

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const res = await api.saveMySelections(groupId, token, [...selected], share);
      router.push(res.started ? `/groups/${groupId}/vote/destination` : `/groups/${groupId}/waiting`);
    } catch (e) {
      setError(e.message || "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  if (!categories) return <Spinner />;

  return (
    <div className="screen">
      <AppHeader eyebrow="希望を教えてください" title="どんな旅にしたい？" backHref={`/groups/${groupId}`} />
      <ProgressSteps status="collecting" />
      <main className="body">
        {categories.map((c) => (
          <TagCategory key={c.key} label={c.label} tags={c.tags} selectedIds={selected} onToggle={toggle} />
        ))}
        <Card>
          <Switch
            checked={share}
            onChange={setShare}
            label="選んだタグをメンバーに見せる"
            sub="オフのままだと「回答済み」とだけ表示されます"
          />
        </Card>
      </main>
      <BottomBar note={allAnswered ? undefined : "それぞれの質問で1つ以上選んでください"}>
        <Button variant="primary" block disabled={!allAnswered || saving} onClick={submit}>
          {saving ? "送信しています…" : "この希望で決定"}
        </Button>
      </BottomBar>
      <Toast message={error} />
      <style jsx>{`
        .body { flex: 1; padding: 20px; }
      `}</style>
    </div>
  );
}
