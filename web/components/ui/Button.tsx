"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

import { Button as PrimitiveButton } from "@/components/ui/primitives/button";
import { cn } from "@/lib/utils";

const VARIANT_CLASS = {
  primary: "border-foreground bg-primary text-primary-foreground shadow-pop hover:bg-primary/90",
  mint: "border-foreground bg-secondary text-secondary-foreground shadow-pop hover:bg-secondary/80",
  ghost: "border-2 border-foreground bg-transparent text-foreground shadow-none hover:bg-foreground/5",
  quiet: "border-border bg-card text-foreground shadow-none hover:bg-foreground/5",
} as const;

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
 * ピル形のボタン。variant: primary(メイン) / mint(差し色) / ghost(枠線) / quiet(地味)
 */
export default function Button({
  variant = "primary",
  size = "md",
  block = false,
  disabled = false,
  type = "button",
  onClick,
  children,
  className,
  ...rest
}: ButtonProps) {
  return (
    <PrimitiveButton
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-full border font-sans font-medium transition-transform duration-75 active:scale-[0.98] disabled:active:scale-100 disabled:opacity-45",
        size === "sm" ? "h-auto min-h-[40px] px-[18px] py-2 text-[0.9rem]" : "h-auto min-h-[52px] px-6 py-3 text-base",
        VARIANT_CLASS[variant] ?? VARIANT_CLASS.primary,
        block && "w-full",
        className,
      )}
      {...rest}
    >
      {children}
    </PrimitiveButton>
  );
}
