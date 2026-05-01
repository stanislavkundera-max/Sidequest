import { View } from 'react-native';

import { JourneyArtifactItem } from '@/components/journey/JourneyArtifactItem';
import type { JourneyArtifact } from '@/src/features/journey/journeyArtifacts';
import { imageNormToViewPixels } from '@/src/features/journey/journeyBackgroundFit';
import { scaleAtT } from '@/src/features/journey/journeyPathGeometry';

type Props = {
  artifacts: JourneyArtifact[];
  width: number;
  height: number;
  uiScale: number;
  onOpenMemory: (id: string) => void;
  onOpenQuest: (id: string) => void;
};

export function JourneyArtifactLayer({ artifacts, width, height, uiScale, onOpenMemory, onOpenQuest }: Props) {
  return (
    <View style={{ flex: 1 }} pointerEvents="box-none">
      {artifacts.map((a, index) => {
        const sc = scaleAtT(a.pathT);
        const basePx = (a.size === 'landmark' ? 108 : a.size === 'medium' ? 66 : 44) * uiScale;
        const px = basePx * sc * (0.94 + Math.min(1, width / 390) * 0.1);
        const center = imageNormToViewPixels(width, height, a.position.x, a.position.y);
        const left = center.x - px * 0.58;
        const top = center.y - px * 0.62;
        return (
          <JourneyArtifactItem
            key={a.id}
            artifact={a}
            index={index}
            left={left}
            top={top}
            width={width}
            uiScale={uiScale}
            onOpenMemory={onOpenMemory}
            onOpenQuest={onOpenQuest}
          />
        );
      })}
    </View>
  );
}
