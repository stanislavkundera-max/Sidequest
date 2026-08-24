import { clamp01 } from '@/src/features/journey/journeyPathGeometry';

/**
 * Pixel size of `journey-valley-background.png` (file is JPEG data; SOF0 in asset).
 * Update if the hero image is replaced.
 */
export const JOURNEY_BACKGROUND_SOURCE_SIZE = { width: 571, height: 1024 };

/**
 * Fallback anchor when there is nothing on the trail yet: pin the bottom of the
 * painting so an empty panel shows the trailhead rather than sky.
 */
export const JOURNEY_SCENE_ANCHOR_Y = 1;

/** Breathing room (source-normalized) so a glyph is never clipped by an edge. */
export const JOURNEY_SCENE_BAND_PAD = 0.04;

export type JourneyCoverLayout = {
  scale: number;
  offX: number;
  offY: number;
  drawnW: number;
  drawnH: number;
  sourceW: number;
  sourceH: number;
};

/**
 * Same geometry as `ImageBackground` `resizeMode="cover"` (aspect fill).
 *
 * `anchorY` picks which part survives the vertical crop: `0.5` (default) matches
 * `resizeMode="cover"` exactly — centered — so existing callers (the Explore map)
 * are unaffected. `0` pins the top of the source, `1` the bottom. The Journey
 * scene passes a value computed by `journeySceneAnchorForBand` below.
 */
export function journeyBackgroundCoverLayout(
  viewW: number,
  viewH: number,
  sourceW: number = JOURNEY_BACKGROUND_SOURCE_SIZE.width,
  sourceH: number = JOURNEY_BACKGROUND_SOURCE_SIZE.height,
  anchorY: number = 0.5
): JourneyCoverLayout {
  const scale = Math.max(viewW / sourceW, viewH / sourceH);
  const drawnW = sourceW * scale;
  const drawnH = sourceH * scale;
  const offX = (viewW - drawnW) / 2;
  const offY = (viewH - drawnH) * clamp01(anchorY);
  return { scale, offX, offY, drawnW, drawnH, sourceW, sourceH };
}

/**
 * Vertical anchor that keeps a normalized source band `[topY, bottomY]` on screen.
 *
 * When the whole band fits, it is centered. When it cannot fit, the **top** of
 * the band wins — on the Journey trail that is the newest marker and the current
 * position, which matter more than the oldest completions.
 */
export function journeySceneAnchorForBand(
  viewW: number,
  viewH: number,
  topY: number,
  bottomY: number,
  sourceW: number = JOURNEY_BACKGROUND_SOURCE_SIZE.width,
  sourceH: number = JOURNEY_BACKGROUND_SOURCE_SIZE.height
): number {
  const drawnH = sourceH * Math.max(viewW / sourceW, viewH / sourceH);
  const visibleFraction = viewH / drawnH;
  if (visibleFraction >= 1) return JOURNEY_SCENE_ANCHOR_Y;

  const top = clamp01(topY - JOURNEY_SCENE_BAND_PAD);
  const bottom = clamp01(bottomY + JOURNEY_SCENE_BAND_PAD);
  const band = bottom - top;
  const windowTop = visibleFraction >= band ? top - (visibleFraction - band) / 2 : top;
  return clamp01(windowTop / (1 - visibleFraction));
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
