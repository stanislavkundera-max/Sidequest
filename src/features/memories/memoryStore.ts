import { create } from 'zustand';

import {
  createMemoryEntry,
  deleteAllMemoriesForUser,
  deleteMemoryEntry,
  fetchMemoryTimeline,
  updateMemoryEntry,
} from '@/src/repositories/memoriesRepository';
import { logError } from '@/src/lib/monitoring/errorLogger';
import {
  deleteAllPhotosForUser,
  removePhotoByRef,
  uploadPhotoForUser,
} from '@/src/repositories/photoRepository';
import { findLatestCompletedUserQuestForQuest } from '@/src/repositories/userQuestsRepository';
import type { MemoryEntry } from '@/src/types/memory';

type MemoryDomainState = {
  memories: MemoryEntry[];
  initializedForUserId: string | null;
  /**
   * When the timeline was last fetched. Photo links are signed for a few days at load time, so a
   * phone that keeps the app in memory for long refetches when it comes back (appLifecycle).
   */
  loadedAt: number | null;
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
  loadedAt: null,
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
      set({ memories, initializedForUserId: userId, loading: false, loadedAt: Date.now() });
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
      set({ memories, initializedForUserId: userId, loading: false, loadedAt: Date.now() });
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
      let photoRef: string | null = null;
      let photoFailed = false;
      if (input.photoUri) {
        try {
          photoRef = await uploadPhotoForUser({ userId, localUri: input.photoUri });
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
        photoUrl: photoRef,
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
      // The screen hands back what it showed; the database keeps where the photo is.
      let photoRef: string | null;
      if (input.photoUri === null) {
        photoRef = null;
      } else if (current && (input.photoUri === current.photoUri || /^https?:/i.test(input.photoUri))) {
        // Unchanged. A web link here is always the stored photo, shown — a newly picked one is a
        // local file — even if the timeline re-signed its link while the memory was being edited.
        photoRef = current.photoRef;
      } else {
        photoRef = await uploadPhotoForUser({ userId, localUri: input.photoUri });
      }

      const entry = await updateMemoryEntry({
        userId,
        id,
        title: input.title,
        body: input.body,
        photoUrl: photoRef,
        categoryId: input.categoryId,
      });
      set((s) => ({
        memories: s.memories.map((m) => (m.id === id ? entry : m)),
      }));
      // Replaced or removed: the old file belongs to nothing any more.
      if (current?.photoRef && current.photoRef !== photoRef) {
        void removePhotoByRef(userId, current.photoRef);
      }
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
      const photoRef = get().memories.find((m) => m.id === id)?.photoRef ?? null;
      await deleteMemoryEntry({ userId, id });
      set((s) => ({ memories: s.memories.filter((m) => m.id !== id) }));
      void removePhotoByRef(userId, photoRef);
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
      // Every memory is gone, so every memory photo is too.
      await deleteAllPhotosForUser(userId).catch((e: unknown) =>
        logError('memoryStore.deleteAllMemories.photos', e, { userId })
      );
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
      loadedAt: null,
      loading: false,
      saving: false,
      error: null,
    }),
}));
