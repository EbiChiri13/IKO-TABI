"""投票から決める（仕様書B 5.3【Q2】）。誰か一人の希望ばかり通らないよう、全員の「いいね」を1つずつ入れる。"""

# 項目ごとの 1人の投票数 と 決める数
VOTE_LIMIT = {"destination": 1, "lodging": 1, "food": 2, "spot": 3}
PICK_COUNT = {"destination": 1, "lodging": 1, "food": 2, "spot": 3}


def choose(votes: dict[int, set[int]], scores: dict[int, float], k: int) -> list[int]:
    """votes: member_id -> 投票した候補 id、scores: 候補 id -> マッチングのスコア。

    1. まだ「いいね」が1つも選ばれていない人を、なるべく多くカバーする候補から選ぶ
    2. 全員カバーできたら、残りを票数順（同数ならスコア順）で埋める
    """
    count = {c: 0 for c in scores}
    for picked in votes.values():
        for c in picked:
            if c in count:
                count[c] += 1

    chosen: list[int] = []
    uncovered = {m for m, picked in votes.items() if picked & count.keys()}

    def key(c: int, cover: int = 0):
        return (cover, count[c], scores[c], -c)

    while len(chosen) < k and uncovered:
        best = max(
            (c for c in scores if c not in chosen),
            key=lambda c: key(c, sum(1 for m in uncovered if c in votes[m])),
            default=None,
        )
        if best is None or not any(best in votes[m] for m in uncovered):
            break
        chosen.append(best)
        uncovered = {m for m in uncovered if best not in votes[m]}

    for c in sorted((c for c in scores if c not in chosen), key=key, reverse=True):
        if len(chosen) >= k:
            break
        chosen.append(c)
    return chosen
