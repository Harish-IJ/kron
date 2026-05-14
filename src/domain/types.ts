export type IntervalType = 'daily' | 'every_n_days' | 'weekly' | 'weekly_on_days' | 'monthly_on_dates';

export interface Streak {
  id: string;                        // UUID v4 — no longer the literal 'singleton'
  title: string;
  intervalType: IntervalType;
  intervalDays: number;
  intervalWeekdays?: number[];       // 0=Mon..6=Sun; only for weekly_on_days
  intervalMonthDates?: number[];     // 1-31; only for monthly_on_dates
  notificationTimes: string[];
  startDate: string;
  createdAt: string;
}

export interface Log {
  id: string;
  streakId: string;                  // FK → streak.id — every log belongs to exactly one streak
  title: string;
  description: string | null;
  rating: 1 | 2 | 3 | 4 | 5 | null;
  mediaPath: string | null;
  mediaType: 'image' | null;
  createdAt: string;
}

export interface IntervalBucket {
  index: number;
  startDate: string;
  endDate: string;
  completed: boolean;
  logCount: number;
}

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  currentBucket: IntervalBucket;
  isCurrentBucketSatisfied: boolean;
  currentBucketStart: string;
  currentBucketEnd: string;
  nextDeadline: Date;
  totalBuckets: number;
  completedBuckets: number;
}

export interface StreakFormData {
  title: string;
  intervalType: IntervalType;
  intervalDays: number;
  intervalWeekdays?: number[];
  intervalMonthDates?: number[];
  notificationTimes: string[];
}

// InsertLogInput: used by the repository — includes streakId so every log is linked at INSERT
export type InsertLogInput = Pick<Log, 'streakId' | 'title' | 'description' | 'rating' | 'mediaPath' | 'mediaType'>;

// CreateLogInput: used by UI and store.create() — streakId is passed separately as a store arg
export type CreateLogInput = Omit<InsertLogInput, 'streakId'>;

export type LogPatch = Partial<Pick<Log, 'title' | 'description' | 'rating' | 'mediaPath' | 'mediaType'>>;
