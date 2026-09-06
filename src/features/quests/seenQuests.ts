import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'quests:seen';

/**
 * Quest ids this person has opened the detail screen for.
 *
 * Backs the NEW badge. "New" started out purely catalogue-wide — anything added
 * in the last 30 days — which meant a quest stayed badged after you had read it,
 * so the badge stopped meaning "look at this" and became decoration. Standa,
 * 2026-09-06: it should go once you have opened the quest.
 *
 * Device-local on purpose, and modelled on `exploreMapReveal.ts`, which already
 * does exactly this for map categories. A reinstall forgets what you have seen,
 * which is the right trade: the alternative is a per-user table and a migration
 * to make a badge slightly more accurate.
 */
export async function loadSeenQuestIds(): Promise<Set<string>> {
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

export async function markQuestSeen(questId: string): Promise<Set<string>> {
  const current = await loadSeenQuestIds();
  if (current.has(questId)) return current;
  current.add(questId);
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify([...current]));
  } catch {
    // Storage being unavailable costs a badge, not a feature. Nothing to do.
  }
  return current;
}
