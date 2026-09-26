import { useCallback, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';

import { CategoryMapMarker } from '@/components/explore/CategoryMapMarker';
import { ExploreMapBackground } from '@/components/explore/ExploreMapBackground';
import { Theme } from '@/constants/Theme';
import {
  EXPLORE_COPY,
  EXPLORE_MAP_MARKERS,
  EXPLORE_MAP_SOURCE_SIZE,
} from '@/src/constants/exploreMapMarkers';
import {
  imageNormToViewPixels,
  journeyBackgroundCoverLayout,
} from '@/src/features/journey/journeyBackgroundFit';
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

  const categoryName = useCallback(
    (categoryId: string) =>
      categories.find((c) => c.id === categoryId)?.name ?? categoryId,
    [categories]
  );

  return (
    <View style={styles.root} onLayout={onMapLayout}>
      <ExploreMapBackground />
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
            size={16}
            color={infoOpen ? Theme.text : 'rgba(255, 255, 255, 0.9)'}
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

const styles = StyleSheet.create({
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
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 24, 18, 0.35)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  infoButtonOpen: {
    backgroundColor: 'rgba(252, 251, 248, 0.95)',
    borderColor: Theme.border,
  },
  infoCard: {
    marginTop: 8,
    maxWidth: 260,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(252, 251, 248, 0.95)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.border,
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
    color: Theme.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
    color: Theme.textMuted,
  },
});
