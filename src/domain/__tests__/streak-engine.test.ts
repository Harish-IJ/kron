import { computeBuckets, computeStreakState } from '../streak-engine';
import type { Streak, Log } from '../types';

const streak = (overrides?: Partial<Streak>): Streak => ({
  id: 'singleton',
  title: 'Test',
  intervalType: 'daily',
  intervalDays: 1,
  notificationTimes: [],
  startDate: '2024-01-01',
  createdAt: '2024-01-01T00:00:00',
  ...overrides,
});

const log = (id: string, localDate: string): Log => ({
  id,
  title: `Log ${id}`,
  description: null,
  rating: null,
  mediaPath: null,
  mediaType: null,
  createdAt: `${localDate}T12:00:00`,
});

describe('AC-1: daily streak with consecutive logs', () => {
  it('counts 3 for logs on Jan 1, 2, 3', () => {
    const s = streak();
    const logs = [log('1', '2024-01-01'), log('2', '2024-01-02'), log('3', '2024-01-03')];
    const asOf = new Date(2024, 0, 3, 15, 0, 0);
    const buckets = computeBuckets(s, logs, asOf);
    const state = computeStreakState(buckets, asOf);
    expect(state.currentStreak).toBe(3);
    expect(state.isCurrentBucketSatisfied).toBe(true);
  });
});

describe('AC-2: daily streak with gap', () => {
  it('resets to 1 after missing Jan 2', () => {
    const s = streak();
    const logs = [log('1', '2024-01-01'), log('3', '2024-01-03')];
    const asOf = new Date(2024, 0, 3, 15, 0, 0);
    const buckets = computeBuckets(s, logs, asOf);
    const state = computeStreakState(buckets, asOf);
    expect(state.currentStreak).toBe(1);
  });
});

describe('AC-3: every-2-days streak', () => {
  it('counts 3 for logs on Jan 1, 3, 5', () => {
    const s = streak({ intervalType: 'every_n_days', intervalDays: 2 });
    const logs = [log('1', '2024-01-01'), log('2', '2024-01-03'), log('3', '2024-01-05')];
    const asOf = new Date(2024, 0, 5, 15, 0, 0);
    const buckets = computeBuckets(s, logs, asOf);
    const state = computeStreakState(buckets, asOf);
    expect(state.currentStreak).toBe(3);
  });
});

describe('AC-4: every-2-days streak with 5-day gap', () => {
  it('resets to 1 on Jan 6 after gap from Jan 1', () => {
    const s = streak({ intervalType: 'every_n_days', intervalDays: 2 });
    const logs = [log('1', '2024-01-01'), log('2', '2024-01-06')];
    const asOf = new Date(2024, 0, 6, 15, 0, 0);
    const buckets = computeBuckets(s, logs, asOf);
    const state = computeStreakState(buckets, asOf);
    expect(state.currentStreak).toBe(1);
  });
});

describe('AC-5: delete mid-streak log recomputes correctly', () => {
  it('deleting Jan 2 from Jan 1-5 daily gives streak 3 (Jan 3-5)', () => {
    const s = streak();
    const logs = [
      log('1', '2024-01-01'),
      log('3', '2024-01-03'),
      log('4', '2024-01-04'),
      log('5', '2024-01-05'),
    ];
    const asOf = new Date(2024, 0, 5, 15, 0, 0);
    const buckets = computeBuckets(s, logs, asOf);
    const state = computeStreakState(buckets, asOf);
    expect(state.currentStreak).toBe(3);
  });
});

describe('currentBucket not yet satisfied', () => {
  it('streak counts up to last completed bucket, not current open bucket', () => {
    const s = streak();
    const logs = [log('1', '2024-01-01'), log('2', '2024-01-02')];
    const asOf = new Date(2024, 0, 3, 9, 0, 0);
    const buckets = computeBuckets(s, logs, asOf);
    const state = computeStreakState(buckets, asOf);
    expect(state.currentStreak).toBe(2);
    expect(state.isCurrentBucketSatisfied).toBe(false);
  });
});

describe('longestStreak', () => {
  it('tracks across multiple runs', () => {
    const s = streak();
    const logs = [
      log('1', '2024-01-01'),
      log('2', '2024-01-02'),
      log('3', '2024-01-02'),
      // gap on Jan 3
      log('4', '2024-01-04'),
      log('5', '2024-01-05'),
      log('6', '2024-01-06'),
    ];
    const asOf = new Date(2024, 0, 6, 15, 0, 0);
    const buckets = computeBuckets(s, logs, asOf);
    const state = computeStreakState(buckets, asOf);
    expect(state.longestStreak).toBe(3);
    expect(state.currentStreak).toBe(3);
  });
});
