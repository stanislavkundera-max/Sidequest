import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

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
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
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

  return (
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
          name="quest/select"
          options={{
            title: 'Pick quests',
            headerBackTitle: 'Back',
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="quest/completed"
          options={{
            title: 'Completed',
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
      </Stack>
    </NavigationThemeProvider>
  );
}
