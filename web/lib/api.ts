"use client";

/**
 * サーバー（app/main.py、仕様書B 8章）を呼ぶだけの薄いクライアント。
 * アカウントは使わないので、グループごとのトークンを localStorage に保存する【Q3】。
 */

export type TargetType = "destination" | "lodging" | "food" | "spot";
export type GroupStatus = "collecting" | TargetType | "done";
export type MemberRole = "host" | "member";

const STORAGE_KEY = "ikotabi.groups"; // { [groupId]: { token, nickname } }

export interface GroupMembership {
  token: string;
  nickname: string;
}

export type GroupStore = Record<string, GroupMembership>;

function loadStore(): GroupStore {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}") as GroupStore;
  } catch {
    return {};
  }
}

function saveStore(store: GroupStore) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // プライベートブラウジング等で保存できなくても致命的ではない
  }
}

export function myGroups(): GroupStore {
  return loadStore();
}

export function saveMembership(groupId: string, token: string, nickname: string) {
  const store = loadStore();
  store[groupId] = { token, nickname };
  saveStore(store);
}

export function tokenFor(groupId: string): string | null {
  return loadStore()[groupId]?.token ?? null;
}

const INVITE_LINK_KEY = "ikotabi.inviteLinks"; // { [groupId]: url }（全員同じリンクを使い回すためのキャッシュ）

export function inviteLinkFor(groupId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const store = JSON.parse(window.localStorage.getItem(INVITE_LINK_KEY) || "{}") as Record<string, string>;
    return store[groupId] ?? null;
  } catch {
    return null;
  }
}

export function saveInviteLink(groupId: string, url: string) {
  if (typeof window === "undefined") return;
  try {
    const store = JSON.parse(window.localStorage.getItem(INVITE_LINK_KEY) || "{}") as Record<string, string>;
    store[groupId] = url;
    window.localStorage.setItem(INVITE_LINK_KEY, JSON.stringify(store));
  } catch {
    // プライベートブラウジング等で保存できなくても致命的ではない
  }
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  token?: string | null;
  body?: unknown;
}

async function request<T>(path: string, { method = "GET", token, body }: RequestOptions = {}): Promise<T> {
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
      message = ((await res.json()) as { detail?: string }).detail ?? message;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return null as T;
  return (await res.json()) as T;
}

// ───────── API レスポンスの型（app/service.py の戻り値に対応） ─────────

export interface Me {
  id: number;
  nickname: string;
  role: MemberRole;
  share_answers: boolean;
  answered: boolean;
}

export interface GroupMember {
  id: number;
  nickname: string;
  role: MemberRole;
  answered: boolean;
  is_me: boolean;
  /** 本人が公開を選んだときだけ返る【Q16】 */
  tags: string[] | null;
}

export interface GroupView {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  member_limit: number;
  status: GroupStatus;
  me: Me;
  members: GroupMember[];
  answered_count: number;
  /** 幹事にしか返らない */
  open_invites: number | null;
  /** 投票フェーズ中のみ返る */
  voted_count: number | null;
  min_to_start: number;
}

export interface Tag {
  id: number;
  label: string;
  kind: string;
}

export interface TagCategory {
  key: string;
  label: string;
  tags: Tag[];
}

export interface InviteInfo {
  group_name: string;
  start_date: string;
  end_date: string;
  members: number;
  member_limit: number;
  usable: boolean;
}

export interface JoinResult {
  group_id: string;
  token: string;
  group_name: string;
}

export interface CreateGroupResult {
  group_id: string;
  token: string;
}

export interface InviteToken {
  token: string;
}

export interface RevokeResult {
  revoked: number;
}

export interface MySelections {
  tag_ids: number[];
  share_answers: boolean;
  /** 「今回の旅行で譲れないこと」。お気に入り選定で選ぶまでは null */
  must_have_tag_id: number | null;
}

export type SaveSelectionsResult = Record<string, never>;

export interface SaveMustHaveResult {
  started: boolean;
}

export interface CreateGroupInput {
  name: string;
  start_date: string;
  end_date: string;
  member_limit: number;
  nickname: string;
}

export type CandidateItem = CandidateItemBase & CandidateItemDestination & CandidateItemPlace;

interface CandidateItemBase {
  id: number;
  rank: number;
  match: number;
  matched_count: number;
  member_count: number;
  reason: string;
  votes: number;
  my_vote: boolean;
  decided: boolean;
  name: string;
  tags: string[];
  /** 実写真は無いのでダミー画像（picsum.photos）が入る */
  image: string;
}

interface CandidateItemDestination {
  area?: string;
  region?: string;
  description?: string;
}

interface CandidateItemPlace {
  price?: number;
  ticket?: boolean;
}

export interface CandidatesView {
  type: TargetType;
  open: boolean;
  relaxed: boolean;
  vote_limit: number;
  pick_count: number;
  voted_count: number;
  member_total: number;
  items: CandidateItem[];
}

export interface DecidedDestination {
  id: number;
  name: string;
  area: string;
  description: string;
  image: string;
}

export interface PlaceSummary {
  id: number;
  name: string;
  tags: string[];
  price: number;
  ticket: boolean;
  image: string;
}

export interface SummaryMemberWin {
  nickname: string;
  wins: number;
  detail: Record<TargetType, number>;
}

export interface GroupSummary {
  name: string;
  start_date: string;
  end_date: string;
  status: GroupStatus;
  destination: DecidedDestination | null;
  lodging: PlaceSummary[];
  food: PlaceSummary[];
  spot: PlaceSummary[];
  members: SummaryMemberWin[];
}

/** 変更通知の WebSocket メッセージ */
export interface RealtimeMessage {
  changed: string[];
}

export interface TagSummaryEntry {
  label: string;
  count: number;
}

export interface TagSummaryCategory {
  key: string;
  label: string;
  tags: TagSummaryEntry[];
}

export interface TagSummary {
  member_count: number;
  categories: TagSummaryCategory[];
}

export const api = {
  createGroup: (body: CreateGroupInput) => request<CreateGroupResult>("/api/groups", { method: "POST", body }),
  getGroup: (groupId: string, token: string) => request<GroupView>(`/api/groups/${groupId}`, { token }),
  createInvite: (groupId: string, token: string) =>
    request<InviteToken>(`/api/groups/${groupId}/invites`, { method: "POST", token }),
  revokeInvites: (groupId: string, token: string) =>
    request<RevokeResult>(`/api/groups/${groupId}/invites`, { method: "DELETE", token }),
  getInvite: (inviteToken: string) => request<InviteInfo>(`/api/invites/${inviteToken}`),
  join: (inviteToken: string, nickname: string) =>
    request<JoinResult>(`/api/invites/${inviteToken}/join`, { method: "POST", body: { nickname } }),
  listTags: () => request<TagCategory[]>("/api/tags"),
  tagSummary: (groupId: string, token: string) =>
    request<TagSummary>(`/api/groups/${groupId}/tag-summary`, { token }),
  getMySelections: (groupId: string, token: string) =>
    request<MySelections>(`/api/groups/${groupId}/selections/me`, { token }),
  saveMySelections: (groupId: string, token: string, tagIds: number[], shareAnswers: boolean) =>
    request<SaveSelectionsResult>(`/api/groups/${groupId}/selections/me`, {
      method: "PUT",
      token,
      body: { tag_ids: tagIds, share_answers: shareAnswers },
    }),
  saveMustHave: (groupId: string, token: string, tagId: number) =>
    request<SaveMustHaveResult>(`/api/groups/${groupId}/selections/me/must-have`, {
      method: "PUT",
      token,
      body: { tag_id: tagId },
    }),
  start: (groupId: string, token: string) =>
    request<{ ok: boolean }>(`/api/groups/${groupId}/start`, { method: "POST", token }),
  candidates: (groupId: string, token: string, type: TargetType) =>
    request<CandidatesView>(`/api/groups/${groupId}/candidates?type=${type}`, { token }),
  vote: (groupId: string, token: string, type: TargetType, targetIds: number[]) =>
    request<{ ok: boolean }>(`/api/groups/${groupId}/votes`, {
      method: "POST",
      token,
      body: { type, target_ids: targetIds },
    }),
  decide: (groupId: string, token: string) =>
    request<{ ok: boolean }>(`/api/groups/${groupId}/decide`, { method: "POST", token }),
  summary: (groupId: string, token: string) => request<GroupSummary>(`/api/groups/${groupId}/summary`, { token }),
};

/** 変更通知の WebSocket（F-13）。onChange({changed:["votes",...]}) を呼ぶ */
export function connectRealtime(
  groupId: string,
  token: string,
  onChange: (msg: RealtimeMessage) => void,
): () => void {
  if (typeof window === "undefined") return () => {};
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  const apiHost = process.env.NEXT_PUBLIC_API_WS_HOST || window.location.host;
  const ws = new WebSocket(`${proto}://${apiHost}/ws/groups/${groupId}?token=${encodeURIComponent(token)}`);
  ws.onmessage = (ev) => {
    try {
      onChange(JSON.parse(ev.data as string) as RealtimeMessage);
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
