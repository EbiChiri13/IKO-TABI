"""理由文をテンプレートで作る（仕様書B 5.4【Q11】）。LLM は使わない。

誰がどのタグを選んだかは入れない。タグごとの人数だけを使う【Q16】。
LLM に置き換えるときは reason_text() の中身を差し替えればよい。
"""

from collections import Counter

from app.data.hashtags import ALL_LABELS
from app.matching import Candidate, MemberPrefs, Ranked, Similarity

_ORDER = {t: i for i, t in enumerate(ALL_LABELS)}


def _quote(tags: list[str]) -> str:
    return "".join(f"「{t}」" for t in tags)


def reason_text(r: Ranked, members: list[MemberPrefs], place: str, detail: str, sim: Similarity) -> str:
    c: Candidate = r.candidate
    hits = Counter(t for m in members for t in set(m.tags_for(c.type)) if t in c.tags)
    top = sorted(hits, key=lambda t: (-hits[t], _ORDER.get(t, 999)))[:2]

    if top and hits[top[0]] >= 2:
        first = f"{_quote(top)}を選んだ人が多く、{place}ならその希望をかなえられます。"
    elif top:
        first = f"{_quote(top)}の希望に合っていて、{place}で楽しめます。"
    else:
        wanted = {t for m in members for t in m.tags_for(c.type)}
        nearest = max(wanted, key=lambda t: sim(t, c.type, c.id), default=None)
        first = f"{_quote([nearest])}の雰囲気に近い候補です。" if nearest else ""

    n, m = len(members), r.matched_count
    if m == n:
        last = f"{n}人全員の希望がそのままかないます。"
    elif m > 0:
        last = f"{n}人中{m}人の希望がそのままかないます。"
    else:
        last = "全員の希望のバランスがよい候補です。"
    return "".join(s for s in (first, detail, last) if s)
