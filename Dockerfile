FROM python:3.12-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

ENV HF_HOME=/app/.cache/huggingface
ARG BERT_MODEL=sonoisa/sentence-bert-base-ja-mean-tokens-v2
ENV BERT_MODEL=${BERT_MODEL}

COPY app ./app

# 日本語BERTモデルをビルド時に一度だけダウンロードしてイメージに焼き込む。
# app.embedding.Embedder 経由で呼ぶことで、新しいtransformersでの
# BertJapaneseTokenizer.basic_tokenizer 改名対応パッチ（互換エイリアス）も適用される。
# こうしておくと、コンテナが再起動するたびにHugging Faceへ問い合わせに行かずに済み、
# 起動が数十秒〜数分から数秒になる（Railway等のヘルスチェックタイムアウト対策）。
RUN python -c "from app.embedding import Embedder; Embedder('${BERT_MODEL}')"

COPY static ./static

# 起動時はキャッシュ済みモデルだけを使い、ネットワークには一切出ない。
ENV HF_HUB_OFFLINE=1
ENV TRANSFORMERS_OFFLINE=1

EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
