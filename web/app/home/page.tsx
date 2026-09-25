"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import GroupListItem from "@/components/home/GroupListItem";
import HeroCarousel, { type HeroSlide } from "@/components/home/HeroCarousel";
import Spinner from "@/components/ui/Spinner";
import type { GroupView } from "@/lib/api";
import { api, myGroups } from "@/lib/api";

type GroupEntry = { readonly id: string; readonly g: GroupView };

/** ホーム画面（Figma 363:7079）：ロゴ・旅行チケットカルーセル・所属グループ一覧・作成CTA。 */
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
        }),
      );
      if (!cancelled) setGroups(results.filter((result): result is GroupEntry => result !== null));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (groups === null) return <Spinner />;

  const slides: HeroSlide[] = groups.map(({ id, g }) => ({
    id,
    groupId: id,
    href: `/groups/${id}`,
    name: g.name,
    start: g.start_date,
    end: g.end_date,
  }));

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-background text-foreground">
      <header className="flex justify-center pt-[60px]">
        <h1>
          <img src="/splash/wordmark.svg" alt="いこ！たび" width={174} height={54} className="h-[54px] w-[174px]" />
        </h1>
      </header>

      <main className="flex flex-1 flex-col px-5 pb-[calc(24px+env(safe-area-inset-bottom))]">
        {slides.length > 0 && (
          <section className="mt-[11px]">
            <h2 className="visually-hidden">直近の旅行</h2>
            <HeroCarousel slides={slides} />
          </section>
        )}

        <section className={slides.length > 0 ? "mt-[24px]" : "mt-10"}>
          <h2 className="text-[15px] font-bold">所属グループ</h2>
          {groups.length === 0 ? (
            <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
              まだ参加しているグループがありません。招待リンクを開くか、新しくグループを作ってみましょう。
            </p>
          ) : (
            <ul className="mt-[15px] flex flex-col gap-[18px]">
              {groups.map(({ id, g }) => (
                <li key={id}>
                  <GroupListItem
                    groupId={id}
                    name={g.name}
                    dateLabel={`${g.start_date.slice(5)}-${g.end_date.slice(5)}`}
                    memberNames={g.members.map((m) => m.nickname)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-12">
          <Link
            href="/groups/new"
            className="inline-flex w-full min-h-[52px] items-center justify-center rounded-full border border-foreground bg-primary px-6 py-3 text-base font-sans font-medium text-primary-foreground shadow-pop transition-transform duration-75 hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            新規でグループを作成
          </Link>
        </div>
      </main>
    </div>
  );
}
