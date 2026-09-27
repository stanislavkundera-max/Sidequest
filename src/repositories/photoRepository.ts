import { File } from 'expo-file-system';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';
import { PHOTO_BUCKET, photoPathFromRef } from '@/src/features/memories/photoRef';

export { PHOTO_BUCKET, photoPathFromRef };

/**
 * How long a displayed photo link lasts. Links are made fresh whenever memories load (and again
 * when the app comes back after a day), so this only has to outlive one sitting.
 */
const DISPLAY_URL_SECONDS = 7 * 24 * 60 * 60;

function extensionFromUri(uri: string): string {
  const match = uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return match?.[1]?.toLowerCase() ?? 'jpg';
}

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
};

/**
 * The bytes of a picked or captured photo, in the shape the upload accepts.
 *
 * Native reads the file straight off disk as an ArrayBuffer. It used to go
 * through `fetch(localUri).blob()` everywhere, and supabase-js's own docs say
 * that does not work on React Native: "using either Blob, File or FormData does
 * not work as intended. Upload file using ArrayBuffer". On Android it failed
 * with "Network request failed" — the error a tester hit saving the memory for
 * "Leave the ground" (round 2, R2-04). The web keeps the Blob path, which
 * browsers handle fine.
 */
async function readPhotoBody(
  localUri: string,
  ext: string
): Promise<{ body: ArrayBuffer | Blob; contentType: string }> {
  const fallbackType = CONTENT_TYPE_BY_EXTENSION[ext] ?? 'image/jpeg';
  if (Platform.OS === 'web') {
    const blob = await (await fetch(localUri)).blob();
    return { body: blob, contentType: blob.type || fallbackType };
  }
  const body = await new File(localUri).arrayBuffer();
  return { body, contentType: fallbackType };
}

/**
 * Uploads a photo into the user's folder and returns its storage path — which is what gets
 * stored, never a link.
 *
 * It used to return a signed URL valid for one year, and that URL went into the database: every
 * memory photo would have stopped loading a year after it was taken, in an app whose point is
 * looking back — and anyone holding the URL could open the photo for that year (code review
 * 2026-09-27). Links are now made when a photo is shown; see `signedPhotoUrls`.
 */
export async function uploadPhotoForUser(params: {
  userId: string;
  localUri: string;
}): Promise<string> {
  const ext = extensionFromUri(params.localUri);
  const path = `${params.userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { body, contentType } = await readPhotoBody(params.localUri, ext);

  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, body, {
      contentType,
      upsert: false,
    });
  if (uploadError) throw uploadError;
  return path;
}

/** Short-lived display links for many photos in one request. Paths that fail are left out. */
export async function signedPhotoUrls(paths: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter(Boolean))];
  const out = new Map<string, string>();
  if (unique.length === 0) return out;
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(unique, DISPLAY_URL_SECONDS);
  if (error) throw error;
  for (const item of data ?? []) {
    if (item.path && item.signedUrl && !item.error) out.set(item.path, item.signedUrl);
  }
  return out;
}

/**
 * Removes a photo that no longer belongs to any memory — replaced, taken off, or its memory
 * deleted. Before, those files stayed in storage until the whole account was deleted, although
 * the person had removed them (code review 2026-09-27).
 *
 * Best effort: a leftover file costs storage, not the action that replaced it. Only paths in the
 * user's own folder are touched; the storage policy would refuse anything else anyway.
 */
export async function removePhotoByRef(
  userId: string,
  ref: string | null | undefined
): Promise<void> {
  const path = photoPathFromRef(ref);
  if (!path || !path.startsWith(`${userId}/`)) return;
  try {
    await supabase.storage.from(PHOTO_BUCKET).remove([path]);
  } catch {
    // See above.
  }
}

/** Storage lists at most this many objects per call. */
const LIST_PAGE = 1000;

/**
 * Removes every photo under the user's own folder, through the Storage API.
 *
 * Used by account deletion and by the admin "delete all progress" tool. Account deletion used to
 * do this inside `delete_own_account()` as a plain `delete from storage.objects`, which Supabase
 * now rejects outright ("Direct deletion from storage tables is not allowed. Use the Storage API
 * instead.") — for the whole statement, even when no rows match — so deletion failed for every
 * user (found 2026-09-21). The `quest_memory_photos_delete_own` policy lets a user remove their
 * own files, so the client does it.
 */
export async function deleteAllPhotosForUser(userId: string): Promise<void> {
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
