"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Button from "@/components/ui/Button";
import TextField from "@/components/ui/TextField";
import Toast from "@/components/ui/Toast";
import { ApiError, api, saveUserSession } from "@/lib/api";
import { firstError, loginForm } from "@/lib/forms";

/** ログイン画面（Figma完成版）。送信すると /api/auth/login を呼び、成功すれば ?next（無ければ /home）へ遷移する。 */
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/home";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // 送信前にサーバーと同じ条件で検証します。
    const parsed = loginForm.safeParse({ email, password });
    if (!parsed.success) {
      setError(firstError(parsed.error));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { token, display_name } = await api.login(parsed.data.email, parsed.data.password);
      saveUserSession({ token, displayName: display_name });
      router.push(next);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "ログインできませんでした");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen">
      <div className="hero">
        <p className="tagline">
          みんなの <span className="tagline-pill">行きたい</span> を叶える
        </p>
        <img className="mx-auto block h-auto w-[240px] max-w-full" src="/splash/wordmark.svg" alt="いこ！たび" />
      </div>

      <form className="form" onSubmit={handleSubmit}>
        <TextField
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Link href="/forgot-password" className="forgot-link">
          パスワードをお忘れですか？
        </Link>

        <Button type="submit" variant="primary" block disabled={busy}>
          {busy ? "ログインしています…" : "ログイン"}
        </Button>

        <p className="signup-hint">
          アカウントの新規登録は<Link href={`/register?next=${encodeURIComponent(next)}`}>こちら</Link>
        </p>
      </form>
      <Toast message={error} />

      <style jsx>{`
        .screen {
          padding: 56px 24px 32px;
        }
        .hero {
          text-align: center;
          margin-bottom: 32px;
        }
        .tagline {
          margin: 0 0 8px;
          font-weight: 800;
          font-size: 0.95rem;
          color: var(--ink-900);
        }
        .tagline-pill {
          display: inline-block;
          background: var(--mint-300);
          border-radius: var(--radius-pill);
          padding: 2px 12px;
          transform: rotate(-4deg);
        }
        .form :global(.field) {
          margin-bottom: 16px;
        }
        .forgot-link {
          display: block;
          margin: -8px 0 24px;
          font-size: 0.85rem;
          color: var(--ink-600);
          text-decoration: none;
        }
        .signup-hint {
          margin-top: 16px;
          text-align: center;
          font-size: 0.9rem;
          color: var(--ink-900);
        }
        .signup-hint :global(a) {
          color: var(--teal-600);
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
