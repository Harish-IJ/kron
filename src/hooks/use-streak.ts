import { useAppStore } from '../store/app-store';
import type { StreakFormData, IntervalType } from '../domain/types';

export function useActiveStreak() {
  const streaks = useAppStore(s => s.streaks);
  const activeStreakId = useAppStore(s => s.activeStreakId);
  const streakStates = useAppStore(s => s.streakStates);
  const isLoading = useAppStore(s => s.isLoading);
  const createStreak = useAppStore(s => s.createStreak);
  const updateStreak = useAppStore(s => s.updateStreak);
  const updateStreakInterval = useAppStore(s => s.updateStreakInterval);
  const deleteStreak = useAppStore(s => s.deleteStreak);
  const resetStreak = useAppStore(s => s.resetStreak);
  const setActiveStreak = useAppStore(s => s.setActiveStreak);

  const streak = streaks.find(s => s.id === activeStreakId) ?? null;
  const streakState = activeStreakId ? (streakStates[activeStreakId] ?? null) : null;

  return {
    streaks,
    streak,
    streakState,
    streakStates,
    activeStreakId,
    isLoading,
    createStreak,
    updateStreak,
    updateStreakInterval,
    deleteStreak,
    resetStreak,
    setActiveStreak,
  };
}
