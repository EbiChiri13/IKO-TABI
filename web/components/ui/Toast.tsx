"use client";

type ToastProps = {
  readonly message: string | null | undefined;
};

export default function Toast({ message }: ToastProps) {
  if (!message) return null;
  return (
    <div className="toast" role="status">
      {message}
      <style jsx>{`
        .toast {
          position: fixed; left: 50%; bottom: 96px; transform: translateX(-50%);
          max-width: calc(100% - 32px);
          background: var(--ink-900); color: var(--cream-200);
          padding: 10px 18px; border-radius: 12px; font-size: 0.9rem; z-index: 30;
          box-shadow: var(--shadow-pop);
        }
      `}</style>
    </div>
  );
}
