import Link from "next/link";
import type { ReactNode } from "react";
import { BackIcon, HomeIcon } from "@/components/icons";
import ProgressSteps from "@/components/layout/ProgressSteps";

type StepHeaderProps = {
  /** 1〜6 の進み具合 */
  readonly step: number;
  /** 左上の操作。ハッシュタグ選定は home、それ以降の選定画面は back（Figma 473:4521 / 473:4723） */
  readonly left: "home" | "back";
  readonly href: string;
  readonly title: string;
  readonly subtitle?: ReactNode;
};

/**
 * 選定系画面（ハッシュタグ / お気に入り / 行き先・宿泊・食事・観光地）の共通ヘッダー。
 * Figma 完成版では左上のアイコンと6分割バーが同じ行に並び、見出しはその下に来る。
 */
export default function StepHeader({ step, left, href, title, subtitle }: StepHeaderProps) {
  return (
    <header className="px-5 pt-4">
      <div className="relative flex h-8 items-center justify-center">
        <Link
          href={href}
          aria-label={left === "home" ? "ホームへ戻る" : "戻る"}
          className="absolute left-0 inline-flex text-foreground no-underline"
        >
          {left === "home" ? <HomeIcon size={32} /> : <BackIcon size={32} />}
        </Link>
        <ProgressSteps step={step} />
      </div>
      <div className="pt-[65px]">
        <h1 className="text-[20px] font-extrabold text-foreground">{title}</h1>
        {subtitle ? <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p> : null}
      </div>
    </header>
  );
}
