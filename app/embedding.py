"""タグと候補の文をベクトル化し、コサイン類似度を返す（仕様書B 5.2 の1）。

日本語 Sentence-BERT を使う。ベクトルはサーバー起動時に一度だけ計算してメモリに持つ。
Redis などの外部キャッシュは使わない【Q14】。

モデルは公開されている使い方に合わせ、transformers から直接読み込んで平均プーリングします。
事前学習に日本語 BERT を使っているため、推論には fugashi と ipadic が必要です。

モデルを読み込めないとき（オフラインなど）は、文字の2-gram による簡易ベクトルに切り替えて
サーバーは動き続ける。その場合は起動ログに出す。
"""

import hashlib
import logging

import numpy as np

log = logging.getLogger("ikotabi.embedding")

_BATCH_SIZE = 32


class Embedder:
    def __init__(self, model_name: str | None):
        self.model = None
        self.tokenizer = None
        self.name = "char-bigram"
        if model_name:
            try:
                from transformers import BertJapaneseTokenizer, BertModel

                # このモデルは IPADic で学習されているため、辞書を明示します。
                # transformers 5.x の既定は unidic_lite で、指定しないと辞書が二重になります。
                self.tokenizer = BertJapaneseTokenizer.from_pretrained(
                    model_name, mecab_kwargs={"mecab_dic": "ipadic"}
                )
                model = BertModel.from_pretrained(model_name)
                model.eval()
                self.model = model
                self.name = model_name
            except Exception as e:  # noqa: BLE001  モデルがなくてもサービスは止めない
                log.warning("BERT モデルを読み込めなかったため簡易類似度で動かします: %s", e)
        log.info("embedding: %s", self.name)

    def encode(self, texts: list[str]) -> np.ndarray:
        vecs = self._encode_bert(texts) if self.model is not None else np.stack([_bigram_vector(t) for t in texts])
        norms = np.linalg.norm(vecs, axis=1, keepdims=True)
        return vecs / np.where(norms == 0, 1, norms)

    def _encode_bert(self, texts: list[str]) -> np.ndarray:
        """モデルカードと同じ手順（attention_mask を掛けた平均プーリング）でベクトル化します。"""
        import torch

        def mean_pooling(token_embeddings, attention_mask):
            mask = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
            return torch.sum(token_embeddings * mask, 1) / torch.clamp(mask.sum(1), min=1e-9)

        pooled = []
        with torch.no_grad():
            for i in range(0, len(texts), _BATCH_SIZE):
                batch = texts[i : i + _BATCH_SIZE]
                encoded = self.tokenizer(batch, padding="longest", truncation=True, return_tensors="pt")
                hidden = self.model(**encoded)[0]
                pooled.append(mean_pooling(hidden, encoded["attention_mask"]).numpy())
        return np.concatenate(pooled)


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
