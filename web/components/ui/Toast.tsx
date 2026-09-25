"use client";

type ToastProps = {
  readonly message: string | null | undefined;
};

export default function Toast({ message }: ToastProps) {
  if (!message) return null;
  return (
    <div
      className="fixed bottom-24 left-1/2 z-30 max-w-[calc(100%_-_32px)] -translate-x-1/2 rounded-sm bg-foreground px-[18px] py-2.5 text-[0.9rem] text-background shadow-pop"
      role="status"
    >
      {message}
    </div>
  );
}
