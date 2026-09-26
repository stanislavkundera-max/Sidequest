import AsyncStorage from '@react-native-async-storage/async-storage';

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
