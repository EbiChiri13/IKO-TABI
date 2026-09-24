"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import BottomBar from "@/components/ui/BottomBar";
import Spinner from "@/components/ui/Spinner";
import Toast from "@/components/ui/Toast";
import InviteHero from "@/components/invite/InviteHero";
import InviteLinkBox from "@/components/invite/InviteLinkBox";
import TicketCard from "@/components/invite/TicketCard";
import { ShareIcon } from "@/components/icons";
import { api, tokenFor, inviteLinkFor, saveInviteLink } from "@/lib/api";
import type { GroupView } from "@/lib/api";

/** 招待画面（design: グループ結成／飛行機の搭乗券風チケット）。グループにつき1本の招待リンクを全員で使い回す */
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
    api.getGroup(groupId, token).then(setGroup).catch((e: unknown) => setError(e instanceof Error ? e.message : "読み込みに失敗しました"));
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
      } catch {
        /* 共有をキャンセルしても何もしない */
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
  }

  if (!token) return <Spinner label="このグループの情報が見つかりません" />;
  if (!group) return <Spinner />;

  const full = group.members.length >= group.member_limit;

  return (
    <div className="screen">
      <InviteHero backHref="/home" groupName={group.name} />
      <main className="flex-1 pb-5 flex flex-col gap-3.5">
        <TicketCard
          groupId={groupId}
          name={group.name}
          start={group.start_date}
          end={group.end_date}
          photoUrl={`https://picsum.photos/seed/ikotabi-group-${groupId}/640/280`}
        />

        <div className="px-5 flex flex-col gap-2.5">
          {link ? (
            <InviteLinkBox url={link} />
          ) : full ? (
            <p className="text-center text-ink-400">定員に達しました。</p>
          ) : (
            <Button variant="ghost" block onClick={createLink} disabled={creating}>
              {creating ? "作っています…" : "招待リンクを作る"}
            </Button>
          )}
        </div>
      </main>

      <BottomBar note="このリンクをそのままみんなに共有すればOKです（人ごとに変える必要はありません）">
        {link ? (
          <Button variant="primary" block onClick={share}>
            <ShareIcon size={16} />
            リンクを共有する
          </Button>
        ) : (
          <Button variant="quiet" block onClick={() => router.push("/home")}>
            あとで
          </Button>
        )}
      </BottomBar>
      <div className="px-5 pb-5">
        <Button variant="quiet" block onClick={() => router.push(`/groups/${groupId}/tags`)}>
          自分の希望を入力する →
        </Button>
      </div>
      <Toast message={error} />
    </div>
  );
}
