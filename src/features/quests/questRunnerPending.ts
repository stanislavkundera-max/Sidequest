import AsyncStorage from '@react-native-async-storage/async-storage';

import { readForUser, writeForUser } from '@/src/lib/deviceStorage';

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

const LOOKUPS_KEY = 'sidequestlife:calendarLookups';

/** Give up on an event nobody saved (they backed out, or renamed it) after this long. */
const LOOKUP_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/** A calendar step whose event day the app has not read back yet (Android, task 5). */
export type PendingCalendarLookup = {
  userQuestId: string;
  questId: string;
  questTitle: string;
  /** The title the event was prefilled with — how it is found again. */
  eventTitle: string;
  openedAt: number;
};

async function readLookups(): Promise<PendingCalendarLookup[]> {
  try {
    const raw = await readForUser(LOOKUPS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as PendingCalendarLookup[]) : [];
  } catch {
    return [];
  }
}

async function writeLookups(lookups: PendingCalendarLookup[]): Promise<void> {
  try {
    await writeForUser(LOOKUPS_KEY, JSON.stringify(lookups));
  } catch {
    // Worst case no app reminder; their calendar still reminds them.
  }
}

export async function addPendingCalendarLookup(lookup: PendingCalendarLookup): Promise<void> {
  const others = (await readLookups()).filter((l) => l.userQuestId !== lookup.userQuestId);
  await writeLookups([...others, lookup]);
}

let resolving = false;

/**
 * Reads back the day of each calendar event saved since the app last looked, and schedules the
 * quest-day reminder for it. Runs when the app opens or comes back to the foreground: on Android
 * the calendar opens as its own app and nobody has to come back to the step for this to happen.
 *
 * A lookup stays until its event turns up, its quest is no longer in motion, or it is a month
 * old. It is skipped while the quests are not loaded yet, rather than dropped.
 */
export async function resolvePendingCalendarLookups(params: {
  isQuestActive: (userQuestId: string) => boolean | undefined;
  findEventStart: (eventTitle: string) => Promise<Date | null>;
  scheduleQuestDay: (p: {
    userQuestId: string;
    questId: string;
    questTitle: string;
    at: Date;
  }) => Promise<void>;
  now?: number;
}): Promise<void> {
  if (resolving) return;
  resolving = true;
  try {
    const lookups = await readLookups();
    if (lookups.length === 0) return;
    const now = params.now ?? Date.now();
    const keep: PendingCalendarLookup[] = [];
    for (const lookup of lookups) {
      if (now - lookup.openedAt > LOOKUP_MAX_AGE_MS) continue;
      const active = params.isQuestActive(lookup.userQuestId);
      if (active === undefined) {
        keep.push(lookup); // quests not loaded yet — try again next time
        continue;
      }
      if (!active) continue;
      const start = await params.findEventStart(lookup.eventTitle);
      if (!start) {
        keep.push(lookup);
        continue;
      }
      await params.scheduleQuestDay({
        userQuestId: lookup.userQuestId,
        questId: lookup.questId,
        questTitle: lookup.questTitle,
        at: start,
      });
    }
    await writeLookups(keep);
  } finally {
    resolving = false;
  }
}
