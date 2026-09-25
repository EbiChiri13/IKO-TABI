"use client";

/**
 * サーバー（app/main.py、仕様書B 8章）を呼ぶだけの薄いクライアント。
 * アカウントは使わないので、グループごとのトークンを localStorage に保存する【Q3】。
 *
 * レスポンスは ./generated/schemas.ts（バックエンドの OpenAPI から自動生成）で実行時に検証します。
 * 型もそのスキーマから導出しているため、サーバーとの二重管理にはなりません。
 * 仕様を変えたときは `npm run api:generate` を実行してください。
 */

import type * as z from "zod";

import * as G from "./generated/schemas";

// ───────── レスポンス・リクエストの型（app/schemas.py が正） ─────────

export type GroupView = z.infer<typeof G.GetGroupApiGroupsGroupIdGetResponse>;
export type GroupStatus = GroupView["status"];
export type Me = GroupView["me"];
export type GroupMember = GroupView["members"][number];

export type TargetType = z.infer<typeof G.CandidatesApiGroupsGroupIdCandidatesGetQueryParams>["type"];
export type CandidatesView = z.infer<typeof G.CandidatesApiGroupsGroupIdCandidatesGetResponse>;
export type CandidateItem = CandidatesView["items"][number];

export type GroupSummary = z.infer<typeof G.SummaryApiGroupsGroupIdSummaryGetResponse>;
export type DecidedDestination = NonNullable<GroupSummary["destination"]>;
export type PlaceSummary = GroupSummary["lodging"][number];
export type SummaryMemberWin = GroupSummary["members"][number];

export type TagCategory = z.infer<typeof G.TagsApiTagsGetResponse>[number];
export type Tag = TagCategory["tags"][number];

export type TagSummary = z.infer<typeof G.TagSummaryApiGroupsGroupIdTagSummaryGetResponse>;
export type TagSummaryCategory = TagSummary["categories"][number];
export type TagSummaryEntry = TagSummaryCategory["tags"][number];

export type InviteInfo = z.infer<typeof G.GetInviteApiInvitesInviteTokenGetResponse>;
export type InviteToken = z.infer<typeof G.CreateInviteApiGroupsGroupIdInvitesPostResponse>;
export type JoinResult = z.infer<typeof G.JoinApiInvitesInviteTokenJoinPostResponse>;
export type CreateGroupResult = z.infer<typeof G.CreateGroupApiGroupsPostResponse>;
export type MySelections = z.infer<typeof G.GetSelectionsApiGroupsGroupIdSelectionsMeGetResponse>;
export type SaveMustHaveResult = z.infer<typeof G.PutMustHaveApiGroupsGroupIdSelectionsMeMustHavePutResponse>;
export type EmptyResult = z.infer<typeof G.PutSelectionsApiGroupsGroupIdSelectionsMePutResponse>;

export type AuthResult = z.infer<typeof G.RegisterApiAuthRegisterPostResponse>;
export type VoteResult = z.infer<typeof G.VoteApiGroupsGroupIdVotesPostResponse>;
export type AccountMe = z.infer<typeof G.MeApiAuthMeGetResponse>;
export type Health = z.infer<typeof G.HealthApiHealthGetResponse>;
export type CreateGroupInput = z.infer<typeof G.CreateGroupApiGroupsPostBody>;

// ───────── 端末内の保存（トークンなど） ─────────

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

const USER_SESSION_KEY = "ikotabi.user"; // { token, displayName }（アカウント機能。グループ参加のトークンとは別物）

export interface UserSession {
  token: string;
  displayName: string;
}

/**
 * ログインセッションは sessionStorage に保存する。localStorage と違いタブ/ウィンドウを閉じると
 * 消えるため、トークンが盗まれた場合でも悪用できる期間を短くできる（XSS自体への対策ではない）。
 */
export function userSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(window.sessionStorage.getItem(USER_SESSION_KEY) || "null") as UserSession | null;
  } catch {
    return null;
  }
}

export function saveUserSession(session: UserSession) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
  } catch {
    // プライベートブラウジング等で保存できなくても致命的ではない
  }
}

export function clearUserSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(USER_SESSION_KEY);
}

// ───────── HTTP ─────────

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** サーバーの応答が OpenAPI の仕様と一致しないとき（実装と仕様がずれている状態）。 */
export class ApiContractError extends ApiError {
  readonly issues: readonly unknown[];

  constructor(path: string, status: number, issues: readonly unknown[]) {
    super(status, `サーバーの応答が想定と一致しません（${path}）`);
    this.name = "ApiContractError";
    this.issues = issues;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  token?: string | null;
  body?: unknown;
}

/** 失敗したレスポンスから画面に出せるメッセージを取り出します。 */
async function errorMessage(res: Response): Promise<string> {
  try {
    const data: unknown = await res.json();
    const detail = typeof data === "object" && data !== null ? (data as { detail?: unknown }).detail : undefined;
    if (typeof detail === "string") return detail;
    // FastAPI の検証エラーは detail が配列で返ることがある（app/main.py で日本語化していますが、念のため）
    if (Array.isArray(detail)) {
      const messages = detail
        .map((d) => (typeof d === "object" && d !== null ? (d as { msg?: unknown }).msg : undefined))
        .filter((m): m is string => typeof m === "string");
      if (messages.length > 0) return messages.join(" / ");
    }
  } catch {
    // JSON でなければ statusText を使う
  }
  return res.statusText;
}

/** レスポンスをスキーマで検証してから返します。合わなければ ApiContractError を投げます。 */
async function parse<S extends z.ZodType>(schema: S, res: Response, path: string): Promise<z.infer<S>> {
  const data: unknown = await res.json();
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[api] サーバーの応答が仕様と一致しません: ${path}`, result.error.issues);
    throw new ApiContractError(path, res.status, result.error.issues);
  }
  return result.data;
}

async function request<S extends z.ZodType>(
  path: string,
  schema: S,
  { method = "GET", token, body }: RequestOptions = {},
): Promise<z.infer<S>> {
  const res = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "X-Member-Token": token } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new ApiError(res.status, await errorMessage(res));
  return parse(schema, res, path);
}

async function authRequest<S extends z.ZodType>(
  path: string,
  schema: S,
  body: unknown,
  token?: string | null,
): Promise<z.infer<S>> {
  const res = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "X-User-Token": token } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new ApiError(res.status, await errorMessage(res));
  return parse(schema, res, path);
}

export const api = {
  register: (displayName: string, email: string, password: string) =>
    authRequest("/api/auth/register", G.RegisterApiAuthRegisterPostResponse, {
      display_name: displayName,
      email,
      password,
    }),
  login: (email: string, password: string) =>
    authRequest("/api/auth/login", G.LoginApiAuthLoginPostResponse, { email, password }),
  createGroup: (body: CreateGroupInput) =>
    request("/api/groups", G.CreateGroupApiGroupsPostResponse, { method: "POST", body }),
  getGroup: (groupId: string, token: string) =>
    request(`/api/groups/${groupId}`, G.GetGroupApiGroupsGroupIdGetResponse, { token }),
  createInvite: (groupId: string, token: string) =>
    request(`/api/groups/${groupId}/invites`, G.CreateInviteApiGroupsGroupIdInvitesPostResponse, {
      method: "POST",
      token,
    }),
  getInvite: (inviteToken: string) =>
    request(`/api/invites/${inviteToken}`, G.GetInviteApiInvitesInviteTokenGetResponse),
  join: (inviteToken: string, nickname: string) =>
    request(`/api/invites/${inviteToken}/join`, G.JoinApiInvitesInviteTokenJoinPostResponse, {
      method: "POST",
      body: { nickname },
    }),
  listTags: () => request("/api/tags", G.TagsApiTagsGetResponse),
  tagSummary: (groupId: string, token: string) =>
    request(`/api/groups/${groupId}/tag-summary`, G.TagSummaryApiGroupsGroupIdTagSummaryGetResponse, { token }),
  getMySelections: (groupId: string, token: string) =>
    request(`/api/groups/${groupId}/selections/me`, G.GetSelectionsApiGroupsGroupIdSelectionsMeGetResponse, { token }),
  saveMySelections: (groupId: string, token: string, tagIds: number[], shareAnswers: boolean) =>
    request(`/api/groups/${groupId}/selections/me`, G.PutSelectionsApiGroupsGroupIdSelectionsMePutResponse, {
      method: "PUT",
      token,
      body: { tag_ids: tagIds, share_answers: shareAnswers },
    }),
  saveMustHave: (groupId: string, token: string, tagId: number) =>
    request(
      `/api/groups/${groupId}/selections/me/must-have`,
      G.PutMustHaveApiGroupsGroupIdSelectionsMeMustHavePutResponse,
      {
        method: "PUT",
        token,
        body: { tag_id: tagId },
      },
    ),
  candidates: (groupId: string, token: string, type: TargetType) =>
    request(`/api/groups/${groupId}/candidates?type=${type}`, G.CandidatesApiGroupsGroupIdCandidatesGetResponse, {
      token,
    }),
  vote: (groupId: string, token: string, type: TargetType, targetIds: number[]) =>
    request(`/api/groups/${groupId}/votes`, G.VoteApiGroupsGroupIdVotesPostResponse, {
      method: "POST",
      token,
      body: { type, target_ids: targetIds },
    }),
  /** 候補が合わないとき、幹事が地域・予算などの条件を外して候補を計算し直す。投票はリセットされる */
  reconsider: (groupId: string, token: string, type: TargetType) =>
    request(
      `/api/groups/${groupId}/candidates/reconsider?type=${type}`,
      G.ReconsiderApiGroupsGroupIdCandidatesReconsiderPostResponse,
      { method: "POST", token },
    ),
  summary: (groupId: string, token: string) =>
    request(`/api/groups/${groupId}/summary`, G.SummaryApiGroupsGroupIdSummaryGetResponse, { token }),
};

// ───────── WebSocket ─────────

/** 変更通知の WebSocket メッセージ（OpenAPI に載らないため手書き） */
export interface RealtimeMessage {
  changed: string[];
}

/** 変更通知の WebSocket（F-13）。onChange({changed:["votes",...]}) を呼ぶ */
export function connectRealtime(groupId: string, token: string, onChange: (msg: RealtimeMessage) => void): () => void {
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
