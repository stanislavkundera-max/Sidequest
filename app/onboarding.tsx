import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Theme } from '@/constants/Theme';
import { categoryAccentForCategoryId } from '@/lib/categoryAccent';
import { categoryIconNameForCategoryId } from '@/lib/categoryIcons';
import { getOnboardingComplete } from '@/lib/onboarding';
import { getOnboardingState, saveOnboardingState } from '@/src/features/onboarding';
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

const MAP_BACKGROUND = require('@/assets/images/explore-map-background.png');

const TOTAL_STEPS = 7;
/** First step shown when editing existing answers (skips welcome + how-it-works). */
const EDIT_MODE_FIRST_STEP = 2;

type CategoryOption = {
  slug: OnboardingCategory;
  label: string;
  description: string;
};

const CATEGORY_OPTIONS: CategoryOption[] = [
  { slug: 'nature', label: 'Nature', description: 'Outdoors, plants, and light' },
  { slug: 'adventure', label: 'Adventure', description: 'New routes and small trips' },
  { slug: 'social', label: 'Social', description: 'Real conversations and connection' },
  { slug: 'relax', label: 'Relax', description: 'Slow, restorative moments' },
];

type PaceOption = {
  value: OnboardingPace;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const PACE_OPTIONS: PaceOption[] = [
  {
    value: 'quick',
    label: 'A few minutes',
    description: 'Short quests I can finish this week — about 15–45 minutes',
    icon: 'flash-outline',
  },
  {
    value: 'steady',
    label: 'A steady rhythm',
    description: 'A practical mix across the month — about 1–3 hours',
    icon: 'walk-outline',
  },
  {
    value: 'deep',
    label: 'Bigger journeys',
    description: 'Longer quests that unfold over time — half a day or more',
    icon: 'trail-sign-outline',
  },
];

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

type FeatureRow = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
};

const FEATURE_ROWS: FeatureRow[] = [
  {
    icon: 'map-outline',
    title: 'Explore your map',
    body: 'Pick quests by mood from an illustrated world map.',
  },
  {
    icon: 'footsteps-outline',
    title: 'Do small sidequests',
    body: 'Real-world actions you can finish today — no points, no streaks.',
  },
  {
    icon: 'book-outline',
    title: 'Collect memories',
    body: 'Log a short reflection and a photo, and watch your journey grow.',
  },
];

const SCALE_VALUES: OnboardingScaleAnswer[] = [1, 2, 3, 4, 5];

export default function OnboardingScreen() {
  const router = useRouter();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEditMode = edit === '1';
  const user = useSessionStore((s) => s.user);
  const quests = useQuestDomainStore((s) => s.quests);
  const categories = useQuestDomainStore((s) => s.categories);
  const bootstrap = useQuestDomainStore((s) => s.bootstrap);

  const [step, setStep] = useState(isEditMode ? EDIT_MODE_FIRST_STEP : 0);
  const [selectedCategories, setSelectedCategories] = useState<OnboardingCategory[]>([]);
  const [pace, setPace] = useState<OnboardingPace>('steady');
  const [intensity, setIntensity] = useState<OnboardingIntensity>('balanced');
  const [natureConnection, setNatureConnection] = useState<OnboardingScaleAnswer>(3);
  const [isolation, setIsolation] = useState<OnboardingScaleAnswer>(3);
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const startedTracked = useRef(false);

  function alertCompat(title: string, message: string) {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(`${title}\n\n${message}`);
      return;
    }
    Alert.alert(title, message);
  }

  useEffect(() => {
    let mounted = true;

    if (isEditMode) {
      // Editing existing answers: prefill from the current state instead of
      // checking whether onboarding is complete (it already is).
      getOnboardingState()
        .then((state) => {
          if (!mounted) return;
          setSelectedCategories(state.preferences.categories);
          setPace(state.preferences.pace);
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
        pace,
        natureConnection,
        isolation,
      },
      limit: 3,
    });
  }, [quests, selectedCategories, pace, intensity, natureConnection, isolation]);

  const categoryName = useCallback(
    (categoryId: string) => categories.find((c) => c.id === categoryId)?.name ?? 'Quest',
    [categories]
  );

  const canContinue = useMemo(() => {
    if (step === 2) return selectedCategories.length > 0;
    return true;
  }, [step, selectedCategories.length]);

  async function finishOnboarding() {
    setSubmitError(null);
    setSaving(true);
    try {
      await saveOnboardingState({
        categories: selectedCategories,
        intensity,
        pace,
        natureConnection,
        isolation,
      });
      trackEvent('onboarding_completed', {
        sourceScreen: isEditMode ? 'onboarding_edit' : 'onboarding',
        categoryCount: selectedCategories.length,
        preferredCategories: selectedCategories,
        pacePreference: pace,
        intensityPreference: intensity,
      }).catch(() => undefined);
      if (isEditMode) {
        router.back();
      } else {
        router.replace('/(tabs)/explore');
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Try again.';
      logError('onboarding.finishOnboarding', e, {
        categoryCount: selectedCategories.length,
      });
      setSubmitError(message);
      alertCompat('Could not save onboarding', message);
    } finally {
      setSaving(false);
    }
  }

  function goBack() {
    if (isEditMode && step <= EDIT_MODE_FIRST_STEP) {
      router.back();
      return;
    }
    setStep((s) => s - 1);
  }

  if (checking) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <ActivityIndicator color={Theme.accent} />
        </View>
      </SafeAreaView>
    );
  }

  const isWelcome = step === 0;
  const isFirstVisibleStep = isEditMode ? step === EDIT_MODE_FIRST_STEP : step === 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>Side Quest Life</Text>
        <ProgressDots step={step} startAt={isEditMode ? EDIT_MODE_FIRST_STEP : 0} />
        {submitError ? <Text style={styles.errorBanner}>{submitError}</Text> : null}

        {isWelcome ? (
          <View style={styles.stepWrap}>
            <ImageBackground source={MAP_BACKGROUND} style={styles.hero} imageStyle={styles.heroImage}>
              <View style={styles.heroScrim} />
            </ImageBackground>
            <Text style={styles.headline}>Turn ordinary days into small adventures.</Text>
            <Text style={styles.lead}>
              Side Quest Life nudges you toward tiny real-world quests — then helps you
              remember them. Answer a few questions and we&apos;ll shape a map that fits you.
            </Text>
          </View>
        ) : null}

        {step === 1 ? (
          <View style={styles.stepWrap}>
            <Text style={styles.headline}>How it works</Text>
            <View style={styles.featureList}>
              {FEATURE_ROWS.map((row) => (
                <View key={row.title} style={styles.featureRow}>
                  <View style={styles.featureIcon}>
                    <Ionicons name={row.icon} size={22} color={Theme.accent} />
                  </View>
                  <View style={styles.featureText}>
                    <Text style={styles.featureTitle}>{row.title}</Text>
                    <Text style={styles.featureBody}>{row.body}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.stepWrap}>
            <Text style={styles.headline}>How do you want to spend more time?</Text>
            <Text style={styles.subtext}>Pick the kinds of quests you&apos;d enjoy. Choose at least one.</Text>
            <View style={styles.choiceWrap}>
              {CATEGORY_OPTIONS.map((option) => {
                const selected = selectedCategories.includes(option.slug);
                const accent = categoryAccentForCategoryId(`cat-${option.slug}`);
                return (
                  <Pressable
                    key={option.slug}
                    onPress={() => toggleCategory(option.slug)}
                    style={({ pressed }) => [
                      styles.optionRow,
                      selected && { borderColor: accent, backgroundColor: `${accent}1a` },
                      pressed && styles.pressed,
                    ]}>
                    <View style={[styles.optionIcon, { backgroundColor: `${accent}22` }]}>
                      <FontAwesome
                        name={categoryIconNameForCategoryId(`cat-${option.slug}`)}
                        size={18}
                        color={accent}
                      />
                    </View>
                    <View style={styles.optionText}>
                      <Text style={styles.optionTitle}>{option.label}</Text>
                      <Text style={styles.optionDescription}>{option.description}</Text>
                    </View>
                    <Ionicons
                      name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={22}
                      color={selected ? accent : Theme.border}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.stepWrap}>
            <Text style={styles.headline}>How much time do you want to dedicate?</Text>
            <Text style={styles.subtext}>We&apos;ll match the length of your quests.</Text>
            <View style={styles.choiceWrap}>
              {PACE_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  icon={option.icon}
                  label={option.label}
                  description={option.description}
                  selected={pace === option.value}
                  onPress={() => setPace(option.value)}
                />
              ))}
            </View>
          </View>
        ) : null}

        {step === 4 ? (
          <View style={styles.stepWrap}>
            <Text style={styles.headline}>How bold should your quests be?</Text>
            <Text style={styles.subtext}>This sets how much of a stretch we aim for.</Text>
            <View style={styles.choiceWrap}>
              {INTENSITY_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  icon={option.icon}
                  label={option.label}
                  description={option.description}
                  selected={intensity === option.value}
                  onPress={() => {
                    setIntensity(option.value);
                    trackEvent('intensity_selected', {
                      sourceScreen: 'onboarding',
                      intensityPreference: option.value,
                    }).catch(() => undefined);
                  }}
                />
              ))}
            </View>
          </View>
        ) : null}

        {step === 5 ? (
          <View style={styles.stepWrap}>
            <Text style={styles.headline}>A couple of honest ones.</Text>
            <Text style={styles.subtext}>
              This is just a baseline for you — it doesn&apos;t change which quests you see.
            </Text>
            <View style={styles.choiceWrap}>
              <ScaleQuestion
                prompt="How connected do you feel to nature right now?"
                lowLabel="Not at all"
                highLabel="Very connected"
                value={natureConnection}
                onChange={setNatureConnection}
              />
              <ScaleQuestion
                prompt="How often have you recently felt lonely or isolated?"
                lowLabel="Rarely"
                highLabel="Very often"
                value={isolation}
                onChange={setIsolation}
              />
            </View>
          </View>
        ) : null}

        {step === 6 ? (
          <View style={styles.stepWrap}>
            <Text style={styles.headline}>
              {isEditMode ? 'Your updated map is ready.' : 'Your map is ready.'}
            </Text>
            <Text style={styles.subtext}>
              Based on your answers, here&apos;s where we&apos;d start. You can always explore the
              rest of the map.
            </Text>
            <View style={styles.choiceWrap}>
              {recommended.length > 0 ? (
                recommended.map((quest) => {
                  const accent = categoryAccentForCategoryId(quest.categoryId);
                  return (
                    <View key={quest.id} style={styles.recommendCard}>
                      <View style={[styles.recommendAccent, { backgroundColor: accent }]} />
                      <View style={styles.recommendBody}>
                        <Text style={styles.recommendMeta}>{categoryName(quest.categoryId)}</Text>
                        <Text style={styles.recommendTitle} numberOfLines={2}>
                          {quest.title}
                        </Text>
                        <Text style={styles.recommendSub} numberOfLines={2}>
                          {quest.shortDescription}
                        </Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={styles.recommendEmpty}>
                  <Ionicons name="sparkles-outline" size={22} color={Theme.accent} />
                  <Text style={styles.recommendEmptyText}>
                    Your quests are loading — tap below to jump into your map.
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.footnote}>
              Just a starting point — every quest stays open, and you can update your
              answers anytime.
            </Text>
          </View>
        ) : null}

        <View style={styles.footer}>
          {!isFirstVisibleStep ? (
            <Pressable
              onPress={goBack}
              disabled={saving}
              style={({ pressed }) => [
                styles.secondaryBtn,
                pressed && styles.pressed,
                saving && styles.ctaDisabled,
              ]}>
              <Text style={styles.secondaryBtnText}>Back</Text>
            </Pressable>
          ) : (
            <View style={styles.footerSpacer} />
          )}

          {step < TOTAL_STEPS - 1 ? (
            <Pressable
              onPress={() => setStep((s) => s + 1)}
              disabled={!canContinue || saving}
              style={({ pressed }) => [
                styles.cta,
                pressed && styles.pressed,
                (!canContinue || saving) && styles.ctaDisabled,
              ]}>
              <Text style={styles.ctaText}>{isWelcome ? 'Get started' : 'Next'}</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={finishOnboarding}
              disabled={saving}
              style={({ pressed }) => [
                styles.cta,
                pressed && styles.pressed,
                saving && styles.ctaDisabled,
              ]}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.ctaText}>
                  {isEditMode ? 'Save changes' : 'Start exploring'}
                </Text>
              )}
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function OptionCard({
  icon,
  label,
  description,
  selected,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionRow,
        selected && styles.optionRowSelected,
        pressed && styles.pressed,
      ]}>
      <View style={[styles.optionIcon, selected && styles.optionIconSelected]}>
        <Ionicons name={icon} size={20} color={selected ? '#fff' : Theme.accent} />
      </View>
      <View style={styles.optionText}>
        <Text style={styles.optionTitle}>{label}</Text>
        <Text style={styles.optionDescription}>{description}</Text>
      </View>
      <Ionicons
        name={selected ? 'checkmark-circle' : 'ellipse-outline'}
        size={22}
        color={selected ? Theme.accent : Theme.border}
      />
    </Pressable>
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
              accessibilityRole="button"
              accessibilityLabel={`${n} of 5`}
              onPress={() => onChange(n)}
              style={({ pressed }) => [
                styles.scaleDot,
                selected && styles.scaleDotSelected,
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.scaleDotText, selected && styles.scaleDotTextSelected]}>
                {n}
              </Text>
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

function ProgressDots({ step, startAt }: { step: number; startAt: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: TOTAL_STEPS - startAt }).map((_, i) => (
        <View key={i} style={[styles.dot, i <= step - startAt && styles.dotActive]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  kicker: {
    fontSize: 13,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Theme.textMuted,
    marginBottom: 12,
  },
  dots: { flexDirection: 'row', gap: 6, marginTop: 2 },
  dot: {
    flex: 1,
    height: 4,
    borderRadius: 99,
    backgroundColor: Theme.border,
  },
  dotActive: { backgroundColor: Theme.accent },
  stepWrap: { marginTop: 24, marginBottom: 8 },
  hero: {
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.surface,
  },
  heroImage: { borderRadius: 20 },
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16, 24, 18, 0.28)',
  },
  headline: {
    fontSize: 26,
    lineHeight: 33,
    fontWeight: '700',
    color: Theme.text,
    marginBottom: 12,
  },
  lead: {
    fontSize: 16,
    lineHeight: 24,
    color: Theme.textMuted,
  },
  subtext: {
    fontSize: 15,
    lineHeight: 22,
    color: Theme.textMuted,
    marginBottom: 18,
  },
  errorBanner: {
    marginTop: 12,
    marginBottom: 6,
    backgroundColor: '#fdecea',
    color: Theme.danger,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  featureList: { gap: 14, marginTop: 4 },
  featureRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 16,
    padding: 16,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.accentSoft,
  },
  featureText: { flex: 1, minWidth: 0 },
  featureTitle: { fontSize: 17, fontWeight: '700', color: Theme.text, marginBottom: 4 },
  featureBody: { fontSize: 14, lineHeight: 20, color: Theme.textMuted },
  choiceWrap: { gap: 10 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 16,
    backgroundColor: Theme.surface,
    padding: 14,
  },
  optionRowSelected: {
    borderColor: Theme.accent,
    backgroundColor: Theme.accentSoft,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.accentSoft,
  },
  optionIconSelected: { backgroundColor: Theme.accent },
  optionText: { flex: 1, minWidth: 0 },
  optionTitle: { fontSize: 17, color: Theme.text, fontWeight: '600', marginBottom: 2 },
  optionDescription: { fontSize: 14, color: Theme.textMuted, lineHeight: 19 },
  scaleCard: {
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 16,
    backgroundColor: Theme.surface,
    padding: 16,
    gap: 12,
  },
  scalePrompt: { fontSize: 16, fontWeight: '600', color: Theme.text, lineHeight: 22 },
  scaleRow: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  scaleDot: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.border,
    backgroundColor: Theme.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleDotSelected: { backgroundColor: Theme.accent, borderColor: Theme.accent },
  scaleDotText: { fontSize: 16, fontWeight: '700', color: Theme.textMuted },
  scaleDotTextSelected: { color: '#fff' },
  scaleLabelsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  scaleEdgeLabel: { fontSize: 12, color: Theme.textMuted },
  recommendCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.border,
    backgroundColor: Theme.surface,
    overflow: 'hidden',
  },
  recommendAccent: { width: 5 },
  recommendBody: { flex: 1, padding: 14, gap: 4, minWidth: 0 },
  recommendMeta: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  recommendTitle: { fontSize: 16, fontWeight: '700', color: Theme.text, lineHeight: 20 },
  recommendSub: { fontSize: 14, color: Theme.textMuted, lineHeight: 19 },
  recommendEmpty: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.border,
    backgroundColor: Theme.surface,
    padding: 16,
  },
  recommendEmptyText: { flex: 1, fontSize: 14, lineHeight: 20, color: Theme.textMuted },
  footnote: {
    marginTop: 16,
    fontSize: 13,
    lineHeight: 19,
    color: Theme.textMuted,
  },
  footer: {
    marginTop: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  footerSpacer: { flex: 1 },
  cta: {
    flex: 1,
    backgroundColor: Theme.accent,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  ctaDisabled: { opacity: 0.5 },
  secondaryBtn: {
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.border,
    backgroundColor: Theme.surface,
  },
  secondaryBtnText: { color: Theme.text, fontSize: 16, fontWeight: '600' },
  pressed: { opacity: 0.85 },
});
