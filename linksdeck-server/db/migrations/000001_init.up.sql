CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS links (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS link_tags (
  link_id TEXT NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (link_id, tag_id)
);

CREATE TABLE IF NOT EXISTS timeline_entries (
  id TEXT PRIMARY KEY,
  link_id TEXT NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('note', 'summary')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS maintenance_status (
  id TEXT PRIMARY KEY,
  is_maintenance_mode BOOLEAN NOT NULL,
  reason TEXT,
  started_at TIMESTAMPTZ,
  started_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS developers (
  uid TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  added_at TIMESTAMPTZ NOT NULL,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS maintenance_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL CHECK (action IN ('enabled', 'disabled')),
  reason TEXT,
  performed_by TEXT NOT NULL,
  performed_by_uid TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  previous_status BOOLEAN NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_links_user_archived_created
  ON links (user_id, is_archived, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_links_user_created
  ON links (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tags_user_created
  ON tags (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_timeline_link_created
  ON timeline_entries (link_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_maintenance_logs_timestamp
  ON maintenance_logs (timestamp DESC);

INSERT INTO maintenance_status (id, is_maintenance_mode, reason, started_at, started_by, updated_at)
VALUES ('current', FALSE, NULL, NULL, NULL, NOW())
ON CONFLICT (id) DO NOTHING;
