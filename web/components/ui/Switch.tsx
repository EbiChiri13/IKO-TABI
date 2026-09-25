"use client";

import { useId } from "react";

import { Switch as SwitchPrimitive } from "@/components/ui/primitives/switch";

type SwitchProps = {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly label: string;
  readonly sub?: string;
};

/** 「自分が選んだタグをメンバーに見せる」の切り替え（初期は非公開）【Q16】 */
export default function Switch({ checked, onChange, label, sub }: SwitchProps) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-3 font-sans">
      <span className="flex flex-col">
        <span className="font-bold">{label}</span>
        {sub && <span className="text-[0.8rem] font-medium text-muted-foreground">{sub}</span>}
      </span>
      <SwitchPrimitive
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        className="h-[30px] w-[50px] shrink-0 border-0 px-[3px] data-[state=checked]:bg-primary data-[state=unchecked]:bg-border"
        thumbClassName="size-6 bg-white data-[state=checked]:translate-x-[20px]"
      />
    </label>
  );
}
