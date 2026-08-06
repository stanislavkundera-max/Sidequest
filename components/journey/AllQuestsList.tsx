import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { journeyHubStyles as hub } from '@/components/journey/journeyHubStyles';
import { CatalogQuestRow } from '@/components/quests/CatalogQuestRow';
import type { useQuestActions } from '@/components/quests/useQuestActions';
import { Theme } from '@/constants/Theme';
import { categoryAccentForCategoryId } from '@/lib/categoryAccent';
import { useQuestDomainStore } from '@/src/features/quests/questStore';
import type { Quest } from '@/src/types/quest';

const TIMEFRAME_RANK: Record<Quest['timeframe'], number> = {
  weekly: 0,
  monthly: 1,
  yearly: 2,
};

type Props = {
  /** Preselects a category chip (e.g. arriving from Explore's "Discover more"). */
  initialCategoryId?: string | null;
  actions: Pick<ReturnType<typeof useQuestActions>, 'primaryBusy' | 'onStartNow' | 'onLike' | 'openQuest'>;
};

/** Full catalog with category chip switching — one category shown at a time. */
export function AllQuestsList({ initialCategoryId, actions }: Props) {
  const quests = useQuestDomainStore((s) => s.quests);
  const categories = useQuestDomainStore((s) => s.categories);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    initialCategoryId ?? null
  );

  // Follow later navigations too (Explore → "Discover more" while Journey is mounted).
  useEffect(() => {
    if (initialCategoryId) setSelectedCategoryId(initialCategoryId);
  }, [initialCategoryId]);

  const categoryIds = useMemo(() => {
    const withQuests = new Set(
      quests.filter((q) => q.isActive !== false).map((q) => q.categoryId)
    );
    return categories.filter((c) => withQuests.has(c.id)).map((c) => c.id);
  }, [categories, quests]);

  const activeCategoryId =
    selectedCategoryId && categoryIds.includes(selectedCategoryId)
      ? selectedCategoryId
      : (categoryIds[0] ?? null);

  const categoryLabel = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? id;

  const categoryQuests = useMemo(() => {
    if (!activeCategoryId) return [] as Quest[];
    return quests
      .filter((q) => q.isActive !== false && q.categoryId === activeCategoryId)
      .sort(
        (a, b) =>
          TIMEFRAME_RANK[a.timeframe] - TIMEFRAME_RANK[b.timeframe] ||
          a.estimatedDurationMinutes - b.estimatedDurationMinutes
      );
  }, [quests, activeCategoryId]);

  if (quests.length === 0) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={Theme.accent} />
        <Text style={styles.loadingText}>Loading the quest catalog…</Text>
      </View>
    );
  }

  return (
    <View style={hub.root}>
      <View style={hub.chipsRowFlush}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={hub.chips}
          style={hub.chipsScroll}>
          {categoryIds.map((id) => {
            const selected = id === activeCategoryId;
            const accent = categoryAccentForCategoryId(id);
            return (
              <Pressable
                key={id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setSelectedCategoryId(id)}
                style={({ pressed }) => [
                  hub.chip,
                  selected && { backgroundColor: `${accent}22`, borderColor: accent },
                  pressed && hub.pressed,
                ]}>
                <Text style={[hub.chipText, selected && { color: accent }]}>
                  {categoryLabel(id)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {activeCategoryId ? (
        <Text style={styles.countLine}>
          {categoryQuests.length === 1
            ? '1 quest in this category'
            : `${categoryQuests.length} quests in this category`}
        </Text>
      ) : null}

      <View style={styles.groupList}>
        {categoryQuests.map((q) => (
          <CatalogQuestRow
            key={q.id}
            quest={q}
            categoryLabel={activeCategoryId ? categoryLabel(activeCategoryId) : ''}
            busy={actions.primaryBusy}
            onOpen={actions.openQuest}
            onStart={(id) => void actions.onStartNow(id)}
            onLike={(id) => void actions.onLike(id)}
          />
        ))}
      </View>

      {actions.primaryBusy ? (
        <View style={hub.busyRow}>
          <ActivityIndicator color={Theme.accent} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { paddingVertical: 48, alignItems: 'center', gap: 12 },
  loadingText: { color: Theme.textMuted, fontSize: 14 },
  countLine: {
    fontSize: 13,
    fontWeight: '500',
    color: Theme.textMuted,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  groupList: { gap: 10, paddingHorizontal: 16 },
});
