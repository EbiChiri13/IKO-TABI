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
import { api, tokenFor } from "@/lib/api";
import type { GroupView } from "@/lib/api";

/** 招待画面（design: グループ結成／飛行機の搭乗券風チケット）。友達ごとにリンクを作る【Q15】 */
export default function InvitePage() {
  const { id: groupId } = useParams<{ id: string }>();
  const router = useRouter();
  const token = tokenFor(groupId);

  const [group, setGroup] = useState<GroupView | null>(null);
  const [links, setLinks] = useState<string[]>([]); // このセッションで作った招待URL
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.getGroup(groupId, token).then(setGroup).catch((e: unknown) => setError(e instanceof Error ? e.message : "読み込みに失敗しました"));
  }, [groupId, token]);

  const openSlots = group ? group.member_limit - group.members.length - links.length : 0;

  async function createLink() {
    if (!token) return;
    setCreating(true);
    setError(null);
    try {
      const { token: inviteToken } = await api.createInvite(groupId, token);
      const url = `${window.location.origin}/join/${inviteToken}`;
      setLinks((prev) => [...prev, url]);
      return url;
    } catch (e) {
      setError(e instanceof Error ? e.message || "招待リンクを作れませんでした" : "招待リンクを作れませんでした");
      return null;
    } finally {
      setCreating(false);
    }
  }

  async function share() {
    const url = links[links.length - 1] || (await createLink());
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

  return (
    <div className="screen">
      <InviteHero backHref="/home" groupName={group.name} />
      <main className="flex flex-1 flex-col gap-3.5 pb-5">
        {/* Figma 363:6526: チケット上端 y=151（ヘッダー h213 に 62px 重ねる） */}
        <div className="-mt-[22px] flex flex-col">
          <TicketCard groupId={groupId} name={group.name} start={group.start_date} end={group.end_date} />
        </div>

        <div className="flex flex-col gap-2.5 px-5">
          {links.map((url) => (
            <InviteLinkBox key={url} url={url} />
          ))}
        </div>

        <div className="px-5">
          {openSlots > 0 ? (
            <Button variant="ghost" block onClick={createLink} disabled={creating}>
              {creating ? "作っています…" : `友達を招待するリンクを作る（あと${openSlots}人）`}
            </Button>
          ) : (
            <p className="text-center text-muted-foreground">定員に達しました。</p>
          )}
        </div>

        <div className="mt-auto px-5">
          <Button variant="quiet" block onClick={() => router.push(`/groups/${groupId}/tags`)}>
            あとで
          </Button>
        </div>
      </main>

      <BottomBar note="あとから追加で招待することもできます">
        <Button variant="primary" block onClick={share}>
          <ShareIcon size={16} />
          リンクを共有する
        </Button>
      </BottomBar>
      <Toast message={error} />
    </div>
  );
}
