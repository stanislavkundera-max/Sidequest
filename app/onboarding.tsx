import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Theme } from '@/constants/Theme';
import { getOnboardingComplete } from '@/lib/onboarding';
import { saveOnboardingState } from '@/src/features/onboarding';
import { trackEvent } from '@/src/lib/analytics';
import { logError } from '@/src/lib/monitoring/errorLogger';
import type {
  OnboardingCategory,
  OnboardingIntensity,
} from '@/src/features/onboarding';

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<OnboardingCategory[]>([
    'nature',
    'adventure',
  ]);
  const [intensity, setIntensity] = useState<OnboardingIntensity>('balanced');
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
    getOnboardingComplete()
      .then((done: boolean) => {
        if (!mounted) return;
        if (done) {
          trackEvent('onboarding_skipped', { sourceScreen: 'onboarding' }).catch(
            () => undefined
          );
          router.replace('/(tabs)');
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
  }, [router]);

  useEffect(() => {
    if (checking || startedTracked.current) return;
    startedTracked.current = true;
    trackEvent('onboarding_started', { sourceScreen: 'onboarding' }).catch(
      () => undefined
    );
  }, [checking]);

  const canContinue = useMemo(() => {
    if (step === 1) return categories.length > 0;
    return true;
  }, [step, categories.length]);

  async function finishOnboarding() {
    setSubmitError(null);
    setSaving(true);
    try {
      await saveOnboardingState({ categories, intensity });
      trackEvent('onboarding_completed', {
        sourceScreen: 'onboarding',
        categoryCount: categories.length,
        preferredCategories: categories,
        intensityPreference: intensity,
      }).catch(() => undefined);
      router.replace('/(tabs)');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Try again.';
      logError('onboarding.finishOnboarding', e, {
        categoryCount: categories.length,
        intensity,
      });
      setSubmitError(message);
      alertCompat('Could not save onboarding', message);
    } finally {
      setSaving(false);
    }
  }

  if (checking) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Theme.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.kicker}>Side Quest Life</Text>
        <ProgressDots step={step} />
        {submitError ? <Text style={styles.errorBanner}>{submitError}</Text> : null}

        {step === 0 ? (
          <View style={styles.stepWrap}>
            <Text style={styles.headline}>
              Build a life map through small real-world quests.
            </Text>
            <View style={styles.block}>
              <Bullet text="Action first: concrete quests you can do today." />
              <Bullet text="Memory logging is core: short reflection, optional photo." />
              <Bullet text="No streak pressure, no points, no noisy rewards." />
            </View>
          </View>
        ) : null}

        {step === 1 ? (
          <View style={styles.stepWrap}>
            <Text style={styles.headline}>Pick your preferred categories.</Text>
            <Text style={styles.subtext}>Choose at least one.</Text>
            <View style={styles.choiceWrap}>
              <SelectableChip
                label="Nature"
                selected={categories.includes('nature')}
                onPress={() => {
                  const next = toggleCategory('nature', categories, setCategories);
                  trackEvent('category_preferences_selected', {
                    sourceScreen: 'onboarding',
                    preferredCategories: next,
                  }).catch(() => undefined);
                }}
              />
              <SelectableChip
                label="Adventure"
                selected={categories.includes('adventure')}
                onPress={() => {
                  const next = toggleCategory('adventure', categories, setCategories);
                  trackEvent('category_preferences_selected', {
                    sourceScreen: 'onboarding',
                    preferredCategories: next,
                  }).catch(() => undefined);
                }}
              />
              <SelectableChip
                label="Social"
                selected={categories.includes('social')}
                onPress={() => {
                  const next = toggleCategory('social', categories, setCategories);
                  trackEvent('category_preferences_selected', {
                    sourceScreen: 'onboarding',
                    preferredCategories: next,
                  }).catch(() => undefined);
                }}
              />
              <SelectableChip
                label="Relax"
                selected={categories.includes('relax')}
                onPress={() => {
                  const next = toggleCategory('relax', categories, setCategories);
                  trackEvent('category_preferences_selected', {
                    sourceScreen: 'onboarding',
                    preferredCategories: next,
                  }).catch(() => undefined);
                }}
              />
            </View>
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.stepWrap}>
            <Text style={styles.headline}>Choose intensity.</Text>
            <Text style={styles.subtext}>
              You can change this later in your profile.
            </Text>
            <View style={styles.choiceWrap}>
              <SelectableRow
                label="Light"
                description="Gentle quests with low friction."
                selected={intensity === 'light'}
                onPress={() => {
                  setIntensity('light');
                  trackEvent('intensity_selected', {
                    sourceScreen: 'onboarding',
                    intensityPreference: 'light',
                  }).catch(() => undefined);
                }}
              />
              <SelectableRow
                label="Balanced"
                description="A practical mix for most weeks."
                selected={intensity === 'balanced'}
                onPress={() => {
                  setIntensity('balanced');
                  trackEvent('intensity_selected', {
                    sourceScreen: 'onboarding',
                    intensityPreference: 'balanced',
                  }).catch(() => undefined);
                }}
              />
              <SelectableRow
                label="Bold"
                description="More challenging and exploratory."
                selected={intensity === 'bold'}
                onPress={() => {
                  setIntensity('bold');
                  trackEvent('intensity_selected', {
                    sourceScreen: 'onboarding',
                    intensityPreference: 'bold',
                  }).catch(() => undefined);
                }}
              />
            </View>
          </View>
        ) : null}

        <View style={styles.footer}>
          {step > 0 ? (
            <Pressable
              onPress={() => setStep((s) => s - 1)}
              disabled={saving}
              style={({ pressed }) => [
                styles.secondaryBtn,
                pressed && styles.secondaryBtnPressed,
                saving && styles.ctaDisabled,
              ]}>
              <Text style={styles.secondaryBtnText}>Back</Text>
            </Pressable>
          ) : (
            <View />
          )}

          {step < 2 ? (
            <Pressable
              onPress={() => setStep((s) => s + 1)}
              disabled={!canContinue || saving}
              style={({ pressed }) => [
                styles.cta,
                pressed && styles.ctaPressed,
                (!canContinue || saving) && styles.ctaDisabled,
              ]}>
              <Text style={styles.ctaText}>Next</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={finishOnboarding}
              disabled={saving}
              style={({ pressed }) => [
                styles.cta,
                pressed && styles.ctaPressed,
                saving && styles.ctaDisabled,
              ]}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.ctaText}>Start quests</Text>
              )}
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function toggleCategory(
  value: OnboardingCategory,
  current: OnboardingCategory[],
  setValue: (next: OnboardingCategory[]) => void
): OnboardingCategory[] {
  if (current.includes(value)) {
    const next = current.filter((c) => c !== value);
    setValue(next);
    return next;
  }
  const next = [...current, value];
  setValue(next);
  return next;
}

function ProgressDots({ step }: { step: number }) {
  return (
    <View style={styles.dots}>
      {[0, 1, 2].map((i) => (
        <Pressable
          key={i}
          style={[styles.dot, i <= step && styles.dotActive]}
        />
      ))}
    </View>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>·</Text>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

function SelectableChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.chipPressed,
      ]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

function SelectableRow({
  label,
  description,
  selected,
  onPress,
}: {
  label: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        selected && styles.rowSelected,
        pressed && styles.rowPressed,
      ]}>
      <Text style={styles.rowTitle}>{label}</Text>
      <Text style={styles.rowDescription}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.bg },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  stepWrap: { marginTop: 24, marginBottom: 18 },
  kicker: {
    fontSize: 13,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Theme.textMuted,
    marginBottom: 12,
  },
  dots: { flexDirection: 'row', gap: 8, marginTop: 2 },
  dot: {
    width: 24,
    height: 4,
    borderRadius: 99,
    backgroundColor: Theme.border,
  },
  dotActive: { backgroundColor: Theme.accent },
  headline: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '600',
    color: Theme.text,
    marginBottom: 28,
  },
  subtext: {
    fontSize: 15,
    lineHeight: 22,
    color: Theme.textMuted,
    marginBottom: 16,
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
  block: { marginBottom: 36, gap: 14 },
  bulletRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  bulletDot: {
    fontSize: 24,
    lineHeight: 28,
    color: Theme.accent,
    marginTop: -2,
  },
  bulletText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: Theme.text,
  },
  choiceWrap: { gap: 10 },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.border,
    backgroundColor: Theme.surface,
  },
  chipSelected: {
    borderColor: Theme.accent,
    backgroundColor: Theme.accentSoft,
  },
  chipPressed: { opacity: 0.9 },
  chipText: {
    fontSize: 16,
    color: Theme.text,
    fontWeight: '500',
  },
  chipTextSelected: { color: Theme.accent, fontWeight: '600' },
  row: {
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 12,
    backgroundColor: Theme.surface,
    padding: 14,
  },
  rowSelected: {
    borderColor: Theme.accent,
    backgroundColor: Theme.accentSoft,
  },
  rowPressed: { opacity: 0.9 },
  rowTitle: { fontSize: 17, color: Theme.text, fontWeight: '600', marginBottom: 4 },
  rowDescription: { fontSize: 14, color: Theme.textMuted, lineHeight: 20 },
  footer: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cta: {
    backgroundColor: Theme.accent,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaPressed: { opacity: 0.9 },
  ctaDisabled: { opacity: 0.5 },
  ctaText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryBtn: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.border,
    backgroundColor: Theme.surface,
  },
  secondaryBtnPressed: { opacity: 0.9 },
  secondaryBtnText: { color: Theme.text, fontSize: 16, fontWeight: '600' },
});
