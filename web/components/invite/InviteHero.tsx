import { BackIcon } from "@/components/icons";

type InviteHeroProps = {
  readonly backHref: string;
  readonly groupName: string;
};

/** 招待画面のヒーロー（Figma: 暗色ヘッダーアート 213px / invite-header.svg、「〇〇が結成されました！」） */
export default function InviteHero({ backHref, groupName }: InviteHeroProps) {
  return (
    <header className="relative h-[213px] shrink-0 overflow-hidden">
      <img src="/figma/invite-header.svg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full" />
      <div className="relative flex h-full flex-col px-5 pb-5 pt-3.5">
        <a
          href={backHref}
          aria-label="戻る"
          className="-ml-2.5 inline-flex size-11 items-center justify-center rounded-full text-background transition-transform duration-75 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background"
        >
          <BackIcon size={22} />
        </a>
        <p className="mt-1 text-[0.85rem] font-bold text-background/90">友達を招待する</p>
        <h1 className="mt-1.5 text-[1.4rem] text-background">
          「{groupName}」が
          <br />
          結成されました！
        </h1>
      </div>
    </header>
  );
}
