// When the feedback pop-up may ask on its own (task 60): three days, something done, twice at most.
// Run: node --test <this file>
import { test } from 'node:test';
import assert from 'node:assert/strict';

const {
  EMPTY_FEEDBACK_PROMPT_STATE: EMPTY,
  ASK_AGAIN_AFTER_MS,
  isFeedbackPromptDue,
  parseFeedbackPromptState,
  withAsk,
  withOpenDay,
  withSent,
} = await import('../../src/features/feedback/feedbackPromptRules.ts');

const at = (iso: string) => new Date(iso);
const DAY = 24 * 60 * 60 * 1000;

function openedOn(...isos: string[]) {
  return isos.reduce((s, iso) => withOpenDay(s, at(iso)), EMPTY);
}

const threeDays = openedOn('2026-10-20T09:00:00', '2026-10-21T09:00:00', '2026-10-22T09:00:00');
const now = at('2026-10-22T18:00:00').getTime();

test('three opens in one afternoon count as one day', () => {
  const s = openedOn('2026-10-20T13:00:00', '2026-10-20T15:00:00', '2026-10-20T17:30:00');
  assert.deepEqual(s.openDays, ['2026-10-20']);
  assert.equal(isFeedbackPromptDue(s, true, now), false);
});

test('a late-evening open and the next morning are two days, in local time', () => {
  const s = openedOn('2026-10-20T23:50:00', '2026-10-21T00:10:00');
  assert.equal(s.openDays.length, 2);
});

test('due after three different days, but only once something was done', () => {
  assert.equal(
    isFeedbackPromptDue(openedOn('2026-10-20T09:00:00', '2026-10-21T09:00:00'), true, now),
    false
  );
  assert.equal(isFeedbackPromptDue(threeDays, false, now), false);
  assert.equal(isFeedbackPromptDue(threeDays, true, now), true);
});

test('after "Not now" it waits 30 days, then asks once more, then never again', () => {
  const once = withAsk(threeDays, now);
  assert.equal(isFeedbackPromptDue(once, true, now + 29 * DAY), false);
  assert.equal(isFeedbackPromptDue(once, true, now + ASK_AGAIN_AFTER_MS), true);
  const twice = withAsk(once, now + ASK_AGAIN_AFTER_MS);
  assert.equal(isFeedbackPromptDue(twice, true, now + 400 * DAY), false);
});

test('once feedback was sent it never asks, even before the first ask', () => {
  assert.equal(isFeedbackPromptDue(withSent(threeDays), true, now), false);
  assert.equal(isFeedbackPromptDue(withSent(withAsk(threeDays, now)), true, now + 60 * DAY), false);
});

test('only the first three days are kept — the list does not grow for ever', () => {
  const s = withOpenDay(threeDays, at('2026-10-25T09:00:00'));
  assert.equal(s, threeDays);
});

test('a damaged stored value reads as a fresh start instead of throwing', () => {
  assert.deepEqual(parseFeedbackPromptState('not json'), EMPTY);
  assert.deepEqual(parseFeedbackPromptState('null'), EMPTY);
  assert.deepEqual(parseFeedbackPromptState(null), EMPTY);
  const partial = parseFeedbackPromptState('{"asks":1,"openDays":["2026-10-20",4]}');
  assert.deepEqual(partial, {
    openDays: ['2026-10-20'],
    asks: 1,
    lastAskedAt: null,
    sent: false,
  });
});

test('a stored round trip keeps every field', () => {
  const s = withSent(withAsk(threeDays, now));
  assert.deepEqual(parseFeedbackPromptState(JSON.stringify(s)), s);
});
