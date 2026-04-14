import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  CompactActiveQuestRow,
  TimeframeSlotsSummary,
} from '@/components/quests/ProgressOverviewBlocks';
import { ErrorState } from '@/components/ui/ErrorState';
import { Theme } from '@/constants/Theme';
import { alertCompat } from '@/lib/alertCompat';
import { categoryAccentForCategoryId } from '@/lib/categoryAccent';
import { getOnboardingState, type OnboardingState } from '@/lib/onboarding';
import { useMemoryStore } from '@/src/features/memories/memoryStore';
import {
  ACTIVE_LIMITS,
  countCompletedJourneySteps,
  getNextActionableStepLabel,
} from '@/src/features/quests/questHelpers';
import { useQuestDomainStore } from '@/src/features/quests/questStore';
import { trackEvent } from '@/src/lib/analytics';
import type { QuestTimeframe } from '@/src/types/quest';
import type { UserQuest } from '@/src/types/quest';
import { useSessionStore } from '@/stores/session';

const TIMEFRAME_LABEL: Record<QuestTimeframe, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

function sortUserQuestsByStarted(a: UserQuest, b: UserQuest): number {
  return a.startedAt.localeCompare(b.startedAt);
}

type ProgressOverviewProps = {
  focusedTimeframe: QuestTimeframe;
};

export function ProgressOverview({ focusedTimeframe }: ProgressOverviewProps) {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const loadingQuests = useQuestDomainStore((s) => s.loading);
  const questError = useQuestDomainStore((s) => s.error);
  const refreshUserQuests = useQuestDomainStore((s) => s.refreshUserQuests);
  const userQuests = useQuestDomainStore((s) => s.userQuests);
  const getQuestById = useQuestDomainStore((s) => s.getQuestById);
  const memoryLoading = useMemoryStore((s) => s.loading);
  const memoryError = useMemoryStore((s) => s.error);
  const memories = useMemoryStore((s) => s.memories);
  const [onboarding, setOnboarding] = useState<OnboardingState | null>(null);
  const [loadingOnboarding, setLoadingOnboarding] = useState(true);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);

  const completedCount = useMemo(
    () => userQuests.filter((uq) => uq.status === 'completed').length,
    [userQuests]
  );

  const active = useMemo(
    () => userQuests.filter((uq) => uq.status === 'active'),
    [userQuests]
  );

  const grouped = useMemo(() => {
    const map: Record<QuestTimeframe, UserQuest[]> = {
      weekly: [],
      monthly: [],
      yearly: [],
    };
    for (const uq of active) {
      const quest = getQuestById(uq.questId);
      if (!quest) continue;
      map[quest.timeframe].push(uq);
    }
    (['weekly', 'monthly', 'yearly'] as const).forEach((tf) => {
      map[tf].sort(sortUserQuestsByStarted);
    });
    return map;
  }, [active, getQuestById]);

  const slotCounts = useMemo(
    () => ({
      weekly: grouped.weekly.length,
      monthly: grouped.monthly.length,
      yearly: grouped.yearly.length,
    }),
    [grouped]
  );

  useFocusEffect(
    useCallback(() => {
      trackEvent('profile_viewed', {
        sourceScreen: 'profile_tab',
        timeframe: focusedTimeframe,
      }).catch(() => undefined);
      setLoadingOnboarding(true);
      setOnboardingError(null);
      getOnboardingState()
        .then(setOnboarding)
        .catch((e: unknown) => {
          setOnboarding(null);
          setOnboardingError(
            e instanceof Error ? e.message : 'Could not load onboarding preferences.'
          );
        })
        .finally(() => setLoadingOnboarding(false));
    }, [focusedTimeframe])
  );

  function navigateToTimeframe(tf: QuestTimeframe) {
    if (tf === focusedTimeframe) return;
    if (tf === 'weekly') {
      router.replace('/(tabs)/profile' as never);
      return;
    }
    router.replace(`/(tabs)/profile/${tf}` as never);
  }

  const loadingAny = loadingQuests || memoryLoading || loadingOnboarding;
  const tf = focusedTimeframe;
  const listForTf = grouped[tf];

  const stats = useMemo(
    () => ({
      completed: completedCount,
      active: active.length,
      memories: memories.length,
    }),
    [completedCount, active.length, memories.length]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Progress</Text>
            <Text style={styles.overviewKicker}>{TIMEFRAME_LABEL[tf]} overview</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Progress info"
            onPress={() =>
              alertCompat(
                'Info',
                'Category mix and onboarding preferences will live here soon.'
              )
            }
            style={({ pressed }) => [styles.infoBtn, pressed && styles.infoBtnPressed]}>
            <FontAwesome name="info-circle" size={18} color={Theme.textMuted} />
          </Pressable>
        </View>

        {loadingAny ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={Theme.accent} />
            <Text style={styles.muted}>Refreshing…</Text>
          </View>
        ) : null}

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
        {memoryError ? <ErrorState message={memoryError} /> : null}
        {onboardingError ? <ErrorState message={onboardingError} /> : null}

        {!loadingAny ? (
          <>
            <View style={styles.statsCard}>
              <View style={styles.statsRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Completed quests: ${stats.completed}. Opens completed quests list.`}
                  accessibilityHint="Opens overview of completed side quests"
                  onPress={() => router.push('/quest/completed' as never)}
                  style={({ pressed }) => [
                    styles.statCell,
                    styles.statCellTappable,
                    pressed && styles.statCellPressed,
                  ]}>
                  <Text style={styles.statValue}>{stats.completed}</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </Pressable>
                <View style={styles.statDivider} />
                <View style={styles.statCell}>
                  <Text style={styles.statValue}>{stats.active}</Text>
                  <Text style={styles.statLabel}>Active</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCell}>
                  <Text style={styles.statValue}>{stats.memories}</Text>
                  <Text style={styles.statLabel}>Memories</Text>
                </View>
              </View>
            </View>

            <TimeframeSlotsSummary
              counts={slotCounts}
              limits={ACTIVE_LIMITS}
              selectedTimeframe={focusedTimeframe}
              onSelectTimeframe={navigateToTimeframe}
            />

            <Text style={styles.sectionLead}>Active side quests</Text>

            <View style={styles.tfBlock}>
              {listForTf.length === 0 ? (
                <View style={styles.emptyTf}>
                  <Text style={styles.mutedInline}>
                    None active ·{' '}
                    <Text
                      style={styles.linkInline}
                      onPress={() =>
                        router.push({
                          pathname: '/quest/select' as never,
                          params: { category: 'recommended' },
                        })
                      }>
                      Add one
                    </Text>
                  </Text>
                </View>
              ) : (
                listForTf.map((uq) => {
                  const q = getQuestById(uq.questId);
                  if (!q) return null;
                  const stepTotal = q.actionSteps.length;
                  const stepDone =
                    stepTotal > 0 ? countCompletedJourneySteps(uq, q) : 0;
                  const percent =
                    stepTotal > 0
                      ? Math.round((stepDone / stepTotal) * 100)
                      : null;
                  const accent = categoryAccentForCategoryId(q.categoryId);
                  const nextStepLabel = getNextActionableStepLabel(uq, q);
                  return (
                    <CompactActiveQuestRow
                      key={uq.id}
                      title={q.title}
                      categoryId={q.categoryId}
                      nextStepLabel={nextStepLabel}
                      percent={percent}
                      accentColor={accent}
                      onPress={() => router.push(`/quest/${q.id}`)}
                    />
                  );
                })
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 6,
  },
  headerLeft: { flex: 1 },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: Theme.text,
    marginBottom: 2,
  },
  overviewKicker: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  infoBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.border,
    backgroundColor: Theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  infoBtnPressed: { opacity: 0.9 },
  statsCard: {
    backgroundColor: Theme.surface,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Theme.border,
    marginBottom: 12,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statCell: { flex: 1, alignItems: 'center' },
  statCellTappable: {
    paddingVertical: 4,
    marginVertical: -4,
    borderRadius: 10,
  },
  statCellPressed: { opacity: 0.85 },
  statDivider: { width: 1, height: 28, backgroundColor: Theme.border },
  statValue: { fontSize: 20, fontWeight: '700', color: Theme.text },
  statLabel: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '700',
    color: Theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionLead: {
    fontSize: 17,
    fontWeight: '600',
    color: Theme.text,
    marginBottom: 8,
  },
  tfBlock: { marginBottom: 12 },
  emptyTf: { marginBottom: 4 },
  mutedInline: { fontSize: 14, color: Theme.textMuted },
  linkInline: { color: Theme.accent, fontWeight: '600' },
  muted: { color: Theme.textMuted, fontSize: 14, lineHeight: 21 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
});
