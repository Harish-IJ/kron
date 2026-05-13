import { useLogsStore } from '../store/logs-store';

export function useLogs() {
  const logs = useLogsStore(s => s.logs);
  const isLoading = useLogsStore(s => s.isLoading);
  const create = useLogsStore(s => s.create);
  const update = useLogsStore(s => s.update);
  const del = useLogsStore(s => s.delete);

  return { logs, isLoading, create, update, delete: del };
}
