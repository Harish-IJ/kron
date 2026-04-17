// ============================================================
// Kron — Streak Service Layer
// ALL mutations + recalculation live here. ONLY here.
// ============================================================

import {
  createStreak as dbCreateStreak,
  getStreakById,
  updateStreak as dbUpdateStreak,
  deleteStreak as dbDeleteStreak,
} from '@/db/queries/streaks';
import {
  createLog as dbCreateLog,
  deleteLog as dbDeleteLog,
  createPause,
  resumePause,
  createReminder as dbCreateReminder,
} from '@/db/queries/logs';
import {
  recalculateStreakCounters,
  checkAndCreateMilestones,
  buildDashboardCards,
  buildStreakCard,
  getStreakAnalytics as dbGetStreakAnalytics,
} from '@/db/queries/analytics';
import type {
  Streak,
  Log,
  StreakCard,
  StreakAnalytics,
  CreateStreakInput,
  UpdateStreakInput,
  CreateLogInput,
  CreateReminderInput,
} from '@/db/types';

// ============================================================
// STREAK MUTATIONS
// ============================================================

/**
 * Creates a new streak and returns its card data.
 */
export async function createStreak(
  input: CreateStreakInput
): Promise<Streak> {
  const streak = await dbCreateStreak(input);
  return streak;
}

/**
 * Updates a streak's editable fields.
 */
export async function updateStreak(
  id: string,
  input: UpdateStreakInput
): Promise<Streak | null> {
  const updated = await dbUpdateStreak(id, input);
  return updated;
}

/**
 * Deletes a streak and all related data (cascade).
 */
export async function deleteStreak(id: string): Promise<void> {
  await dbDeleteStreak(id);
}

// ============================================================
// LOG MUTATIONS (recalculation happens here)
// ============================================================

/**
 * Creates a log entry, recalculates streak counters, checks milestones.
 * This is DB-first: write → recalc → return.
 */
export async function createLog(input: CreateLogInput): Promise<Log> {
  // 1. Insert the log
  const log = await dbCreateLog(input);

  // 2. Recalculate streak counters
  const streak = await getStreakById(input.streakId);
  if (streak) {
    const { currentStreak } = await recalculateStreakCounters(streak);

    // 3. Check for new milestones
    await checkAndCreateMilestones(streak, currentStreak);
  }

  return log;
}

/**
 * Deletes a log and recalculates streak counters.
 */
export async function deleteLog(
  logId: string,
  streakId: string
): Promise<void> {
  await dbDeleteLog(logId);

  const streak = await getStreakById(streakId);
  if (streak) {
    await recalculateStreakCounters(streak);
  }
}

// ============================================================
// STREAK STATUS CHANGES
// ============================================================

/**
 * Pauses a streak: creates pause record + updates status.
 */
export async function pauseStreak(id: string): Promise<Streak | null> {
  await createPause(id);
  return dbUpdateStreak(id, { status: 'paused' });
}

/**
 * Resumes a streak: closes pause record + updates status + recalculates.
 */
export async function resumeStreak(id: string): Promise<Streak | null> {
  await resumePause(id);
  const updated = await dbUpdateStreak(id, { status: 'active' });

  if (updated) {
    await recalculateStreakCounters(updated);
  }

  return updated ? await getStreakById(id) : null;
}

/**
 * Archives a streak (soft delete).
 */
export async function archiveStreak(id: string): Promise<Streak | null> {
  return dbUpdateStreak(id, { status: 'archived' });
}

// ============================================================
// REMINDER
// ============================================================

export async function createReminder(input: CreateReminderInput) {
  return dbCreateReminder(input);
}

// ============================================================
// READ (thin wrappers — service owns the "how to fetch" boundary)
// ============================================================

/**
 * Fetches all dashboard cards (sorted by recently active).
 */
export async function fetchDashboardCards(): Promise<StreakCard[]> {
  return buildDashboardCards();
}

/**
 * Fetches a single streak with full analytics.
 */
export async function fetchStreakDetail(
  id: string
): Promise<{ streak: Streak; card: StreakCard; analytics: StreakAnalytics } | null> {
  const streak = await getStreakById(id);
  if (!streak) return null;

  const card = await buildStreakCard(streak);
  const analytics = await dbGetStreakAnalytics(streak);

  return { streak, card, analytics };
}
