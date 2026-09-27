import { supabase } from '@/lib/supabase';
import { photoPathFromRef, signedPhotoUrls } from '@/src/repositories/photoRepository';
import type { MemoryEntry } from '@/src/types/memory';

type MemoryRowWithJoin = {
  id: string;
  user_quest_id: string | null;
  title: string;
  body: string;
  photo_url: string | null;
  created_at: string;
  category_id?: string | null;
  user_quests?: { quest_id: string | null }[] | { quest_id: string | null } | null;
};

function mapMemoryRow(row: MemoryRowWithJoin): MemoryEntry {
  const relation = Array.isArray(row.user_quests)
    ? row.user_quests[0]
    : row.user_quests;
  return {
    id: row.id,
    questId: relation?.quest_id ?? null,
    userQuestId: row.user_quest_id,
    title: row.title,
    body: row.body,
    photoUri: null,
    photoRef: row.photo_url ?? null,
    categoryId: row.category_id ?? null,
    createdAt: row.created_at,
  };
}

/**
 * Gives each memory a fresh, short-lived link to its photo — the database holds only where the
 * photo is (see `uploadPhotoForUser`). One request for the whole timeline.
 *
 * If signing fails (no signal), the memories still load: an old stored link is shown while it
 * lasts, a bare path shows no photo until the next load.
 */
async function withDisplayPhotos(entries: MemoryEntry[]): Promise<MemoryEntry[]> {
  const paths = entries
    .map((e) => photoPathFromRef(e.photoRef))
    .filter((p): p is string => Boolean(p));
  let signed = new Map<string, string>();
  try {
    signed = await signedPhotoUrls(paths);
  } catch {
    // Fall through to the stored values below.
  }
  return entries.map((e) => {
    const path = photoPathFromRef(e.photoRef);
    const fresh = path ? signed.get(path) : undefined;
    const storedLink = e.photoRef && /^https?:/i.test(e.photoRef) ? e.photoRef : null;
    return { ...e, photoUri: fresh ?? storedLink };
  });
}

/**
 * `memory_entries.category_id` arrived with round 2 (R2-11) and needs
 * `supabase/memory_category.sql` run against the project. Until it has been,
 * any query naming the column fails — which would take the whole Memories tab
 * down with it. So every query here retries without the column on that
 * specific error, and remembers the answer for the rest of the session so a
 * missing column costs one failed request, not one per call.
 */
let categoryColumnMissing = false;

function isMissingCategoryColumn(error: unknown): boolean {
  const message = (
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message: unknown }).message)
      : String(error ?? '')
  ).toLowerCase();
  return (
    message.includes('category_id') &&
    (message.includes('does not exist') || message.includes('schema cache'))
  );
}

const BASE_COLUMNS = 'id,user_quest_id,title,body,photo_url,created_at';
const JOIN = 'user_quests(quest_id)';

function columns(withJoin: boolean): string {
  const base = categoryColumnMissing ? BASE_COLUMNS : `${BASE_COLUMNS},category_id`;
  return withJoin ? `${base},${JOIN}` : base;
}

/**
 * Runs `query`; if it failed only because `category_id` is missing, marks it
 * and runs it again without the column.
 *
 * Whether to retry depends on whether *this* attempt named the column — not on
 * the shared flag. The Memories tab loads twice at start-up, concurrently; both
 * requests go out with the column, the first to fail sets the flag, and the
 * second used to see the flag already set, skip its retry and surface "Failed
 * to load memories" (caught verifying R2-11 in the browser, 2026-09-21).
 */
async function withCategoryFallback<T>(
  query: () => PromiseLike<{ data: T; error: unknown }>
): Promise<T> {
  const namedColumn = !categoryColumnMissing;
  const first = await query();
  if (!first.error) return first.data;
  if (namedColumn && isMissingCategoryColumn(first.error)) {
    categoryColumnMissing = true;
    const second = await query();
    if (!second.error) return second.data;
    throw second.error;
  }
  throw first.error;
}

export async function fetchMemoryTimeline(userId: string): Promise<MemoryEntry[]> {
  const data = await withCategoryFallback(() =>
    supabase
      .from('memory_entries')
      .select(columns(true))
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
  );
  return withDisplayPhotos(((data ?? []) as unknown as MemoryRowWithJoin[]).map(mapMemoryRow));
}

export async function createMemoryEntry(params: {
  userId: string;
  userQuestId: string | null;
  questId: string | null;
  title: string;
  body: string;
  photoUrl: string | null;
  /** Only meaningful for a memory with no quest — a quest's memory takes the quest's category. */
  categoryId?: string | null;
}): Promise<MemoryEntry> {
  const data = await withCategoryFallback(() =>
    supabase
      .from('memory_entries')
      .insert({
        user_id: params.userId,
        user_quest_id: params.userQuestId,
        title: params.title,
        body: params.body,
        photo_url: params.photoUrl,
        ...(categoryColumnMissing ? {} : { category_id: params.categoryId ?? null }),
      })
      .select(columns(false))
      .single()
  );
  const row = data as unknown as MemoryRowWithJoin;

  const [entry] = await withDisplayPhotos([
    {
      id: row.id,
      userQuestId: row.user_quest_id ?? null,
      questId: params.questId,
      title: row.title,
      body: row.body,
      photoUri: null,
      photoRef: row.photo_url ?? null,
      categoryId: row.category_id ?? null,
      createdAt: row.created_at,
    },
  ]);
  return entry;
}

/** Admin tool: wipes every memory entry for a user. The store removes the photos (see memoryStore). */
export async function deleteAllMemoriesForUser(userId: string): Promise<void> {
  const { error } = await supabase.from('memory_entries').delete().eq('user_id', userId);
  if (error) throw error;
}

export async function updateMemoryEntry(params: {
  userId: string;
  id: string;
  title: string;
  body: string;
  photoUrl: string | null;
  /** `undefined` leaves the stored category alone. */
  categoryId?: string | null;
}): Promise<MemoryEntry> {
  const data = await withCategoryFallback(() =>
    supabase
      .from('memory_entries')
      .update({
        title: params.title,
        body: params.body,
        photo_url: params.photoUrl,
        ...(categoryColumnMissing || params.categoryId === undefined
          ? {}
          : { category_id: params.categoryId }),
      })
      .eq('id', params.id)
      .eq('user_id', params.userId)
      .select(columns(true))
      .single()
  );
  const [entry] = await withDisplayPhotos([mapMemoryRow(data as unknown as MemoryRowWithJoin)]);
  return entry;
}

/** Row data only — the store removes the photo afterwards (removePhotoByRef). */
export async function deleteMemoryEntry(params: { userId: string; id: string }): Promise<void> {
  const { error } = await supabase
    .from('memory_entries')
    .delete()
    .eq('id', params.id)
    .eq('user_id', params.userId);
  if (error) throw error;
}
