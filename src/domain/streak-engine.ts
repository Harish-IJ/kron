import type { Streak, Log, IntervalBucket, StreakState } from './types';
import {
  getBucketIndex,
  getBucketBounds,
  getCurrentBucketIndex,
  toLocalDateString,
} from './interval';

export function computeBuckets(
  streak: Streak,
  logs: Log[],
  asOf: Date
): IntervalBucket[] {
  const currentIdx = getCurrentBucketIndex(streak.startDate, streak.intervalDays, asOf);

  const bucketLogCounts = new Map<number, number>();
  for (const log of logs) {
    const logLocalDate = toLocalDateString(new Date(log.createdAt));
    const idx = getBucketIndex(streak.startDate, logLocalDate, streak.intervalDays);
    if (idx >= 0 && idx <= currentIdx) {
      bucketLogCounts.set(idx, (bucketLogCounts.get(idx) ?? 0) + 1);
    }
  }

  const buckets: IntervalBucket[] = [];
  for (let i = 0; i <= currentIdx; i++) {
    const { start, end } = getBucketBounds(streak.startDate, i, streak.intervalDays);
    const logCount = bucketLogCounts.get(i) ?? 0;
    buckets.push({ index: i, startDate: start, endDate: end, completed: logCount > 0, logCount });
  }
  return buckets;
}

export function computeStreakState(buckets: IntervalBucket[], asOf: Date): StreakState {
  const current = buckets[buckets.length - 1];

  const scanFrom = current.completed ? buckets.length - 1 : buckets.length - 2;
  let currentStreak = 0;
  for (let i = scanFrom; i >= 0; i--) {
    if (buckets[i].completed) currentStreak++;
    else break;
  }

  let longestStreak = 0;
  let run = 0;
  for (const b of buckets) {
    if (b.completed) { run++; longestStreak = Math.max(longestStreak, run); }
    else run = 0;
  }

  const completedBuckets = buckets.filter(b => b.completed).length;

  const [ey, em, ed] = current.endDate.split('-').map(Number);
  const nextDeadline = new Date(ey, em - 1, ed, 23, 59, 59);

  return {
    currentStreak,
    longestStreak,
    currentBucket: current,
    isCurrentBucketSatisfied: current.completed,
    currentBucketStart: current.startDate,
    currentBucketEnd: current.endDate,
    nextDeadline,
    totalBuckets: buckets.length,
    completedBuckets,
  };
}
