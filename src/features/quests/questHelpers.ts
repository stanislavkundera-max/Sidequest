import type {
  Quest,
  QuestActionStep,
  QuestTimeframe,
  UserQuest,
} from '@/src/types/quest';

export const ACTIVE_LIMITS: Record<QuestTimeframe, number> = {
  weekly: 3,
  monthly: 2,
  yearly: 1,
};

export function getActiveUserQuests(userQuests: UserQuest[]): UserQuest[] {
  return userQuests.filter((uq) => uq.status === 'active');
}

export function countActiveForTimeframe(
  userQuests: UserQuest[],
  timeframe: QuestTimeframe,
  catalog: Map<string, Quest>
): number {
  return userQuests.filter(
    (uq) =>
      uq.status === 'active' && catalog.get(uq.questId)?.timeframe === timeframe
  ).length;
}

/**
 * Quests the user can still add: not already active for that quest id,
 * and the timeframe bucket has capacity (3 weekly / 2 monthly / 1 yearly).
 */
export function getAvailableQuests(
  userQuests: UserQuest[],
  catalogList: Quest[]
): Quest[] {
  const catalog = new Map(catalogList.map((q) => [q.id, q]));
  const active = getActiveUserQuests(userQuests);
  const activeQuestIds = new Set(active.map((uq) => uq.questId));

  return catalogList.filter((quest) => {
    if (activeQuestIds.has(quest.id)) return false;
    const used = countActiveForTimeframe(userQuests, quest.timeframe, catalog);
    return used < ACTIVE_LIMITS[quest.timeframe];
  });
}

export type AssignQuestResult =
  | { ok: true; userQuest: UserQuest }
  | {
      ok: false;
      reason: 'not_found' | 'already_active' | 'timeframe_full';
    };

export function assignQuestToUser(
  userQuests: UserQuest[],
  catalogList: Quest[],
  questId: string,
  createId: () => string,
  nowIso: () => string
): AssignQuestResult {
  const catalog = new Map(catalogList.map((q) => [q.id, q]));
  const quest = catalog.get(questId);
  if (!quest) return { ok: false, reason: 'not_found' };

  if (userQuests.some((uq) => uq.status === 'active' && uq.questId === questId)) {
    return { ok: false, reason: 'already_active' };
  }

  if (
    countActiveForTimeframe(userQuests, quest.timeframe, catalog) >=
    ACTIVE_LIMITS[quest.timeframe]
  ) {
    return { ok: false, reason: 'timeframe_full' };
  }

  const userQuest: UserQuest = {
    id: createId(),
    questId,
    status: 'active',
    startedAt: nowIso(),
    completedAt: null,
    note: null,
    photoUri: null,
    stepProgress: {},
  };

  return { ok: true, userQuest };
}

export type CompleteQuestResult =
  | { ok: true; userQuest: UserQuest }
  | { ok: false; reason: 'not_found' | 'not_active' };

export function completeQuest(
  userQuests: UserQuest[],
  userQuestId: string,
  nowIso: () => string,
  patch?: { note?: string | null; photoUri?: string | null }
): CompleteQuestResult {
  const idx = userQuests.findIndex((uq) => uq.id === userQuestId);
  if (idx === -1) return { ok: false, reason: 'not_found' };

  const current = userQuests[idx];
  if (current.status !== 'active') return { ok: false, reason: 'not_active' };

  const userQuest: UserQuest = {
    ...current,
    status: 'completed',
    completedAt: nowIso(),
    note: patch?.note !== undefined ? patch.note : current.note,
    photoUri: patch?.photoUri !== undefined ? patch.photoUri : current.photoUri,
  };

  return { ok: true, userQuest };
}

/**
 * Human-readable next action for an active quest: first unchecked step title,
 * or wrap-up copy when there are no steps or all steps are checked.
 */
export function getNextActionableStepLabel(uq: UserQuest, quest: Quest): string {
  if (quest.actionSteps.length === 0) {
    return 'Open this quest to finish or log a memory';
  }
  for (const step of quest.actionSteps) {
    if (!uq.stepProgress[step.id]) {
      return step.title;
    }
  }
  return 'All steps done — open to wrap up';
}

/** How many journey steps are checked for this active user quest. */
export function countCompletedJourneySteps(uq: UserQuest, quest: Quest): number {
  if (quest.actionSteps.length === 0) return 0;
  let n = 0;
  for (const s of quest.actionSteps) {
    if (uq.stepProgress[s.id]) n += 1;
  }
  return n;
}

export function incompleteJourneyStepsCount(uq: UserQuest, quest: Quest): number {
  const total = quest.actionSteps.length;
  if (total === 0) return 0;
  return total - countCompletedJourneySteps(uq, quest);
}

const TIMEFRAME_PRIORITY: QuestTimeframe[] = ['weekly', 'monthly', 'yearly'];

function resolveNextProgressActionForActiveBucket(
  activeSorted: UserQuest[],
  getQuestById: (id: string) => Quest | undefined
): NextProgressAction | null {
  for (const uq of activeSorted) {
    const q = getQuestById(uq.questId);
    if (!q) continue;

    if (q.actionSteps.length === 0) {
      return { kind: 'wrap_up', userQuest: uq, quest: q };
    }

    for (const step of q.actionSteps) {
      if (!uq.stepProgress[step.id]) {
        return { kind: 'journey_step', userQuest: uq, quest: q, step };
      }
    }
  }

  for (const uq of activeSorted) {
    const q = getQuestById(uq.questId);
    if (!q || q.actionSteps.length === 0) continue;
    if (incompleteJourneyStepsCount(uq, q) === 0) {
      return { kind: 'wrap_up', userQuest: uq, quest: q };
    }
  }

  return null;
}

/**
 * Next actionable step within one timeframe (weekly / monthly / yearly), in startedAt order.
 */
export function resolveNextProgressActionForTimeframe(
  userQuests: UserQuest[],
  getQuestById: (id: string) => Quest | undefined,
  timeframe: QuestTimeframe
): NextProgressAction | null {
  const bucket = getActiveUserQuests(userQuests)
    .filter((uq) => getQuestById(uq.questId)?.timeframe === timeframe)
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  return resolveNextProgressActionForActiveBucket(bucket, getQuestById);
}

export type NextProgressAction =
  | {
      kind: 'journey_step';
      userQuest: UserQuest;
      quest: Quest;
      step: QuestActionStep;
    }
  | {
      kind: 'wrap_up';
      userQuest: UserQuest;
      quest: Quest;
    };

/**
 * Picks the single best "next" action across active quests: weekly quests first,
 * then monthly, then yearly; within a timeframe, earlier `startedAt` first.
 * Prefer an unchecked journey step; if none, the first quest that only needs wrap-up.
 */
export function resolveNextProgressAction(
  userQuests: UserQuest[],
  getQuestById: (id: string) => Quest | undefined
): NextProgressAction | null {
  for (const tf of TIMEFRAME_PRIORITY) {
    const next = resolveNextProgressActionForTimeframe(
      userQuests,
      getQuestById,
      tf
    );
    if (next) return next;
  }
  return null;
}
