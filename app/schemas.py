"""API のレスポンス形（仕様書B 8章）。

フロントエンドは `/openapi.json` から Zod スキーマを生成し、実行時にレスポンスを検証します。
つまり**ここが唯一の正**になります。モデル名はフロントエンドの型名と一致させてください
（生成される Zod スキーマの名前がそのまま型名になります）。

日付は service が ISO 文字列（YYYY-MM-DD）で返すため、ワイヤ上の表現どおり str で宣言します。
"""

from typing import Literal

from pydantic import BaseModel

TargetType = Literal["destination", "lodging", "food", "spot"]
GroupStatus = Literal["collecting", "destination", "lodging", "food", "spot", "done"]
MemberRole = Literal["host", "member"]
TagKind = Literal["semantic", "region", "budget"]


# ───────── アカウント ─────────


class AuthResult(BaseModel):
    token: str
    display_name: str


class AccountMe(BaseModel):
    display_name: str
    email: str


# ───────── グループ ─────────


class Me(BaseModel):
    id: int
    nickname: str
    role: MemberRole
    share_answers: bool
    answered: bool


class GroupMember(BaseModel):
    id: int
    nickname: str
    role: MemberRole
    answered: bool
    is_me: bool
    # 本人が公開を選んだときだけ返る【Q16】
    tags: list[str] | None


class GroupView(BaseModel):
    id: str
    name: str
    start_date: str
    end_date: str
    member_limit: int
    status: GroupStatus
    me: Me
    members: list[GroupMember]
    answered_count: int
    # 幹事にしか返らない
    open_invites: int | None
    # 投票フェーズ中のみ返る
    voted_count: int | None


class CreateGroupResult(BaseModel):
    group_id: str
    token: str


class InviteToken(BaseModel):
    token: str


class RevokeResult(BaseModel):
    revoked: int


class InviteInfo(BaseModel):
    group_name: str
    start_date: str
    end_date: str
    members: int
    member_limit: int
    usable: bool


class JoinResult(BaseModel):
    group_id: str
    token: str
    group_name: str


# ───────── ハッシュタグ ─────────


class Tag(BaseModel):
    id: int
    label: str
    kind: TagKind


class TagCategory(BaseModel):
    key: str
    label: str
    tags: list[Tag]


class TagSummaryEntry(BaseModel):
    label: str
    count: int


class TagSummaryCategory(BaseModel):
    key: str
    label: str
    tags: list[TagSummaryEntry]


class TagSummary(BaseModel):
    member_count: int
    categories: list[TagSummaryCategory]


class MySelections(BaseModel):
    tag_ids: list[int]
    share_answers: bool
    # 「今回の旅行で譲れないこと」。お気に入り選定で選ぶまでは null
    must_have_tag_id: int | None


class EmptyResult(BaseModel):
    """中身の無い成功レスポンス。"""


class SaveMustHaveResult(BaseModel):
    started: bool


# ───────── 候補・投票 ─────────


class CandidateItem(BaseModel):
    """行き先と宿・ごはん・スポットで項目が異なるため、無い側は null になります。"""

    id: int
    rank: int
    match: int
    matched_count: int
    member_count: int
    reason: str
    votes: int
    my_vote: bool
    decided: bool
    name: str
    tags: list[str]
    image: str
    # 宿・食事の実写真が入っているときだけのクレジット表記
    image_credit: str | None = None

    # 行き先のみ
    area: str | None = None
    region: str | None = None
    description: str | None = None

    # 宿・ごはん・スポットのみ
    price: int | None = None
    ticket: bool | None = None


class CandidatesView(BaseModel):
    type: TargetType
    open: bool
    relaxed: bool
    vote_limit: int
    pick_count: int
    voted_count: int
    member_total: int
    items: list[CandidateItem]


class OkResult(BaseModel):
    """成功だけを返す操作（投票・候補の再計算）のレスポンス。"""

    ok: bool


# ───────── まとめ ─────────


class DecidedDestination(BaseModel):
    id: int
    name: str
    area: str
    description: str
    image: str


class PlaceSummary(BaseModel):
    id: int
    name: str
    tags: list[str]
    price: int
    ticket: bool
    image: str
    image_credit: str | None = None


class WinDetail(BaseModel):
    destination: int
    lodging: int
    food: int
    spot: int


class SummaryMemberWin(BaseModel):
    nickname: str
    wins: int
    detail: WinDetail


class GroupSummary(BaseModel):
    name: str
    start_date: str
    end_date: str
    status: GroupStatus
    destination: DecidedDestination | None
    lodging: list[PlaceSummary]
    food: list[PlaceSummary]
    spot: list[PlaceSummary]
    members: list[SummaryMemberWin]


# ───────── ヘルスチェック ─────────


class Health(BaseModel):
    ok: bool
    db: bool
    model: bool
    embedding: str | None
