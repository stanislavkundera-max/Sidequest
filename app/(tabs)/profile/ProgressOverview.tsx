import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountCard } from '@/components/progress/AccountCard';
import { CompletedShowcase } from '@/components/progress/CompletedShowcase';
import { ErrorState } from '@/components/ui/ErrorState';
import { Theme } from '@/constants/Theme';
import { useQuestDomainStore } from '@/src/features/quests/questStore';
import { trackEvent } from '@/src/lib/analytics';
import { useSessionStore } from '@/stores/session';

/** Progress tab — a celebratory showcase of every completed quest. */
export function ProgressOverview() {
  const user = useSessionStore((s) => s.user);
  const loadingQuests = useQuestDomainStore((s) => s.loading);
  const questError = useQuestDomainStore((s) => s.error);
  const refreshUserQuests = useQuestDomainStore((s) => s.refreshUserQuests);

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

        {!loadingQuests ? <CompletedShowcase /> : null}
      </ScrollView>
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
