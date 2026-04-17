// ============================================================
// Kron — Analytics & Computed Queries
// Streak calculation, day summaries, and dashboard data
// ============================================================

import { getDatabase } from '../index';
import {
  today,
  addDays,
  diffDays,
  lastNDays,
  isScheduledDay,
  isInPausePeriod,
  mapLogRow,
  mapStreakRow,
  mapPauseHistoryRow,
  mapMilestoneAckRow,
} from '../helpers';
import { getLogsByStreakAndDate, resolveDayStatus } from './logs';
import { getPausesByStreak, getMilestonesByStreak } from './logs';
import { updateStreakCounters } from './streaks';
import type {
  Streak,
  StreakRow,
  Log,
  LogRow,
  PauseHistory,
  PauseHistoryRow,
  DaySummary,
  StreakCard,
  StreakAnalytics,
  LogMediaRow,
} from '../types';

// ============================================================
// STREAK CALCULATION (Phase 2 Business Logic)
// ============================================================

/**
 * Calculates the current streak for a given streak.
 * Uses the LAST LOG WINS rule (Phase 2 locked decision).
 *
 * Algorithm:
 * 1. Walk backwards from today day-by-day
 * 2. Skip paused days, non-scheduled days, future days
 * 3. For each scheduled day: check last log's status
 *    - "achieved" → increment counter
 *    - "not_achieved" or no logs → STOP
 * 4. Return counter
 */
export async function calculateCurrentStreak(
  streak: Streak
): Promise<number> {
  const pauses = await getPausesByStreak(streak.id);
  const todayStr = today();
  let count = 0;
  let checkDate = todayStr;

  // Walk backwards up to 1000 days (safety limit)
  for (let i = 0; i < 1000; i++) {
    // Future check
    if (checkDate > todayStr) {
      checkDate = addDays(checkDate, -1);
      continue;
    }

    // Before streak started
    if (checkDate < streak.startDate) break;

    // Pause check
    if (isInPausePeriod(checkDate, pauses)) {
      checkDate = addDays(checkDate, -1);
      continue;
    }

    // Schedule check
    if (
      !isScheduledDay(
        checkDate,
        streak.scheduleType,
        streak.scheduleConfig,
        streak.startDate
      )
    ) {
      checkDate = addDays(checkDate, -1);
      continue;
    }

    // Check last log's status for this day
    const dayStatus = await resolveDayStatus(streak.id, checkDate);

    if (dayStatus === 'achieved') {
      count++;
    } else {
      // No log or "not_achieved" → streak broken
      break;
    }

    checkDate = addDays(checkDate, -1);
  }

  return count;
}

/**
 * Calculates the longest streak ever achieved.
 * Walks forward from start_date to today, tracking max consecutive.
 */
export async function calculateLongestStreak(
  streak: Streak
): Promise<number> {
  const db = await getDatabase();
  const pauses = await getPausesByStreak(streak.id);
  const todayStr = today();

  // Get all logs for this streak in one query for performance
  const allLogs = await db.getAllAsync<LogRow>(
    `SELECT * FROM logs
     WHERE streak_id = ?
     ORDER BY log_date ASC, log_number ASC`,
    streak.id
  );

  // Group logs by date, keep only the last log per day
  const lastLogByDate = new Map<string, string>();
  for (const log of allLogs) {
    // Since we're ordered by log_number ASC, last write wins
    lastLogByDate.set(log.log_date, log.status);
  }

  let longest = 0;
  let current = 0;
  let checkDate = streak.startDate;

  while (checkDate <= todayStr) {
    if (isInPausePeriod(checkDate, pauses)) {
      checkDate = addDays(checkDate, 1);
      continue;
    }

    if (
      !isScheduledDay(
        checkDate,
        streak.scheduleType,
        streak.scheduleConfig,
        streak.startDate
      )
    ) {
      checkDate = addDays(checkDate, 1);
      continue;
    }

    const dayStatus = lastLogByDate.get(checkDate);

    if (dayStatus === 'achieved') {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }

    checkDate = addDays(checkDate, 1);
  }

  return longest;
}

/**
 * Counts total achieved days for a streak.
 */
export async function calculateTotalAchieved(
  streakId: string
): Promise<number> {
  const db = await getDatabase();

  // Count distinct dates where the last log is "achieved"
  // Using a subquery to get the max log_number per date
  const result = await db.getFirstAsync<{ total: number }>(
    `SELECT COUNT(*) as total FROM (
       SELECT log_date, status
       FROM logs
       WHERE streak_id = ? AND log_number = (
         SELECT MAX(l2.log_number)
         FROM logs l2
         WHERE l2.streak_id = logs.streak_id AND l2.log_date = logs.log_date
       ) AND status = 'achieved'
     )`,
    streakId
  );

  return result?.total ?? 0;
}

/**
 * Full recalculation of streak counters.
 * Call this after any log or pause change.
 */
export async function recalculateStreakCounters(
  streak: Streak
): Promise<{ currentStreak: number; longestStreak: number; totalAchieved: number }> {
  const currentStreak = await calculateCurrentStreak(streak);
  const longestStreak = await calculateLongestStreak(streak);
  const totalAchieved = await calculateTotalAchieved(streak.id);

  // Persist to cached columns
  await updateStreakCounters(
    streak.id,
    currentStreak,
    longestStreak,
    totalAchieved
  );

  return { currentStreak, longestStreak, totalAchieved };
}

// ============================================================
// DAY SUMMARY (for dashboard and calendar views)
// ============================================================

/**
 * Resolves the display status for a specific day of a specific streak.
 */
export async function getDaySummary(
  streak: Streak,
  dateStr: string
): Promise<DaySummary> {
  const db = await getDatabase();
  const todayStr = today();

  // Future
  if (dateStr > todayStr) {
    return {
      date: dateStr,
      streakId: streak.id,
      dayStatus: 'future',
      logCount: 0,
      hasMedia: false,
      thumbnailPath: null,
    };
  }

  // Not scheduled
  if (
    !isScheduledDay(
      dateStr,
      streak.scheduleType,
      streak.scheduleConfig,
      streak.startDate
    )
  ) {
    return {
      date: dateStr,
      streakId: streak.id,
      dayStatus: 'not_scheduled',
      logCount: 0,
      hasMedia: false,
      thumbnailPath: null,
    };
  }

  // Paused
  const pauses = await getPausesByStreak(streak.id);
  if (isInPausePeriod(dateStr, pauses)) {
    return {
      date: dateStr,
      streakId: streak.id,
      dayStatus: 'paused',
      logCount: 0,
      hasMedia: false,
      thumbnailPath: null,
    };
  }

  // Get logs for this day
  const logs = await getLogsByStreakAndDate(streak.id, dateStr);

  if (logs.length === 0) {
    return {
      date: dateStr,
      streakId: streak.id,
      dayStatus: dateStr === todayStr ? 'pending' : 'missed',
      logCount: 0,
      hasMedia: false,
      thumbnailPath: null,
    };
  }

  // Last log wins
  const lastLog = logs[logs.length - 1];
  const dayStatus = lastLog.status as 'achieved' | 'not_achieved';

  // Check for media on any log for this day
  const mediaResult = await db.getFirstAsync<{
    has_media: number;
    thumb: string | null;
  }>(
    `SELECT
       COUNT(lm.id) > 0 as has_media,
       MIN(lm.thumbnail_path) as thumb
     FROM log_media lm
     JOIN logs l ON lm.log_id = l.id
     WHERE l.streak_id = ? AND l.log_date = ?`,
    streak.id,
    dateStr
  );

  return {
    date: dateStr,
    streakId: streak.id,
    dayStatus,
    logCount: logs.length,
    hasMedia: (mediaResult?.has_media ?? 0) > 0,
    thumbnailPath: mediaResult?.thumb ?? null,
  };
}

/**
 * Gets day summaries for a range of dates for a streak.
 * Used for week dot view and calendar heatmap.
 */
export async function getDaySummariesForRange(
  streak: Streak,
  startDate: string,
  endDate: string
): Promise<DaySummary[]> {
  const summaries: DaySummary[] = [];
  let checkDate = startDate;

  while (checkDate <= endDate) {
    const summary = await getDaySummary(streak, checkDate);
    summaries.push(summary);
    checkDate = addDays(checkDate, 1);
  }

  return summaries;
}

// ============================================================
// DASHBOARD CARD DATA
// ============================================================

/**
 * Builds the StreakCard data for a single streak (used on dashboard).
 */
export async function buildStreakCard(streak: Streak): Promise<StreakCard> {
  const todayStr = today();
  const weekStart = addDays(todayStr, -6);

  const todayStatus = await getDaySummary(streak, todayStr);
  const weekSummary = await getDaySummariesForRange(
    streak,
    weekStart,
    todayStr
  );

  // Count today's logs
  const todayLogs = await getLogsByStreakAndDate(streak.id, todayStr);

  // Pending if today is scheduled + not paused + no "achieved" log yet
  const pendingToday =
    todayStatus.dayStatus === 'pending' ||
    (todayStatus.dayStatus === 'not_achieved' && todayLogs.length < 3);

  return {
    streak,
    todayStatus,
    weekSummary,
    pendingToday,
    logsToday: todayLogs.length,
  };
}

/**
 * Builds StreakCard data for all active streaks.
 */
export async function buildDashboardCards(): Promise<StreakCard[]> {
  const db = await getDatabase();
  // Sort by most recently active (last log date), fallback to created_at
  const rows = await db.getAllAsync<StreakRow>(
    `SELECT s.*,
       (SELECT MAX(l.log_date) FROM logs l WHERE l.streak_id = s.id) as last_log_date
     FROM streaks s
     WHERE s.status = 'active'
     ORDER BY COALESCE(last_log_date, s.created_at) DESC`
  );
  const streaks = rows.map(mapStreakRow);

  const cards: StreakCard[] = [];
  for (const streak of streaks) {
    cards.push(await buildStreakCard(streak));
  }
  return cards;
}

// ============================================================
// STREAK ANALYTICS DETAIL
// ============================================================

/**
 * Computes full analytics for a streak (used on detail/analytics screen).
 */
export async function getStreakAnalytics(
  streak: Streak
): Promise<StreakAnalytics> {
  const db = await getDatabase();
  const todayStr = today();
  const pauses = await getPausesByStreak(streak.id);
  const milestones = await getMilestonesByStreak(streak.id);

  // Get all distinct dates where the streak was scheduled and not paused
  let totalScheduledDays = 0;
  let totalNotAchieved = 0;
  let totalMissed = 0;
  let checkDate = streak.startDate;

  // Get all logs in one batch for performance
  const allLogs = await db.getAllAsync<LogRow>(
    `SELECT * FROM logs
     WHERE streak_id = ?
     ORDER BY log_date ASC, log_number ASC`,
    streak.id
  );

  const lastLogByDate = new Map<string, string>();
  for (const log of allLogs) {
    lastLogByDate.set(log.log_date, log.status);
  }

  while (checkDate <= todayStr) {
    if (isInPausePeriod(checkDate, pauses)) {
      checkDate = addDays(checkDate, 1);
      continue;
    }

    if (
      !isScheduledDay(
        checkDate,
        streak.scheduleType,
        streak.scheduleConfig,
        streak.startDate
      )
    ) {
      checkDate = addDays(checkDate, 1);
      continue;
    }

    totalScheduledDays++;

    const dayStatus = lastLogByDate.get(checkDate);
    if (dayStatus === 'not_achieved') {
      totalNotAchieved++;
    } else if (dayStatus !== 'achieved') {
      totalMissed++;
    }

    checkDate = addDays(checkDate, 1);
  }

  const totalAchieved = streak.totalAchieved;
  const completionRate =
    totalScheduledDays > 0
      ? Math.round((totalAchieved / totalScheduledDays) * 100)
      : 0;
  const activeSinceDays = diffDays(streak.startDate, todayStr);

  return {
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    totalAchieved,
    totalNotAchieved,
    totalMissed,
    completionRate,
    activeSinceDays,
    milestones,
  };
}

// ============================================================
// MILESTONE CHECKING
// ============================================================

const MILESTONE_THRESHOLDS = [7, 30, 100, 365] as const;

/**
 * Check if a streak has reached any new milestones after a log.
 * Creates milestone_ack records for newly reached milestones.
 */
export async function checkAndCreateMilestones(
  streak: Streak,
  currentStreak: number
): Promise<void> {
  const db = await getDatabase();

  for (const threshold of MILESTONE_THRESHOLDS) {
    if (currentStreak >= threshold) {
      // Check if already recorded
      const existing = await db.getFirstAsync<{ id: string }>(
        `SELECT id FROM milestone_acks
         WHERE streak_id = ? AND milestone_days = ?`,
        streak.id,
        threshold
      );

      if (!existing) {
        const { createMilestoneAck } = await import('./logs');
        await createMilestoneAck(streak.id, threshold);
      }
    }
  }
}

// ============================================================
// APP SETTINGS
// ============================================================

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_settings WHERE key = ?',
    key
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)`,
    key,
    value
  );
}
