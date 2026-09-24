import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type CardProps<T extends ElementType = "div"> = {
  readonly as?: T;
  readonly children?: ReactNode;
  readonly className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export default function Card<T extends ElementType = "div">({
  as,
  children,
  className = "",
  ...rest
}: CardProps<T>) {
  const Tag = as ?? "div";

  return (
    <Tag className={`card ${className}`} {...rest}>
      {children}
      <style jsx>{`
        .card {
          background: var(--white);
          border: 1px solid var(--line);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-card);
          padding: 18px;
        }
      `}</style>
    </Tag>
  );
}
