// Scenario tests for the round-2 offer logic in src/features/quests/suggestedQuests.ts.
// Run: node --test <this file>
import { test } from 'node:test';
import assert from 'node:assert/strict';

const mod = await import('../../src/features/quests/suggestedQuests.ts');
const {
  openQuestsInCategory,
  currentlyDismissedQuestIds,
  newlyOpenedQuestIds,
  likedQuestsInCategory,
  preferredTimeframeFromHistory,
  isPausedQuest,
} = mod;

// Ten quests in one category, like the real catalogue. Ordered by duration so
// the "fresh user" five is q1..q5 deterministically.
const CAT = 'cat-nature';
const catalog = Array.from({ length: 10 }, (_, i) => ({
  id: `q${i + 1}`,
  title: `Quest ${i + 1}`,
  categoryId: CAT,
  timeframe: 'weekly',
  difficulty: 'easy',
  estimatedDurationMinutes: 10 + i,
  isActive: true,
  actionSteps: [],
}));
const other = { ...catalog[0], id: 'x1', categoryId: 'cat-social' };
const fullCatalog = [...catalog, other];

let n = 0;
const DAY = 86400000;
const NOW = Date.parse('2026-09-21T12:00:00Z');
const iso = (msAgo: number) => new Date(NOW - msAgo).toISOString();
function row(questId: string, status: string, extra: Record<string, unknown> = {}) {
  return {
    id: `uq${++n}`,
    questId,
    status,
    startedAt: iso(10 * DAY),
    completedAt: null,
    dismissedAt: null,
    savedAt: null,
    note: null,
    photoUri: null,
    stepProgress: {},
    ...extra,
  };
}
const open = (userQuests: unknown[]) =>
  openQuestsInCategory({ catalog: fullCatalog, userQuests, categoryId: CAT, now: NOW }).map(
    (q: { id: string }) => q.id
  );

test('fresh user sees the first five', () => {
  assert.deepEqual(open([]), ['q1', 'q2', 'q3', 'q4', 'q5']);
});

test('turning a quest down removes it and opens the next — no 30-day comeback', () => {
  const uqs = [row('q1', 'dismissed', { dismissedAt: iso(40 * DAY), startedAt: iso(40 * DAY) })];
  // 40 days later it would have returned under the old flat 30-day rule.
  assert.deepEqual(open(uqs), ['q2', 'q3', 'q4', 'q5', 'q6']);
});

test('rejected quest does NOT return while something un-rejected is left undone', () => {
  const uqs = [
    row('q1', 'dismissed', { dismissedAt: iso(DAY) }),
    // Completed long ago (past the 14-day weekly horizon) for q2..q9, but not q10.
    ...['q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9'].map((id) =>
      row(id, 'completed', { completedAt: iso(30 * DAY) })
    ),
  ];
  assert.ok(!open(uqs).includes('q1'), 'q1 must stay hidden while q10 is not done');
});

test('rejected quest returns once everything else in the category was completed', () => {
  const uqs = [
    row('q1', 'dismissed', { dismissedAt: iso(DAY) }),
    ...catalog
      .slice(1)
      .map((q) => row(q.id, 'completed', { completedAt: iso(2 * DAY) })),
  ];
  // Everything else was just completed (inside the horizon) — only q1 is left.
  assert.deepEqual(open(uqs), ['q1']);
});

test('return is counted per category — another category does not matter', () => {
  const uqs = [
    row('q1', 'dismissed', { dismissedAt: iso(DAY) }),
    ...catalog.slice(1).map((q) => row(q.id, 'completed', { completedAt: iso(2 * DAY) })),
    // Nothing done in cat-social; must not block the Nature comeback.
  ];
  assert.deepEqual(open(uqs), ['q1']);
});

test('a liked quest is taken, not on offer — rejected ones come back (round 2b)', () => {
  const uqs = [
    row('q1', 'dismissed', { dismissedAt: iso(DAY) }),
    row('q2', 'saved_for_later', { savedAt: iso(DAY) }),
    ...catalog.slice(2).map((q) => row(q.id, 'completed', { completedAt: iso(2 * DAY) })),
  ];
  assert.deepEqual(open(uqs), ['q1']);
});

test('three in motion, the rest turned down: the category is not left empty (round 2b)', () => {
  const uqs = [
    ...['q1', 'q2', 'q3'].map((id) => row(id, 'active')),
    ...catalog.slice(3).map((q) => row(q.id, 'dismissed', { dismissedAt: iso(DAY) })),
  ];
  assert.deepEqual(open(uqs), ['q4', 'q5', 'q6', 'q7', 'q8']);
});

test('turning down one of the five still opens an un-rejected quest first', () => {
  const uqs = [
    ...['q1', 'q2', 'q3'].map((id) => row(id, 'active')),
    row('q4', 'dismissed', { dismissedAt: iso(DAY) }),
  ];
  assert.deepEqual(open(uqs), ['q5', 'q6', 'q7', 'q8', 'q9']);
});

test('returned-then-started quest is no longer counted as dismissed', () => {
  const uqs = [
    row('q1', 'dismissed', { dismissedAt: iso(5 * DAY), startedAt: iso(5 * DAY) }),
    row('q1', 'active', { startedAt: iso(DAY) }),
  ];
  assert.ok(!currentlyDismissedQuestIds(uqs).has('q1'));
});

test('re-dismissing after a later completion counts again', () => {
  const uqs = [
    row('q1', 'dismissed', { dismissedAt: iso(20 * DAY), startedAt: iso(20 * DAY) }),
    row('q1', 'completed', { startedAt: iso(15 * DAY), completedAt: iso(10 * DAY) }),
    row('q1', 'dismissed', { dismissedAt: iso(DAY), startedAt: iso(DAY) }),
  ];
  assert.ok(currentlyDismissedQuestIds(uqs).has('q1'));
});

test('NEW: the quest that slides in after you take one on is newly opened', () => {
  const uqs = [row('q1', 'active')];
  const ids = newlyOpenedQuestIds({ catalog: fullCatalog, userQuests: uqs, categoryId: CAT, now: NOW });
  assert.deepEqual([...ids], ['q6']);
});

test('NEW: the first five of a fresh user are never "newly opened"', () => {
  const ids = newlyOpenedQuestIds({ catalog: fullCatalog, userQuests: [], categoryId: CAT, now: NOW });
  assert.equal(ids.size, 0);
});

test('NEW: a rejected quest coming back is not badged as new', () => {
  const uqs = [
    row('q7', 'dismissed', { dismissedAt: iso(DAY) }),
    ...catalog
      .filter((q) => q.id !== 'q7')
      .map((q) => row(q.id, 'completed', { completedAt: iso(2 * DAY) })),
  ];
  assert.deepEqual(open(uqs), ['q7']);
  const ids = newlyOpenedQuestIds({ catalog: fullCatalog, userQuests: uqs, categoryId: CAT, now: NOW });
  assert.ok(!ids.has('q7'));
});

test('NEW: a quest returning after its completion horizon is not new', () => {
  // q1 completed 30 days ago (weekly horizon 14 days) → back in the pool; q2 active.
  const uqs = [row('q1', 'completed', { completedAt: iso(30 * DAY) }), row('q2', 'active')];
  const ids = newlyOpenedQuestIds({ catalog: fullCatalog, userQuests: uqs, categoryId: CAT, now: NOW });
  assert.ok(!ids.has('q1'));
  assert.deepEqual([...ids], ['q6']);
});

// A like is one insert: started_at and saved_at are the same moment (saveQuestForLater).
const like = (questId: string, msAgo: number) =>
  row(questId, 'saved_for_later', { savedAt: iso(msAgo), startedAt: iso(msAgo) });
// A pause keeps the original start and stamps saved_at later (moveActiveQuestToLater).
const pause = (questId: string, startedAgo: number, pausedAgo: number, extra = {}) =>
  row(questId, 'saved_for_later', { startedAt: iso(startedAgo), savedAt: iso(pausedAgo), ...extra });

test('liked quests: listed in their category, newest first, not taking a slot', () => {
  const uqs = [like('q3', 3 * DAY), like('q1', DAY), like('x1', DAY)];
  const liked = likedQuestsInCategory({
    catalog: fullCatalog,
    userQuests: uqs,
    categoryId: CAT,
    hasProgress: () => false,
  }).map((r: { quest: { id: string } }) => r.quest.id);
  assert.deepEqual(liked, ['q1', 'q3']);
  assert.deepEqual(open(uqs), ['q2', 'q4', 'q5', 'q6', 'q7'], 'five open slots remain');
});

test('liked: a quest paused mid-way is not shown as liked', () => {
  const uqs = [row('q1', 'saved_for_later', { savedAt: iso(DAY) })];
  const liked = likedQuestsInCategory({
    catalog: fullCatalog,
    userQuests: uqs,
    categoryId: CAT,
    hasProgress: () => true,
  });
  assert.equal(liked.length, 0);
});

// --- Ranking now reads behaviour, not an onboarding answer (2026-09-23) ---

test('no completions yet: no level leaning at all', () => {
  const uqs = [row('q1', 'active'), row('q2', 'saved_for_later', { savedAt: iso(DAY) })];
  assert.equal(preferredTimeframeFromHistory(uqs, fullCatalog), null);
});

test('the level someone actually finishes is the one we lean toward', () => {
  const monthly = { ...catalog[0], id: 'm1', timeframe: 'monthly' };
  const cat = [...fullCatalog, monthly];
  const uqs = [
    row('q1', 'completed', { completedAt: iso(3 * DAY) }),
    row('q2', 'completed', { completedAt: iso(2 * DAY) }),
    row('m1', 'completed', { completedAt: iso(DAY) }),
  ];
  assert.equal(preferredTimeframeFromHistory(uqs, cat), 'weekly');
});

test('a tie leans nowhere — better no guess than a coin flip', () => {
  const monthly = { ...catalog[0], id: 'm1', timeframe: 'monthly' };
  const cat = [...fullCatalog, monthly];
  const uqs = [
    row('q1', 'completed', { completedAt: iso(2 * DAY) }),
    row('m1', 'completed', { completedAt: iso(DAY) }),
  ];
  assert.equal(preferredTimeframeFromHistory(uqs, cat), null);
});

test('starting something is a wish, not evidence: only completions count', () => {
  const monthly = { ...catalog[0], id: 'm1', timeframe: 'monthly' };
  const cat = [...fullCatalog, monthly];
  const uqs = [row('m1', 'active'), row('q1', 'completed', { completedAt: iso(DAY) })];
  assert.equal(preferredTimeframeFromHistory(uqs, cat), 'weekly');
});

// --- "Can't do this where I live" (R2-27, 2026-09-26) ---

const openWith = (userQuests: unknown[], unavailable: string[]) =>
  openQuestsInCategory({
    catalog: fullCatalog,
    userQuests,
    categoryId: CAT,
    now: NOW,
    unavailableQuestIds: new Set(unavailable),
  }).map((q: { id: string }) => q.id);

test('unavailable: the quest is never offered and the next one takes its place', () => {
  assert.deepEqual(openWith([], ['q1']), ['q2', 'q3', 'q4', 'q5', 'q6']);
});

test('unavailable: does not hold up the return of turned-down quests', () => {
  // q1 turned down, q2 unavailable here, everything else completed recently.
  const uqs = [
    row('q1', 'dismissed', { dismissedAt: iso(DAY) }),
    ...catalog
      .filter((q) => q.id !== 'q1' && q.id !== 'q2')
      .map((q) => row(q.id, 'completed', { completedAt: iso(2 * DAY) })),
  ];
  // Without the exclusion q2 would count as "not done" and q1 would stay hidden forever.
  assert.deepEqual(openWith(uqs, ['q2']), ['q1']);
});

test('unavailable: only affects the category it is in', () => {
  const social = openQuestsInCategory({
    catalog: fullCatalog,
    userQuests: [],
    categoryId: 'cat-social',
    now: NOW,
    unavailableQuestIds: new Set(['q1']),
  }).map((q: { id: string }) => q.id);
  assert.deepEqual(social, ['x1']);
});

test('paused vs liked: a like is not a pause, a pause is not a like (round 2b)', () => {
  assert.equal(isPausedQuest(like('q1', DAY)), false);
  assert.equal(isPausedQuest(pause('q2', 3 * DAY, DAY)), true);
  // Paused minutes after starting still counts.
  assert.equal(isPausedQuest(pause('q3', 10 * 60 * 1000, 5 * 60 * 1000)), true);
  // Not set aside at all.
  assert.equal(isPausedQuest(row('q4', 'active')), false);
  // No saved_at (a very old row): cannot tell, so it stays where it always was.
  assert.equal(isPausedQuest(row('q5', 'saved_for_later', { savedAt: null })), false);
});

test('liked: a quest paused before its first step is not shown as liked (round 2b)', () => {
  const uqs = [like('q1', DAY), pause('q2', 3 * DAY, DAY)];
  const liked = likedQuestsInCategory({
    catalog: fullCatalog,
    userQuests: uqs,
    categoryId: CAT,
    hasProgress: () => false,
  }).map((r: { quest: { id: string } }) => r.quest.id);
  assert.deepEqual(liked, ['q1']);
});
