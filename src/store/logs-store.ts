import { create } from 'zustand';
import type { Log, CreateLogInput, LogPatch } from '../domain/types';
import * as logRepo from '../repositories/log-repository';
import * as mediaService from '../services/media-service';
import { useAppStore } from './app-store';

interface LogsStore {
  logsByStreakId: Record<string, Log[]>;
  isLoading: boolean;
  loadAll(): Promise<void>;
  loadForStreak(streakId: string): Promise<void>;
  create(streakId: string, input: CreateLogInput): Promise<void>;
  update(streakId: string, logId: string, patch: LogPatch): Promise<void>;
  delete(streakId: string, logId: string): Promise<void>;
}

export const useLogsStore = create<LogsStore>((set, get) => ({
  logsByStreakId: {},
  isLoading: false,

  async loadAll() {
    set({ isLoading: true });
    const { streaks } = useAppStore.getState();
    const entries = await Promise.all(
      streaks.map(async s => ({ id: s.id, logs: await logRepo.findLogsByStreakId(s.id) }))
    );
    const logsByStreakId: Record<string, Log[]> = {};
    for (const { id, logs } of entries) {
      logsByStreakId[id] = logs;
    }
    set({ logsByStreakId, isLoading: false });
  },

  async loadForStreak(streakId: string) {
    const logs = await logRepo.findLogsByStreakId(streakId);
    const { logsByStreakId } = get();
    set({ logsByStreakId: { ...logsByStreakId, [streakId]: logs } });
  },

  async create(streakId: string, input: CreateLogInput) {
    await logRepo.insertLog({ streakId, ...input });
    await get().loadForStreak(streakId);
    const logs = get().logsByStreakId[streakId] ?? [];
    useAppStore.getState().refreshStreakState(streakId, logs);
    await useAppStore.getState().syncNotificationsForStreak(streakId);
  },

  async update(streakId: string, logId: string, patch: LogPatch) {
    await logRepo.updateLog(logId, patch);
    await get().loadForStreak(streakId);
  },

  async delete(streakId: string, logId: string) {
    const log = await logRepo.findLogById(logId);
    await logRepo.deleteLog(logId);
    if (log?.mediaPath) {
      await mediaService.deleteImage(log.mediaPath).catch(() => {});
    }
    await get().loadForStreak(streakId);
    const logs = get().logsByStreakId[streakId] ?? [];
    useAppStore.getState().refreshStreakState(streakId, logs);
    await useAppStore.getState().syncNotificationsForStreak(streakId);
  },
}));
