import { View } from 'react-native';

import { JourneyArtifactItem } from '@/components/journey/JourneyArtifactItem';
import type { JourneyArtifact } from '@/src/features/journey/journeyArtifacts';
import { imageNormToViewPixels, type JourneyCoverLayout } from '@/src/features/journey/journeyBackgroundFit';

type Props = {
  artifacts: JourneyArtifact[];
  width: number;
  height: number;
  uiScale: number;
  /** Shared with the background art so markers stay on the painted trail. */
  layout: JourneyCoverLayout;
  onOpenMemory: (id: string) => void;
  onOpenQuest: (id: string) => void;
};

export function JourneyArtifactLayer({ artifacts, width, height, uiScale, layout, onOpenMemory, onOpenQuest }: Props) {
  return (
    <View style={{ flex: 1 }} pointerEvents="box-none">
      {artifacts.map((a, index) => {
        const center = imageNormToViewPixels(width, height, a.position.x, a.position.y, layout);
        return (
          <JourneyArtifactItem
            key={a.id}
            artifact={a}
            index={index}
            centerX={center.x}
            centerY={center.y}
            uiScale={uiScale}
            onOpenMemory={onOpenMemory}
            onOpenQuest={onOpenQuest}
          />
        );
      })}
    </View>
  );
}
