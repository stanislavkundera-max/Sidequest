import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QuestJourneyChecklist } from '@/components/quests/QuestJourneyChecklist';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { OptionSheet } from '@/components/ui/OptionSheet';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Theme } from '@/constants/Theme';
import { alertCompat, alertTwoChoice } from '@/lib/alertCompat';
import { categoryAccentForCategoryId } from '@/lib/categoryAccent';
import { isSupabaseConfigured, SUPABASE_CONFIGURE_HELP } from '@/lib/supabase';
import { QuestFeedbackCard } from '@/src/features/feedback/QuestFeedbackCard';
import { useMemoryStore } from '@/src/features/memories/memoryStore';
import { questDurationLabel, QUEST_COPY, TIMEFRAME_LABEL } from '@/src/features/quests/questCopy';
import {
  canUserBeginQuest,
  countCompletedJourneySteps,
  incompleteJourneyStepsCount,
} from '@/src/features/quests/questHelpers';
import { useQuestDomainStore } from '@/src/features/quests/questStore';
import { markQuestSeen } from '@/src/features/quests/seenQuests';
import { currentlyDismissedQuestIds } from '@/src/features/quests/suggestedQuests';
import { useUnavailableQuestStore } from '@/src/features/quests/unavailableQuests';
import { trackEvent } from '@/src/lib/analytics';
import { logError } from '@/src/lib/monitoring/errorLogger';
import { useSessionStore } from '@/stores/session';

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
  const clearQuestError = useQuestDomainStore((s) => s.clearError);
  // See R2-01: a stale error from another screen must not greet you here.
  useEffect(() => {
    clearQuestError();
  }, [clearQuestError]);
  const userQuests = useQuestDomainStore((s) => s.userQuests);
  const getQuestById = useQuestDomainStore((s) => s.getQuestById);
  const refreshUserQuests = useQuestDomainStore((s) => s.refreshUserQuests);
  const assignQuestToUser = useQuestDomainStore((s) => s.assignQuestToUser);
  const deactivateQuest = useQuestDomainStore((s) => s.deactivateQuest);
  const dismissSuggestedQuest = useQuestDomainStore((s) => s.dismissSuggestedQuest);
  const bootstrap = useQuestDomainStore((s) => s.bootstrap);
  const memories = useMemoryStore((s) => s.memories);

  // Deep links / web reloads land here before the tabs layout ever mounts, and
  // the catalog only loads there — so a shared quest link, or a refresh on this
  // screen, rendered "Quest not found" for a quest that exists. Same fix the
  // runner already carries.
  useEffect(() => {
    if (user && quests.length === 0) void bootstrap(user.id);
  }, [user, quests.length, bootstrap]);

  // Depend on `quests`, not on the stable `getQuestById` reference. That
  // reference never changes, so this memo never re-ran once the catalog
  // arrived — and since the catalog loads after the first render on any cold
  // entry to this screen, the lookup stayed undefined and the screen showed
  // "Quest not found" for a quest that exists, permanently. The runner screen
  // already carries the same note.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const quest = useMemo(() => (id ? getQuestById(String(id)) : undefined), [id, quests]);

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

  // "Not for me" only makes sense on a plain offer — not on something you are
  // doing, have liked, have done, or already turned down (R2-24).
  const canTurnDown = useMemo(() => {
    if (!quest || activeUq || completedUq) return false;
    const engaged = userQuests.some(
      (uq) =>
        uq.questId === quest.id && (uq.status === 'saved_for_later' || uq.status === 'chosen')
    );
    return !engaged && !currentlyDismissedQuestIds(userQuests).has(quest.id);
  }, [quest, activeUq, completedUq, userQuests]);

  const [acting, setActing] = useState(false);
  const [assignFeedback, setAssignFeedback] = useState<string | null>(null);
  const autoActivateHandledRef = useRef(false);

  useEffect(() => {
    autoActivateHandledRef.current = false;
  }, [id]);

  useLayoutEffect(() => {
    navigation.setOptions({
      // Empty on purpose: the title is the big heading right below, and showing it
      // twice — truncated in the bar, whole underneath — was just more text.
      title: '',
      // headerLeft comes from the Stack's screenOptions — see HeaderBackButton.
    });
  }, [navigation, quest?.title]);

  // Opening the detail screen is what "seen" means, so the NEW badge clears on
  // the way in rather than on the way back.
  useEffect(() => {
    if (!quest) return;
    void markQuestSeen(quest.id);
  }, [quest?.id]);

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
              ? 'You are already doing this quest.'
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
      setAssignFeedback('Added. Getting your quests…');
      trackEvent('quest_activated', {
        sourceScreen: 'quest_detail',
        questId: quest.id,
        timeframe: quest.timeframe,
        category: quest.categoryId,
        difficulty: quest.difficulty,
      }).catch(() => undefined);
      await refreshUserQuests(user.id);
      setAssignFeedback('You are doing this quest now. Open it when you are ready for the first step.');
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
            ? 'You are no longer doing this quest.'
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
        `It is paused for now. Your steps stay as you left them. ${QUEST_COPY.leaveDestination(
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

  // "Not for me" opens two ways out (R2-24, R2-27). They are different things:
  //  - not my thing  -> comes back once you have done everything else in the
  //    category (Standa's rule; nothing is ever lost, it just goes last),
  //  - can't do it here -> never comes back. No station, no river, no climbing
  //    gym within reach is dead content, not a preference. Stored on the device.
  // The two labels say all of this, so there is no explanatory paragraph.
  const [turnDownOpen, setTurnDownOpen] = useState(false);
  const markUnavailable = useUnavailableQuestStore((s) => s.markUnavailable);

  function requestTurnDown() {
    if (!quest || !user) return;
    setTurnDownOpen(true);
  }

  async function handleTurnDown(choice: 'not_mine' | 'not_here') {
    if (!quest || !user) return;
    setActing(true);
    try {
      if (choice === 'not_here') {
        await markUnavailable(quest.id);
        trackEvent('quest_unavailable_here', {
          sourceScreen: 'quest_detail',
          questId: quest.id,
          category: quest.categoryId,
        }).catch(() => undefined);
      } else {
        const r = await dismissSuggestedQuest(user.id, quest.id);
        if (!r.ok) {
          alertCompat('Could not update', 'Try again in a moment.');
          return;
        }
        trackEvent('quest_dismissed', {
          sourceScreen: 'quest_detail',
          questId: quest.id,
          category: quest.categoryId,
        }).catch(() => undefined);
      }
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)/journey');
    } catch {
      // The store's ErrorState shows what went wrong.
    } finally {
      setActing(false);
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
  const incompleteStepCount =
    activeUq && quest.actionSteps.length > 0
      ? incompleteJourneyStepsCount(activeUq, quest)
      : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.badge, { backgroundColor: Theme.accentSoft }]}>
          <Text style={[styles.badgeText, { color: accent }]}>
            {TIMEFRAME_LABEL[quest.timeframe]}
          </Text>
        </View>
        <Text style={styles.category}>{categoryName(quest.categoryId)}</Text>
        <Text style={styles.title}>{quest.title}</Text>
        <Text style={styles.shortDescription}>{quest.shortDescription}</Text>
        <Text style={styles.body}>{quest.fullDescription}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            {[
              // Difficulty (easy / medium / hard) is what the app uses to rank quests, not
              // something a reader can act on: "medium" says nothing without the rules behind
              // it, and the cards never showed it. Only the time is left (2026-09-26).
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

        {/* The reflection question is for the end of the quest; before you start it is a
            spoiler and one more block of text on a page meant to sell the quest. */}
        {!existingMemory && (activeUq || completedUq) ? (
          <View style={[styles.reflection, { borderLeftColor: accent }]}>
            <Text style={styles.reflectionLabel}>Reflection</Text>
            <Text style={styles.reflectionBody}>{quest.promptForReflection}</Text>
          </View>
        ) : null}

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
              accessibilityLabel="Let this quest wait; find it under Progress Liked"
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
              {/* Per-level limits were retired (see questHelpers.ts); the real reasons are these two. */}
              Not open to you right now — either you already have three quests going, or this one is
              still waiting behind others in {categoryName(quest.categoryId)}.
            </Text>
          </View>
        )}
        <OptionSheet
          visible={turnDownOpen}
          title="Not for you?"
          options={[
            { value: 'not_mine', label: "Not my thing — maybe later" },
            { value: 'not_here', label: "Can't do this where I live — hide it" },
          ]}
          onSelect={(v) => void handleTurnDown(v)}
          onClose={() => setTurnDownOpen(false)}
        />
        {canTurnDown ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Not for me — stop offering this quest for now"
            onPress={requestTurnDown}
            disabled={acting || pending}
            style={({ pressed }) => [
              styles.turnDownBtn,
              (acting || pending) && styles.deactivateBtnDisabled,
              pressed && !(acting || pending) && styles.deactivateBtnPressed,
            ]}>
            <Text style={styles.turnDownBtnText}>Not for me</Text>
          </Pressable>
        ) : null}
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
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  category: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Theme.textMuted,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Theme.text,
    marginBottom: 12,
    lineHeight: 32,
  },
  body: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    lineHeight: 25,
    color: Theme.text,
    marginBottom: 12,
  },
  shortDescription: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    lineHeight: 24,
    color: Theme.textMuted,
    marginBottom: 12,
  },
  metaRow: { marginBottom: 20 },
  meta: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Theme.textMuted },
  reflection: {
    borderLeftWidth: 4,
    paddingLeft: 14,
    marginBottom: 28,
  },
  reflectionLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Theme.textMuted,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  reflectionBody: { fontSize: 16, fontFamily: 'Inter_400Regular', lineHeight: 24, color: Theme.text },
  runnerHint: {
    marginBottom: 14,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 21,
    color: Theme.textMuted,
  },
  assignFeedback: {
    marginBottom: 14,
    color: Theme.accent,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
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
  doneText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Theme.text },
  secondaryBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  secondaryBtnText: { fontWeight: '600', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
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
  // Quieter than "let it wait": no border, just text, so it doesn't compete with Begin.
  turnDownBtn: {
    marginTop: 8,
    minHeight: 44,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  turnDownBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Theme.textMuted,
  },
  deactivateBtnPressed: { opacity: 0.88 },
  deactivateBtnDisabled: { opacity: 0.55 },
  deactivateBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Theme.textMuted,
  },
});
