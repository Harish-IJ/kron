import { create } from 'zustand';
import type { Log, CreateLogInput, LogPatch } from '../domain/types';
import * as logRepo from '../repositories/log-repository';
import * as mediaService from '../services/media-service';
import { useAppStore } from './app-store';

interface LogsStore {
  logs: Log[];
  isLoading: boolean;
  load(): Promise<void>;
  create(input: CreateLogInput): Promise<void>;
  update(id: string, patch: LogPatch): Promise<void>;
  delete(id: string): Promise<void>;
}

export const useLogsStore = create<LogsStore>((set, get) => ({
  logs: [],
  isLoading: false,

  async load() {
    set({ isLoading: true });
    const logs = await logRepo.findAllLogs();
    set({ logs, isLoading: false });
  },

  async create(input: CreateLogInput) {
    await logRepo.insertLog(input);
    const logs = await logRepo.findAllLogs();
    set({ logs });
    useAppStore.getState().refreshStreakState(logs);
    await useAppStore.getState().syncNotifications();
  },

  async update(id: string, patch: LogPatch) {
    await logRepo.updateLog(id, patch);
    const logs = await logRepo.findAllLogs();
    set({ logs });
  },

  async delete(id: string) {
    const log = await logRepo.findLogById(id);
    await logRepo.deleteLog(id);
    if (log?.mediaPath) {
      await mediaService.deleteImage(log.mediaPath).catch(() => {});
    }
    const logs = await logRepo.findAllLogs();
    set({ logs });
    useAppStore.getState().refreshStreakState(logs);
    await useAppStore.getState().syncNotifications();
  },
}));
