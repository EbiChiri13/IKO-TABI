"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Button from "@/components/ui/Button";
import TextField from "@/components/ui/TextField";
import Toast from "@/components/ui/Toast";
import { ApiError, api, saveUserSession } from "@/lib/api";
import { firstError, registerForm } from "@/lib/forms";

/** アカウント新規登録画面。ログイン画面と同じ見た目で、表示名・メール・パスワードを受け付ける。成功すれば ?next（無ければ /home）へ遷移する。 */
export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/home";
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // 送信前にサーバーと同じ条件で検証します（空白だけのニックネームもここで弾けます）。
    const parsed = registerForm.safeParse({ display_name: displayName, email, password });
    if (!parsed.success) {
      setError(firstError(parsed.error));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { token, display_name } = await api.register(
        parsed.data.display_name,
        parsed.data.email,
        parsed.data.password,
      );
      saveUserSession({ token, displayName: display_name });
      router.push(next);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "登録できませんでした");
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
          type="text"
          placeholder="ニックネーム"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          maxLength={20}
        />
        <TextField
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          type="password"
          placeholder="パスワード（8文字以上）"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />

        <Button type="submit" variant="primary" block disabled={busy}>
          {busy ? "登録しています…" : "登録する"}
        </Button>

        <p className="signup-hint">
          <Link href={`/login?next=${encodeURIComponent(next)}`}>ログインはこちら</Link>
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
