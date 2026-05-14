import * as Crypto from 'expo-crypto';
import { getDb } from '../db/client';
import type { LogRow } from '../db/types';
import type { Log, InsertLogInput, LogPatch } from '../domain/types';

function rowToLog(row: LogRow): Log {
  return {
    id: row.id,
    streakId: row.streak_id ?? '',
    title: row.title,
    description: row.description,
    rating: row.rating as Log['rating'],
    mediaPath: row.media_path,
    mediaType: row.media_type,
    createdAt: row.created_at,
  };
}

export async function findLogsByStreakId(streakId: string): Promise<Log[]> {
  const db = getDb();
  const rows = await db.getAllAsync<LogRow>(
    'SELECT * FROM logs WHERE streak_id = ? ORDER BY created_at ASC',
    [streakId]
  );
  return rows.map(rowToLog);
}

export async function findLogById(id: string): Promise<Log | null> {
  const db = getDb();
  const row = await db.getFirstAsync<LogRow>('SELECT * FROM logs WHERE id = ?', [id]);
  return row ? rowToLog(row) : null;
}

export async function insertLog(input: InsertLogInput): Promise<Log> {
  const db = getDb();
  const id = Crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await db.runAsync(
    'INSERT INTO logs (id, streak_id, title, description, rating, media_path, media_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, input.streakId, input.title, input.description ?? null, input.rating ?? null, input.mediaPath ?? null, input.mediaType ?? null, createdAt]
  );
  return {
    id,
    streakId: input.streakId,
    title: input.title,
    description: input.description ?? null,
    rating: input.rating ?? null,
    mediaPath: input.mediaPath ?? null,
    mediaType: input.mediaType ?? null,
    createdAt,
  };
}

export async function updateLog(id: string, patch: LogPatch): Promise<Log> {
  const db = getDb();
  const existing = await findLogById(id);
  if (!existing) throw new Error(`Log ${id} not found`);
  const updated: Log = {
    ...existing,
    title: patch.title ?? existing.title,
    description: patch.description !== undefined ? patch.description : existing.description,
    rating: patch.rating !== undefined ? patch.rating : existing.rating,
    mediaPath: patch.mediaPath !== undefined ? patch.mediaPath : existing.mediaPath,
    mediaType: patch.mediaType !== undefined ? patch.mediaType : existing.mediaType,
  };
  await db.runAsync(
    'UPDATE logs SET title = ?, description = ?, rating = ?, media_path = ?, media_type = ? WHERE id = ?',
    [updated.title, updated.description ?? null, updated.rating ?? null, updated.mediaPath ?? null, updated.mediaType ?? null, id]
  );
  return updated;
}

export async function deleteLog(id: string): Promise<void> {
  const db = getDb();
  await db.runAsync('DELETE FROM logs WHERE id = ?', [id]);
}

export async function deleteLogsByStreakId(streakId: string): Promise<void> {
  const db = getDb();
  await db.runAsync('DELETE FROM logs WHERE streak_id = ?', [streakId]);
}
