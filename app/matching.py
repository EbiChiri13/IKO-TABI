"""マッチング（仕様書B 5.2【Q9・Q10】）。DB に依存しない純粋な計算だけを置く。"""

from collections.abc import Callable
from dataclasses import dataclass, field
from statistics import mean

from app.data.hashtags import CATEGORIES_FOR_TARGET

# 重みはすべて初期値。使いながら調整する（仕様書B 11章）
W_TAG, W_REGION, W_BUDGET = 0.60, 0.25, 0.15
W_MEAN, W_MIN, W_SPREAD = 0.5, 0.3, 0.2
EXACT_SCORE = 1.0  # 候補に同じタグが付いている
SEMANTIC_MAX = 0.7  # 付いていないときの上限（意味の近さに比例）
TOP_K = 3  # タグをたくさん選んだ人が不利にならないよう、近い順に上位3つで平均する
MUST_HAVE_PENALTY = 0.5  # 「絶対に譲れない」タグが外れている候補への掛け目
MUST_HAVE_SEMANTIC_OK = 0.6  # これ以上意味が近ければ「かなっている」とみなす

# 候補が1件しかない地域（北海道・沖縄）だけが選ばれたとき、n件に届かず
# 地域条件ごと全国に緩和してしまわないよう、近い地方から補う。
NEIGHBOR_REGIONS = {"北海道": "東北", "沖縄": "九州"}

# (タグ, 候補の種類, 候補の id) -> コサイン類似度
Similarity = Callable[[str, str, int], float]


@dataclass
class MemberPrefs:
    member_id: int
    semantic: dict[str, list[str]]  # 質問の key -> 選んだ semantic タグ
    regions: set[str] = field(default_factory=set)  # 地域名 と "near"
    budgets: set[int] = field(default_factory=set)  # 予算帯 0〜3
    must_have: str | None = None  # 「今回の旅行で譲れないこと」（選んだタグの中から1つ）

    def tags_for(self, target_type: str) -> list[str]:
        return [t for key in CATEGORIES_FOR_TARGET[target_type] for t in self.semantic.get(key, [])]


@dataclass
class Candidate:
    type: str  # destination / lodging / food / spot
    id: int
    tags: frozenset[str]
    band: int  # 予算帯 0〜3
    region: str | None = None
    near: bool = False


@dataclass
class Ranked:
    candidate: Candidate
    score: float  # 0〜1。×100 がマッチ度（％）
    matched_count: int  # 「N人中M人の希望にマッチ」の M
    fits: dict[int, float]  # member_id -> 適合度


def tag_closeness(member: MemberPrefs, c: Candidate, sim: Similarity) -> float:
    scores = sorted(
        (
            EXACT_SCORE if t in c.tags else SEMANTIC_MAX * min(1.0, max(0.0, sim(t, c.type, c.id)))
            for t in member.tags_for(c.type)
        ),
        reverse=True,
    )[:TOP_K]
    return mean(scores) if scores else 0.0


def region_fit(member: MemberPrefs, c: Candidate, relaxed: bool = False) -> float:
    # 宿・ごはん・スポットは決まった行き先の中から選ぶので、地域は常に合う
    if relaxed or c.type != "destination" or not member.regions:
        return 1.0
    if c.region in member.regions or ("near" in member.regions and c.near):
        return 1.0
    return 0.0


def budget_fit(member: MemberPrefs, c: Candidate, relaxed: bool = False) -> float:
    if relaxed or not member.budgets:
        return 1.0
    gap = min(abs(b - c.band) for b in member.budgets)
    return {0: 1.0, 1: 0.5}.get(gap, 0.0)


def must_have_fit(member: MemberPrefs, c: Candidate, sim: Similarity, relaxed: bool = False) -> float:
    """「今回の旅行で譲れないこと」が候補にないと、適合度を大きく下げる。"""
    if relaxed or not member.must_have:
        return 1.0
    if member.must_have in c.tags:
        return 1.0
    return 1.0 if sim(member.must_have, c.type, c.id) >= MUST_HAVE_SEMANTIC_OK else MUST_HAVE_PENALTY


def member_fit(member: MemberPrefs, c: Candidate, sim: Similarity, relaxed: bool = False) -> float:
    """relaxed=True のときは地域・予算・譲れない条件を無視し、タグの近さだけで見る（「再考慮する」用）。"""
    base = W_TAG * tag_closeness(member, c, sim) + W_REGION * region_fit(member, c, relaxed) + W_BUDGET * budget_fit(
        member, c, relaxed
    )
    return base * must_have_fit(member, c, sim, relaxed)


def group_score(fits: list[float]) -> float:
    """平均だけだと多数派ばかり通るので、一番低い人とばらつきも見る【Q9】。"""
    lo, hi = min(fits), max(fits)
    return W_MEAN * mean(fits) + W_MIN * lo + W_SPREAD * (1 - (hi - lo))


def is_matched(member: MemberPrefs, c: Candidate) -> bool:
    """選んだタグが候補にそのまま付いていて、地域と予算も外れていない。譲れないタグがある場合はそれも必須。"""
    return (
        any(t in c.tags for t in member.tags_for(c.type))
        and region_fit(member, c) == 1.0
        and budget_fit(member, c) > 0.0
        and (not member.must_have or member.must_have in c.tags)
    )


def rank(candidates: list[Candidate], members: list[MemberPrefs], sim: Similarity, relaxed: bool = False) -> list[Ranked]:
    out = []
    for c in candidates:
        fits = {m.member_id: member_fit(m, c, sim, relaxed) for m in members}
        out.append(
            Ranked(
                candidate=c,
                score=group_score(list(fits.values())),
                matched_count=sum(is_matched(m, c) for m in members),
                fits=fits,
            )
        )
    out.sort(key=lambda r: (-r.score, -r.matched_count, r.candidate.id))
    return out


def rank_destinations(
    candidates: list[Candidate], members: list[MemberPrefs], sim: Similarity, n: int = 3
) -> tuple[list[Ranked], bool]:
    """誰かが選んだ地域の中から上位 n 件。足りなければ地域の条件を外す【Q10】。

    戻り値の2つ目は「地域の条件を外したか」。
    """
    choosers = [m for m in members if m.regions]
    pool = candidates
    if choosers:
        pool = [c for c in candidates if any(region_fit(m, c) == 1.0 for m in choosers)]
        if len(pool) < n:
            # 北海道・沖縄は候補が1件しかないので、近い地方（東北・九州）を補って
            # 全国緩和を避ける【Hokkaido→東北 / 沖縄→九州で残りを埋める】。
            neighbor_regions = {NEIGHBOR_REGIONS[r] for m in choosers for r in m.regions if r in NEIGHBOR_REGIONS}
            if neighbor_regions:
                pool = [
                    c
                    for c in candidates
                    if any(region_fit(m, c) == 1.0 for m in choosers) or c.region in neighbor_regions
                ]
    relaxed = len(pool) < n
    if relaxed:
        pool = candidates
    return rank(pool, members, sim)[:n], relaxed and bool(choosers)
