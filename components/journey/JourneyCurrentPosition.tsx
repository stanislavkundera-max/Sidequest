import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Reanimated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { Theme } from '@/constants/Theme';

type Props = {
  x: number;
  y: number;
  ringPx: number;
};

/** Strongest focal point: current step along the shared path. */
export function JourneyCurrentPosition({ x, y, ringPx }: Props) {
  const breathe = useSharedValue(1);

  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 9000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 9000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [breathe]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathe.value }],
    opacity: 0.55 + (breathe.value - 1) * 2.5,
  }));

  const outer = ringPx * 1.35;
  return (
    <View
      pointerEvents="none"
      style={[styles.wrap, { left: x - outer / 2, top: y - outer / 2, width: outer, height: outer }]}>
      <Reanimated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderRadius: outer / 2,
            borderWidth: 3,
            borderColor: Theme.accent,
          },
          ringStyle,
        ]}
      />
      <View
        style={[
          styles.core,
          {
            width: ringPx * 0.42,
            height: ringPx * 0.42,
            borderRadius: ringPx * 0.21,
            top: outer / 2 - (ringPx * 0.42) / 2,
            left: outer / 2 - (ringPx * 0.42) / 2,
            backgroundColor: '#f4f1ec',
            borderWidth: 2,
            borderColor: Theme.accent,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  core: { position: 'absolute' },
});
