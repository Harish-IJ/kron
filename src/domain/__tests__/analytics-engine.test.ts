import { computeAnalytics } from '../analytics-engine';
import type { Streak, Log, IntervalBucket } from '../types';

const streak = (): Streak => ({
  id: 'singleton',
  title: 'Test',
  intervalType: 'daily',
  intervalDays: 1,
  notificationTimes: [],
  startDate: '2024-01-01',
  createdAt: '2024-01-01T00:00:00',
});

const log = (id: string, date: string, rating?: 1|2|3|4|5): Log => ({
  id,
  title: `Log ${id}`,
  description: null,
  rating: rating ?? null,
  mediaPath: null,
  mediaType: null,
  createdAt: `${date}T12:00:00`,
});

const bucket = (index: number, date: string, completed: boolean): IntervalBucket => ({
  index,
  startDate: date,
  endDate: date,
  completed,
  logCount: completed ? 1 : 0,
});

describe('computeAnalytics', () => {
  it('completionPercent = completedBuckets / totalBuckets * 100', () => {
    const buckets = [
      bucket(0, '2024-01-01', true),
      bucket(1, '2024-01-02', true),
      bucket(2, '2024-01-03', false),
      bucket(3, '2024-01-04', true),
    ];
    const logs = [log('1', '2024-01-01'), log('2', '2024-01-02'), log('4', '2024-01-04')];
    const result = computeAnalytics(streak(), logs, buckets);
    expect(result.completionPercent).toBe(75);
    expect(result.consistencyScore).toBe(75);
  });

  it('weekdayPattern counts by day of week', () => {
    // Jan 1 2024 is a Monday (index 1)
    const buckets = [bucket(0, '2024-01-01', true)];
    const logs = [log('1', '2024-01-01')];
    const result = computeAnalytics(streak(), logs, buckets);
    expect(result.weekdayPattern[1]).toBe(1); // Monday
  });

  it('ratingTrend excludes logs with no rating', () => {
    const buckets = [bucket(0, '2024-01-01', true), bucket(1, '2024-01-02', true)];
    const logs = [log('1', '2024-01-01', 4), log('2', '2024-01-02')];
    const result = computeAnalytics(streak(), logs, buckets);
    expect(result.ratingTrend).toHaveLength(1);
    expect(result.ratingTrend[0].rating).toBe(4);
  });

  it('streakHistory groups consecutive completed buckets into runs', () => {
    const buckets = [
      bucket(0, '2024-01-01', true),
      bucket(1, '2024-01-02', true),
      bucket(2, '2024-01-03', false),
      bucket(3, '2024-01-04', true),
    ];
    const logs = [log('1', '2024-01-01'), log('2', '2024-01-02'), log('4', '2024-01-04')];
    const result = computeAnalytics(streak(), logs, buckets);
    expect(result.streakHistory).toHaveLength(2);
    expect(result.streakHistory[0].length).toBe(2);
    expect(result.streakHistory[1].length).toBe(1);
  });
});
