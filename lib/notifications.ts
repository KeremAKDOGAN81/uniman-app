import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import type { RemindHours, ReminderKind, Weekday } from '@/lib/types';

const CHANNEL_ID = 'uniman-reminders';

const EXPO_WEEKDAY: Record<Weekday, number> = {
  Pazartesi: 2,
  Salı: 3,
  Çarşamba: 4,
  Perşembe: 5,
  Cuma: 6,
};

export function classRemindClock(
  weekday: Weekday,
  startTime: string,
  hoursBefore: Exclude<RemindHours, 0>
): { weekday: number; hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(startTime.trim());
  if (!match) return null;
  let expoWeekday = EXPO_WEEKDAY[weekday];
  let total = Number(match[1]) * 60 + Number(match[2]) - hoursBefore * 60;
  while (total < 0) {
    total += 24 * 60;
    expoWeekday -= 1;
    if (expoWeekday < 1) expoWeekday = 7;
  }
  return {
    weekday: expoWeekday,
    hour: Math.floor(total / 60),
    minute: total % 60,
  };
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function configureNotifications(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'UniMan hatırlatmaları',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}

export async function ensureNotificationPermission(): Promise<boolean> {
  await configureNotifications();
  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  return status === 'granted';
}

export async function scheduleReminderNotification(input: {
  title: string;
  kind: ReminderKind;
  dueAt: Date;
}): Promise<string | null> {
  const allowed = await ensureNotificationPermission();
  if (!allowed) return null;
  if (input.dueAt.getTime() <= Date.now()) return null;

  const kindLabel = input.kind === 'sinav' ? 'Sınav' : 'Ödev';
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: `${kindLabel} hatırlatması`,
      body: `${input.title} — ${input.dueAt.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
      })}`,
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: input.dueAt,
      channelId: CHANNEL_ID,
    },
  });
  return identifier;
}

export async function scheduleClassReminderNotification(input: {
  title: string;
  weekday: Weekday;
  startTime: string;
  hoursBefore: 1 | 2 | 3;
  room?: string;
}): Promise<string | null> {
  const allowed = await ensureNotificationPermission();
  if (!allowed) return null;
  const clock = classRemindClock(input.weekday, input.startTime, input.hoursBefore);
  if (!clock) return null;

  return Notifications.scheduleNotificationAsync({
    content: {
      title: `${input.hoursBefore} saat sonra ders`,
      body: `${input.title}${input.room ? ` · ${input.room}` : ''} saat ${input.startTime}`,
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: clock.weekday,
      hour: clock.hour,
      minute: clock.minute,
      channelId: CHANNEL_ID,
    },
  });
}

export async function cancelReminderNotification(id: string | null): Promise<void> {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // Already fired or missing — ignore.
  }
}
