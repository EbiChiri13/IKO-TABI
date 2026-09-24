"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import GroupListItem from "@/components/home/GroupListItem";
import TicketCard from "@/components/invite/TicketCard";
import { api, myGroups } from "@/lib/api";
import type { GroupView } from "@/lib/api";

type GroupEntry = { readonly id: string; readonly g: GroupView };

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${y}.${m}/${d}`;
}

/** ホーム画面（design: 完成版 node 473:5133）。参加中のグループをチケット風カードの横スクロールで見せる。 */
export default function HomePage() {
  const [groups, setGroups] = useState<GroupEntry[] | null>(null); // null = 読み込み中

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const store = myGroups();
      const ids = Object.keys(store);
      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const g = await api.getGroup(id, store[id].token);
            return { id, g };
          } catch {
            return null;
          }
        })
      );
      if (!cancelled) setGroups(results.filter((result): result is GroupEntry => result !== null));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (groups === null) return <Spinner />;

  return (
    <div className="screen">
      <header className="brand">
        <img className="wordmark" src="/splash/wordmark.svg" alt="いこ！たび" />
      </header>

      {groups.length > 0 && (
        <div className="carousel" role="list">
          {groups.map(({ id, g }) => (
            <Link key={id} href={`/groups/${id}`} className="carousel-item" role="listitem">
              <TicketCard
                size="lg"
                width={279}
                groupId={id}
                name={g.name}
                start={formatDate(g.start_date)}
                end={formatDate(g.end_date)}
                photoUrl={`https://picsum.photos/seed/ikotabi-group-${id}/640/480`}
              />
            </Link>
          ))}
        </div>
      )}

      <main className="body">
        <section>
          <h2 className="section-title">
            <img className="pin" src="/home/pin.svg" alt="" aria-hidden="true" />
            所属グループ
          </h2>
          {groups.length === 0 ? (
            <p className="empty">まだ参加しているグループがありません。招待リンクを開くか、新しくグループを作ってみましょう。</p>
          ) : (
            <div className="list">
              {groups.map(({ id, g }) => (
                <GroupListItem
                  key={id}
                  groupId={id}
                  name={g.name}
                  dateLabel={`${g.start_date.slice(5)}-${g.end_date.slice(5)}`}
                  memberNames={g.members.map((m) => m.nickname)}
                  status={g.status}
                />
              ))}
            </div>
          )}
        </section>

        <Link href="/groups/new">
          <Button variant="primary" block>新規でグループを作成</Button>
        </Link>
      </main>
      <style jsx>{`
        /* next/link は "use client" コンポーネントなので、直接付けたclassNameには
           styled-jsxのスコープ用ハッシュが注入されない。:global にして確実に効かせる */
        :global(.carousel-item) { text-decoration: none; color: inherit; display: block; }
        .screen { background: var(--white); }
        .brand {
          padding: 26px 0 18px;
          display: flex; justify-content: center;
        }
        .wordmark { width: 43%; height: auto; }
        .carousel {
          display: flex; gap: 20px;
          overflow-x: auto; overflow-y: hidden;
          scroll-snap-type: x proximity;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-x: contain;
          padding: 0 20px 8px;
          scrollbar-width: none;
        }
        .carousel::-webkit-scrollbar { display: none; }
        .body { flex: 1; padding: 24px 20px calc(24px + env(safe-area-inset-bottom)); display: flex; flex-direction: column; gap: 22px; }
        .section-title {
          display: flex; align-items: center; gap: 8px;
          font-size: 1rem; margin-bottom: 10px; border-bottom: 2px solid var(--line); padding-bottom: 8px;
        }
        .pin { width: 20px; height: 20px; flex: none; }
        .list { display: flex; flex-direction: column; }
        .empty { color: var(--ink-400); font-size: 0.9rem; }
      `}</style>
    </div>
  );
}
