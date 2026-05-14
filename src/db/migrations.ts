import type { SQLiteDatabase } from 'expo-sqlite';

type Migration =
  | { version: number; sql: string }
  | { version: number; run: (db: SQLiteDatabase) => Promise<void> };

const MIGRATIONS: Migration[] = [
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
  {
    // Recreate logs only when the title column is missing (stale early-dev schema).
    version: 2,
    run: async (db) => {
      const cols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(logs)');
      const hasTitle = cols.some(c => c.name === 'title');
      if (!hasTitle) {
        await db.execAsync(`
          DROP TABLE IF EXISTS logs;
          CREATE TABLE logs (
            id           TEXT    NOT NULL PRIMARY KEY,
            title        TEXT    NOT NULL,
            description  TEXT,
            rating       INTEGER CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
            media_path   TEXT,
            media_type   TEXT    CHECK (media_type IS NULL OR media_type = 'image'),
            created_at   TEXT    NOT NULL
          );
          CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs (created_at ASC);
        `);
      }
    },
  },
  {
    // Add weekday and month-date columns for weekly_on_days and monthly_on_dates interval types.
    version: 3,
    sql: `
      ALTER TABLE streak ADD COLUMN interval_weekdays TEXT;
      ALTER TABLE streak ADD COLUMN interval_month_dates TEXT;
    `,
  },
  {
    // Add streak_id to logs (multi-streak). Backfill existing rows with 'singleton'.
    // streak_id is nullable at the DB level; repository always provides it at INSERT.
    version: 4,
    run: async (db) => {
      await db.execAsync(`ALTER TABLE logs ADD COLUMN streak_id TEXT;`);
      await db.runAsync(`UPDATE logs SET streak_id = 'singleton' WHERE streak_id IS NULL`);
      await db.execAsync(
        `CREATE INDEX IF NOT EXISTS idx_logs_streak_id ON logs (streak_id, created_at ASC);`
      );
    },
  },
  {
    // Persist UI settings (e.g. activeStreakId) across app restarts.
    version: 5,
    sql: `
      CREATE TABLE IF NOT EXISTS app_settings (
        key   TEXT NOT NULL PRIMARY KEY,
        value TEXT NOT NULL
      );
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
      await db.withTransactionAsync(async () => {
        if ('sql' in migration) {
          await db.execAsync(migration.sql);
        } else {
          await migration.run(db);
        }
        await db.runAsync(
          'INSERT INTO migrations (version, applied_at) VALUES (?, ?)',
          [migration.version, new Date().toISOString()]
        );
      });
    }
  }
}
