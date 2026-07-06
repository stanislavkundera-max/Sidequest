import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

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
  const [size, setSize] = useState({ w: 0, h: 0 });

  const onMapLayout = useCallback((e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    const h = Math.round(e.nativeEvent.layout.height);
    setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
  }, []);

  const layout = useMemo(() => {
    if (size.w <= 0 || size.h <= 0) return null;
    return journeyBackgroundCoverLayout(
      size.w,
      size.h,
      EXPLORE_MAP_SOURCE_SIZE.width,
      EXPLORE_MAP_SOURCE_SIZE.height
    );
  }, [size]);

  const categoryName = useCallback(
    (categoryId: string) =>
      categories.find((c) => c.id === categoryId)?.name ?? categoryId,
    [categories]
  );

  return (
    <View style={styles.root} onLayout={onMapLayout}>
      <ExploreMapBackground />
      <View style={styles.topScrim} pointerEvents="none" />
      <View style={styles.heroCopy} pointerEvents="none">
        <Text style={styles.title}>{EXPLORE_COPY.title}</Text>
        <Text style={styles.subtitle}>{EXPLORE_COPY.subtitle}</Text>
      </View>
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
                onPress={onSelectCategory}
              />
            );
          })
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: Theme.bg,
  },
  topScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 132,
    backgroundColor: 'rgba(16, 24, 18, 0.42)',
  },
  heroCopy: {
    position: 'absolute',
    top: 14,
    left: 16,
    right: 16,
    zIndex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.92)',
    textShadowColor: 'rgba(0, 0, 0, 0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
});
