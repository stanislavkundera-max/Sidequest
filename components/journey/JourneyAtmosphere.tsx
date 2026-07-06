import { ImageBackground, StyleSheet, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
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
  const onAtmosphereLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    // #region agent log
    fetch('http://127.0.0.1:7500/ingest/3d411866-325f-41a4-a403-81f0aa743cd9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'cab87e'},body:JSON.stringify({sessionId:'cab87e',runId:'pre-fix-1',hypothesisId:'H3',location:'components/journey/JourneyAtmosphere.tsx:onAtmosphereLayout',message:'Atmosphere container layout',data:{width,height},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  };
  const onBackgroundLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    // #region agent log
    fetch('http://127.0.0.1:7500/ingest/3d411866-325f-41a4-a403-81f0aa743cd9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'cab87e'},body:JSON.stringify({sessionId:'cab87e',runId:'pre-fix-1',hypothesisId:'H4',location:'components/journey/JourneyAtmosphere.tsx:onBackgroundLayout',message:'ImageBackground layout',data:{width,height,resizeMode:'cover'},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  };
  return (
    <Reanimated.View style={[styles.fillLayer, animatedStyle]} pointerEvents="none" onLayout={onAtmosphereLayout}>
      <ImageBackground
        source={JOURNEY_PATH_BACKGROUND}
        style={styles.fillLayer}
        resizeMode="cover"
        onLayout={onBackgroundLayout}
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
