import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { journeyHubStyles as hub } from '@/components/journey/journeyHubStyles';
import { CatalogQuestRow } from '@/components/quests/CatalogQuestRow';
import type { useQuestActions } from '@/components/quests/useQuestActions';
import { Theme } from '@/constants/Theme';
import { categoryAccentForCategoryId } from '@/lib/categoryAccent';
import { categoryIoniconNameForCategoryId } from '@/lib/categoryIcons';
import type { OnboardingPreferences } from '@/src/features/onboarding/types';
import { useQuestDomainStore } from '@/src/features/quests/questStore';
import { orderCategoryQuests } from '@/src/features/quests/suggestedQuests';
import type { Quest } from '@/src/types/quest';

/**
 * How many quests a category shows before asking to be expanded.
 *
 * Standa's call, 2026-09-05: the catalogue reached ten per category and a wall
 * of ten reads as homework rather than an invitation. Five is a page you can
 * take in at a glance. Every category shows the same number so no category
 * looks richer than another — that is why this is a flat constant and not a
 * proportion of the category's size.
 */
const VISIBLE_PER_CATEGORY = 5;

type Props = {
  /** Preselects a category chip (e.g. arriving from Explore's "Discover more"). */
  initialCategoryId?: string | null;
  /** Ranks the visible few by onboarding fit. Null = fall back to gentlest-first. */
  preferences?: OnboardingPreferences | null;
  actions: Pick<ReturnType<typeof useQuestActions>, 'primaryBusy' | 'onStartNow' | 'onLike' | 'openQuest'>;
};

/** Full catalog with category chip switching — one category shown at a time. */
export function AllQuestsList({ initialCategoryId, preferences, actions }: Props) {
  const quests = useQuestDomainStore((s) => s.quests);
  const categories = useQuestDomainStore((s) => s.categories);
  const userQuests = useQuestDomainStore((s) => s.userQuests);

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

  // Quests the user is already carrying, just finished, or recently turned down
  // are not offers any more — they live in the active and paused sections. This
  // screen used to show them anyway, so completing a quest changed nothing
  // here, which is the opposite of what finishing something should feel like.
  const categoryQuests = useMemo(() => {
    if (!activeCategoryId) return [] as Quest[];
    return orderCategoryQuests({
      catalog: quests,
      userQuests,
      categoryId: activeCategoryId,
      preferences,
    });
  }, [quests, userQuests, preferences, activeCategoryId]);

  const [expanded, setExpanded] = useState(false);
  // Collapse again when switching chips, or the cap silently stops applying
  // for the rest of the session after one expand.
  useEffect(() => {
    setExpanded(false);
  }, [activeCategoryId]);

  const hiddenCount = Math.max(0, categoryQuests.length - VISIBLE_PER_CATEGORY);
  const visibleQuests =
    expanded || hiddenCount === 0
      ? categoryQuests
      : categoryQuests.slice(0, VISIBLE_PER_CATEGORY);

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
                  selected && { backgroundColor: accent, borderColor: accent },
                  pressed && hub.pressed,
                ]}>
                <Ionicons
                  name={categoryIoniconNameForCategoryId(id)}
                  size={13}
                  color={selected ? '#ffffff' : accent}
                />
                <Text style={[hub.chipText, selected && { color: '#ffffff' }]}>
                  {categoryLabel(id)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {activeCategoryId && categoryQuests.length > 0 ? (
        <Text style={styles.countLine}>
          {hiddenCount > 0 && !expanded
            ? `${VISIBLE_PER_CATEGORY} picks for you`
            : categoryQuests.length === 1
              ? '1 quest in this category'
              : `${categoryQuests.length} quests in this category`}
        </Text>
      ) : null}

      <View style={styles.groupList}>
        {visibleQuests.map((q) => (
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

        {categoryQuests.length === 0 ? (
          <Text style={styles.emptyText}>
            You have taken on everything here for now. Finish one, or come back
            when these come round again.
          </Text>
        ) : null}

        {hiddenCount > 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setExpanded((v) => !v)}
            style={({ pressed }) => [styles.moreButton, pressed && hub.pressed]}>
            <Text style={styles.moreButtonText}>
              {expanded
                ? 'Show fewer'
                : hiddenCount === 1
                  ? 'Show 1 more quest'
                  : `Show ${hiddenCount} more quests`}
            </Text>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={15}
              color={Theme.textMuted}
            />
          </Pressable>
        ) : null}
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
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: Theme.textMuted,
    paddingVertical: 24,
    textAlign: 'center',
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 2,
  },
  moreButtonText: { fontSize: 14, fontWeight: '600', color: Theme.textMuted },
});
