-- V2Ray 订阅管理 - D1 Schema
-- 应用：npx wrangler d1 execute v2ray-sub --file=schema.sql --remote

CREATE TABLE IF NOT EXISTS nodes (
  id TEXT PRIMARY KEY,
  uri TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL DEFAULT '',
  enabled INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nodes_enabled ON nodes(enabled);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  enabled INTEGER NOT NULL DEFAULT 1,
  expiry INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  fetch_count INTEGER NOT NULL DEFAULT 0,
  last_fetch_at INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_token ON users(token);
CREATE INDEX IF NOT EXISTS idx_users_enabled ON users(enabled);

CREATE TABLE IF NOT EXISTS user_nodes (
  user_id TEXT NOT NULL,
  node_id TEXT NOT NULL,
  PRIMARY KEY (user_id, node_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_nodes_user ON user_nodes(user_id);
