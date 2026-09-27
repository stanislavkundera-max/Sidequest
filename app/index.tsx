import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

import { getDevAutoLoginCredentials } from '@/lib/devAuth';
import { getOnboardingComplete } from '@/lib/onboarding';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { logError } from '@/src/lib/monitoring/errorLogger';
import { useSessionStore } from '@/stores/session';

export default function Index() {
  const initialized = useSessionStore((s) => s.initialized);
  const user = useSessionStore((s) => s.user);
  const setSession = useSessionStore((s) => s.setSession);
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  // app_opened is counted in app/_layout.tsx once the user is known. Counting it here ran before
  // identify, so every cold start was stored without a user (code review 2026-09-27).

  useEffect(() => {
    if (!initialized) return;
    if (!isSupabaseConfigured()) {
      setAuthChecked(true);
      return;
    }
    if (user) {
      setAuthChecked(true);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        let sessionEstablished = false;
        const devCreds = getDevAutoLoginCredentials();
        if (devCreds) {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: devCreds.email,
            password: devCreds.password,
          });
          if (!cancelled && !error && data.session) {
            setSession(data.session);
            sessionEstablished = true;
          } else if (error && __DEV__) {
            logError('index.devAutoLogin', error);
          }
        }
        if (!cancelled && !sessionEstablished) {
          const { data } = await supabase.auth.signInAnonymously();
          if (!cancelled && data.session) {
            setSession(data.session);
          }
        }
      } catch (error: unknown) {
        logError('index.signInAnonymously', error);
        // Fallback: regular sign-in screen.
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialized, user, setSession]);

  useEffect(() => {
    if (!initialized || !user) return;
    getOnboardingComplete()
      .then(setOnboardingDone)
      .catch((error: unknown) => {
        logError('index.getOnboardingComplete', error, { userId: user.id });
        setOnboardingDone(false);
      });
  }, [initialized, user]);

  if (!initialized || !authChecked || (user && onboardingDone === null)) {
    return (
      // Same ground and same mark as the native splash (app.config.ts), so the
      // hand-off doesn't flash from green to beige. It used to be a beige screen
      // with a spinner, over which the old green-stoned splash faded out — the
      // "outdated logo" a tester reported (round 2, R2-07).
      <View style={styles.center}>
        <Image
          source={require('@/assets/images/splash-icon.png')}
          style={styles.mark}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
        <ActivityIndicator color={BRAND_BEIGE} />
        <Text style={styles.label}>Preparing your space…</Text>
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (!onboardingDone) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)/explore" />;
}

/** Brand colours, not the UI palette — BRANDING.md §2 reserves these for the mark. */
const BRAND_GREEN = '#33471f';
const BRAND_BEIGE = '#f3f2ec';

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    backgroundColor: BRAND_GREEN,
  },
  mark: { width: 220, height: 220 },
  label: {
    color: BRAND_BEIGE,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    opacity: 0.85,
  },
});
