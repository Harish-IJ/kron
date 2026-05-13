import type { SQLiteDatabase } from 'expo-sqlite';

const MIGRATIONS: Array<{ version: number; sql: string }> = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS streak (
        id            TEXT    NOT NULL PRIMARY KEY DEFAULT 'singleton',
        title         TEXT    NOT NULL,
        interval_type TEXT    NOT NULL CHECK (interval_type IN ('daily', 'every_n_days', 'weekly')),
        interval_days INTEGER NOT NULL CHECK (interval_days >= 1),
        notification_times TEXT NOT NULL DEFAULT '[]',
        start_date    TEXT    NOT NULL,
        created_at    TEXT    NOT NULL
      );
      CREATE TABLE IF NOT EXISTS logs (
        id           TEXT    NOT NULL PRIMARY KEY,
        title        TEXT    NOT NULL,
        description  TEXT,
        rating       INTEGER CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
        media_path   TEXT,
        media_type   TEXT    CHECK (media_type IS NULL OR media_type = 'image'),
        created_at   TEXT    NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs (created_at ASC);
    `,
  },
];

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS migrations (
      version    INTEGER NOT NULL PRIMARY KEY,
      applied_at TEXT    NOT NULL
    );
  `);

  const applied = await db.getAllAsync<{ version: number }>(
    'SELECT version FROM migrations ORDER BY version ASC'
  );
  const appliedVersions = new Set(applied.map(r => r.version));

  for (const migration of MIGRATIONS) {
    if (!appliedVersions.has(migration.version)) {
      await db.execAsync(migration.sql);
      await db.runAsync(
        'INSERT INTO migrations (version, applied_at) VALUES (?, ?)',
        [migration.version, new Date().toISOString()]
      );
    }
  }
}
