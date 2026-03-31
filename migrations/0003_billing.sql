-- Usage tracking for metering and billing
CREATE TABLE IF NOT EXISTS usage_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  api_key_id INTEGER REFERENCES api_keys(id),
  model TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost_credits REAL DEFAULT 0,
  status_code INTEGER,
  latency_ms INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Billing: add credits and Stripe fields to users
ALTER TABLE users ADD COLUMN credits REAL DEFAULT 100.0;
ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN plan TEXT DEFAULT 'free';

-- API key rate limiting
ALTER TABLE api_keys ADD COLUMN rate_limit_rpm INTEGER DEFAULT 60;
ALTER TABLE api_keys ADD COLUMN last_used_at DATETIME;

-- Stripe events log (idempotency)
CREATE TABLE IF NOT EXISTS stripe_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  processed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Credit top-up history
CREATE TABLE IF NOT EXISTS credit_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  amount REAL NOT NULL,
  type TEXT NOT NULL, -- 'topup', 'usage', 'bonus', 'refund'
  description TEXT,
  stripe_payment_id TEXT,
  balance_after REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usage_user ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_created ON usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_model ON usage_logs(model);
CREATE INDEX IF NOT EXISTS idx_credit_tx_user ON credit_transactions(user_id);
