import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';

// The directory where all user proof media will be stored persistently.
const MEDIA_DIR = `${FileSystem.documentDirectory}kron_media/`;

/**
 * Ensures the persistent media directory exists.
 */
export async function initMediaDirectory() {
  if (!FileSystem.documentDirectory) return;
  const info = await FileSystem.getInfoAsync(MEDIA_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(MEDIA_DIR, { intermediates: true });
  }
}

/**
 * Copies a temporary file (e.g., from ImagePicker) to local persistent storage.
 * @param sourceUri Original URI returned by ImagePicker
 * @returns The new permanent local URI
 */
export async function saveMediaItem(sourceUri: string): Promise<string> {
  await initMediaDirectory();

  // Extract file extension seamlessly
  const ext = sourceUri.includes('.') ? sourceUri.substring(sourceUri.lastIndexOf('.')) : '.jpg';
  const id = Crypto.randomUUID();
  const fileName = `${id}${ext}`;
  const destUri = `${MEDIA_DIR}${fileName}`;

  // Copy to persistent storage
  await FileSystem.copyAsync({
    from: sourceUri,
    to: destUri,
  });

  return destUri;
}

/**
 * Calculates current user storage in MB for Kron media
 */
export async function getMediaStorageSizeMB(): Promise<number> {
  await initMediaDirectory();
  try {
    const info = await FileSystem.getInfoAsync(MEDIA_DIR);
    if (!info.exists || !info.isDirectory) {
      return 0; // If it's a new directory or doesn't exist
    }
    // We would sum up sizes of individual files here
    // Currently, getInfoAsync doesn't compute dir size on all platforms in Expo.
    // For now, this requires iterating directory contents.
    const files = await FileSystem.readDirectoryAsync(MEDIA_DIR);
    let totalSize = 0;
    for (const f of files) {
      const fileInfo = await FileSystem.getInfoAsync(`${MEDIA_DIR}${f}`);
      if (fileInfo.exists && !fileInfo.isDirectory && fileInfo.size) {
        totalSize += fileInfo.size;
      }
    }
    return totalSize / (1024 * 1024);
  } catch (error) {
    console.error('Failed to calculate storage size', error);
    return 0;
  }
}
