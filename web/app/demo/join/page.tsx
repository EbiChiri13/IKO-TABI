"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BackIcon } from "@/components/icons";
import Button from "@/components/ui/Button";
import TextField from "@/components/ui/TextField";

/**
 * ハッカソンのデモ用。招待リンク（またはコード部分だけ）を貼り付けると、
 * ログイン／新規登録を挟まずに /join/[token] のニックネーム参加フローへ進める。
 */
export default function DemoJoinPage() {
  const router = useRouter();
  const [input, setInput] = useState("");

  function extractToken(value: string): string {
    const trimmed = value.trim();
    const marker = "/join/";
    const idx = trimmed.indexOf(marker);
    if (idx === -1) return trimmed;
    return trimmed.slice(idx + marker.length).split(/[?#]/)[0];
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = extractToken(input);
    if (!token) return;
    router.push(`/join/${encodeURIComponent(token)}?demo=1`);
  }

  return (
    <div className="screen">
      <header className="relative flex h-[80px] shrink-0 items-center px-5">
        <Link href="/" aria-label="戻る" className="-ml-2.5 inline-flex size-11 items-center justify-center rounded-full">
          <BackIcon size={22} />
        </Link>
      </header>
      <main className="flex flex-1 flex-col gap-3 px-5 pb-6">
        <h1 className="text-[1.2rem] font-extrabold text-foreground">デモ版で参加</h1>
        <p className="text-[0.9rem] leading-relaxed text-muted-foreground">
          幹事から共有された招待リンク（またはコード部分）を貼り付けてください。ログイン／新規登録なしで、ニックネームだけで参加できます。
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
          <TextField
            label="招待リンク／コード"
            placeholder="https://.../join/xxxxxxxx"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            required
          />
          <Button type="submit" variant="primary" block disabled={!input.trim()}>
            次へ
          </Button>
        </form>
      </main>
    </div>
  );
}
