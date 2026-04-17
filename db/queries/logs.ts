// ============================================================
// Kron — Log CRUD Queries
// ============================================================

import { getDatabase } from '../index';
import {
  generateId,
  today,
  nowISO,
  mapLogRow,
  mapLogMediaRow,
  mapPauseHistoryRow,
} from '../helpers';
import type {
  Log,
  LogRow,
  LogMedia,
  LogMediaRow,
  CreateLogInput,
  CreateLogMediaInput,
  PauseHistory,
  PauseHistoryRow,
  Reminder,
  ReminderRow,
  MilestoneAck,
  MilestoneAckRow,
  CreateReminderInput,
} from '../types';
import { mapReminderRow, mapMilestoneAckRow } from '../helpers';

// ============================================================
// LOG CRUD
// ============================================================

// === Create ===

/**
 * Creates a new log entry for a streak.
 * Automatically assigns the next log_number (1, 2, or 3).
 * Throws if max 3 logs per day already reached.
 */
export async function createLog(input: CreateLogInput): Promise<Log> {
  const db = await getDatabase();
  const id = generateId();
  const logDate = input.logDate ?? today();
  const now = nowISO();

  // Determine next log number
  const countResult = await db.getFirstAsync<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM logs
     WHERE streak_id = ? AND log_date = ?`,
    input.streakId,
    logDate
  );
  const nextLogNumber = (countResult?.cnt ?? 0) + 1;

  if (nextLogNumber > 3) {
    throw new Error(
      `Max logs reached: streak ${input.streakId} already has 3 logs for ${logDate}`
    );
  }

  await db.runAsync(
    `INSERT INTO logs (id, streak_id, log_date, log_number, status, note, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.streakId,
    logDate,
    nextLogNumber,
    input.status,
    input.note ?? null,
    now,
    now
  );

  // Added in Phase 6: Support inserting media refs
  if (input.mediaPaths && input.mediaPaths.length > 0) {
    for (const filePath of input.mediaPaths) {
      // Re-use existing createLogMedia function below
      await createLogMedia({
        logId: id,
        mediaType: filePath.endsWith('.mp4') ? 'video' : 'photo',
        filePath,
      });
    }
  }

  return (await getLogById(id))!;
}

// === Read ===

export async function getLogById(id: string): Promise<Log | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<LogRow>(
    'SELECT * FROM logs WHERE id = ?',
    id
  );
  return row ? mapLogRow(row) : null;
}

/** Get all logs for a streak, ordered by date descending then log_number ascending */
export async function getLogsByStreak(streakId: string): Promise<Log[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<LogRow>(
    `SELECT * FROM logs
     WHERE streak_id = ?
     ORDER BY log_date DESC, log_number ASC`,
    streakId
  );
  return rows.map(mapLogRow);
}

/** Get all logs for a streak on a specific date */
export async function getLogsByStreakAndDate(
  streakId: string,
  logDate: string
): Promise<Log[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<LogRow>(
    `SELECT * FROM logs
     WHERE streak_id = ? AND log_date = ?
     ORDER BY log_number ASC`,
    streakId,
    logDate
  );
  return rows.map(mapLogRow);
}

/** Get all logs for any streak on a specific date (for timeline view) */
export async function getLogsByDate(logDate: string): Promise<Log[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<LogRow>(
    `SELECT * FROM logs
     WHERE log_date = ?
     ORDER BY created_at ASC`,
    logDate
  );
  return rows.map(mapLogRow);
}

/** Get logs for a streak in a date range (for calendar/analytics) */
export async function getLogsByStreakInRange(
  streakId: string,
  startDate: string,
  endDate: string
): Promise<Log[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<LogRow>(
    `SELECT * FROM logs
     WHERE streak_id = ? AND log_date >= ? AND log_date <= ?
     ORDER BY log_date ASC, log_number ASC`,
    streakId,
    startDate,
    endDate
  );
  return rows.map(mapLogRow);
}

/**
 * Resolves day status using LAST log wins rule (Phase 2 locked decision).
 * Returns the status of the highest log_number for the given date.
 */
export async function resolveDayStatus(
  streakId: string,
  logDate: string
): Promise<'achieved' | 'not_achieved' | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ status: string }>(
    `SELECT status FROM logs
     WHERE streak_id = ? AND log_date = ?
     ORDER BY log_number DESC
     LIMIT 1`,
    streakId,
    logDate
  );
  return row ? (row.status as 'achieved' | 'not_achieved') : null;
}

// === Update ===

export async function updateLogStatus(
  id: string,
  status: 'achieved' | 'not_achieved'
): Promise<Log | null> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE logs SET status = ?, updated_at = ? WHERE id = ?`,
    status,
    nowISO(),
    id
  );
  return getLogById(id);
}

export async function updateLogNote(
  id: string,
  note: string | null
): Promise<Log | null> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE logs SET note = ?, updated_at = ? WHERE id = ?`,
    note,
    nowISO(),
    id
  );
  return getLogById(id);
}

// === Delete ===

export async function deleteLog(id: string): Promise<void> {
  const db = await getDatabase();
  // CASCADE will delete related log_media
  await db.runAsync('DELETE FROM logs WHERE id = ?', id);
}

// ============================================================
// LOG MEDIA CRUD
// ============================================================

export async function createLogMedia(
  input: CreateLogMediaInput
): Promise<LogMedia> {
  const db = await getDatabase();
  const id = generateId();
  const now = nowISO();

  await db.runAsync(
    `INSERT INTO log_media (
      id, log_id, media_type, file_path,
      file_size, duration, thumbnail_path, width, height,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.logId,
    input.mediaType,
    input.filePath,
    input.fileSize ?? null,
    input.duration ?? null,
    input.thumbnailPath ?? null,
    input.width ?? null,
    input.height ?? null,
    now
  );

  const row = await db.getFirstAsync<LogMediaRow>(
    'SELECT * FROM log_media WHERE id = ?',
    id
  );
  return mapLogMediaRow(row!);
}

export async function getMediaByLog(logId: string): Promise<LogMedia[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<LogMediaRow>(
    'SELECT * FROM log_media WHERE log_id = ? ORDER BY created_at ASC',
    logId
  );
  return rows.map(mapLogMediaRow);
}

export async function deleteLogMedia(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM log_media WHERE id = ?', id);
}

// ============================================================
// PAUSE HISTORY CRUD
// ============================================================

export async function createPause(streakId: string): Promise<PauseHistory> {
  const db = await getDatabase();
  const id = generateId();
  const pausedAt = today();
  const now = nowISO();

  await db.runAsync(
    `INSERT INTO pause_history (id, streak_id, paused_at, created_at)
     VALUES (?, ?, ?, ?)`,
    id,
    streakId,
    pausedAt,
    now
  );

  const row = await db.getFirstAsync<PauseHistoryRow>(
    'SELECT * FROM pause_history WHERE id = ?',
    id
  );
  return mapPauseHistoryRow(row!);
}

export async function resumePause(streakId: string): Promise<void> {
  const db = await getDatabase();
  const resumedAt = today();

  await db.runAsync(
    `UPDATE pause_history
     SET resumed_at = ?
     WHERE streak_id = ? AND resumed_at IS NULL`,
    resumedAt,
    streakId
  );
}

export async function getPausesByStreak(
  streakId: string
): Promise<PauseHistory[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<PauseHistoryRow>(
    `SELECT * FROM pause_history
     WHERE streak_id = ?
     ORDER BY paused_at DESC`,
    streakId
  );
  return rows.map(mapPauseHistoryRow);
}

// ============================================================
// REMINDER CRUD
// ============================================================

export async function createReminder(
  input: CreateReminderInput
): Promise<Reminder> {
  const db = await getDatabase();
  const id = generateId();
  const now = nowISO();

  await db.runAsync(
    `INSERT INTO reminders (
      id, streak_id, reminder_time, enabled,
      smart_reminder_enabled, smart_reminder_time,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.streakId,
    input.reminderTime,
    input.enabled !== false ? 1 : 0,
    input.smartReminderEnabled !== false ? 1 : 0,
    input.smartReminderTime ?? '21:00',
    now,
    now
  );

  const row = await db.getFirstAsync<ReminderRow>(
    'SELECT * FROM reminders WHERE id = ?',
    id
  );
  return mapReminderRow(row!);
}

export async function getRemindersByStreak(
  streakId: string
): Promise<Reminder[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ReminderRow>(
    'SELECT * FROM reminders WHERE streak_id = ? ORDER BY reminder_time ASC',
    streakId
  );
  return rows.map(mapReminderRow);
}

export async function getEnabledReminders(): Promise<Reminder[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ReminderRow>(
    `SELECT r.* FROM reminders r
     JOIN streaks s ON r.streak_id = s.id
     WHERE r.enabled = 1 AND s.status = 'active'
     ORDER BY r.reminder_time ASC`
  );
  return rows.map(mapReminderRow);
}

export async function toggleReminder(
  id: string,
  enabled: boolean
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE reminders SET enabled = ?, updated_at = ? WHERE id = ?',
    enabled ? 1 : 0,
    nowISO(),
    id
  );
}

export async function deleteReminder(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM reminders WHERE id = ?', id);
}

// ============================================================
// MILESTONE ACKNOWLEDGEMENT CRUD
// ============================================================

export async function createMilestoneAck(
  streakId: string,
  milestoneDays: number
): Promise<MilestoneAck> {
  const db = await getDatabase();
  const id = generateId();
  const now = nowISO();

  await db.runAsync(
    `INSERT OR IGNORE INTO milestone_acks (id, streak_id, milestone_days, achieved_at, acknowledged)
     VALUES (?, ?, ?, ?, 0)`,
    id,
    streakId,
    milestoneDays,
    now
  );

  const row = await db.getFirstAsync<MilestoneAckRow>(
    'SELECT * FROM milestone_acks WHERE streak_id = ? AND milestone_days = ?',
    streakId,
    milestoneDays
  );
  return mapMilestoneAckRow(row!);
}

export async function acknowledgeMilestone(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE milestone_acks SET acknowledged = 1 WHERE id = ?',
    id
  );
}

export async function getUnacknowledgedMilestones(
  streakId: string
): Promise<MilestoneAck[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<MilestoneAckRow>(
    `SELECT * FROM milestone_acks
     WHERE streak_id = ? AND acknowledged = 0
     ORDER BY milestone_days ASC`,
    streakId
  );
  return rows.map(mapMilestoneAckRow);
}

export async function getMilestonesByStreak(
  streakId: string
): Promise<MilestoneAck[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<MilestoneAckRow>(
    `SELECT * FROM milestone_acks
     WHERE streak_id = ?
     ORDER BY milestone_days ASC`,
    streakId
  );
  return rows.map(mapMilestoneAckRow);
}
