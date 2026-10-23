import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExploreMapScene } from '@/components/explore/ExploreMapScene';
import { ExploreQuestPanel } from '@/components/explore/ExploreQuestPanel';
import { InMotionCarousel } from '@/components/explore/InMotionCarousel';
import { CategoryMapMarkerGlyph } from '@/components/explore/CategoryMapMarkerGlyph';
import { useQuestActions } from '@/components/quests/useQuestActions';
import { gradientStyle } from '@/components/ui/DawnBackground';
import { EmptyState } from '@/components/ui/EmptyState';
import { Dawn, Theme } from '@/constants/Theme';
import { getOnboardingState } from '@/lib/onboarding';
import { categoryAccentForCategoryId } from '@/lib/categoryAccent';
import { EXPLORE_MAP_MARKERS } from '@/src/constants/exploreMapMarkers';
import {
  loadRevealedCategoryIds,
  markCategoryRevealed,
} from '@/src/features/explore/exploreMapReveal';
import type { OnboardingPreferences } from '@/src/features/onboarding/types';
import { useQuestDomainStore } from '@/src/features/quests/questStore';
import { questsInMotionInCategory } from '@/src/features/quests/suggestedQuests';
import { useSessionStore } from '@/stores/session';

const VALID_CATEGORY_IDS = new Set(EXPLORE_MAP_MARKERS.map((m) => m.categoryId));

export default function ExploreScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const user = useSessionStore((s) => s.user);
  const quests = useQuestDomainStore((s) => s.quests);
  const categories = useQuestDomainStore((s) => s.categories);
  const userQuests = useQuestDomainStore((s) => s.userQuests);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [revealedCategoryIds, setRevealedCategoryIds] = useState<Set<string>>(new Set());
  const [preferences, setPreferences] = useState<OnboardingPreferences | null>(null);
  // Called unconditionally (rules of hooks); the signed-out return below keeps it idle.
  const carouselActions = useQuestActions(user?.id ?? '', 'explore');

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

  // The grey bar reads as "pull me down", so pulling down closes the panel (round 2b, Eva: "mám
  // tendenci vždycky to jen protáhnout dolů abych se z toho dostala pryč. Ale nefunguje to").
  // Only the bar and the header take the drag; the quest list below keeps its own scrolling.
  const sheetDrag = useSharedValue(0);
  const sheetDragStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetDrag.value }],
  }));
  const closeSheet = useCallback(() => setSelectedCategoryId(null), []);
  // A new panel always opens in place, whatever the last one was dragged to.
  useEffect(() => {
    sheetDrag.value = 0;
  }, [selectedCategoryId, sheetDrag]);
  const sheetPan = useMemo(
    () =>
      PanResponder.create({
        // Claimed on touch-down: react-native-web never hands a move to a parent that did not
        // hold the touch from the start. The close button inside still takes its own taps.
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_e, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_e, g) => {
          sheetDrag.value = Math.max(0, g.dy);
        },
        onPanResponderRelease: (_e, g) => {
          if (g.dy > 90 || g.vy > 0.9) {
            sheetDrag.value = withTiming(800, { duration: 180 });
            setTimeout(closeSheet, 180);
          } else {
            sheetDrag.value = withSpring(0, { damping: 18, stiffness: 180 });
          }
        },
        onPanResponderTerminate: () => {
          sheetDrag.value = withSpring(0, { damping: 18, stiffness: 180 });
        },
      }),
    [closeSheet, sheetDrag]
  );

  // What you have going on in the place — the panel's content (task 46). It used to count the
  // whole category in the catalogue ("10 quests") while at most five were ever on offer.
  const selectedCounts = useMemo(() => {
    if (!selectedCategoryId) return { going: 0, paused: 0 };
    const here = questsInMotionInCategory({ catalog: quests, userQuests, categoryId: selectedCategoryId });
    const going = here.filter((uq) => uq.status === 'active').length;
    return { going, paused: here.length - going };
  }, [quests, userQuests, selectedCategoryId]);

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
        {!selectedCategoryId ? <InMotionCarousel actions={carouselActions} /> : null}
        {selectedCategoryId ? (
          <Animated.View style={[styles.sheet, gradientStyle(SHEET_BG), sheetDragStyle]}>
            <View style={[styles.sheetStrip, gradientStyle(SHEET_STRIP)]} />
            <View {...sheetPan.panHandlers}>
            <View style={styles.grabberArea}>
              <View style={styles.grabber} />
            </View>
            <View style={styles.sheetHeader}>
              <View
                style={[
                  styles.sheetIcon,
                  { backgroundColor: categoryAccentForCategoryId(selectedCategoryId) },
                ]}>
                <CategoryMapMarkerGlyph categoryId={selectedCategoryId} color="#ffffff" size={20} />
              </View>
              <View style={styles.sheetHeaderText}>
                <Text style={styles.sheetTitle} numberOfLines={1}>
                  {selectedCategoryName}
                </Text>
                <Text style={styles.sheetSubtitle}>
                  {selectedCounts.going + selectedCounts.paused === 0
                    ? 'Nothing in progress yet'
                    : [
                        selectedCounts.going > 0 ? `${selectedCounts.going} in motion` : null,
                        selectedCounts.paused > 0 ? `${selectedCounts.paused} paused` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close quest panel"
                hitSlop={8}
                onPress={() => setSelectedCategoryId(null)}
                style={({ pressed }) => [styles.sheetClose, pressed && styles.sheetClosePressed]}>
                <Ionicons name="close" size={20} color={Theme.text} />
              </Pressable>
            </View>
            </View>
            <ExploreQuestPanel
              userId={user.id}
              categoryId={selectedCategoryId}
              preferences={preferences}
              hideHeader
            />
          </Animated.View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const SHEET_BG = `radial-gradient(90% 70% at 100% 100%, rgba(240, 150, 120, 0.22) 0%, rgba(240, 150, 120, 0) 72%), linear-gradient(180deg, ${Dawn.ground[0]} 0%, ${Dawn.ground[1]} 55%, ${Dawn.ground[2]} 100%)`;
const SHEET_STRIP = 'linear-gradient(90deg, #d79a8c, #f8dcaa)';

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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    boxShadow: '0 -10px 30px rgba(20, 18, 10, 0.45)',
  },
  // The sunrise as a thin band along the sheet's top edge.
  sheetStrip: { height: 6 },
  grabberArea: { alignItems: 'center', paddingTop: 8, paddingBottom: 4 },
  grabber: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(243, 242, 236, 0.25)',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 12,
  },
  sheetIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetHeaderText: { flex: 1, minWidth: 0 },
  sheetTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(243, 242, 236, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(243, 242, 236, 0.4)',
  },
  sheetClosePressed: { opacity: 0.6 },
});
