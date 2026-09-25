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
        <p className="tagline">
          みんなの <span className="tagline-pill">行きたい</span> を叶える
        </p>
        <h1 className="ikotabi-logo">いこ！たび</h1>
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
        .ikotabi-logo {
          font-size: 3rem;
          margin: 0;
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
