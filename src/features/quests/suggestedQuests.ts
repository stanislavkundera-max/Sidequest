import type {
  OnboardingIntensity,
  OnboardingPace,
  OnboardingPreferences,
} from '@/src/features/onboarding/types';
import type { Quest, QuestTimeframe, UserQuest } from '@/src/types/quest';

export type SuggestedGroupId = 'do_now' | 'low_energy' | 'outside' | 'social' | 'weekend';

/** Soonest cadence first, as a last tie-break. */
const TIMEFRAME_RANK: Record<QuestTimeframe, number> = {
  weekly: 0,
  monthly: 1,
  yearly: 2,
};

/** Pace answer → the quest cadence we lean toward. */
const PACE_TIMEFRAME: Record<OnboardingPace, QuestTimeframe> = {
  quick: 'weekly',
  steady: 'monthly',
  deep: 'yearly',
};

/** Intensity answer → nudge toward quests whose difficulty matches the stretch. */
function intensityScore(quest: Quest, intensity: OnboardingIntensity): number {
  switch (intensity) {
    case 'bold':
      return quest.difficulty === 'hard' ? 2 : quest.difficulty === 'medium' ? 1 : 0;
    case 'light':
      return (
        (quest.difficulty === 'easy' ? 2 : 0) +
        (quest.suggestedGroup === 'low_energy' ? 1 : 0)
      );
    case 'balanced':
    default:
      return quest.difficulty === 'medium' ? 1 : 0;
  }
}

/** Onboarding answers → a soft relevance score for a quest (higher = better fit). */
export function scoreQuestForPreferences(
  quest: Quest,
  preferences: OnboardingPreferences,
  preferredCategoryIds?: Set<string>
): number {
  const preferredIds =
    preferredCategoryIds ?? new Set(preferences.categories.map((c) => `cat-${c}`));
  let score = 0;
  if (preferredIds.has(quest.categoryId)) score += 3;
  if (quest.timeframe === PACE_TIMEFRAME[preferences.pace]) score += 2;
  score += intensityScore(quest, preferences.intensity);
  return score;
}

/**
 * Flat, preference-ranked recommendations for the onboarding summary.
 * Prefers a spread of categories before repeating one.
 */
export function recommendQuestsForPreferences(params: {
  catalog: Quest[];
  preferences: OnboardingPreferences;
  limit?: number;
}): Quest[] {
  const limit = params.limit ?? 3;
  const preferredIds = new Set(params.preferences.categories.map((c) => `cat-${c}`));
  const scored = params.catalog
    .filter((q) => q.isActive !== false)
    .map((quest, index) => ({
      quest,
      index,
      score: scoreQuestForPreferences(quest, params.preferences, preferredIds),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const picked: Quest[] = [];
  const usedCategories = new Set<string>();
  for (const entry of scored) {
    if (picked.length >= limit) break;
    if (usedCategories.has(entry.quest.categoryId)) continue;
    picked.push(entry.quest);
    usedCategories.add(entry.quest.categoryId);
  }
  // Top up if category variety left us short.
  for (const entry of scored) {
    if (picked.length >= limit) break;
    if (picked.includes(entry.quest)) continue;
    picked.push(entry.quest);
  }
  return picked;
}

/**
 * Top picks for a single category, ranked by onboarding fit.
 * Used by the Explore map panel. Falls back to gentlest-first when no answers.
 */
export function recommendQuestsInCategory(params: {
  catalog: Quest[];
  categoryId: string;
  preferences?: OnboardingPreferences | null;
  excludeQuestIds?: Set<string>;
  limit?: number;
}): Quest[] {
  const { catalog, categoryId, preferences, excludeQuestIds, limit = 4 } = params;
  const pool = catalog.filter(
    (q) =>
      q.isActive !== false &&
      q.categoryId === categoryId &&
      !(excludeQuestIds?.has(q.id) ?? false)
  );
  if (!preferences) {
    return [...pool]
      .sort((a, b) => a.estimatedDurationMinutes - b.estimatedDurationMinutes)
      .slice(0, limit);
  }
  const preferredIds = new Set(preferences.categories.map((c) => `cat-${c}`));
  return pool
    .map((quest, index) => ({
      quest,
      index,
      score: scoreQuestForPreferences(quest, preferences, preferredIds),
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.quest.estimatedDurationMinutes - b.quest.estimatedDurationMinutes ||
        a.index - b.index
    )
    .slice(0, limit)
    .map((e) => e.quest);
}

/**
 * What one category tab offers: everything in that category the user could
 * still take on, best first.
 *
 * Capping happens at the call site — this returns the full ordered list so the
 * caller can say how many are hidden. Order is: newly added, then fit to the
 * onboarding answers, then gentlest (soonest cadence, then shortest).
 */
export function orderCategoryQuests(params: {
  catalog: Quest[];
  userQuests: UserQuest[];
  categoryId: string;
  preferences?: OnboardingPreferences | null;
  now?: number;
}): Quest[] {
  const now = params.now ?? Date.now();
  const claimed = claimedQuestIds({
    userQuests: params.userQuests,
    catalog: params.catalog,
    now,
  });
  const prefs = params.preferences ?? null;
  const preferredIds = prefs ? new Set(prefs.categories.map((c) => `cat-${c}`)) : null;
  const fit = (q: Quest) =>
    prefs && preferredIds ? scoreQuestForPreferences(q, prefs, preferredIds) : 0;

  return params.catalog
    .filter(
      (q) =>
        q.isActive !== false &&
        q.categoryId === params.categoryId &&
        !claimed.has(q.id)
    )
    .sort(
      (a, b) =>
        // Newly written quests first. With only a handful visible, a new quest
        // added to a full category would otherwise never be seen.
        Number(isRecentlyAdded(b, now)) - Number(isRecentlyAdded(a, now)) ||
        fit(b) - fit(a) ||
        TIMEFRAME_RANK[a.timeframe] - TIMEFRAME_RANK[b.timeframe] ||
        a.estimatedDurationMinutes - b.estimatedDurationMinutes
    );
}

export const SUGGESTED_GROUP_ORDER: SuggestedGroupId[] = [
  'do_now',
  'low_energy',
  'outside',
  'social',
  'weekend',
];

export const SUGGESTED_GROUP_LABEL: Record<SuggestedGroupId, string> = {
  do_now: 'Do now',
  low_energy: 'Low energy',
  outside: 'Outside',
  social: 'Social',
  weekend: 'Weekend',
};

const DEFAULT_GROUP: SuggestedGroupId = 'do_now';

function resolveGroup(quest: Quest): SuggestedGroupId {
  const g = quest.suggestedGroup;
  if (
    g === 'do_now' ||
    g === 'low_energy' ||
    g === 'outside' ||
    g === 'social' ||
    g === 'weekend'
  ) {
    return g;
  }
  return DEFAULT_GROUP;
}

function isDismissedRecently(uq: UserQuest, horizonMs: number, now: number): boolean {
  if (uq.status !== 'dismissed' || !uq.dismissedAt) return false;
  const t = new Date(uq.dismissedAt).getTime();
  return Number.isFinite(t) && now - t < horizonMs;
}

/**
 * How long a finished quest stays out of the suggested set, by its own cadence.
 *
 * A quest declares how often it is meant to happen, so that is the honest
 * interval to respect: a weekly walk can come round again in a fortnight, a
 * yearly trip should not reappear for a year. A single flat horizon would
 * either bury the repeatable quests or keep offering the big ones straight
 * after they were done.
 */
const COMPLETED_HORIZON_MS: Record<Quest['timeframe'], number> = {
  weekly: 14 * 24 * 60 * 60 * 1000,
  monthly: 60 * 24 * 60 * 60 * 1000,
  yearly: 365 * 24 * 60 * 60 * 1000,
};

/**
 * Whether a quest was completed recently enough to keep it out of suggestions.
 *
 * Completed quests were not excluded at all before 2026-09-05, so finishing one
 * left it sitting in the suggested set — the opposite of what completing
 * something should feel like.
 */
function isCompletedRecently(
  uq: UserQuest,
  quest: Quest | undefined,
  now: number
): boolean {
  if (uq.status !== 'completed' || !uq.completedAt) return false;
  const t = new Date(uq.completedAt).getTime();
  if (!Number.isFinite(t)) return false;
  const horizon = COMPLETED_HORIZON_MS[quest?.timeframe ?? 'monthly'];
  return now - t < horizon;
}

/**
 * Quest ids to keep out of any "here is what you could do" list: the ones the
 * user is already carrying, recently turned down, or recently finished.
 *
 * This is deliberately one shared rule rather than a filter per screen. It was
 * three before: the Journey catalogue excluded nothing at all, Explore dropped
 * completed quests forever, and only this module honoured the per-timeframe
 * horizon — so the same finished quest could be gone from one tab, back in
 * another, and never returning in a third.
 */
export function claimedQuestIds(params: {
  userQuests: UserQuest[];
  /** Needed to read each quest's timeframe for the completion horizon. */
  catalog: Quest[];
  now?: number;
  /** Default 30 days. */
  dismissHorizonMs?: number;
}): Set<string> {
  const { userQuests } = params;
  const now = params.now ?? Date.now();
  const dismissHorizonMs = params.dismissHorizonMs ?? DEFAULT_DISMISS_MS;
  const byId = new Map(params.catalog.map((q) => [q.id, q]));
  const ids = new Set<string>();
  for (const uq of userQuests) {
    if (uq.status === 'active' || uq.status === 'chosen' || uq.status === 'saved_for_later') {
      ids.add(uq.questId);
    }
    if (isDismissedRecently(uq, dismissHorizonMs, now)) {
      ids.add(uq.questId);
    }
    if (isCompletedRecently(uq, byId?.get(uq.questId), now)) {
      ids.add(uq.questId);
    }
  }
  return ids;
}

export type SuggestedPick = { quest: Quest; group: SuggestedGroupId };

const TOTAL_CAP = 9;
const PER_GROUP_CAP = 2;
const DEFAULT_DISMISS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * How long a quest counts as "newly added" for ordering purposes.
 *
 * Standa's rule, 2026-09-05: new quests go to the top. The window keeps that
 * from becoming a permanent newest-first sort, which would quietly replace
 * personalisation with arrival order — the suggested set is meant to be about
 * fit, with fresh content surfaced, not the other way round.
 */
const NEW_QUEST_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Quests with no `createdAt` are the original seed catalogue and are treated as
 * established, never new. That is what keeps the whole catalogue from reading
 * as new the day the column was added.
 */
export function isRecentlyAdded(quest: Quest, now: number = Date.now()): boolean {
  if (!quest.createdAt) return false;
  const t = new Date(quest.createdAt).getTime();
  return Number.isFinite(t) && now - t < NEW_QUEST_WINDOW_MS;
}

/**
 * Small curated suggested set for the Journey hub — virtual, not persisted as `suggested` rows.
 *
 * NOT CURRENTLY RENDERED. No screen imports this: the Journey tab shows the
 * per-category catalogue (`AllQuestsList`) and Explore shows
 * `recommendQuestsInCategory`. The grouped hub this was written for is gone,
 * so treat this as a spare part — either wire it up or delete it, but do not
 * assume a fix made here reaches the user.
 */
export function pickSuggestedQuests(params: {
  catalog: Quest[];
  userQuests: UserQuest[];
  /** Default 30 days — match dismissed horizon. */
  dismissHorizonMs?: number;
  now?: number;
  /** When set, quests within each group are ordered by fit to these answers. */
  preferences?: OnboardingPreferences;
}): SuggestedPick[] {
  const now = params.now ?? Date.now();
  const claimed = claimedQuestIds({
    userQuests: params.userQuests,
    catalog: params.catalog,
    now,
    dismissHorizonMs: params.dismissHorizonMs,
  });

  const buckets: Record<SuggestedGroupId, Quest[]> = {
    do_now: [],
    low_energy: [],
    outside: [],
    social: [],
    weekend: [],
  };

  for (const quest of params.catalog) {
    if (quest.isActive === false) continue;
    if (claimed.has(quest.id)) continue;
    const g = resolveGroup(quest);
    buckets[g].push(quest);
  }

  const prefs = params.preferences;
  const preferredIds = prefs ? new Set(prefs.categories.map((c) => `cat-${c}`)) : null;
  const score = (q: Quest) =>
    prefs && preferredIds ? scoreQuestForPreferences(q, prefs, preferredIds) : 0;

  for (const group of SUGGESTED_GROUP_ORDER) {
    buckets[group].sort((a, b) => {
      // Recently added quests come first, so new content is seen rather than
      // buried under an established catalogue that already fits the user well.
      // The window is deliberately finite: after it passes, ordering goes back
      // to being about fit, not arrival.
      const newness = Number(isRecentlyAdded(b, now)) - Number(isRecentlyAdded(a, now));
      if (newness !== 0) return newness;
      return score(b) - score(a);
    });
  }

  const out: SuggestedPick[] = [];
  for (const group of SUGGESTED_GROUP_ORDER) {
    const list = buckets[group];
    let n = 0;
    for (const quest of list) {
      if (n >= PER_GROUP_CAP) break;
      if (out.length >= TOTAL_CAP) return out;
      out.push({ quest, group });
      n += 1;
    }
  }

  return out;
}
