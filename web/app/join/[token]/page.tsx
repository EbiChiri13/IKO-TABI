"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import { api, saveMembership, userSession } from "@/lib/api";
import type { FormEvent } from "react";
import type { InviteInfo } from "@/lib/api";

/**
 * 招待参加画面（design: 招待チケット node 473:4614）。
 * リンクを開いた人がアカウント未ログインの場合は、まずログイン／新規登録を促すゲート画面を出し、
 * ログイン後にこの画面へ戻ってきて参加できるようにする。
 */
export default function JoinPage() {
  const { token: inviteToken } = useParams<{ token: string }>();
  const router = useRouter();

  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [joining, setJoining] = useState(false);
  const [session] = useState(() => userSession());

  useEffect(() => {
    api.getInvite(inviteToken).then(setInfo).catch((e: unknown) => setError(e instanceof Error ? e.message : "招待情報を読み込めませんでした"));
  }, [inviteToken]);

  useEffect(() => {
    if (session) setNickname(session.displayName);
  }, [session]);

  async function join(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setJoining(true);
    setError(null);
    try {
      const res = await api.join(inviteToken, nickname);
      saveMembership(res.group_id, res.token, nickname);
      router.push(`/groups/${res.group_id}/tags`);
    } catch (e) {
      setError(e instanceof Error ? e.message || "参加できませんでした" : "参加できませんでした");
    } finally {
      setJoining(false);
    }
  }

  if (error && !info) {
    return (
      <div className="screen">
        <AppHeader title="招待リンク" backHref="/" />
        <main className="body">
          <p className="error">{error}</p>
        </main>
      </div>
    );
  }
  if (!info) return <Spinner />;

  const nextUrl = `/join/${inviteToken}`;

  if (!session) {
    return (
      <div className="screen">
        <div className="ticket-header">
          <p className="ticket-eyebrow">招待チケット</p>
          <p className="ticket-name">{info.group_name}</p>
          <p className="ticket-dates">
            {info.start_date} 〜 {info.end_date}
          </p>
        </div>
        <main className="body">
          <p className="gate-message">
            あなたへの招待チケットが届きました。グループに参加して旅行の計画をしましょう。
          </p>
          <p className="gate-note">参加するにはログインまたは新規登録が必要です。</p>
          <Link href={`/login?next=${encodeURIComponent(nextUrl)}`}>
            <Button variant="primary" block>ログイン</Button>
          </Link>
          <Link href={`/register?next=${encodeURIComponent(nextUrl)}`}>
            <Button variant="quiet" block>アカウントの新規登録はこちら</Button>
          </Link>
        </main>
        <style jsx>{`
          .ticket-header {
            background: var(--teal-900);
            color: var(--white);
            padding: 32px 24px 28px;
            text-align: center;
          }
          .ticket-eyebrow { font-size: 0.78rem; opacity: 0.8; margin-bottom: 8px; }
          .ticket-name { font-size: 1.4rem; font-weight: 800; margin-bottom: 6px; }
          .ticket-dates { font-size: 0.85rem; opacity: 0.85; }
          .body { flex: 1; padding: 24px 20px; display: flex; flex-direction: column; gap: 12px; }
          .gate-message { color: var(--ink-900); font-size: 0.95rem; line-height: 1.6; }
          .gate-note { color: var(--ink-600); font-size: 0.82rem; margin-bottom: 8px; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="screen">
      <AppHeader eyebrow="招待参加" backHref="/" title={info.group_name} />
      <main className="body">
        <Card>
          <p className="row">
            <span>日程</span>
            <b>
              {info.start_date} 〜 {info.end_date}
            </b>
          </p>
          <p className="row">
            <span>参加人数</span>
            <b>
              {info.members} / {info.member_limit}人
            </b>
          </p>
        </Card>

        {info.usable ? (
          <form onSubmit={join} className="form">
            <TextField
              label="あなたのニックネーム"
              placeholder="例：ちり"
              maxLength={20}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
            {error && <p className="error">{error}</p>}
            <Button type="submit" variant="primary" block disabled={!nickname.trim() || joining}>
              {joining ? "参加しています…" : "参加する"}
            </Button>
            <Button type="button" variant="quiet" block onClick={() => router.push("/")}>
              参加しない
            </Button>
          </form>
        ) : (
          <p className="error">このリンクはもう使えません。幹事に新しいリンクをもらってください。</p>
        )}
      </main>
      <style jsx>{`
        .body { flex: 1; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
        .row { display: flex; justify-content: space-between; padding: 4px 0; }
        .form { display: flex; flex-direction: column; gap: 10px; }
        .error { color: var(--danger); font-weight: 700; text-align: center; }
      `}</style>
    </div>
  );
}
