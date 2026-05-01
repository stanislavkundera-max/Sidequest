import {
  clamp01,
  journeyPathCategoryForId,
  scaleAtT,
  type JourneyPathNode,
  type QuestPlacement,
} from '@/src/features/journey/journeyPathGeometry';

type ArtifactSize = 'small' | 'medium' | 'landmark';

/**
 * Normalized points (0–1 of the **source bitmap**, not the view) along the painted path in `journey-valley-background.png`.
 * Order: foreground (bottom, large y) → distance (top, small y). The trail visibly **winds left/right** — x must swing with y.
 * Map to the device with `imageNormToViewPixels` (`cover` matches `ImageBackground`). Tweak when the art file changes.
 */
export const JOURNEY_PATH_POINTS = [
  { x: 0.5, y: 0.965 },
  { x: 0.47, y: 0.92 },
  { x: 0.58, y: 0.865 },
  { x: 0.5, y: 0.81 },
  { x: 0.42, y: 0.755 },
  { x: 0.53, y: 0.69 },
  { x: 0.58, y: 0.635 },
  { x: 0.49, y: 0.58 },
  { x: 0.4, y: 0.53 },
  { x: 0.5, y: 0.47 },
  { x: 0.6, y: 0.43 },
  { x: 0.54, y: 0.38 },
  { x: 0.43, y: 0.34 },
  { x: 0.5, y: 0.3 },
  { x: 0.55, y: 0.26 },
  { x: 0.49, y: 0.22 },
  { x: 0.46, y: 0.19 },
] as const;

function segmentData() {
  const pts = JOURNEY_PATH_POINTS;
  const segLens: number[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = pts[i + 1]!.x - pts[i]!.x;
    const dy = pts[i + 1]!.y - pts[i]!.y;
    segLens.push(Math.hypot(dx, dy));
  }
  const total = segLens.reduce((a, b) => a + b, 0) || 1e-6;
  return { segLens, total };
}

/** @param u 0 = path start (first point, foreground), 1 = path end (last point, distance). */
export function pointAlongPaintedPath(u: number): { x: number; y: number } {
  const uu = clamp01(u);
  const { segLens, total } = segmentData();
  const pts = JOURNEY_PATH_POINTS;
  let dist = uu * total;
  for (let i = 0; i < segLens.length; i++) {
    const sl = segLens[i]!;
    if (dist <= sl || i === segLens.length - 1) {
      const t = sl < 1e-9 ? 0 : Math.min(1, dist / sl);
      return {
        x: pts[i]!.x + t * (pts[i + 1]!.x - pts[i]!.x),
        y: pts[i]!.y + t * (pts[i + 1]!.y - pts[i]!.y),
      };
    }
    dist -= sl;
  }
  return { x: pts[pts.length - 1]!.x, y: pts[pts.length - 1]!.y };
}

export function tangentAlongPaintedPath(u: number): { tx: number; ty: number } {
  const eps = 0.012;
  const a = pointAlongPaintedPath(clamp01(u - eps));
  const b = pointAlongPaintedPath(clamp01(u + eps));
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1e-6;
  return { tx: dx / len, ty: dy / len };
}

function isActivePathNode(n: JourneyPathNode): boolean {
  return n.journeyStatus === 'active';
}

function placementFromNode(
  node: JourneyPathNode,
  /** Legacy depth param for scaleAtT / trailWidthAtT: 1 = foreground, 0 = distance. */
  t: number,
  side: -1 | 1,
  leg: 'completed' | 'active'
): QuestPlacement {
  return {
    key: node.userQuestId,
    questId: node.questId,
    cat: journeyPathCategoryForId(node.categoryId),
    memory: node.memory,
    t,
    side,
    isCurrent: false,
    journeyLeg: leg,
  };
}

/**
 * Map quests onto the painted background polyline (arc-length).
 * `placement.t` stays compatible with `scaleAtT` / `trailWidthAtT` (1 = near/foreground, 0 = far).
 */
export function placeQuestsOnPaintedPath(nodes: JourneyPathNode[]): QuestPlacement[] {
  if (nodes.length === 0) return [];

  const completed = nodes.filter((n) => !isActivePathNode(n));
  const active = nodes.filter((n) => isActivePathNode(n));
  // Keep markers on the visible winding trail in the grass band.
  const visibleCompletedMaxU = 0.64;
  const visibleActiveMaxU = 0.8;

  const uToT = (uPaint: number) => 1 - clamp01(uPaint);

  if (completed.length === 0) {
    const denom = Math.max(1, active.length - 1);
    const merged = active.map((node, i) => {
      const uPaint = (i / denom) * visibleActiveMaxU;
      return placementFromNode(node, uToT(uPaint), (i % 2 === 0 ? -1 : 1) as -1 | 1, 'active');
    });
    return merged.map((p, i, arr) => ({ ...p, isCurrent: i === arr.length - 1 }));
  }

  if (active.length === 0) {
    const denom = Math.max(1, completed.length - 1);
    const merged = completed.map((node, i) => {
      const uPaint = (i / denom) * visibleCompletedMaxU;
      return placementFromNode(node, uToT(uPaint), (i % 2 === 0 ? -1 : 1) as -1 | 1, 'completed');
    });
    return merged.map((p, i, arr) => ({ ...p, isCurrent: i === arr.length - 1 }));
  }

  const uCap = visibleCompletedMaxU;
  const denomC = Math.max(1, completed.length - 1);
  const placedC = completed.map((node, i) => {
    const uPaint = (i / denomC) * uCap;
    return placementFromNode(node, uToT(uPaint), (i % 2 === 0 ? -1 : 1) as -1 | 1, 'completed');
  });

  const denomA = Math.max(1, active.length - 1);
  const placedA = active.map((node, j) => {
    const uPaint = uCap + (j / denomA) * (visibleActiveMaxU - uCap);
    const side = ((completed.length + j) % 2 === 0 ? -1 : 1) as -1 | 1;
    return placementFromNode(node, uToT(uPaint), side, 'active');
  });

  const merged = [...placedC, ...placedA];
  return merged.map((p, i, arr) => ({ ...p, isCurrent: i === arr.length - 1 }));
}

/**
 * Artifact anchor on the painted path (bitmap-normalized). Small along-path jitter only so overlaps separate slightly.
 */
export function offsetFromPaintedPath(pl: QuestPlacement, _size: ArtifactSize, _seed: string): { x: number; y: number } {
  const uPaint = 1 - clamp01(pl.t);
  const p = pointAlongPaintedPath(uPaint);
  return { x: clamp01(p.x), y: clamp01(p.y) };
}
