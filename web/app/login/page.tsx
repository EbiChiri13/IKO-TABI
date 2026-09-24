"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";

/**
 * ログイン画面（Figma完成版）。アカウント機能は未実装のため、見た目のみを反映した仮画面。
 * 送信すると既存のホーム導線（/home）へ遷移する。
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push("/home");
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

        <Button type="submit" variant="primary" block>
          ログイン
        </Button>

        <p className="signup-hint">
          アカウントの新規登録は<Link href="/groups/new">こちら</Link>
        </p>
      </form>

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
