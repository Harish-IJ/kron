import type { Streak, Log, IntervalBucket } from './types';
import { toLocalDateString } from './interval';

export interface StreakRun {
  startDate: string;
  endDate: string;
  length: number;
}

export interface HeatmapCell {
  date: string;
  logCount: number;
  avgRating: number | null;
}

export interface AnalyticsResult {
  completionPercent: number;
  consistencyScore: number;
  currentStreak: number;
  longestStreak: number;
  completedBuckets: number;
  totalBuckets: number;
  streakHistory: StreakRun[];
  heatmapData: HeatmapCell[];
  weekdayPattern: number[];
  ratingTrend: Array<{ date: string; rating: number }>;
}

export function computeAnalytics(
  streak: Streak,
  logs: Log[],
  buckets: IntervalBucket[]
): AnalyticsResult {
  const totalBuckets = buckets.length;
  const completedBuckets = buckets.filter(b => b.completed).length;
  const completionPercent = totalBuckets === 0 ? 0 : Math.round((completedBuckets / totalBuckets) * 100);

  const streakHistory: StreakRun[] = [];
  let runStart: string | null = null;
  let runLen = 0;
  let longestStreak = 0;
  let currentStreak = 0;

  for (let i = 0; i < buckets.length; i++) {
    const b = buckets[i];
    if (b.completed) {
      if (runStart === null) runStart = b.startDate;
      runLen++;
      longestStreak = Math.max(longestStreak, runLen);
    } else {
      if (runStart !== null) {
        streakHistory.push({ startDate: runStart, endDate: buckets[i - 1].endDate, length: runLen });
      }
      runStart = null;
      runLen = 0;
    }
  }
  if (runStart !== null) {
    streakHistory.push({ startDate: runStart, endDate: buckets[buckets.length - 1].endDate, length: runLen });
    currentStreak = runLen;
  }

  const cellMap = new Map<string, { count: number; ratingSum: number; ratingCount: number }>();
  for (const log of logs) {
    const d = toLocalDateString(new Date(log.createdAt));
    const existing = cellMap.get(d) ?? { count: 0, ratingSum: 0, ratingCount: 0 };
    existing.count++;
    if (log.rating !== null) { existing.ratingSum += log.rating; existing.ratingCount++; }
    cellMap.set(d, existing);
  }

  const heatmapData: HeatmapCell[] = [];
  if (buckets.length > 0) {
    const start = new Date(buckets[0].startDate + 'T00:00:00');
    const end = new Date(buckets[buckets.length - 1].endDate + 'T00:00:00');
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = toLocalDateString(new Date(d));
      const cell = cellMap.get(dateStr);
      heatmapData.push({
        date: dateStr,
        logCount: cell?.count ?? 0,
        avgRating: cell && cell.ratingCount > 0 ? cell.ratingSum / cell.ratingCount : null,
      });
    }
  }

  const weekdayPattern = [0, 0, 0, 0, 0, 0, 0];
  for (const log of logs) {
    const d = new Date(log.createdAt);
    weekdayPattern[d.getDay()]++;
  }

  const ratingTrend = logs
    .filter(l => l.rating !== null)
    .map(l => ({ date: toLocalDateString(new Date(l.createdAt)), rating: l.rating as number }));

  return {
    completionPercent,
    consistencyScore: completionPercent,
    currentStreak,
    longestStreak,
    completedBuckets,
    totalBuckets,
    streakHistory,
    heatmapData,
    weekdayPattern,
    ratingTrend,
  };
}
