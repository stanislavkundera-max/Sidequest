import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Reanimated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { JourneyArtifactLayer } from '@/components/journey/JourneyArtifactLayer';
import { JourneyAtmosphere } from '@/components/journey/JourneyAtmosphere';
import { JourneyCurrentPosition } from '@/components/journey/JourneyCurrentPosition';
import { JourneyNarrative } from '@/components/journey/JourneyNarrative';
import type { JourneyArtifact } from '@/src/features/journey/journeyArtifacts';
import {
  imageNormToViewPixels,
  journeyBackgroundCoverLayout,
  journeySceneAnchorForBand,
  JOURNEY_SCENE_ANCHOR_Y,
} from '@/src/features/journey/journeyBackgroundFit';
import { placeQuestsOnPaintedPath, pointAlongPaintedPath } from '@/src/features/journey/journeyImagePath';
import { journeyUiScale } from '@/src/features/journey/journeyLayoutMetrics';
import {
  clamp01,
  mix,
  scaleAtT,
  type JourneyPathNode,
  type JourneyWorldSceneNode,
} from '@/src/features/journey/journeyPathGeometry';
import { pickJourneyMood } from '@/src/features/journey/journeyVisualMood';
import { getJourneyVisualState } from '@/src/features/journey/journeyWorld';
import type { WorldState } from '@/src/features/journey/journeyWorld';

export type { JourneyWorldSceneNode };

type FireflySeed = { x: number; y: number; size: number; op: number };

function level01(lv: number) {
  return clamp01(lv / 3);
}

function fireflySeeds(count: number): FireflySeed[] {
  const out: FireflySeed[] = [];
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

/** One ambient drifting mote. Own component so `useAnimatedStyle` follows the rules of hooks inside a list. */
function Firefly({
  seed,
  index,
  driftShared,
  uiScale,
  natureLevel01,
}: {
  seed: FireflySeed;
  index: number;
  driftShared: SharedValue<number>;
  uiScale: number;
  natureLevel01: number;
}) {
  const ffDrift = 4 * uiScale;
  const range = index % 2 === 0 ? ffDrift : -ffDrift * 0.85;
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(driftShared.value, [0, 1], [-range, range]) }],
  }));

  return (
    <Reanimated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: `${seed.x * 100}%`,
          top: `${seed.y * 100}%`,
          width: Math.max(1.2, seed.size * uiScale),
          height: Math.max(1.2, seed.size * uiScale),
          borderRadius: 999,
          backgroundColor: '#ebe3c8',
          opacity: seed.op * (0.28 + natureLevel01 * 0.45),
        },
        style,
      ]}
    />
  );
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
  /** Omit to hide the Timeline button (no destination wired yet). */
  onOpenTimeline?: () => void;
  onOpenMemory: (id: string) => void;
  onOpenQuest: (id: string) => void;
  /** Omit to render the narrative pill as static (non-pressable) text. */
  onOpenHome?: () => void;
}) {
  const uiScale = useMemo(() => journeyUiScale(layoutWidth), [layoutWidth]);
  const width = layoutWidth;
  const height = layoutHeight;

  const mood = useMemo(() => pickJourneyMood(world), [world]);
  const visual = useMemo(() => getJourneyVisualState(world), [world]);
  const n = level01(world.nature.level);
  const r = level01(world.relax.level);
  const completedCount = useMemo(
    () => nodes.filter((node) => node.journeyStatus !== 'active').length,
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
  const currentPlacement = placements.length > 0 ? placements[placements.length - 1] : null;

  // One layout for the art, the artifacts and the current-position ring, so
  // they cannot drift apart. The crop follows the markers that actually exist.
  const layout = useMemo(() => {
    const anchorY = artifacts.length
      ? journeySceneAnchorForBand(
          width,
          height,
          Math.min(...artifacts.map((a) => a.position.y)),
          Math.max(...artifacts.map((a) => a.position.y))
        )
      : JOURNEY_SCENE_ANCHOR_Y;
    return journeyBackgroundCoverLayout(width, height, undefined, undefined, anchorY);
  }, [width, height, artifacts]);

  const currentPixel = useMemo(() => {
    if (!currentPlacement) return null;
    const point = pointAlongPaintedPath(currentPlacement.t);
    return imageNormToViewPixels(width, height, point.x, point.y, layout);
  }, [currentPlacement, width, height, layout]);

  const fireflyWeight = clamp01(n * 0.9 + r * 0.5);
  const fireflyCount = Math.round(mix(0, 7, fireflyWeight) * (0.35 + completionUnit * 0.55));
  const fireflies = useMemo(() => fireflySeeds(fireflyCount), [fireflyCount]);

  const cameraDrift = useSharedValue(0);
  const fireflyDrift = useSharedValue(0);
  const pathReveal = useSharedValue(1);
  const atmoPulse = useSharedValue(1);

  const fp = useMemo(() => worldFingerprint(world), [world]);
  const prevFpRef = useMemo(() => ({ current: null as string | null }), []);
  useEffect(() => {
    if (prevFpRef.current === null) {
      prevFpRef.current = fp;
      return;
    }
    if (prevFpRef.current === fp) return;
    prevFpRef.current = fp;
    atmoPulse.value = withSequence(withTiming(0.9, { duration: 280 }), withTiming(1, { duration: 1720 }));
  }, [fp, atmoPulse, prevFpRef]);

  const atmoStyle = useAnimatedStyle(() => ({
    opacity: atmoPulse.value * 0.55 + 0.45,
  }));

  useEffect(() => {
    cameraDrift.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 22000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 24000, easing: Easing.inOut(Easing.sin) })
      ),
      -1
    );
  }, [cameraDrift]);

  useEffect(() => {
    fireflyDrift.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 11000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 13000, easing: Easing.inOut(Easing.sin) })
      ),
      -1
    );
  }, [fireflyDrift]);

  const prevCountRef = useMemo(() => ({ current: nodes.length }), []);
  useEffect(() => {
    const prev = prevCountRef.current;
    prevCountRef.current = nodes.length;
    if (nodes.length <= 0 || nodes.length === prev) {
      pathReveal.value = 1;
      return;
    }
    pathReveal.value = 0;
    pathReveal.value = withTiming(1, { duration: 1500, easing: Easing.out(Easing.cubic) });
  }, [nodes.length, pathReveal, prevCountRef]);

  const drift = 1.2 * uiScale;
  const sceneStyle = useAnimatedStyle(() => ({
    opacity: pathReveal.value,
    transform: [
      { translateX: interpolate(cameraDrift.value, [0, 1], [-drift, drift]) },
      { translateY: interpolate(cameraDrift.value, [0, 1], [-0.65 * uiScale, 0.95 * uiScale]) },
    ],
  }));

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
      <JourneyAtmosphere mood={mood} visual={visual} animatedStyle={atmoStyle} layout={layout} />

      <Reanimated.View style={[StyleSheet.absoluteFillObject, sceneStyle]}>
        <JourneyArtifactLayer
          artifacts={artifacts}
          width={width}
          height={height}
          uiScale={uiScale}
          layout={layout}
          onOpenMemory={onOpenMemory}
          onOpenQuest={onOpenQuest}
        />

        {currentPixel ? (
          <JourneyCurrentPosition
            x={currentPixel.x}
            y={currentPixel.y}
            ringPx={14 * uiScale * scaleAtT(currentPlacement?.t ?? 1)}
          />
        ) : null}

        {fireflies.map((f, i) => (
          <Firefly key={`ff:${i}`} seed={f} index={i} driftShared={fireflyDrift} uiScale={uiScale} natureLevel01={n} />
        ))}
      </Reanimated.View>

      <JourneyNarrative line={microLine} contentWidth={width} uiScale={uiScale} onPress={onOpenHome} />

      {onOpenTimeline ? (
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
      ) : null}
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
