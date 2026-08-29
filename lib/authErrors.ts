/**
 * Turns a thrown Supabase auth error into something a user can act on.
 *
 * The network case is worth special-casing: a typo in `EXPO_PUBLIC_SUPABASE_URL`
 * surfaces as a bare `TypeError` ("Failed to fetch"), which tells the user
 * nothing. Every auth screen needs the same treatment, so it lives here rather
 * than in whichever screen needed it first.
 */
export function formatAuthErrorForUi(e: unknown): string {
  if (e instanceof TypeError) {
    return (
      'Could not reach Supabase (network). Copy Project URL from Supabase → Settings → API into EXPO_PUBLIC_SUPABASE_URL ' +
      '(a typo in the hostname looks like this). Restart Expo after changing .env. If the URL is correct, check VPN/firewall and that the project is not paused.'
    );
  }
  if (e instanceof Error) {
    const m = e.message;
    if (
      m === 'Failed to fetch' ||
      m.includes('NetworkError') ||
      m.includes('Load failed')
    ) {
      return formatAuthErrorForUi(new TypeError(m));
    }
    return m;
  }
  return 'Something went wrong';
}
