// ============================================================
// Kron — Streak CRUD Queries
// ============================================================

import { getDatabase } from '../index';
import { generateId, today, nowISO, mapStreakRow } from '../helpers';
import type {
  Streak,
  StreakRow,
  CreateStreakInput,
  UpdateStreakInput,
  StreakStatus,
} from '../types';

// === Create ===

export async function createStreak(input: CreateStreakInput): Promise<Streak> {
  const db = await getDatabase();
  const id = generateId();
  const now = nowISO();
  const startDate = input.startDate ?? today();

  await db.runAsync(
    `INSERT INTO streaks (
      id, name, description, emoji, color,
      schedule_type, schedule_config, proof_type,
      visualization_type, target_days, status,
      current_streak, longest_streak, total_achieved,
      start_date, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 0, 0, 0, ?, ?, ?)`,
    id,
    input.name,
    input.description ?? null,
    input.emoji ?? null,
    input.color ?? null,
    input.scheduleType,
    input.scheduleConfig ? JSON.stringify(input.scheduleConfig) : null,
    input.proofType,
    input.visualizationType ?? 'counter_dots',
    input.targetDays ?? null,
    startDate,
    now,
    now
  );

  return (await getStreakById(id))!;
}

// === Read ===

export async function getStreakById(id: string): Promise<Streak | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<StreakRow>(
    'SELECT * FROM streaks WHERE id = ?',
    id
  );
  return row ? mapStreakRow(row) : null;
}

export async function getActiveStreaks(): Promise<Streak[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<StreakRow>(
    `SELECT * FROM streaks
     WHERE status = 'active'
     ORDER BY created_at DESC`
  );
  return rows.map(mapStreakRow);
}

export async function getAllStreaks(
  statuses?: StreakStatus[]
): Promise<Streak[]> {
  const db = await getDatabase();

  if (statuses && statuses.length > 0) {
    const placeholders = statuses.map(() => '?').join(', ');
    const rows = await db.getAllAsync<StreakRow>(
      `SELECT * FROM streaks
       WHERE status IN (${placeholders})
       ORDER BY created_at DESC`,
      ...statuses
    );
    return rows.map(mapStreakRow);
  }

  const rows = await db.getAllAsync<StreakRow>(
    'SELECT * FROM streaks ORDER BY created_at DESC'
  );
  return rows.map(mapStreakRow);
}

export async function getArchivedStreaks(): Promise<Streak[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<StreakRow>(
    `SELECT * FROM streaks
     WHERE status = 'archived'
     ORDER BY updated_at DESC`
  );
  return rows.map(mapStreakRow);
}

// === Update ===

export async function updateStreak(
  id: string,
  input: UpdateStreakInput
): Promise<Streak | null> {
  const db = await getDatabase();
  const now = nowISO();

  // Build dynamic SET clause from provided fields
  const sets: string[] = [];
  const values: unknown[] = [];

  if (input.name !== undefined) {
    sets.push('name = ?');
    values.push(input.name);
  }
  if (input.description !== undefined) {
    sets.push('description = ?');
    values.push(input.description);
  }
  if (input.emoji !== undefined) {
    sets.push('emoji = ?');
    values.push(input.emoji);
  }
  if (input.color !== undefined) {
    sets.push('color = ?');
    values.push(input.color);
  }
  if (input.scheduleType !== undefined) {
    sets.push('schedule_type = ?');
    values.push(input.scheduleType);
  }
  if (input.scheduleConfig !== undefined) {
    sets.push('schedule_config = ?');
    values.push(
      input.scheduleConfig ? JSON.stringify(input.scheduleConfig) : null
    );
  }
  if (input.proofType !== undefined) {
    sets.push('proof_type = ?');
    values.push(input.proofType);
  }
  if (input.visualizationType !== undefined) {
    sets.push('visualization_type = ?');
    values.push(input.visualizationType);
  }
  if (input.targetDays !== undefined) {
    sets.push('target_days = ?');
    values.push(input.targetDays);
  }
  if (input.status !== undefined) {
    sets.push('status = ?');
    values.push(input.status);
  }

  if (sets.length === 0) return getStreakById(id);

  sets.push('updated_at = ?');
  values.push(now);
  values.push(id);

  await db.runAsync(
    `UPDATE streaks SET ${sets.join(', ')} WHERE id = ?`,
    ...values
  );

  return getStreakById(id);
}

/**
 * Updates the cached streak counter fields.
 * Called after log create/update/delete or pause changes.
 */
export async function updateStreakCounters(
  id: string,
  currentStreak: number,
  longestStreak: number,
  totalAchieved: number
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE streaks
     SET current_streak = ?, longest_streak = ?, total_achieved = ?, updated_at = ?
     WHERE id = ?`,
    currentStreak,
    longestStreak,
    totalAchieved,
    nowISO(),
    id
  );
}

// === Status Changes ===

export async function pauseStreak(id: string): Promise<Streak | null> {
  return updateStreak(id, { status: 'paused' });
}

export async function resumeStreak(id: string): Promise<Streak | null> {
  return updateStreak(id, { status: 'active' });
}

export async function archiveStreak(id: string): Promise<Streak | null> {
  return updateStreak(id, { status: 'archived' });
}

export async function completeStreak(id: string): Promise<Streak | null> {
  return updateStreak(id, { status: 'completed' });
}

// === Delete ===

export async function deleteStreak(id: string): Promise<void> {
  const db = await getDatabase();
  // CASCADE will delete related logs, media, pause_history, reminders, milestones
  await db.runAsync('DELETE FROM streaks WHERE id = ?', id);
}
