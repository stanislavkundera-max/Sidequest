// The daily journaling question (task 57): a new one every calendar day, in the phone's own time.
// Run: node --test <this file>   (TZ is set per test run below where it matters)
import { test } from 'node:test';
import assert from 'node:assert/strict';

const { DAILY_PROMPTS, dailyPromptFor } = await import('../../src/constants/dailyPrompts.ts');

const at = (iso: string) => new Date(iso);

test('the question changes from one day to the next, for a whole year', () => {
  const start = at('2026-01-01T12:00:00');
  for (let d = 0; d < 366; d += 1) {
    const today = new Date(start.getTime() + d * 86400000);
    const tomorrow = new Date(today.getTime() + 86400000);
    assert.notEqual(dailyPromptFor(today), dailyPromptFor(tomorrow), `day ${d}`);
  }
});

test('the same all day long — early morning and late evening of one date', () => {
  assert.equal(dailyPromptFor(at('2026-10-17T00:01:00')), dailyPromptFor(at('2026-10-17T23:59:00')));
});

test('it turns over at local midnight, not at UTC midnight', () => {
  // With TZ=Europe/Prague (UTC+2 in October) local midnight is 22:00 UTC.
  assert.notEqual(dailyPromptFor(at('2026-10-17T23:59:00')), dailyPromptFor(at('2026-10-18T00:01:00')));
});

test('across the daylight-saving change the days still turn over once each', () => {
  // Europe: clocks go back on 2026-10-25.
  const a = dailyPromptFor(at('2026-10-24T12:00:00'));
  const b = dailyPromptFor(at('2026-10-25T12:00:00'));
  const c = dailyPromptFor(at('2026-10-26T12:00:00'));
  assert.notEqual(a, b);
  assert.notEqual(b, c);
});

test('every question comes round, and none twice within one cycle', () => {
  const start = at('2026-03-01T12:00:00');
  const seen = new Set<string>();
  for (let d = 0; d < DAILY_PROMPTS.length; d += 1) {
    seen.add(dailyPromptFor(new Date(start.getTime() + d * 86400000)));
  }
  assert.equal(seen.size, DAILY_PROMPTS.length);
});
