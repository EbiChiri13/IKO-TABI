"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GroupView, RealtimeMessage } from "./api";
import { api, connectRealtime, tokenFor } from "./api";

/**
 * グループの状態を取得し、WebSocket の通知が来るたびに取り直す（F-13）。
 * 他のメンバーが回答・投票すると、何もしなくても自動で最新の状態になる。
 */

export interface UseLiveGroupResult {
  group: GroupView | null;
  token: string | null;
  loading: boolean;
  error: unknown;
  refresh: () => Promise<void>;
}

export function useLiveGroup(groupId: string | null | undefined): UseLiveGroupResult {
  const token = groupId ? tokenFor(groupId) : null;
  const [group, setGroup] = useState<GroupView | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  // 他メンバーの回答・投票のたびに refresh() が重複起動しうるため、
  // 古いリクエストが後から返ってきて新しい状態を巻き戻さないよう、最新のリクエストだけ反映する。
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!groupId || !token) return;
    const requestId = ++requestIdRef.current;
    try {
      const g = await api.getGroup(groupId, token);
      if (requestId !== requestIdRef.current) return;
      setGroup(g);
      setError(null);
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      setError(e);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [groupId, token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!groupId || !token) return;
    return connectRealtime(groupId, token, (msg: RealtimeMessage) => {
      if (msg.changed?.some((k) => ["members", "answers", "status", "votes"].includes(k))) {
        refresh();
      }
    });
  }, [groupId, token, refresh]);

  return { group, token, loading, error, refresh };
}
