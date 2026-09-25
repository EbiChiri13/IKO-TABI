"use client";

/**
 * フォームの入力検証です。バックエンドのリクエストモデル（app/main.py）から生成された
 * スキーマをそのまま使うため、制約（パスワード8文字以上、定員2〜4など）がサーバーと自動的に一致します。
 * OpenAPI では表せない条件（日付の前後関係）だけをここで足します。
 */

import * as z from "zod";

import * as G from "./generated/schemas";

// 検証エラーのメッセージを日本語にします。
z.config(z.locales.ja());

/**
 * 前後の空白を落としてから検証します。
 * サーバー側も StringConstraints(strip_whitespace=True) で空白だけの入力を弾くため、
 * ここで揃えておくと「空白だけのニックネーム」が 422 になる前に気づけます。
 */
function trimmed(value: unknown): unknown {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(trimmed);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, trimmed(item)]));
  }
  return value;
}

export const registerForm = z.preprocess(trimmed, G.RegisterApiAuthRegisterPostBody);
export const loginForm = z.preprocess(trimmed, G.LoginApiAuthLoginPostBody);
export const joinForm = z.preprocess(trimmed, G.JoinApiInvitesInviteTokenJoinPostBody);

/** 出発日と帰る日の前後関係は OpenAPI に現れないため、サーバー（GroupIn）と同じ条件をここで足します。 */
export const createGroupForm = z
  .preprocess(trimmed, G.CreateGroupApiGroupsPostBody)
  .refine((v) => v.end_date >= v.start_date, { message: "帰る日は出発日以降にしてください", path: ["end_date"] });

/** 画面にはエラーを1つだけ出すので、最初のメッセージを取り出します。 */
export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "入力内容を確認してください";
}
