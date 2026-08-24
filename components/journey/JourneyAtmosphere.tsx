import { Image, StyleSheet, View } from 'react-native';
import Reanimated from 'react-native-reanimated';

import type { JourneyCoverLayout } from '@/src/features/journey/journeyBackgroundFit';
import type { JourneyMoodColors } from '@/src/features/journey/journeyVisualMood';
import type { JourneyVisualState } from '@/src/features/journey/journeyWorld';

/** Painterly valley path — replace file in `assets/images/` to swap art (keep name for zero code churn). */
const JOURNEY_PATH_BACKGROUND = require('@/assets/images/journey-valley-background.png');

type Props = {
  mood: JourneyMoodColors;
  visual: JourneyVisualState;
  animatedStyle: object;
  /**
   * The same layout the path markers are placed with. Positioning the bitmap
   * from it (instead of `resizeMode="cover"`, which always centers) is what
   * keeps art and markers in register when the crop is bottom-anchored.
   */
  layout: JourneyCoverLayout;
};

export function JourneyAtmosphere({ mood, visual, animatedStyle, layout }: Props) {
  return (
    <Reanimated.View style={[styles.fillLayer, animatedStyle]} pointerEvents="none">
      <View style={styles.clip} pointerEvents="none">
        <Image
          source={JOURNEY_PATH_BACKGROUND}
          style={{
            position: 'absolute',
            left: layout.offX,
            top: layout.offY,
            width: layout.drawnW,
            height: layout.drawnH,
          }}
          resizeMode="stretch"
          accessibilityIgnoresInvertColors
        />
        <View style={[styles.fillLayer, { backgroundColor: mood.fogTint }]} />
        {visual.environmentLayers.map((layer, i) => (
          <View
            key={`env:${i}`}
            style={[styles.fillLayer, { backgroundColor: layer.color, opacity: Math.min(0.07, layer.opacity * 0.45) }]}
          />
        ))}
      </View>
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  clip: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
  fillLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
});
