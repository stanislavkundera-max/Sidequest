import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Redirect, router, Tabs } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { LoadingState } from '@/components/ui/LoadingState';
import { Theme } from '@/constants/Theme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useMemoryStore } from '@/src/features/memories/memoryStore';
import { useQuestDomainStore } from '@/src/features/quests/questStore';
import { runSupabasePilotHealthCheck } from '@/src/lib/supabaseHealth';
import { useSessionStore } from '@/stores/session';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -2 }} {...props} />;
}

export default function TabLayout() {
  const user = useSessionStore((s) => s.user);
  const initialized = useSessionStore((s) => s.initialized);
  const bootstrapQuests = useQuestDomainStore((s) => s.bootstrap);
  const bootstrapMemories = useMemoryStore((s) => s.bootstrap);

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
    <Tabs
      initialRouteName="journey"
      screenOptions={{
        tabBarActiveTintColor: Theme.accent,
        tabBarInactiveTintColor: Theme.textMuted,
        tabBarStyle: {
          backgroundColor: Theme.surface,
          borderTopColor: Theme.border,
        },
        headerStyle: { backgroundColor: Theme.bg },
        headerTintColor: Theme.text,
        headerShadowVisible: false,
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="journey"
        options={{
          title: 'Journey',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="map-o" color={color} />
          ),
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
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="book" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="user" color={color} />
          ),
        }}
        listeners={{
          tabPress: () => {
            router.navigate('/(tabs)/profile');
          },
        }}
      />
    </Tabs>
  );
}
