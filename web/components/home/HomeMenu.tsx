"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MenuIcon } from "@/components/icons";
import type { UserSession } from "@/lib/api";
import { clearUserSession, userSession } from "@/lib/api";

/**
 * ホーム画面の右上にあるメニュー（Figma 473:5133 の basil:menu-solid）。
 * アカウント（ログイン／ログアウト）とグループ新規作成への導線をまとめる。
 */
export default function HomeMenu() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setSession(userSession());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const itemClass = "block w-full px-4 py-3 text-left text-[14px] text-foreground no-underline hover:bg-foreground/5";

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        aria-label="メニュー"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-[30px] w-[30px] cursor-pointer items-center justify-center text-foreground"
      >
        <MenuIcon size={30} />
      </button>
      {open && (
        <div className="absolute top-[38px] right-0 z-20 w-[210px] overflow-hidden rounded-md border border-border bg-card shadow-pop">
          {session ? (
            <>
              <p className="border-b border-border px-4 py-2.5 text-[12px] text-muted-foreground">
                {session.displayName} さん
              </p>
              <button
                type="button"
                className={itemClass}
                onClick={() => {
                  clearUserSession();
                  setSession(null);
                  setOpen(false);
                }}
              >
                ログアウト
              </button>
            </>
          ) : (
            <Link href="/login" className={itemClass}>
              ログイン
            </Link>
          )}
          <Link href="/groups/new" className={`${itemClass} border-t border-border`}>
            新規でグループを作成
          </Link>
        </div>
      )}
    </div>
  );
}
