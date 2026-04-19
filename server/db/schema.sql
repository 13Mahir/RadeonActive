-- Transactions table: all DBT payment records
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  beneficiary_id TEXT NOT NULL,
  aadhaar TEXT NOT NULL,
  name TEXT NOT NULL,
  name_normalized TEXT NOT NULL,
  scheme TEXT NOT NULL,
  district TEXT NOT NULL,
  amount INTEGER NOT NULL,
  transaction_date TEXT NOT NULL,
  withdrawn INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Death register: civil death records
CREATE TABLE IF NOT EXISTS death_register (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  aadhaar TEXT NOT NULL,
  name TEXT NOT NULL,
  name_normalized TEXT NOT NULL,
  death_date TEXT NOT NULL
);

-- Flagged cases: output of risk engine
CREATE TABLE IF NOT EXISTS flagged_cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id INTEGER NOT NULL,
  beneficiary_id TEXT NOT NULL,
  aadhaar TEXT NOT NULL,
  name TEXT NOT NULL,
  scheme TEXT NOT NULL,
  district TEXT NOT NULL,
  amount INTEGER NOT NULL,
  transaction_date TEXT NOT NULL,
  leakage_type TEXT NOT NULL,
  risk_score INTEGER NOT NULL,
  risk_reason TEXT NOT NULL,
  evidence_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Flagged',
  assigned_to TEXT,
  verification_remarks TEXT,
  verification_lat REAL,
  verification_lng REAL,
  verification_timestamp TEXT,
  date_flagged TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);

-- Case actions audit log
CREATE TABLE IF NOT EXISTS case_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  actor_id TEXT NOT NULL DEFAULT 'system',
  old_value TEXT,
  new_value TEXT,
  timestamp TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (case_id) REFERENCES flagged_cases(id)
);

-- Processing runs: track ingestion history
CREATE TABLE IF NOT EXISTS processing_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_type TEXT NOT NULL,
  transactions_processed INTEGER,
  cases_flagged INTEGER,
  duration_ms INTEGER,
  status TEXT NOT NULL,
  error_message TEXT,
  started_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_txn_aadhaar ON transactions(aadhaar);
CREATE INDEX IF NOT EXISTS idx_txn_name_normalized ON transactions(name_normalized);
CREATE INDEX IF NOT EXISTS idx_txn_scheme ON transactions(scheme);
CREATE INDEX IF NOT EXISTS idx_txn_district ON transactions(district);
CREATE INDEX IF NOT EXISTS idx_txn_withdrawn ON transactions(withdrawn);
CREATE INDEX IF NOT EXISTS idx_txn_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_death_aadhaar ON death_register(aadhaar);
CREATE INDEX IF NOT EXISTS idx_death_name ON death_register(name_normalized);
CREATE INDEX IF NOT EXISTS idx_cases_status ON flagged_cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_risk ON flagged_cases(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_cases_type ON flagged_cases(leakage_type);
CREATE INDEX IF NOT EXISTS idx_cases_district ON flagged_cases(district);

-- Users table for authentication (added in document1.md)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL DEFAULT '',
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,                -- DFO | VERIFIER | AUDITOR | ADMIN
  district TEXT,
  staff_id TEXT UNIQUE,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_login TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  google_id TEXT UNIQUE,
  email TEXT,
  avatar_url TEXT
);

-- Migration: add Google OAuth columns if they don't exist (safe to run multiple times)
CREATE TABLE IF NOT EXISTS _schema_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration TEXT NOT NULL UNIQUE,
  applied_at TEXT DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO _schema_migrations (migration) VALUES ('add_google_oauth_columns');

-- User sessions (simple token store — no Redis needed for hackathon)
CREATE TABLE IF NOT EXISTS user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- System Configuration
CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);
