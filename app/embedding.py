"""タグと候補の文をベクトル化し、コサイン類似度を返す（仕様書B 5.2 の1）。

日本語 Sentence-BERT を使う。ベクトルはサーバー起動時に一度だけ計算してメモリに持つ。
Redis などの外部キャッシュは使わない【Q14】。

モデルを読み込めないとき（オフラインなど）は、文字の2-gram による簡易ベクトルに切り替えて
サーバーは動き続ける。その場合は起動ログに出す。
"""

import hashlib
import logging

import numpy as np

log = logging.getLogger("ikotabi.embedding")


def _patch_bert_japanese_tokenizer() -> None:
    """新しい transformers では BertJapaneseTokenizer.basic_tokenizer が word_tokenizer に
    改名されており、sentence-transformers の do_lower_case 設定コードが AttributeError になる。
    互換のためのエイリアスを追加する（モデルの動作自体は変えない）。
    """
    try:
        from transformers.models.bert_japanese.tokenization_bert_japanese import BertJapaneseTokenizer
    except Exception:  # noqa: BLE001
        return
    if not hasattr(BertJapaneseTokenizer, "basic_tokenizer"):
        BertJapaneseTokenizer.basic_tokenizer = property(lambda self: self.word_tokenizer)


class Embedder:
    def __init__(self, model_name: str | None):
        self.model = None
        self.name = "char-bigram"
        if model_name:
            try:
                from sentence_transformers import SentenceTransformer

                _patch_bert_japanese_tokenizer()
                self.model = SentenceTransformer(model_name, device="cpu")
                self.name = model_name
            except Exception as e:  # noqa: BLE001  モデルがなくてもサービスは止めない
                log.warning("BERT モデルを読み込めなかったため簡易類似度で動かします: %s", e)
        log.info("embedding: %s", self.name)

    def encode(self, texts: list[str]) -> np.ndarray:
        if self.model is not None:
            vecs = self.model.encode(texts, batch_size=32, convert_to_numpy=True, show_progress_bar=False)
        else:
            vecs = np.stack([_bigram_vector(t) for t in texts])
        norms = np.linalg.norm(vecs, axis=1, keepdims=True)
        return vecs / np.where(norms == 0, 1, norms)


def _bigram_vector(text: str, dim: int = 2048) -> np.ndarray:
    v = np.zeros(dim, dtype=np.float32)
    s = f" {text} "
    for i in range(len(s) - 1):
        h = int.from_bytes(hashlib.md5(s[i : i + 2].encode()).digest()[:4], "little")
        v[h % dim] += 1.0
    return v


class SimilarityIndex:
    """タグ × 候補 のコサイン類似度をまとめて持つ。"""

    def __init__(self, embedder: Embedder, tag_labels: list[str], candidates: dict[tuple[str, int], str]):
        self.embedder_name = embedder.name
        self._tag_pos = {t: i for i, t in enumerate(tag_labels)}
        self._cand_pos = {k: i for i, k in enumerate(candidates)}
        tag_vecs = embedder.encode(tag_labels)
        cand_vecs = embedder.encode(list(candidates.values()))
        self._sim = tag_vecs @ cand_vecs.T

    def __call__(self, tag: str, target_type: str, target_id: int) -> float:
        i = self._tag_pos.get(tag)
        j = self._cand_pos.get((target_type, target_id))
        if i is None or j is None:
            return 0.0
        return float(self._sim[i, j])
