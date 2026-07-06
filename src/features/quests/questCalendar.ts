import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

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

async function getWritableEventCalendarIdAsync(): Promise<string> {
  if (Platform.OS === 'ios') {
    const cal = await Calendar.getDefaultCalendarAsync();
    if (!cal?.id) throw new Error('No default calendar.');
    return cal.id;
  }
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const primaryWritable = calendars.find((c) => c.isPrimary && c.allowsModifications);
  const writable =
    primaryWritable ??
    calendars.find((c) => c.allowsModifications) ??
    calendars[0];
  if (!writable?.id) throw new Error('No calendar available.');
  return writable.id;
}

export type CreateQuestCalendarEventParams = {
  title: string;
  notes?: string;
  durationMinutes: number;
  /** Minutes from now until the suggested start time (rounded). Default 15. */
  startOffsetMinutes?: number;
};

/** Creates an event on a writable calendar. Returns stable event ID for verification. */
export async function createQuestCalendarEvent(params: CreateQuestCalendarEventParams): Promise<string> {
  const ok = await ensureCalendarWritePermission();
  if (!ok) throw new Error('Calendar permission denied.');

  const calendarId = await getWritableEventCalendarIdAsync();

  const startOffset = Math.max(1, Math.floor(params.startOffsetMinutes ?? 15));
  const startDate = new Date(Date.now() + startOffset * 60_000);
  startDate.setSeconds(0, 0);

  const duration = Math.max(5, Math.floor(params.durationMinutes));
  const endDate = new Date(startDate.getTime() + duration * 60_000);

  const eventId = await Calendar.createEventAsync(calendarId, {
    title: params.title.trim(),
    notes: params.notes?.trim(),
    startDate,
    endDate,
    allDay: false,
  });
  return eventId;
}

export async function calendarEventStillExists(eventId: string): Promise<boolean> {
  if (!eventId.trim()) return false;
  try {
    const ev = await Calendar.getEventAsync(eventId.trim());
    return Boolean(ev?.id);
  } catch {
    return false;
  }
}
