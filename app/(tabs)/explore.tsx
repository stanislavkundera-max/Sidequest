import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExploreMapScene } from '@/components/explore/ExploreMapScene';
import { ExploreQuestPanel } from '@/components/explore/ExploreQuestPanel';
import { EmptyState } from '@/components/ui/EmptyState';
import { Theme } from '@/constants/Theme';
import { getOnboardingState } from '@/lib/onboarding';
import { categoryAccentForCategoryId } from '@/lib/categoryAccent';
import { EXPLORE_MAP_MARKERS } from '@/src/constants/exploreMapMarkers';
import {
  loadRevealedCategoryIds,
  markCategoryRevealed,
} from '@/src/features/explore/exploreMapReveal';
import type { OnboardingPreferences } from '@/src/features/onboarding/types';
import { useQuestDomainStore } from '@/src/features/quests/questStore';
import { useSessionStore } from '@/stores/session';

const VALID_CATEGORY_IDS = new Set(EXPLORE_MAP_MARKERS.map((m) => m.categoryId));

export default function ExploreScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const user = useSessionStore((s) => s.user);
  const quests = useQuestDomainStore((s) => s.quests);
  const categories = useQuestDomainStore((s) => s.categories);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [revealedCategoryIds, setRevealedCategoryIds] = useState<Set<string>>(new Set());
  const [preferences, setPreferences] = useState<OnboardingPreferences | null>(null);

  const categoryIdsWithQuests = useMemo(() => {
    const withQuests = new Set(quests.map((q) => q.categoryId));
    return categories.filter((c) => withQuests.has(c.id)).map((c) => c.id);
  }, [categories, quests]);

  useEffect(() => {
    loadRevealedCategoryIds().then(setRevealedCategoryIds).catch(() => undefined);
    getOnboardingState()
      .then((state) => setPreferences(state.preferences))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const param = params.category;
    if (param && VALID_CATEGORY_IDS.has(param) && categoryIdsWithQuests.includes(param)) {
      setSelectedCategoryId(param);
    }
  }, [params.category, categoryIdsWithQuests]);

  const handleSelectCategory = useCallback((categoryId: string) => {
    setSelectedCategoryId(categoryId);
    void markCategoryRevealed(categoryId).then(setRevealedCategoryIds);
  }, []);

  const selectedCategoryName = useMemo(
    () =>
      selectedCategoryId
        ? categories.find((c) => c.id === selectedCategoryId)?.name ?? selectedCategoryId
        : null,
    [categories, selectedCategoryId]
  );

  const selectedQuestCount = useMemo(
    () =>
      selectedCategoryId ? quests.filter((q) => q.categoryId === selectedCategoryId).length : 0,
    [quests, selectedCategoryId]
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.pad}>
          <EmptyState
            title="Sign in required"
            message="Please sign in to explore quests."
            actionLabel="Go to sign in"
            onAction={() => router.replace('/(auth)/sign-in')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.stage}>
        <ExploreMapScene
          selectedCategoryId={selectedCategoryId}
          revealedCategoryIds={revealedCategoryIds}
          onSelectCategory={handleSelectCategory}
        />
        {selectedCategoryId ? (
          <View style={styles.sheet}>
            <View style={styles.grabber} />
            <View style={styles.sheetHeader}>
              <View
                style={[
                  styles.sheetAccent,
                  { backgroundColor: categoryAccentForCategoryId(selectedCategoryId) },
                ]}
              />
              <View style={styles.sheetHeaderText}>
                <Text style={styles.sheetTitle} numberOfLines={1}>
                  {selectedCategoryName}
                </Text>
                <Text style={styles.sheetSubtitle}>
                  {selectedQuestCount === 1 ? '1 quest' : `${selectedQuestCount} quests`}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close quest panel"
                hitSlop={8}
                onPress={() => setSelectedCategoryId(null)}
                style={({ pressed }) => [styles.sheetClose, pressed && styles.sheetClosePressed]}>
                <Ionicons name="close" size={18} color={Theme.text} />
              </Pressable>
            </View>
            <ExploreQuestPanel
              userId={user.id}
              categoryId={selectedCategoryId}
              preferences={preferences}
              hideHeader
            />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.bg },
  stage: { flex: 1, backgroundColor: Theme.bg },
  pad: { padding: 20 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '64%',
    backgroundColor: Theme.bg,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 16,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: Theme.border,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.border,
  },
  sheetAccent: {
    width: 6,
    height: 32,
    borderRadius: 3,
  },
  sheetHeaderText: { flex: 1, minWidth: 0 },
  sheetTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    fontWeight: '800',
    color: Theme.text,
    letterSpacing: 0.2,
  },
  sheetSubtitle: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Theme.textMuted,
  },
  sheetClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.accentSoft,
  },
  sheetClosePressed: { opacity: 0.6 },
});
