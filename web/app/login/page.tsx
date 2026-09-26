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
        <div className="tagline-art">
          <img className="tagline-bubble" src="/splash/tag-bubble.svg" alt="" aria-hidden="true" />
          <img className="tagline-copy" src="/splash/hero-phrase.svg" alt="みんなの行きたいを叶える" />
          <img className="tagline-copy-highlight" src="/splash/hero-phrase.svg" alt="" aria-hidden="true" />
        </div>
        <img className="wordmark" src="/splash/wordmark.svg" alt="いこ！たび" />
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
        <Link href="#" className="forgot-link">
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
          padding: 155px 24px 32px;
        }
        .hero {
          width: min(100%, 301px);
          margin: 0 auto 25px;
          transform: translateX(5px);
        }
        .tagline-art {
          position: relative;
          width: 100%;
          aspect-ratio: 301 / 72;
          overflow: hidden;
        }
        .tagline-art img.tagline-bubble {
          position: absolute;
          z-index: 2;
          top: 0;
          left: 23.26%;
          width: 47.24%;
          height: auto;
        }
        .tagline-art img {
          position: absolute;
          top: -215.28%;
          left: -18.605%;
          width: 133.555%;
          max-width: none;
          height: auto;
        }
        .tagline-copy {
          z-index: 1;
          filter: brightness(0);
        }
        .tagline-copy-highlight {
          z-index: 3;
          clip-path: inset(24.3% 39.5% 69.2% 35.5%);
        }
        .wordmark {
          display: block;
          width: 100%;
          height: auto;
          margin-top: -8px;
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
