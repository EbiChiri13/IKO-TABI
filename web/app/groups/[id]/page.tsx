"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Spinner from "@/components/ui/Spinner";
import { useLiveGroup } from "@/lib/useLiveGroup";

const DESTINATION_FOR_STATUS = {
  collecting: (g, id) => (g.me.answered ? `/groups/${id}/waiting` : `/groups/${id}/tags`),
  destination: (g, id) => `/groups/${id}/vote/destination`,
  lodging: (g, id) => `/groups/${id}/vote/lodging`,
  food: (g, id) => `/groups/${id}/vote/food`,
  spot: (g, id) => `/groups/${id}/vote/spot`,
  done: (g, id) => `/groups/${id}/summary`,
};

/** グループの入口。いまの進み具合に応じて、いるべき画面へ振り分ける。 */
export default function GroupEntryPage() {
  const { id: groupId } = useParams();
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
        <p style={{ padding: 24, color: "var(--danger)" }}>{error.message}</p>
      </div>
    );
  }
  return <Spinner label={loading ? "読み込み中…" : "移動しています…"} />;
}
