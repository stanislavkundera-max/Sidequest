import { format, getISOWeek, getISOWeekYear } from 'date-fns';

export function getDailyPeriodKey(d: Date = new Date()): string {
  return format(d, 'yyyy-MM-dd');
}

/** ISO week label e.g. 2026-W14 */
export function getWeeklyPeriodKey(d: Date = new Date()): string {
  const y = getISOWeekYear(d);
  const w = getISOWeek(d);
  return `${y}-W${String(w).padStart(2, '0')}`;
}
