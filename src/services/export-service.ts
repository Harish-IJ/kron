import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import JSZip from 'jszip';
import type { Streak, Log } from '../domain/types';
import { getAbsolutePath } from './media-service';

export async function exportAll(streak: Streak, logs: Log[]): Promise<void> {
  const zip = new JSZip();

  const manifest = {
    exportedAt: new Date().toISOString(),
    streak: {
      title: streak.title,
      intervalType: streak.intervalType,
      intervalDays: streak.intervalDays,
      startDate: streak.startDate,
      createdAt: streak.createdAt,
    },
    logs: logs.map(l => ({
      id: l.id,
      title: l.title,
      description: l.description,
      rating: l.rating,
      mediaPath: l.mediaPath ? `media/${l.id}.jpg` : null,
      createdAt: l.createdAt,
    })),
  };

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  const mediaFolder = zip.folder('media');
  if (mediaFolder) {
    for (const log of logs) {
      if (log.mediaPath) {
        const absPath = getAbsolutePath(log.mediaPath);
        const info = await FileSystem.getInfoAsync(absPath);
        if (info.exists) {
          const base64 = await FileSystem.readAsStringAsync(absPath, {
            encoding: FileSystem.EncodingType.Base64,
          });
          mediaFolder.file(`${log.id}.jpg`, base64, { base64: true });
        }
      }
    }
  }

  const content = await zip.generateAsync({ type: 'base64' });
  const dateStr = new Date().toISOString().slice(0, 10);
  const zipPath = `${FileSystem.cacheDirectory}kron-export-${dateStr}.zip`;
  await FileSystem.writeAsStringAsync(zipPath, content, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(zipPath, { mimeType: 'application/zip' });
  }
}
