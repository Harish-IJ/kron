-- ============================================================
-- Kron — Migration 001: Initial Schema
-- Phase 2 Data Model (locked)
-- ============================================================

-- Streaks: the core entity
CREATE TABLE IF NOT EXISTS streaks (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT,
  emoji         TEXT,
  color         TEXT,
  schedule_type TEXT NOT NULL CHECK(schedule_type IN ('daily', 'weekdays', 'interval')),
  schedule_config TEXT,  -- JSON: {"weekdays":[1,3,5]} or {"interval":3}
  proof_type    TEXT NOT NULL CHECK(proof_type IN ('media', 'reflection')),
  visualization_type TEXT NOT NULL DEFAULT 'counter_dots'
                CHECK(visualization_type IN ('heatmap', 'counter_dots', 'ring')),
  target_days   INTEGER,
  status        TEXT NOT NULL DEFAULT 'active'
                CHECK(status IN ('active', 'paused', 'archived', 'completed')),
  current_streak  INTEGER NOT NULL DEFAULT 0,
  longest_streak  INTEGER NOT NULL DEFAULT 0,
  total_achieved  INTEGER NOT NULL DEFAULT 0,
  start_date    TEXT NOT NULL,  -- YYYY-MM-DD
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Logs: proof entries per day per streak
CREATE TABLE IF NOT EXISTS logs (
  id          TEXT PRIMARY KEY,
  streak_id   TEXT NOT NULL REFERENCES streaks(id) ON DELETE CASCADE,
  log_date    TEXT NOT NULL,  -- YYYY-MM-DD (allows retroactive logging)
  log_number  INTEGER NOT NULL DEFAULT 1 CHECK(log_number BETWEEN 1 AND 3),
  status      TEXT NOT NULL CHECK(status IN ('achieved', 'not_achieved')),
  note        TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(streak_id, log_date, log_number)
);

CREATE INDEX IF NOT EXISTS idx_logs_streak_date ON logs(streak_id, log_date);
CREATE INDEX IF NOT EXISTS idx_logs_date ON logs(log_date);

-- Log media: photos, videos, audio attached to log entries
CREATE TABLE IF NOT EXISTS log_media (
  id              TEXT PRIMARY KEY,
  log_id          TEXT NOT NULL REFERENCES logs(id) ON DELETE CASCADE,
  media_type      TEXT NOT NULL CHECK(media_type IN ('photo', 'video', 'audio')),
  file_path       TEXT NOT NULL,
  file_size       INTEGER,
  duration        INTEGER,      -- seconds (video/audio only)
  thumbnail_path  TEXT,         -- video thumbnail
  width           INTEGER,
  height          INTEGER,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_log_media_log ON log_media(log_id);

-- Pause history: tracks when streaks are paused/resumed
CREATE TABLE IF NOT EXISTS pause_history (
  id          TEXT PRIMARY KEY,
  streak_id   TEXT NOT NULL REFERENCES streaks(id) ON DELETE CASCADE,
  paused_at   TEXT NOT NULL,   -- YYYY-MM-DD
  resumed_at  TEXT,            -- NULL if currently paused
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pause_streak ON pause_history(streak_id);

-- Reminders: notification settings per streak
CREATE TABLE IF NOT EXISTS reminders (
  id                     TEXT PRIMARY KEY,
  streak_id              TEXT NOT NULL REFERENCES streaks(id) ON DELETE CASCADE,
  reminder_time          TEXT NOT NULL,       -- HH:mm
  enabled                INTEGER NOT NULL DEFAULT 1,
  smart_reminder_enabled INTEGER NOT NULL DEFAULT 1,
  smart_reminder_time    TEXT DEFAULT '21:00', -- HH:mm
  created_at             TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at             TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Milestone acknowledgements: tracks which milestones user has seen
CREATE TABLE IF NOT EXISTS milestone_acks (
  id              TEXT PRIMARY KEY,
  streak_id       TEXT NOT NULL REFERENCES streaks(id) ON DELETE CASCADE,
  milestone_days  INTEGER NOT NULL,  -- 7, 30, 100, 365
  achieved_at     TEXT NOT NULL,
  acknowledged    INTEGER NOT NULL DEFAULT 0,
  UNIQUE(streak_id, milestone_days)
);

-- App settings: key-value store for app-wide preferences
CREATE TABLE IF NOT EXISTS app_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
