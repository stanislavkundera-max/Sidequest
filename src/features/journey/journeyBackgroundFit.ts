import { clamp01 } from '@/src/features/journey/journeyPathGeometry';

/**
 * Pixel size of `journey-valley-background.png` (file is JPEG data; SOF0 in asset).
 * Update if the hero image is replaced.
 */
export const JOURNEY_BACKGROUND_SOURCE_SIZE = { width: 571, height: 1024 };

export type JourneyCoverLayout = {
  scale: number;
  offX: number;
  offY: number;
  drawnW: number;
  drawnH: number;
  sourceW: number;
  sourceH: number;
};

/** Same geometry as `ImageBackground` `resizeMode="cover"` (centered, aspect fill). */
export function journeyBackgroundCoverLayout(
  viewW: number,
  viewH: number,
  sourceW: number = JOURNEY_BACKGROUND_SOURCE_SIZE.width,
  sourceH: number = JOURNEY_BACKGROUND_SOURCE_SIZE.height
): JourneyCoverLayout {
  const scale = Math.max(viewW / sourceW, viewH / sourceH);
  const drawnW = sourceW * scale;
  const drawnH = sourceH * scale;
  const offX = (viewW - drawnW) / 2;
  const offY = (viewH - drawnH) / 2;
  return { scale, offX, offY, drawnW, drawnH, sourceW, sourceH };
}

/**
 * Normalized coords on the **source bitmap** (0–1) → view pixel position.
 * Use for path polyline, current ring, and artifact centers so they track the painted path under `cover`.
 */
export function imageNormToViewPixels(
  viewW: number,
  viewH: number,
  u: number,
  v: number,
  layout?: JourneyCoverLayout
): { x: number; y: number } {
  const L = layout ?? journeyBackgroundCoverLayout(viewW, viewH);
  return {
    x: L.offX + clamp01(u) * L.drawnW,
    y: L.offY + clamp01(v) * L.drawnH,
  };
}
