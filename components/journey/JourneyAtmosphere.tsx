import { ImageBackground, StyleSheet, View } from 'react-native';
import Reanimated from 'react-native-reanimated';

import type { JourneyMoodColors } from '@/src/features/journey/journeyVisualMood';
import type { JourneyVisualState } from '@/src/features/journey/journeyWorld';

/** Painterly valley path — replace file in `assets/images/` to swap art (keep name for zero code churn). */
const JOURNEY_PATH_BACKGROUND = require('@/assets/images/journey-valley-background.png');

type Props = {
  mood: JourneyMoodColors;
  visual: JourneyVisualState;
  animatedStyle: object;
};

export function JourneyAtmosphere({ mood, visual, animatedStyle }: Props) {
  return (
    <Reanimated.View style={[styles.fillLayer, animatedStyle]} pointerEvents="none">
      <ImageBackground
        source={JOURNEY_PATH_BACKGROUND}
        style={styles.fillLayer}
        resizeMode="cover"
        accessibilityIgnoresInvertColors>
        <View style={styles.fillLayer} pointerEvents="none">
          <View style={[styles.fillLayer, { backgroundColor: mood.fogTint }]} />
          {visual.environmentLayers.map((layer, i) => (
            <View
              key={`env:${i}`}
              style={[styles.fillLayer, { backgroundColor: layer.color, opacity: Math.min(0.07, layer.opacity * 0.45) }]}
            />
          ))}
        </View>
      </ImageBackground>
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
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
