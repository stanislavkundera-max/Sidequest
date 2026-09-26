import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

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
 * the right trade for a preference that is really about a place.
 */
type State = {
  ids: ReadonlySet<string>;
  loaded: boolean;
  load: () => Promise<void>;
  markUnavailable: (questId: string) => Promise<void>;
};

async function read(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === 'string'));
  } catch {
    return new Set();
  }
}

export const useUnavailableQuestStore = create<State>((set, get) => ({
  ids: new Set(),
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    set({ ids: await read(), loaded: true });
  },

  markUnavailable: async (questId) => {
    const next = new Set(get().ids);
    next.add(questId);
    // Update the screen first; storage failing costs persistence, not the action.
    set({ ids: next, loaded: true });
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify([...next]));
    } catch {
      // Nothing to do — see above.
    }
  },
}));

/** The set to hand to the offer logic. Loads from storage the first time it is used. */
export function useUnavailableQuestIds(): ReadonlySet<string> {
  const ids = useUnavailableQuestStore((s) => s.ids);
  const load = useUnavailableQuestStore((s) => s.load);
  // Idempotent; cheap after the first call.
  void load();
  return ids;
}
