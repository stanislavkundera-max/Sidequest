import type { QuestTimeframe } from '@/src/types/quest';

/** Calm quest path copy — avoid productivity / failure framing (see product spec). */

/**
 * What a quest's `timeframe` is called on screen — the one place it is named.
 *
 * It used to read Weekly / Monthly / Yearly. The mentor found that unintuitive
 * twice (rounds 1 and 2). Decided 2026-09-21 (R2-23): the level means **how
 * much planning a quest takes**, because that is what the catalogue already
 * encodes. Its outliers only make sense that way — a one-hour *yearly*
 * "reconnect with someone you lost touch with", a five-hour *weekly* "take the
 * next train out". Duration is shown separately on every card ("~5 h"), so
 * naming the level by duration would say the same thing twice.
 *
 * The stored values stay weekly / monthly / yearly — only the words change.
 * Onboarding's pace question still describes these in minutes and now
 * disagrees; that is logged in docs/feedback/round-2-tasklist.md, not fixed here.
 */
export const TIMEFRAME_LABEL: Record<QuestTimeframe, string> = {
  weekly: 'Anytime',
  monthly: 'Plan ahead',
  yearly: 'Big occasion',
};

/**
 * What each category is for — one short phrase, shown next to its name on the quest screen.
 *
 * The screen said what a quest *is* but never what the category gives you (Standa,
 * 2026-09-26). Kept to things you get, not feelings promised: rule 6 says the app names
 * the thing and does not tell you how it will make you feel, and rule 10 says the words
 * must match what happens. That is why Adventure does not say "adrenaline" (most of it is a
 * course, a train ride, a sign-up) and Social does not say "love" (it is calls, dinners and
 * invitations).
 */
export const CATEGORY_PROMISE: Record<string, string> = {
  'cat-adventure': 'new experiences, new hobbies',
  'cat-nature': 'quiet time outside',
  'cat-relax': 'time to rest',
  'cat-social': 'new people, closer friends',
};

export const QUEST_COPY = {
  activePathFullTitle: 'You already have three quests going',
  activePathFullBody:
    'You can have three quests going at once. Pause one of them, then try again.',
  forLaterSectionTitle: 'Liked',
  /**
   * Journey section for quests that were left mid-way. Kept separate from
   * `forLaterSectionTitle` ("Liked"): a half-finished quest and a never-started
   * wishlist quest are different things, and testers lost the former inside the
   * latter. Wording is deliberately descriptive so it is findable at a glance.
   */
  pausedSectionTitle: 'Pick up where you left off',
  /** Where a set-aside quest lands — depends on whether any step is already done. */
  leaveDestination: (hasProgress: boolean): string =>
    hasProgress
      ? 'You will find it in Progress under "Pick up where you left off".'
      : 'You will find it in Progress under Liked.',
  activePathSectionTitle: 'Quests you are doing',
  suggestedSectionTitle: 'Discover',
  chooseCategoryTitle: 'Choose a category',
  /** Journey hub — line under category name on hero. */
  categoryQuestCounts: (n: number) => (n === 1 ? '1 quest in this category' : `${n} quests in this category`),
  newForYouTitle: 'New for you',
  likedTabLabel: 'Liked',
  discoverTabLabel: 'Discover',
  likedEmptyTitle: 'Nothing liked yet',
  likedEmptyBody:
    'Tap the heart on a quest you want to keep for another day. It stays in its category, marked Liked.',
  /** Accessible hint on the Journey hub liked strip when empty. */
  openLikedHint: 'Tap for details',
  moveToLater: 'Pause this quest',
  saveForLater: 'Save for later',
  /** Journey hub — same action as save-for-later, warmer label. */
  likeQuest: 'Like',
  dismiss: 'Not for me',
  makeActive: 'Make active',
  startNow: 'Start now',
  continueQuest: 'Continue',
  /** Liked/saved-for-later card — shown instead of `startNow` once a step is already done. */
  resumeQuest: 'Resume',
  beginQuest: 'Begin',
  openQuest: 'Open',

  /** Progress hub — section title above Active / Completed chips. */
  progressHubSectionTitle: 'Your quests',
  progressScopeActive: 'Active',
  progressScopeCompleted: 'Completed',
  /** Progress hub — memories shortcut pill (opens Memories tab). */
  progressScopeMemories: 'Memories',
  progressEmptyActiveTitle: 'No quests going yet',
  progressEmptyActiveSub: 'Pick a quest from Journey when you want a small nudge.',
  progressEmptyCompletedTitle: 'No finished quests yet',
  progressEmptyCompletedSub: 'Finish a quest and it will show up here.',
  progressEmptyCategoryTitle: 'Nothing in this category',
  progressEmptyCategorySub: 'Try another category chip above.',
} as const;

/**
 * Human-readable quest length. Raw minutes ("720 min") read as abstract to
 * testers, so switch to hours above an hour: 45 -> "45 min", 90 -> "1 h 30 min",
 * 720 -> "12 h".
 */
export function formatQuestDuration(minutes: number): string {
  const m = Math.round(minutes);
  if (!Number.isFinite(m) || m <= 0) return '';
  if (m < 60) return `${m} min`;
  const hours = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${hours} h` : `${hours} h ${rem} min`;
}

/** Meta-line duration ("~12 h"), or '' when the duration is unknown — safe to join with `·`. */
export function questDurationLabel(minutes: number): string {
  const d = formatQuestDuration(minutes);
  return d ? `~${d}` : '';
}

/**
 * How long a quest takes, in ordinary words — "45 minutes", "5 hours", "1 hour 30 minutes".
 * The quest screen uses this; cards keep the compact "~5 h". Empty when unknown.
 */
export function questDurationWords(minutes: number): string {
  const m = Math.round(minutes);
  if (!Number.isFinite(m) || m <= 0) return '';
  const unit = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`;
  if (m < 60) return unit(m, 'minute');
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? unit(h, 'hour') : `${unit(h, 'hour')} ${unit(rem, 'minute')}`;
}
