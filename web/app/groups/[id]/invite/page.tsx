"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarIcon, ShareIcon } from "@/components/icons";
import InviteHero from "@/components/invite/InviteHero";
import InviteLinkBox from "@/components/invite/InviteLinkBox";
import TicketCard from "@/components/invite/TicketCard";
import BottomBar from "@/components/ui/BottomBar";
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

  const [group, setGroup] = useState<GroupView | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!token) return;
    api
      .getGroup(groupId, token)
      .then(setGroup)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "読み込みに失敗しました"));
  }, [groupId, token]);

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

  if (!token) return <Spinner label="このグループの情報が見つかりません" />;
  if (!group) return <Spinner />;

  const full = group.members.length >= group.member_limit;

  return (
    <div className="screen">
      <InviteHero backHref="/home" groupName={group.name} />
      <main className="flex flex-1 flex-col gap-3.5 pb-5">
        {/* Figma 473:4566: チケット上端 y=151（ヘッダー h213 に 62px 重ねる） */}
        <div className="-mt-[22px] flex flex-col">
          <TicketCard groupId={groupId} name={group.name} start={group.start_date} end={group.end_date} />
        </div>

        <div className="flex flex-col gap-2.5 px-5">
          {link ? (
            <InviteLinkBox url={link} />
          ) : full ? (
            <p className="text-center text-muted-foreground">定員に達しました。</p>
          ) : (
            <Button variant="ghost" block onClick={createLink} disabled={creating}>
              {creating ? "作っています…" : "招待リンクを作る"}
            </Button>
          )}
        </div>

        {/* Figma 473:4566 は「リンクを共有する」→「あとで」→「計画を始める」の順に縦に並ぶ */}
        <div className="mt-auto flex flex-col items-center gap-1 px-5">
          <button
            type="button"
            onClick={() => router.push(`/groups/${groupId}/tags`)}
            className="cursor-pointer py-2 text-[14px] text-muted-foreground hover:text-foreground"
          >
            あとで
          </button>
          <Button variant="ghost" block onClick={() => router.push(`/groups/${groupId}/tags`)}>
            <CalendarIcon size={18} />
            計画を始める
          </Button>
        </div>
      </main>

      <BottomBar note="このリンクをそのままみんなに共有すればOKです（人ごとに変える必要はありません）">
        <Button variant="primary" block onClick={share} disabled={creating || (full && !link)}>
          <ShareIcon size={16} />
          リンクを共有する
        </Button>
      </BottomBar>
      <Toast message={error} />
    </div>
  );
}
