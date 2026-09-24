import PlaneTrail from "@/components/layout/PlaneTrail";

type InviteHeroProps = {
  readonly backHref: string;
  readonly groupName: string;
};

/** 招待画面のヒーロー部分（design 9,14,16,18:「〇〇が結成されました！」） */
export default function InviteHero({ backHref, groupName }: InviteHeroProps) {
  return (
    <header className="hero">
      <PlaneTrail />
      <a href={backHref} className="back" aria-label="戻る">‹</a>
      <p className="eyebrow">友達を招待する</p>
      <h1>
        「{groupName}」が
        <br />
        結成されました！
      </h1>
      <style jsx>{`
        .hero {
          position: relative; overflow: hidden;
          background: var(--teal-600); color: var(--white);
          padding: 14px 20px 26px;
        }
        .back { color: var(--white); font-size: 1.6rem; text-decoration: none; font-weight: 700; }
        .eyebrow { margin: 10px 0 6px; font-size: 0.85rem; font-weight: 700; opacity: 0.9; }
        h1 { font-size: 1.4rem; position: relative; z-index: 1; }
      `}</style>
    </header>
  );
}
