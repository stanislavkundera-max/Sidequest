import type { ComponentProps } from 'react';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Theme } from '@/constants/Theme';
import { categoryAccentForCategoryId } from '@/lib/categoryAccent';
import { useMemoryStore } from '@/src/features/memories/memoryStore';
import { useQuestDomainStore } from '@/src/features/quests/questStore';
import {
  activeQuestResumePath,
  countCompletedJourneySteps,
} from '@/src/features/quests/questHelpers';
import {
  CATEGORY_TAB_ICON,
  CATEGORY_TAB_IDS,
  CATEGORY_TAB_LABEL,
  type CategoryTabId,
} from '@/src/constants/categoryTabs';
import { trackEvent } from '@/src/lib/analytics';
import type { Quest, QuestTimeframe, UserQuest } from '@/src/types/quest';
import { ActiveQuestProgressCard } from '@/components/quests/ActiveQuestProgressCard';
import { useSessionStore } from '@/stores/session';

const TIMEFRAME_ORDER: QuestTimeframe[] = ['weekly', 'monthly', 'yearly'];
const TIMEFRAME_LABEL: Record<QuestTimeframe, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

function userQuestForCatalogQuest(
  userQuests: UserQuest[],
  questId: string
): UserQuest | undefined {
  return userQuests.find((u) => u.questId === questId);
}

function statusSuffix(uq: UserQuest | undefined): string {
  if (!uq) return 'Not started';
  if (uq.status === 'active') return 'Active';
  return 'Completed';
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '').trim();
  if (h.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function ChooseQuestScreen() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const loadingQuests = useQuestDomainStore((s) => s.loading);
  const pendingQuestMutation = useQuestDomainStore((s) => s.pending);
  const questError = useQuestDomainStore((s) => s.error);
  const refreshUserQuests = useQuestDomainStore((s) => s.refreshUserQuests);
  const userQuests = useQuestDomainStore((s) => s.userQuests);
  const catalogQuests = useQuestDomainStore((s) => s.quests);
  const memoryLoading = useMemoryStore((s) => s.loading);
  const memories = useMemoryStore((s) => s.memories);

  useFocusEffect(
    useCallback(() => {
      trackEvent('home_viewed', { sourceScreen: 'choose_quest_screen' }).catch(
        () => undefined
      );
    }, [])
  );

  const [selectedCategory, setSelectedCategory] = useState<CategoryTabId>('recommended');

  const categoryBgOverlay = useMemo(() => {
    if (selectedCategory === 'recommended') return 'transparent';
    const accent = categoryAccentForCategoryId(selectedCategory);
    // Soft tint only; keeps the UI calm and readable.
    return hexToRgba(accent, 0.075);
  }, [selectedCategory]);

  const catalogByCategoryTimeframe = useMemo(() => {
    const empty = (): Record<QuestTimeframe, Quest[]> => ({
      weekly: [],
      monthly: [],
      yearly: [],
    });
    if (selectedCategory === 'recommended') return empty();

    const map = empty();
    for (const q of catalogQuests) {
      if (q.categoryId !== selectedCategory) continue;
      map[q.timeframe].push(q);
    }
    TIMEFRAME_ORDER.forEach((tf) => {
      map[tf].sort((a, b) => a.title.localeCompare(b.title));
    });
    return map;
  }, [catalogQuests, selectedCategory]);

  const hasAnyInCategory = useMemo(() => {
    return TIMEFRAME_ORDER.some((tf) => catalogByCategoryTimeframe[tf].length > 0);
  }, [catalogByCategoryTimeframe]);

  return (
    <View style={styles.page}>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { backgroundColor: categoryBgOverlay }]}
      />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Choose a quest</Text>
          <Text style={styles.subtitle}>
            Pick one quest quickly. Start with a category, then tap any quest card to open details.
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryScrollContent}>
            {CATEGORY_TAB_IDS.map((id) => {
              const selected = id === selectedCategory;
              const iconName = CATEGORY_TAB_ICON[id] as ComponentProps<
                typeof FontAwesome
              >['name'];
              return (
                <Pressable
                  key={id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  onPress={() => setSelectedCategory(id)}
                  style={({ pressed }) => [
                    styles.categoryChip,
                    selected && styles.categoryChipSelected,
                    pressed && styles.categoryChipPressed,
                  ]}>
                  <FontAwesome
                    name={iconName}
                    size={14}
                    color={selected ? Theme.accent : Theme.textMuted}
                  />
                  <Text
                    style={[styles.categoryChipLabel, selected && styles.categoryChipLabelSelected]}
                    numberOfLines={1}>
                    {CATEGORY_TAB_LABEL[id]}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {questError ? (
            <ErrorState
              message={questError}
              onRetry={
                user
                  ? () => {
                      refreshUserQuests(user.id);
                    }
                  : undefined
              }
            />
          ) : null}

          {loadingQuests ? (
            <View style={styles.inlineStatus}>
              <ActivityIndicator color={Theme.accent} />
              <Text style={styles.limitText}>Loading quests...</Text>
            </View>
          ) : null}

          {memoryLoading ? (
            <View style={styles.inlineStatus}>
              <ActivityIndicator color={Theme.accent} />
              <Text style={styles.limitText}>Loading memories...</Text>
            </View>
          ) : null}

          {pendingQuestMutation ? (
            <View style={styles.inlineStatus}>
              <ActivityIndicator color={Theme.accent} />
              <Text style={styles.limitText}>Saving your quest update...</Text>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{CATEGORY_TAB_LABEL[selectedCategory]}</Text>

            {selectedCategory === 'recommended' ? (
              <EmptyState
                title="Recommended"
                message="Curated picks will show up here soon. Choose Nature, Adventure, Relax, or Social for now."
                actionLabel="Browse catalog"
                onAction={() =>
                  router.push({
                    pathname: '/quest/select' as never,
                    params: { category: 'recommended' },
                  })
                }
              />
            ) : !hasAnyInCategory ? (
              <EmptyState
                title={`No ${CATEGORY_TAB_LABEL[selectedCategory].toLowerCase()} quests in the catalog`}
                message="Try another category or check back later."
                actionLabel="Browse catalog"
                onAction={() =>
                  router.push({
                    pathname: '/quest/select' as never,
                    params: { category: selectedCategory },
                  })
                }
              />
            ) : (
              TIMEFRAME_ORDER.map((tf) => (
                <View key={tf} style={styles.timeframeBlock}>
                  <Text style={styles.timeframeHeading}>{TIMEFRAME_LABEL[tf]}</Text>
                  {catalogByCategoryTimeframe[tf].length === 0 ? (
                    <Text style={styles.timeframeEmpty}>No quests</Text>
                  ) : (
                    catalogByCategoryTimeframe[tf].map((quest) => {
                      const uq = userQuestForCatalogQuest(userQuests, quest.id);
                      const stepTotal = quest.actionSteps.length;
                      const stepDone =
                        stepTotal === 0 || !uq
                          ? 0
                          : uq.status === 'active' || uq.status === 'completed'
                            ? countCompletedJourneySteps(uq, quest)
                            : 0;
                      const accent = categoryAccentForCategoryId(quest.categoryId);
                      return (
                        <ActiveQuestProgressCard
                          key={quest.id}
                          title={quest.title}
                          shortDescription={quest.shortDescription}
                          categoryId={quest.categoryId}
                          categoryLine={`${TIMEFRAME_LABEL[quest.timeframe]} · ${quest.difficulty} · ${statusSuffix(uq)}`}
                          accentColor={accent}
                          stepDone={stepDone}
                          stepTotal={stepTotal}
                          onPress={() => {
                            if (uq?.status === 'active') {
                              router.push(activeQuestResumePath(quest, uq) as never);
                              return;
                            }
                            router.push(`/quest/${quest.id}` as never);
                          }}
                        />
                      );
                    })
                  )}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Theme.bg },
  safe: { flex: 1, backgroundColor: 'transparent' },
  scroll: { paddingHorizontal: 20, paddingBottom: 32 },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: Theme.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: Theme.textMuted,
    marginBottom: 16,
    lineHeight: 22,
  },
  categoryScroll: { marginBottom: 12 },
  categoryScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.border,
    backgroundColor: Theme.surface,
  },
  categoryChipSelected: {
    borderColor: Theme.accent,
    backgroundColor: Theme.accentSoft,
  },
  categoryChipPressed: { opacity: 0.92 },
  categoryChipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.textMuted,
  },
  categoryChipLabelSelected: { color: Theme.accent },
  section: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  timeframeBlock: { marginBottom: 18 },
  timeframeHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 10,
  },
  timeframeEmpty: {
    fontSize: 14,
    color: Theme.textMuted,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  limitText: { color: Theme.textMuted, fontSize: 13 },
  inlineStatus: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
