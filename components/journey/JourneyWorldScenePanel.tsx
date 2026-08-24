import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { JourneyWorldScene } from '@/components/journey/JourneyWorldScene';
import { useJourneyWorldSceneData } from '@/components/journey/useJourneyWorldSceneData';
import {
  JOURNEY_BACKGROUND_SOURCE_SIZE,
  JOURNEY_SCENE_BAND_PAD,
} from '@/src/features/journey/journeyBackgroundFit';
import { journeyContentWidth } from '@/src/features/journey/journeyLayoutMetrics';

type Props = {
  onOpenQuest: (id: string) => void;
  onOpenMemory: (id: string) => void;
};

const HORIZONTAL_MARGIN = 16;
const SOURCE_ASPECT = JOURNEY_BACKGROUND_SOURCE_SIZE.height / JOURNEY_BACKGROUND_SOURCE_SIZE.width;

/** Empty path: a short trailhead strip rather than a wall of scenery. */
const MIN_HEIGHT = 160;

/**
 * Hero panel above the catalog.
 *
 * Height follows the path that actually exists: a new account gets a short
 * trailhead strip, and the scene grows as completions push markers further up
 * the trail. The crop is bottom-anchored (`JOURNEY_SCENE_ANCHOR_Y`), so the
 * newest markers are the ones guaranteed to be on screen.
 *
 * Sized from the window rather than a measured `onLayout` — that callback does
 * not fire reliably under RN-Web here, which left the panel blank.
 */
export function JourneyWorldScenePanel({ onOpenQuest, onOpenMemory }: Props) {
  const { world, nodes, artifacts, microLine } = useJourneyWorldSceneData();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const width = journeyContentWidth(windowWidth) - HORIZONTAL_MARGIN * 2;

  // Tall enough for the whole occupied stretch of trail to survive the crop.
  const ys = artifacts.map((a) => a.position.y);
  const band = ys.length ? Math.max(...ys) - Math.min(...ys) + JOURNEY_SCENE_BAND_PAD * 2 : 0;
  const needed = band * width * SOURCE_ASPECT;
  const maxHeight = Math.min(width * 1.55, windowHeight * 0.62);
  const height = Math.max(MIN_HEIGHT, Math.min(needed, maxHeight));

  return (
    <View style={[styles.root, { width, height }]}>
      <JourneyWorldScene
        layoutWidth={width}
        layoutHeight={height}
        world={world}
        nodes={nodes}
        artifacts={artifacts}
        microLine={microLine}
        onOpenMemory={onOpenMemory}
        onOpenQuest={onOpenQuest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginHorizontal: HORIZONTAL_MARGIN,
    marginBottom: HORIZONTAL_MARGIN,
    borderRadius: 20,
    overflow: 'hidden',
  },
});
