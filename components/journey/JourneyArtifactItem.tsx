import { Pressable, StyleSheet, View } from 'react-native';

import { JourneyArtifactGlyph } from '@/components/journey/JourneyArtifactGlyph';
import type { JourneyArtifact } from '@/src/features/journey/journeyArtifacts';
import { scaleAtT } from '@/src/features/journey/journeyPathGeometry';

type Props = {
  artifact: JourneyArtifact;
  index: number;
  centerX: number;
  centerY: number;
  uiScale: number;
  onOpenMemory: (id: string) => void;
  onOpenQuest: (id: string) => void;
};

export function JourneyArtifactItem({
  artifact,
  centerX,
  centerY,
  uiScale,
  onOpenMemory,
  onOpenQuest,
}: Props) {
  const sc = scaleAtT(artifact.pathT);
  const basePixelScale = artifact.size === 'landmark' ? 26 : artifact.size === 'medium' ? 18 : 13;
  const pixelScale = basePixelScale * uiScale * (0.85 + sc * 0.3);
  // Pedestal renders roughly pixelScale*1.1 + 20 (padding) wide — size the tap
  // target off that estimate rather than the old dot-relative formula.
  const hitBoxPx = Math.max(44, (pixelScale * 1.1 + 20) * 1.3);

  return (
    <View
      style={{
        position: 'absolute',
        left: centerX - hitBoxPx / 2,
        top: centerY - hitBoxPx / 2,
        width: hitBoxPx,
        height: hitBoxPx,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Pressable
        onPress={() =>
          artifact.linkedMemoryId ? onOpenMemory(artifact.linkedMemoryId) : onOpenQuest(artifact.linkedQuestId)
        }
        accessibilityRole="button"
        accessibilityLabel={artifact.linkedMemoryId ? 'Open linked memory' : 'Open completed quest'}
        style={({ pressed }) => [styles.tap, { opacity: pressed ? 0.65 : 1 }]}>
        <JourneyArtifactGlyph artifact={artifact} pixelScale={pixelScale} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  tap: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
