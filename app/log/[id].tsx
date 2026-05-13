import React from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { useLogs } from '../../src/hooks/use-logs';
import { LogComposer } from '../../src/components/features/LogComposer';
import { saveImage } from '../../src/services/media-service';
import type { LogPatch } from '../../src/domain/types';

export default function EditLogModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { logs, update } = useLogs();
  const log = logs.find(l => l.id === id);

  if (!log) return null;

  const handleSave = async (patch: LogPatch) => {
    let mediaPath = patch.mediaPath;
    if (mediaPath && !mediaPath.startsWith('media/')) {
      mediaPath = await saveImage(mediaPath, log.id);
    }
    await update(id, { ...patch, mediaPath, mediaType: mediaPath ? 'image' : null });
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
