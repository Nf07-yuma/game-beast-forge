import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const ANDROID_CHANNEL_ID = 'default';
let channelReady = false;
let permissionRequested = false;
const scheduledIds = new Map<string, string>();

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android' || channelReady) return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Beast Forge',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
  channelReady = true;
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  await ensureAndroidChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (permissionRequested) return false;
  permissionRequested = true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function cancelReminder(key: string): Promise<void> {
  const id = scheduledIds.get(key);
  if (!id) return;
  scheduledIds.delete(key);
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // Already fired or cancelled; nothing to do.
  }
}

async function scheduleReminder(
  key: string,
  title: string,
  body: string,
  delayMs: number
): Promise<void> {
  await cancelReminder(key);
  const granted = await ensureNotificationPermissions();
  if (!granted) return;
  const id = await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, Math.ceil(delayMs / 1000)),
      channelId: ANDROID_CHANNEL_ID,
    },
  });
  scheduledIds.set(key, id);
}

export function scheduleFeedReminder(monsterId: string, nickname: string, delayMs: number) {
  return scheduleReminder(
    `feed-${monsterId}`,
    'エサの時間です🍖',
    `${nickname}がエサを待っています`,
    delayMs
  );
}

export function cancelFeedReminder(monsterId: string) {
  return cancelReminder(`feed-${monsterId}`);
}

export function scheduleTrainReminder(monsterId: string, nickname: string, delayMs: number) {
  return scheduleReminder(
    `train-${monsterId}`,
    'トレーニングの時間です💪',
    `${nickname}の準備ができました`,
    delayMs
  );
}

export function cancelTrainReminder(monsterId: string) {
  return cancelReminder(`train-${monsterId}`);
}

export function scheduleHatchReminder(eggId: string, delayMs: number) {
  return scheduleReminder(
    `hatch-${eggId}`,
    'タマゴがふ化しそうです🥚',
    'コレクションでタマゴの様子を見てみましょう',
    delayMs
  );
}

export function cancelHatchReminder(eggId: string) {
  return cancelReminder(`hatch-${eggId}`);
}
