"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import ProgressSteps from "@/components/layout/ProgressSteps";
import FavoritePill from "@/components/tags/FavoritePill";
import BottomBar from "@/components/ui/BottomBar";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Toast from "@/components/ui/Toast";
import { api, tokenFor } from "@/lib/api";

/** お気に入り選定画面（design 295:3466）。選んだタグの中から「今回の旅行で譲れないこと」を1つ選ぶ。 */
export default function FavoritePage() {
  const { id: groupId } = useParams();
  const router = useRouter();
  const token = tokenFor(groupId);

  const [tags, setTags] = useState(null); // 自分が選んだタグの {id, label}[]
  const [pickedId, setPickedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const [cats, mine] = await Promise.all([api.listTags(), api.getMySelections(groupId, token)]);
      const byId = new Map(cats.flatMap((c) => c.tags).map((t) => [t.id, t.label]));
      const mySet = new Set(mine.tag_ids);
      setTags(cats.flatMap((c) => c.tags).filter((t) => mySet.has(t.id)));
      setPickedId(mine.must_have_tag_id ?? null);
      if (mine.tag_ids.length === 0) {
        // まだタグを選んでいなければ選択画面へ戻す
        router.replace(`/groups/${groupId}/tags`);
      }
    })().catch((e) => setError(e.message));
  }, [groupId, token, router]);

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const res = await api.saveMustHave(groupId, token, pickedId);
      router.push(res.started ? `/groups/${groupId}/vote/destination` : `/groups/${groupId}/waiting`);
    } catch (e) {
      setError(e.message || "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  if (!tags) return <Spinner />;

  return (
    <div className="screen">
      <AppHeader title="今回の旅行で譲れないことは？" backHref={`/groups/${groupId}/tags`} />
      <ProgressSteps step={2} />
      <main className="body">
        <p className="lead">
          選んだ中から、さらに「これだけは外せない！」
          <br />
          というものを1つ選びましょう
        </p>
        <div className="pills">
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
      <style jsx>{`
        .body { flex: 1; padding: 20px; display: flex; flex-direction: column; gap: 20px; }
        .lead { font-size: 0.88rem; color: var(--ink-600); }
        .pills { display: flex; flex-direction: column; gap: 14px; }
      `}</style>
    </div>
  );
}
