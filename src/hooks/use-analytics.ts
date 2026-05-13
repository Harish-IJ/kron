import { useMemo } from 'react';
import { useAppStore } from '../store/app-store';
import { useLogsStore } from '../store/logs-store';
import { computeBuckets } from '../domain/streak-engine';
import { computeAnalytics } from '../domain/analytics-engine';

export function useAnalytics() {
  const streak = useAppStore(s => s.streak);
  const logs = useLogsStore(s => s.logs);

  return useMemo(() => {
    if (!streak || logs.length === 0) return null;
    const buckets = computeBuckets(streak, logs, new Date());
    return computeAnalytics(streak, logs, buckets);
  }, [streak, logs]);
}
