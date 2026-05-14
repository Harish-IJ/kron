export interface StreakRow {
  id: string;
  title: string;
  interval_type: string;
  interval_days: number;
  interval_weekdays: string | null;
  interval_month_dates: string | null;
  notification_times: string;
  start_date: string;
  created_at: string;
}

export interface LogRow {
  id: string;
  title: string;
  description: string | null;
  rating: number | null;
  media_path: string | null;
  media_type: 'image' | null;
  created_at: string;
}

export interface MigrationRow {
  version: number;
  applied_at: string;
}
