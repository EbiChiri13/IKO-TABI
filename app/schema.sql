-- いこたび テーブル定義（仕様書B 7章）

CREATE TABLE IF NOT EXISTS groups (
    id            TEXT PRIMARY KEY,                       -- 推測しにくいランダムな文字列
    name          VARCHAR(20) NOT NULL,
    start_date    DATE NOT NULL,
    end_date      DATE NOT NULL,
    member_limit  SMALLINT NOT NULL CHECK (member_limit BETWEEN 2 AND 4),
    status        TEXT NOT NULL DEFAULT 'collecting'
                  CHECK (status IN ('collecting', 'destination', 'lodging', 'food', 'spot', 'done')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS group_members (
    id             SERIAL PRIMARY KEY,
    group_id       TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    nickname       VARCHAR(20) NOT NULL,
    role           TEXT NOT NULL CHECK (role IN ('host', 'member')),
    token_hash     TEXT NOT NULL UNIQUE,                  -- 本人確認用トークンのハッシュ
    share_answers  BOOLEAN NOT NULL DEFAULT FALSE,        -- 初期は非公開【Q16】
    answered_at    TIMESTAMPTZ,
    joined_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS group_members_group_idx ON group_members (group_id);

CREATE TABLE IF NOT EXISTS invites (
    id          SERIAL PRIMARY KEY,
    group_id    TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    used_at     TIMESTAMPTZ,
    used_by     INTEGER REFERENCES group_members(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS invites_group_idx ON invites (group_id);

CREATE TABLE IF NOT EXISTS hashtag_categories (
    id     SERIAL PRIMARY KEY,
    key    TEXT NOT NULL UNIQUE,
    label  TEXT NOT NULL,
    sort   SMALLINT NOT NULL
);

CREATE TABLE IF NOT EXISTS hashtags (
    id           SERIAL PRIMARY KEY,
    category_id  INTEGER NOT NULL REFERENCES hashtag_categories(id),
    label        TEXT NOT NULL UNIQUE,
    kind         TEXT NOT NULL CHECK (kind IN ('semantic', 'region', 'budget')),
    value        TEXT,
    sort         SMALLINT NOT NULL
);
-- 「今回の旅行で譲れないこと」＝選んだタグの中から1つだけ選ぶ「お気に入り選定」画面用
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS must_have_hashtag_id INTEGER REFERENCES hashtags(id);

CREATE TABLE IF NOT EXISTS user_hashtag_selections (
    id          SERIAL PRIMARY KEY,
    group_id    TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    member_id   INTEGER NOT NULL REFERENCES group_members(id) ON DELETE CASCADE,
    hashtag_id  INTEGER NOT NULL REFERENCES hashtags(id),
    UNIQUE (member_id, hashtag_id)
);

CREATE TABLE IF NOT EXISTS destinations (
    id           SERIAL PRIMARY KEY,
    prefecture   TEXT NOT NULL UNIQUE,
    area         TEXT NOT NULL,
    region       TEXT NOT NULL,
    near         BOOLEAN NOT NULL,
    band         SMALLINT NOT NULL,
    description  TEXT NOT NULL,
    tags         TEXT[] NOT NULL
);
-- Wikipediaから取ってきた都道府県の実写真（無ければダミー画像を使う）
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS image_url TEXT;

CREATE TABLE IF NOT EXISTS places (
    id              SERIAL PRIMARY KEY,
    destination_id  INTEGER NOT NULL REFERENCES destinations(id),
    type            TEXT NOT NULL CHECK (type IN ('lodging', 'food', 'spot')),
    name            TEXT NOT NULL,
    tags            TEXT[] NOT NULL,
    price           INTEGER NOT NULL,
    ticket          BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS places_destination_idx ON places (destination_id);

CREATE TABLE IF NOT EXISTS matching_results (
    id             SERIAL PRIMARY KEY,
    group_id       TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    target_type    TEXT NOT NULL CHECK (target_type IN ('destination', 'lodging', 'food', 'spot')),
    target_id      INTEGER NOT NULL,
    rank           SMALLINT NOT NULL,
    score          REAL NOT NULL,
    matched_count  SMALLINT NOT NULL,
    member_count   SMALLINT NOT NULL,
    relaxed        BOOLEAN NOT NULL DEFAULT FALSE,        -- 地域の条件を外したか
    reason_text    TEXT NOT NULL,
    UNIQUE (group_id, target_type, target_id)
);

CREATE TABLE IF NOT EXISTS votes (
    id           SERIAL PRIMARY KEY,
    group_id     TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    member_id    INTEGER NOT NULL REFERENCES group_members(id) ON DELETE CASCADE,
    target_type  TEXT NOT NULL,
    target_id    INTEGER NOT NULL,
    UNIQUE (member_id, target_type, target_id)
);

CREATE TABLE IF NOT EXISTS decisions (
    id           SERIAL PRIMARY KEY,
    group_id     TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    target_type  TEXT NOT NULL,
    target_id    INTEGER NOT NULL,
    UNIQUE (group_id, target_type, target_id)
);
