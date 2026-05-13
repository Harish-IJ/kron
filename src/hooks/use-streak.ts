import { useAppStore } from '../store/app-store';

export function useStreak() {
  const streak = useAppStore(s => s.streak);
  const streakState = useAppStore(s => s.streakState);
  const isLoading = useAppStore(s => s.isLoading);
  const saveStreak = useAppStore(s => s.saveStreak);
  const resetAll = useAppStore(s => s.resetAll);

  return { streak, streakState, isLoading, saveStreak, resetAll };
}
