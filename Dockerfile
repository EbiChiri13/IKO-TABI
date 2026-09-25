# ───────── ビルドステージ ─────────
# 依存関係の解決と日本語 BERT モデルの取得のみを行います。
# コンパイラ等のビルド用ツールは最終イメージに残しません。
FROM python:3.12-slim AS builder

COPY --from=ghcr.io/astral-sh/uv:0.12.13 /uv /bin/uv

ENV UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1 \
    UV_PYTHON_DOWNLOADS=never \
    HF_HOME=/app/.cache/huggingface

WORKDIR /app

# fugashi などネイティブ拡張のビルドにコンパイラが必要です（このステージにのみ残ります）。
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

# 依存関係だけを先に入れることで、アプリのコード変更時にレイヤを再利用できるようにします。
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# 日本語 BERT モデルをビルド時に一度だけダウンロードしてイメージに焼き込みます。
# app.embedding.Embedder 経由で呼ぶことで、新しい transformers での
# BertJapaneseTokenizer.basic_tokenizer 改名対応パッチ（互換エイリアス）も適用されます。
# こうしておくと、コンテナが再起動するたびに Hugging Face へ問い合わせに行かずに済み、
# 起動が数十秒〜数分から数秒になります（Railway 等のヘルスチェックタイムアウト対策）。
ARG BERT_MODEL=sonoisa/sentence-bert-base-ja-mean-tokens-v2
ENV BERT_MODEL=${BERT_MODEL}
COPY app ./app
RUN /app/.venv/bin/python -c "from app.embedding import Embedder; Embedder('${BERT_MODEL}')"


# ───────── 実行ステージ ─────────
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/app/.venv/bin:$PATH" \
    HF_HOME=/app/.cache/huggingface \
    HF_HUB_OFFLINE=1 \
    TRANSFORMERS_OFFLINE=1

WORKDIR /app

# root では実行せず、専用の非特権ユーザーで動かします。
RUN useradd --create-home --uid 10001 ikotabi

COPY --from=builder --chown=ikotabi:ikotabi /app/.venv /app/.venv
# 起動時はキャッシュ済みモデルだけを使い、ネットワークには一切出ません。
COPY --from=builder --chown=ikotabi:ikotabi /app/.cache /app/.cache
COPY --chown=ikotabi:ikotabi app ./app

USER ikotabi

ARG BERT_MODEL=sonoisa/sentence-bert-base-ja-mean-tokens-v2
ENV BERT_MODEL=${BERT_MODEL}

EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
