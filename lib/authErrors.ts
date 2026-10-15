import { isAuthError } from '@supabase/supabase-js';

import { isNetworkError, NO_CONNECTION_MESSAGE, UserFacingError } from '@/lib/userFacingError';

/**
 * Turns a thrown Supabase auth error into something a user can act on.
 *
 * Offline used to read as a paragraph for developers — copy the Project URL into
 * EXPO_PUBLIC_SUPABASE_URL, restart Expo — shown to anyone signing in without signal (task 50).
 * A wrong URL in a build is caught long before anyone signs in; on a phone, a failed request
 * means no connection. Supabase's own auth messages are plain English and stay.
 */
export function formatAuthErrorForUi(e: unknown): string {
  if (e instanceof UserFacingError) return e.message;
  if (isNetworkError(e)) return NO_CONNECTION_MESSAGE;
  if (isAuthError(e)) {
    if (e.code === 'invalid_credentials') return "That e-mail and password don't match.";
    if (e.code === 'over_email_send_rate_limit') {
      return 'Too many e-mails in a short time. Wait a few minutes, then try again.';
    }
    if (e.message) return e.message;
  }
  return 'Something went wrong. Try again in a moment.';
}
