import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmStepAction } from '@/components/quest-run/ConfirmStepAction';
import { CounterStepAction } from '@/components/quest-run/CounterStepAction';
import { InputStepAction } from '@/components/quest-run/InputStepAction';
import { PhotoStepAction } from '@/components/quest-run/PhotoStepAction';
import { stepKindIcon } from '@/components/quest-run/stepKindIcon';
import { TimerStepAction } from '@/components/quest-run/TimerStepAction';
import { HeaderBackButton } from '@/components/ui/HeaderBackButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Theme } from '@/constants/Theme';
import { alertCompat, alertTwoChoice } from '@/lib/alertCompat';
import { categoryAccentForCategoryId } from '@/lib/categoryAccent';
import { isSupabaseConfigured, SUPABASE_CONFIGURE_HELP } from '@/lib/supabase';
import { composeMemoryDraftFromRun, NO_EVIDENCE_NOTE } from '@/src/features/memories/memoryDraft';
import { useMemoryStore } from '@/src/features/memories/memoryStore';
import { scheduleQuestDay } from '@/src/features/notifications/questNotifications';
import {
  calendarEventStart,
  isDeviceCalendarCreationAvailable,
  openQuestCalendarEditor,
  suggestedQuestStart,
} from '@/src/features/quests/questCalendar';
import {
  markCalendarOpened,
  wasCalendarOpened,
} from '@/src/features/quests/questRunnerPending';
import { formatQuestDuration, QUEST_COPY } from '@/src/features/quests/questCopy';
import {
  countCompletedJourneySteps,
  getFirstIncompleteJourneyStep,
} from '@/src/features/quests/questHelpers';
import { useQuestDomainStore } from '@/src/features/quests/questStore';
import { trackEvent } from '@/src/lib/analytics';
import { logError } from '@/src/lib/monitoring/errorLogger';
import type {
  QuestActionStep,
  UserQuestStepEvidence,
} from '@/src/types/quest';
import { useSessionStore } from '@/stores/session';

function ordinalForStep(steps: QuestActionStep[], step: QuestActionStep): number {
  const i = steps.findIndex((s) => s.id === step.id);
  return i < 0 ? 0 : i;
}

/** One line describing what a completed step left behind. */
function evidenceSummaryLine(ev: UserQuestStepEvidence): string {
  switch (ev.kind) {
    case 'timer': {
      const min = Math.max(1, Math.round(ev.seconds / 60));
      return `${min} min on the clock`;
    }
    case 'text':
      return 'Answered in writing';
    case 'items':
      return `${ev.items.length} named: ${ev.items.join(', ')}`;
    case 'photo':
      return 'Photo captured';
    case 'calendar':
      return 'On your calendar';
    default:
      return 'Confirmed';
  }
}

export default function QuestRunScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const router = useRouter();
  const user = useSessionStore((s) => s.user);

  const loading = useQuestDomainStore((s) => s.loading);
  const pendingStore = useQuestDomainStore((s) => s.pending);
  const error = useQuestDomainStore((s) => s.error);
  const clearQuestError = useQuestDomainStore((s) => s.clearError);
  // The store's error belongs to whichever screen raised it. Arriving here
  // fresh must not inherit one — see R2-01 in docs/feedback/round-2-tasklist.md.
  useEffect(() => {
    clearQuestError();
  }, [clearQuestError]);
  const userQuests = useQuestDomainStore((s) => s.userQuests);
  const getQuestById = useQuestDomainStore((s) => s.getQuestById);
  const assignQuestToUser = useQuestDomainStore((s) => s.assignQuestToUser);
  const refreshUserQuests = useQuestDomainStore((s) => s.refreshUserQuests);
  const completeStepWithEvidence = useQuestDomainStore((s) => s.completeStepWithEvidence);
  const revertStep = useQuestDomainStore((s) => s.revertStep);
  const completeQuest = useQuestDomainStore((s) => s.completeQuest);
  const deactivateQuest = useQuestDomainStore((s) => s.deactivateQuest);
  const createMemoryForQuest = useMemoryStore((s) => s.createMemoryForQuest);

  const bootstrap = useQuestDomainStore((s) => s.bootstrap);
  const quests = useQuestDomainStore((s) => s.quests);
  const questsLoaded = quests.length > 0;

  // Deep links / web reloads land here before the tabs layout ever mounts —
  // bootstrap the catalog ourselves so a mid-run refresh resumes cleanly.
  useEffect(() => {
    if (user && !questsLoaded) void bootstrap(user.id);
  }, [user, questsLoaded, bootstrap]);

  // Depend on `quests` (not the stable getQuestById fn) so the lookup
  // re-runs once the catalog arrives after a deep-link bootstrap.
  const quest = useMemo(
    () => (id ? quests.find((q) => q.id === String(id)) : undefined),
    [id, quests]
  );
  const activeUq = useMemo(() => {
    if (!quest) return undefined;
    return userQuests.find((uq) => uq.questId === quest.id && uq.status === 'active');
  }, [quest, userQuests]);

  const accent = quest ? categoryAccentForCategoryId(quest.categoryId) : Theme.accent;
  const [acting, setActing] = useState(false);
  const [calendarDeviceOk, setCalendarDeviceOk] = useState<boolean>(() => Platform.OS !== 'web');
  // Tracks which step's Guide tip is expanded — collapsed by default (testers
  // found it noisy always-on), and keyed by step id so moving to a new step
  // doesn't carry over the previous step's expanded state.
  const [tipExpandedStepId, setTipExpandedStepId] = useState<string | null>(null);
  // Optional feelings note captured at the wrap-up moment itself (à la Garmin
  // Connect), folded into the auto-created memory rather than a separate step.
  const [feelingsNote, setFeelingsNote] = useState('');

  useEffect(() => {
    let alive = true;
    void isDeviceCalendarCreationAvailable().then((ok) => {
      if (alive) setCalendarDeviceOk(ok);
    });
    return () => {
      alive = false;
    };
  }, []);

  const currentStep = useMemo(() => {
    if (!quest || !activeUq) return null;
    return getFirstIncompleteJourneyStep(quest, activeUq);
  }, [quest, activeUq]);

  const journeySummary = useMemo(() => {
    if (!quest) return null;
    const total = quest.actionSteps.length;
    if (total === 0) return null;
    const done = activeUq ? countCompletedJourneySteps(activeUq, quest) : 0;
    const remaining = total - done;
    return { total, done, remaining };
  }, [quest, activeUq]);

  const leaveQuest = useCallback(async () => {
    if (!user || !quest || !activeUq) return;
    setActing(true);
    try {
      const r = await deactivateQuest(user.id, activeUq.id);
      if (!r.ok) {
        alertCompat('Could not update', 'Try again in a moment.');
        return;
      }
      await refreshUserQuests(user.id);
      trackEvent('quest_deactivated', {
        sourceScreen: 'quest_runner',
        questId: quest.id,
        timeframe: quest.timeframe,
        category: quest.categoryId,
      }).catch(() => undefined);
      // The Leave dialog promises "find it in Progress" (paused/liked live
      // there, not on the Journey catalog) — land where that's actually true.
      router.replace('/(tabs)/profile');
    } catch (e: unknown) {
      logError('quest.runner.leaveQuest', e, { questId: quest.id, userQuestId: activeUq.id });
      alertCompat('Error', e instanceof Error ? e.message : 'Could not leave this quest.');
    } finally {
      setActing(false);
    }
  }, [user, quest, activeUq, deactivateQuest, refreshUserQuests, router]);

  const confirmLeaveQuest = useCallback(() => {
    const hasProgress = (journeySummary?.done ?? 0) > 0;
    alertTwoChoice(
      'Leave this quest?',
      `It moves out of active motion; your progress stays saved — nothing is deleted. ${QUEST_COPY.leaveDestination(
        hasProgress
      )}`,
      {
        cancel: { text: 'Keep going' },
        confirm: {
          text: 'Leave quest',
          onPress: () => {
            void leaveQuest();
          },
        },
      }
    );
  }, [leaveQuest, journeySummary]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: quest ? quest.title : 'Run quest',
      // Back and Leave are different promises and the runner only had the
      // second: with no screen behind it, the one control in the header
      // abandoned the quest. Back steps out without touching it — falling back
      // to the quest's own page, since that is what "one step back" means here.
      headerLeft: () => (
        <HeaderBackButton fallback={quest ? `/quest/${quest.id}` : '/(tabs)/journey'} />
      ),
      headerRight: activeUq
        ? () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Leave this quest"
              hitSlop={10}
              disabled={acting || pendingStore}
              onPress={confirmLeaveQuest}
              style={({ pressed }) => [
                styles.headerLeaveBtn,
                pressed && styles.linkPressed,
                (acting || pendingStore) && { opacity: 0.5 },
              ]}>
              <Text style={styles.headerLeaveBtnText}>Leave</Text>
            </Pressable>
          )
        : undefined,
    });
  }, [navigation, quest, activeUq, acting, pendingStore, confirmLeaveQuest]);

  async function beginIfNeeded() {
    if (!quest || !user) return;
    if (!isSupabaseConfigured()) {
      alertCompat('Configuration', SUPABASE_CONFIGURE_HELP);
      return;
    }
    if (activeUq) return;
    setActing(true);
    try {
      const r = await assignQuestToUser(user.id, quest.id);
      if (!r.ok) {
        alertCompat(
          'Cannot begin',
          r.reason === 'active_path_full'
            ? 'You already have three quests going. Pause one of them, then try again.'
            : 'Could not begin quest.'
        );
        return;
      }
      await refreshUserQuests(user.id);
    } finally {
      setActing(false);
    }
  }

  const finishStep = useCallback(
    async (stepId: string, evidence: UserQuestStepEvidence) => {
      if (!user || !activeUq) return;
      setActing(true);
      try {
        await completeStepWithEvidence(user.id, activeUq.id, stepId, evidence, {
          sourceScreen: 'quest_runner',
        });
      } catch {
        // Error surfaces via ErrorState when persistence fails.
      } finally {
        setActing(false);
      }
    },
    [user, activeUq, completeStepWithEvidence]
  );

  async function wrapUpQuest() {
    if (!activeUq || !quest || !user) return;
    if (!isSupabaseConfigured()) {
      alertCompat('Configuration', SUPABASE_CONFIGURE_HELP);
      return;
    }
    setActing(true);
    try {
      // Compose the memory from the freshest progress before completion.
      const latestUq =
        useQuestDomainStore
          .getState()
          .userQuests.find((u) => u.id === activeUq.id) ?? activeUq;
      const draft = composeMemoryDraftFromRun(quest, latestUq);
      const feelings = feelingsNote.trim();
      const memoryBody = feelings
        ? draft.body === NO_EVIDENCE_NOTE
          ? feelings
          : `${draft.body}\n\nHow it felt: ${feelings}`
        : draft.body;

      const r = await completeQuest(user.id, activeUq.id);
      if (!r.ok) {
        alertCompat('Error', 'Could not complete quest.');
        return;
      }
      await refreshUserQuests(user.id);
      trackEvent('quest_completed', {
        sourceScreen: 'quest_runner',
        questId: quest.id,
        timeframe: quest.timeframe,
        category: quest.categoryId,
        difficulty: quest.difficulty,
      }).catch(() => undefined);

      // The quest is complete either way — a memory-save hiccup shouldn't
      // read as a failed completion, so it gets its own try/catch.
      let memoryId: string | null = null;
      let memoryPhotoFailed = false;
      try {
        const memory = await createMemoryForQuest(user.id, {
          questId: quest.id,
          title: draft.title,
          body: memoryBody,
          photoUri: draft.photoUri,
        });
        memoryId = memory.id;
        memoryPhotoFailed = Boolean(memory.photoFailed);
        trackEvent('memory_created', {
          sourceScreen: 'quest_runner_auto',
          memoryId: memory.id,
          questId: quest.id,
          hasPhoto: Boolean(draft.photoUri),
        }).catch(() => undefined);
      } catch (memoryError: unknown) {
        logError('quest.runner.autoMemory', memoryError, { questId: quest.id });
      }

      // Completed quests show up in Progress (the completed-quests showcase),
      // not the plain Journey catalog — land where the result is visible.
      router.replace('/(tabs)/profile');
      if (memoryId) {
        alertTwoChoice(
          'Nice work — quest complete',
          memoryPhotoFailed
            ? "Saved to your memories — but the photo didn't upload. You can add it again from the memory."
            : 'Saved to your memories.',
          {
            cancel: { text: 'OK' },
            confirm: {
              text: 'View memory',
              onPress: () =>
                router.push({
                  pathname: '/memory/[id]',
                  params: {
                    id: memoryId as string,
                    justSaved: '1',
                    // No real evidence was captured during the run — open
                    // straight into editing instead of a view-only screen with
                    // nothing personal in it, so adding a note takes no extra tap.
                    ...(memoryBody === NO_EVIDENCE_NOTE ? { autoEdit: '1' } : {}),
                  },
                }),
            },
          }
        );
      } else {
        // Completion always succeeds even if the auto-memory save failed —
        // but that failure must stay visible, or it looks like memories
        // silently vanish (reported by testers as "memories don't propagate").
        alertTwoChoice(
          'Quest complete',
          "Nice work — this one is done. We couldn't save a memory for it automatically.",
          {
            cancel: { text: 'OK' },
            confirm: {
              text: 'Add a memory',
              onPress: () =>
                router.push({ pathname: '/memory/new', params: { questId: quest.id } }),
            },
          }
        );
      }
    } catch (e: unknown) {
      logError('quest.runner.wrapUpQuest', e, { questId: quest.id, userQuestId: activeUq.id });
      alertCompat('Error', e instanceof Error ? e.message : 'Could not complete quest.');
    } finally {
      setActing(false);
    }
  }

  async function addCalendarReminder(step: QuestActionStep) {
    if (!user || !quest || !activeUq) return;
    const tpl = step.action?.kind === 'calendar' ? step.action.template : undefined;
    const duration =
      tpl?.durationMinutes ?? step.estimateMinutes ?? quest.estimatedDurationMinutes ?? 30;
    const title = (tpl?.title ?? `${quest.title}: ${step.title}`).trim();
    const notes = [tpl?.notes, step.detail].filter(Boolean).join('\n\n').trim() || undefined;

    const suggestedStart = suggestedQuestStart(quest.timeframe);
    setActing(true);
    try {
      await markCalendarOpened(activeUq.id, step.id);
      const result = await openQuestCalendarEditor({
        title,
        notes,
        durationMinutes: duration,
        suggestedStart,
      });
      if (result.outcome === 'saved') {
        // iOS tells us it was saved and gives the id — no need to ask.
        await finishStep(step.id, { kind: 'calendar', eventId: result.eventId });
        remindOnQuestDay((await calendarEventStart(result.eventId)) ?? suggestedStart);
      } else if (result.outcome === 'unknown') {
        // Android closes the editor without saying whether you saved — so ask,
        // rather than guess either way.
        askIfScheduled(step);
      }
      // 'canceled': they backed out; leave the step as it was.
    } catch (e: unknown) {
      logError('quest.runner.calendarEditor', e, { questId: quest.id, stepId: step.id });
      // No calendar app, or permission refused on iOS: the step still has to
      // be passable, so fall back to adding it by hand.
      askIfScheduled(step, "We couldn't open your calendar. Add it yourself, then confirm here.");
    } finally {
      setActing(false);
    }
  }

  /**
   * The quest-day notification. Android never says which day you picked, so it uses the time the
   * editor was prefilled with; iOS reads the saved event. Your calendar reminds you as well.
   */
  function remindOnQuestDay(at: Date) {
    if (!quest || !activeUq) return;
    void scheduleQuestDay({
      userQuestId: activeUq.id,
      questId: quest.id,
      questTitle: quest.title,
      at,
    });
  }

  function confirmScheduled(step: QuestActionStep) {
    if (!quest) return;
    void finishStep(step.id, { kind: 'self_attest' });
    remindOnQuestDay(suggestedQuestStart(quest.timeframe));
  }

  function askIfScheduled(step: QuestActionStep, message?: string, openAgain?: () => void) {
    alertTwoChoice(
      'Is it in your calendar?',
      message ?? 'Once it has a day, this step is done.',
      {
        cancel: openAgain
          ? { text: 'Open calendar again', onPress: openAgain }
          : { text: 'Not yet' },
        confirm: {
          text: "Yes, it's in",
          onPress: () => confirmScheduled(step),
        },
      }
    );
  }

  function handleCalendarStep(step: QuestActionStep) {
    if (!user || !quest || !activeUq || acting || pendingStore) return;
    void (async () => {
      const nativeCalendar = await isDeviceCalendarCreationAvailable();
      if (nativeCalendar) {
        // Second tap: the calendar was already opened for this step, so offer to move on rather
        // than sending you back into it.
        if (await wasCalendarOpened(activeUq.id, step.id)) {
          askIfScheduled(step, undefined, () => void addCalendarReminder(step));
          return;
        }
        await addCalendarReminder(step);
        return;
      }
      alertTwoChoice(
        'Schedule this step',
        Platform.OS === 'web'
          ? 'On phone we can add a dated reminder for you. On web, add it to your own calendar, then tap to confirm.'
          : 'We can\'t add a calendar event on this device. Add it yourself, then tap to confirm.',
        {
          cancel: { text: 'Not yet' },
          confirm: {
            text: 'I scheduled it',
            onPress: () => {
              void finishStep(step.id, { kind: 'self_attest' });
            },
          },
        }
      );
    })();
  }

  if (!id) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <EmptyState
          title="Quest link is incomplete"
          message="The quest id is missing."
          actionLabel="Go back"
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  if ((loading || !questsLoaded) && !quest) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <LoadingState label="Loading quest..." />
      </SafeAreaView>
    );
  }

  if (!quest) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <EmptyState
          title="Quest not found"
          message="This quest may be inactive or no longer available."
          actionLabel="Browse quests"
          onAction={() => router.replace('/quest/select')}
        />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <EmptyState
          title="Sign in required"
          message="Please sign in to run quests."
          actionLabel="Go to sign in"
          onAction={() => router.replace('/(auth)/sign-in')}
        />
      </SafeAreaView>
    );
  }

  const needsBegin = !activeUq;
  const steps = quest.actionSteps;
  const total = Math.max(1, steps.length);
  const currentIndex = currentStep ? ordinalForStep(steps, currentStep) : -1;
  const stepOrdinal = currentStep ? currentIndex + 1 : total;
  const primaryBusy = acting || pendingStore;
  const canStepBack = currentIndex > 0;

  async function stepBack() {
    if (!user || !activeUq || currentIndex <= 0 || primaryBusy) return;
    const prevStep = steps[currentIndex - 1];
    if (!prevStep) return;
    setActing(true);
    try {
      await revertStep(user.id, activeUq.id, prevStep.id);
    } catch {
      // Store ErrorState reflects persistence errors.
    } finally {
      setActing(false);
    }
  }

  function renderInteraction(step: QuestActionStep) {
    if (!activeUq) return null;

    if (step.action?.kind === 'calendar') {
      return (
        <View key={step.id} style={styles.calendarBlock}>
          <PrimaryButton
            label={calendarDeviceOk ? 'Add to calendar' : "Let's schedule it"}
            loading={primaryBusy}
            onPress={() => handleCalendarStep(step)}
          />
        </View>
      );
    }

    // Every branch below is keyed by step.id — without it, React reuses the
    // same component instance whenever two consecutive steps share an
    // interaction kind (e.g. two "input" steps in a row), leaking the
    // previous step's local state (typed text, timer start, counter count)
    // into the next one instead of resetting it. Reported by a tester as
    // "moves to step 2 but the same screen with the same text stays".
    const interaction = step.interaction ?? { kind: 'confirm' as const };
    switch (interaction.kind) {
      case 'timer':
        return (
          <TimerStepAction
            key={step.id}
            userQuestId={activeUq.id}
            questId={activeUq.questId}
            stepId={step.id}
            stepTitle={step.title}
            minSeconds={interaction.minSeconds}
            runningHint={interaction.runningHint}
            accent={accent}
            busy={primaryBusy}
            onComplete={(ev) => void finishStep(step.id, ev)}
          />
        );
      case 'input':
        return (
          <InputStepAction
            key={step.id}
            prompt={interaction.prompt}
            minChars={interaction.minChars}
            placeholder={interaction.placeholder}
            busy={primaryBusy}
            onComplete={(ev) => void finishStep(step.id, ev)}
          />
        );
      case 'counter':
        return (
          <CounterStepAction
            key={step.id}
            prompt={interaction.prompt}
            count={interaction.count}
            itemLabel={interaction.itemLabel}
            accent={accent}
            busy={primaryBusy}
            onComplete={(ev) => void finishStep(step.id, ev)}
          />
        );
      case 'photo':
        return (
          <PhotoStepAction
            key={step.id}
            prompt={interaction.prompt}
            busy={primaryBusy}
            onComplete={(ev) => void finishStep(step.id, ev)}
          />
        );
      default:
        return (
          <ConfirmStepAction
            key={step.id}
            busy={primaryBusy}
            onComplete={(ev) => void finishStep(step.id, ev)}
          />
        );
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {error ? (
          <ErrorState message={error} onRetry={() => refreshUserQuests(user.id)} />
        ) : null}

        {needsBegin ? (
          <>
            <View style={[styles.header, { borderLeftColor: accent }]}>
              <Text style={styles.kicker}>Guided quest</Text>
              <Text style={styles.title}>{quest.title}</Text>
              {quest.journeyIntro ? <Text style={styles.sub}>{quest.journeyIntro}</Text> : null}
            </View>

            {steps.length > 0 ? (
              <View style={[styles.stepsOverview, { borderColor: Theme.border }]}>
                <Text style={styles.stepsOverviewTitle}>Your journey — {steps.length} steps</Text>
                {steps.map((s, i) => (
                  <View key={s.id} style={styles.stepOverviewRow}>
                    <Ionicons name={stepKindIcon(s)} size={18} color={accent} />
                    <View style={styles.stepOverviewBody}>
                      <Text style={styles.stepOverviewRowTitle} numberOfLines={2}>
                        {i + 1}. {s.title}
                      </Text>
                    </View>
                  </View>
                ))}
                <Text style={styles.preBeginNoteText}>
                  The app walks you through each step for real — timers run their course, answers
                  are written, photos are taken. No skipping ahead.
                </Text>
              </View>
            ) : null}

            <PrimaryButton
              label="Begin the journey"
              loading={primaryBusy}
              onPress={() => void beginIfNeeded()}
            />
          </>
        ) : currentStep ? (
          <>
            <View style={styles.progressHeader}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>
                  Step {stepOrdinal} of {total}
                </Text>
                {canStepBack ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Go back to the previous step"
                    disabled={primaryBusy}
                    onPress={() => void stepBack()}
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.stepBackLink,
                      primaryBusy && { opacity: 0.4 },
                      pressed && !primaryBusy && styles.linkPressed,
                    ]}>
                    <Ionicons name="arrow-back" size={14} color={Theme.textMuted} />
                    <Text style={styles.stepBackText}>Back a step</Text>
                  </Pressable>
                ) : null}
              </View>
              <View style={styles.segmentsRow}>
                {steps.map((s) => {
                  const done = Boolean(activeUq?.stepProgress[s.id]);
                  const isCurrent = currentStep.id === s.id;
                  return (
                    <View
                      key={s.id}
                      style={[
                        styles.segment,
                        done && { backgroundColor: accent },
                        isCurrent && { backgroundColor: `${accent}66` },
                      ]}
                    />
                  );
                })}
              </View>
            </View>

            <View style={[styles.stepCard, { borderColor: Theme.border }]}>
              <View style={styles.stepHeadRow}>
                <Ionicons name={stepKindIcon(currentStep)} size={20} color={accent} />
                <Text style={[styles.stepIndex, { color: accent }]}>
                  {currentStep.estimateMinutes
                    ? `~${formatQuestDuration(currentStep.estimateMinutes)}`
                    : 'Take your time'}
                </Text>
              </View>
              <Text style={styles.stepTitle}>{currentStep.title}</Text>
              {currentStep.detail ? (
                <Text style={styles.stepDetail}>{currentStep.detail}</Text>
              ) : null}

              {/*
               * R2-10: "quest structure has too much text". Every step used to
               * show a Guide row, even the ~40% (68/157, measured 2026-09-26)
               * with no real per-step tip authored — mergeCatalogStepTips filled
               * those in with a generic one-liner (removed) that
               * says nothing about that specific step. That is the layer this
               * cuts: a whole UI block (label + chevron + tap target) appearing
               * for a sentence with no information in it. The 89 steps with a
               * real, specific tip are untouched — this is not content loss,
               * it is not showing a block that had nothing to show.
               */}
              {currentStep.tip ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    tipExpandedStepId === currentStep.id ? 'Hide guide' : 'Show guide'
                  }
                  onPress={() =>
                    setTipExpandedStepId((prev) =>
                      prev === currentStep.id ? null : currentStep.id
                    )
                  }
                  style={[styles.stepTipBlock, { borderLeftColor: `${accent}55` }]}>
                  <View style={styles.stepTipHeadRow}>
                    <Text style={styles.stepTipLabel}>Guide</Text>
                    <Ionicons
                      name={tipExpandedStepId === currentStep.id ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color={Theme.textMuted}
                    />
                  </View>
                  {tipExpandedStepId === currentStep.id ? (
                    <Text style={styles.stepTipText}>{currentStep.tip}</Text>
                  ) : null}
                </Pressable>
              ) : null}

              {renderInteraction(currentStep)}
            </View>
          </>
        ) : (
          <View style={styles.doneCard}>
            <View style={[styles.doneBadge, { backgroundColor: accent }]}>
              <Ionicons name="trophy" size={26} color="#fff" />
            </View>
            <Text style={styles.doneTitle}>Every step is done</Text>
            <Text style={styles.doneBody}>Here is what you gathered along the way:</Text>

            <View style={styles.evidenceList}>
              {steps.map((s) => {
                const entry = activeUq?.stepProgress[s.id];
                if (!entry) return null;
                return (
                  <View key={s.id} style={styles.evidenceRow}>
                    <Ionicons name={stepKindIcon(s)} size={16} color={accent} />
                    <View style={styles.evidenceBody}>
                      <Text style={styles.evidenceTitle} numberOfLines={1}>
                        {s.title}
                      </Text>
                      <Text style={styles.evidenceLine} numberOfLines={2}>
                        {evidenceSummaryLine(entry.evidence)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.feelingsBlock}>
              <Text style={styles.feelingsLabel}>How did that feel? (optional)</Text>
              <TextInput
                value={feelingsNote}
                onChangeText={setFeelingsNote}
                placeholder="Energized, tired, proud, meh — whatever's true."
                placeholderTextColor={Theme.textMuted}
                multiline
                style={styles.feelingsInput}
              />
            </View>

            <PrimaryButton
              label="Complete quest"
              loading={primaryBusy}
              onPress={() => void wrapUpQuest()}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Not yet — keep this quest active without completing it"
              disabled={primaryBusy}
              // The quest stays active here — Journey is just the plain
              // catalog now, with no trace of it. The quest's own detail page
              // always shows "Continue quest" for whatever is still active.
              onPress={() => router.replace(`/quest/${quest.id}`)}
              style={({ pressed }) => [
                styles.doneBackLink,
                primaryBusy && { opacity: 0.45 },
                pressed && !primaryBusy && { opacity: 0.75 },
              ]}>
              <Text style={styles.doneBackLinkText}>Not yet — keep this active</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.bg },
  scroll: { padding: 20, paddingBottom: 40, gap: 16 },
  headerLeaveBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  headerLeaveBtnText: { color: Theme.danger, fontSize: 15, fontFamily: 'Inter_600SemiBold', fontWeight: '600' },
  linkPressed: { opacity: 0.75 },
  header: {
    backgroundColor: Theme.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.border,
    borderLeftWidth: 4,
    padding: 16,
  },
  kicker: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.text, marginBottom: 8 },
  sub: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20, color: Theme.textMuted },
  stepsOverview: {
    backgroundColor: Theme.surface,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  stepsOverviewTitle: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  stepOverviewRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stepOverviewBody: { flex: 1, minWidth: 0 },
  stepOverviewRowTitle: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 21, color: Theme.text },
  preBeginNoteText: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19, color: Theme.textMuted, marginTop: 4 },
  progressHeader: { gap: 8 },
  progressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  stepBackLink: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2 },
  stepBackText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: Theme.textMuted },
  segmentsRow: { flexDirection: 'row', gap: 6 },
  segment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.border,
  },
  stepCard: {
    backgroundColor: Theme.surface,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 4,
  },
  stepHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stepIndex: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  stepTitle: { fontSize: 19, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.text, marginBottom: 6 },
  stepDetail: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20, color: Theme.textMuted, marginBottom: 10 },
  stepTipBlock: {
    marginBottom: 16,
    paddingLeft: 12,
    borderLeftWidth: 3,
    gap: 4,
  },
  stepTipHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepTipLabel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Theme.textMuted,
  },
  stepTipText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 21,
    color: Theme.textMuted,
    fontStyle: 'italic',
  },
  calendarBlock: { gap: 4 },
  doneCard: {
    backgroundColor: Theme.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: 18,
    gap: 12,
  },
  doneBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  doneTitle: { fontSize: 19, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.text, textAlign: 'center' },
  doneBody: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20, color: Theme.textMuted, textAlign: 'center' },
  evidenceList: { gap: 10, marginVertical: 4 },
  evidenceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: Theme.bg,
  },
  evidenceBody: { flex: 1, minWidth: 0 },
  evidenceTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.text },
  evidenceLine: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18, color: Theme.textMuted, marginTop: 2 },
  feelingsBlock: { gap: 6, marginTop: 4 },
  feelingsLabel: { fontSize: 13, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.text },
  feelingsInput: {
    minHeight: 60,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    color: Theme.text,
    backgroundColor: Theme.bg,
    textAlignVertical: 'top',
  },
  doneBackLink: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  doneBackLinkText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: Theme.accent },
});
