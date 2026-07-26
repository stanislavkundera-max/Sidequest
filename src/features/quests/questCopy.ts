/** Calm quest path copy — avoid productivity / failure framing (see product spec). */

export const QUEST_COPY = {
  activePathFullTitle: 'Your path is full',
  activePathFullBody:
    'You can have three quests in motion at once. Pause one that is already active, then try again.',
  forLaterSectionTitle: 'Liked',
  activePathSectionTitle: 'Your active path',
  suggestedSectionTitle: 'Discover',
  chooseCategoryTitle: 'Choose a category',
  /** Journey hub — line under category name on hero. */
  categoryQuestCounts: (n: number) => (n === 1 ? '1 quest in this category' : `${n} quests in this category`),
  /** Journey hub — under category title when picks are grouped by cadence. */
  categoryHeroHint: 'Grouped by weekly, monthly, and yearly rhythm.',
  discoverTimeframeWeekly: 'Weekly',
  discoverTimeframeMonthly: 'Monthly',
  discoverTimeframeYearly: 'Yearly',
  discoverTimeframeQuestCounts: (n: number) =>
    n === 1 ? '1 quest in this rhythm' : `${n} quests in this rhythm`,
  newForYouTitle: 'New for you',
  likedTabLabel: 'Liked',
  discoverTabLabel: 'Discover',
  likedEmptyTitle: 'Nothing liked yet',
  likedEmptyBody:
    'When something from the category picks feels right for another day, tap the heart — it will land here.',
  /** Accessible hint on the Journey hub liked strip when empty. */
  openLikedHint: 'Tap for details',
  moveToLater: 'Let it wait',
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
  progressHubSectionTitle: 'Your path',
  progressScopeActive: 'Active',
  progressScopeCompleted: 'Completed',
  /** Progress hub — memories shortcut pill (opens Memories tab). */
  progressScopeMemories: 'Memories',
  progressEmptyActiveTitle: 'Nothing in motion',
  progressEmptyActiveSub: 'Pick a quest from Journey when you want a small nudge.',
  progressEmptyCompletedTitle: 'No finished quests yet',
  progressEmptyCompletedSub: 'Complete an active quest and it will land here.',
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
