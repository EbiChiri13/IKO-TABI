"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import BottomBar from "@/components/ui/BottomBar";
import Spinner from "@/components/ui/Spinner";
import Toast from "@/components/ui/Toast";
import InviteHero from "@/components/invite/InviteHero";
import InviteLinkBox from "@/components/invite/InviteLinkBox";
import { api, tokenFor } from "@/lib/api";

/** 招待画面（design 9,14,16,18）。友達ごとにリンクを作る【Q15】 */
export default function InvitePage() {
  const { id: groupId } = useParams();
  const router = useRouter();
  const token = tokenFor(groupId);

  const [group, setGroup] = useState(null);
  const [links, setLinks] = useState([]); // このセッションで作った招待URL
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.getGroup(groupId, token).then(setGroup).catch((e) => setError(e.message));
  }, [groupId, token]);

  const openSlots = group ? group.member_limit - group.members.length - links.length : 0;

  async function createLink() {
    setCreating(true);
    setError(null);
    try {
      const { token: inviteToken } = await api.createInvite(groupId, token);
      const url = `${window.location.origin}/join/${inviteToken}`;
      setLinks((prev) => [...prev, url]);
    } catch (e) {
      setError(e.message || "招待リンクを作れませんでした");
    } finally {
      setCreating(false);
    }
  }

  async function share(url) {
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
        <Card className="summary">
          <div className="thumb" aria-hidden="true" />
          <div>
            <h3>{group.name}</h3>
            <p className="date">
              {group.start_date} 〜 {group.end_date}
            </p>
          </div>
        </Card>

        {links.map((url) => (
          <InviteLinkBox key={url} url={url} />
        ))}

        {openSlots > 0 ? (
          <Button variant="ghost" block onClick={createLink} disabled={creating}>
            {creating ? "作っています…" : `友達を招待するリンクを作る（あと${openSlots}人）`}
          </Button>
        ) : (
          <p className="full">定員に達しました。</p>
        )}
      </main>

      <BottomBar note="あとから追加で招待することもできます">
        {links.length > 0 ? (
          <Button variant="primary" block onClick={() => share(links[links.length - 1])}>
            リンクを共有する
          </Button>
        ) : (
          <Button variant="quiet" block onClick={() => router.push(`/groups/${groupId}/tags`)}>
            あとで
          </Button>
        )}
      </BottomBar>
      {links.length > 0 && (
        <div className="next">
          <Button variant="quiet" block onClick={() => router.push(`/groups/${groupId}/tags`)}>
            自分の希望を入力する →
          </Button>
        </div>
      )}
      <Toast message={error} />
      <style jsx>{`
        .body { flex: 1; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
        .summary { display: flex; gap: 12px; align-items: center; }
        .thumb { width: 48px; height: 48px; border-radius: 14px; background: var(--line); flex: none; }
        .date { font-size: 0.82rem; color: var(--ink-400); }
        .full { text-align: center; color: var(--ink-400); }
        .next { padding: 0 20px 20px; }
      `}</style>
    </div>
  );
}
