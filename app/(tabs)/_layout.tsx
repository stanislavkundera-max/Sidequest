import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Redirect, router, Tabs } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

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
    <Tabs
      initialRouteName="explore"
      screenOptions={{
        tabBarActiveTintColor: Theme.accent,
        // A lighter neutral used to sit here so the active tab read as clearly
        // "changed", but at 2.17:1 the inactive labels failed contrast. The
        // active state is now carried by weight as well as colour (see
        // `tabBarLabel` below), which is a stronger cue anyway — colour alone
        // is not something every user can see.
        tabBarInactiveTintColor: Theme.textMuted,
        tabBarLabel: ({ focused, color, children }) => (
          <Text style={{ fontSize: 10, fontWeight: focused ? '800' : '500', color }}>
            {children}
          </Text>
        ),
        tabBarStyle: {
          backgroundColor: Theme.surface,
          borderTopWidth: 0,
          borderTopColor: 'transparent',
          elevation: 0,
          shadowOpacity: 0,
          shadowOffset: { width: 0, height: 0 },
        },
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
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="compass" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="journey"
        options={{
          title: 'Journey',
          headerShown: false,
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
          // Every tab screen renders its own title; leaving the navigation
          // header on showed "Memories" twice.
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="book" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Progress',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="trophy" color={color} />
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
