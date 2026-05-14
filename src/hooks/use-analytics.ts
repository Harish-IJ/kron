import { useMemo } from 'react';
import { useAppStore } from '../store/app-store';
import { useLogsStore } from '../store/logs-store';
import { computeBuckets } from '../domain/streak-engine';
import { computeAnalytics } from '../domain/analytics-engine';

export function useAnalytics() {
  const streaks = useAppStore(s => s.streaks);
  const activeStreakId = useAppStore(s => s.activeStreakId);
  const logsByStreakId = useLogsStore(s => s.logsByStreakId);

  const streak = streaks.find(s => s.id === activeStreakId) ?? null;
  const logs = activeStreakId ? (logsByStreakId[activeStreakId] ?? []) : [];

  return useMemo(() => {
    if (!streak || logs.length === 0) return null;
    const buckets = computeBuckets(streak, logs, new Date());
    return computeAnalytics(streak, logs, buckets);
  }, [streak, logs]);
}
