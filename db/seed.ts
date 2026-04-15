// ============================================================
// Kron — Development Seed Data
// Creates sample streaks and logs for testing
// ============================================================

import { getDatabase } from './index';
import { generateId, today, addDays, nowISO } from './helpers';
import { createStreak } from './queries/streaks';
import { createLog } from './queries/logs';
import { createReminder } from './queries/logs';
import { recalculateStreakCounters } from './queries/analytics';
import { getStreakById } from './queries/streaks';

/**
 * Seeds the database with sample data for development.
 * Only runs if no streaks exist yet.
 */
export async function seedDevelopmentData(): Promise<void> {
  const db = await getDatabase();

  // Check if data already exists
  const existing = await db.getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM streaks'
  );
  if (existing && existing.cnt > 0) {
    console.log('[Kron Seed] Data already exists, skipping seed.');
    return;
  }

  console.log('[Kron Seed] Seeding development data...');

  const todayStr = today();

  // === Streak 1: Morning Run (daily, media proof) ===
  const morningRun = await createStreak({
    name: 'Morning Run',
    description: 'A silent movement through the waking world. 6:30 AM start.',
    emoji: '🏃',
    color: '#45645E',
    scheduleType: 'daily',
    proofType: 'media',
    visualizationType: 'counter_dots',
    startDate: addDays(todayStr, -20),
  });

  // Create 15 achieved logs (simulating a streak)
  for (let i = 20; i >= 6; i--) {
    await createLog({
      streakId: morningRun.id,
      logDate: addDays(todayStr, -i),
      status: 'achieved',
      note: i === 20 ? 'First run! Harbor loop, feeling great.' : undefined,
    });
  }
  // Gap at day -5 (streak break)
  // Then 4 more recent days
  for (let i = 4; i >= 1; i--) {
    await createLog({
      streakId: morningRun.id,
      logDate: addDays(todayStr, -i),
      status: 'achieved',
      note:
        i === 1
          ? 'Park trail, 3.1 miles in 28 min.'
          : undefined,
    });
  }

  await createReminder({
    streakId: morningRun.id,
    reminderTime: '06:00',
    smartReminderEnabled: true,
    smartReminderTime: '21:00',
  });

  // === Streak 2: Daily Journaling (daily, reflection proof) ===
  const journal = await createStreak({
    name: 'Daily Journaling',
    description: 'Write at least 3 paragraphs of reflection each day.',
    emoji: '✍️',
    color: '#7BA1B0',
    scheduleType: 'daily',
    proofType: 'reflection',
    visualizationType: 'heatmap',
    startDate: addDays(todayStr, -30),
  });

  // Create a solid 12-day current streak
  for (let i = 12; i >= 1; i--) {
    await createLog({
      streakId: journal.id,
      logDate: addDays(todayStr, -i),
      status: 'achieved',
      note:
        i === 1
          ? 'Reflected on the importance of consistency over perfection.'
          : 'Journaling session completed.',
    });
  }

  // Some older entries with mixed results
  for (let i = 30; i >= 13; i--) {
    const isAchieved = i % 3 !== 0; // miss every 3rd day
    await createLog({
      streakId: journal.id,
      logDate: addDays(todayStr, -i),
      status: isAchieved ? 'achieved' : 'not_achieved',
      note: isAchieved ? 'Good session.' : 'Too tired today.',
    });
  }

  await createReminder({
    streakId: journal.id,
    reminderTime: '21:00',
    smartReminderEnabled: true,
    smartReminderTime: '22:00',
  });

  // === Streak 3: Daily Yoga (weekdays only, media proof) ===
  const yoga = await createStreak({
    name: 'Daily Yoga',
    description: '20 minutes of mindful movement, weekdays only.',
    emoji: '🧘',
    color: '#D68C7A',
    scheduleType: 'weekdays',
    scheduleConfig: { weekdays: [1, 2, 3, 4, 5] }, // Mon-Fri
    proofType: 'media',
    visualizationType: 'ring',
    startDate: addDays(todayStr, -14),
  });

  // Log weekday entries
  for (let i = 14; i >= 1; i--) {
    const date = addDays(todayStr, -i);
    const d = new Date(
      parseInt(date.split('-')[0]),
      parseInt(date.split('-')[1]) - 1,
      parseInt(date.split('-')[2])
    );
    const dow = d.getDay();
    if (dow >= 1 && dow <= 5) {
      await createLog({
        streakId: yoga.id,
        logDate: date,
        status: i === 7 ? 'not_achieved' : 'achieved',
        note: i === 7 ? 'Energy was low. Opted for rest.' : undefined,
      });
    }
  }

  await createReminder({
    streakId: yoga.id,
    reminderTime: '07:00',
    smartReminderEnabled: false,
  });

  // === Streak 4: Hydration (daily, reflection, with multi-log day) ===
  const hydration = await createStreak({
    name: 'Hydration Goal',
    description: 'Drink at least 2.5L of water daily.',
    emoji: '💧',
    color: '#3F6472',
    scheduleType: 'daily',
    proofType: 'reflection',
    visualizationType: 'counter_dots',
    targetDays: 60,
    startDate: addDays(todayStr, -10),
  });

  // 10 days of hydration, one day with multiple logs
  for (let i = 10; i >= 1; i--) {
    await createLog({
      streakId: hydration.id,
      logDate: addDays(todayStr, -i),
      status: 'achieved',
      note: `${(2.2 + Math.random() * 0.8).toFixed(1)}L completed`,
    });

    // Multi-log day: day -3 has a second log (not_achieved then achieved → last wins)
    if (i === 3) {
      await createLog({
        streakId: hydration.id,
        logDate: addDays(todayStr, -i),
        status: 'not_achieved',
        note: 'Only 1.5L by noon, catching up...',
      });
      await createLog({
        streakId: hydration.id,
        logDate: addDays(todayStr, -i),
        status: 'achieved',
        note: 'Made it to 2.8L by end of day!',
      });
    }
  }

  // === Recalculate all counters ===
  const allStreakIds = [morningRun.id, journal.id, yoga.id, hydration.id];
  for (const sid of allStreakIds) {
    const s = await getStreakById(sid);
    if (s) {
      await recalculateStreakCounters(s);
    }
  }

  console.log('[Kron Seed] Development data seeded successfully!');
  console.log(`[Kron Seed]   - Morning Run: ${morningRun.id}`);
  console.log(`[Kron Seed]   - Daily Journaling: ${journal.id}`);
  console.log(`[Kron Seed]   - Daily Yoga: ${yoga.id}`);
  console.log(`[Kron Seed]   - Hydration Goal: ${hydration.id}`);
}
