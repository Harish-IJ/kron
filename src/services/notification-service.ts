import * as Notifications from 'expo-notifications';
import type { Streak, StreakState } from '../domain/types';

// expo-notifications push token support was removed from Expo Go in SDK 53.
// The handler and all scheduling calls are wrapped so the app degrades
// gracefully when running in Expo Go.
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch {
  // Expo Go — local notifications unavailable
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function isNotificationPermissionGranted(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // noop in Expo Go
  }
}

function parseHHMM(hhmm: string): { hours: number; minutes: number } | null {
  const parts = hhmm.split(':');
  if (parts.length !== 2) return null;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  return { hours: h, minutes: m };
}

function formatDeadline(deadline: Date): string {
  return deadline.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export async function syncNotifications(
  streak: Streak,
  streakState: StreakState
): Promise<void> {
  try {
  await cancelAllNotifications();

  if (streak.notificationTimes.length === 0) return;
  const granted = await isNotificationPermissionGranted();
  if (!granted) return;

  const body = `${streak.title} — window closes ${formatDeadline(streakState.nextDeadline)}`;

  if (streakState.isCurrentBucketSatisfied) {
    const [ny, nm, nd] = streakState.currentBucketEnd.split('-').map(Number);
    const nextWindowStart = new Date(ny, nm - 1, nd);
    nextWindowStart.setDate(nextWindowStart.getDate() + 1);

    for (const hhmm of streak.notificationTimes) {
      const parsed = parseHHMM(hhmm);
      if (!parsed) continue;
      const { hours, minutes } = parsed;
      const fireDate = new Date(
        nextWindowStart.getFullYear(),
        nextWindowStart.getMonth(),
        nextWindowStart.getDate(),
        hours,
        minutes,
        0
      );
      if (fireDate > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: { title: 'Time to log', body },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: fireDate,
          },
        });
      }
    }
    return;
  }

  const today = new Date();
  const [ey, em, ed] = streakState.currentBucketEnd.split('-').map(Number);
  const windowEnd = new Date(ey, em - 1, ed);

  let scheduled = 0;
  const maxSchedule = Math.min(streakState.currentBucket.index >= 0 ? streak.intervalDays : 14, 14);

  for (let d = new Date(today); d <= windowEnd && scheduled < maxSchedule * streak.notificationTimes.length; d.setDate(d.getDate() + 1)) {
    const isToday = d.toDateString() === today.toDateString();
    for (const hhmm of streak.notificationTimes) {
      const parsed = parseHHMM(hhmm);
      if (!parsed) continue;
      const { hours, minutes } = parsed;
      const fireDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hours, minutes, 0);
      if (isToday && fireDate <= new Date()) continue;
      if (fireDate > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: { title: 'Time to log', body },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: fireDate,
          },
        });
        scheduled++;
      }
    }
  }
  } catch {
    // Expo Go — local notifications unavailable
  }
}
