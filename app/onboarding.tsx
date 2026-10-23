import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryTag, categoryKeyForId } from '@/components/ui/CategoryTag';
import { DawnBackground } from '@/components/ui/DawnBackground';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Dawn, Theme } from '@/constants/Theme';
import { alertCompat } from '@/lib/alertCompat';
import { plainErrorMessage } from '@/lib/userFacingError';
import { categoryAccentForCategoryId } from '@/lib/categoryAccent';
import { categoryIoniconNameForCategoryId } from '@/lib/categoryIcons';
import { getOnboardingComplete } from '@/lib/onboarding';
import { questArtFor } from '@/lib/questArt';
import { askNotificationAccess } from '@/src/features/notifications/questNotifications';
import { getOnboardingState, saveOnboardingState } from '@/src/features/onboarding';
import { CATEGORY_PROMISE, TIMEFRAME_LABEL } from '@/src/features/quests/questCopy';
import { recommendQuestsForPreferences } from '@/src/features/quests/suggestedQuests';
import { useQuestDomainStore } from '@/src/features/quests/questStore';
import { trackEvent } from '@/src/lib/analytics';
import { logError } from '@/src/lib/monitoring/errorLogger';
import { useSessionStore } from '@/stores/session';
import type {
  OnboardingCategory,
  OnboardingIntensity,
  OnboardingPace,
  OnboardingScaleAnswer,
} from '@/src/features/onboarding';

const MAP_BACKGROUND = require('@/assets/images/explore-map-background.jpg');

const WELCOME_ART = require('@/assets/images/dawn/onboarding-welcome.png');
const STORY_ART = require('@/assets/images/dawn/onboarding-story.png');
const WEEK_ART = require('@/assets/images/dawn/week-sunrise.png');
const BOLD_ART: Record<OnboardingIntensity, number> = {
  light: require('@/assets/images/dawn/bold-gentle.png'),
  balanced: require('@/assets/images/dawn/bold-balanced.png'),
  bold: require('@/assets/images/dawn/bold-bold.png'),
};

/**
 * The frozen order (redesign screens 2–10): the promise, why it exists, then the questions, then
 * how it works, what a week could hold and what research found, then where to start. Editing your
 * answers skips straight to the questions.
 */
type StepId = 'welcome' | 'story' | 'goal' | 'bold' | 'questions' | 'how' | 'week' | 'research' | 'ready';
const FULL_STEPS: StepId[] = ['welcome', 'story', 'goal', 'bold', 'questions', 'how', 'week', 'research', 'ready'];
const EDIT_STEPS: StepId[] = ['goal', 'bold', 'questions', 'ready'];

/**
 * "What brings you here?" (task 61): a reason you came, each mapped onto one place. About doing,
 * never fixing a condition — no "reduce anxiety" style goals (target segment, no health claims).
 */
const GOAL_OPTIONS: { slug: OnboardingCategory; goal: string; place: string }[] = [
  { slug: 'nature', goal: 'Get outside more', place: `Nature · ${CATEGORY_PROMISE['cat-nature']}` },
  { slug: 'relax', goal: 'Slow down for a while', place: `Relax · ${CATEGORY_PROMISE['cat-relax']}` },
  { slug: 'adventure', goal: 'Break the routine', place: `Adventure · ${CATEGORY_PROMISE['cat-adventure']}` },
  { slug: 'social', goal: 'See my people more', place: `Social · ${CATEGORY_PROMISE['cat-social']}` },
];
/** Light versions of the category colours, for a ring and a tick on the dark ground. */
const CATEGORY_LIGHT: Record<OnboardingCategory, string> = {
  nature: '#7cc2a8',
  adventure: '#e0a85e',
  social: '#d59ac6',
  relax: '#9fb4ea',
};

type IntensityOption = {
  value: OnboardingIntensity;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const INTENSITY_OPTIONS: IntensityOption[] = [
  {
    value: 'light',
    label: 'Gentle',
    description: 'Softer, low-pressure quests',
    icon: 'leaf-outline',
  },
  {
    value: 'balanced',
    label: 'Balanced',
    description: 'A comfortable mix',
    icon: 'walk-outline',
  },
  {
    value: 'bold',
    label: 'Bold',
    description: 'Braver dares that stretch me',
    icon: 'rocket-outline',
  },
];

/**
 * The pace question was removed 2026-09-23 (ranking now reads completions —
 * see preferredTimeframeFromHistory). The stored shape and the profile column
 * stay as they are, so no migration is needed: this is what gets written, and
 * nothing reads it back for ranking.
 */
const STORED_PACE: OnboardingPace = 'steady';
const SCALE_VALUES: OnboardingScaleAnswer[] = [1, 2, 3, 4, 5];

export default function OnboardingScreen() {
  const router = useRouter();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEditMode = edit === '1';
  const user = useSessionStore((s) => s.user);
  const quests = useQuestDomainStore((s) => s.quests);
  const categories = useQuestDomainStore((s) => s.categories);
  const bootstrap = useQuestDomainStore((s) => s.bootstrap);
  const assignQuestToUser = useQuestDomainStore((s) => s.assignQuestToUser);

  const steps = isEditMode ? EDIT_STEPS : FULL_STEPS;
  const [step, setStep] = useState(0);
  const stepId = steps[step];
  // The bar counts the steps after the welcome.
  const barCount = isEditMode ? steps.length : steps.length - 1;
  const barIndex = isEditMode ? step : step - 1;
  const { width } = useWindowDimensions();
  const welcomeArtHeight = Math.round((width * 520) / 390);
  const [selectedCategories, setSelectedCategories] = useState<OnboardingCategory[]>([]);
  const [intensity, setIntensity] = useState<OnboardingIntensity>('balanced');
  const [natureConnection, setNatureConnection] = useState<OnboardingScaleAnswer>(3);
  const [isolation, setIsolation] = useState<OnboardingScaleAnswer>(3);
  const [selectedQuestIds, setSelectedQuestIds] = useState<Set<string>>(new Set());
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const startedTracked = useRef(false);

  const toggleQuestSelection = useCallback((questId: string) => {
    setSelectedQuestIds((current) => {
      const next = new Set(current);
      if (next.has(questId)) next.delete(questId);
      else next.add(questId);
      return next;
    });
  }, []);

  useEffect(() => {
    let mounted = true;

    if (isEditMode) {
      // Editing existing answers: prefill from the current state instead of
      // checking whether onboarding is complete (it already is).
      getOnboardingState()
        .then((state) => {
          if (!mounted) return;
          setSelectedCategories(state.preferences.categories);
          setIntensity(state.preferences.intensity);
          setNatureConnection(state.preferences.natureConnection);
          setIsolation(state.preferences.isolation);
          setChecking(false);
        })
        .catch(() => {
          if (mounted) setChecking(false);
        });
      return () => {
        mounted = false;
      };
    }

    getOnboardingComplete()
      .then((done: boolean) => {
        if (!mounted) return;
        if (done) {
          trackEvent('onboarding_skipped', { sourceScreen: 'onboarding' }).catch(
            () => undefined
          );
          router.replace('/(tabs)/explore');
          return;
        }
        setChecking(false);
      })
      .catch(() => {
        logError('onboarding.getOnboardingComplete', new Error('Failed to read onboarding state'));
        if (mounted) setChecking(false);
      });
    return () => {
      mounted = false;
    };
  }, [router, isEditMode]);

  // Warm the quest catalog so the summary can show tailored picks.
  useEffect(() => {
    if (user?.id) bootstrap(user.id).catch(() => undefined);
  }, [user?.id, bootstrap]);

  useEffect(() => {
    if (checking || startedTracked.current) return;
    startedTracked.current = true;
    trackEvent('onboarding_started', {
      sourceScreen: isEditMode ? 'onboarding_edit' : 'onboarding',
    }).catch(() => undefined);
  }, [checking, isEditMode]);

  const toggleCategory = useCallback((slug: OnboardingCategory) => {
    setSelectedCategories((current) => {
      const next = current.includes(slug)
        ? current.filter((c) => c !== slug)
        : [...current, slug];
      trackEvent('category_preferences_selected', {
        sourceScreen: 'onboarding',
        preferredCategories: next,
      }).catch(() => undefined);
      return next;
    });
  }, []);

  const recommended = useMemo(() => {
    if (quests.length === 0) return [];
    return recommendQuestsForPreferences({
      catalog: quests,
      preferences: {
        categories: selectedCategories,
        intensity,
        pace: STORED_PACE,
        natureConnection,
        isolation,
      },
      limit: 3,
    });
  }, [quests, selectedCategories, intensity, natureConnection, isolation]);

  const categoryName = useCallback(
    (categoryId: string) => categories.find((c) => c.id === categoryId)?.name ?? 'Quest',
    [categories]
  );

  const canContinue = useMemo(() => {
    if (stepId === 'goal') return selectedCategories.length > 0;
    return true;
  }, [stepId, selectedCategories.length]);

  async function finishOnboarding() {
    setSubmitError(null);
    setSaving(true);
    try {
      await saveOnboardingState({
        categories: selectedCategories,
        intensity,
        pace: STORED_PACE,
        natureConnection,
        isolation,
      });
      // The weekly nudge is on by default (task 53); this is the moment the screen has just said so.
      if (!isEditMode) await askNotificationAccess();
      trackEvent('onboarding_completed', {
        sourceScreen: isEditMode ? 'onboarding_edit' : 'onboarding',
        categoryCount: selectedCategories.length,
        preferredCategories: selectedCategories,
        pacePreference: STORED_PACE,
        intensityPreference: intensity,
      }).catch(() => undefined);

      // Picking quests here is optional — start whichever ones the user
      // actually checked. Failures (e.g. active path already full) are
      // silently skipped rather than blocking the whole finish action;
      // Explore/Journey are always there to pick them up individually.
      const questsToStart = recommended.filter((q) => selectedQuestIds.has(q.id));
      let startedQuestId: string | null = null;
      if (user && questsToStart.length > 0) {
        for (const q of questsToStart) {
          try {
            const r = await assignQuestToUser(user.id, q.id, { sourceScreen: 'onboarding' });
            if (r.ok && !startedQuestId) startedQuestId = q.id;
          } catch {
            // Best-effort — see comment above.
          }
        }
      }

      if (startedQuestId && questsToStart.length === 1) {
        router.replace(`/quest/run/${startedQuestId}` as never);
      } else if (isEditMode) {
        router.back();
      } else {
        router.replace('/(tabs)/explore');
      }
    } catch (e: unknown) {
      const message = plainErrorMessage(e, "Your answers didn't save. Try again in a moment.");
      logError('onboarding.finishOnboarding', e, {
        categoryCount: selectedCategories.length,
      });
      setSubmitError(message);
      alertCompat("That didn't go through", message);
    } finally {
      setSaving(false);
    }
  }

  function goBack() {
    if (step === 0) {
      if (isEditMode) router.back();
      return;
    }
    setStep((s) => s - 1);
  }

  if (checking) {
    return (
      <DawnBackground>
        <View style={styles.center}>
          <ActivityIndicator color={Theme.accent} />
        </View>
      </DawnBackground>
    );
  }

  const isLast = step === steps.length - 1;
  const ctaLabel = isLast
    ? selectedQuestIds.size > 0
      ? `Start with ${selectedQuestIds.size} quest${selectedQuestIds.size === 1 ? '' : 's'}`
      : isEditMode
        ? 'Save changes'
        : 'Start exploring'
    : 'Continue';

  // 2 · Welcome — the promise, on the whole sunrise (canvas screen 2).
  if (stepId === 'welcome') {
    return (
      <DawnBackground>
        <View style={styles.welcome}>
          <Image source={WELCOME_ART} style={[styles.welcomeArt, { height: welcomeArtHeight }]} resizeMode="cover" accessible={false} />
          <SafeAreaView style={styles.welcomeSafe} edges={['top', 'bottom']}>
            <Text style={styles.wordmark}>SIDE QUEST LIFE</Text>
            <View style={styles.welcomeSpacer} />
            <View style={styles.welcomeText}>
              <Text style={styles.welcomeTitle} accessibilityRole="header">
                Break the week{'\n'}on repeat.
              </Text>
              <Text style={styles.welcomeLead}>
                Small real-world quests — and a map of the days you actually lived.
              </Text>
            </View>
            <Pressable
              onPress={() => setStep(1)}
              accessibilityRole="button"
              accessibilityLabel="Get started"
              style={({ pressed }) => [styles.welcomeGo, pressed && styles.pressed]}>
              <Ionicons name="arrow-forward" size={26} color={Theme.onAccent} />
            </Pressable>
            <Text style={styles.signInLine}>
              I already have an account.{' '}
              <Text style={styles.signInLink} onPress={() => router.push('/(auth)/sign-in')} accessibilityRole="link">
                Sign in
              </Text>
            </Text>
          </SafeAreaView>
        </View>
      </DawnBackground>
    );
  }

  return (
    <DawnBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Back and where you are: one segment per step after the welcome. */}
        <View style={styles.topBar}>
          {step > 0 || isEditMode ? (
            <Pressable
              onPress={goBack}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Back"
              style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
              <Ionicons name="chevron-back" size={20} color={Theme.text} />
            </Pressable>
          ) : null}
          <View style={styles.segments} accessibilityLabel={`Step ${barIndex + 1} of ${barCount}`}>
            {Array.from({ length: barCount }).map((_, i) => (
              <View key={i} style={[styles.segment, i <= barIndex && styles.segmentOn]} />
            ))}
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {submitError ? <Text style={styles.errorBanner}>{submitError}</Text> : null}

          {/* 3 · Why this exists — Standa's story (canvas screen 3). */}
          {stepId === 'story' ? (
            <View>
              <Image source={STORY_ART} style={[styles.storyArt, { height: Math.round(((width - 48) * 230) / 350) }]} resizeMode="cover" accessible={false} />
              <Text style={styles.kickerOrange}>WHY THIS EXISTS</Text>
              {/* The founder story, not a product line. Standa's call 2026-09-06. See docs/story.md. */}
              <Text style={styles.headline} accessibilityRole="header">
                Stuck in the same week on repeat.
              </Text>
              <Text style={styles.lead}>
                Until a sunset in Morocco had me thinking about not coming home. I came back and built
                this: small real-world quests that break the routine — and help you remember the days
                you did something. Answer a few questions and we&apos;ll shape a map that fits you.
              </Text>
            </View>
          ) : null}

          {/* 4 · What brings you here (canvas screen 4, task 61): a goal, mapped onto the places. */}
          {stepId === 'goal' ? (
            <View>
              <Text style={styles.headline} accessibilityRole="header">
                What brings you here?
              </Text>
              <Text style={styles.subtext}>
                Pick one or more. It decides which places on your map light up first — every place stays
                open.
              </Text>
              <View style={styles.choices}>
                {GOAL_OPTIONS.map((option) => {
                  const selected = selectedCategories.includes(option.slug);
                  const accent = categoryAccentForCategoryId(`cat-${option.slug}`);
                  const light = CATEGORY_LIGHT[option.slug];
                  return (
                    <Pressable
                      key={option.slug}
                      onPress={() => toggleCategory(option.slug)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}
                      accessibilityLabel={`${option.goal}. ${option.place}`}
                      style={({ pressed }) => [
                        styles.option,
                        selected && { borderColor: light, borderWidth: 2, backgroundColor: `${light}1a` },
                        pressed && styles.pressed,
                      ]}>
                      <View style={[styles.optionTile, { backgroundColor: accent }]}>
                        <Ionicons name={categoryIoniconNameForCategoryId(`cat-${option.slug}`)} size={22} color="#ffffff" />
                      </View>
                      <View style={styles.optionText}>
                        <Text style={styles.optionTitle}>{option.goal}</Text>
                        <Text style={styles.optionDescription}>{option.place}</Text>
                      </View>
                      <Check selected={selected} color={light} />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* 5 · How bold (canvas screen 5): each level a small landscape, steeper as it gets bolder. */}
          {stepId === 'bold' ? (
            <View>
              <Text style={styles.headline} accessibilityRole="header">
                How bold should your quests be?
              </Text>
              <Text style={styles.subtext}>This sets how much of a stretch we aim for. You can change it later.</Text>
              <View style={styles.choices}>
                {INTENSITY_OPTIONS.map((option) => {
                  const selected = intensity === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => {
                        setIntensity(option.value);
                        trackEvent('intensity_selected', {
                          sourceScreen: 'onboarding',
                          intensityPreference: option.value,
                        }).catch(() => undefined);
                      }}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      accessibilityLabel={`${option.label}. ${option.description}`}
                      style={({ pressed }) => [
                        styles.boldCard,
                        selected && styles.boldCardOn,
                        pressed && styles.pressed,
                      ]}>
                      <Image source={BOLD_ART[option.value]} style={styles.boldArt} resizeMode="cover" accessible={false} />
                      <View style={styles.optionText}>
                        <Text style={styles.boldTitle}>{option.label}</Text>
                        <Text style={styles.optionDescription}>{option.description}</Text>
                      </View>
                      <Check selected={selected} color="#e0823d" />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* 6 · Two quick questions (canvas screen 6). */}
          {stepId === 'questions' ? (
            <View>
              <Text style={styles.headline} accessibilityRole="header">
                Two quick questions.
              </Text>
              <Text style={styles.subtext}>
                Just for you to look back on — they don&apos;t change which quests you see. We&apos;ll ask again
                in a few months.
              </Text>
              <View style={styles.choices}>
                <ScaleQuestion
                  prompt="How much time have you spent in nature lately?"
                  lowLabel="Rarely"
                  highLabel="Often"
                  value={natureConnection}
                  onChange={setNatureConnection}
                />
                <ScaleQuestion
                  prompt="How often have you felt lonely or isolated lately?"
                  lowLabel="Rarely"
                  highLabel="Very often"
                  value={isolation}
                  onChange={setIsolation}
                />
                <View style={styles.privateRow}>
                  <Ionicons name="lock-closed-outline" size={15} color={Theme.textMuted} />
                  <Text style={styles.privateText}>Only you see these. In a few months you can compare.</Text>
                </View>
              </View>
            </View>
          ) : null}

          {/* 7 · How it works, animated (canvas screen 7, task 64). */}
          {stepId === 'how' ? <HowItWorks /> : null}

          {/* 8 · A week from now (canvas screen 8, task 63): lived experience, not a health promise. */}
          {stepId === 'week' ? (
            <View>
              <Text style={[styles.headline, styles.centered]} accessibilityRole="header">
                A week from now
              </Text>
              <Text style={[styles.subtext, styles.centered]}>
                Not a new you. The same you — with a week worth remembering.
              </Text>
              <View style={styles.weekStage}>
                <View style={styles.weekBefore}>
                  <Text style={styles.weekBeforeTitle}>This week</Text>
                  <Ionicons name="repeat" size={44} color="#8a826c" style={styles.weekLoop} />
                  <Text style={styles.weekBeforeText}>Commute · desk · couch · repeat</Text>
                </View>
                <View style={styles.weekAfter}>
                  <Image source={WEEK_ART} style={styles.weekArt} resizeMode="cover" accessible={false} />
                  <View style={styles.weekAfterBody}>
                    <Text style={styles.weekAfterTitle}>A week from now</Text>
                    {['Watched the sun come up', 'Swam somewhere you walked to', 'Two memories to look back on'].map(
                      (line, i) => (
                        <View key={line} style={styles.weekLine}>
                          <Ionicons name={i < 2 ? 'checkmark' : 'book-outline'} size={15} color={i < 2 ? '#e0823d' : Theme.textMuted} />
                          <Text style={styles.weekLineText}>{line}</Text>
                        </View>
                      )
                    )}
                  </View>
                </View>
              </View>
            </View>
          ) : null}

          {/* 9 · What the research says (canvas screen 9, task 62). */}
          {stepId === 'research' ? <ResearchNotes /> : null}

          {/* 10 · Almost set (canvas screen 10). */}
          {stepId === 'ready' ? (
            <View>
              <Text style={styles.headline} accessibilityRole="header">
                {isEditMode ? 'Updated and ready.' : 'Almost set.'}
              </Text>
              <Text style={styles.subtext}>
                {recommended.length > 0
                  ? "Here's where we'd start. Tap any you want to begin right away — totally optional."
                  : "Here's where we'd start."}
              </Text>
              <View style={styles.choices}>
                {recommended.length > 0 ? (
                  recommended.map((quest) => {
                    const selected = selectedQuestIds.has(quest.id);
                    const key = categoryKeyForId(quest.categoryId);
                    return (
                      <Pressable
                        key={quest.id}
                        onPress={() => toggleQuestSelection(quest.id)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: selected }}
                        accessibilityLabel={`${selected ? 'Remove' : 'Start with'} ${quest.title}`}
                        style={({ pressed }) => [styles.pick, selected && styles.pickOn, pressed && styles.pressed]}>
                        <Image source={questArtFor(quest.id, quest.categoryId)} style={styles.pickArt} resizeMode="cover" accessible={false} />
                        <View style={styles.pickBody}>
                          <View style={styles.pickMeta}>
                            {key ? <CategoryTag category={key} /> : null}
                            <Text style={styles.pickMetaText}>{TIMEFRAME_LABEL[quest.timeframe]}</Text>
                          </View>
                          <Text style={styles.pickTitle} numberOfLines={2}>
                            {quest.title}
                          </Text>
                        </View>
                        <Check selected={selected} color="#e0823d" />
                      </Pressable>
                    );
                  })
                ) : (
                  <View style={styles.note}>
                    <ActivityIndicator color={Theme.accent} />
                    <Text style={styles.noteText}>Your quests are loading — you can also jump straight into your map.</Text>
                  </View>
                )}
                {!isEditMode ? (
                  <View style={styles.note}>
                    <Ionicons name="notifications-outline" size={18} color={Theme.accent} />
                    <Text style={styles.noteText}>
                      Now and then I&apos;ll send you an idea for a quest. Change that any time in Progress →
                      Settings.
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.footnote}>
                Just a starting point — every quest stays open, and you can update your answers anytime.
              </Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label={ctaLabel}
            loading={saving}
            disabled={!canContinue}
            onPress={() => (isLast ? void finishOnboarding() : setStep((s) => s + 1))}
          />
        </View>
      </SafeAreaView>
    </DawnBackground>
  );
}

/** A round tick: filled in the given colour when chosen, an empty ring when not. */
function Check({ selected, color }: { selected: boolean; color: string }) {
  return selected ? (
    <View style={[styles.check, { backgroundColor: color, borderColor: color }]}>
      <Ionicons name="checkmark" size={15} color={Dawn.primaryText} />
    </View>
  ) : (
    <View style={styles.check} />
  );
}

function ScaleQuestion({
  prompt,
  lowLabel,
  highLabel,
  value,
  onChange,
}: {
  prompt: string;
  lowLabel: string;
  highLabel: string;
  value: OnboardingScaleAnswer;
  onChange: (next: OnboardingScaleAnswer) => void;
}) {
  return (
    <View style={styles.scaleCard}>
      <Text style={styles.scalePrompt}>{prompt}</Text>
      <View style={styles.scaleRow}>
        {SCALE_VALUES.map((n) => {
          const selected = value === n;
          return (
            <Pressable
              key={n}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={`${n} of 5`}
              onPress={() => onChange(n)}
              style={({ pressed }) => [styles.scaleDot, selected && styles.scaleDotSelected, pressed && styles.pressed]}>
              <Text style={[styles.scaleDotText, selected && styles.scaleDotTextSelected]}>{n}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.scaleLabelsRow}>
        <Text style={styles.scaleEdgeLabel}>{lowLabel}</Text>
        <Text style={styles.scaleEdgeLabel}>{highLabel}</Text>
      </View>
    </View>
  );
}

/**
 * Proof for the first screens without testimonials (task 62, Standa 2026-10-23): what three
 * studies found, each paraphrased with its source — the same three as ScienceNote on Progress.
 * Findings people reported, never a promise of what the app will do for you (no health claims),
 * and never in quotation marks, so nothing reads like a review someone wrote.
 */
const RESEARCH_CARDS = [
  {
    big: '2 hours',
    label: 'a week in nature',
    body: 'People who got that reported better health and wellbeing. Short visits count too.',
    source: 'White et al., 2019 · Scientific Reports',
  },
  {
    big: '90 min',
    label: 'walking in nature',
    body: 'Afterwards, people dwelt less on negative thoughts. A city walk did not do that.',
    source: 'Bratman et al., 2015 · PNAS',
  },
  {
    big: '47%',
    label: 'of the time, our minds wander',
    body: 'And people felt less happy then than when they were into what they were doing.',
    source: 'Killingsworth & Gilbert, 2010 · Science',
  },
];
const RESEARCH_CARD_GAP = 14;

/** Three cards you swipe through, the next one peeking at the edge. */
function ResearchNotes() {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(300, width - 76);
  const side = (width - cardWidth) / 2;
  const [index, setIndex] = useState(0);
  return (
    <View>
      <View style={styles.researchHead}>
        <View style={styles.researchCairn} accessible={false}>
          <View style={[styles.stone, { width: 16, height: 11 }]} />
          <View style={[styles.stone, { width: 25, height: 13, marginLeft: -3 }]} />
          <View style={[styles.stone, { width: 34, height: 14, marginLeft: 3 }]} />
          <View style={[styles.stone, { width: 44, height: 16 }]} />
        </View>
        <Text style={[styles.kickerOrange, styles.centered]}>WHAT THE RESEARCH SAYS</Text>
        <Text style={[styles.headline, styles.centered]} accessibilityRole="header">
          Why small real things work
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={cardWidth + RESEARCH_CARD_GAP}
        snapToAlignment="start"
        style={styles.researchRow}
        contentContainerStyle={{ paddingHorizontal: side, gap: RESEARCH_CARD_GAP }}
        onScroll={(e) =>
          setIndex(
            Math.max(
              0,
              Math.min(
                RESEARCH_CARDS.length - 1,
                Math.round(e.nativeEvent.contentOffset.x / (cardWidth + RESEARCH_CARD_GAP))
              )
            )
          )
        }
        scrollEventThrottle={32}>
        {RESEARCH_CARDS.map((card, i) => (
          <View
            key={card.source}
            style={[styles.researchCard, { width: cardWidth }, i !== index && styles.researchCardAside]}
            accessible
            accessibilityLabel={`${card.big} ${card.label}. ${card.body} Source: ${card.source}.`}>
            <Text style={styles.researchBig} numberOfLines={1}>
              {card.big}
            </Text>
            <Text style={styles.researchLabel}>{card.label}</Text>
            <Text style={styles.researchBody}>{card.body}</Text>
            <View style={styles.flexFill} />
            <Text style={styles.researchSource}>{card.source}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.howDots}>
        {RESEARCH_CARDS.map((card, i) => (
          <View key={card.source} style={[styles.howDot, i === index && styles.howDotOn]} />
        ))}
      </View>
      <Text style={styles.researchNote}>
        What studies found, not a promise. The sources are in Progress → Why this works.
      </Text>
    </View>
  );
}

const HOW_FRAMES = [
  { title: 'Pick a place on your map', body: 'Nature, Adventure, Relax or Social — tap where you want to go.' },
  { title: 'Do a small quest, for real', body: 'Real-world steps you can finish today. No points, no streaks — up to three at once.' },
  { title: 'Keep a memory of it', body: 'A line and a photo. That is the whole diary.' },
  { title: 'Watch your cairn grow', body: 'One stone for every quest you finish — a map of a life you actually lived.' },
];

/**
 * Four frames that play on their own, every 2.6 s, and can be tapped through: map → quest →
 * memory → cairn. Replaces four static feature rows (task 64). Plain Views and Reanimated-free
 * timing, so it ships over the air.
 */
function HowItWorks() {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setFrame((f) => (f + 1) % HOW_FRAMES.length), 2600);
    return () => clearInterval(t);
  }, []);
  return (
    <View>
      <Text style={styles.kickerOrange}>HOW IT WORKS</Text>
      <View style={styles.howCard}>
        {frame === 0 ? (
          <View style={styles.howFill}>
            <Image source={MAP_BACKGROUND} style={styles.howMap} resizeMode="cover" accessible={false} />
            <View style={styles.howMarker}>
              <View style={styles.howMarkerDisc}>
                <Ionicons name="leaf" size={20} color="#ffffff" />
              </View>
              <View style={styles.howMarkerLabel}>
                <Text style={styles.howMarkerText}>Nature</Text>
              </View>
            </View>
          </View>
        ) : null}
        {frame === 1 ? (
          <View style={styles.howPad}>
            <View style={styles.howQuest}>
              <CategoryTag category="nature" />
              <Text style={styles.howQuestTitle}>Watch the sun come up somewhere outdoors</Text>
            </View>
            {['Pick a morning', 'Pack the night before'].map((t) => (
              <View key={t} style={styles.howStep}>
                <View style={[styles.check, styles.checkSmall, { backgroundColor: '#e0823d', borderColor: '#e0823d' }]}>
                  <Ionicons name="checkmark" size={12} color={Dawn.primaryText} />
                </View>
                <Text style={[styles.howStepText, styles.howStepDone]}>{t}</Text>
              </View>
            ))}
            <View style={styles.howStep}>
              <View style={[styles.check, styles.checkSmall, { borderColor: '#e0823d' }]} />
              <Text style={styles.howStepText}>Go — stay till it&apos;s fully up</Text>
            </View>
          </View>
        ) : null}
        {frame === 2 ? (
          <View style={styles.howPad}>
            <Image source={WEEK_ART} style={styles.howMemoryArt} resizeMode="cover" accessible={false} />
            <Text style={styles.howMemoryWhen}>Saturday, 6:52</Text>
            <Text style={styles.howMemoryTitle}>The whole valley went gold</Text>
            <Text style={styles.howMemoryText}>Cold hands, hot tea, nobody else up there.</Text>
          </View>
        ) : null}
        {frame === 3 ? (
          <View style={[styles.howFill, styles.howCairnWrap]}>
            <View style={styles.howCairn}>
              <View style={[styles.stone, { width: 26, height: 18 }]} />
              <View style={[styles.stone, { width: 42, height: 22, marginLeft: -5 }]} />
              <View style={[styles.stone, { width: 58, height: 24, marginLeft: 5 }]} />
              <View style={[styles.stone, { width: 78, height: 28 }]} />
            </View>
            <Text style={styles.howCairnTitle}>Your cairn</Text>
            <Text style={styles.howCairnText}>one stone for every quest you finish</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.howDots}>
        {HOW_FRAMES.map((f, i) => (
          <Pressable
            key={f.title}
            onPress={() => setFrame(i)}
            accessibilityRole="button"
            accessibilityLabel={`Show part ${i + 1} of 4`}
            hitSlop={10}
            style={[styles.howDot, i === frame && styles.howDotOn]}
          />
        ))}
      </View>
      <Text style={[styles.howTitle, styles.centered]}>{HOW_FRAMES[frame].title}</Text>
      <Text style={[styles.subtext, styles.centered]}>{HOW_FRAMES[frame].body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centered: { textAlign: 'center' },
  pressed: { opacity: 0.85 },

  welcome: { flex: 1 },
  welcomeArt: { position: 'absolute', top: 0, left: 0, right: 0, width: '100%' },
  welcomeSafe: { flex: 1, alignItems: 'center', paddingHorizontal: 28 },
  wordmark: { marginTop: 16, fontSize: 12, fontFamily: 'Inter_600SemiBold', fontWeight: '600', letterSpacing: 3, color: 'rgba(243, 242, 236, 0.85)' },
  welcomeSpacer: { flex: 1 },
  welcomeText: { alignItems: 'center', gap: 12 },
  welcomeTitle: { fontSize: 34, lineHeight: 38, fontFamily: 'Inter_700Bold', fontWeight: '700', letterSpacing: -0.6, color: Theme.text, textAlign: 'center' },
  welcomeLead: { fontSize: 16, lineHeight: 24, fontFamily: 'Inter_400Regular', color: '#e6dfca', textAlign: 'center', maxWidth: 300 },
  welcomeGo: {
    marginTop: 28,
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#e0823d',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 0 10px rgba(224, 130, 61, 0.16)',
  },
  signInLine: { marginTop: 22, marginBottom: 20, fontSize: 14, fontFamily: 'Inter_400Regular', color: '#e6dfca' },
  signInLink: { fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.text, textDecorationLine: 'underline' },

  topBar: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(246, 234, 214, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segments: { flex: 1, flexDirection: 'row', gap: 5 },
  segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(243, 242, 236, 0.16)' },
  segmentOn: { backgroundColor: '#e0823d' },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 18, paddingBottom: 24 },
  footer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  errorBanner: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.dangerBorder,
    backgroundColor: Theme.dangerSoft,
    color: Theme.text,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },

  kickerOrange: { fontSize: 12, fontFamily: 'Inter_700Bold', fontWeight: '700', letterSpacing: 1.9, color: '#e0823d', marginBottom: 12 },
  headline: { fontSize: 29, lineHeight: 34, fontFamily: 'Inter_700Bold', fontWeight: '700', letterSpacing: -0.5, color: Theme.text },
  subtext: { marginTop: 10, fontSize: 16, lineHeight: 24, fontFamily: 'Inter_400Regular', color: '#e6dfca' },
  lead: { marginTop: 14, fontSize: 16, lineHeight: 25, fontFamily: 'Inter_400Regular', color: '#e6dfca' },
  storyArt: { width: '100%', borderRadius: 26, marginBottom: 22 },

  choices: { marginTop: 22, gap: 12 },
  option: {
    minHeight: 76,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Dawn.cardBorder,
    backgroundColor: Dawn.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  optionTile: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  optionText: { flex: 1, minWidth: 0 },
  optionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.text },
  optionDescription: { marginTop: 2, fontSize: 13, lineHeight: 18, fontFamily: 'Inter_400Regular', color: Theme.textMuted },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(246, 234, 214, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSmall: { width: 20, height: 20, borderRadius: 10 },

  boldCard: {
    height: 104,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Dawn.cardBorder,
    backgroundColor: Dawn.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingRight: 16,
    overflow: 'hidden',
  },
  boldCardOn: { borderWidth: 2, borderColor: '#e0823d', backgroundColor: 'rgba(224, 130, 61, 0.1)' },
  boldArt: { width: 96, height: 104 },
  boldTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.text },

  scaleCard: { borderRadius: 22, backgroundColor: Dawn.card, paddingTop: 18, paddingBottom: 14, paddingHorizontal: 16 },
  scalePrompt: { fontSize: 17, lineHeight: 23, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: Theme.text },
  scaleRow: { marginTop: 16, flexDirection: 'row', justifyContent: 'space-between' },
  scaleDot: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: 'rgba(243, 242, 236, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleDotSelected: { backgroundColor: '#e0823d', borderColor: '#e0823d' },
  scaleDotText: { fontSize: 17, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: Theme.text },
  scaleDotTextSelected: { fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.onAccent },
  scaleLabelsRow: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
  scaleEdgeLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Theme.textMuted },
  privateRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingHorizontal: 4 },
  privateText: { flex: 1, fontSize: 13, lineHeight: 19, fontFamily: 'Inter_400Regular', color: Theme.textMuted },

  howCard: {
    alignSelf: 'center',
    width: 300,
    height: 340,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: Dawn.card,
    borderWidth: 1,
    borderColor: 'rgba(246, 234, 214, 0.3)',
    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45)',
  },
  howFill: { ...StyleSheet.absoluteFillObject },
  howMap: { position: 'absolute', width: 640, height: 857, left: -330, top: -150 },
  howMarker: { position: 'absolute', left: 150, top: 120, alignItems: 'center', gap: 6 },
  howMarkerDisc: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Theme.nature,
    borderWidth: 3,
    borderColor: Dawn.cream,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 0 10px rgba(240, 178, 122, 0.4)',
  },
  howMarkerLabel: { backgroundColor: Theme.nature, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(246, 234, 214, 0.7)', paddingHorizontal: 10, paddingVertical: 3 },
  howMarkerText: { fontSize: 12, fontFamily: 'Inter_700Bold', fontWeight: '700', color: '#ffffff' },
  howPad: { flex: 1, padding: 22, gap: 12 },
  howQuest: { borderRadius: 18, backgroundColor: Dawn.cream, padding: 14, gap: 8 },
  howQuestTitle: { fontSize: 16, lineHeight: 20, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Dawn.creamText },
  howStep: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  howStepText: { flex: 1, fontSize: 14, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: Theme.text },
  howStepDone: { color: Theme.textMuted, textDecorationLine: 'line-through', fontFamily: 'Inter_400Regular', fontWeight: '400' },
  howMemoryArt: { width: '100%', height: 150, borderRadius: 18 },
  howMemoryWhen: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Theme.textMuted },
  howMemoryTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.text },
  howMemoryText: { fontSize: 14, lineHeight: 20, fontFamily: 'Inter_400Regular', color: '#e6dfca' },
  howCairnWrap: { alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: 'rgba(122, 106, 114, 0.25)' },
  howCairn: { alignItems: 'center', gap: 2, marginBottom: 6 },
  stone: { borderRadius: 999, backgroundColor: Dawn.cairn },
  howCairnTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.text },
  howCairnText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#e6dfca' },
  howDots: { marginTop: 20, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  howDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(243, 242, 236, 0.25)' },
  howDotOn: { width: 22, backgroundColor: '#e0823d' },
  howTitle: { marginTop: 18, fontSize: 22, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.text },

  researchHead: { alignItems: 'center', marginTop: 12 },
  researchCairn: { alignItems: 'center', gap: 1, marginBottom: 14 },
  researchRow: { marginTop: 28, marginHorizontal: -24 },
  researchCard: {
    minHeight: 246,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(240, 178, 122, 0.3)',
    backgroundColor: Dawn.card,
    paddingTop: 24,
    paddingHorizontal: 22,
    paddingBottom: 18,
  },
  researchCardAside: { opacity: 0.45, borderColor: 'rgba(246, 234, 214, 0.16)' },
  researchBig: { fontSize: 48, lineHeight: 52, fontFamily: 'Inter_700Bold', fontWeight: '700', letterSpacing: -1.4, color: Dawn.cairn },
  researchLabel: { marginTop: 4, fontSize: 19, lineHeight: 24, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.text },
  researchBody: { marginTop: 12, fontSize: 15, lineHeight: 22, fontFamily: 'Inter_400Regular', color: '#e6dfca' },
  researchSource: { marginTop: 14, fontSize: 12, fontFamily: 'Inter_400Regular', color: '#bfb69c' },
  researchNote: { marginTop: 14, fontSize: 13, lineHeight: 19, fontFamily: 'Inter_400Regular', color: '#bfb69c', textAlign: 'center', paddingHorizontal: 8 },
  flexFill: { flex: 1 },

  weekStage: { marginTop: 26, height: 380 },
  weekBefore: {
    position: 'absolute',
    left: 0,
    top: 190,
    width: 168,
    height: 190,
    borderRadius: 24,
    padding: 18,
    backgroundColor: '#332e24',
    borderWidth: 1,
    borderColor: 'rgba(246, 234, 214, 0.18)',
    transform: [{ rotate: '-4deg' }],
  },
  weekBeforeTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.textMuted },
  weekLoop: { marginTop: 18, marginLeft: 12 },
  weekBeforeText: { marginTop: 18, maxWidth: 100, fontSize: 13, lineHeight: 18, fontFamily: 'Inter_400Regular', color: '#a39d88' },
  weekAfter: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 204,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#4f4836',
    borderWidth: 1,
    borderColor: 'rgba(224, 130, 61, 0.45)',
    transform: [{ rotate: '3deg' }],
    boxShadow: '0 22px 54px rgba(0, 0, 0, 0.5)',
  },
  weekArt: { width: 204, height: 138 },
  weekAfterBody: { padding: 16, gap: 9 },
  weekAfterTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.accent },
  weekLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  weekLineText: { flex: 1, fontSize: 14, lineHeight: 19, fontFamily: 'Inter_400Regular', color: Theme.text },

  pick: {
    minHeight: 76,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Dawn.cardBorder,
    backgroundColor: Dawn.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingRight: 14,
    overflow: 'hidden',
  },
  pickOn: { borderWidth: 2, borderColor: '#e0823d', backgroundColor: 'rgba(224, 130, 61, 0.1)' },
  pickArt: { width: 64, height: 76 },
  pickBody: { flex: 1, minWidth: 0, paddingVertical: 10, gap: 4 },
  pickMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pickMetaText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Theme.textMuted },
  pickTitle: { fontSize: 15, lineHeight: 19, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.text },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Dawn.cardBorder,
    padding: 14,
  },
  noteText: { flex: 1, fontSize: 13, lineHeight: 19, fontFamily: 'Inter_400Regular', color: '#e6dfca' },
  footnote: { marginTop: 14, fontSize: 12, lineHeight: 17, fontFamily: 'Inter_400Regular', color: Theme.textMuted, textAlign: 'center' },
});
