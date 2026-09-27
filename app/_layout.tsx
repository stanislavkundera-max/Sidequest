import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AppState, Platform, StyleSheet, View, type AppStateStatus } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { HeaderBackButton } from '@/components/ui/HeaderBackButton';
import 'react-native-reanimated';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';

import { Theme } from '@/constants/Theme';
import { supabase } from '@/lib/supabase';
import { identifyUser, resetAnalytics, trackAppOpened } from '@/src/lib/analytics';
import { logError } from '@/src/lib/monitoring/errorLogger';
import {
  onAppForeground,
  resetDeviceStateForSignOut,
  syncDeviceStateForUser,
} from '@/src/features/app/appLifecycle';
import { useMemoryStore } from '@/src/features/memories/memoryStore';
import { cancelAllQuestNotifications } from '@/src/features/notifications/questNotifications';
import { useQuestNotificationTaps } from '@/src/features/notifications/useQuestNotificationTaps';
import { useQuestDomainStore } from '@/src/features/quests/questStore';
import { ensureProfileForUser } from '@/src/repositories/profilesRepository';
import { useSessionStore } from '@/stores/session';
import { useColorScheme } from '@/components/useColorScheme';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

const NavLight = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Theme.bg,
    card: Theme.surface,
    text: Theme.text,
    border: Theme.border,
    primary: Theme.accent,
  },
};

const NavDark = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#1a1816',
    card: '#242120',
    text: '#f4f1ec',
    border: '#3d3835',
    primary: Theme.accent,
  },
};

export default function RootLayout() {
  // One family, Inter, per BRANDING.md §3 (revised 2026-09-21). Headings are
  // Inter Bold; Fraunces was dropped because a serif heading next to sans body
  // text read as a mistake (round 2, R2-20) — and it saves two font files.
  //
  // Only the cuts actually used are loaded — each is a file the app downloads
  // and parses before the splash screen can go away, so an unused weight is
  // startup time spent on nothing. `SpaceMono` was exactly that: an Expo
  // template leftover, referenced by no style in the app, loaded on every cold
  // start since the project began. Removed 2026-09-06.
  //
  // Android does not synthesise weight for custom fonts — `fontWeight: '700'`
  // on a family that has no bold cut silently renders regular. That is why the
  // weights are separate families here and why `Type` in constants/Theme.ts
  // names them rather than letting screens set fontWeight and hope.
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const setSession = useSessionStore((s) => s.setSession);
  const setInitialized = useSessionStore((s) => s.setInitialized);
  const clearQuestDomain = useQuestDomainStore((s) => s.resetDomainState);
  const clearMemories = useMemoryStore((s) => s.clearMemories);
  const sessionReady = useSessionStore((s) => s.initialized);
  useQuestNotificationTaps(sessionReady);

  useEffect(() => {
    let mounted = true;
    // The account this listener last saw. SIGNED_IN also fires for the *same* account — when the
    // stored session is restored at start, and when a guest confirms their e-mail — and neither
    // is a new open.
    let lastUserId: string | null = null;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      setSession(session);
      const previousUserId = lastUserId;
      lastUserId = session?.user?.id ?? null;

      // One startup path only — avoids racing getSession() with INITIAL_SESSION (Web Locks / process lock timeouts).
      if (event === 'INITIAL_SESSION') {
        setInitialized(true);
        if (session?.user) {
          // Identify first, then count the open: an `app_opened` sent before identify carried no
          // user, and the D2/D7 queries (validation_queries.sql) skip rows without one — so cold
          // starts never counted (code review 2026-09-27).
          identifyUser(session.user.id).catch(() => undefined);
          trackAppOpened('cold_start').catch(() => undefined);
          syncDeviceStateForUser(session.user.id);
          ensureProfileForUser({
            id: session.user.id,
            email: session.user.email,
          }).catch((error) =>
            logError('root_layout.ensureProfileForUser.initial', error, {
              userId: session.user?.id,
            })
          );
        }
        return;
      }

      if (session?.user) {
        identifyUser(session.user.id).catch(() => undefined);
        // Only signing in to a different account is an open. TOKEN_REFRESHED arrives about hourly
        // while the app sits open and USER_UPDATED on any account change; counting those
        // inflated app_opened.
        if (event === 'SIGNED_IN' && session.user.id !== previousUserId) {
          trackAppOpened('sign_in').catch(() => undefined);
          syncDeviceStateForUser(session.user.id);
          ensureProfileForUser({
            id: session.user.id,
            email: session.user.email,
          }).catch((error) =>
            logError('root_layout.ensureProfileForUser.authChange', error, {
              userId: session.user?.id,
            })
          );
        }
      } else {
        resetAnalytics().catch(() => undefined);
        void cancelAllQuestNotifications();
        clearQuestDomain();
        clearMemories();
        resetDeviceStateForSignOut();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setSession, setInitialized, clearQuestDomain, clearMemories]);

  // Coming back to the app is an open too. Without this only cold starts counted, and a phone
  // keeps an app in memory for days. The same moment retries a catalogue that failed to load
  // (no signal when the app started) and picks up an account e-mail confirmed in the browser.
  useEffect(() => {
    let previous: AppStateStatus = AppState.currentState;
    const sub = AppState.addEventListener('change', (next) => {
      // From the background only: iOS passes through 'inactive' for a pulled-down control centre.
      const cameBack = previous === 'background' && next === 'active';
      previous = next;
      if (!cameBack) return;
      const user = useSessionStore.getState().user;
      if (!user) return;
      trackAppOpened('foreground').catch(() => undefined);
      onAppForeground(user.id);
    });
    return () => sub.remove();
  }, []);

  const navTheme = colorScheme === 'dark' ? NavDark : NavLight;
  const paperTheme = colorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme;

  const inner = (
    <PaperProvider theme={paperTheme}>
      <NavigationThemeProvider value={navTheme}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        {/* Every screen with a header gets a back control that works even when
            the stack is empty behind it — see HeaderBackButton for why the
            default one is not enough. Screens whose natural home is not the
            Journey tab override `headerLeft` with their own fallback below.
            Harmless on the groups that hide their header entirely. */}
        <Stack
          screenOptions={{
            headerLeft: () => <HeaderBackButton />,
            // Screen titles ("New memory", a quest's name) defaulted to the
            // system font — Roboto on Android — next to Inter everywhere else.
            // One family throughout (R2-20).
            headerTitleStyle: { fontFamily: 'Inter_600SemiBold', fontWeight: '600' },
          }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen
            name="onboarding"
            options={{ headerShown: false, animation: 'fade' }}
          />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="quest/[id]"
            options={{
              title: 'Quest',
              headerBackTitle: 'Back',
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="quest/run/[id]"
            options={{
              title: 'Run quest',
              headerBackTitle: 'Back',
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="memory/new"
            options={{
              title: 'New memory',
              presentation: 'modal',
              headerBackTitle: 'Cancel',
              headerLeft: () => (
                <HeaderBackButton fallback="/(tabs)/memories" accessibilityLabel="Cancel" />
              ),
            }}
          />
          <Stack.Screen
            name="memory/[id]"
            options={{
              title: 'Memory',
              headerBackTitle: 'Back',
              headerLeft: () => <HeaderBackButton fallback="/(tabs)/memories" />,
            }}
          />
          <Stack.Screen
            name="account/save"
            options={{
              title: 'Create an account',
              headerBackTitle: 'Back',
              headerLeft: () => <HeaderBackButton fallback="/(tabs)/profile" />,
            }}
          />
          <Stack.Screen
            name="legal/privacy"
            options={{
              title: 'Privacy Policy',
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen
            name="legal/terms"
            options={{
              title: 'Terms of Service',
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen
            name="legal/delete-account"
            options={{
              title: 'Delete Account',
              headerBackTitle: 'Back',
            }}
          />
        </Stack>
      </NavigationThemeProvider>
    </PaperProvider>
  );

  if (Platform.OS !== 'web') return inner;

  return (
    <View style={styles.webOuter}>
      <View style={styles.webMobile}>{inner}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  webOuter: {
    flex: 1,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webMobile: {
    width: 390,
    flex: 1,
    overflow: 'hidden',
  },
});
