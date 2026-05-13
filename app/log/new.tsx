import React from 'react';
import { router } from 'expo-router';
import { useLogs } from '../../src/hooks/use-logs';
import { LogComposer } from '../../src/components/features/LogComposer';
import { saveImage } from '../../src/services/media-service';
import type { CreateLogInput } from '../../src/domain/types';

export default function NewLogModal() {
  const { create } = useLogs();

  const handleSave = async (data: CreateLogInput) => {
    let mediaPath: string | null = data.mediaPath ?? null;
    if (mediaPath && !mediaPath.startsWith('media/')) {
      const tempId = `new_${Date.now()}`;
      mediaPath = await saveImage(mediaPath, tempId);
    }
    await create({ ...data, mediaPath, mediaType: mediaPath ? 'image' : null });
    router.back();
  };

  return <LogComposer onSave={handleSave} onCancel={() => router.back()} />;
}
