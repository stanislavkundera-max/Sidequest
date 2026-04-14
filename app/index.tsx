import { Redirect } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { LoadingState } from '@/components/ui/LoadingState';
import { Theme } from '@/constants/Theme';
import { getOnboardingComplete } from '@/lib/onboarding';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { trackAppOpened } from '@/src/lib/analytics';
import { logError } from '@/src/lib/monitoring/errorLogger';
import { useSessionStore } from '@/stores/session';

export default function Index() {
  const initialized = useSessionStore((s) => s.initialized);
  const user = useSessionStore((s) => s.user);
  const setSession = useSessionStore((s) => s.setSession);
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const appOpenedTracked = useRef(false);

  useEffect(() => {
    if (appOpenedTracked.current) return;
    appOpenedTracked.current = true;
    trackAppOpened('index').catch(() => undefined);
  }, []);

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
        const { data } = await supabase.auth.signInAnonymously();
        if (!cancelled && data.session) {
          setSession(data.session);
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
      <View style={styles.center}>
        <LoadingState label="Preparing your space..." />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (!onboardingDone) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.bg,
  },
});
