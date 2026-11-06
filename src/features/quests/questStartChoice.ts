/**
 * The day and time someone picks in the app for a calendar step, before their calendar opens.
 *
 * Android's calendar editor never says which day was saved, so the reminder used to wait until
 * the app was opened again and could read the event back — someone who saved and never came back
 * got no reminder at all (Standa, 2026-11-06). Picking the day here first means the reminder is
 * scheduled before the calendar even opens; the calendar is then prefilled with the same start.
 *
 * Pure — no React Native — so it can be unit tested (tests/unit/quest-start-choice.test.mts).
 */

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/** Whole hours offered as times; minutes can still be fine-tuned in the calendar itself. */
export const START_HOURS = [8, 10, 12, 15, 18, 20] as const;

/** A time today must be at least this far ahead to be offered. */
const TODAY_LEAD_MS = 60 * 60 * 1000;

/** How far ahead "Other day" reaches. */
export const OTHER_DAYS_AHEAD = 90;

export type DayChoice = {
  /** Local calendar day, `YYYY-MM-DD`. */
  key: string;
  label: string;
  /** Midnight, local time. */
  day: Date;
};

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export function dayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function sameDay(a: Date, b: Date): boolean {
  return dayKey(a) === dayKey(b);
}

/** "Fri 14 Nov" */
export function shortDateLabel(d: Date): string {
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "10:00" */
export function hourLabel(hour: number): string {
  return `${hour}:00`;
}

/** Today, Tomorrow, a weekday name within the coming week, otherwise "Fri 14 Nov". */
export function relativeDayLabel(day: Date, now: Date): string {
  const today = startOfDay(now);
  const diff = Math.round((startOfDay(day).getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff > 1 && diff < 7) return WEEKDAYS_LONG[day.getDay()];
  return shortDateLabel(day);
}

/** The hours still worth offering on `day`: all of them, or for today only those an hour away. */
export function hoursFor(day: Date, now: Date): number[] {
  if (!sameDay(day, now)) return [...START_HOURS];
  return START_HOURS.filter((h) => atHour(day, h).getTime() - now.getTime() >= TODAY_LEAD_MS);
}

export function atHour(day: Date, hour: number): Date {
  const x = startOfDay(day);
  x.setHours(hour, 0, 0, 0);
  return x;
}

/**
 * The quick day chips: Today (while a time is left), Tomorrow, the coming Saturday, in a week and
 * in a month — plus the suggested day if none of those is it. Sorted, no day twice.
 */
export function quickDayChoices(now: Date, suggested: Date): DayChoice[] {
  const today = startOfDay(now);
  const candidates: { day: Date; label: string }[] = [];
  if (hoursFor(today, now).length > 0) candidates.push({ day: today, label: 'Today' });
  candidates.push({ day: addDays(today, 1), label: 'Tomorrow' });
  // The coming Saturday — only when it is neither tomorrow nor today (those have their chips) and
  // not as far as "In a week".
  const toSaturday = (6 - today.getDay() + 7) % 7;
  if (toSaturday >= 2) candidates.push({ day: addDays(today, toSaturday), label: 'Saturday' });
  candidates.push({ day: addDays(today, 7), label: 'In a week' });
  candidates.push({ day: addDays(today, 30), label: 'In a month' });
  candidates.push({ day: startOfDay(suggested), label: relativeDayLabel(suggested, now) });

  const seen = new Set<string>();
  return candidates
    .filter((c) => c.day.getTime() >= today.getTime())
    .sort((a, b) => a.day.getTime() - b.day.getTime())
    .filter((c) => {
      const key = dayKey(c.day);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((c) => ({ key: dayKey(c.day), label: c.label, day: c.day }));
}

/** Every day from tomorrow to `OTHER_DAYS_AHEAD` days out, for "Other day". */
export function otherDayChoices(now: Date): DayChoice[] {
  const today = startOfDay(now);
  return Array.from({ length: OTHER_DAYS_AHEAD }, (_, i) => {
    const day = addDays(today, i + 1);
    return { key: dayKey(day), label: shortDateLabel(day), day };
  });
}

/**
 * Moves a start onto `day`, keeping its hour when that hour is still offered there, otherwise the
 * first one that is (today, late in the day). Null when the day has no time left.
 */
export function startOnDay(day: Date, current: Date, now: Date): Date | null {
  const hours = hoursFor(day, now);
  if (hours.length === 0) return null;
  const hour = hours.includes(current.getHours()) ? current.getHours() : hours[0];
  return atHour(day, hour);
}

/** "Sat 8 Nov at 10:00", or "Tomorrow at 10:00" — for copy that names the picked start. */
export function startLabel(start: Date, now: Date): string {
  return `${relativeDayLabel(start, now)} at ${start.getHours()}:${String(start.getMinutes()).padStart(2, '0')}`;
}
