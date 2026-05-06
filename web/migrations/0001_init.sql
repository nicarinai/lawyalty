-- 라윌티 인증 스키마 초기 마이그레이션
-- 출처: docs/lawyalty/01-auth.md § 2 (D1 스키마)

-- 사용자
CREATE TABLE users (
  id              TEXT PRIMARY KEY,
  email           TEXT UNIQUE NOT NULL COLLATE NOCASE,
  name            TEXT NOT NULL,
  password_hash   TEXT,
  role            TEXT NOT NULL DEFAULT 'user',
  status          TEXT NOT NULL DEFAULT 'pending',
  email_verified_at INTEGER,
  phone           TEXT,
  phone_verified_at INTEGER,
  organization    TEXT,
  license_number  TEXT,
  mfa_enabled     INTEGER NOT NULL DEFAULT 0,
  mfa_secret      TEXT,
  failed_login_count INTEGER NOT NULL DEFAULT 0,
  locked_until    INTEGER,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL,
  last_login_at   INTEGER
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- 세션
CREATE TABLE sessions (
  token_hash      TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  expires_at      INTEGER NOT NULL,
  refresh_until   INTEGER NOT NULL,
  ip              TEXT,
  user_agent      TEXT,
  created_at      INTEGER NOT NULL,
  last_used_at    INTEGER NOT NULL,
  revoked_at      INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- 사용자별 추가 권한
CREATE TABLE user_permissions (
  user_id         TEXT NOT NULL,
  permission      TEXT NOT NULL,
  granted_by      TEXT NOT NULL,
  granted_at      INTEGER NOT NULL,
  PRIMARY KEY (user_id, permission),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id)
);

-- 그룹
CREATE TABLE groups (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  description     TEXT,
  created_at      INTEGER NOT NULL
);

CREATE TABLE group_members (
  group_id        TEXT NOT NULL,
  user_id         TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'member',
  joined_at       INTEGER NOT NULL,
  PRIMARY KEY (group_id, user_id),
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 일회성 토큰 (이메일 인증, 비밀번호 리셋, 매직 링크)
CREATE TABLE one_time_tokens (
  token_hash      TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  purpose         TEXT NOT NULL,
  expires_at      INTEGER NOT NULL,
  used_at         INTEGER,
  created_at      INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 감사 로그
CREATE TABLE audit_log (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         TEXT,
  action          TEXT NOT NULL,
  target_type     TEXT,
  target_id       TEXT,
  ip              TEXT,
  user_agent      TEXT,
  metadata        TEXT,
  created_at      INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_user ON audit_log(user_id, created_at);
CREATE INDEX idx_audit_action ON audit_log(action, created_at);

-- OAuth 연동
CREATE TABLE oauth_accounts (
  provider        TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  user_id         TEXT NOT NULL,
  email           TEXT,
  linked_at       INTEGER NOT NULL,
  PRIMARY KEY (provider, provider_user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
