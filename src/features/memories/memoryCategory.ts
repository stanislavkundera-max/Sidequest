import type { Quest } from '@/src/types/quest';
import type { MemoryEntry } from '@/src/types/memory';

/**
 * The category a memory belongs to, for filtering and accents.
 *
 * A quest's memory takes its quest's category — that is the model Eva worked
 * out on her own ("ty kategorie jsou na základě toho z jaké sféry ten úkol je").
 * A memory written by hand has no quest, so it carries its own, optional one
 * (round 2, R2-11). `null` means uncategorised, which is a fine thing to be.
 */
export function memoryCategoryId(
  memory: Pick<MemoryEntry, 'questId' | 'categoryId'>,
  getQuestById: (id: string) => Quest | undefined
): string | null {
  if (memory.questId) return getQuestById(memory.questId)?.categoryId ?? null;
  return memory.categoryId ?? null;
}
