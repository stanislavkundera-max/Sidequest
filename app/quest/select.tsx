import type { ComponentProps } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  ActivityIndicator,
  Platform,
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
import { Theme } from '@/constants/Theme';
import { alertCompat } from '@/lib/alertCompat';
import { categoryAccentForCategoryId } from '@/lib/categoryAccent';
import {
  canUserBeginQuest,
  countActiveQuestsGlobally,
  MAX_ACTIVE_QUESTS,
} from '@/src/features/quests';
import { useQuestDomainStore } from '@/src/features/quests';
import {
  CATEGORY_TAB_ICON,
  CATEGORY_TAB_IDS,
  CATEGORY_TAB_LABEL,
  type CategoryTabId,
  parseCategoryTabParam,
} from '@/src/constants/categoryTabs';
import { trackEvent } from '@/src/lib/analytics';
import type { Quest, QuestTimeframe } from '@/src/types/quest';
import { useSessionStore } from '@/stores/session';

const TIMEFRAME_ORDER: QuestTimeframe[] = ['weekly', 'monthly', 'yearly'];

const TIMEFRAME_LABEL: Record<QuestTimeframe, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

function categoryName(categoryId: string): string {
  return (
    useQuestDomainStore
      .getState()
      .categories.find((c) => c.id === categoryId)?.name ?? categoryId
  );
}

export default function QuestSelectionScreen() {
  const router = useRouter();
  const { category: categoryParam } = useLocalSearchParams<{
    category?: string;
  }>();
  const user = useSessionStore((s) => s.user);

  const quests = useQuestDomainStore((s) => s.quests);
  const loading = useQuestDomainStore((s) => s.loading);
  const pending = useQuestDomainStore((s) => s.pending);
  const error = useQuestDomainStore((s) => s.error);
  const userQuests = useQuestDomainStore((s) => s.userQuests);
  const getQuestById = useQuestDomainStore((s) => s.getQuestById);
  const refreshUserQuests = useQuestDomainStore((s) => s.refreshUserQuests);

  const [feedback, setFeedback] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      trackEvent('quest_list_viewed', {
        sourceScreen: 'quest_select',
        category: categoryParam ?? 'recommended',
      }).catch(() => undefined);
    }, [categoryParam])
  );

  const activeByTimeframe = useMemo(() => {
    const map: Record<QuestTimeframe, number> = {
      weekly: 0,
      monthly: 0,
      yearly: 0,
    };
    for (const uq of userQuests) {
      if (uq.status !== 'active') continue;
      const quest = getQuestById(uq.questId);
      if (!quest) continue;
      map[quest.timeframe] += 1;
    }
    return map;
  }, [userQuests, getQuestById]);

  const activeQuestIds = useMemo(
    () => new Set(userQuests.filter((uq) => uq.status === 'active').map((uq) => uq.questId)),
    [userQuests]
  );

  const activePathCount = useMemo(
    () => countActiveQuestsGlobally(userQuests),
    [userQuests]
  );

  const selectedCategory = useMemo<CategoryTabId>(
    () => parseCategoryTabParam(categoryParam),
    [categoryParam]
  );

  const questsInCategory = useMemo(() => {
    if (selectedCategory === 'recommended') return [];
    return quests.filter((q) => q.categoryId === selectedCategory);
  }, [quests, selectedCategory]);

  const questsByTimeframe = useMemo(() => {
    const map: Record<QuestTimeframe, Quest[]> = {
      weekly: [],
      monthly: [],
      yearly: [],
    };
    for (const q of questsInCategory) {
      map[q.timeframe].push(q);
    }
    return map;
  }, [questsInCategory]);

  function setCategoryTab(category: CategoryTabId) {
    router.replace({
      pathname: '/quest/select' as never,
      params: { category },
    });
  }

  function activateQuest(quest: Quest) {
    if (!user) {
      alertCompat('Sign in required', 'Please sign in to activate quests.');
      router.replace('/(auth)/sign-in');
      return;
    }
    setFeedback(`Opening ${quest.title}...`);
    router.push({
      pathname: '/quest/[id]',
      params: { id: quest.id, autoActivate: '1' },
    });
  }

  if (loading && quests.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <LoadingState label="Loading available quests..." />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.scroll}>
          <EmptyState
            title="Sign in required"
            message="Please sign in to activate quests."
            actionLabel="Go to sign in"
            onAction={() => router.replace('/(auth)/sign-in')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Pick your quests</Text>
        <Text style={styles.sub}>
          Choose a category, then browse by cadence. Your active path fits up to {MAX_ACTIVE_QUESTS}{' '}
          quests at once — use the Journey tab to let one wait or tap the heart on a new pick when you want room.
        </Text>
        <Text style={styles.pathLine}>
          On your active path now: {activePathCount} / {MAX_ACTIVE_QUESTS}
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
                onPress={() => setCategoryTab(id)}
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

        {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
        {error ? (
          <ErrorState
            message={error}
            onRetry={
              user
                ? () => {
                    refreshUserQuests(user.id);
                  }
                : undefined
            }
          />
        ) : null}

        {pending ? (
          <View style={styles.pendingRow}>
            <ActivityIndicator color={Theme.accent} />
            <Text style={styles.sectionMeta}>Saving your selection...</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>{CATEGORY_TAB_LABEL[selectedCategory]}</Text>
          </View>

          {selectedCategory === 'recommended' ? (
            <EmptyState
              title="Recommended"
              message="Personalized suggestions will appear here soon. Pick Nature, Adventure, Relax, or Social to browse the catalog."
              actionLabel="Back to home"
              onAction={() => router.replace('/(tabs)/journey')}
            />
          ) : questsInCategory.length === 0 ? (
            <EmptyState
              title="No quests in this category"
              message="Try another category or check back later."
              actionLabel="Back to home"
              onAction={() => router.replace('/(tabs)/journey')}
            />
          ) : (
            TIMEFRAME_ORDER.map((tf) => (
              <View key={tf} style={styles.timeframeBlock}>
                <View style={styles.timeframeHead}>
                  <Text style={styles.timeframeTitle}>{TIMEFRAME_LABEL[tf]}</Text>
                  <Text style={styles.sectionMeta}>
                    {activeByTimeframe[tf]} active in this cadence
                  </Text>
                </View>
                {questsByTimeframe[tf].length === 0 ? (
                  <Text style={styles.timeframeEmpty}>No {TIMEFRAME_LABEL[tf].toLowerCase()} quests</Text>
                ) : (
                  questsByTimeframe[tf].map((quest) => {
                    const isActive = activeQuestIds.has(quest.id);
                    const canBegin = canUserBeginQuest(userQuests, quests, quest.id);
                    const disabled = isActive || pending || !canBegin;
                    return (
                      <View key={quest.id} style={styles.card}>
                        <View
                          style={[
                            styles.accentBar,
                            {
                              backgroundColor: categoryAccentForCategoryId(quest.categoryId),
                            },
                          ]}
                        />
                        <View style={styles.cardBody}>
                          <Pressable
                            onPress={() => router.push(`/quest/${quest.id}`)}
                            style={({ pressed }) => [
                              styles.cardTapArea,
                              pressed && styles.cardTapPressed,
                            ]}>
                            <Text style={styles.cardTitle}>{quest.title}</Text>
                            <Text style={styles.cardMeta}>{quest.shortDescription}</Text>
                          </Pressable>
                          <View style={styles.cardFooter}>
                            <Text style={styles.cardHint}>
                              {categoryName(quest.categoryId)} · {quest.difficulty} · ~
                              {quest.estimatedDurationMinutes} min
                            </Text>
                            <Pressable
                              onPress={() => {
                                void activateQuest(quest);
                              }}
                              hitSlop={8}
                              disabled={disabled}
                              style={({ pressed }) => [
                                styles.addBtn,
                                Platform.OS === 'web' && styles.addBtnWeb,
                                disabled && styles.addBtnDisabled,
                                pressed && !disabled && styles.addBtnPressed,
                              ]}>
                              <Text style={styles.addBtnText}>
                                {isActive
                                  ? 'On path'
                                  : pending
                                    ? 'Saving...'
                                    : !canBegin
                                      ? 'Path full'
                                      : 'Begin'}
                              </Text>
                            </Pressable>
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.bg },
  scroll: { padding: 20, paddingBottom: 36 },
  title: { fontSize: 28, fontWeight: '600', color: Theme.text, marginBottom: 8 },
  sub: { fontSize: 15, color: Theme.textMuted, lineHeight: 22, marginBottom: 8 },
  pathLine: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.text,
    marginBottom: 14,
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
  feedback: {
    marginBottom: 14,
    color: Theme.accent,
    fontSize: 14,
    backgroundColor: Theme.accentSoft,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  section: { marginBottom: 24 },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 14,
  },
  timeframeBlock: { marginBottom: 18 },
  timeframeHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  timeframeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  timeframeEmpty: {
    fontSize: 14,
    color: Theme.textMuted,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
    color: Theme.textMuted,
  },
  sectionMeta: { fontSize: 13, color: Theme.textMuted },
  pendingRow: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: Theme.surface,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  cardTapArea: { marginBottom: 4 },
  cardTapPressed: { opacity: 0.92 },
  accentBar: { width: 5 },
  cardBody: { flex: 1, padding: 12 },
  cardTitle: { color: Theme.text, fontWeight: '600', fontSize: 16, marginBottom: 6 },
  cardMeta: { color: Theme.textMuted, fontSize: 14, lineHeight: 20 },
  cardFooter: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    zIndex: 1,
  },
  cardHint: { color: Theme.textMuted, fontSize: 12 },
  addBtn: {
    backgroundColor: Theme.accent,
    minWidth: 88,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  addBtnWeb: { cursor: 'pointer', pointerEvents: 'auto' } as const,
  addBtnDisabled: { backgroundColor: Theme.border },
  addBtnPressed: { opacity: 0.9 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
