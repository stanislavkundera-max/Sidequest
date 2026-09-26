import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { NotificationIntensity } from '@/src/repositories/profilesRepository';

/**
 * Local notifications for quests (round 2, R2-13 / R2-21). No server: everything is scheduled on the
 * phone. Two kinds only, chosen with Standa 2026-09-26:
 *   • quest day — at the time you put the quest in your calendar
 *   • timer done — when a step timer ends while you are out doing it
 * Tapping either opens the quest runner, which lands on the step you are on.
 */

type Kind = 'quest-day' | 'timer';

type QuestNotificationData = {
  kind: Kind;
  url: string;
  /** When it is due, in ms — kept so a timer can move other notifications out of its way. */
  at: number;
  userQuestId: string;
  title: string;
  body: string;
};

const CHANNEL_ID = 'quests';
const INTENSITY_KEY = 'sidequestlife:notificationIntensity';

const supported = Platform.OS === 'ios' || Platform.OS === 'android';

function idFor(kind: Kind, userQuestId: string): string {
  return `${kind}:${userQuestId}`;
}

export function runnerUrl(questId: string): string {
  return `/quest/run/${questId}`;
}

/** Called once at app start: how notifications behave while the app is open. */
export function configureQuestNotifications(): void {
  if (!supported) return;
  Notifications.setNotificationHandler({
    // Shown with the app open too: you may be on another screen when the timer ends.
    handleNotification: async () => {
      return {
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      };
    },
  });
  if (Platform.OS === 'android') {
    void Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Quests',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

/** The account setting, cached on the device so scheduling never waits on the network. */
export async function cacheNotificationIntensity(value: NotificationIntensity): Promise<void> {
  try {
    await AsyncStorage.setItem(INTENSITY_KEY, value);
  } catch {
    // Falls back to the default next time.
  }
}

async function readIntensity(): Promise<NotificationIntensity> {
  try {
    const v = await AsyncStorage.getItem(INTENSITY_KEY);
    if (v === 'quiet' || v === 'occasional' || v === 'chatty') return v;
  } catch {
    // ignore
  }
  return 'occasional';
}

/** Asks only when there is something to send, never at app start. */
async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

async function schedule(data: QuestNotificationData): Promise<void> {
  const identifier = idFor(data.kind, data.userQuestId);
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => undefined);
  await Notifications.scheduleNotificationAsync({
    identifier,
    content: { title: data.title, body: data.body, data },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(data.at),
      channelId: CHANNEL_ID,
    },
  });
}

/** A notification when the quest's calendar slot comes round. Off in "Quiet". */
export async function scheduleQuestDay(params: {
  userQuestId: string;
  questId: string;
  questTitle: string;
  at: Date;
}): Promise<void> {
  if (!supported) return;
  try {
    if ((await readIntensity()) === 'quiet') return;
    if (params.at.getTime() <= Date.now() + 60_000) return;
    if (!(await ensurePermission())) return;
    let at = params.at.getTime();
    // Never land inside a running timer (R2-21).
    const timerEnd = await runningTimerEnd();
    if (timerEnd != null && at < timerEnd) at = timerEnd + 60_000;
    await schedule({
      kind: 'quest-day',
      url: runnerUrl(params.questId),
      at,
      userQuestId: params.userQuestId,
      title: params.questTitle,
      body: 'This is the time you set aside for it. Tap to pick up where you left off.',
    });
  } catch {
    // A missing reminder must never break the quest itself.
  }
}

/** Tells you the timer is done while the phone is in your pocket. Sent at every setting. */
export async function scheduleTimerDone(params: {
  userQuestId: string;
  questId: string;
  stepTitle: string;
  endsAt: number;
}): Promise<void> {
  if (!supported) return;
  try {
    if (params.endsAt <= Date.now() + 5_000) return;
    if (!(await ensurePermission())) return;
    await schedule({
      kind: 'timer',
      url: runnerUrl(params.questId),
      at: params.endsAt,
      userQuestId: params.userQuestId,
      title: 'Time is up',
      body: `${params.stepTitle}. Tap for the next step.`,
    });
    await holdOthersUntil(params.endsAt);
  } catch {
    // ignore
  }
}

export async function cancelTimerDone(userQuestId: string): Promise<void> {
  if (!supported) return;
  await Notifications.cancelScheduledNotificationAsync(idFor('timer', userQuestId)).catch(
    () => undefined
  );
}

/** When a quest is finished or set aside, nothing about it should still arrive. */
export async function cancelQuestNotifications(userQuestId: string): Promise<void> {
  if (!supported) return;
  await Promise.all(
    (['quest-day', 'timer'] as const).map((k) =>
      Notifications.cancelScheduledNotificationAsync(idFor(k, userQuestId)).catch(() => undefined)
    )
  );
}

async function scheduledQuestNotifications(): Promise<QuestNotificationData[]> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  return all
    .map((n) => n.content.data as Partial<QuestNotificationData> | undefined)
    .filter((d): d is QuestNotificationData => !!d && (d.kind === 'quest-day' || d.kind === 'timer'));
}

async function runningTimerEnd(): Promise<number | null> {
  const timers = (await scheduledQuestNotifications()).filter(
    (d) => d.kind === 'timer' && d.at > Date.now()
  );
  return timers.length ? Math.max(...timers.map((d) => d.at)) : null;
}

/** R2-21: nothing else interrupts while a timer runs — anything due before it ends waits until after. */
async function holdOthersUntil(endsAt: number): Promise<void> {
  const due = (await scheduledQuestNotifications()).filter(
    (d) => d.kind === 'quest-day' && d.at < endsAt
  );
  for (const d of due) await schedule({ ...d, at: endsAt + 60_000 });
}

/** Switching to "Timers only": quest-day notifications already scheduled must not still arrive. */
export async function cancelQuestDayNotifications(): Promise<void> {
  if (!supported) return;
  const due = (await scheduledQuestNotifications()).filter((d) => d.kind === 'quest-day');
  await Promise.all(
    due.map((d) =>
      Notifications.cancelScheduledNotificationAsync(idFor('quest-day', d.userQuestId)).catch(
        () => undefined
      )
    )
  );
}

/** Signing out or wiping progress: nothing scheduled may outlive the quests it points at. */
export async function cancelAllQuestNotifications(): Promise<void> {
  if (!supported) return;
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => undefined);
}
