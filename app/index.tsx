import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

import { DawnBackground } from '@/components/ui/DawnBackground';
import { Theme } from '@/constants/Theme';
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
      // Loading (redesign screen 1): the amber cairn on the Dawn ground, exactly what the native
      // splash shows (app.config.ts: same image, same size, the ground's top colour), so the
      // hand-off from splash to JS doesn't jump. No glow, since the native splash can only be one
      // flat colour. The splash colour is native: it changes with the next build (next-build).
      <DawnBackground noGlow>
        <View style={styles.center}>
          <Image
            source={require('@/assets/images/splash-icon.png')}
            style={styles.mark}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
          <View style={styles.status}>
            <ActivityIndicator color={Theme.accent} />
            <Text style={styles.label}>Preparing your space…</Text>
          </View>
        </View>
      </DawnBackground>
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

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mark: { width: 220, height: 220 },
  // Below the cairn, out of the layout, so the cairn stays exactly where the splash had it.
  status: { position: 'absolute', top: '50%', marginTop: 130, left: 0, right: 0, alignItems: 'center', gap: 14 },
  label: { color: '#e6dfca', fontSize: 15, fontFamily: 'Inter_400Regular' },
});
