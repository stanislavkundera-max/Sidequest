import { create } from 'zustand';

import { QUEST_COPY } from '@/src/features/quests/questCopy';
import {
  getActiveUserQuests as getActiveUserQuestsPure,
  getAvailableQuests as getAvailableQuestsPure,
} from '@/src/features/quests/questHelpers';
import {
  fetchCategories,
  fetchQuestCatalog,
} from '@/src/repositories/questsRepository';
import {
  assignQuestToUser as assignQuestToUserRemote,
  completeUserQuest,
  deleteAllUserQuestsForUser,
  dismissSuggestedQuest as dismissSuggestedQuestRemote,
  fetchUserQuests,
  moveActiveQuestToLater,
  removeSavedForLaterQuest,
  saveQuestForLater as saveQuestForLaterRemote,
  updateUserQuestStepProgress,
  type AssignQuestResult,
  type CompleteQuestResult,
} from '@/src/repositories/userQuestsRepository';
import { trackEvent } from '@/src/lib/analytics';
import { logError } from '@/src/lib/monitoring/errorLogger';
import type { Category } from '@/src/types/category';
import type { Quest } from '@/src/types/quest';
import type { UserQuest, UserQuestStepEvidence } from '@/src/types/quest';

function formatUnknownError(e: unknown, fallback: string): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'object' && e !== null) {
    const candidate = e as { message?: unknown; details?: unknown; hint?: unknown };
    const message = typeof candidate.message === 'string' ? candidate.message : '';
    const details = typeof candidate.details === 'string' ? candidate.details : '';
    const hint = typeof candidate.hint === 'string' ? candidate.hint : '';
    const merged = [message, details, hint].filter(Boolean).join(' | ');
    if (merged) return merged;
  }
  return fallback;
}

function isSupabaseQuestProgressSetupError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('quest progress is not configured in supabase yet') ||
    (normalized.includes('missing required table') && normalized.includes('user_quests'))
  );
}

type QuestDomainState = {
  categories: Category[];
  quests: Quest[];
  userQuests: UserQuest[];
  initializedForUserId: string | null;
  loading: boolean;
  pending: boolean;
  error: string | null;
  bootstrap: (userId: string) => Promise<void>;
  refreshUserQuests: (userId: string) => Promise<void>;
  getAvailableQuests: () => Quest[];
  getActiveUserQuests: () => UserQuest[];
  getQuestById: (id: string) => Quest | undefined;
  getCategoryById: (id: string) => Category | undefined;
  assignQuestToUser: (userId: string, questId: string) => Promise<AssignQuestResult>;
  completeStepWithEvidence: (
    userId: string,
    userQuestId: string,
    stepId: string,
    evidence: UserQuestStepEvidence,
    analytics?: { sourceScreen?: string }
  ) => Promise<{ ok: true } | { ok: false; reason: 'not_found' | 'not_active' | 'already_done' }>;
  /** Undo a completed step so the user can step back and redo it. */
  revertStep: (
    userId: string,
    userQuestId: string,
    stepId: string
  ) => Promise<{ ok: true } | { ok: false; reason: 'not_found' | 'not_active' | 'not_done' }>;
  completeQuest: (
    userId: string,
    userQuestId: string,
    options?: {
      note?: string | null;
      photoUrl?: string | null;
    }
  ) => Promise<CompleteQuestResult>;
  deactivateQuest: (
    userId: string,
    userQuestId: string
  ) => Promise<{ ok: true } | { ok: false; reason: 'not_found' | 'not_active' }>;
  saveQuestForLater: (
    userId: string,
    questId: string
  ) => Promise<{ ok: true } | { ok: false; reason: string }>;
  /** Un-like a wishlist quest (no progress) — removes the row entirely. */
  unlikeQuest: (
    userId: string,
    userQuestId: string
  ) => Promise<{ ok: true } | { ok: false; reason: 'not_found' | 'not_saved_for_later' }>;
  dismissSuggestedQuest: (
    userId: string,
    questId: string
  ) => Promise<{ ok: true } | { ok: false; reason: string }>;
  /** Admin tool: wipes every user_quests row for this user, locally and remotely. */
  deleteAllProgress: (userId: string) => Promise<void>;
  resetDomainState: () => void;
};

export const useQuestDomainStore = create<QuestDomainState>((set, get) => ({
  categories: [],
  quests: [],
  userQuests: [],
  initializedForUserId: null,
  loading: false,
  pending: false,
  error: null,

  bootstrap: async (userId) => {
    if (get().initializedForUserId === userId && get().quests.length > 0) return;
    set({ loading: true, error: null });
    try {
      const [categories, quests, userQuests] = await Promise.all([
        fetchCategories(),
        fetchQuestCatalog(),
        fetchUserQuests(userId),
      ]);
      set({
        categories,
        quests,
        userQuests,
        initializedForUserId: userId,
        loading: false,
      });
    } catch (e: unknown) {
      logError('questStore.bootstrap', e, { userId });
      set({
        loading: false,
        error: formatUnknownError(e, 'Failed to load quests.'),
      });
    }
  },

  refreshUserQuests: async (userId) => {
    try {
      const userQuests = await fetchUserQuests(userId);
      set({ userQuests });
    } catch (e: unknown) {
      logError('questStore.refreshUserQuests', e, { userId });
      set({ error: formatUnknownError(e, 'Failed to refresh quests.') });
    }
  },

  getAvailableQuests: () => getAvailableQuestsPure(get().userQuests, get().quests),

  getActiveUserQuests: () => getActiveUserQuestsPure(get().userQuests),

  getQuestById: (id) => get().quests.find((q) => q.id === id),

  getCategoryById: (id) => get().categories.find((c) => c.id === id),

  completeStepWithEvidence: async (userId, userQuestId, stepId, evidence, analytics) => {
    const prev = get().userQuests.find((u) => u.id === userQuestId);
    if (!prev) return { ok: false, reason: 'not_found' };
    if (prev.status !== 'active') return { ok: false, reason: 'not_active' };
    if (prev.stepProgress[stepId]) return { ok: false, reason: 'already_done' };

    const completedAt = new Date().toISOString();
    const nextProgress = {
      ...prev.stepProgress,
      [stepId]: { completedAt, evidence },
    };

    set((s) => ({
      userQuests: s.userQuests.map((u) =>
        u.id === userQuestId ? { ...u, stepProgress: nextProgress } : u
      ),
      error: null,
    }));

    try {
      const updated = await updateUserQuestStepProgress({
        userId,
        userQuestId,
        stepProgress: nextProgress,
      });
      if (updated) {
        set((s) => ({
          userQuests: s.userQuests.map((u) =>
            u.id === userQuestId ? updated : u
          ),
        }));
      }
      trackEvent('quest_step_completed', {
        sourceScreen: analytics?.sourceScreen ?? 'quest_runner',
        questId: prev.questId,
        stepId,
        evidenceKind: evidence.kind,
      }).catch(() => undefined);
      return { ok: true };
    } catch (e: unknown) {
      logError('questStore.completeStepWithEvidence', e, {
        userId,
        userQuestId,
        stepId,
      });
      set((s) => ({
        userQuests: s.userQuests.map((u) =>
          u.id === userQuestId ? prev : u
        ),
        error: (() => {
          const message = formatUnknownError(e, 'Could not save step.');
          return isSupabaseQuestProgressSetupError(message) ? null : message;
        })(),
      }));
      throw e;
    }
  },

  revertStep: async (userId, userQuestId, stepId) => {
    const prev = get().userQuests.find((u) => u.id === userQuestId);
    if (!prev) return { ok: false, reason: 'not_found' };
    if (prev.status !== 'active') return { ok: false, reason: 'not_active' };
    if (!prev.stepProgress[stepId]) return { ok: false, reason: 'not_done' };

    const nextProgress = { ...prev.stepProgress };
    delete nextProgress[stepId];

    set((s) => ({
      userQuests: s.userQuests.map((u) =>
        u.id === userQuestId ? { ...u, stepProgress: nextProgress } : u
      ),
      error: null,
    }));

    try {
      const updated = await updateUserQuestStepProgress({
        userId,
        userQuestId,
        stepProgress: nextProgress,
      });
      if (updated) {
        set((s) => ({
          userQuests: s.userQuests.map((u) => (u.id === userQuestId ? updated : u)),
        }));
      }
      return { ok: true };
    } catch (e: unknown) {
      logError('questStore.revertStep', e, { userId, userQuestId, stepId });
      set((s) => ({
        userQuests: s.userQuests.map((u) => (u.id === userQuestId ? prev : u)),
        error: (() => {
          const message = formatUnknownError(e, 'Could not step back.');
          return isSupabaseQuestProgressSetupError(message) ? null : message;
        })(),
      }));
      throw e;
    }
  },

  assignQuestToUser: async (userId, questId) => {
    set({ pending: true, error: null });
    try {
      const result = await assignQuestToUserRemote({
        userId,
        questId,
        catalog: get().quests,
        userQuests: get().userQuests,
      });
      if (result.ok) {
        set((s) => ({
          userQuests: s.userQuests.some((u) => u.id === result.userQuest.id)
            ? s.userQuests.map((u) => (u.id === result.userQuest.id ? result.userQuest : u))
            : [...s.userQuests, result.userQuest],
        }));
      }
      if (!result.ok && result.reason === 'active_path_full') {
        set({ error: QUEST_COPY.activePathFullBody });
      }
      return result;
    } catch (e: unknown) {
      logError('questStore.assignQuestToUser', e, { userId, questId });
      const message = formatUnknownError(e, 'Could not activate quest.');
      set({ error: isSupabaseQuestProgressSetupError(message) ? null : message });
      throw e;
    } finally {
      set({ pending: false });
    }
  },

  completeQuest: async (userId, userQuestId, options) => {
    set({ pending: true, error: null });
    try {
      const result = await completeUserQuest({
        userId,
        userQuestId,
        note: options?.note,
        photoUrl: options?.photoUrl,
      });
      if (result.ok) {
        set((s) => ({
          userQuests: s.userQuests.map((uq) =>
            uq.id === userQuestId ? result.userQuest : uq
          ),
        }));
      }
      return result;
    } catch (e: unknown) {
      logError('questStore.completeQuest', e, { userId, userQuestId });
      const message = formatUnknownError(e, 'Could not complete quest.');
      set({ error: isSupabaseQuestProgressSetupError(message) ? null : message });
      throw e;
    } finally {
      set({ pending: false });
    }
  },

  deactivateQuest: async (userId, userQuestId) => {
    set({ pending: true, error: null });
    try {
      const result = await moveActiveQuestToLater({ userId, userQuestId });
      if (result.ok) {
        set((s) => ({
          userQuests: s.userQuests.map((u) => (u.id === userQuestId ? result.userQuest : u)),
        }));
      }
      return result.ok ? { ok: true as const } : { ok: false as const, reason: result.reason };
    } catch (e: unknown) {
      logError('questStore.deactivateQuest', e, { userId, userQuestId });
      const message = formatUnknownError(e, 'Could not move this quest.');
      set({ error: isSupabaseQuestProgressSetupError(message) ? null : message });
      throw e;
    } finally {
      set({ pending: false });
    }
  },

  saveQuestForLater: async (userId, questId) => {
    set({ pending: true, error: null });
    try {
      const result = await saveQuestForLaterRemote({
        userId,
        questId,
        catalog: get().quests,
        userQuests: get().userQuests,
      });
      if (result.ok) {
        set((s) => ({
          userQuests: s.userQuests.some((u) => u.id === result.userQuest.id)
            ? s.userQuests.map((u) => (u.id === result.userQuest.id ? result.userQuest : u))
            : [...s.userQuests, result.userQuest],
        }));
      }
      return result.ok ? { ok: true as const } : { ok: false as const, reason: result.reason };
    } catch (e: unknown) {
      logError('questStore.saveQuestForLater', e, { userId, questId });
      const message = formatUnknownError(e, 'Could not save quest.');
      set({ error: isSupabaseQuestProgressSetupError(message) ? null : message });
      throw e;
    } finally {
      set({ pending: false });
    }
  },

  unlikeQuest: async (userId, userQuestId) => {
    set({ pending: true, error: null });
    try {
      const result = await removeSavedForLaterQuest({ userId, userQuestId });
      if (result.ok) {
        set((s) => ({ userQuests: s.userQuests.filter((u) => u.id !== userQuestId) }));
      }
      return result;
    } catch (e: unknown) {
      logError('questStore.unlikeQuest', e, { userId, userQuestId });
      const message = formatUnknownError(e, 'Could not remove this quest.');
      set({ error: isSupabaseQuestProgressSetupError(message) ? null : message });
      throw e;
    } finally {
      set({ pending: false });
    }
  },

  dismissSuggestedQuest: async (userId, questId) => {
    set({ pending: true, error: null });
    try {
      const result = await dismissSuggestedQuestRemote({
        userId,
        questId,
        catalog: get().quests,
        userQuests: get().userQuests,
      });
      if (result.ok) {
        set((s) => ({ userQuests: [...s.userQuests, result.userQuest] }));
      }
      return result.ok ? { ok: true as const } : { ok: false as const, reason: result.reason };
    } catch (e: unknown) {
      logError('questStore.dismissSuggestedQuest', e, { userId, questId });
      const message = formatUnknownError(e, 'Could not dismiss suggestion.');
      set({ error: isSupabaseQuestProgressSetupError(message) ? null : message });
      throw e;
    } finally {
      set({ pending: false });
    }
  },

  deleteAllProgress: async (userId) => {
    set({ pending: true, error: null });
    try {
      await deleteAllUserQuestsForUser(userId);
      set({ userQuests: [] });
    } catch (e: unknown) {
      logError('questStore.deleteAllProgress', e, { userId });
      set({ error: formatUnknownError(e, 'Could not delete progress.') });
      throw e;
    } finally {
      set({ pending: false });
    }
  },

  resetDomainState: () =>
    set({
      categories: [],
      quests: [],
      userQuests: [],
      initializedForUserId: null,
      loading: false,
      pending: false,
      error: null,
    }),
}));
