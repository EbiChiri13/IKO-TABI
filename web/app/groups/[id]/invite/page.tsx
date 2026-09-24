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
      } catch {
        /* 共有をキャンセルしても何もしない */
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
  }

  if (!token) return <Spinner label="このグループの情報が見つかりません" />;
  if (!group) return <Spinner />;

  return (
    <div className="screen">
      <InviteHero backHref="/home" groupName={group.name} />
      <main className="body">
        <TicketCard
          groupId={groupId}
          name={group.name}
          start={group.start_date}
          end={group.end_date}
          photoUrl={`https://picsum.photos/seed/ikotabi-group-${groupId}/640/280`}
        />

        <div className="links">
          {links.map((url) => (
            <InviteLinkBox key={url} url={url} />
          ))}
        </div>

        <div className="action">
          {openSlots > 0 ? (
            <Button variant="ghost" block onClick={createLink} disabled={creating}>
              {creating ? "作っています…" : `友達を招待するリンクを作る（あと${openSlots}人）`}
            </Button>
          ) : (
            <p className="full">定員に達しました。</p>
          )}
        </div>
      </main>

      <BottomBar note="あとから追加で招待することもできます">
        {links.length > 0 ? (
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
      <div className="next">
        <Button variant="quiet" block onClick={() => router.push(`/groups/${groupId}/tags`)}>
          自分の希望を入力する →
        </Button>
      </div>
      <Toast message={error} />
      <style jsx>{`
        .body { flex: 1; padding: 0 0 20px; display: flex; flex-direction: column; gap: 14px; }
        .links { padding: 0 20px; display: flex; flex-direction: column; gap: 10px; }
        .action { padding: 0 20px; }
        .full { text-align: center; color: var(--ink-400); }
        .next { padding: 0 20px 20px; }
      `}</style>
    </div>
  );
}
