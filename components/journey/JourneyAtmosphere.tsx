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
    <Reanimated.View style={[StyleSheet.absoluteFill, animatedStyle]} pointerEvents="none">
      <ImageBackground
        source={JOURNEY_PATH_BACKGROUND}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        accessibilityIgnoresInvertColors>
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={[StyleSheet.absoluteFill, { backgroundColor: mood.fogTint }]} />
          {visual.environmentLayers.map((layer, i) => (
            <View
              key={`env:${i}`}
              style={[StyleSheet.absoluteFill, { backgroundColor: layer.color, opacity: Math.min(0.07, layer.opacity * 0.45) }]}
            />
          ))}
        </View>
      </ImageBackground>
    </Reanimated.View>
  );
}
