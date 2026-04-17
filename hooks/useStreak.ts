// ============================================================
// Kron — useStreak hook
// Single streak detail + analytics
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { fetchStreakDetail } from '@/services/streakService';
import type { Streak, StreakCard, StreakAnalytics } from '@/db/types';

interface StreakDetailState {
  streak: Streak | null;
  card: StreakCard | null;
  analytics: StreakAnalytics | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches full streak detail by ID.
 * Use in Streak Detail screen.
 */
export function useStreak(id: string) {
  const [state, setState] = useState<StreakDetailState>({
    streak: null,
    card: null,
    analytics: null,
    isLoading: true,
    error: null,
  });

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const result = await fetchStreakDetail(id);
      if (result) {
        setState({
          streak: result.streak,
          card: result.card,
          analytics: result.analytics,
          isLoading: false,
          error: null,
        });
      } else {
        setState({
          streak: null,
          card: null,
          analytics: null,
          isLoading: false,
          error: 'Streak not found',
        });
      }
    } catch (err) {
      setState({
        streak: null,
        card: null,
        analytics: null,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load streak',
      });
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    ...state,
    /** Re-fetch streak detail from DB */
    refresh: load,
  };
}
