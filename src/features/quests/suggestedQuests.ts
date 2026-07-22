import type {
  OnboardingIntensity,
  OnboardingPace,
  OnboardingPreferences,
} from '@/src/features/onboarding/types';
import type { Quest, QuestTimeframe, UserQuest } from '@/src/types/quest';

export type SuggestedGroupId = 'do_now' | 'low_energy' | 'outside' | 'social' | 'weekend';

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

/** Quest ids the user already has in a non-suggested engagement row. */
function claimedQuestIds(userQuests: UserQuest[], now: number, dismissHorizonMs: number): Set<string> {
  const ids = new Set<string>();
  for (const uq of userQuests) {
    if (uq.status === 'active' || uq.status === 'chosen' || uq.status === 'saved_for_later') {
      ids.add(uq.questId);
    }
    if (isDismissedRecently(uq, dismissHorizonMs, now)) {
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
 * Small curated suggested set for the Journey hub — virtual, not persisted as `suggested` rows.
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
  const dismissHorizonMs = params.dismissHorizonMs ?? DEFAULT_DISMISS_MS;
  const claimed = claimedQuestIds(params.userQuests, now, dismissHorizonMs);

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
  if (prefs) {
    const preferredIds = new Set(prefs.categories.map((c) => `cat-${c}`));
    const score = (q: Quest) => scoreQuestForPreferences(q, prefs, preferredIds);
    for (const group of SUGGESTED_GROUP_ORDER) {
      buckets[group].sort((a, b) => score(b) - score(a));
    }
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
