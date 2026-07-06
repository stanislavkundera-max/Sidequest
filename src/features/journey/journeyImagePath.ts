import {
  clamp01,
  journeyPathCategoryForId,
  scaleAtT,
  type JourneyPathNode,
  type QuestPlacement,
} from '@/src/features/journey/journeyPathGeometry';

type ArtifactSize = 'small' | 'medium' | 'landmark';
const PATH_APEX_MIN_GAP_U = 0.02;

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

function cumulativeUByPointIndex(): number[] {
  const { segLens, total } = segmentData();
  const out: number[] = [0];
  let acc = 0;
  for (let i = 0; i < segLens.length; i++) {
    acc += segLens[i]!;
    out.push(clamp01(acc / total));
  }
  return out;
}

function signum(v: number): -1 | 0 | 1 {
  if (v > 0) return 1;
  if (v < 0) return -1;
  return 0;
}

/**
 * Apexes = local left/right turning points of the painted trail.
 * Returned in foreground->distance order as normalized path-U.
 */
function apexUsOnPaintedPath(): number[] {
  const pts = JOURNEY_PATH_POINTS;
  const uByIndex = cumulativeUByPointIndex();
  const out: number[] = [];
  for (let i = 1; i < pts.length - 1; i++) {
    const dxPrev = pts[i]!.x - pts[i - 1]!.x;
    const dxNext = pts[i + 1]!.x - pts[i]!.x;
    const sxPrev = signum(dxPrev);
    const sxNext = signum(dxNext);
    const isApex = sxPrev !== 0 && sxNext !== 0 && sxPrev !== sxNext;
    if (!isApex) continue;
    const u = clamp01(uByIndex[i] ?? 0);
    if (u <= 0 || u >= 1) continue;
    out.push(u);
  }
  if (out.length === 0) return [0.16, 0.28, 0.42, 0.56, 0.7, 0.82];
  return out;
}

function linearUs(count: number, startU: number, endU: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [clamp01((startU + endU) / 2)];
  const out: number[] = [];
  const denom = count - 1;
  for (let i = 0; i < count; i++) {
    out.push(clamp01(startU + (i / denom) * (endU - startU)));
  }
  return out;
}

function anchoredUsForRange(count: number, startU: number, endU: number): number[] {
  if (count <= 0) return [];
  const targets = linearUs(count, startU, endU);
  const apexes = apexUsOnPaintedPath().filter((u) => u >= startU && u <= endU);
  if (apexes.length === 0) return targets;

  const picked: number[] = [];
  for (let i = 0; i < targets.length; i++) {
    const target = targets[i]!;
    const minAllowed = (picked[picked.length - 1] ?? startU - 1) + PATH_APEX_MIN_GAP_U;
    const candidatePool = apexes.filter((u) => u >= minAllowed && !picked.includes(u));
    if (candidatePool.length === 0) {
      picked.push(target);
      continue;
    }
    let best = candidatePool[0]!;
    let bestDist = Math.abs(best - target);
    for (let j = 1; j < candidatePool.length; j++) {
      const d = Math.abs(candidatePool[j]! - target);
      if (d < bestDist) {
        bestDist = d;
        best = candidatePool[j]!;
      }
    }
    picked.push(best);
  }

  // Keep monotonic order in case we fell back to target interpolation.
  for (let i = 1; i < picked.length; i++) {
    if (picked[i]! <= picked[i - 1]!) {
      picked[i] = clamp01(picked[i - 1]! + PATH_APEX_MIN_GAP_U);
    }
  }
  return picked.map((u) => clamp01(Math.max(startU, Math.min(endU, u))));
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
    const uAnchors = anchoredUsForRange(active.length, 0, visibleActiveMaxU);
    const merged = active.map((node, i) => {
      const uPaint = uAnchors[i] ?? 0;
      return placementFromNode(node, uToT(uPaint), (i % 2 === 0 ? -1 : 1) as -1 | 1, 'active');
    });
    return merged.map((p, i, arr) => ({ ...p, isCurrent: i === arr.length - 1 }));
  }

  if (active.length === 0) {
    const uAnchors = anchoredUsForRange(completed.length, 0, visibleCompletedMaxU);
    const merged = completed.map((node, i) => {
      const uPaint = uAnchors[i] ?? 0;
      return placementFromNode(node, uToT(uPaint), (i % 2 === 0 ? -1 : 1) as -1 | 1, 'completed');
    });
    return merged.map((p, i, arr) => ({ ...p, isCurrent: i === arr.length - 1 }));
  }

  const uCap = visibleCompletedMaxU;
  const completedAnchors = anchoredUsForRange(completed.length, 0, uCap);
  const placedC = completed.map((node, i) => {
    const uPaint = completedAnchors[i] ?? 0;
    return placementFromNode(node, uToT(uPaint), (i % 2 === 0 ? -1 : 1) as -1 | 1, 'completed');
  });

  const activeAnchors = anchoredUsForRange(active.length, uCap, visibleActiveMaxU);
  const placedA = active.map((node, j) => {
    const uPaint = activeAnchors[j] ?? uCap;
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
  const { tx, ty } = tangentAlongPaintedPath(uPaint);
  const normalX = -ty;
  const normalY = tx;
  const sideSigned = pl.side === -1 ? -1 : 1;
  const lateralBase = _size === 'landmark' ? 0.03 : _size === 'medium' ? 0.024 : 0.018;
  const pullTowardCamera = 0.006;
  const offsetX = normalX * lateralBase * sideSigned;
  const offsetY = normalY * lateralBase * sideSigned + pullTowardCamera;
  return { x: clamp01(p.x + offsetX), y: clamp01(p.y + offsetY) };
}
