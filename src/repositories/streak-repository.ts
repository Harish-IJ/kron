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
    id: 'singleton',
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

export async function getStreak(): Promise<Streak | null> {
  const db = getDb();
  const row = await db.getFirstAsync<StreakRow>("SELECT * FROM streak WHERE id = 'singleton'");
  return row ? rowToStreak(row) : null;
}

export async function upsertStreak(data: StreakFormData): Promise<Streak> {
  const db = getDb();
  const existing = await getStreak();
  const now = new Date().toISOString();
  const startDate = existing?.startDate ?? toLocalDateString(new Date());

  const weekdaysJson = data.intervalWeekdays?.length ? JSON.stringify(data.intervalWeekdays) : null;
  const monthDatesJson = data.intervalMonthDates?.length ? JSON.stringify(data.intervalMonthDates) : null;

  await db.runAsync(
    `INSERT INTO streak (id, title, interval_type, interval_days, interval_weekdays, interval_month_dates, notification_times, start_date, created_at)
     VALUES ('singleton', ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       -- Interval fields are immutable after first insert; only title and notification_times can change.
       title = excluded.title,
       notification_times = excluded.notification_times,
       created_at = created_at`,
    [data.title, data.intervalType, data.intervalDays, weekdaysJson, monthDatesJson, JSON.stringify(data.notificationTimes), startDate, now]
  );

  return {
    id: 'singleton',
    title: data.title,
    intervalType: data.intervalType,
    intervalDays: data.intervalDays,
    intervalWeekdays: data.intervalWeekdays ?? [],
    intervalMonthDates: data.intervalMonthDates ?? [],
    notificationTimes: data.notificationTimes,
    startDate,
    createdAt: existing?.createdAt ?? now,
  };
}

export async function updateIntervalIfNoLogs(
  intervalType: IntervalType,
  intervalDays: number
): Promise<Streak> {
  const db = getDb();
  const logCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM logs');
  if ((logCount?.count ?? 0) > 0) {
    throw new Error('Interval cannot be changed after first log');
  }
  const existing = await getStreak();
  if (!existing) throw new Error('No streak configured');
  await db.runAsync(
    "UPDATE streak SET interval_type = ?, interval_days = ? WHERE id = 'singleton'",
    [intervalType, intervalDays]
  );
  return { ...existing, intervalType, intervalDays };
}

export async function clearAllData(): Promise<void> {
  const db = getDb();
  await db.runAsync('DELETE FROM logs');
  await db.runAsync("DELETE FROM streak WHERE id = 'singleton'");
}
