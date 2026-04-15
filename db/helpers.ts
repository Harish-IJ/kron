// ============================================================
// Kron — Database Helpers
// Row mapping, date utilities, UUID generation
// ============================================================

import * as Crypto from 'expo-crypto';
import type {
  Streak,
  StreakRow,
  Log,
  LogRow,
  LogMedia,
  LogMediaRow,
  PauseHistory,
  PauseHistoryRow,
  Reminder,
  ReminderRow,
  MilestoneAck,
  MilestoneAckRow,
  ScheduleConfig,
} from './types';

// === UUID Generation ===

export function generateId(): string {
  return Crypto.randomUUID();
}

// === Date Utilities ===

/** Returns today's date as YYYY-MM-DD in local timezone */
export function today(): string {
  return formatDate(new Date());
}

/** Formats a Date object as YYYY-MM-DD */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Parses YYYY-MM-DD string into a Date object (local timezone) */
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Returns ISO datetime string for now */
export function nowISO(): string {
  return new Date().toISOString();
}

/** Adds days to a date string, returns new YYYY-MM-DD */
export function addDays(dateStr: string, days: number): string {
  const date = parseDate(dateStr);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

/** Returns the day of week (0=Sun, 1=Mon, ..., 6=Sat) for a date string */
export function dayOfWeek(dateStr: string): number {
  return parseDate(dateStr).getDay();
}

/** Difference in days between two YYYY-MM-DD strings (end - start) */
export function diffDays(startStr: string, endStr: string): number {
  const start = parseDate(startStr);
  const end = parseDate(endStr);
  const diffMs = end.getTime() - start.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/** Returns an array of YYYY-MM-DD strings for the last N days (inclusive of today) */
export function lastNDays(n: number, fromDate?: string): string[] {
  const base = fromDate ?? today();
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    days.push(addDays(base, -i));
  }
  return days;
}

// === Schedule Checking ===

/** Check if a given date is a scheduled day for a streak */
export function isScheduledDay(
  dateStr: string,
  scheduleType: string,
  scheduleConfig: ScheduleConfig,
  startDate: string
): boolean {
  switch (scheduleType) {
    case 'daily':
      return true;

    case 'weekdays': {
      if (!scheduleConfig || !('weekdays' in scheduleConfig)) return true;
      const dow = dayOfWeek(dateStr);
      return scheduleConfig.weekdays.includes(dow);
    }

    case 'interval': {
      if (!scheduleConfig || !('interval' in scheduleConfig)) return true;
      const daysSinceStart = diffDays(startDate, dateStr);
      if (daysSinceStart < 0) return false;
      return daysSinceStart % scheduleConfig.interval === 0;
    }

    default:
      return true;
  }
}

/** Check if a date falls within any pause period */
export function isInPausePeriod(
  dateStr: string,
  pauses: PauseHistory[]
): boolean {
  for (const pause of pauses) {
    const pauseStart = pause.pausedAt;
    const pauseEnd = pause.resumedAt ?? '9999-12-31'; // still paused
    if (dateStr >= pauseStart && dateStr <= pauseEnd) {
      return true;
    }
  }
  return false;
}

// === Row Mapping: SQLite Row → TypeScript Entity ===

export function mapStreakRow(row: StreakRow): Streak {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    emoji: row.emoji,
    color: row.color,
    scheduleType: row.schedule_type as Streak['scheduleType'],
    scheduleConfig: row.schedule_config
      ? (JSON.parse(row.schedule_config) as ScheduleConfig)
      : null,
    proofType: row.proof_type as Streak['proofType'],
    visualizationType: row.visualization_type as Streak['visualizationType'],
    targetDays: row.target_days,
    status: row.status as Streak['status'],
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    totalAchieved: row.total_achieved,
    startDate: row.start_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapLogRow(row: LogRow): Log {
  return {
    id: row.id,
    streakId: row.streak_id,
    logDate: row.log_date,
    logNumber: row.log_number as Log['logNumber'],
    status: row.status as Log['status'],
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapLogMediaRow(row: LogMediaRow): LogMedia {
  return {
    id: row.id,
    logId: row.log_id,
    mediaType: row.media_type as LogMedia['mediaType'],
    filePath: row.file_path,
    fileSize: row.file_size,
    duration: row.duration,
    thumbnailPath: row.thumbnail_path,
    width: row.width,
    height: row.height,
    createdAt: row.created_at,
  };
}

export function mapPauseHistoryRow(row: PauseHistoryRow): PauseHistory {
  return {
    id: row.id,
    streakId: row.streak_id,
    pausedAt: row.paused_at,
    resumedAt: row.resumed_at,
    createdAt: row.created_at,
  };
}

export function mapReminderRow(row: ReminderRow): Reminder {
  return {
    id: row.id,
    streakId: row.streak_id,
    reminderTime: row.reminder_time,
    enabled: row.enabled === 1,
    smartReminderEnabled: row.smart_reminder_enabled === 1,
    smartReminderTime: row.smart_reminder_time,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapMilestoneAckRow(row: MilestoneAckRow): MilestoneAck {
  return {
    id: row.id,
    streakId: row.streak_id,
    milestoneDays: row.milestone_days as MilestoneAck['milestoneDays'],
    achievedAt: row.achieved_at,
    acknowledged: row.acknowledged === 1,
  };
}
