import type { MemoryEntry } from '@/src/types/memory';
import type { Memory } from '@/types/database';

export type MergedMemoryRow =
  | { source: 'local'; entry: MemoryEntry }
  | { source: 'remote'; row: Memory };

function rowTime(m: MergedMemoryRow): number {
  if (m.source === 'local') return new Date(m.entry.createdAt).getTime();
  return new Date(m.row.created_at).getTime();
}

/** Union by id; local rows win over remote for the same id. Newest first. */
export function mergeMemories(
  local: MemoryEntry[],
  remote: Memory[]
): MergedMemoryRow[] {
  const byId = new Map<string, MergedMemoryRow>();
  for (const row of remote) {
    byId.set(row.id, { source: 'remote', row });
  }
  for (const entry of local) {
    byId.set(entry.id, { source: 'local', entry });
  }
  return [...byId.values()].sort((a, b) => rowTime(b) - rowTime(a));
}
