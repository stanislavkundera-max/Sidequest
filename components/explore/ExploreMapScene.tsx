import { useCallback, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';

import { CategoryMapMarker } from '@/components/explore/CategoryMapMarker';
import { ExploreMapBackground } from '@/components/explore/ExploreMapBackground';
import { gradientStyle } from '@/components/ui/DawnBackground';
import { Dawn, Theme } from '@/constants/Theme';
import {
  EXPLORE_COPY,
  EXPLORE_MAP_MARKERS,
  EXPLORE_MAP_SOURCE_SIZE,
} from '@/src/constants/exploreMapMarkers';
import {
  imageNormToViewPixels,
  journeyBackgroundCoverLayout,
} from '@/src/features/journey/journeyBackgroundFit';
import { countCompletedJourneySteps } from '@/src/features/quests/questHelpers';
import { useQuestDomainStore } from '@/src/features/quests/questStore';

type Props = {
  selectedCategoryId: string | null;
  revealedCategoryIds: Set<string>;
  onSelectCategory: (categoryId: string) => void;
};

export function ExploreMapScene({
  selectedCategoryId,
  revealedCategoryIds,
  onSelectCategory,
}: Props) {
  const categories = useQuestDomainStore((s) => s.categories);
  const userQuests = useQuestDomainStore((s) => s.userQuests);
  const getQuestById = useQuestDomainStore((s) => s.getQuestById);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [measured, setMeasured] = useState({ w: 0, h: 0 });
  const [infoOpen, setInfoOpen] = useState(false);

  const onMapLayout = useCallback((e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    const h = Math.round(e.nativeEvent.layout.height);
    setMeasured((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
  }, []);

  // The map fills the screen, so the window is a good stand-in until `onLayout`
  // reports. Falling back matters: `onLayout` does not fire in every
  // environment, and gating on it alone renders the map with no markers at all.
  const size = {
    w: measured.w > 0 ? measured.w : windowWidth,
    h: measured.h > 0 ? measured.h : windowHeight,
  };

  const layout = useMemo(() => {
    if (size.w <= 0 || size.h <= 0) return null;
    return journeyBackgroundCoverLayout(
      size.w,
      size.h,
      EXPLORE_MAP_SOURCE_SIZE.width,
      EXPLORE_MAP_SOURCE_SIZE.height
    );
  }, [size.w, size.h]);

  // How far the quest in motion in each place has got — the marker draws it as an arc. With two
  // going in one place the one started first shows; paused quests don't count (they are not
  // in motion, task 46).
  const inMotionProgress = useMemo(() => {
    const out = new Map<string, number>();
    const active = userQuests
      .filter((uq) => uq.status === 'active')
      .sort((a, b) => a.startedAt.localeCompare(b.startedAt));
    for (const uq of active) {
      const q = getQuestById(uq.questId);
      const cid = uq.snapshotCategoryId || q?.categoryId;
      if (!cid || out.has(cid)) continue;
      const total = q?.actionSteps.length ?? 0;
      // A quest just begun still shows a sliver, so the arc never reads as empty.
      out.set(cid, total > 0 ? Math.max(0.12, countCompletedJourneySteps(uq, q!) / total) : 0.12);
    }
    return out;
  }, [userQuests, getQuestById]);

  const categoryName = useCallback(
    (categoryId: string) =>
      categories.find((c) => c.id === categoryId)?.name ?? categoryId,
    [categories]
  );

  return (
    <View style={styles.root} onLayout={onMapLayout}>
      <ExploreMapBackground />
      {/* Dawn: the sunrise sky tints the top of the painting, the warm ground the bottom. */}
      <View style={[styles.skyTint, gradientStyle(SKY_TINT)]} pointerEvents="none" />
      <View style={[styles.groundTint, gradientStyle(GROUND_TINT)]} pointerEvents="none" />
      {layout
        ? EXPLORE_MAP_MARKERS.map((marker) => {
            const { x, y } = imageNormToViewPixels(size.w, size.h, marker.u, marker.v, layout);
            return (
              <CategoryMapMarker
                key={marker.categoryId}
                categoryId={marker.categoryId}
                categoryName={categoryName(marker.categoryId)}
                selected={selectedCategoryId === marker.categoryId}
                revealed={revealedCategoryIds.has(marker.categoryId)}
                left={x}
                top={y}
                accessibilityHint={marker.accessibilityHint}
                bounds={size}
                inMotionProgress={inMotionProgress.get(marker.categoryId) ?? null}
                onPress={onSelectCategory}
              />
            );
          })
        : null}
      <View style={styles.infoCorner} pointerEvents="box-none">
        <Pressable
          onPress={() => setInfoOpen((o) => !o)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={infoOpen ? 'Hide map help' : 'What is this map?'}
          style={[styles.infoButton, infoOpen && styles.infoButtonOpen]}>
          <Ionicons
            name={infoOpen ? 'close' : 'information'}
            size={18}
            color={infoOpen ? Dawn.creamText : Theme.text}
          />
        </Pressable>
        {infoOpen ? (
          <Pressable onPress={() => setInfoOpen(false)} style={styles.infoCard}>
            <Text style={styles.title}>{EXPLORE_COPY.title}</Text>
            <Text style={styles.subtitle}>{EXPLORE_COPY.subtitle}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const SKY_TINT = 'linear-gradient(180deg, rgba(71, 83, 107, 0.62) 0%, rgba(127, 122, 150, 0.25) 55%, rgba(127, 122, 150, 0) 100%)';
const GROUND_TINT = 'radial-gradient(80% 90% at 100% 100%, rgba(240, 150, 120, 0.24) 0%, rgba(240, 150, 120, 0) 70%), linear-gradient(0deg, rgba(69, 62, 45, 0.7) 0%, rgba(69, 62, 45, 0.3) 45%, rgba(69, 62, 45, 0) 100%)';

const styles = StyleSheet.create({
  skyTint: { position: 'absolute', top: 0, left: 0, right: 0, height: 130 },
  groundTint: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 300 },
  root: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: Theme.bg,
  },
  // No title on the map itself: the bubbles explain themselves. The explanation waits behind a
  // quiet info button, closed by default (Standa, 2026-09-26).
  infoCorner: {
    position: 'absolute',
    top: 12,
    right: 12,
    alignItems: 'flex-end',
    zIndex: 2,
  },
  infoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 28, 18, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(243, 242, 236, 0.5)',
  },
  infoButtonOpen: {
    backgroundColor: Dawn.cream,
    borderColor: Dawn.cream,
  },
  infoCard: {
    marginTop: 8,
    maxWidth: 260,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: Dawn.cream,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  title: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Dawn.creamText,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
    color: Dawn.creamMuted,
  },
});
