import { create } from 'zustand';

import {
  createMemoryEntry,
  deleteAllMemoriesForUser,
  fetchMemoryTimeline,
} from '@/src/repositories/memoriesRepository';
import { logError } from '@/src/lib/monitoring/errorLogger';
import { uploadPhotoForUser } from '@/src/repositories/photoRepository';
import { findLatestCompletedUserQuestForQuest } from '@/src/repositories/userQuestsRepository';
import type { MemoryEntry } from '@/src/types/memory';

type MemoryDomainState = {
  memories: MemoryEntry[];
  initializedForUserId: string | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  bootstrap: (userId: string) => Promise<void>;
  refresh: (userId: string) => Promise<void>;
  createMemoryForQuest: (
    userId: string,
    input: {
      questId: string | null;
      title: string;
      body: string;
      photoUri: string | null;
    }
  ) => Promise<MemoryEntry>;
  removeMemory: (id: string) => void;
  /** Admin tool: wipes every memory row for this user, locally and remotely. */
  deleteAllMemories: (userId: string) => Promise<void>;
  clearMemories: () => void;
};

export const useMemoryStore = create<MemoryDomainState>((set, get) => ({
  memories: [],
  initializedForUserId: null,
  loading: false,
  saving: false,
  error: null,

  bootstrap: async (userId) => {
    if (userId === (get().initializedForUserId ?? null)) {
      return;
    }
    set({ loading: true, error: null });
    try {
      const memories = await fetchMemoryTimeline(userId);
      set({ memories, initializedForUserId: userId, loading: false });
    } catch (e: unknown) {
      logError('memoryStore.bootstrap', e, { userId });
      set({
        loading: false,
        error: e instanceof Error ? e.message : 'Failed to load memories.',
      });
    }
  },

  refresh: async (userId) => {
    set({ loading: true, error: null });
    try {
      const memories = await fetchMemoryTimeline(userId);
      set({ memories, initializedForUserId: userId, loading: false });
    } catch (e: unknown) {
      logError('memoryStore.refresh', e, { userId });
      set({
        loading: false,
        error: e instanceof Error ? e.message : 'Failed to refresh memories.',
      });
    }
  },

  createMemoryForQuest: async (userId, input) => {
    set({ saving: true, error: null });
    try {
      const completedUserQuest = input.questId
        ? await findLatestCompletedUserQuestForQuest(userId, input.questId)
        : null;
      if (input.questId && !completedUserQuest) {
        throw new Error('Complete the quest first or create a standalone memory.');
      }
      const photoUrl = input.photoUri
        ? await uploadPhotoForUser({ userId, localUri: input.photoUri })
        : null;

      const entry = await createMemoryEntry({
        userId,
        userQuestId: completedUserQuest?.id ?? null,
        questId: input.questId,
        title: input.title,
        body: input.body,
        photoUrl,
      });
      set((s) => ({
        memories: [entry, ...s.memories.filter((m) => m.id !== entry.id)],
      }));
      return entry;
    } catch (e: unknown) {
      logError('memoryStore.createMemoryForQuest', e, {
        userId,
        questId: input.questId,
        hasPhoto: Boolean(input.photoUri),
      });
      set({ error: e instanceof Error ? e.message : 'Failed to save memory.' });
      throw e;
    } finally {
      set({ saving: false });
    }
  },

  removeMemory: (id) =>
    set((s) => ({ memories: s.memories.filter((m) => m.id !== id) })),

  deleteAllMemories: async (userId) => {
    set({ saving: true, error: null });
    try {
      await deleteAllMemoriesForUser(userId);
      set({ memories: [] });
    } catch (e: unknown) {
      logError('memoryStore.deleteAllMemories', e, { userId });
      set({ error: e instanceof Error ? e.message : 'Could not delete memories.' });
      throw e;
    } finally {
      set({ saving: false });
    }
  },

  clearMemories: () =>
    set({
      memories: [],
      initializedForUserId: null,
      loading: false,
      saving: false,
      error: null,
    }),
}));
