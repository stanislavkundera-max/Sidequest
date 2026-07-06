import { Pressable, StyleSheet, View } from 'react-native';

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
  const baseDotPx = artifact.size === 'landmark' ? 8 : artifact.size === 'medium' ? 7 : 6;
  const dotPx = Math.max(5, baseDotPx * uiScale * (0.92 + sc * 0.12));
  const hitBoxPx = Math.max(22, dotPx * 3.6);

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
        style={({ pressed }) => [styles.dotTap, { opacity: pressed ? 0.65 : 1 }]}>
        <View
          style={[
            styles.dot,
            {
              width: dotPx,
              height: dotPx,
              borderRadius: dotPx / 2,
            },
          ]}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  dotTap: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    backgroundColor: 'rgba(90, 104, 97, 0.55)',
  },
});
