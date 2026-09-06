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
import {
  orderCategoryQuests,
  QUESTS_OPEN_PER_CATEGORY,
} from '@/src/features/quests/suggestedQuests';
import type { Quest } from '@/src/types/quest';

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

  // A "show more" control lived here for a day. It was removed because it
  // handed over the whole shelf: the rest of the catalogue is meant to be
  // earned by finishing something, so there is deliberately no way to reach it.
  const visibleQuests = categoryQuests.slice(0, QUESTS_OPEN_PER_CATEGORY);
  const lockedCount = Math.max(0, categoryQuests.length - visibleQuests.length);

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

      {activeCategoryId && visibleQuests.length > 0 ? (
        <Text style={styles.countLine}>
          {visibleQuests.length === 1
            ? '1 quest open to you here'
            : `${visibleQuests.length} quests open to you here`}
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

        {/* Says the rule out loud. Without it five quests looks like all there
            is, and the reason to finish one is invisible. Deliberately not a
            control — there is nothing to tap. */}
        {lockedCount > 0 ? (
          <View style={styles.lockedRow}>
            <Ionicons name="lock-closed-outline" size={14} color={Theme.textMuted} />
            <Text style={styles.lockedText}>
              {lockedCount === 1
                ? '1 more waiting here — finish one of these to reach it.'
                : `${lockedCount} more waiting here — finish one of these to reach the next.`}
            </Text>
          </View>
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
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  lockedText: {
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 18,
    color: Theme.textMuted,
  },
});
