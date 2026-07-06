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
