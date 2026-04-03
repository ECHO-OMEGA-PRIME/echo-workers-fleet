CREATE TABLE IF NOT EXISTS servers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  server_name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT,
  tool_count INTEGER DEFAULT 0,
  is_cloud INTEGER DEFAULT 0,
  cloud_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_servers_category ON servers(category);
CREATE INDEX IF NOT EXISTS idx_servers_name ON servers(server_name);

CREATE TABLE IF NOT EXISTS tools (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  server_id INTEGER REFERENCES servers(id),
  tool_name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  parameters TEXT,
  cloud_endpoint TEXT,
  is_available INTEGER DEFAULT 1,
  usage_count INTEGER DEFAULT 0,
  last_used_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tools_name ON tools(tool_name);
CREATE INDEX IF NOT EXISTS idx_tools_server ON tools(server_id);
CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category);

CREATE TABLE IF NOT EXISTS usage_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_name TEXT NOT NULL,
  server_name TEXT,
  success INTEGER DEFAULT 1,
  response_time_ms INTEGER,
  error_message TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_usage_time ON usage_log(created_at);
