/** Max content width so Journey reads as a phone column on tablets / web. */
export const JOURNEY_PHONE_MAX_CONTENT_W = 428;

/** Reference phone width for scaling glyphs and chrome (~iPhone 13–15). */
export const JOURNEY_UI_REF_WIDTH = 390;

/** Clamp window width to a phone-sized column (full width on real phones). */
export function journeyContentWidth(screenWidth: number): number {
  return Math.min(screenWidth, JOURNEY_PHONE_MAX_CONTENT_W);
}

/**
 * Scale for Journey UI pieces (artifacts, ring, copy). ~1 on common phones, slightly down on very narrow.
 */
export function journeyUiScale(contentWidth: number): number {
  return Math.max(0.82, Math.min(1.06, contentWidth / JOURNEY_UI_REF_WIDTH));
}
