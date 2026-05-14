import React from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { useLogs } from '../../src/hooks/use-logs';
import { LogComposer } from '../../src/components/features/LogComposer';
import { saveImage } from '../../src/services/media-service';
import type { LogPatch } from '../../src/domain/types';

export default function EditLogModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { logs, update: updateLog } = useLogs();
  const log = logs.find(l => l.id === id);

  if (!log) return null;

  const handleSave = async (patch: LogPatch) => {
    const payload: LogPatch = { ...patch };
    // Only touch media fields when the patch explicitly includes mediaPath,
    // otherwise preserve whatever is already stored on the log.
    if ('mediaPath' in patch) {
      let mediaPath = patch.mediaPath ?? null;
      if (mediaPath && !mediaPath.startsWith('media/')) {
        mediaPath = await saveImage(mediaPath, log.id);
      }
      payload.mediaPath = mediaPath;
      payload.mediaType = mediaPath ? 'image' : null;
    } else {
      delete payload.mediaPath;
      delete payload.mediaType;
    }
    await updateLog(id, payload);
    router.back();
  };

  return (
    <LogComposer
      initial={log}
      existingTimestamp={new Date(log.createdAt).toLocaleString()}
      onSave={handleSave}
      onCancel={() => router.back()}
    />
  );
}
