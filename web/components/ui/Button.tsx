"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

const BASE =
  "appearance-none border-0 cursor-pointer inline-flex items-center justify-center gap-1.5 min-h-[52px] px-6 py-3 rounded-pill font-bold text-base transition-[transform,opacity,box-shadow] duration-150 active:scale-[0.98] disabled:opacity-45 disabled:cursor-not-allowed";

const VARIANT_CLASS = {
  primary: "bg-teal-600 text-white shadow-pop",
  mint: "bg-mint-400 text-ink-900 shadow-pop",
  ghost: "bg-transparent text-teal-600 border-2 border-teal-600",
  quiet: "bg-white text-ink-900 border-[1.5px] border-line",
};

type ButtonVariant = keyof typeof VARIANT_CLASS;

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "disabled" | "onClick" | "children"> & {
  readonly variant?: ButtonVariant;
  readonly size?: "sm" | "md";
  readonly block?: boolean;
  readonly disabled?: boolean;
  readonly type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  readonly onClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  readonly children?: ReactNode;
};

/**
 * ピル形のボタン。variant: primary(ティール) / mint(差し色の緑) / ghost(枠線) / quiet(地味)
 */
export default function Button({
  variant = "primary",
  size = "md",
  block = false,
  disabled = false,
  type = "button",
  onClick,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${BASE} ${VARIANT_CLASS[variant] ?? VARIANT_CLASS.primary} ${
        size === "sm" ? "min-h-[40px] px-[18px] py-2 text-sm" : ""
      } ${block ? "w-full" : ""}`}
      {...rest}
    >
      {children}
    </button>
  );
}
