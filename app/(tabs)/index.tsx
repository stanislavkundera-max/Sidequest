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

import { ActiveQuestProgressCard } from '@/components/quests/ActiveQuestProgressCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Theme } from '@/constants/Theme';
import { categoryAccentForCategoryId } from '@/lib/categoryAccent';
import { useMemoryStore } from '@/src/features/memories';
import { useQuestDomainStore } from '@/src/features/quests/questStore';
import {
  ACTIVE_LIMITS,
  countCompletedJourneySteps,
} from '@/src/features/quests/questHelpers';
import {
  CATEGORY_TAB_ICON,
  CATEGORY_TAB_IDS,
  CATEGORY_TAB_LABEL,
  type CategoryTabId,
} from '@/src/constants/categoryTabs';
import { trackEvent } from '@/src/lib/analytics';
import type { Quest, QuestTimeframe } from '@/src/types/quest';
import type { UserQuest } from '@/src/types/quest';
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

function journeyProgressForCard(
  quest: Quest,
  uq: UserQuest | undefined
): { stepDone: number; stepTotal: number } {
  const stepTotal = quest.actionSteps.length;
  if (stepTotal === 0 || !uq) {
    return { stepDone: 0, stepTotal };
  }
  if (uq.status === 'active' || uq.status === 'completed') {
    return {
      stepDone: countCompletedJourneySteps(uq, quest),
      stepTotal,
    };
  }
  return { stepDone: 0, stepTotal };
}

export default function HomeScreen() {
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
      trackEvent('home_viewed', { sourceScreen: 'home_tab' }).catch(() => undefined);
    }, [])
  );

  const active = useMemo(
    () => userQuests.filter((uq) => uq.status === 'active'),
    [userQuests]
  );

  const completedCount = useMemo(
    () => userQuests.filter((uq) => uq.status === 'completed').length,
    [userQuests]
  );

  const [selectedCategory, setSelectedCategory] =
    useState<CategoryTabId>('recommended');

  /** All catalog quests in the selected category, split by weekly / monthly / yearly. */
  const catalogByCategoryTimeframe = useMemo(() => {
    const empty = (): Record<QuestTimeframe, Quest[]> => ({
      weekly: [],
      monthly: [],
      yearly: [],
    });
    if (selectedCategory === 'recommended') {
      return empty();
    }
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

  const hasAnyInCategory = useMemo(
    () =>
      TIMEFRAME_ORDER.some((tf) => catalogByCategoryTimeframe[tf].length > 0),
    [catalogByCategoryTimeframe]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Home</Text>
        <Text style={styles.subtitle}>
          Pick a category to browse every side quest in that theme, grouped by weekly, monthly, and
          yearly—same rhythm as Progress. Your journey progress shows when you have started one.
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
                    const { stepDone, stepTotal } = journeyProgressForCard(quest, uq);
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
                        onPress={() => router.push(`/quest/${quest.id}`)}
                      />
                    );
                  })
                )}
              </View>
            ))
          )}
        </View>

        <View style={styles.summary}>
          <SummaryItem
            label="Completed quests"
            value={completedCount}
            accessibilityHint="Opens list of completed quests"
            onPress={() => router.push('/quest/completed' as never)}
          />
          <SummaryStat label="Active quests" value={active.length} />
          <SummaryItem
            label="Memories"
            value={memories.length}
            accessibilityHint="Opens memories timeline"
            onPress={() => router.push('/(tabs)/memories')}
          />
        </View>

        <View style={styles.actionRow}>
          <Pressable
            onPress={() => router.push('/(tabs)/memories')}
            style={({ pressed }) => [
              styles.ctaSecondary,
              pressed && { opacity: 0.9 },
            ]}>
            <Text style={styles.ctaSecondaryText}>View memories</Text>
          </Pressable>
        </View>

        <Text style={styles.limitText}>
          Limits: {ACTIVE_LIMITS.weekly} weekly · {ACTIVE_LIMITS.monthly} monthly · {ACTIVE_LIMITS.yearly} yearly
        </Text>

        {completedCount === 0 ? (
          <Text style={styles.limitText}>
            No completed quests yet. Start with one small weekly quest.
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryItem({
  label,
  value,
  onPress,
  accessibilityHint,
}: {
  label: string;
  value: number;
  onPress: () => void;
  accessibilityHint?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [styles.summaryCard, pressed && styles.summaryCardPressed]}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </Pressable>
  );
}

/** Count-only tile: active quests are listed above; this avoids navigating away from them. */
function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <View
      style={styles.summaryCard}
      accessibilityRole="text"
      accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.bg },
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
  summary: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 20 },
  summaryCard: {
    flex: 1,
    backgroundColor: Theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: 12,
  },
  summaryCardPressed: { opacity: 0.92 },
  summaryValue: { color: Theme.accent, fontSize: 24, fontWeight: '600' },
  summaryLabel: { color: Theme.textMuted, fontSize: 12, marginTop: 4 },
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
  actionRow: { gap: 10, marginBottom: 10 },
  ctaSecondary: {
    borderWidth: 1,
    borderColor: Theme.border,
    backgroundColor: Theme.surface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaSecondaryText: { color: Theme.text, fontWeight: '600', fontSize: 16 },
  limitText: { color: Theme.textMuted, fontSize: 13 },
  inlineStatus: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
