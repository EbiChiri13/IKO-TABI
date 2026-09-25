"use client";

import { useId } from "react";

import type { InputHTMLAttributes } from "react";

import { Input } from "@/components/ui/primitives/input";
import { cn } from "@/lib/utils";

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "label"> & {
  readonly label?: string;
  readonly hint?: string;
  readonly error?: string;
};

export default function TextField({ label, hint, error, className, ...inputProps }: TextFieldProps) {
  const id = useId();
  return (
    <label className="mb-4 block font-sans font-bold" htmlFor={id}>
      {label && (
        <span className="mb-1.5 block">
          {label}
          {hint && <span className="ml-1.5 text-[0.8rem] font-medium text-muted-foreground">{hint}</span>}
        </span>
      )}
      <Input
        id={id}
        aria-invalid={!!error}
        className={cn(
          "h-auto min-h-[52px] rounded-md border-[1.5px] px-4 py-3 text-base font-medium md:text-base",
          error && "border-destructive",
          className,
        )}
        {...inputProps}
      />
      {error && <span className="mt-1.5 block text-[0.82rem] font-medium text-destructive">{error}</span>}
    </label>
  );
}
