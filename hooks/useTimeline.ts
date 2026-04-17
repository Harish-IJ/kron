// ============================================================
// Kron — useTimeline hook
// All logs for a specific date (all streaks)
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { getLogsByDate } from '@/db/queries/logs';
import { getStreakById } from '@/db/queries/streaks';
import { today } from '@/db/helpers';
import type { Log, Streak } from '@/db/types';

export interface TimelineEntry {
  log: Log;
  streak: Streak;
}

interface TimelineState {
  entries: TimelineEntry[];
  isLoading: boolean;
  selectedDate: string;
}

/**
 * Fetches all logs across all streaks for a given date.
 * Use in Timeline screen.
 */
export function useTimeline(initialDate?: string) {
  const [state, setState] = useState<TimelineState>({
    entries: [],
    isLoading: true,
    selectedDate: initialDate ?? today(),
  });

  const loadDate = useCallback(async (dateStr: string) => {
    setState((prev) => ({ ...prev, isLoading: true, selectedDate: dateStr }));

    try {
      const logs = await getLogsByDate(dateStr);

      // Attach streak info to each log
      const entries: TimelineEntry[] = [];
      for (const log of logs) {
        const streak = await getStreakById(log.streakId);
        if (streak) {
          entries.push({ log, streak });
        }
      }

      setState({ entries, isLoading: false, selectedDate: dateStr });
    } catch (err) {
      console.error('[Kron] Timeline load failed:', err);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    loadDate(state.selectedDate);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ...state,
    /** Navigate to a different date */
    setDate: loadDate,
    /** Refresh current date */
    refresh: () => loadDate(state.selectedDate),
  };
}
