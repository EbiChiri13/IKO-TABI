"""宿（楽天トラベル）・飲食（ホットペッパーグルメ）の実写真を都道府県単位で取ってくる。

どちらのAPIも利用規約で「取得した情報を第三者データベースに複製保存しない／
定期的に更新する」ことが求められているため（ホットペッパー: 利用規約 第5条1項・
第6条3項）、DBには保存せずプロセス内メモリにだけ短時間キャッシュする。
サーバー再起動やデプロイのたびに自然にリセットされる。

APIキーが無い・取得に失敗したときは None を返し、呼び出し側は今まで通りの
プレースホルダー画像にフォールバックする（サービスを止めない）。
"""

import json
import logging
import os
import time
import urllib.parse
import urllib.request

log = logging.getLogger("ikotabi.live_photos")

_CACHE_TTL_SECONDS = 6 * 3600  # 24時間以内の更新要件に対して余裕を持って半日で入れ替える
_cache: dict[str, tuple[float, str | None]] = {}


def _cached(key: str, fetch):
    now = time.time()
    hit = _cache.get(key)
    if hit and now - hit[0] < _CACHE_TTL_SECONDS:
        return hit[1]
    value = fetch()
    _cache[key] = (now, value)
    return value


def _get_json(url: str, timeout: float = 8.0) -> dict | None:
    req = urllib.request.Request(url, headers={"User-Agent": "ikotabi/1.0 (hackathon project)"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as res:
            return json.loads(res.read())
    except Exception as e:  # noqa: BLE001 - 写真が取れなくても致命的ではない
        log.warning("画像取得に失敗しました: %s", e)
        return None


def hotel_photo(prefecture: str) -> str | None:
    """楽天トラベル施設検索APIで、都道府県名をキーワードにホテル写真を1件取る。"""
    app_id = os.environ.get("RAKUTEN_APP_ID")
    if not app_id:
        return None

    def fetch() -> str | None:
        params = {
            "applicationId": app_id,
            "keyword": prefecture,
            "hits": 1,
            "responseType": "small",
            "format": "json",
        }
        url = f"https://app.rakuten.co.jp/services/api/Travel/SimpleHotelSearch/20170426?{urllib.parse.urlencode(params)}"
        data = _get_json(url)
        try:
            hotel = data["hotels"][0]["hotel"][0]["hotelBasicInfo"]
            return hotel.get("hotelImageUrl") or hotel.get("hotelThumbnailUrl")
        except (TypeError, KeyError, IndexError):
            return None

    return _cached(f"hotel:{prefecture}", fetch)


def food_photo(prefecture: str, name: str) -> str | None:
    """ホットペッパーグルメAPIで、都道府県名＋料理名をキーワードに飲食店写真を1件取る。

    都道府県名だけで検索すると同じ県の料理がすべて同じ1件の店にヒットしてしまうため、
    候補ごとの料理名（例: もんじゃ・焼肉・鍋）も検索語に含め、候補ごとにキャッシュを分ける。
    """
    api_key = os.environ.get("RECRUIT_API_KEY")
    if not api_key:
        return None

    def fetch() -> str | None:
        params = {
            "key": api_key,
            "keyword": f"{prefecture} {name}",
            "count": 1,
            "format": "json",
        }
        url = f"http://webservice.recruit.co.jp/hotpepper/gourmet/v1/?{urllib.parse.urlencode(params)}"
        data = _get_json(url)
        try:
            shop = data["results"]["shop"][0]
            photo = shop.get("photo", {})
            return photo.get("pc", {}).get("l") or photo.get("pc", {}).get("m")
        except (TypeError, KeyError, IndexError):
            return None

    return _cached(f"food:{prefecture}:{name}", fetch)
