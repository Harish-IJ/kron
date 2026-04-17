// ============================================================
// Kron — useStreaks hook
// Dashboard data from StreakContext
// ============================================================

import { useStreakContext } from '@/contexts/StreakContext';

/**
 * Returns dashboard streak cards + loading states.
 * Use in Home screen.
 */
export function useStreaks() {
  const { streakCards, loading, refresh } = useStreakContext();

  return {
    /** Sorted by most recently active */
    streaks: streakCards,

    /** True during initial DB fetch */
    isLoading: loading.initial,

    /** True during pull-to-refresh */
    isRefreshing: loading.refreshing,

    /** True while a streak is being created */
    isCreating: loading.creating,

    /** Whether dashboard has no streaks */
    isEmpty: !loading.initial && streakCards.length === 0,

    /** Re-fetch from DB */
    refresh,
  };
}
