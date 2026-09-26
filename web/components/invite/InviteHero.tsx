import { BackIcon } from "@/components/icons";

type InviteHeroProps = {
  readonly backHref: string;
};

/** 招待画面のヒーロー（Figma 473:4566） */
export default function InviteHero({ backHref }: InviteHeroProps) {
  return (
    <header className="relative h-[213px] shrink-0 overflow-hidden">
      <img src="/figma/invite-header.svg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full" />
      <div className="relative h-full">
        <a
          href={backHref}
          aria-label="戻る"
          className="absolute top-[67px] left-[27px] inline-flex size-[30px] items-center justify-center rounded-full text-background transition-transform duration-75 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background"
        >
          <BackIcon size={22} />
        </a>
        <h1 className="absolute inset-x-0 top-[78px] text-center text-[16px] font-bold text-background/90">
          友達を招待する
        </h1>
      </div>
    </header>
  );
}
