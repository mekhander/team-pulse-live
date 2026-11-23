CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  view_key TEXT NOT NULL,
  view_key_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'collecting' CHECK (status IN ('collecting', 'closed', 'published')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  published_at TEXT
);

CREATE TABLE responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  participant_hash TEXT NOT NULL,
  answers TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  UNIQUE (session_id, participant_hash)
);

CREATE INDEX responses_session_id_idx ON responses(session_id);
