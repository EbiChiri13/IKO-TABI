import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import { cardSurface } from "@/components/ui/primitives/card";
import { cn } from "@/lib/utils";

type CardProps<T extends ElementType = "div"> = {
  readonly as?: T;
  readonly children?: ReactNode;
  readonly className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export default function Card<T extends ElementType = "div">({ as, children, className = "", ...rest }: CardProps<T>) {
  const Tag = as ?? "div";

  return (
    <Tag className={cn(cardSurface, "p-[18px]", className)} {...rest}>
      {children}
    </Tag>
  );
}
