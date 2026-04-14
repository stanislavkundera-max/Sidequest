import { create } from 'zustand';

import {
  ACTIVE_LIMITS,
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
  deactivateActiveUserQuest,
  fetchUserQuests,
  updateUserQuestStepProgress,
  type AssignQuestResult,
  type CompleteQuestResult,
} from '@/src/repositories/userQuestsRepository';
import { trackEvent } from '@/src/lib/analytics';
import { logError } from '@/src/lib/monitoring/errorLogger';
import type { Category } from '@/src/types/category';
import type { Quest } from '@/src/types/quest';
import type { UserQuest } from '@/src/types/quest';

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
  toggleQuestStep: (
    userId: string,
    userQuestId: string,
    stepId: string
  ) => Promise<{ ok: true } | { ok: false; reason: 'not_found' | 'not_active' }>;
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

  toggleQuestStep: async (userId, userQuestId, stepId) => {
    const prev = get().userQuests.find((u) => u.id === userQuestId);
    if (!prev) return { ok: false, reason: 'not_found' };
    if (prev.status !== 'active') return { ok: false, reason: 'not_active' };

    const wasChecked = Boolean(prev.stepProgress[stepId]);
    const nextProgress = { ...prev.stepProgress };
    if (nextProgress[stepId]) {
      delete nextProgress[stepId];
    } else {
      nextProgress[stepId] = new Date().toISOString();
    }

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
      if (!wasChecked && nextProgress[stepId]) {
        trackEvent('quest_step_completed', {
          sourceScreen: 'quest_detail',
          questId: prev.questId,
          stepId,
        }).catch(() => undefined);
      }
      return { ok: true };
    } catch (e: unknown) {
      logError('questStore.toggleQuestStep', e, { userId, userQuestId, stepId });
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
        set((s) => ({ userQuests: [...s.userQuests, result.userQuest] }));
      }
      if (!result.ok && result.reason === 'timeframe_full') {
        set({
          error: `Limit reached (${ACTIVE_LIMITS[get().getQuestById(questId)?.timeframe ?? 'weekly']}).`,
        });
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
      const result = await deactivateActiveUserQuest({ userId, userQuestId });
      if (result.ok) {
        set((s) => ({
          userQuests: s.userQuests.filter((u) => u.id !== userQuestId),
        }));
      }
      return result;
    } catch (e: unknown) {
      logError('questStore.deactivateQuest', e, { userId, userQuestId });
      const message = formatUnknownError(e, 'Could not remove this quest.');
      set({ error: isSupabaseQuestProgressSetupError(message) ? null : message });
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
