import { create } from 'zustand';

import { readForUser, writeForUser } from '@/src/lib/deviceStorage';
import { useSessionStore } from '@/stores/session';

const KEY = 'quests:unavailable-here';

/**
 * Quests this person said they can't do where they live ("Tady to nejde").
 *
 * Distinct from "Not for me" on purpose. A quest you turned down comes back once
 * you have done everything else in its category; a quest you can't do at all —
 * no station, no river, no climbing gym within reach — must not, or it returns
 * as dead content at exactly the moment the category is nearly finished.
 * Standa's rule 8 (R2-27): content offers alternatives where it can, and this
 * catches everything content can't cover.
 *
 * Device-local, modelled on `seenQuests.ts`: no table, no migration. The price
 * is that it is not shared between devices and a reinstall forgets it, which is
 * the right trade for a preference that is really about a place. Kept per account
 * on the device (`src/lib/deviceStorage.ts`), so the list is loaded for whoever
 * is signed in and dropped on sign-out.
 */
type State = {
  ids: ReadonlySet<string>;
  /** The account the list was read for; a different account reads its own. */
  loadedFor: string | null;
  load: () => Promise<void>;
  markUnavailable: (questId: string) => Promise<void>;
  reset: () => void;
};

async function read(userId: string): Promise<Set<string>> {
  try {
    const raw = await readForUser(KEY, userId);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === 'string'));
  } catch {
    return new Set();
  }
}

let inflight: { uid: string; promise: Promise<void> } | null = null;

export const useUnavailableQuestStore = create<State>((set, get) => ({
  ids: new Set(),
  loadedFor: null,

  load: async () => {
    const uid = useSessionStore.getState().user?.id ?? null;
    if (!uid || get().loadedFor === uid) return;
    // Every render asks; one read per account answers them all.
    if (inflight?.uid === uid) return inflight.promise;
    const promise = (async () => {
      const ids = await read(uid);
      // Signed out or switched while reading: this list is not theirs.
      if (useSessionStore.getState().user?.id !== uid) return;
      set({ ids, loadedFor: uid });
    })();
    inflight = { uid, promise };
    try {
      await promise;
    } finally {
      if (inflight?.promise === promise) inflight = null;
    }
  },

  markUnavailable: async (questId) => {
    // Without this, a first use before anything loaded the list would write just this one id
    // and drop every quest hidden earlier.
    await get().load();
    const uid = get().loadedFor;
    const next = new Set(get().ids);
    next.add(questId);
    // Update the screen first; storage failing costs persistence, not the action.
    set({ ids: next });
    if (!uid) return;
    try {
      await writeForUser(KEY, JSON.stringify([...next]), uid);
    } catch {
      // Nothing to do — see above.
    }
  },

  reset: () => {
    inflight = null;
    set({ ids: new Set(), loadedFor: null });
  },
}));

/** The set to hand to the offer logic. Loads from storage the first time it is used. */
export function useUnavailableQuestIds(): ReadonlySet<string> {
  const ids = useUnavailableQuestStore((s) => s.ids);
  const load = useUnavailableQuestStore((s) => s.load);
  // Idempotent; cheap once loaded for the signed-in account.
  void load();
  return ids;
}
