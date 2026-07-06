import { memo } from 'react';
import { ImageBackground, StyleSheet } from 'react-native';

const EXPLORE_MAP_BACKGROUND = require('@/assets/images/explore-map-background.png');

/**
 * Illustrated forest map behind the explore markers.
 * Cover-fit (centered aspect fill) matches `imageNormToViewPixels`, so marker
 * u/v coordinates in `exploreMapMarkers` track the painted landmarks.
 */
export const ExploreMapBackground = memo(function ExploreMapBackground() {
  return (
    <ImageBackground
      source={EXPLORE_MAP_BACKGROUND}
      style={styles.root}
      resizeMode="cover"
    />
  );
});

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
});
