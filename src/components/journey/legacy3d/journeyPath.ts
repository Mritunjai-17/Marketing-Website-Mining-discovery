import * as THREE from "three";

/**
 * The single source of truth for where the journey goes.
 *
 * Everything that moves — the truck, the camera, the key light, the road mesh
 * itself — is derived from this one curve, so none of them can drift out of
 * sync with the others. Later steps (billboards, stop markers, storytelling
 * beats) should keep doing the same: ask the path for a point at `t` rather
 * than hard-coding a position.
 */

/** World-space up. The road never banks, so this stays fixed rather than
 *  coming from the curve's own Frenet frame — a Frenet normal twists through
 *  inflection points and would roll the road surface over on itself. */
export const UP = new THREE.Vector3(0, 1, 0);

/**
 * Control points for a straight, clean highway corridor.
 * Runs straight down -Z so that a camera beside the road (+X) views the highway
 * as a perfectly straight horizontal road across the screen.
 */
const CONTROL_POINTS: readonly [number, number, number][] = [
  [0, 0, 120],
  [0, 0, 0],
  [0, 0, -200],
  [0, 0, -400],
  [0, 0, -600],
  [0, 0, -800],
  [0, 0, -1000],
  [0, 0, -1180],
];

/**
 * The journey curve.
 *
 * `centripetal` parameterisation (not the `catmullrom` default) is what stops
 * the spline from looping back on itself where control points bunch up — with
 * uniform parameterisation a tight pair of points produces a cusp, and a cusp
 * in a road is a visible kink the truck would snap through.
 */
export const journeyCurve = new THREE.CatmullRomCurve3(
  CONTROL_POINTS.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
  false,
  "centripetal",
  0.5,
);

/**
 * How wide the driving surface is, in world units. Two lanes at premium
 * motorway proportions against a truck about 12 units long.
 */
export const ROAD_WIDTH = 15;

/** The paved shoulder either side of the driving surface. */
export const SHOULDER_WIDTH = 3.4;

/** Outer edge of everything paved — where the terrain is allowed to start. */
export const PAVED_HALF_WIDTH = ROAD_WIDTH / 2 + SHOULDER_WIDTH;

/** Road sits fractionally above the ground plane so the two never z-fight. */
export const ROAD_Y = 0.02;

/**
 * Height of the road's crown above its edges.
 *
 * Real carriageways are cambered so water runs off, and the payoff here is
 * visual: a dead-flat strip catches the key light as one uniform band, while a
 * crowned one rolls the highlight along the centre and lets the lane markings
 * sit on a surface that actually turns. It is only 9cm across 7.5m — invisible
 * as a slope, obvious in the shading.
 */
export const ROAD_CROWN = 0.09;

/**
 * Resolution used whenever the curve is turned into geometry. 320 segments
 * over ~1000 units is a sample every ~3 units — enough that the silhouette of
 * the road edge stays smooth at the camera distances this scene uses.
 */
export const ROAD_SEGMENTS = 320;

/**
 * Total arc length, cached. Useful for pacing things by distance rather than
 * by curve parameter in later steps.
 */
export const journeyLength = journeyCurve.getLength();

/**
 * Position at a normalised progress value.
 *
 * `getPointAt` (not `getPoint`) re-parameterises by arc length, so t = 0.5 is
 * genuinely halfway *along the road*, not halfway through the spline's
 * parameter space — those differ a lot on a curve with uneven control-point
 * spacing, and the difference is exactly what makes scroll-driven motion feel
 * like it speeds up and slows down for no reason.
 *
 * @param t normalised progress, 0 = start of the road, 1 = destination
 * @param target optional vector to write into, to avoid per-frame allocation
 */
export function getJourneyPoint(t: number, target = new THREE.Vector3()): THREE.Vector3 {
  return journeyCurve.getPointAt(clamp01(t), target);
}

/**
 * Unit direction of travel at a normalised progress value.
 *
 * @param t normalised progress, 0 = start of the road, 1 = destination
 * @param target optional vector to write into, to avoid per-frame allocation
 */
export function getJourneyTangent(t: number, target = new THREE.Vector3()): THREE.Vector3 {
  return journeyCurve.getTangentAt(clamp01(t), target).normalize();
}

/**
 * The road's lateral axis at `t` — tangent crossed with world up, so it stays
 * horizontal regardless of how the curve twists. Points to the truck's right.
 */
export function getJourneySide(t: number, target = new THREE.Vector3()): THREE.Vector3 {
  const tangent = getJourneyTangent(t, target);
  return tangent.cross(UP).normalize();
}

export function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

/** Smooth 0→1 ramp between two edges. The workhorse of the terrain shaping. */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

const startPoint = journeyCurve.getPointAt(0, new THREE.Vector3());
const endPoint = journeyCurve.getPointAt(1, new THREE.Vector3());
const startTangent = journeyCurve.getTangentAt(0, new THREE.Vector3()).normalize();
const endTangent = journeyCurve.getTangentAt(1, new THREE.Vector3()).normalize();

/**
 * Like `getJourneyPoint`, but valid outside [0, 1].
 *
 * The terrain is swept along the same curve as the road, and it has to keep
 * going past both ends — otherwise the ground stops exactly where the road
 * does and the camera sees the world end in mid-air at the start and finish.
 * Beyond the ends this extrapolates in a straight line along the end tangent,
 * which is indistinguishable from more road at the distances involved.
 */
export function getExtendedPoint(t: number, target = new THREE.Vector3()): THREE.Vector3 {
  if (t < 0) return target.copy(startPoint).addScaledVector(startTangent, t * journeyLength);
  if (t > 1) return target.copy(endPoint).addScaledVector(endTangent, (t - 1) * journeyLength);
  return journeyCurve.getPointAt(t, target);
}

/** Direction of travel, held constant past either end of the curve. */
export function getExtendedTangent(t: number, target = new THREE.Vector3()): THREE.Vector3 {
  if (t < 0) return target.copy(startTangent);
  if (t > 1) return target.copy(endTangent);
  return journeyCurve.getTangentAt(t, target).normalize();
}

/** Lateral axis (pointing to the truck's right), valid outside [0, 1]. */
export function getExtendedSide(t: number, target = new THREE.Vector3()): THREE.Vector3 {
  return getExtendedTangent(t, target).cross(UP).normalize();
}
