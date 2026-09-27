// Unit tests for the code-review fixes of 2026-09-27: reading stored photo references, and
// finding the quest's event in the person's calendar.
// Run: npm run test:unit
import { test } from 'node:test';
import assert from 'node:assert/strict';

const { photoPathFromRef } = await import('../../src/features/memories/photoRef.ts');
const { earliestUpcomingStart } = await import('../../src/features/quests/calendarMatch.ts');

const USER = '52d168bc-4059-4c81-9115-2cea9f147075';

test('photo ref: a stored path is the path', () => {
  assert.equal(photoPathFromRef(`${USER}/1727430000000-abc.jpg`), `${USER}/1727430000000-abc.jpg`);
});

test('photo ref: an old one-year signed URL gives back its path', () => {
  const url =
    `https://xyz.supabase.co/storage/v1/object/sign/quest-memory-photos/${USER}/1727430000000-abc.jpg` +
    '?token=eyJhbGciOiJIUzI1NiJ9.x.y';
  assert.equal(photoPathFromRef(url), `${USER}/1727430000000-abc.jpg`);
});

test('photo ref: percent-encoded characters in an old URL are decoded', () => {
  const url = `https://xyz.supabase.co/storage/v1/object/sign/quest-memory-photos/${USER}/a%20b.jpg?token=t`;
  assert.equal(photoPathFromRef(url), `${USER}/a b.jpg`);
});

test('photo ref: nothing, blank, local files and foreign URLs have no path', () => {
  assert.equal(photoPathFromRef(null), null);
  assert.equal(photoPathFromRef(''), null);
  assert.equal(photoPathFromRef('   '), null);
  assert.equal(photoPathFromRef('file:///data/user/0/cache/photo.jpg'), null);
  assert.equal(photoPathFromRef('https://example.com/photo.jpg'), null);
});

const NOW = new Date('2026-09-27T12:00:00Z');
const TITLE = 'Jump off something high: Put it on your calendar';

test('calendar: the soonest upcoming event with the exact title', () => {
  const events = [
    { title: TITLE, startDate: '2026-10-20T08:00:00Z' },
    { title: TITLE, startDate: '2026-10-05T08:00:00Z' },
    { title: 'Dentist', startDate: '2026-09-28T08:00:00Z' },
  ];
  assert.equal(earliestUpcomingStart(events, TITLE, NOW)?.toISOString(), '2026-10-05T08:00:00.000Z');
});

test('calendar: past events and other titles do not count', () => {
  const events = [
    { title: TITLE, startDate: '2026-09-20T08:00:00Z' },
    { title: `${TITLE} (moved)`, startDate: '2026-10-01T08:00:00Z' },
  ];
  assert.equal(earliestUpcomingStart(events, TITLE, NOW), null);
});

test('calendar: surrounding spaces in a title are ignored', () => {
  const events = [{ title: `  ${TITLE} `, startDate: '2026-10-01T08:00:00Z' }];
  assert.equal(earliestUpcomingStart(events, TITLE, NOW)?.toISOString(), '2026-10-01T08:00:00.000Z');
});
