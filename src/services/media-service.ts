import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

const MEDIA_DIR = 'media/images/';

async function ensureMediaDir(): Promise<void> {
  const dir = `${FileSystem.documentDirectory}${MEDIA_DIR}`;
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
}

export async function pickImage(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    allowsEditing: false,
  });
  if (result.canceled || result.assets.length === 0) return null;
  return result.assets[0].uri;
}

export async function saveImage(sourceUri: string, logId: string): Promise<string> {
  const safeId = logId.replace(/[/\\]/g, '');
  await ensureMediaDir();
  const relativePath = `${MEDIA_DIR}${safeId}.jpg`;
  const destPath = `${FileSystem.documentDirectory}${relativePath}`;
  await FileSystem.copyAsync({ from: sourceUri, to: destPath });
  return relativePath;
}

export async function deleteImage(relativePath: string): Promise<void> {
  const fullPath = `${FileSystem.documentDirectory}${relativePath}`;
  const info = await FileSystem.getInfoAsync(fullPath);
  if (info.exists) {
    await FileSystem.deleteAsync(fullPath, { idempotent: true });
  }
}

export function getAbsolutePath(relativePath: string): string {
  return `${FileSystem.documentDirectory}${relativePath}`;
}
