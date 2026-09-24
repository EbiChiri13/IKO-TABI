"use client";

/**
 * サーバー（app/main.py、仕様書B 8章）を呼ぶだけの薄いクライアント。
 * アカウントは使わないので、グループごとのトークンを localStorage に保存する【Q3】。
 */

const STORAGE_KEY = "ikotabi.groups"; // { [groupId]: { token, nickname } }

function loadStore() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveStore(store) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // プライベートブラウジング等で保存できなくても致命的ではない
  }
}

export function myGroups() {
  return loadStore();
}

export function saveMembership(groupId, token, nickname) {
  const store = loadStore();
  store[groupId] = { token, nickname };
  saveStore(store);
}

export function tokenFor(groupId) {
  return loadStore()[groupId]?.token ?? null;
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = "GET", token, body } = {}) {
  const res = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "X-Member-Token": token } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      message = (await res.json()).detail ?? message;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  createGroup: (body) => request("/api/groups", { method: "POST", body }),
  getGroup: (groupId, token) => request(`/api/groups/${groupId}`, { token }),
  createInvite: (groupId, token) => request(`/api/groups/${groupId}/invites`, { method: "POST", token }),
  revokeInvites: (groupId, token) => request(`/api/groups/${groupId}/invites`, { method: "DELETE", token }),
  getInvite: (inviteToken) => request(`/api/invites/${inviteToken}`),
  join: (inviteToken, nickname) =>
    request(`/api/invites/${inviteToken}/join`, { method: "POST", body: { nickname } }),
  listTags: () => request("/api/tags"),
  getMySelections: (groupId, token) => request(`/api/groups/${groupId}/selections/me`, { token }),
  saveMySelections: (groupId, token, tagIds, shareAnswers) =>
    request(`/api/groups/${groupId}/selections/me`, {
      method: "PUT",
      token,
      body: { tag_ids: tagIds, share_answers: shareAnswers },
    }),
  start: (groupId, token) => request(`/api/groups/${groupId}/start`, { method: "POST", token }),
  candidates: (groupId, token, type) => request(`/api/groups/${groupId}/candidates?type=${type}`, { token }),
  vote: (groupId, token, type, targetIds) =>
    request(`/api/groups/${groupId}/votes`, { method: "POST", token, body: { type, target_ids: targetIds } }),
  decide: (groupId, token) => request(`/api/groups/${groupId}/decide`, { method: "POST", token }),
  summary: (groupId, token) => request(`/api/groups/${groupId}/summary`, { token }),
};

/** 変更通知の WebSocket（F-13）。onChange({changed:["votes",...]}) を呼ぶ */
export function connectRealtime(groupId, token, onChange) {
  if (typeof window === "undefined") return () => {};
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  const apiHost = process.env.NEXT_PUBLIC_API_WS_HOST || window.location.host;
  const ws = new WebSocket(`${proto}://${apiHost}/ws/groups/${groupId}?token=${encodeURIComponent(token)}`);
  ws.onmessage = (ev) => {
    try {
      onChange(JSON.parse(ev.data));
    } catch {
      /* ignore */
    }
  };
  const ping = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) ws.send("ping");
  }, 25000);
  return () => {
    clearInterval(ping);
    ws.close();
  };
}
