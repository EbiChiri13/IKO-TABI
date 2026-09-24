"use client";

import { useCallback, useEffect, useState } from "react";
import { api, connectRealtime, tokenFor } from "./api";
import type { GroupView, RealtimeMessage } from "./api";

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

  const refresh = useCallback(async () => {
    if (!groupId || !token) return;
    try {
      const g = await api.getGroup(groupId, token);
      setGroup(g);
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
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
