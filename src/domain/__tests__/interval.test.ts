import {
  toLocalDateString,
  parseLocalDate,
  daysBetween,
  getBucketIndex,
  getBucketBounds,
  getCurrentBucketIndex,
} from '../interval';

describe('toLocalDateString', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(toLocalDateString(new Date(2024, 0, 5))).toBe('2024-01-05');
    expect(toLocalDateString(new Date(2024, 11, 31))).toBe('2024-12-31');
  });
});

describe('daysBetween', () => {
  it('returns 0 for same day', () => {
    expect(daysBetween('2024-01-01', '2024-01-01')).toBe(0);
  });
  it('returns 1 for consecutive days', () => {
    expect(daysBetween('2024-01-01', '2024-01-02')).toBe(1);
  });
  it('returns negative for earlier date', () => {
    expect(daysBetween('2024-01-05', '2024-01-01')).toBe(-4);
  });
});

describe('getBucketIndex', () => {
  it('returns 0 for a log on the start date', () => {
    expect(getBucketIndex('2024-01-01', '2024-01-01', 1)).toBe(0);
  });
  it('returns -1 for a log before the start date', () => {
    expect(getBucketIndex('2024-01-01', '2023-12-31', 1)).toBe(-1);
  });
  it('daily: each day is its own bucket', () => {
    expect(getBucketIndex('2024-01-01', '2024-01-03', 1)).toBe(2);
  });
  it('every-2-days: Jan 1+2 → bucket 0, Jan 3+4 → bucket 1', () => {
    expect(getBucketIndex('2024-01-01', '2024-01-01', 2)).toBe(0);
    expect(getBucketIndex('2024-01-01', '2024-01-02', 2)).toBe(0);
    expect(getBucketIndex('2024-01-01', '2024-01-03', 2)).toBe(1);
    expect(getBucketIndex('2024-01-01', '2024-01-04', 2)).toBe(1);
    expect(getBucketIndex('2024-01-01', '2024-01-05', 2)).toBe(2);
  });
  it('weekly: 7-day buckets', () => {
    expect(getBucketIndex('2024-01-01', '2024-01-07', 7)).toBe(0);
    expect(getBucketIndex('2024-01-01', '2024-01-08', 7)).toBe(1);
  });
});

describe('getBucketBounds', () => {
  it('daily bucket 0 is just startDate', () => {
    const { start, end } = getBucketBounds('2024-01-01', 0, 1);
    expect(start).toBe('2024-01-01');
    expect(end).toBe('2024-01-01');
  });
  it('every-2-days bucket 0 spans Jan 1-2', () => {
    const { start, end } = getBucketBounds('2024-01-01', 0, 2);
    expect(start).toBe('2024-01-01');
    expect(end).toBe('2024-01-02');
  });
  it('weekly bucket 1 starts on Jan 8', () => {
    const { start, end } = getBucketBounds('2024-01-01', 1, 7);
    expect(start).toBe('2024-01-08');
    expect(end).toBe('2024-01-14');
  });
});

describe('getCurrentBucketIndex', () => {
  it('returns 0 when asOf is on startDate', () => {
    expect(getCurrentBucketIndex('2024-01-01', 1, new Date(2024, 0, 1))).toBe(0);
  });
  it('returns 2 for daily on Jan 3 with startDate Jan 1', () => {
    expect(getCurrentBucketIndex('2024-01-01', 1, new Date(2024, 0, 3))).toBe(2);
  });
});
