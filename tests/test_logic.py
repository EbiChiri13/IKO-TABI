from app.decide import choose
from app.matching import Candidate, MemberPrefs, group_score, is_matched, member_fit, rank_destinations


def no_sim(tag, target_type, target_id):
    return 0.0


def test_choose_gives_everyone_one():
    # 仕様書B 5.3 の例：2人がAとB、1人がCを選んだら A と C
    A, B, C = 1, 2, 3
    votes = {10: {A, B}, 11: {A, B}, 12: {C}}
    scores = {A: 0.8, B: 0.9, C: 0.5}
    assert set(choose(votes, scores, 2)) == {A, C} or set(choose(votes, scores, 2)) == {B, C}
    assert C in choose(votes, scores, 2)


def test_choose_single_uses_votes_then_score():
    votes = {1: {10}, 2: {20}, 3: {20}}
    assert choose(votes, {10: 0.9, 20: 0.1}, 1) == [20]
    # 同数ならスコアが高い方
    votes = {1: {10}, 2: {20}}
    assert choose(votes, {10: 0.4, 20: 0.6}, 1) == [20]


def test_choose_fills_with_score_when_votes_are_few():
    votes = {1: {10}}
    assert choose(votes, {10: 0.1, 20: 0.9, 30: 0.5}, 3) == [10, 20, 30]
    assert choose({}, {10: 0.1, 20: 0.9}, 1) == [20]


def test_group_score_prefers_balanced():
    # 平均は同じでも、誰かが我慢する方が低い【Q9】
    assert group_score([0.6, 0.6, 0.6]) > group_score([0.9, 0.9, 0.0])


def test_member_fit_and_matched():
    m = MemberPrefs(1, {"what": ["温泉"]}, regions={"関東"}, budgets={1})
    hit = Candidate("destination", 1, frozenset({"温泉"}), band=1, region="関東")
    far = Candidate("destination", 2, frozenset({"温泉"}), band=3, region="九州")
    assert member_fit(m, hit, no_sim) == 1.0
    assert is_matched(m, hit)
    assert not is_matched(m, far)
    assert member_fit(m, far, no_sim) == 0.6


def test_near_region():
    m = MemberPrefs(1, {"what": ["温泉"]}, regions={"near"})
    shizuoka = Candidate("destination", 1, frozenset(), band=1, region="中部", near=True)
    nagano = Candidate("destination", 2, frozenset(), band=1, region="中部", near=False)
    assert is_matched(m, Candidate("destination", 3, frozenset({"温泉"}), band=1, region="中部", near=True))
    assert member_fit(m, shizuoka, no_sim) > member_fit(m, nagano, no_sim)


def test_rank_destinations_relaxes_region():
    cands = [Candidate("destination", i, frozenset(), band=1, region=r)
             for i, r in enumerate(["沖縄", "九州", "関東", "関東"])]
    m = MemberPrefs(1, {"what": ["温泉"]}, regions={"沖縄"})
    ranked, relaxed = rank_destinations(cands, [m], no_sim, n=3)
    assert relaxed and len(ranked) == 3
    assert ranked[0].candidate.region == "沖縄"

    m2 = MemberPrefs(2, {"what": ["温泉"]}, regions={"関東", "九州"})
    ranked, relaxed = rank_destinations(cands, [m, m2], no_sim, n=3)
    assert not relaxed
    assert {r.candidate.region for r in ranked} <= {"沖縄", "九州", "関東"}
