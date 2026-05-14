import { useLogsStore } from '../store/logs-store';
import type { CreateLogInput, LogPatch } from '../domain/types';

export function useLogs(streakId: string) {
  const logsByStreakId = useLogsStore(s => s.logsByStreakId);
  const isLoading = useLogsStore(s => s.isLoading);
  const loadForStreak = useLogsStore(s => s.loadForStreak);
  const createFn = useLogsStore(s => s.create);
  const updateFn = useLogsStore(s => s.update);
  const deleteFn = useLogsStore(s => s.delete);

  const logs = logsByStreakId[streakId] ?? [];

  return {
    logs,
    isLoading,
    load: () => loadForStreak(streakId),
    create: (input: CreateLogInput) => createFn(streakId, input),
    update: (logId: string, patch: LogPatch) => updateFn(streakId, logId, patch),
    delete: (logId: string) => deleteFn(streakId, logId),
  };
}
