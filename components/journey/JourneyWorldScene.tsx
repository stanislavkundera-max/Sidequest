import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { JourneyArtifactLayer } from '@/components/journey/JourneyArtifactLayer';
import { JourneyAtmosphere } from '@/components/journey/JourneyAtmosphere';
import { JourneyNarrative } from '@/components/journey/JourneyNarrative';
import type { JourneyArtifact } from '@/src/features/journey/journeyArtifacts';
import { placeQuestsOnPaintedPath } from '@/src/features/journey/journeyImagePath';
import { journeyUiScale } from '@/src/features/journey/journeyLayoutMetrics';
import { clamp01, mix, type JourneyPathNode } from '@/src/features/journey/journeyPathGeometry';
import { pickJourneyMood } from '@/src/features/journey/journeyVisualMood';
import { getJourneyVisualState } from '@/src/features/journey/journeyWorld';
import type { WorldState } from '@/src/features/journey/journeyWorld';

type JourneyWorldSceneNode = JourneyPathNode & {
  completedAt?: string;
  timeframe: import('@/src/types/quest').QuestTimeframe;
};

function level01(lv: number) {
  return clamp01(lv / 3);
}

function fireflySeeds(count: number) {
  const out: { x: number; y: number; size: number; op: number }[] = [];
  const h = (s: number) => Math.abs(Math.sin(s * 12.9898 + 78.233) * 43758.5453) % 1;
  for (let i = 0; i < count; i++) {
    out.push({
      x: mix(0.08, 0.92, h(i * 2 + 500)),
      y: mix(0.36, 0.84, h(i * 2 + 501)),
      size: mix(1.6, 3, h(i * 2 + 502)),
      op: mix(0.08, 0.28, h(i * 2 + 503)),
    });
  }
  return out;
}

function worldFingerprint(world: WorldState) {
  return `${world.nature.level}-${world.social.level}-${world.adventure.level}-${world.relax.level}-${world.nature.count}-${world.social.count}`;
}

export function JourneyWorldScene({
  layoutWidth,
  layoutHeight,
  world,
  nodes,
  artifacts,
  microLine,
  onOpenTimeline,
  onOpenMemory,
  onOpenQuest,
  onOpenHome,
}: {
  /** Stage width in pixels (full width of the Journey screen). */
  layoutWidth: number;
  /** Full vertical space for the scene. */
  layoutHeight: number;
  world: WorldState;
  nodes: JourneyWorldSceneNode[];
  artifacts: JourneyArtifact[];
  microLine: string;
  onOpenTimeline: () => void;
  onOpenMemory: (id: string) => void;
  onOpenQuest: (id: string) => void;
  onOpenHome: () => void;
}) {
  const useND = Platform.OS !== 'web';
  const uiScale = useMemo(() => journeyUiScale(layoutWidth), [layoutWidth]);
  const width = layoutWidth;
  const height = layoutHeight;

  const mood = useMemo(() => pickJourneyMood(world), [world]);
  const visual = useMemo(() => getJourneyVisualState(world), [world]);
  const n = level01(world.nature.level);
  const r = level01(world.relax.level);
  const completedCount = useMemo(
    () => nodes.filter((n) => n.journeyStatus !== 'active').length,
    [nodes]
  );
  const completionUnit = clamp01(completedCount / 16);

  const pathNodes: JourneyPathNode[] = useMemo(
    () =>
      nodes.map((node) => ({
        userQuestId: node.userQuestId,
        questId: node.questId,
        categoryId: node.categoryId,
        memory: node.memory,
        journeyStatus: node.journeyStatus,
      })),
    [nodes]
  );
  const placements = useMemo(() => placeQuestsOnPaintedPath(pathNodes), [pathNodes]);

  const fireflyWeight = clamp01(n * 0.9 + r * 0.5);
  const fireflyCount = Math.round(mix(0, 7, fireflyWeight) * (0.35 + completionUnit * 0.55));
  const fireflies = useMemo(() => fireflySeeds(fireflyCount), [fireflyCount]);

  const cameraDrift = useRef(new Animated.Value(0)).current;
  const fireflyDrift = useRef(new Animated.Value(0)).current;
  const pathReveal = useRef(new Animated.Value(0)).current;
  const prevCount = useRef(nodes.length);

  const atmoPulse = useSharedValue(1);
  const fp = useMemo(() => worldFingerprint(world), [world]);
  const prevFp = useRef<string | null>(null);
  useEffect(() => {
    if (prevFp.current === null) {
      prevFp.current = fp;
      return;
    }
    if (prevFp.current === fp) return;
    prevFp.current = fp;
    atmoPulse.value = withSequence(withTiming(0.9, { duration: 280 }), withTiming(1, { duration: 1720 }));
  }, [fp, atmoPulse]);

  const atmoStyle = useAnimatedStyle(() => ({
    opacity: atmoPulse.value * 0.55 + 0.45,
  }));

  useEffect(() => {
    const l = Animated.loop(
      Animated.sequence([
        Animated.timing(cameraDrift, { toValue: 1, duration: 22000, easing: Easing.inOut(Easing.sin), useNativeDriver: useND }),
        Animated.timing(cameraDrift, { toValue: 0, duration: 24000, easing: Easing.inOut(Easing.sin), useNativeDriver: useND }),
      ])
    );
    l.start();
    return () => l.stop();
  }, [cameraDrift, useND, uiScale]);
  useEffect(() => {
    const l = Animated.loop(
      Animated.sequence([
        Animated.timing(fireflyDrift, { toValue: 1, duration: 11000, easing: Easing.inOut(Easing.sin), useNativeDriver: useND }),
        Animated.timing(fireflyDrift, { toValue: 0, duration: 13000, easing: Easing.inOut(Easing.sin), useNativeDriver: useND }),
      ])
    );
    l.start();
    return () => l.stop();
  }, [fireflyDrift, useND]);

  useEffect(() => {
    const prev = prevCount.current;
    prevCount.current = nodes.length;
    if (nodes.length <= 0) {
      pathReveal.setValue(1);
      return;
    }
    if (nodes.length === prev) {
      pathReveal.setValue(1);
      return;
    }
    pathReveal.setValue(0);
    Animated.timing(pathReveal, {
      toValue: 1,
      duration: 1500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: useND,
    }).start();
  }, [nodes.length, pathReveal, useND]);

  const drift = 1.2 * uiScale;
  const camX = cameraDrift.interpolate({ inputRange: [0, 1], outputRange: [-drift, drift] });
  const camY = cameraDrift.interpolate({ inputRange: [0, 1], outputRange: [-0.65 * uiScale, 0.95 * uiScale] });

  const timelineStyle = useMemo(
    () => ({
      top: Math.round(12 + 6 * uiScale),
      left: Math.round(14 + 4 * uiScale),
      right: Math.round(14 + 4 * uiScale),
    }),
    [uiScale]
  );

  const timelineBtnDyn = useMemo(
    () => ({
      paddingHorizontal: Math.round(12 + 4 * uiScale),
      paddingVertical: Math.round(6 + 3 * uiScale),
    }),
    [uiScale]
  );

  const timelineTextSize = Math.round(11 + 2 * uiScale);

  return (
    <View
      style={styles.wrap}
      accessibilityRole="image"
      accessibilityLabel="Your journey landscape">
      <JourneyAtmosphere mood={mood} visual={visual} animatedStyle={atmoStyle} />

      <Animated.View
        style={[StyleSheet.absoluteFillObject, { opacity: pathReveal, transform: [{ translateX: camX }, { translateY: camY }] }]}>
        <JourneyArtifactLayer
          artifacts={artifacts}
          width={width}
          height={height}
          uiScale={uiScale}
          onOpenMemory={onOpenMemory}
          onOpenQuest={onOpenQuest}
        />

        {fireflies.map((f, i) => {
          const ffDrift = 4 * uiScale;
          const driftRange = fireflyDrift.interpolate({
            inputRange: [0, 1],
            outputRange: [-(i % 2 === 0 ? ffDrift : -ffDrift * 0.85), i % 2 === 0 ? ffDrift : -ffDrift * 0.85],
          });
          return (
            <Animated.View
              key={`ff:${i}`}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: `${f.x * 100}%`,
                top: `${f.y * 100}%`,
                width: Math.max(1.2, f.size * uiScale),
                height: Math.max(1.2, f.size * uiScale),
                borderRadius: 999,
                backgroundColor: '#ebe3c8',
                opacity: f.op * (0.28 + n * 0.45),
                transform: [{ translateX: driftRange }],
              }}
            />
          );
        })}
      </Animated.View>

      <JourneyNarrative line={microLine} contentWidth={width} uiScale={uiScale} onPress={onOpenHome} />

      <View style={[styles.uiTop, timelineStyle]} pointerEvents="box-none">
        <Pressable
          onPress={onOpenTimeline}
          accessibilityRole="button"
          accessibilityLabel="Open journey timeline"
          style={({ pressed }) => [
            styles.timelineBtn,
            timelineBtnDyn,
            pressed && { opacity: 0.85 },
          ]}>
          <Text style={[styles.timelineBtnText, { fontSize: timelineTextSize }]}>Timeline</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** Alias for the composed diorama scene. */
export { JourneyWorldScene as JourneyScene };

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  uiTop: { position: 'absolute', alignItems: 'flex-end' },
  timelineBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(12,16,22,0.55)',
  },
  timelineBtnText: { color: 'rgba(244,241,236,0.92)', fontWeight: '700', letterSpacing: 0.2 },
});
