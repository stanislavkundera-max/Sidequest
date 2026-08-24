import type { JourneyCategory, WorldState } from '@/src/features/journey/journeyWorld';

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}
function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function level01(lv: number) {
  return clamp01(lv / 3);
}
function categoryUnit(w: WorldState, k: JourneyCategory) {
  return level01(w[k].level);
}

function hexToRgb(hex: string) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  return m ? { r: parseInt(m[1]!, 16), g: parseInt(m[2]!, 16), b: parseInt(m[3]!, 16) } : null;
}
function toHex(n: number) {
  return n.toString(16).padStart(2, '0');
}
function mixColor(a: string, b: string, t: number) {
  const ca = hexToRgb(a),
    cb = hexToRgb(b);
  if (!ca || !cb) return a;
  const u = clamp01(t);
  return `#${toHex(Math.round(mix(ca.r, cb.r, u)))}${toHex(Math.round(mix(ca.g, cb.g, u)))}${toHex(Math.round(mix(ca.b, cb.b, u)))}`;
}

export type JourneyMoodColors = {
  skyTop: string;
  skyMid: string;
  skyLow: string;
  horizonGlow: string;
  groundFar: string;
  groundMid: string;
  groundNear: string;
  fogTint: string;
};

/** Brighter, higher-contrast atmosphere than the previous near-black stage. */
export function pickJourneyMood(world: WorldState): JourneyMoodColors {
  const n = categoryUnit(world, 'nature');
  const s = categoryUnit(world, 'social');
  const a = categoryUnit(world, 'adventure');
  const r = categoryUnit(world, 'relax');
  return {
    skyTop: mixColor('#1a2636', '#243044', r * 0.25),
    skyMid: mixColor('#243244', '#2c3a4e', a * 0.2),
    skyLow: mixColor('#2c3a4c', '#34465a', s * 0.15),
    horizonGlow: mixColor('#4a5c78', '#5a6c88', a * 0.22 + s * 0.12),
    groundFar: mixColor('#222a26', '#1e2620', n * 0.28),
    groundMid: mixColor('#1c221e', '#182018', n * 0.22),
    groundNear: mixColor('#181e1a', '#141814', n * 0.18),
    fogTint: 'rgba(180,195,215,0.12)',
  };
}
