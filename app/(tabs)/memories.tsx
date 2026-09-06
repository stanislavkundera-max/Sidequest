import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { MIN_TOUCH_TARGET } from '@/constants/touchTargets';
import { Theme } from '@/constants/Theme';
import { categoryAccentForCategoryId } from '@/lib/categoryAccent';
import { useMemoryStore } from '@/src/features/memories/memoryStore';
import { useQuestDomainStore } from '@/src/features/quests/questStore';
import { trackEvent } from '@/src/lib/analytics';
import { useSessionStore } from '@/stores/session';

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
];
type DateRange = 'all' | '7d' | '30d';
const DATE_RANGE_DAYS: Record<DateRange, number | null> = { all: null, '7d': 7, '30d': 30 };

export default function MemoriesScreen() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const memories = useMemoryStore((s) => s.memories);
  const loading = useMemoryStore((s) => s.loading);
  const error = useMemoryStore((s) => s.error);
  const refresh = useMemoryStore((s) => s.refresh);
  const categories = useQuestDomainStore((s) => s.categories);
  const getQuestById = useQuestDomainStore((s) => s.getQuestById);

  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<DateRange>('all');

  useFocusEffect(
    useCallback(() => {
      trackEvent('memories_timeline_viewed', {
        sourceScreen: 'memories_tab',
      }).catch(() => undefined);
    }, [])
  );

  const ordered = useMemo(
    () =>
      [...memories].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [memories]
  );

  const usedCategoryIds = useMemo(() => {
    const ids = new Set<string>();
    for (const m of ordered) {
      const cid = m.questId ? getQuestById(m.questId)?.categoryId : undefined;
      if (cid) ids.add(cid);
    }
    return ids;
  }, [ordered, getQuestById]);
  const filterableCategories = useMemo(
    () => categories.filter((c) => usedCategoryIds.has(c.id)),
    [categories, usedCategoryIds]
  );

  const filtered = useMemo(() => {
    const days = DATE_RANGE_DAYS[dateFilter];
    const cutoff = days != null ? Date.now() - days * 24 * 60 * 60 * 1000 : null;
    return ordered.filter((m) => {
      if (categoryFilter) {
        const cid = m.questId ? getQuestById(m.questId)?.categoryId : undefined;
        if (cid !== categoryFilter) return false;
      }
      if (cutoff != null && new Date(m.createdAt).getTime() < cutoff) return false;
      return true;
    });
  }, [ordered, categoryFilter, dateFilter, getQuestById]);

  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={{ padding: 20 }}>
          <EmptyState
            title="Sign in required"
            message="Please sign in to view your memories."
            actionLabel="Go to sign in"
            onAction={() => router.replace('/(auth)/sign-in')}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (loading && ordered.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <LoadingState label="Loading memories..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Memories</Text>
        <Pressable
          onPress={() => {
            trackEvent('memory_creation_started', {
              sourceScreen: 'memories_tab',
            }).catch(() => undefined);
            router.push('/memory/new');
          }}
          accessibilityRole="button"
          accessibilityLabel="Add a new memory"
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]}>
          <Text style={styles.addBtnText}>+ New</Text>
        </Pressable>
      </View>
      <Text style={styles.sub}>
        Your reflections in reverse chronological order.
      </Text>

      {ordered.length > 0 ? (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}>
            <Pressable
              onPress={() => setCategoryFilter(null)}
              accessibilityRole="button"
              accessibilityState={{ selected: !categoryFilter }}
              style={[styles.chip, !categoryFilter && styles.chipSelected]}>
              <Text style={[styles.chipText, !categoryFilter && styles.chipTextSelected]}>
                All categories
              </Text>
            </Pressable>
            {filterableCategories.map((c) => {
              const selected = categoryFilter === c.id;
              const accent = categoryAccentForCategoryId(c.id);
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setCategoryFilter(selected ? null : c.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[
                    styles.chip,
                    selected && { backgroundColor: `${accent}22`, borderColor: accent },
                  ]}>
                  <Text style={[styles.chipText, selected && { color: accent }]}>{c.name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}>
            {DATE_RANGE_OPTIONS.map((opt) => {
              const selected = dateFilter === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setDateFilter(opt.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[styles.chip, selected && styles.chipSelected]}>
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      ) : null}

      {error ? (
        <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
          <ErrorState
            message={error}
            onRetry={
              user
                ? () => {
                    refresh(user.id);
                  }
                : undefined
            }
          />
        </View>
      ) : null}

      <FlatList
        data={filtered}
        keyExtractor={(m) => m.id}
        contentContainerStyle={
          filtered.length === 0 ? styles.emptyContainer : styles.list
        }
        ListEmptyComponent={
          ordered.length === 0 ? (
            <EmptyState
              title="No memories yet"
              message="Complete a quest or add a short reflection to begin your timeline."
              actionLabel="Pick a quest"
              onAction={() => router.push('/quest/select' as never)}
            />
          ) : (
            <EmptyState
              title="Nothing matches those filters"
              message="Try a different category or time range."
              actionLabel="Clear filters"
              onAction={() => {
                setCategoryFilter(null);
                setDateFilter('all');
              }}
            />
          )
        }
        renderItem={({ item }) => (
          <MemoryRow id={item.id} onPress={(id) => router.push(`/memory/${id}`)} />
        )}
      />
    </SafeAreaView>
  );
}

function MemoryRow({
  id,
  onPress,
}: {
  id: string;
  onPress: (id: string) => void;
}) {
  const entry = useMemoryStore((s) => s.memories.find((m) => m.id === id));
  const getQuestById = useQuestDomainStore((s) => s.getQuestById);
  if (!entry) return null;
  const quest = entry.questId ? getQuestById(entry.questId) : undefined;

  return (
    <Pressable
      onPress={() => onPress(entry.id)}
      accessibilityRole="button"
      accessibilityLabel={`Memory: ${entry.title}`}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <Text style={styles.cardDate}>
        {new Date(entry.createdAt).toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        })}
      </Text>
      {entry.title ? (
        <Text style={styles.cardTitle} numberOfLines={2}>
          {entry.title}
        </Text>
      ) : null}
      {quest ? <Text style={styles.cardMeta}>{quest.title}</Text> : null}
      {entry.photoUri ? (
        <Image source={{ uri: entry.photoUri }} style={styles.cardImage} />
      ) : (
        <Text style={styles.noPhotoText}>No photo</Text>
      )}
      <Text style={styles.cardBody} numberOfLines={3}>
        {entry.body}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  title: { fontSize: 28, fontFamily: 'Fraunces_600SemiBold', fontWeight: '600', color: Theme.text },
  addBtn: {
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET,
    backgroundColor: Theme.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  sub: {
    paddingHorizontal: 20,
    marginTop: 6,
    marginBottom: 12,
    color: Theme.textMuted,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  filterRow: {
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  chip: {
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 13,
    backgroundColor: Theme.surface,
  },
  chipSelected: { backgroundColor: Theme.accentSoft, borderColor: Theme.accent },
  chipText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: Theme.textMuted },
  chipTextSelected: { color: Theme.accent },
  list: { paddingHorizontal: 20, paddingBottom: 32, gap: 12 },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    backgroundColor: Theme.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.border,
    marginBottom: 12,
  },
  cardPressed: { opacity: 0.92 },
  cardDate: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Theme.textMuted, marginBottom: 8 },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Fraunces_600SemiBold',
    fontWeight: '600',
    color: Theme.text,
    marginBottom: 6,
  },
  cardMeta: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Theme.textMuted, marginBottom: 10 },
  cardImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: Theme.border,
  },
  noPhotoText: { color: Theme.textMuted, fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 10 },
  cardBody: { fontSize: 16, fontFamily: 'Inter_400Regular', lineHeight: 24, color: Theme.text },
});
