import { create } from 'zustand';
import type { Streak, StreakState, StreakFormData, Log, IntervalType } from '../domain/types';
import { computeBuckets, computeStreakState } from '../domain/streak-engine';
import { getDb } from '../db/client';
import * as streakRepo from '../repositories/streak-repository';
import * as logRepo from '../repositories/log-repository';
import * as mediaService from '../services/media-service';
import {
  syncNotifications,
  cancelStreakNotifications,
} from '../services/notification-service';

// Persists activeStreakId to app_settings so it survives app restart.
async function persistActiveStreakId(id: string | null): Promise<void> {
  try {
    const db = getDb();
    if (id === null) {
      await db.runAsync("DELETE FROM app_settings WHERE key = 'activeStreakId'");
    } else {
      await db.runAsync(
        "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('activeStreakId', ?)",
        [id]
      );
    }
  } catch {
    // non-fatal — in-memory state is still correct
  }
}

interface AppStore {
  streaks: Streak[];
  activeStreakId: string | null;
  streakStates: Record<string, StreakState>;
  isLoading: boolean;

  initialize(): Promise<void>;
  createStreak(data: StreakFormData): Promise<void>;
  updateStreak(id: string, patch: Pick<StreakFormData, 'title' | 'notificationTimes'>): Promise<void>;
  updateStreakInterval(
    id: string,
    intervalType: IntervalType,
    intervalDays: number,
    intervalWeekdays: number[],
    intervalMonthDates: number[]
  ): Promise<void>;
  deleteStreak(id: string): Promise<void>;
  setActiveStreak(id: string): void;
  refreshStreakState(streakId: string, logs: Log[]): void;
  syncNotificationsForStreak(streakId: string): Promise<void>;
  resetStreak(id: string): Promise<void>;
}

export const useAppStore = create<AppStore>((set, get) => ({
  streaks: [],
  activeStreakId: null,
  streakStates: {},
  isLoading: true,

  async initialize() {
    const streaks = await streakRepo.getAllStreaks();
    const streakStates: Record<string, StreakState> = {};
    for (const streak of streaks) {
      const logs = await logRepo.findLogsByStreakId(streak.id);
      const buckets = computeBuckets(streak, logs, new Date());
      streakStates[streak.id] = computeStreakState(buckets, new Date());
    }
    // Restore persisted active streak id from app_settings (survives restarts)
    const db = getDb();
    const row = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM app_settings WHERE key = 'activeStreakId'"
    ).catch(() => null);
    const persistedId = row?.value ?? null;
    const activeStreakId =
      persistedId && streaks.some(s => s.id === persistedId)
        ? persistedId
        : (streaks[0]?.id ?? null);
    set({ streaks, streakStates, activeStreakId, isLoading: false });
    for (const streak of streaks) {
      await syncNotifications(streak, streakStates[streak.id]);
    }
  },

  async createStreak(data: StreakFormData) {
    const saved = await streakRepo.insertStreak(data);
    const buckets = computeBuckets(saved, [], new Date());
    const state = computeStreakState(buckets, new Date());
    const { streaks, streakStates } = get();
    set({
      streaks: [...streaks, saved],
      streakStates: { ...streakStates, [saved.id]: state },
      activeStreakId: saved.id,
    });
    persistActiveStreakId(saved.id);
    await syncNotifications(saved, state);
  },

  async updateStreak(id: string, patch: Pick<StreakFormData, 'title' | 'notificationTimes'>) {
    const saved = await streakRepo.updateStreak(id, patch);
    const { streaks, streakStates } = get();
    const logs = await logRepo.findLogsByStreakId(id);
    const buckets = computeBuckets(saved, logs, new Date());
    const state = computeStreakState(buckets, new Date());
    set({
      streaks: streaks.map(s => (s.id === id ? saved : s)),
      streakStates: { ...streakStates, [id]: state },
    });
    await syncNotifications(saved, state);
  },

  async updateStreakInterval(
    id: string,
    intervalType: IntervalType,
    intervalDays: number,
    intervalWeekdays: number[],
    intervalMonthDates: number[]
  ) {
    const saved = await streakRepo.updateIntervalIfNoLogs(
      id, intervalType, intervalDays, intervalWeekdays, intervalMonthDates
    );
    const { streaks, streakStates } = get();
    const buckets = computeBuckets(saved, [], new Date());
    const state = computeStreakState(buckets, new Date());
    set({
      streaks: streaks.map(s => (s.id === id ? saved : s)),
      streakStates: { ...streakStates, [id]: state },
    });
    await syncNotifications(saved, state);
  },

  async deleteStreak(id: string) {
    const { streaks, streakStates, activeStreakId } = get();
    await cancelStreakNotifications(id);
    // Fetch media paths before bulk-deleting rows, then clean up files
    const logs = await logRepo.findLogsByStreakId(id);
    await Promise.allSettled(
      logs.filter(l => l.mediaPath).map(l => mediaService.deleteImage(l.mediaPath!))
    );
    await logRepo.deleteLogsByStreakId(id); // single SQL, not a loop
    await streakRepo.deleteStreak(id);
    const remaining = streaks.filter(s => s.id !== id);
    const newStates = { ...streakStates };
    delete newStates[id];
    const newActiveId =
      id === activeStreakId ? (remaining[0]?.id ?? null) : activeStreakId;
    set({ streaks: remaining, streakStates: newStates, activeStreakId: newActiveId });
    persistActiveStreakId(newActiveId);
  },

  setActiveStreak(id: string) {
    set({ activeStreakId: id });
    persistActiveStreakId(id); // fire-and-forget — in-memory update is synchronous
  },

  refreshStreakState(streakId: string, logs: Log[]) {
    const { streaks, streakStates } = get();
    const streak = streaks.find(s => s.id === streakId);
    if (!streak) return;
    const buckets = computeBuckets(streak, logs, new Date());
    const newState = computeStreakState(buckets, new Date());
    set({ streakStates: { ...streakStates, [streakId]: newState } });
  },

  async syncNotificationsForStreak(streakId: string) {
    const { streaks, streakStates } = get();
    const streak = streaks.find(s => s.id === streakId);
    const state = streakStates[streakId];
    if (!streak || !state) return;
    await syncNotifications(streak, state);
  },

  async resetStreak(id: string) {
    await cancelStreakNotifications(id);
    // Fetch media paths before bulk-deleting rows
    const logs = await logRepo.findLogsByStreakId(id);
    await Promise.allSettled(
      logs.filter(l => l.mediaPath).map(l => mediaService.deleteImage(l.mediaPath!))
    );
    await logRepo.deleteLogsByStreakId(id); // single SQL, not a loop
    const { streaks, streakStates } = get();
    const streak = streaks.find(s => s.id === id);
    if (!streak) return;
    const emptyBuckets = computeBuckets(streak, [], new Date());
    const emptyState = computeStreakState(emptyBuckets, new Date());
    set({ streakStates: { ...streakStates, [id]: emptyState } });
  },
}));
