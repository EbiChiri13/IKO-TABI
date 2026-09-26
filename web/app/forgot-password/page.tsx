"use client";

import Link from "next/link";
import { useState } from "react";
import Button from "@/components/ui/Button";
import TextField from "@/components/ui/TextField";

/**
 * パスワードをお忘れの方向け画面（デモ実装）。
 * メール送信基盤（SMTP等）が未整備のため、実際の送信は行わず
 * 「送信しました」の確認表示のみ行う。本番運用時はここをAPI呼び出しに置き換える。
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSent(true);
  }

  return (
    <div className="screen">
      <div className="hero">
        <p className="tagline">
          みんなの <span className="tagline-pill">行きたい</span> を叶える
        </p>
        <img className="mx-auto block h-auto w-[240px] max-w-full" src="/splash/wordmark.svg" alt="いこ！たび" />
      </div>

      {sent ? (
        <div className="form">
          <p className="sent-message">
            <strong>{email}</strong> 宛にログイン用のリンクを送信しました。
            <br />
            メールをご確認ください。
          </p>
          <Link href="/login">
            <Button variant="quiet" block>
              ログイン画面に戻る
            </Button>
          </Link>
        </div>
      ) : (
        <form className="form" onSubmit={handleSubmit}>
          <p className="description">登録済みのメールアドレスを入力してください。ログイン用のリンクをお送りします。</p>
          <TextField
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" variant="primary" block disabled={!email.trim()}>
            送信する
          </Button>
          <p className="signup-hint">
            <Link href="/login">ログイン画面に戻る</Link>
          </p>
        </form>
      )}

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
        .description {
          margin: 0 0 16px;
          font-size: 0.9rem;
          line-height: 1.6;
          color: var(--ink-900);
        }
        .sent-message {
          margin: 0 0 20px;
          font-size: 0.95rem;
          line-height: 1.7;
          color: var(--ink-900);
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
