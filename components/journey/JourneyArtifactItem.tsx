import { useEffect } from 'react';
import { Pressable } from 'react-native';
import Reanimated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { JourneyArtifactGlyph } from '@/components/journey/JourneyArtifactGlyph';
import type { JourneyArtifact } from '@/src/features/journey/journeyArtifacts';
import { scaleAtT } from '@/src/features/journey/journeyPathGeometry';

type Props = {
  artifact: JourneyArtifact;
  index: number;
  left: number;
  top: number;
  width: number;
  uiScale: number;
  onOpenMemory: (id: string) => void;
  onOpenQuest: (id: string) => void;
};

const REVEAL_MS = 580;
const RIPPLE_OUT_MS = 360;
const RIPPLE_FADE_MS = 500;

export function JourneyArtifactItem({ artifact, index, left, top, width, uiScale, onOpenMemory, onOpenQuest }: Props) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const ripple = useSharedValue(0);

  useEffect(() => {
    const delay = Math.min(index, 18) * 36;
    const t = setTimeout(() => {
      opacity.value = withTiming(1, { duration: REVEAL_MS, easing: Easing.out(Easing.cubic) });
      scale.value = withTiming(1, { duration: REVEAL_MS + 40, easing: Easing.out(Easing.cubic) });
      ripple.value = withSequence(
        withTiming(1, { duration: RIPPLE_OUT_MS, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: RIPPLE_FADE_MS, easing: Easing.in(Easing.quad) })
      );
    }, delay);
    return () => clearTimeout(t);
  }, [index, opacity, ripple, scale]);

  const shellStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ripple.value * 0.62,
    transform: [{ scale: 1 + ripple.value * 0.58 }],
  }));

  const sc = scaleAtT(artifact.pathT);
  const basePx = (artifact.size === 'landmark' ? 108 : artifact.size === 'medium' ? 66 : 44) * uiScale;
  const px = basePx * sc * (0.94 + Math.min(1, width / 390) * 0.1);
  const box = px * 1.42;

  return (
    <Reanimated.View
      style={[
        {
          position: 'absolute',
          left,
          top,
          width: box,
          minHeight: box * 1.05,
          alignItems: 'center',
          justifyContent: 'center',
        },
        shellStyle,
      ]}>
      <Reanimated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            width: box * 1.55,
            height: box * 1.55,
            borderRadius: 999,
            borderWidth: Math.max(1.5, 2 * uiScale),
            borderColor: 'rgba(255,236,210,0.55)',
          },
          ringStyle,
        ]}
      />
      <Pressable
        onPress={() =>
          artifact.linkedMemoryId ? onOpenMemory(artifact.linkedMemoryId) : onOpenQuest(artifact.linkedQuestId)
        }
        accessibilityRole="button"
        accessibilityLabel={artifact.linkedMemoryId ? 'Open linked memory' : 'Open completed quest'}
        style={({ pressed }) => [{ alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.9 : 1 }]}>
        <JourneyArtifactGlyph artifact={artifact} pixelScale={px} />
      </Pressable>
    </Reanimated.View>
  );
}
