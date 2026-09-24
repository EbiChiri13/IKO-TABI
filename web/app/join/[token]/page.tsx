"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import { api, saveMembership } from "@/lib/api";
import type { FormEvent } from "react";
import type { InviteInfo } from "@/lib/api";

/** 招待参加画面（仕様書B 4.2）。アカウントは不要、ニックネームだけで参加する【Q3】 */
export default function JoinPage() {
  const { token: inviteToken } = useParams<{ token: string }>();
  const router = useRouter();

  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    api.getInvite(inviteToken).then(setInfo).catch((e: unknown) => setError(e instanceof Error ? e.message : "招待情報を読み込めませんでした"));
  }, [inviteToken]);

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
