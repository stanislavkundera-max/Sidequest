import React from 'react';
import { Redirect, router, Tabs } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { FeedbackPromptHost } from '@/components/feedback/FeedbackPromptHost';
import { DawnTabBar } from '@/components/ui/DawnTabBar';
import { LoadingState } from '@/components/ui/LoadingState';
import { Theme } from '@/constants/Theme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useMemoryStore } from '@/src/features/memories/memoryStore';
import { useQuestDomainStore } from '@/src/features/quests/questStore';
import { runSupabasePilotHealthCheck } from '@/src/lib/supabaseHealth';
import { useSessionStore } from '@/stores/session';

export default function TabLayout() {
  const user = useSessionStore((s) => s.user);
  const initialized = useSessionStore((s) => s.initialized);
  const bootstrapQuests = useQuestDomainStore((s) => s.bootstrap);
  const bootstrapMemories = useMemoryStore((s) => s.bootstrap);
  // Must run before any early return — it owns a useState/useEffect internally,
  // so calling it conditionally would change the hook order between renders.
  const headerShown = useClientOnlyValue(false, true);

  useEffect(() => {
    if (!user) return;
    bootstrapQuests(user.id);
    bootstrapMemories(user.id);
    runSupabasePilotHealthCheck(user.id).catch(() => undefined);
  }, [user, bootstrapQuests, bootstrapMemories]);

  if (!initialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: Theme.bg }}>
        <LoadingState label="Loading account..." />
      </View>
    );
  }

  if (initialized && !user) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <>
      <Tabs
        initialRouteName="explore"
        // The Dawn floating pill (redesign, 2026-10-22): icons, labels and the active state live in
        // DawnTabBar, so the tabBar* options that styled the old full-width bar are gone.
        tabBar={(props) => <DawnTabBar {...props} />}
        screenOptions={{
          headerStyle: { backgroundColor: Theme.bg },
          headerTintColor: Theme.text,
          headerShadowVisible: false,
          headerShown,
        }}>
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="journey"
          options={{
            title: 'Journey',
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: '',
            href: null,
          }}
        />
        <Tabs.Screen
          name="memories"
          options={{
            title: 'Memories',
            // Every tab screen renders its own title; leaving the navigation
            // header on showed "Memories" twice.
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Progress',
            headerShown: false,
          }}
          listeners={{
            tabPress: () => {
              router.navigate('/(tabs)/profile');
            },
          }}
        />
      </Tabs>
      {/* Task 60: the feedback pop-up asks now and then, only on these tabs' calm moments. */}
      <FeedbackPromptHost />
    </>
  );
}
