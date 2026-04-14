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
import {
  getAvailableQuests,
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
  const completeQuest = useQuestDomainStore((s) => s.completeQuest);
  const deactivateQuest = useQuestDomainStore((s) => s.deactivateQuest);
  const toggleQuestStep = useQuestDomainStore((s) => s.toggleQuestStep);

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

  const canAssign = useMemo(() => {
    if (!quest) return false;
    if (activeUq) return false;
    return getAvailableQuests(userQuests, quests).some((q) => q.id === quest.id);
  }, [quest, userQuests, quests, activeUq]);

  const [acting, setActing] = useState(false);
  const [assignFeedback, setAssignFeedback] = useState<string | null>(null);
  const completionStartedRef = useRef(false);
  const completionFinishedRef = useRef(false);
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

  useLayoutEffect(() => {
    return () => {
      if (completionStartedRef.current && !completionFinishedRef.current && quest) {
        trackEvent('quest_completion_abandoned', {
          sourceScreen: 'quest_detail',
          questId: quest.id,
          timeframe: quest.timeframe,
          category: quest.categoryId,
        }).catch(() => undefined);
      }
    };
  }, [quest]);

  async function onAssign() {
    if (!quest || !user) return;
    if (!isSupabaseConfigured()) {
      setAssignFeedback('Supabase is not configured.');
      alertCompat('Configuration', SUPABASE_CONFIGURE_HELP);
      return;
    }
    setAssignFeedback(`Adding "${quest.title}" to your active quests...`);
    setActing(true);
    try {
      const r = await assignQuestToUser(user.id, quest.id);
      if (!r.ok) {
        const reasonMessage =
          r.reason === 'timeframe_full'
            ? 'You are at the limit for this timeframe.'
            : r.reason === 'already_active'
              ? 'This quest is already active.'
              : 'Quest not found.';
        setAssignFeedback(reasonMessage);
        if (r.reason === 'timeframe_full') {
          trackEvent('quest_activation_failed_limit_reached', {
            sourceScreen: 'quest_detail',
            questId: quest.id,
            timeframe: quest.timeframe,
          }).catch(() => undefined);
        }
        alertCompat('Cannot add', reasonMessage);
      } else {
        setAssignFeedback('Quest added. Refreshing your active list...');
        trackEvent('quest_activated', {
          sourceScreen: 'quest_detail',
          questId: quest.id,
          timeframe: quest.timeframe,
          category: quest.categoryId,
          difficulty: quest.difficulty,
        }).catch(() => undefined);
        await refreshUserQuests(user.id);
        setAssignFeedback('Quest is active. You can now mark it as completed when done.');
      }
    } catch (e: unknown) {
      logError('quest.detail.onAssign', e, { questId: quest.id });
      const message = e instanceof Error ? e.message : 'Try again.';
      setAssignFeedback(message);
      alertCompat('Cannot add', message);
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

  async function performComplete() {
    if (!activeUq || !quest || !user) return;
    if (!isSupabaseConfigured()) {
      alertCompat('Configuration', SUPABASE_CONFIGURE_HELP);
      return;
    }
    completionStartedRef.current = true;
    completionFinishedRef.current = false;
    const questIdForMemory = quest.id;
    setActing(true);
    try {
      const r = await completeQuest(user.id, activeUq.id);
      if (!r.ok) {
        alertCompat('Error', 'Could not complete quest.');
        return;
      }
      completionFinishedRef.current = true;
      trackEvent('quest_completed', {
        sourceScreen: 'quest_detail',
        questId: quest.id,
        timeframe: quest.timeframe,
        category: quest.categoryId,
        difficulty: quest.difficulty,
      }).catch(() => undefined);
      alertTwoChoice('Quest complete', 'Want to log a memory?', {
        cancel: { text: 'Not now' },
        confirm: {
          text: 'Log memory',
          onPress: () => {
            trackEvent('memory_creation_started', {
              sourceScreen: 'quest_detail_complete_prompt',
              questId: questIdForMemory,
            }).catch(() => undefined);
            router.push({
              pathname: '/memory/new',
              params: { questId: questIdForMemory },
            });
          },
        },
      });
    } catch (e: unknown) {
      logError('quest.detail.onComplete', e, { questId: quest.id, userQuestId: activeUq.id });
      alertCompat('Error', e instanceof Error ? e.message : 'Could not complete quest.');
    } finally {
      setActing(false);
    }
  }

  async function performDeactivate() {
    if (!activeUq || !quest || !user) return;
    if (!isSupabaseConfigured()) {
      alertCompat('Configuration', SUPABASE_CONFIGURE_HELP);
      return;
    }
    setActing(true);
    try {
      const r = await deactivateQuest(user.id, activeUq.id);
      if (!r.ok) {
        alertCompat(
          'Could not remove',
          r.reason === 'not_active'
            ? 'This quest is no longer active.'
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
        'Removed from active',
        'You can add this quest again or pick another one if you have room in this timeframe.'
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
    alertTwoChoice(
      'Remove this side quest?',
      'Progress for this run will be cleared. You can activate this quest again later if you have space.',
      {
        cancel: { text: 'Keep it' },
        confirm: {
          text: 'Remove',
          onPress: () => {
            void performDeactivate();
          },
        },
      }
    );
  }

  function requestComplete() {
    if (!activeUq || !quest || !user) return;
    const incomplete = incompleteJourneyStepsCount(activeUq, quest);
    if (incomplete > 0) {
      alertTwoChoice(
        'Some steps still unchecked',
        'You can still mark complete if you finished the quest your own way.',
        {
          cancel: { text: 'Go back' },
          confirm: {
            text: 'Mark complete anyway',
            onPress: () => {
              void performComplete();
            },
          },
        }
      );
      return;
    }
    void performComplete();
  }

  async function handleToggleStep(stepId: string) {
    if (!user || !activeUq) return;
    try {
      await toggleQuestStep(user.id, activeUq.id, stepId);
    } catch {
      alertCompat('Could not save', 'Your step change was reverted. Try again.');
    }
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
            {TF_LABEL[quest.timeframe]} · {quest.difficulty} · ~
            {quest.estimatedDurationMinutes} min
          </Text>
        </View>

        <QuestJourneyChecklist
          quest={quest}
          mode={activeUq ? 'active' : completedUq ? 'completed' : 'browse'}
          userQuest={activeUq ?? completedUq}
          accentColor={accent}
          onToggleStep={activeUq ? (stepId) => void handleToggleStep(stepId) : undefined}
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
            <PrimaryButton
              label="Mark as completed"
              loading={acting || pending}
              onPress={() => {
                requestComplete();
              }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remove from active side quests"
              onPress={requestDeactivate}
              disabled={acting || pending}
              style={({ pressed }) => [
                styles.deactivateBtn,
                (acting || pending) && styles.deactivateBtnDisabled,
                pressed && !(acting || pending) && styles.deactivateBtnPressed,
              ]}>
              <Text style={styles.deactivateBtnText}>Remove from active quests</Text>
            </Pressable>
          </>
        ) : completedUq && !activeUq ? (
          <View style={styles.doneBanner}>
            <Text style={styles.doneText}>Completed.</Text>
            <Pressable
              style={[styles.secondaryBtn, { backgroundColor: Theme.accentSoft }]}
              onPress={() =>
                router.push({
                  pathname: '/memory/new',
                  params: { questId: quest.id },
                })
              }>
              <Text style={[styles.secondaryBtnText, { color: accent }]}>
                Add a memory
              </Text>
            </Pressable>
          </View>
        ) : canAssign ? (
          <PrimaryButton
            label="Add to my quests"
            loading={acting || pending}
            onPress={() => {
              setAssignFeedback('Working on it...');
              void onAssign();
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
