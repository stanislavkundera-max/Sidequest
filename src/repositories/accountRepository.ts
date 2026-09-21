import { supabase } from '@/lib/supabase';
import { PHOTO_BUCKET } from '@/src/repositories/photoRepository';

/** Storage lists at most this many objects per call. */
const LIST_PAGE = 1000;

/**
 * Removes every photo under the user's own folder in the memory-photo bucket,
 * through the Storage API.
 *
 * This used to happen inside `delete_own_account()` as a plain
 * `delete from storage.objects`. Supabase now rejects that outright — "Direct
 * deletion from storage tables is not allowed. Use the Storage API instead." —
 * for the whole statement, even when no rows match, so account deletion failed
 * for *every* user with "Could not delete your account" (found 2026-09-21 while
 * verifying round-2 fixes). The `quest_memory_photos_delete_own` policy already
 * lets a user remove their own files, so the client does it first.
 */
async function deleteOwnPhotos(userId: string): Promise<void> {
  const bucket = supabase.storage.from(PHOTO_BUCKET);
  // Removing shifts the listing, so always read the first page until it is empty.
  for (;;) {
    const { data, error } = await bucket.list(userId, { limit: LIST_PAGE });
    if (error) throw error;
    const paths = (data ?? []).filter((f) => f.name).map((f) => `${userId}/${f.name}`);
    if (paths.length === 0) return;
    const { error: removeError } = await bucket.remove(paths);
    if (removeError) throw removeError;
    if (paths.length < LIST_PAGE) return;
  }
}

/**
 * Permanently deletes the signed-in user's account and all their data
 * (profile, quests, memories, photos; analytics events are anonymized, not
 * deleted). Photos go first through the Storage API (see `deleteOwnPhotos`),
 * then the `delete_own_account` Postgres function (see `supabase/schema.sql`)
 * removes the rest. It operates on `auth.uid()` only — there is no way to pass
 * a different user id, by design. Irreversible.
 */
export async function deleteOwnAccount(): Promise<void> {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const userId = auth.user?.id;
  if (!userId) throw new Error('Not signed in.');

  await deleteOwnPhotos(userId);

  const { error } = await supabase.rpc('delete_own_account');
  if (error) throw error;
}
