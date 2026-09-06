import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MIN_TOUCH_TARGET } from '@/constants/touchTargets';
import { Theme } from '@/constants/Theme';
import { categoryAccentForCategoryId } from '@/lib/categoryAccent';
import { useMemoryStore } from '@/src/features/memories/memoryStore';
import { useQuestDomainStore } from '@/src/features/quests/questStore';
import type { Quest, UserQuest } from '@/src/types/quest';

function rowTitle(uq: UserQuest, quest?: Quest): string {
  return uq.snapshotTitle?.trim() || quest?.title || 'Side quest';
}

function rowCategoryId(uq: UserQuest, quest?: Quest): string {
  return uq.snapshotCategoryId || quest?.categoryId || '';
}

/** A milestone label that grows warmer as the collection grows. */
function milestoneLine(count: number): string {
  if (count === 0) return 'Your first trophy is waiting.';
  if (count < 3) return 'The collection begins. Keep going!';
  if (count < 6) return 'A shelf worth showing off.';
  if (count < 12) return 'You are on a real roll.';
  return 'Legendary. The map remembers you.';
}

export function CompletedShowcase() {
  const router = useRouter();
  const categories = useQuestDomainStore((s) => s.categories);
  const userQuests = useQuestDomainStore((s) => s.userQuests);
  const getQuestById = useQuestDomainStore((s) => s.getQuestById);
  const memoryCount = useMemoryStore((s) => s.memories.length);

  const categoryLabel = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? id;

  const completed = useMemo(
    () =>
      userQuests
        .filter((uq) => uq.status === 'completed')
        .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? '')),
    [userQuests]
  );

  const perCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const uq of completed) {
      const cid = rowCategoryId(uq, getQuestById(uq.questId));
      if (!cid) continue;
      counts.set(cid, (counts.get(cid) ?? 0) + 1);
    }
    const ordered: { categoryId: string; count: number }[] = [];
    for (const c of categories) {
      const n = counts.get(c.id);
      if (n) ordered.push({ categoryId: c.id, count: n });
    }
    return ordered;
  }, [completed, categories, getQuestById]);

  const total = completed.length;

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <View style={styles.heroBadge}>
          <Ionicons name="trophy" size={30} color="#fff" />
        </View>
        <Text style={styles.heroCount}>{total}</Text>
        <Text style={styles.heroLabel}>
          {total === 1 ? 'quest completed' : 'quests completed'}
        </Text>
        <Text style={styles.heroMilestone}>{milestoneLine(total)}</Text>
      </View>

      <View style={styles.statRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{perCategory.length}</Text>
          <Text style={styles.statLabel}>
            {perCategory.length === 1 ? 'world explored' : 'worlds explored'}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.statCard, pressed && styles.pressed]}
          onPress={() => router.push('/(tabs)/memories' as never)}
          accessibilityRole="button"
          accessibilityLabel={`${memoryCount} memories. Opens memories.`}>
          <Text style={styles.statNum}>{memoryCount}</Text>
          <Text style={styles.statLabel}>
            {memoryCount === 1 ? 'memory kept' : 'memories kept'}
          </Text>
        </Pressable>
      </View>

      {perCategory.length > 0 ? (
        <View style={styles.medalRow}>
          {perCategory.map(({ categoryId, count }) => {
            const accent = categoryAccentForCategoryId(categoryId);
            return (
              <View key={categoryId} style={[styles.medal, { borderColor: accent }]}>
                <View style={[styles.medalDot, { backgroundColor: accent }]} />
                <Text style={styles.medalName}>{categoryLabel(categoryId)}</Text>
                <Text style={[styles.medalCount, { color: accent }]}>{count}</Text>
              </View>
            );
          })}
        </View>
      ) : null}

      {total === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="ribbon-outline" size={28} color={Theme.accent} />
          <Text style={styles.emptyTitle}>No trophies yet</Text>
          <Text style={styles.emptyBody}>
            Finish a quest and it will land here as your first trophy. Start one from the map or the
            Journey tab.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.emptyBtn, pressed && styles.pressed]}
            onPress={() => router.push('/(tabs)/journey' as never)}
            accessibilityRole="button">
            <Text style={styles.emptyBtnText}>Browse quests</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.timeline}>
          <Text style={styles.timelineHead}>Trophy shelf</Text>
          {completed.map((uq, index) => {
            const q = getQuestById(uq.questId);
            const cid = rowCategoryId(uq, q);
            const accent = categoryAccentForCategoryId(cid);
            const when = uq.completedAt
              ? new Date(uq.completedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })
              : '';
            return (
              <Pressable
                key={uq.id}
                onPress={() => router.push(`/quest/${uq.questId}` as never)}
                accessibilityRole="button"
                accessibilityLabel={rowTitle(uq, q)}
                style={({ pressed }) => [styles.trophy, pressed && styles.pressed]}>
                <View style={[styles.trophyMedal, { backgroundColor: accent }]}>
                  <Ionicons name="medal" size={18} color="#fff" />
                  <Text style={styles.trophyRank}>#{total - index}</Text>
                </View>
                <View style={styles.trophyBody}>
                  <Text style={styles.trophyCategory}>{cid ? categoryLabel(cid) : 'Side quest'}</Text>
                  <Text style={styles.trophyTitle} numberOfLines={2}>
                    {rowTitle(uq, q)}
                  </Text>
                  {when ? <Text style={styles.trophyWhen}>Completed · {when}</Text> : null}
                </View>
                <Ionicons name="chevron-forward" size={18} color={Theme.textMuted} />
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: '100%' },
  hero: {
    marginHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Theme.accent,
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  heroBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroCount: { fontSize: 48, fontFamily: 'Fraunces_700Bold', fontWeight: '700', color: '#fff', lineHeight: 52 },
  heroLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.92)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroMilestone: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Theme.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.border,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  statNum: { fontSize: 26, fontFamily: 'Fraunces_700Bold', fontWeight: '700', color: Theme.text },
  statLabel: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  medalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  medal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Theme.surface,
  },
  medalDot: { width: 8, height: 8, borderRadius: 4 },
  medalName: { fontSize: 13, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.text },
  medalCount: { fontSize: 13, fontFamily: 'Inter_700Bold', fontWeight: '700' },
  timeline: { paddingHorizontal: 16 },
  timelineHead: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  trophy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Theme.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: 12,
    marginBottom: 10,
  },
  trophyMedal: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyRank: { fontSize: 9, fontFamily: 'Inter_700Bold', fontWeight: '700', color: '#fff', marginTop: -1 },
  trophyBody: { flex: 1, minWidth: 0 },
  trophyCategory: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  trophyTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.text, lineHeight: 20, marginTop: 2 },
  trophyWhen: { fontSize: 12, fontFamily: 'Inter_500Medium', fontWeight: '500', color: Theme.textMuted, marginTop: 3 },
  emptyCard: {
    marginHorizontal: 16,
    backgroundColor: Theme.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 18, fontFamily: 'Fraunces_700Bold', fontWeight: '700', color: Theme.text, marginTop: 12 },
  emptyBody: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    color: Theme.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  emptyBtn: {
    marginTop: 16,
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET,
    backgroundColor: Theme.accent,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  emptyBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold', fontWeight: '700' },
  pressed: { opacity: 0.85 },
});
