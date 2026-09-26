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
        <div className="-mt-[22px] flex flex-col items-center">
          <div className="relative">
            {/* チケット本体だけを少し縮小し、外側の星・軌跡（下記、位置は不変）と重ならない余白を作る */}
            <div className="-rotate-[8deg] scale-[0.9]">
              <TicketCard
                name={info.group_name}
                start={info.start_date}
                end={info.end_date}
                tagline="Let's invite someone to go with you."
              />
            </div>
            {/*
              チケット周りの星と軌跡（元デザイン「グループ招待.svg」の座標を、
              チケット外形（ticket-silhouette, 279×443）の実寸コーナーから算出した
              回転+等倍スケール変換（回転 約-8.17°, スケール 1.0900, 原点=チケット中心）で
              このチケットのローカル座標系(0,0)-(279,443)へ写像した値。目視での近似は行わない。
            */}
            <img
              src="/figma/invite-star.svg"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute"
              style={{
                left: "-29.58px",
                top: "255.53px",
                width: "30.16px",
                transform: "translate(-50%, -50%) rotate(10.81deg)",
              }}
            />
            <img
              src="/figma/invite-star.svg"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute"
              style={{
                left: "-43.91px",
                top: "389.79px",
                width: "41.42px",
                transform: "translate(-50%, -50%) rotate(-26.15deg)",
              }}
            />
            <img
              src="/figma/invite-star.svg"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute"
              style={{ left: "301.03px", top: "135.54px", width: "41.42px", transform: "translate(-50%, -50%)" }}
            />
            <img
              src="/figma/invite-star.svg"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute"
              style={{
                left: "314.76px",
                top: "401.13px",
                width: "58.80px",
                transform: "translate(-50%, -50%) rotate(19.49deg)",
              }}
            />
            {/* 星の軌跡（元デザインの stroke #0C3239, width 2 の線・曲線をそのまま座標変換） */}
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute"
              style={{ left: "-19.80px", top: "267.54px", width: "33.60px", height: "45px" }}
              viewBox="0 0 33.6 45"
              fill="none"
            >
              <line x1="1.2" y1="1.2" x2="32.4" y2="43.8" stroke="#0C3239" strokeWidth="2.18" strokeLinecap="round" />
            </svg>
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute"
              style={{
                left: "-17.03px",
                top: "398.14px",
                width: "42.18px",
                height: "41.09px",
                transform: "scale(0.5)",
                transformOrigin: "top left",
              }}
              viewBox="0 0 42.18 41.09"
              fill="none"
            >
              <path
                d="M40.98 39.89C37.71 25.18 19.18 5.01 1.2 1.2"
                stroke="#0C3239"
                strokeWidth="2.18"
                strokeLinecap="round"
              />
            </svg>
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute"
              style={{ left: "285.64px", top: "149.98px", width: "14.17px", height: "61.14px" }}
              viewBox="0 0 14.17 61.14"
              fill="none"
            >
              <line x1="1.2" y1="59.94" x2="12.97" y2="1.2" stroke="#0C3239" strokeWidth="2.18" strokeLinecap="round" />
            </svg>
          </div>
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
