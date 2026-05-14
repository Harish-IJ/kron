import { useLogsStore } from '../store/logs-store';

export function useLogs() {
  const logs = useLogsStore(s => s.logs);
  const isLoading = useLogsStore(s => s.isLoading);
  const load = useLogsStore(s => s.load);
  const create = useLogsStore(s => s.create);
  const update = useLogsStore(s => s.update);
  const del = useLogsStore(s => s.delete);

  return { logs, isLoading, load, create, update, delete: del };
}
