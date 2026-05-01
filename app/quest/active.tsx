import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { Theme } from '@/constants/Theme';
import { categoryAccentForCategoryId } from '@/lib/categoryAccent';
import { useQuestDomainStore } from '@/src/features/quests/questStore';
import { trackEvent } from '@/src/lib/analytics';
import type { QuestTimeframe } from '@/src/types/quest';
import { useSessionStore } from '@/stores/session';

const TIMEFRAME_LABEL: Record<QuestTimeframe, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

function categoryName(categoryId: string): string {
  return (
    useQuestDomainStore
      .getState()
      .categories.find((c) => c.id === categoryId)?.name ?? categoryId
  );
}

function sortByStarted(a: { startedAt: string }, b: { startedAt: string }) {
  return a.startedAt.localeCompare(b.startedAt);
}

export default function ActiveQuestsScreen() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const userQuests = useQuestDomainStore((s) => s.userQuests);
  const getQuestById = useQuestDomainStore((s) => s.getQuestById);

  const active = useMemo(() => {
    const list = userQuests.filter((uq) => uq.status === 'active');
    return [...list].sort(sortByStarted);
  }, [userQuests]);

  useFocusEffect(
    useCallback(() => {
      trackEvent('quest_list_viewed', {
        sourceScreen: 'active_quests',
      }).catch(() => undefined);
    }, [])
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.pad}>
          <EmptyState
            title="Sign in required"
            message="Please sign in to see active quests."
            actionLabel="Go to sign in"
            onAction={() => router.replace('/(auth)/sign-in')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Active quests</Text>
        <Text style={styles.sub}>Tap a quest to continue or review its steps.</Text>

        {active.length === 0 ? (
          <EmptyState
            title="No active quests"
            message="Add a quest from the catalog to see it here."
            actionLabel="Browse quests"
            onAction={() => router.push('/quest/select' as never)}
          />
        ) : (
          active.map((uq) => {
            const q = getQuestById(uq.questId);
            if (!q) return null;
            const when = new Date(uq.startedAt).toLocaleDateString(undefined, {
              dateStyle: 'medium',
            });
            return (
              <Pressable
                key={uq.id}
                onPress={() => router.push(`/quest/${q.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${q.title}`}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
                <View
                  style={[
                    styles.accentBar,
                    { backgroundColor: categoryAccentForCategoryId(q.categoryId) },
                  ]}
                />
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{q.title}</Text>
                  <Text style={styles.cardMeta} numberOfLines={2}>
                    {q.shortDescription}
                  </Text>
                  <Text style={styles.openHint}>
                    {categoryName(q.categoryId)} · {TIMEFRAME_LABEL[q.timeframe]} · started {when}
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.bg },
  pad: { padding: 20 },
  scroll: { padding: 20, paddingBottom: 40 },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: Theme.text,
    marginBottom: 8,
  },
  sub: {
    fontSize: 15,
    color: Theme.textMuted,
    marginBottom: 20,
    lineHeight: 22,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Theme.surface,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.border,
    marginBottom: 12,
  },
  cardPressed: { opacity: 0.92 },
  accentBar: { width: 5 },
  cardBody: { flex: 1, padding: 16 },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.text,
    marginBottom: 6,
  },
  cardMeta: { fontSize: 15, color: Theme.textMuted, lineHeight: 22 },
  openHint: {
    marginTop: 10,
    fontSize: 13,
    color: Theme.textMuted,
  },
});
