-- Worker Platform D1 Schema
-- Users table for OpenAuth
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Workers registry
CREATE TABLE IF NOT EXISTS workers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  owner_id INTEGER REFERENCES users(id),
  namespace TEXT NOT NULL DEFAULT 'my-dispatch-namespace',
  status TEXT DEFAULT 'active',
  code TEXT,
  bindings_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- MCP tool registry
CREATE TABLE IF NOT EXISTS mcp_tools (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  input_schema TEXT,
  handler_worker TEXT REFERENCES workers(name),
  enabled INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- MCP resource registry
CREATE TABLE IF NOT EXISTS mcp_resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uri TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  mime_type TEXT DEFAULT 'application/json',
  handler_worker TEXT REFERENCES workers(name),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Agent sessions for Codex/OpenCode
CREATE TABLE IF NOT EXISTS agent_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  agent_type TEXT NOT NULL, -- 'codex', 'opencode', 'chat'
  model TEXT,
  status TEXT DEFAULT 'active',
  context_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Chat messages for HuggingFace Chat UI
CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER REFERENCES agent_sessions(id),
  role TEXT NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  model TEXT,
  metadata_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- API keys for service-to-service auth
CREATE TABLE IF NOT EXISTS api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  key_hash TEXT UNIQUE NOT NULL,
  name TEXT,
  scopes TEXT DEFAULT '*',
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- HuggingFace model registry
CREATE TABLE IF NOT EXISTS hf_models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id TEXT UNIQUE NOT NULL,
  description TEXT,
  architecture TEXT,
  capabilities TEXT,
  status TEXT DEFAULT 'available',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workers_owner ON workers(owner_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON agent_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
