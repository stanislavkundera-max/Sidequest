import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PausedAndLikedSections } from '@/components/journey/PausedAndLikedSections';
import { AccountCard } from '@/components/progress/AccountCard';
import { BaselineReaskBanner } from '@/components/progress/BaselineReaskBanner';
import { CompletedShowcase } from '@/components/progress/CompletedShowcase';
import { ScienceNote } from '@/components/progress/ScienceNote';
import { PathFullModal } from '@/components/quests/PathFullModal';
import { useQuestActions } from '@/components/quests/useQuestActions';
import { ErrorState } from '@/components/ui/ErrorState';
import { Theme } from '@/constants/Theme';
import { useQuestDomainStore } from '@/src/features/quests/questStore';
import { trackEvent } from '@/src/lib/analytics';
import { useSessionStore } from '@/stores/session';

/**
 * Progress tab — active/paused/liked quests, then a celebratory showcase of
 * everything finished. The paused/liked split moved here from Journey (for
 * now) since testers expected it under Progress, not the full quest catalog.
 */
export function ProgressOverview() {
  const user = useSessionStore((s) => s.user);
  const loadingQuests = useQuestDomainStore((s) => s.loading);
  const questError = useQuestDomainStore((s) => s.error);
  const refreshUserQuests = useQuestDomainStore((s) => s.refreshUserQuests);
  // Called unconditionally (rules of hooks) — harmless with an empty userId;
  // this screen only renders past sign-in anyway.
  const actions = useQuestActions(user?.id ?? '');

  useFocusEffect(
    useCallback(() => {
      trackEvent('profile_viewed', { sourceScreen: 'profile_tab' }).catch(() => undefined);
    }, [])
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.paddedBlock}>
          <Text style={styles.title}>Progress</Text>
          <Text style={styles.kicker}>Everything you have finished</Text>
        </View>

        <AccountCard />
        <BaselineReaskBanner />

        {loadingQuests ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={Theme.accent} />
            <Text style={styles.muted}>Refreshing…</Text>
          </View>
        ) : null}

        {questError ? (
          <View style={styles.paddedBlock}>
            <ErrorState
              message={questError}
              onRetry={user ? () => refreshUserQuests(user.id) : undefined}
            />
          </View>
        ) : null}

        {!loadingQuests ? <PausedAndLikedSections actions={actions} /> : null}
        {!loadingQuests ? <CompletedShowcase /> : null}
        <ScienceNote />
      </ScrollView>
      <PathFullModal
        visible={actions.pathFullOpen}
        activeForModal={actions.activeForModal}
        getQuestById={actions.getQuestById}
        onLetWait={(id) => void actions.onLetWait(id)}
        onClose={actions.closePathFull}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.bg },
  scroll: { paddingBottom: 40 },
  paddedBlock: { paddingHorizontal: 20 },
  title: { fontSize: 28, fontWeight: '700', color: Theme.text, marginBottom: 2, paddingTop: 8 },
  kicker: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 16,
  },
  muted: { color: Theme.textMuted, fontSize: 14, lineHeight: 21 },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
});
