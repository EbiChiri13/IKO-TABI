"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import SpeechBubbleSticker from "@/components/layout/SpeechBubbleSticker";
import CreateGroupForm from "@/components/group/CreateGroupForm";
import { api, saveMembership } from "@/lib/api";
import type { CreateGroupInput } from "@/lib/api";

/** グループ作成画面（design 10-13,15,17,19）。仕様書B 4.2「グループ作成」 */
export default function NewGroupPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: CreateGroupInput) {
    setSubmitting(true);
    setError(null);
    try {
      const { group_id, token } = await api.createGroup(values);
      saveMembership(group_id, token, values.nickname);
      router.push(`/groups/${group_id}/invite`);
    } catch (e) {
      setError(e instanceof Error ? e.message || "作成に失敗しました" : "作成に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="screen">
      <AppHeader eyebrow="グループ作成" backHref="/" title={"旅行のグループを\n作りましょう！"}>
        <SpeechBubbleSticker />
      </AppHeader>
      <CreateGroupForm onSubmit={handleSubmit} submitting={submitting} error={error} />
    </div>
  );
}
