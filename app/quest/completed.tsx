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
import { useSessionStore } from '@/stores/session';

function categoryName(categoryId: string): string {
  return (
    useQuestDomainStore
      .getState()
      .categories.find((c) => c.id === categoryId)?.name ?? categoryId
  );
}

export default function CompletedQuestsScreen() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const userQuests = useQuestDomainStore((s) => s.userQuests);
  const getQuestById = useQuestDomainStore((s) => s.getQuestById);

  const completed = useMemo(() => {
    const list = userQuests.filter((uq) => uq.status === 'completed');
    return list.sort((a, b) =>
      (b.completedAt ?? '').localeCompare(a.completedAt ?? '')
    );
  }, [userQuests]);

  useFocusEffect(
    useCallback(() => {
      trackEvent('quest_list_viewed', {
        sourceScreen: 'completed_quests',
      }).catch(() => undefined);
    }, [])
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.pad}>
          <EmptyState
            title="Sign in required"
            message="Please sign in to see completed quests."
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
        <Text style={styles.title}>Completed quests</Text>
        <Text style={styles.sub}>
          Tap a quest to open its details and reflection.
        </Text>

        {completed.length === 0 ? (
          <EmptyState
            title="No completed quests yet"
            message="Finish a quest from your active list to see it here."
            actionLabel="Browse quests"
            onAction={() => router.push('/quest/select' as never)}
          />
        ) : (
          completed.map((uq) => {
            const q = getQuestById(uq.questId);
            if (!q) return null;
            const when = uq.completedAt
              ? new Date(uq.completedAt).toLocaleDateString(undefined, {
                  dateStyle: 'medium',
                })
              : '';
            return (
              <Pressable
                key={uq.id}
                onPress={() => router.push(`/quest/${q.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${q.title}`}
                style={({ pressed }) => [
                  styles.card,
                  pressed && styles.cardPressed,
                ]}>
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
                    {categoryName(q.categoryId)} · {when}
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
