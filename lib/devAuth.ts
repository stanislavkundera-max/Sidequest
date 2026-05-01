import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra as
  | { devLoginEmail?: string; devLoginPassword?: string }
  | undefined;

function firstNonEmpty(...candidates: (string | undefined)[]): string {
  for (const c of candidates) {
    const t = typeof c === 'string' ? c.trim() : '';
    if (t.length > 0) return t;
  }
  return '';
}

/**
 * In development only: if both email and password are set (via .env / app.config extra),
 * `app/index` can sign in automatically and skip the sign-in screen.
 */
export function getDevAutoLoginCredentials(): {
  email: string;
  password: string;
} | null {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return null;
  const email = firstNonEmpty(
    extra?.devLoginEmail,
    process.env.EXPO_PUBLIC_DEV_LOGIN_EMAIL
  );
  const password = firstNonEmpty(
    extra?.devLoginPassword,
    process.env.EXPO_PUBLIC_DEV_LOGIN_PASSWORD
  );
  if (!email || !password) return null;
  return { email, password };
}
