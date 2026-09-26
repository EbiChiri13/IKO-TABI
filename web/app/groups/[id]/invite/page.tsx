"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarIcon, ShareIcon } from "@/components/icons";
import InviteHero from "@/components/invite/InviteHero";
import TicketCard from "@/components/invite/TicketCard";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Toast from "@/components/ui/Toast";
import type { GroupView } from "@/lib/api";
import { api, inviteLinkFor, saveInviteLink, tokenFor } from "@/lib/api";

/** 招待画面（design: グループ結成／飛行機の搭乗券風チケット）。グループにつき1本のリンクを全員で使い回す。 */
export default function InvitePage() {
  const { id: groupId } = useParams<{ id: string }>();
  const router = useRouter();
  const token = tokenFor(groupId);

  const [hydrated, setHydrated] = useState(false);
  const [group, setGroup] = useState<GroupView | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (!hydrated || !token) return;
    api
      .getGroup(groupId, token)
      .then(setGroup)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "読み込みに失敗しました"));
  }, [groupId, hydrated, token]);

  useEffect(() => {
    setLink(inviteLinkFor(groupId));
  }, [groupId]);

  async function createLink() {
    if (!token) return null;
    setCreating(true);
    setError(null);
    try {
      const { token: inviteToken } = await api.createInvite(groupId, token);
      const url = `${window.location.origin}/join/${inviteToken}`;
      saveInviteLink(groupId, url);
      setLink(url);
      return url;
    } catch (e) {
      setError(e instanceof Error ? e.message || "招待リンクを作れませんでした" : "招待リンクを作れませんでした");
      return null;
    } finally {
      setCreating(false);
    }
  }

  async function share() {
    const url = link || (await createLink());
    if (!url) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "いこたび", text: `${group?.name} に招待されました`, url });
      } catch (e) {
        if (!(e instanceof DOMException && e.name === "AbortError")) {
          setError(e instanceof Error ? e.message : "リンクを共有できませんでした");
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
      } catch (e) {
        setError(e instanceof Error ? e.message : "リンクをコピーできませんでした");
      }
    }
  }

  if (!hydrated) return <Spinner />;
  if (!token) return <Spinner label="このグループの情報が見つかりません" />;
  if (!group) return <Spinner />;

  const full = group.members.length >= group.member_limit;

  return (
    <div className="screen">
      <InviteHero backHref="/home" />
      <main className="flex flex-1 flex-col pb-[34px]">
        {/* Figma 473:4566: チケット上端 y=151（ヘッダー h213 に 62px 重ねる） */}
        <div className="-mt-[22px] flex flex-col">
          <TicketCard groupId={groupId} name={group.name} start={group.start_date} end={group.end_date} />
        </div>

        {full && !link && <p className="mt-6 text-center text-sm text-muted-foreground">定員に達しました。</p>}
        <div className="mt-[69px] px-[44px]">
          <Button
            variant="primary"
            block
            className="h-[50px] min-h-0"
            onClick={share}
            disabled={creating || (full && !link)}
          >
            <ShareIcon size={16} />
            {creating ? "作っています…" : "リンクを共有する"}
          </Button>
        </div>

        {/* Figma 473:4566: share → later → divider → plan */}
        <div className="mt-[10px] flex flex-col items-center px-[28px]">
          <button
            type="button"
            onClick={() => router.push(`/groups/${groupId}/tags`)}
            className="min-h-[43px] cursor-pointer text-[14px] text-foreground hover:text-foreground/70"
          >
            あとで
          </button>
          <div className="w-full border-t border-dashed border-foreground" aria-hidden="true" />
          <Button
            variant="primary"
            block
            className="mx-auto mt-6 h-[50px] min-h-0 w-[315px] max-w-full"
            onClick={() => router.push(`/groups/${groupId}/tags`)}
          >
            <CalendarIcon size={18} />
            計画を始める
          </Button>
        </div>
      </main>
      <Toast message={error} />
    </div>
  );
}
