"""起動時に候補データと BERT ベクトルをメモリに用意する【Q14】。"""

import logging

from app.data.destinations import place_band
from app.data.hashtags import CATEGORIES
from app.embedding import Embedder, SimilarityIndex
from app.matching import Candidate

log = logging.getLogger("ikotabi.engine")


class Engine:
    def __init__(self, conn, embedder: Embedder):
        self.destinations: dict[int, dict] = {}
        self.places: dict[int, dict] = {}
        self.candidates: dict[tuple[str, int], Candidate] = {}
        texts: dict[tuple[str, int], str] = {}

        for d in conn.execute("SELECT * FROM destinations ORDER BY id").fetchall():
            self.destinations[d["id"]] = d
            key = ("destination", d["id"])
            self.candidates[key] = Candidate("destination", d["id"], frozenset(d["tags"]), d["band"],
                                             region=d["region"], near=d["near"])
            texts[key] = f"{d['prefecture']}（{d['area']}）。{d['description']}{'、'.join(d['tags'])}"

        for p in conn.execute("SELECT * FROM places ORDER BY id").fetchall():
            self.places[p["id"]] = p
            key = (p["type"], p["id"])
            self.candidates[key] = Candidate(p["type"], p["id"], frozenset(p["tags"]),
                                             place_band(p["type"], p["price"]))
            texts[key] = f"{p['name']}。{'、'.join(p['tags'])}"

        semantic = [label for c in CATEGORIES for label, kind, _ in c["tags"] if kind == "semantic"]
        self.sim = SimilarityIndex(embedder, semantic, texts)
        log.info("候補 %d 件、タグ %d 語のベクトルを用意しました（%s）", len(texts), len(semantic), embedder.name)

    def destination_candidates(self) -> list[Candidate]:
        return [c for (t, _), c in self.candidates.items() if t == "destination"]

    def place_candidates(self, destination_id: int, place_type: str) -> list[Candidate]:
        return [self.candidates[(place_type, pid)] for pid, p in self.places.items()
                if p["destination_id"] == destination_id and p["type"] == place_type]
