"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import HeroCarousel from "@/components/home/HeroCarousel";
import GroupListItem from "@/components/home/GroupListItem";
import TripCard from "@/components/home/TripCard";
import { api, myGroups } from "@/lib/api";

const RECOMMENDATIONS = [
  { caption: "夜景が人気：兵庫・神戸", photoUrl: null },
  { caption: "海と鳥居の絶景：広島・宮島", photoUrl: null },
];

/** ホーム画面（design 25-28）。この端末で参加中のグループ一覧と、直近の旅行を表示する。 */
export default function HomePage() {
  const [groups, setGroups] = useState(null); // null = 読み込み中

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
      if (!cancelled) setGroups(results.filter(Boolean));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (groups === null) return <Spinner />;

  const nearest = groups[0];

  return (
    <div className="screen">
      <HeroCarousel slides={RECOMMENDATIONS} />
      <header className="brand">
        <h1 className="ikotabi-logo">いこたび</h1>
      </header>

      <main className="body">
        {nearest && (
          <section>
            <h2 className="section-title">🗓 直近の旅行</h2>
            <Link href={`/groups/${nearest.id}`} className="plain-link">
              <TripCard
                name={nearest.g.name}
                place=""
                nights=""
                dateLabel={`${nearest.g.start_date} 〜 ${nearest.g.end_date}`}
                note="続きから見る"
                memberNames={nearest.g.members.map((m) => m.nickname)}
              />
            </Link>
          </section>
        )}

        <section>
          <h2 className="section-title">🧑‍🤝‍🧑 所属グループ</h2>
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
        .plain-link { text-decoration: none; color: inherit; display: block; }
        .brand {
          background: var(--teal-600); color: var(--white);
          text-align: center; padding: 14px 0;
        }
        .brand h1 { font-size: 1.3rem; }
        .body { flex: 1; padding: 20px 20px calc(24px + env(safe-area-inset-bottom)); display: flex; flex-direction: column; gap: 22px; }
        .section-title { font-size: 1rem; margin-bottom: 10px; border-bottom: 2px solid var(--line); padding-bottom: 8px; }
        .list { display: flex; flex-direction: column; }
        .empty { color: var(--ink-400); font-size: 0.9rem; }
      `}</style>
    </div>
  );
}
