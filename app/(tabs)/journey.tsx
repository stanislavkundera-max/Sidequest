import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AllQuestsList } from '@/components/journey/AllQuestsList';
import { PathFullModal } from '@/components/quests/PathFullModal';
import { useQuestActions } from '@/components/quests/useQuestActions';
import { DawnBackground } from '@/components/ui/DawnBackground';
import { EmptyState } from '@/components/ui/EmptyState';
import { Theme } from '@/constants/Theme';
import { getOnboardingState } from '@/lib/onboarding';
import type { OnboardingPreferences } from '@/src/features/onboarding/types';
import { useSessionStore } from '@/stores/session';

/** The sunrise over the hills, from the frozen canvas (screen 17), 390 × 224. */
const HEADER = require('@/assets/images/dawn/journey-header.png');
const HEADER_ASPECT = 224 / 390;

export default function JourneyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const headerHeight = Math.round(width * HEADER_ASPECT) + Math.max(0, insets.top - 24);
  const user = useSessionStore((s) => s.user);
  // Only five quests per category are shown, so which five matters. Read the
  // same onboarding answers Explore uses; null just means gentlest-first.
  const [preferences, setPreferences] = useState<OnboardingPreferences | null>(null);
  useEffect(() => {
    getOnboardingState()
      .then((state) => setPreferences(state.preferences))
      .catch(() => undefined);
  }, []);
  // Called unconditionally (rules of hooks) — harmless with an empty userId
  // when signed out, since the early return below prevents any action firing.
  const actions = useQuestActions(user?.id ?? '', 'journey');

  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={{ padding: 20 }}>
          <EmptyState
            title="Sign in required"
            message="Please sign in to view your Journey."
            actionLabel="Go to sign in"
            onAction={() => router.replace('/(auth)/sign-in')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <DawnBackground>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {/* Dawn header: the sky runs up under the status bar; the title sits on it. */}
        <View style={{ height: headerHeight }}>
          <Image source={HEADER} style={[styles.headerImage, { height: headerHeight }]} resizeMode="cover" accessible={false} />
          <View style={[styles.headerText, { paddingTop: Math.max(insets.top, 24) + 20 }]}>
            <Text style={styles.pageTitle} accessibilityRole="header">
              Journey
            </Text>
            <Text style={styles.pageSub}>Pick a place, then a quest that fits today.</Text>
          </View>
        </View>
        <AllQuestsList
          initialCategoryId={params.category ?? null}
          preferences={preferences}
          actions={actions}
        />
      </ScrollView>
      <PathFullModal
        visible={actions.pathFullOpen}
        activeForModal={actions.activeForModal}
        waitingUserQuestId={actions.waitingUserQuestId}
        getQuestById={actions.getQuestById}
        onLetWait={(id) => void actions.onLetWait(id)}
        onClose={actions.closePathFull}
      />
    </DawnBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  headerImage: { position: 'absolute', top: 0, left: 0, right: 0, width: '100%' },
  headerText: { paddingHorizontal: 24 },
  pageTitle: {
    fontSize: 34,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    letterSpacing: -0.6,
    color: Theme.text,
  },
  // On the lit sky, not the ground: a near-white with a soft shadow keeps it readable.
  pageSub: {
    marginTop: 4,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    color: 'rgba(255, 250, 240, 0.95)',
    textShadowColor: 'rgba(40, 30, 40, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
});
