import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QuestJourneyChecklist } from '@/components/quests/QuestJourneyChecklist';
import { CategoryTag, categoryKeyForId } from '@/components/ui/CategoryTag';
import { DawnBackground, gradientStyle } from '@/components/ui/DawnBackground';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { OptionSheet } from '@/components/ui/OptionSheet';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SubtleButton } from '@/components/ui/SubtleButton';
import { Dawn, Theme } from '@/constants/Theme';
import { alertCompat, alertTwoChoice } from '@/lib/alertCompat';
import { categoryAccentForCategoryId } from '@/lib/categoryAccent';
import { isSupabaseConfigured, SUPABASE_CONFIGURE_HELP } from '@/lib/supabase';
import { plainErrorMessage } from '@/lib/userFacingError';
import { QuestFeedbackCard } from '@/src/features/feedback/QuestFeedbackCard';
import { useMemoryStore } from '@/src/features/memories/memoryStore';
import {
  CATEGORY_PROMISE,
  questDurationWords,
  QUEST_COPY,
  TIMEFRAME_LABEL,
} from '@/src/features/quests/questCopy';
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

/** The sunrise over the hills (canvas screens 19–21): the quest page's hero. */
const HERO = require('@/assets/images/dawn/journey-header.png');
const HERO_ASPECT = 224 / 390;
const CREAM_CARD = `linear-gradient(110deg, ${Dawn.cream} 0%, ${Dawn.cream} 55%, #f3c99a 85%, ${Dawn.creamEnd} 100%)`;

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

  const { width } = useWindowDimensions();
  // Which stone this quest was, counting every quest finished, oldest first.
  const stoneNumber = useMemo(() => {
    if (!completedUq) return null;
    const done = userQuests
      .filter((uq) => uq.status === 'completed')
      .sort((a, b) => (a.completedAt ?? '').localeCompare(b.completedAt ?? ''));
    const at = done.findIndex((uq) => uq.id === completedUq.id);
    return at >= 0 ? at + 1 : null;
  }, [completedUq, userQuests]);

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
      // Dawn: the header floats over the sunrise hero; the round back button carries itself.
      headerTransparent: true,
      headerStyle: { backgroundColor: 'transparent' },
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
      const r = await assignQuestToUser(user.id, quest.id, { sourceScreen: 'quest_detail' });
      if (!r.ok) {
        const reasonMessage =
          r.reason === 'active_path_full'
            ? QUEST_COPY.activePathFullBody
            : r.reason === 'already_active'
              ? 'You are already doing this quest.'
              : 'Quest not found.';
        setAssignFeedback(reasonMessage);
        alertCompat('Not open right now', reasonMessage);
        return false;
      }
      setAssignFeedback('Added. Getting your quests…');
      await refreshUserQuests(user.id);
      setAssignFeedback('You are doing this quest now. Open it when you are ready for the first step.');
      return true;
    } catch (e: unknown) {
      logError('quest.detail.onAssign', e, { questId: quest.id });
      const message = plainErrorMessage(e, "Couldn't start this quest. Try again in a moment.");
      setAssignFeedback(message);
      alertCompat("That didn't go through", message);
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
    setActing(true);
    try {
      const r = await deactivateQuest(user.id, activeUq.id, { sourceScreen: 'quest_detail' });
      if (!r.ok) {
        alertCompat(
          "That didn't go through",
          r.reason === 'not_active'
            ? 'You are no longer doing this quest.'
            : 'Quest not found.'
        );
        return;
      }
      await refreshUserQuests(user.id);
      setAssignFeedback(null);
      alertCompat(
        'Set aside for now',
        r.released
          ? QUEST_COPY.releaseDestination
          : `It is paused for now. Your steps stay as you left them. ${QUEST_COPY.leaveDestination}`
      );
    } catch (e: unknown) {
      logError('quest.detail.onDeactivate', e, {
        questId: quest.id,
        userQuestId: activeUq.id,
      });
      alertCompat("That didn't go through", plainErrorMessage(e, "Couldn't remove this quest. Try again in a moment."));
    } finally {
      setActing(false);
    }
  }

  function requestDeactivate() {
    if (!activeUq || !quest || !user) return;
    const started = countCompletedJourneySteps(activeUq, quest) > 0;
    alertTwoChoice(
      'Let this quest wait?',
      started
        ? `It moves out of active motion; your progress stays saved — nothing is deleted. ${QUEST_COPY.leaveDestination}`
        : QUEST_COPY.releaseDestination,
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
        const r = await dismissSuggestedQuest(user.id, quest.id, { sourceScreen: 'quest_detail' });
        if (!r.ok) {
          alertCompat("That didn't go through", 'Nothing changed. Try again in a moment.');
          return;
        }
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
            onAction={() => router.replace('/(tabs)/journey')}
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
            onAction={() => router.replace('/(tabs)/journey')}
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
  const stepTotal = quest.actionSteps.length;
  const stepsDone = activeUq && stepTotal > 0 ? countCompletedJourneySteps(activeUq, quest) : 0;
  const categoryKey = categoryKeyForId(quest.categoryId);
  // Doing it, the hero steps back; before and after, the page is the quest and the sky is bigger.
  const heroHeight = Math.round(width * HERO_ASPECT) + (activeUq ? 0 : 60);
  const completedOn = completedUq?.completedAt
    ? new Date(completedUq.completedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
    : null;
  const duration = questDurationWords(quest.estimatedDurationMinutes);
  const isDone = Boolean(completedUq && !activeUq);

  return (
    <DawnBackground>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={{ height: heroHeight }}>
          <Image source={HERO} style={[styles.hero, { height: heroHeight }]} resizeMode="cover" accessible={false} />
          {isDone ? (
            // Your new stone on the hill — the cairn is orange everywhere in Dawn.
            <View style={styles.heroCairn} accessible={false}>
              <View style={[styles.stone, { width: 16, height: 11 }]} />
              <View style={[styles.stone, { width: 26, height: 13, marginLeft: -3 }]} />
              <View style={[styles.stone, { width: 36, height: 15, marginLeft: 3 }]} />
              <View style={[styles.stone, { width: 46, height: 17 }]} />
            </View>
          ) : null}
        </View>

        <View style={styles.content}>
          <View style={styles.tagRow}>
            {activeUq ? (
              <View style={styles.inMotionChip}>
                <Text style={styles.inMotionText}>IN MOTION</Text>
              </View>
            ) : isDone ? (
              <View style={styles.doneChip}>
                <Text style={styles.doneChipText}>{stoneNumber ? `DONE · STONE ${stoneNumber}` : 'DONE'}</Text>
              </View>
            ) : null}
            {categoryKey ? <CategoryTag category={categoryKey} size={activeUq || isDone ? 'sm' : 'md'} /> : null}
            {/* Before you start, what the place gives you; after, when you did it. */}
            {!activeUq && !isDone && CATEGORY_PROMISE[quest.categoryId] ? (
              <Text style={styles.categoryPromise}>{CATEGORY_PROMISE[quest.categoryId]}</Text>
            ) : null}
            {isDone && completedOn ? <Text style={styles.categoryPromise}>{completedOn}</Text> : null}
          </View>
          <Text style={styles.title} accessibilityRole="header">
            {quest.title}
          </Text>

          {activeUq && stepTotal > 0 ? (
            <>
              <View style={styles.stepBars} accessible={false}>
                {quest.actionSteps.map((st, i) => (
                  <View
                    key={st.id}
                    style={[
                      styles.stepBar,
                      i < stepsDone ? styles.stepBarDone : i === stepsDone ? styles.stepBarNow : null,
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.stepLine}>
                Step {Math.min(stepsDone + 1, stepTotal)} of {stepTotal}
                {incompleteStepCount > 0
                  ? ` · ${incompleteStepCount} step${incompleteStepCount === 1 ? '' : 's'} left, done in order`
                  : ''}
              </Text>
            </>
          ) : null}

          {!activeUq && !isDone ? (
            <>
              <Text style={styles.shortDescription}>{quest.shortDescription}</Text>
              <Text style={styles.body}>{quest.fullDescription}</Text>
              {/* Two facts, in plain words: how much planning, and how long. Difficulty is left
                  out — it is what the app ranks by and it read oddly (Standa, 2026-09-26). */}
              <View style={styles.metaRow}>
                <View style={styles.metaPill}>
                  <Ionicons name="calendar-outline" size={14} color={Theme.accent} />
                  <Text style={styles.metaText}>{TIMEFRAME_LABEL[quest.timeframe]}</Text>
                </View>
                {duration ? (
                  <View style={styles.metaPill}>
                    <Ionicons name="time-outline" size={14} color={Theme.accent} />
                    <Text style={styles.metaText}>About {duration}</Text>
                  </View>
                ) : null}
              </View>
            </>
          ) : null}

          {/* Done: the question to keep while it is fresh, or the memory you already kept. */}
          {isDone ? (
            <View style={[styles.freshCard, gradientStyle(CREAM_CARD)]}>
              <Text style={styles.freshLabel}>{existingMemory ? 'YOUR MEMORY' : "KEEP IT WHILE IT'S FRESH"}</Text>
              {!existingMemory ? <Text style={styles.freshQuestion}>{quest.promptForReflection}</Text> : null}
              <SubtleButton
                block
                icon={existingMemory ? 'book-outline' : 'create-outline'}
                label={existingMemory ? 'View memory' : 'Add a memory'}
                onPress={() =>
                  existingMemory
                    ? router.push(`/memory/${existingMemory.id}`)
                    : router.push({ pathname: '/memory/new', params: { questId: quest.id } })
                }
              />
            </View>
          ) : null}

          <QuestJourneyChecklist
            quest={quest}
            mode={activeUq ? 'active' : completedUq ? 'completed' : 'browse'}
            userQuest={activeUq ?? completedUq}
            accentColor={accent}
          />

          {/* The reflection question is for the end of the quest; before you start it is a
              spoiler and one more block of text on a page meant to sell the quest. */}
          {!existingMemory && activeUq ? (
            <View style={styles.reflection}>
              <Text style={styles.reflectionLabel}>FOR THE END</Text>
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
              <PrimaryButton label="Continue quest" loading={acting || pending} onPress={openRunner} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Let this quest wait; find it under Progress Liked"
                onPress={requestDeactivate}
                disabled={acting || pending}
                style={({ pressed }) => [
                  styles.textBtn,
                  (acting || pending) && styles.btnDisabled,
                  pressed && !(acting || pending) && styles.btnPressed,
                ]}>
                <Text style={styles.textBtnText}>{QUEST_COPY.moveToLater}</Text>
              </Pressable>
            </>
          ) : isDone ? null : canAssign ? (
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
            <View style={styles.notOpen}>
              <Ionicons name="lock-closed-outline" size={16} color={Theme.textMuted} />
              <Text style={styles.notOpenText}>
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
              { value: 'not_mine', label: 'Not my thing — maybe later' },
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
                styles.textBtn,
                (acting || pending) && styles.btnDisabled,
                pressed && !(acting || pending) && styles.btnPressed,
              ]}>
              <Text style={styles.textBtnText}>Not for me</Text>
            </Pressable>
          ) : null}
          {completedUq ? (
            <QuestFeedbackCard userId={user.id} questId={quest.id} sourceScreen="quest_detail" />
          ) : null}
        </View>
      </ScrollView>
    </DawnBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  scrollContent: { paddingBottom: 40 },
  hero: { position: 'absolute', top: 0, left: 0, right: 0, width: '100%' },
  heroCairn: { position: 'absolute', left: 58, bottom: 30, alignItems: 'center', gap: 1 },
  stone: { borderRadius: 999, backgroundColor: Dawn.cairn },
  content: { paddingHorizontal: 20, paddingTop: 4 },
  tagRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  inMotionChip: { backgroundColor: '#e0823d', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4 },
  inMotionText: { fontSize: 11, fontFamily: 'Inter_700Bold', fontWeight: '700', letterSpacing: 1.1, color: Theme.onAccent },
  doneChip: { backgroundColor: Theme.text, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4 },
  doneChipText: { fontSize: 11, fontFamily: 'Inter_700Bold', fontWeight: '700', letterSpacing: 1.1, color: Dawn.primaryText },
  categoryPromise: { fontSize: 13, fontFamily: 'Inter_500Medium', fontWeight: '500', color: Theme.textMuted },
  title: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    letterSpacing: -0.4,
    color: Theme.text,
    marginBottom: 12,
    lineHeight: 31,
  },
  stepBars: { flexDirection: 'row', gap: 5, marginBottom: 8 },
  stepBar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(246, 234, 214, 0.35)' },
  stepBarDone: { backgroundColor: '#e0823d' },
  stepBarNow: { backgroundColor: 'rgba(224, 130, 61, 0.5)' },
  stepLine: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Theme.textMuted, marginBottom: 22 },
  shortDescription: {
    fontSize: 17,
    fontFamily: 'Inter_400Regular',
    lineHeight: 24,
    color: '#e6dfca',
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 23,
    color: Theme.textMuted,
    marginBottom: 14,
  },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: Dawn.card,
  },
  metaText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: Theme.text },
  freshCard: {
    backgroundColor: Dawn.cream,
    borderRadius: 22,
    padding: 18,
    gap: 12,
    marginBottom: 22,
    boxShadow: '0 8px 22px rgba(20, 18, 10, 0.4)',
  },
  freshLabel: { fontSize: 12, fontFamily: 'Inter_700Bold', fontWeight: '700', letterSpacing: 1.4, color: '#a34f25' },
  freshQuestion: { fontSize: 17, lineHeight: 24, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Dawn.creamText },
  reflection: {
    borderLeftWidth: 3,
    borderLeftColor: '#e0823d',
    backgroundColor: Dawn.card,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 26,
  },
  reflectionLabel: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Dawn.secondaryText,
    marginBottom: 6,
    letterSpacing: 1.4,
  },
  reflectionBody: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 22, color: Theme.text },
  assignFeedback: {
    marginBottom: 14,
    color: Theme.text,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    backgroundColor: Theme.accentSoft,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  notOpen: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Dawn.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Dawn.cardBorder,
  },
  notOpenText: { flex: 1, fontSize: 14, lineHeight: 20, fontFamily: 'Inter_400Regular', color: Theme.text },
  // Quiet: no border, just text, so it never competes with the main button.
  textBtn: {
    marginTop: 8,
    minHeight: 44,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  textBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#e6dfca',
  },
  btnPressed: { opacity: 0.7 },
  btnDisabled: { opacity: 0.55 },
});
