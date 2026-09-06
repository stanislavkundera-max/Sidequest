import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
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
import { Platform, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';

import { Theme } from '@/constants/Theme';
import { supabase } from '@/lib/supabase';
import { identifyUser, resetAnalytics, trackAppOpened } from '@/src/lib/analytics';
import { logError } from '@/src/lib/monitoring/errorLogger';
import { useMemoryStore } from '@/src/features/memories/memoryStore';
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
  // The brand faces from BRANDING.md §3: Fraunces for headings, Inter for body.
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
    Fraunces_600SemiBold,
    Fraunces_700Bold,
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

  useEffect(() => {
    let mounted = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      setSession(session);

      // One startup path only — avoids racing getSession() with INITIAL_SESSION (Web Locks / process lock timeouts).
      if (event === 'INITIAL_SESSION') {
        setInitialized(true);
        if (session?.user) {
          identifyUser(session.user.id).catch(() => undefined);
          trackAppOpened('root_layout_authenticated').catch(() => undefined);
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
        trackAppOpened('auth_state_change').catch(() => undefined);
        ensureProfileForUser({
          id: session.user.id,
          email: session.user.email,
        }).catch((error) =>
          logError('root_layout.ensureProfileForUser.authChange', error, {
            userId: session.user?.id,
          })
        );
      } else {
        resetAnalytics().catch(() => undefined);
        clearQuestDomain();
        clearMemories();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setSession, setInitialized, clearQuestDomain, clearMemories]);

  const navTheme = colorScheme === 'dark' ? NavDark : NavLight;
  const paperTheme = colorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme;

  const inner = (
    <PaperProvider theme={paperTheme}>
      <NavigationThemeProvider value={navTheme}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack>
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
            name="quest/select"
            options={{
              title: 'Pick quests',
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
            }}
          />
          <Stack.Screen
            name="memory/[id]"
            options={{
              title: 'Memory',
              headerBackTitle: 'Back',
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
