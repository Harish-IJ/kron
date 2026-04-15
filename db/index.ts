// ============================================================
// Kron — Database Initialization & Migration Runner
// Uses expo-sqlite (built-in, no extra deps)
// ============================================================

import * as SQLite from 'expo-sqlite';
import { Asset } from 'expo-asset';

const DB_NAME = 'kron.db';

// Migration registry — add new migrations here in order
const MIGRATIONS = [
  { version: 1, name: '001_initial_schema' },
] as const;

let _db: SQLite.SQLiteDatabase | null = null;

/**
 * Gets the database instance, initializing if needed.
 * This is the single entry point for all database access.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await initializeDatabase();
  return _db;
}

/**
 * Opens the database, enables WAL mode and foreign keys,
 * then runs any pending migrations.
 */
async function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);

  // Enable WAL mode for better concurrent read performance
  await db.execAsync('PRAGMA journal_mode = WAL;');

  // Enable foreign key constraints (off by default in SQLite)
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Run migrations
  await runMigrations(db);

  return db;
}

/**
 * Creates the migration tracking table and runs any pending migrations.
 * Each migration is wrapped in a transaction for atomicity.
 */
async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  // Create migration tracking table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      name    TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Check current version
  const result = await db.getFirstAsync<{ max_version: number | null }>(
    'SELECT MAX(version) as max_version FROM _migrations'
  );
  const currentVersion = result?.max_version ?? 0;

  // Run pending migrations
  for (const migration of MIGRATIONS) {
    if (migration.version <= currentVersion) continue;

    console.log(`[Kron DB] Running migration: ${migration.name}`);

    const sql = await loadMigrationSQL(migration.name);
    await db.withTransactionAsync(async () => {
      await db.execAsync(sql);
      await db.runAsync(
        'INSERT INTO _migrations (version, name) VALUES (?, ?)',
        migration.version,
        migration.name
      );
    });

    console.log(`[Kron DB] Migration ${migration.name} applied successfully`);
  }
}

/**
 * Loads a migration SQL file from the bundled assets.
 * Falls back to inline SQL if asset loading fails (dev convenience).
 */
async function loadMigrationSQL(name: string): Promise<string> {
  // In production, migrations are bundled as assets.
  // For simplicity in v1, we inline the SQL here.
  // Future: use require() with metro SQL asset plugin.
  const migrations: Record<string, string> = {
    '001_initial_schema': MIGRATION_001,
  };

  const sql = migrations[name];
  if (!sql) {
    throw new Error(`Unknown migration: ${name}`);
  }
  return sql;
}

/**
 * Closes the database connection. Call on app shutdown.
 */
export async function closeDatabase(): Promise<void> {
  if (_db) {
    await _db.closeAsync();
    _db = null;
  }
}

/**
 * Resets the database completely. Use only for development/testing.
 * Drops all tables and re-runs migrations.
 */
export async function resetDatabase(): Promise<void> {
  if (_db) {
    await _db.closeAsync();
    _db = null;
  }
  await SQLite.deleteDatabaseAsync(DB_NAME);
  _db = await initializeDatabase();
}

// ============================================================
// Inline Migration SQL (bundled in code for v1 simplicity)
// ============================================================

const MIGRATION_001 = `
-- Streaks: the core entity
CREATE TABLE IF NOT EXISTS streaks (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT,
  emoji         TEXT,
  color         TEXT,
  schedule_type TEXT NOT NULL CHECK(schedule_type IN ('daily', 'weekdays', 'interval')),
  schedule_config TEXT,
  proof_type    TEXT NOT NULL CHECK(proof_type IN ('media', 'reflection')),
  visualization_type TEXT NOT NULL DEFAULT 'counter_dots'
                CHECK(visualization_type IN ('heatmap', 'counter_dots', 'ring')),
  target_days   INTEGER,
  status        TEXT NOT NULL DEFAULT 'active'
                CHECK(status IN ('active', 'paused', 'archived', 'completed')),
  current_streak  INTEGER NOT NULL DEFAULT 0,
  longest_streak  INTEGER NOT NULL DEFAULT 0,
  total_achieved  INTEGER NOT NULL DEFAULT 0,
  start_date    TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS logs (
  id          TEXT PRIMARY KEY,
  streak_id   TEXT NOT NULL REFERENCES streaks(id) ON DELETE CASCADE,
  log_date    TEXT NOT NULL,
  log_number  INTEGER NOT NULL DEFAULT 1 CHECK(log_number BETWEEN 1 AND 3),
  status      TEXT NOT NULL CHECK(status IN ('achieved', 'not_achieved')),
  note        TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(streak_id, log_date, log_number)
);

CREATE INDEX IF NOT EXISTS idx_logs_streak_date ON logs(streak_id, log_date);
CREATE INDEX IF NOT EXISTS idx_logs_date ON logs(log_date);

CREATE TABLE IF NOT EXISTS log_media (
  id              TEXT PRIMARY KEY,
  log_id          TEXT NOT NULL REFERENCES logs(id) ON DELETE CASCADE,
  media_type      TEXT NOT NULL CHECK(media_type IN ('photo', 'video', 'audio')),
  file_path       TEXT NOT NULL,
  file_size       INTEGER,
  duration        INTEGER,
  thumbnail_path  TEXT,
  width           INTEGER,
  height          INTEGER,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_log_media_log ON log_media(log_id);

CREATE TABLE IF NOT EXISTS pause_history (
  id          TEXT PRIMARY KEY,
  streak_id   TEXT NOT NULL REFERENCES streaks(id) ON DELETE CASCADE,
  paused_at   TEXT NOT NULL,
  resumed_at  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pause_streak ON pause_history(streak_id);

CREATE TABLE IF NOT EXISTS reminders (
  id                     TEXT PRIMARY KEY,
  streak_id              TEXT NOT NULL REFERENCES streaks(id) ON DELETE CASCADE,
  reminder_time          TEXT NOT NULL,
  enabled                INTEGER NOT NULL DEFAULT 1,
  smart_reminder_enabled INTEGER NOT NULL DEFAULT 1,
  smart_reminder_time    TEXT DEFAULT '21:00',
  created_at             TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at             TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS milestone_acks (
  id              TEXT PRIMARY KEY,
  streak_id       TEXT NOT NULL REFERENCES streaks(id) ON DELETE CASCADE,
  milestone_days  INTEGER NOT NULL,
  achieved_at     TEXT NOT NULL,
  acknowledged    INTEGER NOT NULL DEFAULT 0,
  UNIQUE(streak_id, milestone_days)
);

CREATE TABLE IF NOT EXISTS app_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;
