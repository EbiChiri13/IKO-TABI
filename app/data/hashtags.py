"""4つの質問とハッシュタグ65語（仕様書B 5.1）。

kind:
  budget   … 予算。value は予算帯 0〜3（ルールで判定）
  region   … 地域。value は地域名、または "near"（近場。ルールで判定）
  semantic … それ以外。BERT で候補との意味の近さを測る
"""

BUDGET_BANDS = ["節約", "3〜5万円", "6〜8万円", "贅沢に"]

REGIONS = ["北海道", "東北", "関東", "中部", "近畿", "中国", "四国", "九州", "沖縄"]

CATEGORIES = [
    {
        "key": "style",
        "label": "どんな旅行にしたい？",
        "tags": (
            [(label, "budget", str(i)) for i, label in enumerate(BUDGET_BANDS)]
            + [
                (label, "semantic", None)
                for label in ["のんびり", "アクティブ", "弾丸旅", "非日常", "エモい", "推し活"]
            ]
        ),
    },
    {
        "key": "where",
        "label": "どこ行きたい？",
        "tags": (
            [(r, "region", r) for r in REGIONS]
            + [("近場", "region", "near")]
            + [(label, "semantic", None) for label in ["海のある所", "山のある所", "都会", "島"]]
        ),
    },
    {
        "key": "what",
        "label": "なにやりたい？",
        "tags": [
            (label, "semantic", None)
            for label in [
                "温泉",
                "食べ歩き",
                "海鮮",
                "絶景",
                "夜景",
                "歴史・寺社",
                "テーマパーク",
                "写真映え",
                "聖地巡礼",
                "サウナ",
                "ご当地グルメ",
                "カフェ巡り",
                "自然散策",
                "登山",
                "マリンスポーツ",
                "雪遊び",
                "動物とふれあう",
                "美術館・博物館",
                "ショッピング",
                "お酒・酒蔵",
                "花・紅葉",
                "ものづくり体験",
                "祭り・イベント",
                "星空",
                "ドライブ",
            ]
        ],
    },
    {
        "key": "stay",
        "label": "どんなところに泊まりたい？",
        "tags": [
            (label, "semantic", None)
            for label in [
                "温泉付き",
                "露天風呂",
                "旅館",
                "おしゃれ",
                "ゲストハウス",
                "コスパ重視",
                "グランピング",
                "ゲーセンあり",
                "高級ホテル",
                "オーシャンビュー",
                "和室",
                "朝ごはん自慢",
                "大浴場",
                "駅チカ",
                "古民家",
                "部屋食",
            ]
        ],
    },
]

# 候補の種類ごとに、どの質問の semantic タグで近さを測るか
CATEGORIES_FOR_TARGET = {
    "destination": ("style", "where", "what"),
    "lodging": ("style", "stay"),
    "food": ("style", "what"),
    "spot": ("style", "what"),
}

ALL_LABELS = [t[0] for c in CATEGORIES for t in c["tags"]]
assert len(ALL_LABELS) == 65 and len(set(ALL_LABELS)) == 65
