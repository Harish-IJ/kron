import * as Notifications from 'expo-notifications';
import type { Streak, StreakState } from '../domain/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function isNotificationPermissionGranted(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

function parseHHMM(hhmm: string): { hours: number; minutes: number } {
  const [h, m] = hhmm.split(':').map(Number);
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
      const { hours, minutes } = parseHHMM(hhmm);
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
      const { hours, minutes } = parseHHMM(hhmm);
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
}
