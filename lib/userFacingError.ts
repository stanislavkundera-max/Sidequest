/**
 * What a person sees when something fails — plain words, never the technical text.
 *
 * Messages used to pass straight through: "Network request failed", database errors joined with
 * " | ", and offline on the sign-in screen a paragraph about EXPO_PUBLIC_SUPABASE_URL and
 * restarting Expo (Standa, round 2c, task 50: "the messages look like system errors"). The
 * technical text belongs in the error log, which every caller writes first.
 */

/** An error whose message was written for the person using the app — shown as it is. */
export class UserFacingError extends Error {}

export const NO_CONNECTION_MESSAGE = 'No connection. Try again when you have signal.';

function rawMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'object' && e !== null && 'message' in e) {
    const m = (e as { message?: unknown }).message;
    return typeof m === 'string' ? m : '';
  }
  return '';
}

/** A failed request rather than a refusal — fetch throws TypeError, React Native says it in words. */
export function isNetworkError(e: unknown): boolean {
  if (e instanceof TypeError) return true;
  return /network request failed|failed to fetch|networkerror|load failed|fetch failed|timed? ?out/i.test(
    rawMessage(e)
  );
}

/** The sentence to show: our own message, "no connection", or the caller's plain fallback. */
export function plainErrorMessage(e: unknown, fallback: string): string {
  if (e instanceof UserFacingError) return e.message;
  if (isNetworkError(e)) return NO_CONNECTION_MESSAGE;
  return fallback;
}
