import { Platform } from 'react-native';

import type { PlannedNotification } from '@/lib/reminders';

// Обгортка над expo-notifications. Модуль вантажимо лише тут (див. lib/native-module):
// у збірці без нього решта застосунку працює, а ці функції кидають помилку.
// У web локальні сповіщення не плануються — там лише налаштування.

export const notificationsSupported = Platform.OS === 'ios' || Platform.OS === 'android';

const CHANNEL_ID = 'reminders';
let handlerSet = false;

async function load() {
  const Notifications = await import('expo-notifications');
  if (!handlerSet) {
    handlerSet = true;
    // Сповіщення, що прийшло, поки застосунок відкритий, теж показуємо.
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }
  return Notifications;
}

export type PermissionState = 'granted' | 'undetermined' | 'denied';

export async function getPermission(): Promise<PermissionState> {
  if (!notificationsSupported) return 'denied';
  const Notifications = await load();
  const result = await Notifications.getPermissionsAsync();
  return toState(Notifications, result);
}

// Запитуємо лише за дією користувача — не на старті застосунку.
export async function requestPermission(): Promise<PermissionState> {
  if (!notificationsSupported) return 'denied';
  const Notifications = await load();
  // На Android 13+ запит з'являється лише після створення каналу.
  await ensureChannel(Notifications);
  const result = await Notifications.requestPermissionsAsync();
  return toState(Notifications, result);
}

type NotificationsModule = typeof import('expo-notifications');

function toState(
  Notifications: NotificationsModule,
  result: Awaited<ReturnType<NotificationsModule['getPermissionsAsync']>>,
): PermissionState {
  if (result.granted) return 'granted';
  // На iOS «тимчасовий» дозвіл теж дає змогу показувати сповіщення.
  if (result.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) return 'granted';
  return result.canAskAgain ? 'undetermined' : 'denied';
}

async function ensureChannel(Notifications: NotificationsModule) {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

// Перепланувує все: скасовує старі сповіщення й ставить план заново.
export async function applyPlan(plan: PlannedNotification[]) {
  if (!notificationsSupported) return 0;
  const Notifications = await load();
  await ensureChannel(Notifications);
  await Notifications.cancelAllScheduledNotificationsAsync();
  if ((await getPermission()) !== 'granted') return 0;

  const T = Notifications.SchedulableTriggerInputTypes;
  for (const n of plan) {
    const trigger =
      n.trigger.type === 'daily'
        ? { type: T.DAILY, hour: n.trigger.hour, minute: n.trigger.minute, channelId: CHANNEL_ID }
        : n.trigger.type === 'weekly'
          ? {
              type: T.WEEKLY,
              weekday: n.trigger.weekday,
              hour: n.trigger.hour,
              minute: n.trigger.minute,
              channelId: CHANNEL_ID,
            }
          : { type: T.DATE, date: n.trigger.date, channelId: CHANNEL_ID };
    await Notifications.scheduleNotificationAsync({
      identifier: n.key,
      content: {
        title: n.title,
        body: n.body,
        // iOS групує сповіщення однієї «нитки» в стос.
        threadIdentifier: n.thread,
        data: { thread: n.thread },
      },
      trigger,
    });
  }
  return plan.length;
}
