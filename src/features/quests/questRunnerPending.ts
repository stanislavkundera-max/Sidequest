import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'sidequestlife:questRunnerCalendarPending';

export type PendingCalendarVerification = {
  userQuestId: string;
  stepId: string;
  eventId: string;
};

export async function readPendingCalendarVerification(): Promise<PendingCalendarVerification | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw?.trim()) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    const rec = parsed as Record<string, unknown>;
    const userQuestId = typeof rec.userQuestId === 'string' ? rec.userQuestId.trim() : '';
    const stepId = typeof rec.stepId === 'string' ? rec.stepId.trim() : '';
    const eventId = typeof rec.eventId === 'string' ? rec.eventId.trim() : '';
    if (!userQuestId || !stepId || !eventId) return null;
    return { userQuestId, stepId, eventId };
  } catch {
    return null;
  }
}

export async function writePendingCalendarVerification(
  value: PendingCalendarVerification
): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(value));
}

export async function clearPendingCalendarVerification(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

const OPENED_PREFIX = 'sidequestlife:calendarOpened:';

/**
 * Remembers that the calendar was already opened for a step, so the second tap offers to move on
 * instead of opening the calendar again (Standa, 2026-09-26: Android never says whether you saved).
 */
export async function markCalendarOpened(userQuestId: string, stepId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(OPENED_PREFIX + userQuestId + ':' + stepId, '1');
  } catch {
    // Worst case the calendar opens once more.
  }
}

export async function wasCalendarOpened(userQuestId: string, stepId: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(OPENED_PREFIX + userQuestId + ':' + stepId)) === '1';
  } catch {
    return false;
  }
}
