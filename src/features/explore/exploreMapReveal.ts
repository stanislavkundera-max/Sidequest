import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'explore:revealed-categories';

export async function loadRevealedCategoryIds(): Promise<Set<string>> {
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

export async function markCategoryRevealed(categoryId: string): Promise<Set<string>> {
  const current = await loadRevealedCategoryIds();
  if (current.has(categoryId)) return current;
  current.add(categoryId);
  await AsyncStorage.setItem(KEY, JSON.stringify([...current]));
  return current;
}
