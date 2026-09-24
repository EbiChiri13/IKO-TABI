"""都道府県の実写真をWikipediaから取ってくる（APIキー不要）。

宿・ごはん・スポットは架空の名前なので対象外。行き先（実在の47都道府県）だけに使う。
"""

import json
import logging
import urllib.parse
import urllib.request

log = logging.getLogger("ikotabi.wikipedia_images")

# Wikipediaの記事名は「県」「都」「府」が付く。例外だけ手で持つ。
_SUFFIX_EXCEPTIONS = {
    "北海道": "北海道",
    "東京": "東京都",
    "京都": "京都府",
    "大阪": "大阪府",
}


def wiki_title(prefecture: str) -> str:
    return _SUFFIX_EXCEPTIONS.get(prefecture, f"{prefecture}県")


def fetch_thumbnail(prefecture: str, timeout: float = 12.0, retries: int = 2) -> str | None:
    """Wikipedia (ja) のページ概要APIからサムネイル画像URLを取る。失敗したら None。

    47件を並列で取りに行くと、たまに接続が混み合って失敗することがあるので
    軽くリトライする（起動のたびに何県か抜けたままにならないように）。
    """
    title = urllib.parse.quote(wiki_title(prefecture))
    url = f"https://ja.wikipedia.org/api/rest_v1/page/summary/{title}"
    req = urllib.request.Request(url, headers={"User-Agent": "ikotabi/1.0 (hackathon project)"})
    for attempt in range(retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as res:
                data = json.loads(res.read())
            # thumbnail は小さめ、originalimage は大きい。カード表示には thumbnail で十分。
            thumb = data.get("thumbnail") or data.get("originalimage")
            return thumb["source"] if thumb else None
        except Exception as e:  # noqa: BLE001 - 画像が取れなくても致命的ではない
            if attempt == retries:
                log.warning("%s のサムネイル取得に失敗: %s", prefecture, e)
    return None
