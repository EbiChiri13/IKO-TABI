"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Spinner from "@/components/ui/Spinner";
import type { GroupStatus, GroupView } from "@/lib/api";
import { useLiveGroup } from "@/lib/useLiveGroup";

const DESTINATION_FOR_STATUS = {
  collecting: (group: GroupView, id: string) => (group.me.answered ? `/groups/${id}/waiting` : `/groups/${id}/tags`),
  destination: (_group: GroupView, id: string) => `/groups/${id}/vote/destination`,
  lodging: (_group: GroupView, id: string) => `/groups/${id}/vote/lodging`,
  food: (_group: GroupView, id: string) => `/groups/${id}/vote/food`,
  spot: (_group: GroupView, id: string) => `/groups/${id}/vote/spot`,
  done: (_group: GroupView, id: string) => `/groups/${id}/summary`,
} satisfies Record<GroupStatus, (group: GroupView, id: string) => string>;

/** グループの入口。いまの進み具合に応じて、いるべき画面へ振り分ける。 */
export default function GroupEntryPage() {
  const { id: groupId } = useParams<{ id: string }>();
  const router = useRouter();
  const { group, loading, error } = useLiveGroup(groupId);

  useEffect(() => {
    if (group) {
      router.replace(DESTINATION_FOR_STATUS[group.status](group, groupId));
    }
  }, [group, groupId, router]);

  if (error) {
    return (
      <div className="screen">
        <p className="p-6 text-destructive">{error instanceof Error ? error.message : "読み込みに失敗しました"}</p>
      </div>
    );
  }
  return <Spinner label={loading ? "読み込み中…" : "移動しています…"} />;
}
