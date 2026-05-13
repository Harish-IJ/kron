import { create } from 'zustand';
import type { Streak, StreakState, StreakFormData, Log } from '../domain/types';
import { computeBuckets, computeStreakState } from '../domain/streak-engine';
import * as streakRepo from '../repositories/streak-repository';
import * as logRepo from '../repositories/log-repository';
import * as mediaService from '../services/media-service';
import { syncNotifications, cancelAllNotifications } from '../services/notification-service';

interface AppStore {
  streak: Streak | null;
  streakState: StreakState | null;
  isLoading: boolean;
  initialize(): Promise<void>;
  saveStreak(data: StreakFormData): Promise<void>;
  refreshStreakState(logs: Log[]): void;
  syncNotifications(): Promise<void>;
  resetAll(): Promise<void>;
}

export const useAppStore = create<AppStore>((set, get) => ({
  streak: null,
  streakState: null,
  isLoading: true,

  async initialize() {
    const streak = await streakRepo.getStreak();
    if (!streak) {
      set({ streak: null, streakState: null, isLoading: false });
      return;
    }
    const logs = await logRepo.findAllLogs();
    const buckets = computeBuckets(streak, logs, new Date());
    const streakState = computeStreakState(buckets, new Date());
    set({ streak, streakState, isLoading: false });
    await syncNotifications(streak, streakState);
  },

  async saveStreak(data: StreakFormData) {
    const saved = await streakRepo.upsertStreak(data);
    const logs = await logRepo.findAllLogs();
    const buckets = computeBuckets(saved, logs, new Date());
    const streakState = computeStreakState(buckets, new Date());
    set({ streak: saved, streakState });
    await syncNotifications(saved, streakState);
  },

  refreshStreakState(logs: Log[]) {
    const { streak } = get();
    if (!streak) { set({ streakState: null }); return; }
    const buckets = computeBuckets(streak, logs, new Date());
    const newState = computeStreakState(buckets, new Date());
    set({ streakState: newState });
  },

  async syncNotifications() {
    const { streak, streakState } = get();
    if (!streak || !streakState) { await cancelAllNotifications(); return; }
    await syncNotifications(streak, streakState);
  },

  async resetAll() {
    await cancelAllNotifications();
    const logs = await logRepo.findAllLogs();
    await Promise.allSettled(
      logs.filter(l => l.mediaPath).map(l => mediaService.deleteImage(l.mediaPath!))
    );
    await streakRepo.clearAllData();
    set({ streak: null, streakState: null });
  },
}));
