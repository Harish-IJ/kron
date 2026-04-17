// ============================================================
// Kron — Streak Context (STATE ONLY)
// No mutations here — use services/streakService.ts
// ============================================================

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { fetchDashboardCards } from '@/services/streakService';
import type { StreakCard } from '@/db/types';

// === Types ===

interface LoadingState {
  initial: boolean;
  refreshing: boolean;
  creating: boolean;
}

interface StreakContextValue {
  /** Dashboard streak cards, sorted by recently active */
  streakCards: StreakCard[];

  /** Granular loading states */
  loading: LoadingState;

  /** Re-fetch all dashboard data from DB */
  refresh: () => Promise<void>;

  /** Set creating state (called by components before/after mutation) */
  setCreating: (value: boolean) => void;
}

const StreakContext = createContext<StreakContextValue | null>(null);

// === Hook ===

export function useStreakContext(): StreakContextValue {
  const ctx = useContext(StreakContext);
  if (!ctx) {
    throw new Error('useStreakContext must be used within StreakProvider');
  }
  return ctx;
}

// === Provider ===

export function StreakProvider({ children }: { children: React.ReactNode }) {
  const [streakCards, setStreakCards] = useState<StreakCard[]>([]);
  const [loading, setLoading] = useState<LoadingState>({
    initial: true,
    refreshing: false,
    creating: false,
  });

  const refresh = useCallback(async () => {
    setLoading((prev) => ({
      ...prev,
      refreshing: !prev.initial,
    }));

    try {
      const cards = await fetchDashboardCards();
      setStreakCards(cards);
    } catch (err) {
      console.error('[Kron] Failed to fetch streaks:', err);
    } finally {
      setLoading((prev) => ({
        ...prev,
        initial: false,
        refreshing: false,
      }));
    }
  }, []);

  const setCreating = useCallback((value: boolean) => {
    setLoading((prev) => ({ ...prev, creating: value }));
  }, []);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <StreakContext.Provider
      value={{ streakCards, loading, refresh, setCreating }}
    >
      {children}
    </StreakContext.Provider>
  );
}
