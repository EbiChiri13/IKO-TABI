"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { BackIcon } from "@/components/icons";
import TicketCard from "@/components/invite/TicketCard";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import TextField from "@/components/ui/TextField";
import type { InviteInfo } from "@/lib/api";
import { api, saveMembership, userSession } from "@/lib/api";
import { firstError, joinForm } from "@/lib/forms";

/**
 * 招待参加画面（design: 招待チケット node 473:4614 / Figma 473:4612）。
 * アカウント未ログインの場合は、まずログイン／新規登録を促すゲート画面を出し、
 * ログイン後にこの画面へ戻ってきて参加できるようにする。
 * ただし ?demo=1（ハッカソンのデモ版で参加）の場合はこのゲートを飛ばす。
 */
export default function JoinPage() {
  return (
    <Suspense>
      <JoinForm />
    </Suspense>
  );
}

function JoinForm() {
  const { token: inviteToken } = useParams<{ token: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "1";

  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [joining, setJoining] = useState(false);
  const [session] = useState(() => userSession());

  useEffect(() => {
    api
      .getInvite(inviteToken)
      .then(setInfo)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "招待情報を読み込めませんでした"));
  }, [inviteToken]);

  useEffect(() => {
    if (session) setNickname(session.displayName);
  }, [session]);

  async function join() {
    // 送信前にサーバーと同じ条件で検証します。
    const parsed = joinForm.safeParse({ nickname });
    if (!parsed.success) {
      setError(firstError(parsed.error));
      return;
    }
    setJoining(true);
    setError(null);
    try {
      const res = await api.join(inviteToken, parsed.data.nickname);
      saveMembership(res.group_id, res.token, parsed.data.nickname);
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
        <header className="relative h-[213px] shrink-0 overflow-hidden">
          <img src="/figma/invite-header.svg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full" />
          <div className="relative flex h-full flex-col px-5 pb-5 pt-3.5">
            <a
              href="/"
              aria-label="戻る"
              className="-ml-2.5 inline-flex size-11 items-center justify-center rounded-full text-background transition-transform duration-75 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background"
            >
              <BackIcon size={22} />
            </a>
          </div>
        </header>
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-5 pb-6">
          <p className="text-center font-bold text-destructive">{error}</p>
          <Button variant="quiet" block onClick={() => router.push("/")}>
            ホームへ戻る
          </Button>
        </main>
      </div>
    );
  }
  if (!info) return <Spinner />;

  const nextUrl = `/join/${inviteToken}`;

  if (!session && !isDemo) {
    return (
      <div className="screen">
        <div className="bg-foreground px-6 pt-8 pb-7 text-center text-background">
          <p className="mb-2 text-[0.78rem] opacity-80">招待チケット</p>
          <p className="mb-1.5 text-[1.4rem] font-extrabold">{info.group_name}</p>
          <p className="text-[0.85rem] opacity-85">
            {info.start_date} 〜 {info.end_date}
          </p>
        </div>
        <main className="flex flex-1 flex-col gap-3 px-5 py-6">
          <p className="text-[0.95rem] leading-relaxed text-foreground">
            あなたへの招待チケットが届きました。グループに参加して旅行の計画をしましょう。
          </p>
          <p className="mb-2 text-[0.82rem] text-muted-foreground">参加するにはログインまたは新規登録が必要です。</p>
          <Link href={`/login?next=${encodeURIComponent(nextUrl)}`}>
            <Button variant="primary" block>
              ログイン
            </Button>
          </Link>
          <Link href={`/register?next=${encodeURIComponent(nextUrl)}`}>
            <Button variant="quiet" block>
              アカウントの新規登録はこちら
            </Button>
          </Link>
          <Link href={`${nextUrl}?demo=1`}>
            <Button variant="quiet" block>
              デモ版で参加（ログインなし）
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="screen">
      <header className="relative h-[213px] shrink-0 overflow-hidden">
        <img src="/figma/invite-header.svg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <img
          src="/figma/summary-title.svg"
          alt="いこ！たび"
          className="relative mx-auto mt-[55px] block h-[54px] w-[174px]"
        />
        <h1 className="sr-only">「{info.group_name}」への招待</h1>
      </header>

      <main className="flex flex-1 flex-col gap-4 pb-6">
        {/* Figma 473:4612: チケット上端 y=151（ヘッダー h213 に 62px 重ねる） */}
        <div className="-mt-[22px] flex flex-col items-center [&>div]:-rotate-[8deg]">
          <TicketCard
            name={info.group_name}
            start={info.start_date}
            end={info.end_date}
            tagline="Let's invite someone to go with you."
          />
        </div>

        <p className="px-5 text-center text-[0.95rem] leading-relaxed text-foreground">
          あなたへの招待チケットが届きました。
          <br />
          グループに参加して旅行の計画をしましょう。
        </p>

        {info.usable ? (
          <div className="mt-auto flex flex-col gap-2.5 px-5 pb-7">
            {session || isDemo ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void join();
                }}
                className="flex flex-col gap-2.5"
              >
                <TextField
                  label="あなたのニックネーム"
                  hint="※必須"
                  placeholder="例：ちり"
                  maxLength={20}
                  required
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
                {error && <p className="text-center font-bold text-destructive">{error}</p>}
                <Button type="submit" variant="primary" block disabled={!nickname.trim() || joining}>
                  {joining ? "参加しています…" : "グループに参加する"}
                </Button>
              </form>
            ) : (
              <Link href={`/login?next=${encodeURIComponent(nextUrl)}`}>
                <Button variant="primary" block>
                  グループに参加する
                </Button>
              </Link>
            )}
            <button
              type="button"
              onClick={() => router.push("/")}
              className="min-h-[40px] cursor-pointer bg-transparent text-sm text-foreground hover:text-foreground/70"
            >
              参加を辞退する
            </button>
          </div>
        ) : (
          <p className="px-5 text-center font-bold text-destructive">
            このリンクはもう使えません。幹事に新しいリンクをもらってください。
          </p>
        )}
      </main>
    </div>
  );
}
