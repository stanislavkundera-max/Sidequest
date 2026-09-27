/**
 * Reading what the database holds for a memory photo. Pure — no Supabase, no React Native — so
 * it can be unit tested (tests/unit/photo-and-calendar.test.mts).
 */

export const PHOTO_BUCKET = 'quest-memory-photos';

const SIGNED_URL_MARKER = `/object/sign/${PHOTO_BUCKET}/`;

/**
 * The storage path behind what the database holds for a photo.
 *
 * - A path (`<userId>/<file>`), as stored from 2026-09-27 on: returned as is.
 * - A signed URL, as stored before: the path is read out of it, so old memories get fresh links
 *   too and never hit the one-year expiry.
 * - Anything else (null, a URL from elsewhere): null — nothing to sign.
 */
export function photoPathFromRef(ref: string | null | undefined): string | null {
  if (!ref) return null;
  const trimmed = ref.trim();
  if (!trimmed) return null;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  const at = trimmed.indexOf(SIGNED_URL_MARKER);
  if (at < 0) return null;
  const rest = trimmed.slice(at + SIGNED_URL_MARKER.length).split(/[?#]/)[0];
  if (!rest) return null;
  try {
    return decodeURIComponent(rest);
  } catch {
    return rest;
  }
}
