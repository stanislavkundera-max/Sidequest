// Unit tests for picking a quest's day and time in the app before the calendar opens (2026-11-06).
// Run: npm run test:unit
import { test } from 'node:test';
import assert from 'node:assert/strict';

const {
  quickDayChoices,
  otherDayChoices,
  hoursFor,
  startOnDay,
  relativeDayLabel,
  startLabel,
  dayKey,
  OTHER_DAYS_AHEAD,
} = await import('../../src/features/quests/questStartChoice.ts');

// Thursday 5 Nov 2026, local time.
const thuMorning = new Date(2026, 10, 5, 9, 0);
const tomorrowAt10 = new Date(2026, 10, 6, 10, 0);

test('quick days: today, tomorrow, Saturday, a week, a month — in order', () => {
  const days = quickDayChoices(thuMorning, tomorrowAt10);
  assert.deepEqual(
    days.map((d) => [d.label, d.key]),
    [
      ['Today', '2026-11-05'],
      ['Tomorrow', '2026-11-06'],
      ['Saturday', '2026-11-07'],
      ['In a week', '2026-11-12'],
      ['In a month', '2026-12-05'],
    ]
  );
});

test('quick days: no Today once no time is left today', () => {
  const late = new Date(2026, 10, 5, 19, 30);
  const days = quickDayChoices(late, tomorrowAt10);
  assert.equal(days[0].label, 'Tomorrow');
});

test('quick days: on a Friday or Saturday there is no separate Saturday chip', () => {
  const fri = new Date(2026, 10, 6, 9, 0);
  const days = quickDayChoices(fri, new Date(2026, 10, 7, 10, 0));
  const keys = days.map((d) => d.key);
  assert.ok(keys.includes('2026-11-07')); // tomorrow, a Saturday
  assert.equal(days.find((d) => d.label === 'Saturday'), undefined);
  const sat = quickDayChoices(new Date(2026, 10, 7, 9), new Date(2026, 10, 8, 10));
  assert.equal(sat.find((d) => d.label === 'Saturday'), undefined);
  assert.equal(new Set(keys).size, keys.length, 'no day twice');
});

test('quick days: a suggested day outside the chips is added', () => {
  const suggested = new Date(2026, 10, 20, 10, 0);
  const days = quickDayChoices(thuMorning, suggested);
  assert.ok(days.some((d) => d.key === '2026-11-20'));
});

test('hours: all of them on a later day, only those an hour away today', () => {
  assert.deepEqual(hoursFor(tomorrowAt10, thuMorning), [8, 10, 12, 15, 18, 20]);
  assert.deepEqual(hoursFor(thuMorning, thuMorning), [10, 12, 15, 18, 20]);
  assert.deepEqual(hoursFor(thuMorning, new Date(2026, 10, 5, 9, 30)), [12, 15, 18, 20]);
});

test('moving to another day keeps the hour, or takes the first one left today', () => {
  const at18 = new Date(2026, 10, 6, 18, 0);
  assert.equal(startOnDay(new Date(2026, 10, 12), at18, thuMorning)?.getTime(), new Date(2026, 10, 12, 18).getTime());
  const at8 = new Date(2026, 10, 6, 8, 0);
  assert.equal(startOnDay(thuMorning, at8, thuMorning)?.getTime(), new Date(2026, 10, 5, 10).getTime());
  assert.equal(startOnDay(thuMorning, at8, new Date(2026, 10, 5, 19, 30)), null);
});

test('other days: tomorrow onwards, one per day', () => {
  const days = otherDayChoices(thuMorning);
  assert.equal(days.length, OTHER_DAYS_AHEAD);
  assert.equal(days[0].key, '2026-11-06');
  assert.equal(days[0].label, 'Fri 6 Nov');
  assert.equal(dayKey(days[1].day), '2026-11-07');
});

test('labels', () => {
  assert.equal(relativeDayLabel(thuMorning, thuMorning), 'Today');
  assert.equal(relativeDayLabel(tomorrowAt10, thuMorning), 'Tomorrow');
  assert.equal(relativeDayLabel(new Date(2026, 10, 10), thuMorning), 'Tuesday');
  assert.equal(relativeDayLabel(new Date(2026, 10, 12), thuMorning), 'Thu 12 Nov');
  assert.equal(startLabel(tomorrowAt10, thuMorning), 'Tomorrow at 10:00');
});
