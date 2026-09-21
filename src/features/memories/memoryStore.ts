import { create } from 'zustand';

import {
  createMemoryEntry,
  deleteAllMemoriesForUser,
  deleteMemoryEntry,
  fetchMemoryTimeline,
  updateMemoryEntry,
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
  /** Same reason as the quest store's `clearError` — see round 2, R2-04. */
  clearError: () => void;
  bootstrap: (userId: string) => Promise<void>;
  refresh: (userId: string) => Promise<void>;
  createMemoryForQuest: (
    userId: string,
    input: {
      questId: string | null;
      title: string;
      body: string;
      photoUri: string | null;
      /** Hand-picked category for a memory with no quest (R2-11). Ignored when `questId` is set. */
      categoryId?: string | null;
    }
  ) => Promise<MemoryEntry & { photoFailed?: boolean }>;
  removeMemory: (id: string) => void;
  /** `photoUri: null` removes the photo; unchanged from the entry's current value keeps it as-is. */
  updateMemory: (
    userId: string,
    id: string,
    input: {
      title: string;
      body: string;
      photoUri: string | null;
      /** `undefined` leaves it as-is. Only used for memories with no quest. */
      categoryId?: string | null;
    }
  ) => Promise<MemoryEntry>;
  deleteMemory: (userId: string, id: string) => Promise<void>;
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

  clearError: () => {
    if (get().error !== null) set({ error: null });
  },

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
      // The words are the memory; the photo is an extra. A failed upload used to
      // throw here and take the whole memory with it — at the end of a quest,
      // often out of signal, which is exactly when it was worth writing down
      // (round 2, R2-04). Now the memory is saved without the photo and the
      // caller is told, so it can say so.
      let photoUrl: string | null = null;
      let photoFailed = false;
      if (input.photoUri) {
        try {
          photoUrl = await uploadPhotoForUser({ userId, localUri: input.photoUri });
        } catch (uploadError: unknown) {
          logError('memoryStore.createMemoryForQuest.photoUpload', uploadError, {
            userId,
            questId: input.questId,
          });
          photoFailed = true;
        }
      }

      const entry = await createMemoryEntry({
        userId,
        userQuestId: completedUserQuest?.id ?? null,
        questId: input.questId,
        title: input.title,
        body: input.body,
        photoUrl,
        categoryId: input.questId ? null : (input.categoryId ?? null),
      });
      set((s) => ({
        memories: [entry, ...s.memories.filter((m) => m.id !== entry.id)],
      }));
      return photoFailed ? { ...entry, photoFailed } : entry;
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

  updateMemory: async (userId, id, input) => {
    set({ saving: true, error: null });
    try {
      const current = get().memories.find((m) => m.id === id);
      let photoUrl: string | null;
      if (input.photoUri === null) {
        photoUrl = null;
      } else if (input.photoUri === current?.photoUri) {
        photoUrl = input.photoUri;
      } else {
        photoUrl = await uploadPhotoForUser({ userId, localUri: input.photoUri });
      }

      const entry = await updateMemoryEntry({
        userId,
        id,
        title: input.title,
        body: input.body,
        photoUrl,
        categoryId: input.categoryId,
      });
      set((s) => ({
        memories: s.memories.map((m) => (m.id === id ? entry : m)),
      }));
      return entry;
    } catch (e: unknown) {
      logError('memoryStore.updateMemory', e, { userId, id });
      set({ error: e instanceof Error ? e.message : 'Failed to update memory.' });
      throw e;
    } finally {
      set({ saving: false });
    }
  },

  deleteMemory: async (userId, id) => {
    set({ saving: true, error: null });
    try {
      await deleteMemoryEntry({ userId, id });
      set((s) => ({ memories: s.memories.filter((m) => m.id !== id) }));
    } catch (e: unknown) {
      logError('memoryStore.deleteMemory', e, { userId, id });
      set({ error: e instanceof Error ? e.message : 'Failed to delete memory.' });
      throw e;
    } finally {
      set({ saving: false });
    }
  },

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
