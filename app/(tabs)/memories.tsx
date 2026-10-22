import { Ionicons } from '@expo/vector-icons';
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

import { DailyQuestionCard } from '@/components/memory/DailyQuestionCard';
import { CategoryTag, categoryKeyForId } from '@/components/ui/CategoryTag';
import { Chip } from '@/components/ui/Chip';
import { DawnBackground } from '@/components/ui/DawnBackground';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { OptionSheet } from '@/components/ui/OptionSheet';
import { MIN_TOUCH_TARGET } from '@/constants/touchTargets';
import { Dawn, Theme } from '@/constants/Theme';
import { categoryAccentForCategoryId } from '@/lib/categoryAccent';
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

  // The list in month groups, newest first: a heading row, then that month's memories.
  type Row = { kind: 'month'; key: string; label: string; count: number } | { kind: 'memory'; key: string; id: string };
  const rows = useMemo(() => {
    const out: Row[] = [];
    let current = '';
    let header: Extract<Row, { kind: 'month' }> | null = null;
    for (const m of filtered) {
      const d = new Date(m.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (key !== current) {
        current = key;
        const sameYear = d.getFullYear() === new Date().getFullYear();
        header = {
          kind: 'month',
          key: `month-${key}`,
          label: d.toLocaleDateString(undefined, sameYear ? { month: 'long' } : { month: 'long', year: 'numeric' }),
          count: 0,
        };
        out.push(header);
      }
      if (header) header.count += 1;
      out.push({ kind: 'memory', key: m.id, id: m.id });
    }
    return out;
  }, [filtered]);

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
    <DawnBackground>
    <SafeAreaView style={styles.safeClear} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Memories
        </Text>
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
          <Ionicons name="add" size={18} color={Theme.onAccent} />
          <Text style={styles.addBtnText}>New</Text>
        </Pressable>
      </View>

      <DailyQuestionCard />

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
                dot={categoryAccentForCategoryId(c.id)}
                selected={selected}
                onPress={() => setCategoryFilter(selected ? null : c.id)}
              />
            );
          })}
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
        data={rows}
        keyExtractor={(r) => r.key}
        contentContainerStyle={
          filtered.length === 0 ? styles.emptyContainer : styles.list
        }
        ListEmptyComponent={
          ordered.length === 0 ? (
            <EmptyState
              art={<PathToCairn />}
              title="No memories yet"
              message="Finish a quest or write a few lines about a good day — this becomes your timeline."
              actionLabel="Pick a quest"
              onAction={() => router.push('/(tabs)/journey' as never)}
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
        renderItem={({ item, index }) =>
          item.kind === 'month' ? (
            <View style={styles.monthRow}>
              <Text style={styles.monthLabel}>
                {`${item.label} · ${item.count} ${item.count === 1 ? 'memory' : 'memories'}`.toUpperCase()}
              </Text>
              {/* The time range sits with the first heading, where it reads as "of these". */}
              {index === 0 ? (
                <Chip
                  label={dateLabel}
                  accessibilityLabel={`Time range: ${dateLabel}. Change`}
                  trailingIcon="chevron-down"
                  selected={dateFilter !== 'all'}
                  onPress={() => setDateSheetOpen(true)}
                />
              ) : null}
            </View>
          ) : (
            <MemoryRow id={item.id} onPress={(id) => router.push(`/memory/${id}`)} />
          )
        }
      />
    </SafeAreaView>
    </DawnBackground>
  );
}

/** A dotted path from a first step to the cairn: where a timeline starts (screen 33). */
function PathToCairn() {
  return (
    <View style={styles.pathArt} accessible={false}>
      <View style={styles.pathStart} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={[styles.pathDash, { transform: [{ translateY: Math.sin(i / 1.6) * 6 }] }]} />
      ))}
      <View style={styles.pathRing} />
      {[0, 1, 2, 3].map((i) => (
        <View key={`b${i}`} style={[styles.pathDash, { transform: [{ translateY: Math.sin((i + 6) / 1.6) * 6 }] }]} />
      ))}
      <View style={styles.pathCairn}>
        <View style={[styles.stone, { width: 7, height: 5 }]} />
        <View style={[styles.stone, { width: 11, height: 6 }]} />
        <View style={[styles.stone, { width: 15, height: 6 }]} />
        <View style={[styles.stone, { width: 19, height: 7 }]} />
      </View>
    </View>
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

  const categoryId = quest?.categoryId ?? ownCategory?.id;
  const when = new Date(entry.createdAt);
  const whenLabel = `${when.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} · ${when.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
  const ownKey = ownCategory ? categoryKeyForId(ownCategory.id) : null;

  // Dawn (screen 30): with a photo, the photo leads and the date sits on it; without one, a
  // stripe in the category colour down the left edge and the date top right.
  return (
    <Pressable
      onPress={() => onPress(entry.id)}
      accessibilityRole="button"
      accessibilityLabel={`Memory: ${entry.title}, ${whenLabel}`}
      style={({ pressed }) => [
        styles.card,
        !entry.photoUri && categoryId ? { borderLeftWidth: 3, borderLeftColor: categoryAccentForCategoryId(categoryId) } : null,
        pressed && styles.cardPressed,
      ]}>
      {entry.photoUri ? (
        <View>
          <Image source={{ uri: entry.photoUri }} style={styles.cardImage} />
          <View style={styles.datePill}>
            <Text style={styles.datePillText}>{whenLabel}</Text>
          </View>
        </View>
      ) : null}
      <View style={styles.cardBodyWrap}>
        {!entry.photoUri ? (
          <View style={styles.cardTopRow}>
            {ownKey ? <CategoryTag category={ownKey} /> : <View />}
            <Text style={styles.cardDate}>{whenLabel}</Text>
          </View>
        ) : null}
        {quest ? (
          <View style={styles.questLine}>
            <View style={[styles.questDot, { backgroundColor: categoryAccentForCategoryId(quest.categoryId) }]} />
            <Text style={styles.questText} numberOfLines={1}>
              {quest.title}
            </Text>
          </View>
        ) : null}
        {entry.title ? (
          <Text style={styles.cardTitle} numberOfLines={2}>
            {entry.title}
          </Text>
        ) : null}
        {entry.body ? (
          <Text style={styles.cardBody} numberOfLines={3}>
            {entry.body}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.bg },
  safeClear: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  title: { fontSize: 34, fontFamily: 'Inter_700Bold', fontWeight: '700', letterSpacing: -0.6, color: Theme.text },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: MIN_TOUCH_TARGET - 4,
    backgroundColor: '#e0823d',
    paddingLeft: 12,
    paddingRight: 16,
    borderRadius: 20,
  },
  addBtnText: { color: Theme.onAccent, fontWeight: '700', fontSize: 15, fontFamily: 'Inter_700Bold' },
  filterScroll: { flexGrow: 0 },
  filterRow: {
    gap: 8,
    alignItems: 'center',
    paddingHorizontal: 20,
    // Room for the chips' enlarged hit area so it isn't clipped by the scroll view.
    paddingVertical: 5,
    marginTop: 14,
  },
  list: { paddingHorizontal: 20, paddingBottom: 32 },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    paddingBottom: 12,
  },
  monthLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', fontWeight: '600', letterSpacing: 1.6, color: Theme.textMuted },
  card: {
    backgroundColor: Dawn.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Dawn.cardBorder,
    overflow: 'hidden',
    marginBottom: 12,
    boxShadow: '0 6px 16px rgba(20, 18, 10, 0.25)',
  },
  cardPressed: { opacity: 0.92 },
  cardImage: { width: '100%', height: 180, backgroundColor: Theme.surface },
  datePill: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(27, 25, 16, 0.78)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  datePillText: { fontSize: 11, fontFamily: 'Inter_700Bold', fontWeight: '700', color: '#ffffff' },
  cardBodyWrap: { paddingHorizontal: 16, paddingVertical: 14, gap: 4 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardDate: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Theme.textMuted },
  questLine: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  questDot: { width: 8, height: 8, borderRadius: 4, boxShadow: '0 0 0 1.5px rgba(246, 234, 214, 0.7)' },
  questText: { flex: 1, fontSize: 12, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: '#e6dfca' },
  cardTitle: { fontSize: 17, lineHeight: 22, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.text },
  cardBody: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21, color: '#e6dfca' },
  pathArt: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 70 },
  pathStart: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#e0823d' },
  pathDash: { width: 7, height: 2, borderRadius: 1, backgroundColor: 'rgba(246, 234, 214, 0.45)' },
  pathRing: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: 'rgba(246, 234, 214, 0.55)' },
  pathCairn: { alignItems: 'center', gap: 1, marginLeft: 2, marginBottom: 18 },
  stone: { borderRadius: 999, backgroundColor: Dawn.cairn },
});
