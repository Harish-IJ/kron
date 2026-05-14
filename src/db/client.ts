import * as SQLite from 'expo-sqlite';
import { runMigrations } from './migrations';

let _db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) throw new Error('Database not initialized — call initDb() first');
  return _db;
}

export async function initDb(): Promise<void> {
  if (_db) return;
  try {
    _db = await SQLite.openDatabaseAsync('kron.db');
    await runMigrations(_db);
  } catch (e) {
    _db = null;
    throw new Error(`Failed to initialize database: ${e instanceof Error ? e.message : String(e)}`);
  }
}
