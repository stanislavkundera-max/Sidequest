import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

import { earliestUpcomingStart } from '@/src/features/quests/calendarMatch';
import type { QuestTimeframe } from '@/src/types/quest';

/**
 * Calendar event creation exists on native only. Web/static export treats this as unavailable.
 */
export async function isDeviceCalendarCreationAvailable(): Promise<boolean> {
  try {
    return await Calendar.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function ensureCalendarWritePermission(): Promise<boolean> {
  const existing = await Calendar.getCalendarPermissionsAsync();
  if (existing.status === 'granted') return true;
  const requested = await Calendar.requestCalendarPermissionsAsync();
  return requested.status === 'granted';
}

/**
 * A starting suggestion for when to do the quest — the person changes it in
 * their calendar anyway. Follows what the level means (R2-23: how much planning
 * it takes): an "Anytime" quest tomorrow, "Plan ahead" in a week, a "Big
 * occasion" in a month. Always 10:00 local, a time nobody has to fix at night.
 */
export function suggestedQuestStart(timeframe: QuestTimeframe, now: Date = new Date()): Date {
  const daysAhead = timeframe === 'weekly' ? 1 : timeframe === 'monthly' ? 7 : 30;
  const start = new Date(now);
  start.setDate(start.getDate() + daysAhead);
  start.setHours(10, 0, 0, 0);
  return start;
}

export type QuestCalendarEditorResult =
  /** iOS reports the save and the event id. */
  | { outcome: 'saved'; eventId: string }
  | { outcome: 'canceled' }
  /** Android never says whether the person saved — only that the editor closed. */
  | { outcome: 'unknown' };

/**
 * Opens the phone's own "new event" editor, prefilled, so the person picks the
 * day and time themselves — and gets their usual calendar reminder with it.
 *
 * This replaced silently creating an event 15 minutes from now, which left no
 * way to choose a day: plan a trip for next month and it landed in a quarter of
 * an hour (round 2, R2-02: "Rovnou to uloží aktivitu na tu dobu, člověk si
 * nemůže vybrat den"). On Android it is a plain intent into the calendar app, so
 * it needs no calendar permission at all.
 */
export async function openQuestCalendarEditor(params: {
  title: string;
  notes?: string;
  durationMinutes: number;
  suggestedStart: Date;
}): Promise<QuestCalendarEditorResult> {
  if (Platform.OS === 'ios') {
    const ok = await ensureCalendarWritePermission();
    if (!ok) throw new Error('Calendar permission denied.');
  }
  const duration = Math.max(5, Math.floor(params.durationMinutes));
  const startDate = params.suggestedStart;
  const endDate = new Date(startDate.getTime() + duration * 60_000);

  // Android: open the editor inside our task, not as a new one (the library default). As a new task
  // the promise resolved the moment the calendar opened, and saving left you in the calendar app with
  // no way back into the step (Standa, 2026-09-26). In our task, saving or backing out closes the
  // editor and lands you back on the step, and only then do we ask whether it was saved.
  const result = await Calendar.createEventInCalendarAsync(
    {
      title: params.title.trim(),
      notes: params.notes?.trim(),
      startDate,
      endDate,
      allDay: false,
    },
    { startNewActivityTask: false }
  );
  if (result.action === 'saved' && result.id) return { outcome: 'saved', eventId: result.id };
  if (result.action === 'canceled' || result.action === 'deleted') return { outcome: 'canceled' };
  return { outcome: 'unknown' };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * When the quest's event is, read back from the person's own calendar — for Android.
 *
 * Android's editor never says whether the event was saved, or for when: expo-calendar returns
 * the same empty result for every outcome. The reminder used to be scheduled from the time the
 * editor was *prefilled* with, and since build 11 its text names that time ("It's tomorrow") —
 * wrong for anyone who picked another day, which is the whole point of the editor (R2-02; code
 * review 2026-09-27). So once they say it's in, look for the event we prefilled, by its title,
 * and take its start.
 *
 * Asks for calendar access at that moment, not before. Without access, or if the title was
 * changed in the editor, there is no date — and no reminder is better than a wrong one; their
 * calendar still reminds them.
 */
export async function findSavedQuestEventStart(
  title: string,
  now: Date = new Date()
): Promise<Date | null> {
  try {
    const permission = await Calendar.requestCalendarPermissionsAsync();
    if (permission.status !== 'granted') return null;
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    if (calendars.length === 0) return null;
    const events = await Calendar.getEventsAsync(
      calendars.map((c) => c.id),
      now,
      new Date(now.getTime() + 400 * DAY_MS)
    );
    return earliestUpcomingStart(events, title, now);
  } catch {
    return null;
  }
}

/** When a saved event starts — iOS only, where the editor hands back the event id. */
export async function calendarEventStart(eventId: string): Promise<Date | null> {
  try {
    const ev = await Calendar.getEventAsync(eventId.trim());
    const start = ev?.startDate ? new Date(ev.startDate) : null;
    return start && !Number.isNaN(start.getTime()) ? start : null;
  } catch {
    return null;
  }
}
