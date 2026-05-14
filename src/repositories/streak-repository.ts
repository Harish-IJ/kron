import * as Crypto from 'expo-crypto';
import { getDb } from '../db/client';
import type { StreakRow } from '../db/types';
import type { Streak, IntervalType, StreakFormData } from '../domain/types';
import { toLocalDateString } from '../domain/interval';

function safeJsonParse<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

function rowToStreak(row: StreakRow): Streak {
  return {
    id: row.id,
    title: row.title,
    intervalType: row.interval_type as IntervalType,
    intervalDays: row.interval_days,
    intervalWeekdays: safeJsonParse<number[]>(row.interval_weekdays, []),
    intervalMonthDates: safeJsonParse<number[]>(row.interval_month_dates, []),
    notificationTimes: safeJsonParse<string[]>(row.notification_times, []),
    startDate: row.start_date,
    createdAt: row.created_at,
  };
}

export async function getAllStreaks(): Promise<Streak[]> {
  const db = getDb();
  const rows = await db.getAllAsync<StreakRow>('SELECT * FROM streak ORDER BY created_at ASC');
  return rows.map(rowToStreak);
}

export async function getStreakById(id: string): Promise<Streak | null> {
  const db = getDb();
  const row = await db.getFirstAsync<StreakRow>('SELECT * FROM streak WHERE id = ?', [id]);
  return row ? rowToStreak(row) : null;
}

export async function insertStreak(data: StreakFormData): Promise<Streak> {
  const db = getDb();
  const countRow = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM streak');
  if ((countRow?.count ?? 0) >= 10) throw new Error('Maximum of 10 streaks reached');

  const id = Crypto.randomUUID();
  const now = new Date().toISOString();
  const startDate = toLocalDateString(new Date());
  const weekdaysJson = data.intervalWeekdays?.length ? JSON.stringify(data.intervalWeekdays) : null;
  const monthDatesJson = data.intervalMonthDates?.length ? JSON.stringify(data.intervalMonthDates) : null;

  await db.runAsync(
    `INSERT INTO streak (id, title, interval_type, interval_days, interval_weekdays, interval_month_dates, notification_times, start_date, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.title, data.intervalType, data.intervalDays, weekdaysJson, monthDatesJson, JSON.stringify(data.notificationTimes), startDate, now]
  );

  return {
    id,
    title: data.title,
    intervalType: data.intervalType,
    intervalDays: data.intervalDays,
    intervalWeekdays: data.intervalWeekdays ?? [],
    intervalMonthDates: data.intervalMonthDates ?? [],
    notificationTimes: data.notificationTimes,
    startDate,
    createdAt: now,
  };
}

export async function updateStreak(
  id: string,
  patch: Pick<StreakFormData, 'title' | 'notificationTimes'>
): Promise<Streak> {
  const db = getDb();
  await db.runAsync(
    'UPDATE streak SET title = ?, notification_times = ? WHERE id = ?',
    [patch.title, JSON.stringify(patch.notificationTimes), id]
  );
  const updated = await getStreakById(id);
  if (!updated) throw new Error(`Streak ${id} not found`);
  return updated;
}

export async function deleteStreak(id: string): Promise<void> {
  const db = getDb();
  await db.runAsync('DELETE FROM streak WHERE id = ?', [id]);
}

export async function updateIntervalIfNoLogs(
  id: string,
  intervalType: IntervalType,
  intervalDays: number,
  intervalWeekdays: number[],
  intervalMonthDates: number[]
): Promise<Streak> {
  const db = getDb();
  const logCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM logs WHERE streak_id = ?',
    [id]
  );
  if ((logCount?.count ?? 0) > 0) {
    throw new Error('Interval cannot be changed after first log');
  }
  const weekdaysJson = intervalWeekdays.length ? JSON.stringify(intervalWeekdays) : null;
  const monthDatesJson = intervalMonthDates.length ? JSON.stringify(intervalMonthDates) : null;
  await db.runAsync(
    'UPDATE streak SET interval_type = ?, interval_days = ?, interval_weekdays = ?, interval_month_dates = ? WHERE id = ?',
    [intervalType, intervalDays, weekdaysJson, monthDatesJson, id]
  );
  const updated = await getStreakById(id);
  if (!updated) throw new Error(`Streak ${id} not found`);
  return updated;
}
