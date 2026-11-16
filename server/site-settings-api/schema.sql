CREATE TABLE IF NOT EXISTS admin_credentials (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  password_salt char(32) NOT NULL,
  password_hash char(64) NOT NULL,
  recovery_code_hash char(64) NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id uuid PRIMARY KEY,
  token_hash char(64) NOT NULL UNIQUE,
  csrf_hash char(64) NOT NULL,
  user_agent varchar(300) NOT NULL DEFAULT '',
  ip_address varchar(80) NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS admin_sessions_expires_at_idx
  ON admin_sessions (expires_at);

CREATE TABLE IF NOT EXISTS site_announcement (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  payload jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS announcement_presets (
  id uuid PRIMARY KEY,
  name varchar(80) NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
