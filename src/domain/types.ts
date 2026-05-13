export type IntervalType = 'daily' | 'every_n_days' | 'weekly';

export interface Streak {
  id: 'singleton';
  title: string;
  intervalType: IntervalType;
  intervalDays: number;
  notificationTimes: string[];
  startDate: string;
  createdAt: string;
}

export interface Log {
  id: string;
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
  notificationTimes: string[];
}

export type InsertLogInput = Pick<Log, 'title' | 'description' | 'rating' | 'mediaPath' | 'mediaType'>;
export type LogPatch = Partial<Pick<Log, 'title' | 'description' | 'rating' | 'mediaPath' | 'mediaType'>>;
export type CreateLogInput = InsertLogInput;
