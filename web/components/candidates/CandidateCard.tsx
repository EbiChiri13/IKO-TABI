import type { CandidateItem, TargetType } from "@/lib/api";

type CandidateCardProps = {
  readonly item: CandidateItem;
  readonly type: TargetType;
  readonly onToggle: (id: CandidateItem["id"]) => void;
  readonly locked: boolean;
};

/** 行き先・宿・ごはん・スポットに共通の候補カード（design: 行き先選定＝写真＋番号バッジ＋大きなボタン） */
export default function CandidateCard({ item, type, onToggle, locked }: CandidateCardProps) {
  const selectable = !locked && !item.decided;
  return (
    <div
      className={`bg-white rounded-lg overflow-hidden shadow-card mb-4 border-2 ${
        item.my_vote || item.decided ? "border-teal-600" : "border-transparent"
      }`}
    >
      <div className="w-9 h-1 rounded-full bg-line mx-auto mt-2.5" aria-hidden="true" />
      <div
        className="relative h-[170px] mt-2 bg-line bg-cover bg-center"
        style={{ backgroundImage: `url(${item.image})` }}
      >
        <span className="absolute top-3 left-3 w-7 h-7 rounded-full bg-white text-teal-700 grid place-items-center font-black text-[0.85rem] shadow-card">
          {item.rank}
        </span>
        {item.decided && (
          <span className="absolute top-3 right-3 bg-teal-600 text-white text-[0.72rem] font-extrabold px-3 py-[3px] rounded-pill">
            決定！
          </span>
        )}
      </div>
      <div className="px-[18px] pt-3.5 pb-[18px]">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-xl">
            {item.name}
            {type === "destination" && <span className="text-[0.82rem] text-ink-400 font-medium">（{item.area}）</span>}
          </h3>
          <span className="text-[1.3rem] font-black text-teal-700 flex-none">
            {item.match}
            <small className="text-[0.7rem]">%</small>
          </span>
        </div>

        <p className="mt-2.5 mb-1">
          {item.tags.slice(0, 3).map((t) => (
            <span
              key={t}
              className="inline-block text-[0.8rem] px-3.5 py-[3px] rounded-pill border border-ink-900 bg-vote-mint/0 text-ink-900 mr-1.5 mb-1.5"
            >
              {t}
            </span>
          ))}
        </p>

        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 min-h-[52px] rounded-pill border border-ink-900 bg-vote-mint text-ink-900 font-black text-[0.98rem] disabled:opacity-60 disabled:cursor-default aria-pressed:bg-white"
          aria-pressed={item.my_vote}
          disabled={!selectable}
          onClick={() => selectable && onToggle(item.id)}
        >
          {item.decided ? "この候補に決定しました" : item.my_vote ? "投票済み（タップで取り消す）" : "この行き先に投票する"}
        </button>
      </div>
    </div>
  );
}
