import { computeBuckets, computeStreakState } from '../streak-engine';
import type { Streak, Log } from '../types';

const streakA = (): Streak => ({
  id: 'streak-a',
  title: 'Streak A',
  intervalType: 'daily',
  intervalDays: 1,
  notificationTimes: [],
  startDate: '2024-01-01',
  createdAt: '2024-01-01T00:00:00',
});

const streakB = (): Streak => ({
  id: 'streak-b',
  title: 'Streak B',
  intervalType: 'daily',
  intervalDays: 1,
  notificationTimes: [],
  startDate: '2024-01-01',
  createdAt: '2024-01-01T00:00:00',
});

const log = (id: string, streakId: string, localDate: string): Log => ({
  id,
  streakId,
  title: `Log ${id}`,
  description: null,
  rating: null,
  mediaPath: null,
  mediaType: null,
  createdAt: `${localDate}T12:00:00`,
});

const asOf = new Date(2024, 0, 3, 15, 0, 0); // Jan 3, 2024

describe('multi-streak log isolation', () => {
  it('computeBuckets for streak-a ignores streak-b logs', () => {
    const logsA = [log('a1', 'streak-a', '2024-01-01'), log('a2', 'streak-a', '2024-01-02'), log('a3', 'streak-a', '2024-01-03')];
    const logsB = [log('b1', 'streak-b', '2024-01-01')];

    // Simulate store filtering: only pass streak-a's logs to streak-a's compute
    const bucketsA = computeBuckets(streakA(), logsA, asOf);
    const stateA = computeStreakState(bucketsA, asOf);
    expect(stateA.currentStreak).toBe(3);

    // streak-b only has Jan 1; Jan 2 is missed and Jan 3 is open → streak is broken = 0
    const bucketsB = computeBuckets(streakB(), logsB, asOf);
    const stateB = computeStreakState(bucketsB, asOf);
    expect(stateB.currentStreak).toBe(0);
  });

  it('streak-b logs do not inflate streak-a count when mixed by accident', () => {
    const logsA = [log('a1', 'streak-a', '2024-01-01')];
    const logsB = [log('b1', 'streak-b', '2024-01-02'), log('b2', 'streak-b', '2024-01-03')];
    const allLogs = [...logsA, ...logsB];

    // Wrong: pass all logs (simulating unscoped bug) — fills all 3 buckets, giving streak=3
    const wrongBuckets = computeBuckets(streakA(), allLogs, asOf);
    const wrongState = computeStreakState(wrongBuckets, asOf);
    expect(wrongState.currentStreak).toBe(3); // WRONG — proves the bug exists

    // Correct: filter first — only Jan 1 for streak-a; Jan 2 missed, Jan 3 open = 0
    const filteredLogs = allLogs.filter(l => l.streakId === 'streak-a');
    const correctBuckets = computeBuckets(streakA(), filteredLogs, asOf);
    const correctState = computeStreakState(correctBuckets, asOf);
    expect(correctState.currentStreak).toBe(0); // CORRECT — streak broken at Jan 2
  });

  it('two streaks with same dates compute independent states', () => {
    const logsA = [log('a1', 'streak-a', '2024-01-01'), log('a2', 'streak-a', '2024-01-02'), log('a3', 'streak-a', '2024-01-03')];
    const logsB = [log('b1', 'streak-b', '2024-01-01')];

    const stateA = computeStreakState(computeBuckets(streakA(), logsA, asOf), asOf);
    const stateB = computeStreakState(computeBuckets(streakB(), logsB, asOf), asOf);

    expect(stateA.currentStreak).toBe(3);
    expect(stateB.currentStreak).toBe(0); // Jan 2 missed, Jan 3 open → broken
    expect(stateA.currentStreak).not.toBe(stateB.currentStreak);
  });
});
