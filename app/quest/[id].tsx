import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QuestJourneyChecklist } from '@/components/quests/QuestJourneyChecklist';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Theme } from '@/constants/Theme';
import { alertCompat, alertTwoChoice } from '@/lib/alertCompat';
import { categoryAccentForCategoryId } from '@/lib/categoryAccent';
import { isSupabaseConfigured, SUPABASE_CONFIGURE_HELP } from '@/lib/supabase';
import { QuestFeedbackCard } from '@/src/features/feedback/QuestFeedbackCard';
import { useMemoryStore } from '@/src/features/memories/memoryStore';
import { questDurationLabel, QUEST_COPY } from '@/src/features/quests/questCopy';
import {
  canUserBeginQuest,
  countCompletedJourneySteps,
  incompleteJourneyStepsCount,
} from '@/src/features/quests/questHelpers';
import { useQuestDomainStore } from '@/src/features/quests/questStore';
import { trackEvent } from '@/src/lib/analytics';
import { logError } from '@/src/lib/monitoring/errorLogger';
import type { QuestTimeframe } from '@/src/types/quest';
import { useSessionStore } from '@/stores/session';

const TF_LABEL: Record<QuestTimeframe, string> = {
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

export default function QuestDetailScreen() {
  const { id, autoActivate } = useLocalSearchParams<{ id: string; autoActivate?: string }>();
  const navigation = useNavigation();
  const router = useRouter();
  const user = useSessionStore((s) => s.user);

  const quests = useQuestDomainStore((s) => s.quests);
  const loading = useQuestDomainStore((s) => s.loading);
  const pending = useQuestDomainStore((s) => s.pending);
  const error = useQuestDomainStore((s) => s.error);
  const userQuests = useQuestDomainStore((s) => s.userQuests);
  const getQuestById = useQuestDomainStore((s) => s.getQuestById);
  const refreshUserQuests = useQuestDomainStore((s) => s.refreshUserQuests);
  const assignQuestToUser = useQuestDomainStore((s) => s.assignQuestToUser);
  const deactivateQuest = useQuestDomainStore((s) => s.deactivateQuest);
  const memories = useMemoryStore((s) => s.memories);

  const quest = useMemo(() => (id ? getQuestById(String(id)) : undefined), [id, getQuestById]);

  const activeUq = useMemo(
    () =>
      quest
        ? userQuests.find(
            (uq) => uq.questId === quest.id && uq.status === 'active'
          )
        : undefined,
    [quest, userQuests]
  );

  const completedUq = useMemo(() => {
    if (!quest) return undefined;
    const completed = userQuests.filter(
      (uq) => uq.questId === quest.id && uq.status === 'completed'
    );
    if (completed.length === 0) return undefined;
    return completed.sort(
      (a, b) =>
        (b.completedAt ?? '').localeCompare(a.completedAt ?? '')
    )[0];
  }, [quest, userQuests]);

  // The runner auto-saves a memory on wrap-up; older completions (or a
  // failed auto-save) may still lack one, so only then offer to add one.
  const existingMemory = useMemo(
    () => (completedUq ? memories.find((m) => m.userQuestId === completedUq.id) : undefined),
    [completedUq, memories]
  );

  const canAssign = useMemo(() => {
    if (!quest) return false;
    if (activeUq) return false;
    return canUserBeginQuest(userQuests, quests, quest.id);
  }, [quest, userQuests, quests, activeUq]);

  const [acting, setActing] = useState(false);
  const [assignFeedback, setAssignFeedback] = useState<string | null>(null);
  const autoActivateHandledRef = useRef(false);

  useEffect(() => {
    autoActivateHandledRef.current = false;
  }, [id]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: quest?.title ?? 'Quest',
    });
  }, [navigation, quest?.title]);

  useLayoutEffect(() => {
    if (!quest) return;
    trackEvent('quest_detail_viewed', {
      sourceScreen: 'quest_detail',
      questId: quest.id,
      timeframe: quest.timeframe,
      category: quest.categoryId,
      difficulty: quest.difficulty,
    }).catch(() => undefined);
  }, [quest]);

  async function onAssign(): Promise<boolean> {
    if (!quest || !user) return false;
    if (!isSupabaseConfigured()) {
      setAssignFeedback('Supabase is not configured.');
      alertCompat('Configuration', SUPABASE_CONFIGURE_HELP);
      return false;
    }
    setAssignFeedback(`Adding "${quest.title}" to your active quests...`);
    setActing(true);
    try {
      const r = await assignQuestToUser(user.id, quest.id);
      if (!r.ok) {
        const reasonMessage =
          r.reason === 'active_path_full'
            ? QUEST_COPY.activePathFullBody
            : r.reason === 'already_active'
              ? 'This quest is already on your active path.'
              : 'Quest not found.';
        setAssignFeedback(reasonMessage);
        if (r.reason === 'active_path_full') {
          trackEvent('quest_activation_failed_limit_reached', {
            sourceScreen: 'quest_detail',
            questId: quest.id,
            timeframe: quest.timeframe,
          }).catch(() => undefined);
        }
        alertCompat('Cannot add', reasonMessage);
        return false;
      }
      setAssignFeedback('Quest added. Refreshing your active list...');
      trackEvent('quest_activated', {
        sourceScreen: 'quest_detail',
        questId: quest.id,
        timeframe: quest.timeframe,
        category: quest.categoryId,
        difficulty: quest.difficulty,
      }).catch(() => undefined);
      await refreshUserQuests(user.id);
      setAssignFeedback('Quest is active. Open the runner when you are ready to work through the steps.');
      return true;
    } catch (e: unknown) {
      logError('quest.detail.onAssign', e, { questId: quest.id });
      const message = e instanceof Error ? e.message : 'Try again.';
      setAssignFeedback(message);
      alertCompat('Cannot add', message);
      return false;
    } finally {
      setActing(false);
    }
  }

  useEffect(() => {
    if (autoActivate !== '1') return;
    if (autoActivateHandledRef.current) return;
    if (!quest || !user) return;
    autoActivateHandledRef.current = true;
    if (!activeUq && canAssign) {
      void onAssign();
    }
  }, [autoActivate, quest, user, activeUq, canAssign]);

  async function performDeactivate() {
    if (!activeUq || !quest || !user) return;
    if (!isSupabaseConfigured()) {
      alertCompat('Configuration', SUPABASE_CONFIGURE_HELP);
      return;
    }
    // Capture before deactivating — it decides which Journey section the quest
    // lands in, and so which one we point the user at.
    const hadProgress = countCompletedJourneySteps(activeUq, quest) > 0;
    setActing(true);
    try {
      const r = await deactivateQuest(user.id, activeUq.id);
      if (!r.ok) {
        alertCompat(
          'Could not update',
          r.reason === 'not_active'
            ? 'This quest is no longer on your active path.'
            : 'Quest not found.'
        );
        return;
      }
      trackEvent('quest_deactivated', {
        sourceScreen: 'quest_detail',
        questId: quest.id,
        timeframe: quest.timeframe,
        category: quest.categoryId,
      }).catch(() => undefined);
      await refreshUserQuests(user.id);
      setAssignFeedback(null);
      alertCompat(
        'Set aside for now',
        `It is off your active path for now. Your journey steps stay as you left them. ${QUEST_COPY.leaveDestination(
          hadProgress
        )}`
      );
    } catch (e: unknown) {
      logError('quest.detail.onDeactivate', e, {
        questId: quest.id,
        userQuestId: activeUq.id,
      });
      alertCompat('Error', e instanceof Error ? e.message : 'Could not remove quest.');
    } finally {
      setActing(false);
    }
  }

  function requestDeactivate() {
    if (!activeUq || !quest || !user) return;
    const hasProgress = countCompletedJourneySteps(activeUq, quest) > 0;
    alertTwoChoice(
      'Let this quest wait?',
      `It moves out of active motion; your progress stays saved — nothing is deleted. ${QUEST_COPY.leaveDestination(
        hasProgress
      )}`,
      {
        cancel: { text: 'Keep it on the path' },
        confirm: {
          text: QUEST_COPY.moveToLater,
          onPress: () => {
            void performDeactivate();
          },
        },
      }
    );
  }

  function openRunner() {
    if (!quest) return;
    router.push(`/quest/run/${quest.id}`);
  }

  if (!id) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.scroll}>
          <EmptyState
            title="Quest link is incomplete"
            message="The quest id is missing."
            actionLabel="Go to quests"
            onAction={() => router.replace('/quest/select')}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (loading && !quest) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <LoadingState label="Loading quest details..." />
      </SafeAreaView>
    );
  }

  if (!quest) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.scroll}>
          <EmptyState
            title="Quest not found"
            message="This quest may be inactive or no longer available."
            actionLabel="Browse quests"
            onAction={() => router.replace('/quest/select')}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.scroll}>
          <EmptyState
            title="Sign in required"
            message="Please sign in to manage quests."
            actionLabel="Go to sign in"
            onAction={() => router.replace('/(auth)/sign-in')}
          />
        </View>
      </SafeAreaView>
    );
  }

  const accent = categoryAccentForCategoryId(quest.categoryId);
  const incompleteStepCount =
    activeUq && quest.actionSteps.length > 0
      ? incompleteJourneyStepsCount(activeUq, quest)
      : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.badge, { backgroundColor: Theme.accentSoft }]}>
          <Text style={[styles.badgeText, { color: accent }]}>
            {TF_LABEL[quest.timeframe]}
          </Text>
        </View>
        <Text style={styles.category}>{categoryName(quest.categoryId)}</Text>
        <Text style={styles.title}>{quest.title}</Text>
        <Text style={styles.shortDescription}>{quest.shortDescription}</Text>
        <Text style={styles.body}>{quest.fullDescription}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            {[
              TF_LABEL[quest.timeframe],
              quest.difficulty,
              questDurationLabel(quest.estimatedDurationMinutes),
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>

        <QuestJourneyChecklist
          quest={quest}
          mode={activeUq ? 'active' : completedUq ? 'completed' : 'browse'}
          userQuest={activeUq ?? completedUq}
          accentColor={accent}
        />

        <View style={[styles.reflection, { borderLeftColor: accent }]}>
          <Text style={styles.reflectionLabel}>Reflection</Text>
          <Text style={styles.reflectionBody}>{quest.promptForReflection}</Text>
        </View>

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
        {assignFeedback ? <Text style={styles.assignFeedback}>{assignFeedback}</Text> : null}

        {activeUq ? (
          <>
            {incompleteStepCount > 0 ? (
              <Text style={styles.runnerHint}>
                {incompleteStepCount} journey step{incompleteStepCount === 1 ? '' : 's'} left — finish
                them in the runner in order before wrapping up.
              </Text>
            ) : null}
            <PrimaryButton
              label="Continue quest"
              loading={acting || pending}
              onPress={openRunner}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Let this quest wait; find it under Journey Liked"
              onPress={requestDeactivate}
              disabled={acting || pending}
              style={({ pressed }) => [
                styles.deactivateBtn,
                (acting || pending) && styles.deactivateBtnDisabled,
                pressed && !(acting || pending) && styles.deactivateBtnPressed,
              ]}>
              <Text style={styles.deactivateBtnText}>{QUEST_COPY.moveToLater}</Text>
            </Pressable>
          </>
        ) : completedUq && !activeUq ? (
          <View style={styles.doneBanner}>
            <Text style={styles.doneText}>Completed.</Text>
            <Pressable
              style={[styles.secondaryBtn, { backgroundColor: Theme.accentSoft }]}
              onPress={() =>
                existingMemory
                  ? router.push(`/memory/${existingMemory.id}`)
                  : router.push({
                      pathname: '/memory/new',
                      params: { questId: quest.id },
                    })
              }>
              <Text style={[styles.secondaryBtnText, { color: accent }]}>
                {existingMemory ? 'View memory' : 'Add a memory'}
              </Text>
            </Pressable>
          </View>
        ) : canAssign ? (
          <PrimaryButton
            label="Begin"
            loading={acting || pending}
            onPress={() => {
              setAssignFeedback('Preparing your first step...');
              void (async () => {
                const ok = await onAssign();
                if (ok) openRunner();
              })();
            }}
          />
        ) : (
          <View style={styles.doneBanner}>
            <Text style={styles.doneText}>
              At your limit for {TF_LABEL[quest.timeframe].toLowerCase()} quests,
              or this quest is not available to add right now.
            </Text>
          </View>
        )}
        {completedUq ? (
          <QuestFeedbackCard
            userId={user.id}
            questId={quest.id}
            sourceScreen="quest_detail"
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.bg,
  },
  muted: { color: Theme.textMuted },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  badgeText: {
    fontWeight: '600',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  category: {
    fontSize: 14,
    color: Theme.textMuted,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Theme.text,
    marginBottom: 12,
    lineHeight: 32,
  },
  body: {
    fontSize: 16,
    lineHeight: 25,
    color: Theme.text,
    marginBottom: 12,
  },
  shortDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: Theme.textMuted,
    marginBottom: 12,
  },
  metaRow: { marginBottom: 20 },
  meta: { fontSize: 13, color: Theme.textMuted },
  reflection: {
    borderLeftWidth: 4,
    paddingLeft: 14,
    marginBottom: 28,
  },
  reflectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.textMuted,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  reflectionBody: { fontSize: 16, lineHeight: 24, color: Theme.text },
  runnerHint: {
    marginBottom: 14,
    fontSize: 14,
    lineHeight: 21,
    color: Theme.textMuted,
  },
  assignFeedback: {
    marginBottom: 14,
    color: Theme.accent,
    fontSize: 14,
    backgroundColor: Theme.accentSoft,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  doneBanner: {
    backgroundColor: Theme.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.border,
    gap: 12,
  },
  doneText: { fontSize: 15, color: Theme.text },
  secondaryBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  secondaryBtnText: { fontWeight: '600', fontSize: 15 },
  deactivateBtn: {
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.border,
    backgroundColor: Theme.surface,
    alignItems: 'center',
  },
  deactivateBtnPressed: { opacity: 0.88 },
  deactivateBtnDisabled: { opacity: 0.55 },
  deactivateBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.textMuted,
  },
});
