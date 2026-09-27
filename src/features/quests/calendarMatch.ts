/**
 * Finding the quest's event among the person's calendar events. Pure — no expo-calendar — so it
 * can be unit tested (tests/unit/photo-and-calendar.test.mts); `findSavedQuestEventStart` in
 * questCalendar.ts does the reading.
 */

/** The soonest event still ahead with exactly this title. */
export function earliestUpcomingStart(
  events: { title?: string | null; startDate: string | Date }[],
  title: string,
  now: Date
): Date | null {
  const wanted = title.trim();
  const starts = events
    .filter((e) => (e.title ?? '').trim() === wanted)
    .map((e) => new Date(e.startDate))
    .filter((d) => !Number.isNaN(d.getTime()) && d.getTime() > now.getTime())
    .sort((a, b) => a.getTime() - b.getTime());
  return starts[0] ?? null;
}
