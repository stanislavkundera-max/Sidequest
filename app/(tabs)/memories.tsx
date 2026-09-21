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

import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { OptionSheet } from '@/components/ui/OptionSheet';
import { MIN_TOUCH_TARGET } from '@/constants/touchTargets';
import { Theme } from '@/constants/Theme';
import { categoryAccentForCategoryId } from '@/lib/categoryAccent';
import { categoryIoniconNameForCategoryId } from '@/lib/categoryIcons';
import { memoryCategoryId } from '@/src/features/memories/memoryCategory';
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
  const [dateSheetOpen, setDateSheetOpen] = useState(false);
  const dateLabel = DATE_RANGE_OPTIONS.find((o) => o.value === dateFilter)?.label ?? 'All time';

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
      const cid = memoryCategoryId(m, getQuestById);
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
      if (categoryFilter && memoryCategoryId(m, getQuestById) !== categoryFilter) return false;
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
        // One row: category is the filter people reach for, so it gets the
        // chips; the date range is secondary and sits behind a single chip.
        //
        // `flexGrow: 0` is the actual fix for the "huge buttons" (R2-09): a
        // horizontal ScrollView defaults to flexGrow 1, so the two rows that
        // were here shared the screen's height with the list and stretched
        // their chips into tall ovals.
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterRow}>
          <Chip
            label="All"
            accessibilityLabel="All categories"
            selected={!categoryFilter}
            onPress={() => setCategoryFilter(null)}
          />
          {filterableCategories.map((c) => {
            const selected = categoryFilter === c.id;
            return (
              <Chip
                key={c.id}
                label={c.name}
                icon={categoryIoniconNameForCategoryId(c.id)}
                accent={categoryAccentForCategoryId(c.id)}
                selected={selected}
                onPress={() => setCategoryFilter(selected ? null : c.id)}
              />
            );
          })}
          <Chip
            label={dateLabel}
            accessibilityLabel={`Time range: ${dateLabel}. Change`}
            trailingIcon="chevron-down"
            selected={dateFilter !== 'all'}
            onPress={() => setDateSheetOpen(true)}
          />
        </ScrollView>
      ) : null}
      <OptionSheet
        visible={dateSheetOpen}
        title="Show memories from"
        options={DATE_RANGE_OPTIONS}
        selected={dateFilter}
        onSelect={setDateFilter}
        onClose={() => setDateSheetOpen(false)}
      />

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
  const getCategoryById = useQuestDomainStore((s) => s.getCategoryById);
  if (!entry) return null;
  const quest = entry.questId ? getQuestById(entry.questId) : undefined;
  // A hand-written memory has no quest title to show — its own category, if it
  // has one, fills that line instead (R2-11).
  const ownCategory =
    !quest && entry.categoryId ? getCategoryById(entry.categoryId) : undefined;

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
      {ownCategory ? (
        <Text style={[styles.cardMeta, { color: categoryAccentForCategoryId(ownCategory.id) }]}>
          {ownCategory.name}
        </Text>
      ) : null}
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
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.text },
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
  filterScroll: { flexGrow: 0 },
  filterRow: {
    gap: 8,
    alignItems: 'center',
    paddingHorizontal: 20,
    // Room for the chips' enlarged hit area so it isn't clipped by the scroll view.
    paddingVertical: 5,
    marginBottom: 6,
  },
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
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
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
