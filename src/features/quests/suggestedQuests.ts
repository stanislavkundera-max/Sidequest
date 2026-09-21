import type {
  OnboardingIntensity,
  OnboardingPace,
  OnboardingPreferences,
} from '@/src/features/onboarding/types';
import type { Quest, QuestTimeframe, UserQuest } from '@/src/types/quest';

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
 * How many quests a category offers at once, across every screen.
 *
 * This is a game rule, not a layout choice: the rest of the catalogue is
 * earned, and a sixth quest appears only when one of these five is finished or
 * turned down. Standa, 2026-09-06 — "pointa je ta, že aby se dostali k novým
 * questům tak musí splnit starý quest."
 *
 * It therefore has to hold everywhere a category can be browsed, or the rule
 * is only as strong as the loosest screen. Use `openQuestsInCategory` rather
 * than slicing an ordered list yourself.
 */
export const QUESTS_OPEN_PER_CATEGORY = 5;

/**
 * The quests a category is currently offering — already capped.
 *
 * One pool per category, shared by the Journey tab, the Explore panel and the
 * picker, so none of them can widen access past the rule.
 */
export function openQuestsInCategory(params: {
  catalog: Quest[];
  userQuests: UserQuest[];
  categoryId: string;
  preferences?: OnboardingPreferences | null;
  now?: number;
  /** Show fewer than the cap (Explore's panel takes the top three). Never more. */
  limit?: number;
}): Quest[] {
  const limit = Math.min(params.limit ?? QUESTS_OPEN_PER_CATEGORY, QUESTS_OPEN_PER_CATEGORY);
  return orderCategoryQuests(params).slice(0, limit);
}

/**
 * Every quest in a category the user could still take on, best first and
 * uncapped. Callers that put quests in front of someone want
 * `openQuestsInCategory`; this exists so they can also say how many are locked.
 *
 * Order is: newly added, then fit to the onboarding answers, then gentlest
 * (soonest cadence, then shortest).
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
  const inCategory = params.catalog.filter(
    (q) => q.isActive !== false && q.categoryId === params.categoryId
  );
  const dismissed = currentlyDismissedQuestIds(params.userQuests);
  const dismissedMayReturn = rejectedQuestsMayReturn(inCategory, dismissed, params.userQuests);

  const prefs = params.preferences ?? null;
  const preferredIds = prefs ? new Set(prefs.categories.map((c) => `cat-${c}`)) : null;
  const fit = (q: Quest) =>
    prefs && preferredIds ? scoreQuestForPreferences(q, prefs, preferredIds) : 0;

  return inCategory
    .filter((q) => !claimed.has(q.id) && (dismissedMayReturn || !dismissed.has(q.id)))
    .sort(
      (a, b) =>
        // Anything you turned down goes after everything you didn't.
        Number(dismissed.has(a.id)) - Number(dismissed.has(b.id)) ||
        // Newly written quests first. With only a handful visible, a new quest
        // added to a full category would otherwise never be seen.
        Number(isRecentlyAdded(b, now)) - Number(isRecentlyAdded(a, now)) ||
        fit(b) - fit(a) ||
        TIMEFRAME_RANK[a.timeframe] - TIMEFRAME_RANK[b.timeframe] ||
        a.estimatedDurationMinutes - b.estimatedDurationMinutes
    );
}

function rowTime(iso: string | null | undefined): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : 0;
}

/**
 * Quests the user has turned down ("Not for me") and not taken up since.
 *
 * A turned-down quest can come back (see `rejectedQuestsMayReturn`) and then be
 * started or finished — after which the old dismissal no longer speaks for it.
 */
export function currentlyDismissedQuestIds(userQuests: UserQuest[]): Set<string> {
  const lastDismissedAt = new Map<string, number>();
  for (const uq of userQuests) {
    if (uq.status !== 'dismissed') continue;
    const t = rowTime(uq.dismissedAt ?? uq.startedAt);
    if (t >= (lastDismissedAt.get(uq.questId) ?? -1)) lastDismissedAt.set(uq.questId, t);
  }
  const ids = new Set(lastDismissedAt.keys());
  for (const uq of userQuests) {
    if (uq.status === 'dismissed' || !ids.has(uq.questId)) continue;
    const t = rowTime(uq.status === 'completed' ? uq.completedAt : uq.startedAt);
    if (t > (lastDismissedAt.get(uq.questId) ?? 0)) ids.delete(uq.questId);
  }
  return ids;
}

/**
 * Whether the quests someone turned down in a category are back on offer.
 *
 * Standa's rule, 2026-09-21: they return "v momentě co by měli splněný všechny
 * questy které neodmítli, včetně těch schovaných v databázi" — once every quest
 * in the category you did *not* turn down has been completed, hidden ones
 * included. Counted per category. So turning something down is never
 * permanent, and it is never a way to empty a category: it only sends the
 * quest to the back of the line.
 *
 * It replaced a flat 30-day comeback, under which a quest you had said no to
 * could reappear while there was still plenty you hadn't tried.
 */
function rejectedQuestsMayReturn(
  inCategory: Quest[],
  dismissed: Set<string>,
  userQuests: UserQuest[]
): boolean {
  if (!inCategory.some((q) => dismissed.has(q.id))) return false;
  const everCompleted = new Set(
    userQuests.filter((uq) => uq.status === 'completed').map((uq) => uq.questId)
  );
  return inCategory.every((q) => dismissed.has(q.id) || everCompleted.has(q.id));
}

/**
 * Liked quests in a category — hearted and not yet started.
 *
 * They stay in their category, pinned above the open five, instead of leaving
 * the list (round 2, R2-05). Liking used to make the card vanish, let another
 * quest take its place, and park the liked one on a different tab without a
 * word — so it looked deleted ("Likenutej příspěvek nejde nahoru ale zmizí").
 * A liked quest still does not occupy one of the five slots.
 *
 * `saved_for_later` also covers quests left mid-way; those have step progress
 * and belong to "Paused", so they are excluded here via `hasProgress`.
 */
export function likedQuestsInCategory(params: {
  catalog: Quest[];
  userQuests: UserQuest[];
  categoryId: string;
  hasProgress: (uq: UserQuest) => boolean;
}): { quest: Quest; userQuest: UserQuest }[] {
  const byId = new Map(params.catalog.map((q) => [q.id, q]));
  return params.userQuests
    .filter((uq) => uq.status === 'saved_for_later' && !params.hasProgress(uq))
    .map((uq) => ({ quest: byId.get(uq.questId), userQuest: uq }))
    .filter(
      (row): row is { quest: Quest; userQuest: UserQuest } =>
        row.quest != null &&
        row.quest.isActive !== false &&
        row.quest.categoryId === params.categoryId
    )
    .sort((a, b) =>
      (b.userQuest.savedAt ?? b.userQuest.startedAt).localeCompare(
        a.userQuest.savedAt ?? a.userQuest.startedAt
      )
    );
}

/**
 * Quests in the open five that are there because of something *you* did.
 *
 * The NEW badge used to mean only "new in the catalogue". A quest that slid
 * into the five because you started, liked or turned down another is old
 * content, so it got no badge — while to the person it was plainly new
 * (round 2, R2-08: "nový quest se přidal ale není u něj tag new").
 *
 * Defined without any stored history: a quest counts if it is open to you now,
 * would *not* be among the first five for someone who had never touched this
 * category, and you have never had anything to do with it. Comparing against a
 * fresh user with the same preferences keeps the answer stable while
 * preferences load, and "never had anything to do with it" keeps quests that
 * come back after a completion or a "Not for me" from posing as new.
 */
export function newlyOpenedQuestIds(params: {
  catalog: Quest[];
  userQuests: UserQuest[];
  categoryId: string;
  preferences?: OnboardingPreferences | null;
  now?: number;
}): Set<string> {
  const open = openQuestsInCategory(params);
  const freshFive = new Set(
    openQuestsInCategory({ ...params, userQuests: [] }).map((q) => q.id)
  );
  const touched = new Set(params.userQuests.map((uq) => uq.questId));
  return new Set(
    open.filter((q) => !freshFive.has(q.id) && !touched.has(q.id)).map((q) => q.id)
  );
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
 * user is already carrying or recently finished. Turned-down quests follow
 * their own rule — see `rejectedQuestsMayReturn`.
 *
 * This is deliberately one shared rule rather than a filter per screen. It was
 * three before: the Journey catalogue excluded nothing at all, Explore dropped
 * completed quests forever, and only this module honoured the per-timeframe
 * horizon — so the same finished quest could be gone from one tab, back in
 * another, and never returning in a third.
 */
function claimedQuestIds(params: {
  userQuests: UserQuest[];
  /** Needed to read each quest's timeframe for the completion horizon. */
  catalog: Quest[];
  now?: number;
}): Set<string> {
  const { userQuests } = params;
  const now = params.now ?? Date.now();
  const byId = new Map(params.catalog.map((q) => [q.id, q]));
  const ids = new Set<string>();
  for (const uq of userQuests) {
    if (uq.status === 'active' || uq.status === 'chosen' || uq.status === 'saved_for_later') {
      ids.add(uq.questId);
    }
    if (isCompletedRecently(uq, byId?.get(uq.questId), now)) {
      ids.add(uq.questId);
    }
  }
  return ids;
}

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
