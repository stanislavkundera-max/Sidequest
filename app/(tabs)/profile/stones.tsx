import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DawnBackground } from '@/components/ui/DawnBackground';
import { EmptyState } from '@/components/ui/EmptyState';
import { HeaderBackButton } from '@/components/ui/HeaderBackButton';
import { Dawn, Theme } from '@/constants/Theme';
import { categoryAccentForCategoryId } from '@/lib/categoryAccent';
import { useQuestDomainStore } from '@/src/features/quests/questStore';

/**
 * Your stones — every quest you finished, newest first (redesign screen 34: "7 stones" opens
 * this). It replaces the trophy shelf, its medals and "#7" ranks: no prizes and no ranking in
 * this app (AGENTS.md), just a stone for each thing you did, in the colour of its place.
 */
export default function StonesScreen() {
  const router = useRouter();
  const userQuests = useQuestDomainStore((s) => s.userQuests);
  const categories = useQuestDomainStore((s) => s.categories);
  const getQuestById = useQuestDomainStore((s) => s.getQuestById);

  const stones = useMemo(
    () =>
      userQuests
        .filter((uq) => uq.status === 'completed')
        .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? '')),
    [userQuests]
  );

  return (
    <DawnBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <HeaderBackButton fallback="/(tabs)/profile" />
          <Text style={styles.title} accessibilityRole="header">
            {stones.length === 1 ? '1 stone' : `${stones.length} stones`}
          </Text>
        </View>
        <Text style={styles.sub}>One for every quest you finished.</Text>
        <FlatList
          data={stones}
          keyExtractor={(uq) => uq.id}
          contentContainerStyle={stones.length === 0 ? styles.emptyWrap : styles.list}
          ListEmptyComponent={
            <EmptyState
              title="No stones yet"
              message="Finish a quest and its stone lands here."
              actionLabel="Find a quest"
              onAction={() => router.push('/(tabs)/journey' as never)}
            />
          }
          renderItem={({ item: uq }) => {
            const q = getQuestById(uq.questId);
            const cid = uq.snapshotCategoryId || q?.categoryId || '';
            const title = uq.snapshotTitle?.trim() || q?.title || 'Side quest';
            const when = uq.completedAt
              ? new Date(uq.completedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
              : '';
            const place = categories.find((c) => c.id === cid)?.name ?? '';
            return (
              <Pressable
                onPress={() => router.push(`/quest/${uq.questId}` as never)}
                accessibilityRole="button"
                accessibilityLabel={`${title}, ${place}, ${when}`}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                <View style={[styles.stone, { backgroundColor: categoryAccentForCategoryId(cid) }]} />
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {title}
                  </Text>
                  <Text style={styles.rowMeta}>{[place, when].filter(Boolean).join(' · ')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#bfb69c" />
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </DawnBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 10 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', fontWeight: '700', letterSpacing: -0.4, color: Theme.text },
  sub: { paddingHorizontal: 20, marginTop: 6, marginBottom: 14, fontSize: 14, fontFamily: 'Inter_400Regular', color: Theme.textMuted },
  list: { paddingHorizontal: 20, paddingBottom: 32 },
  emptyWrap: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 60,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderRadius: 18,
    backgroundColor: Dawn.card,
    borderWidth: 1,
    borderColor: Dawn.cardBorder,
  },
  // A stone, lying flat: the category colour with a cream rim.
  stone: { width: 26, height: 16, borderRadius: 13, borderWidth: 1.5, borderColor: Dawn.cream },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: Theme.text },
  rowMeta: { marginTop: 2, fontSize: 12, fontFamily: 'Inter_400Regular', color: Theme.textMuted },
  pressed: { opacity: 0.85 },
});
