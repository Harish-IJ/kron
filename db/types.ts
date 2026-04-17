// ============================================================
// Kron — Shared TypeScript Types (Phase 2 Data Model)
// ============================================================

// === Enums ===

export type ScheduleType = 'daily' | 'weekdays' | 'interval';
export type ProofType = 'media' | 'reflection';
export type VisualizationType = 'heatmap' | 'counter_dots' | 'ring';
export type StreakStatus = 'active' | 'paused' | 'archived' | 'completed';
export type LogStatus = 'achieved' | 'not_achieved';
export type MediaType = 'photo' | 'video' | 'audio';

// === Schedule Config ===

export type WeekdaySchedule = {
  weekdays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
};

export type IntervalSchedule = {
  interval: number; // every X days
};

export type ScheduleConfig = WeekdaySchedule | IntervalSchedule | null;

// === Core Entities ===

export interface Streak {
  id: string;
  name: string;
  description: string | null;
  emoji: string | null;
  color: string | null;
  scheduleType: ScheduleType;
  scheduleConfig: ScheduleConfig;
  proofType: ProofType;
  visualizationType: VisualizationType;
  targetDays: number | null;
  status: StreakStatus;
  currentStreak: number;
  longestStreak: number;
  totalAchieved: number;
  startDate: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

export interface Log {
  id: string;
  streakId: string;
  logDate: string; // YYYY-MM-DD
  logNumber: 1 | 2 | 3;
  status: LogStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LogMedia {
  id: string;
  logId: string;
  mediaType: MediaType;
  filePath: string;
  fileSize: number | null;
  duration: number | null; // seconds
  thumbnailPath: string | null;
  width: number | null;
  height: number | null;
  createdAt: string;
}

export interface PauseHistory {
  id: string;
  streakId: string;
  pausedAt: string; // YYYY-MM-DD
  resumedAt: string | null;
  createdAt: string;
}

export interface Reminder {
  id: string;
  streakId: string;
  reminderTime: string; // HH:mm
  enabled: boolean;
  smartReminderEnabled: boolean;
  smartReminderTime: string; // HH:mm
  createdAt: string;
  updatedAt: string;
}

export interface MilestoneAck {
  id: string;
  streakId: string;
  milestoneDays: 7 | 30 | 100 | 365;
  achievedAt: string;
  acknowledged: boolean;
}

// === Derived / View Types ===

/** Day-level summary for a streak (used in dashboard grid) */
export interface DaySummary {
  date: string; // YYYY-MM-DD
  streakId: string;
  dayStatus:
    | 'achieved'
    | 'not_achieved'
    | 'missed'
    | 'pending'
    | 'paused'
    | 'not_scheduled'
    | 'future';
  logCount: number; // 0-3
  hasMedia: boolean;
  thumbnailPath: string | null; // first media thumbnail for preview
}

/** Dashboard card data */
export interface StreakCard {
  streak: Streak;
  todayStatus: DaySummary;
  weekSummary: DaySummary[]; // 7 days
  pendingToday: boolean; // needs logging?
  logsToday: number; // how many logs so far
}

/** Streak detail analytics */
export interface StreakAnalytics {
  currentStreak: number;
  longestStreak: number;
  totalAchieved: number;
  totalNotAchieved: number;
  totalMissed: number;
  completionRate: number; // percentage
  activeSinceDays: number;
  milestones: MilestoneAck[];
}

// === Input Types (for create/update operations) ===

export interface CreateStreakInput {
  name: string;
  description?: string;
  emoji?: string;
  color?: string;
  scheduleType: ScheduleType;
  scheduleConfig?: ScheduleConfig;
  proofType: ProofType;
  visualizationType?: VisualizationType;
  targetDays?: number;
  startDate?: string; // defaults to today
}

export interface UpdateStreakInput {
  name?: string;
  description?: string | null;
  emoji?: string | null;
  color?: string | null;
  scheduleType?: ScheduleType;
  scheduleConfig?: ScheduleConfig;
  proofType?: ProofType;
  visualizationType?: VisualizationType;
  targetDays?: number | null;
  status?: StreakStatus;
}

export interface CreateLogInput {
  streakId: string;
  logDate?: string; // defaults to today
  status: LogStatus;
  note?: string;
  mediaPaths?: string[]; // Added in Phase 6: support associating media with a log
}

export interface CreateLogMediaInput {
  logId: string;
  mediaType: MediaType;
  filePath: string;
  fileSize?: number;
  duration?: number;
  thumbnailPath?: string;
  width?: number;
  height?: number;
}

export interface CreateReminderInput {
  streakId: string;
  reminderTime: string; // HH:mm
  enabled?: boolean;
  smartReminderEnabled?: boolean;
  smartReminderTime?: string; // HH:mm, default '21:00'
}

// === SQLite Row Types (raw DB rows before mapping) ===

export interface StreakRow {
  id: string;
  name: string;
  description: string | null;
  emoji: string | null;
  color: string | null;
  schedule_type: string;
  schedule_config: string | null;
  proof_type: string;
  visualization_type: string;
  target_days: number | null;
  status: string;
  current_streak: number;
  longest_streak: number;
  total_achieved: number;
  start_date: string;
  created_at: string;
  updated_at: string;
}

export interface LogRow {
  id: string;
  streak_id: string;
  log_date: string;
  log_number: number;
  status: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface LogMediaRow {
  id: string;
  log_id: string;
  media_type: string;
  file_path: string;
  file_size: number | null;
  duration: number | null;
  thumbnail_path: string | null;
  width: number | null;
  height: number | null;
  created_at: string;
}

export interface PauseHistoryRow {
  id: string;
  streak_id: string;
  paused_at: string;
  resumed_at: string | null;
  created_at: string;
}

export interface ReminderRow {
  id: string;
  streak_id: string;
  reminder_time: string;
  enabled: number; // 0 or 1
  smart_reminder_enabled: number;
  smart_reminder_time: string;
  created_at: string;
  updated_at: string;
}

export interface MilestoneAckRow {
  id: string;
  streak_id: string;
  milestone_days: number;
  achieved_at: string;
  acknowledged: number; // 0 or 1
}

export interface AppSettingRow {
  key: string;
  value: string;
}
