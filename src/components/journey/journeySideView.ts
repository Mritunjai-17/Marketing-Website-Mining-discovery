/**
 * The scene's geometry model — side view.
 *
 * This replaces the forward-travel pinhole projection the journey used
 * previously. That model put the camera behind the truck looking down the
 * road, so everything converged on a vanishing point; this one puts the camera
 * beside the road looking across it, so the world slides horizontally and the
 * truck travels left to right. The two cannot coexist — a vanishing point and
 * a side elevation are different cameras — which is why the old model is
 * preserved under `legacy-perspective/` rather than adapted.
 *
 * The whole scene resolves from three numbers:
 *
 *   `worldX`  where a thing stands along the route, in world units
 *   `depth`   how fast its layer slides relative to the road plane
 *   a band    which horizontal strip of the frame it occupies
 *
 * Everything on the road plane shares depth 1, so the truck, the billboard,
 * the markers and the lights stay in exact register with each other no matter
 * how the camera moves. Parallax on the other layers is then the only thing
 * creating depth, which is what a side-scrolling composition has instead of
 * perspective.
 */

/** World units the journey covers end to end. */
export const WORLD_LENGTH = 2400;

/**
 * How much of the world is visible at once, in world units.
 *
 * This sets the scene's scale: at 93 units across, a 13-unit truck occupies
 * about a seventh of the frame and a 23-unit billboard about a quarter. Raise
 * it and everything shrinks; the markers' spacing in `journeyContent.ts` is
 * chosen against this number, so the two move together.
 */
export const UNITS_VISIBLE = 93;

/**
 * How much world a narrow viewport shows instead.
 *
 * A phone is a fifth the width of a desktop, so at a fixed 93 units the truck
 * comes out 15px tall — present in the DOM, invisible in practice, and a
 * straight failure of the brief's requirement that it stay visible on mobile.
 * Showing less world zooms the whole scene in, which is what a narrow frame
 * needs anyway: fewer things on screen, each large enough to read.
 */
export const UNITS_VISIBLE_NARROW = 38;

/**
 * Where the truck sits across the frame, as the brief specifies it.
 *
 * Keyframed rather than computed so the composition is exactly what was asked
 * for: near the left at the start, centre at the halfway point, and stopping
 * short of the right edge so it never leaves the viewport or collides with the
 * destination.
 */
const TRUCK_KEYFRAMES: [number, number][] = [
  [0, 0.24],
  [0.25, 0.38],
  [0.5, 0.54],
  [0.75, 0.70],
  [1, 0.84],
];

/** Screen position of the truck, as a fraction of stage width. */
/**
 * How far the truck's travel is squeezed toward the centre of the frame.
 *
 * The brief's keyframes run from 10% to 88% of stage width, which assumes a
 * truck narrower than a fifth of the frame. Zoomed in for a phone the truck is
 * nearly half the frame, so those same keyframes would hang it off both edges.
 * Squeezing the range keeps the brief's motion — left to right, monotone,
 * scroll-driven — while keeping the whole vehicle on screen.
 */
export function travelSqueeze(width: number): number {
  const t = Math.min(1, Math.max(0, (width - 480) / (1400 - 480)));
  return 0.55 + t * 0.45;
}

export function truckScreenFraction(progress: number, squeeze = 1): number {
  const p = Math.min(1, Math.max(0, progress));
  for (let i = 1; i < TRUCK_KEYFRAMES.length; i++) {
    const [p1, x1] = TRUCK_KEYFRAMES[i];
    if (p <= p1) {
      const [p0, x0] = TRUCK_KEYFRAMES[i - 1];
      // Linear between keyframes: monotone, and with the keys this evenly
      // spaced the velocity barely changes, so easing each segment separately
      // would add a pulse at every key rather than smoothing anything.
      const f = x0 + ((x1 - x0) * (p - p0)) / (p1 - p0);
      // Squeeze about the frame centre, so the motion stays symmetric.
      return 0.5 + (f - 0.5) * squeeze;
    }
  }
  return 0.5 + (TRUCK_KEYFRAMES[TRUCK_KEYFRAMES.length - 1][1] - 0.5) * squeeze;
}

/**
 * Parallax depth per layer, relative to the road plane.
 *
 * Ordered, and the order is the composition's depth cue. Nothing here is
 * tuned by ear; it is the physical distance the artwork implies, normalised so
 * the road is 1. A layer's speed is its depth, and everything on the road
 * plane shares speed 1.
 */
export const DEPTH = {
  sky: 0.04,
  glow: 0.08,
  clouds: 0.05,
  farRange: 0.14,
  midRange: 0.24,
  forest: 0.38,
  cloudsFar: 0.18,
  cloudsNear: 0.32,
  city: 0.28,
  industry: 0.5,
  verge: 0.95,
  road: 1,
  foreground: 1.55,
} as const;

export interface StageMetrics {
  width: number;
  height: number;
  /** Y of the distant horizon, where sky meets land. */
  horizonY: number;
  /** Y of the road's far edge. */
  roadFarY: number;
  /** Y of the road's near edge. */
  roadNearY: number;
  /** Stage pixels per world unit along the route. */
  pxPerUnit: number;
  unitsVisible: number;
  /** How far the truck's travel is squeezed toward centre. */
  squeeze: number;
}

/**
 * Derives the layout bands from the stage's pixel size.
 *
 * The horizon sits just past halfway so the sky and its mountains own the top
 * half while the road and its foreground own the bottom — the reference
 * composition's basic division. The carriageway is a deep band rather than a
 * line because a three-quarter side view needs a surface to read as a road at
 * all; a single stroke reads as a wire.
 */
export function deriveMetrics(width: number, height: number): StageMetrics {
  // Short, wide viewports need the road higher or it runs off the bottom;
  // tall ones can afford to drop it.
  const squat = Math.min(1, Math.max(0, (height / width - 0.45) / 0.5));

  // Narrow viewports show less world, so everything in it reads larger.
  const zoom = Math.min(1, Math.max(0, (width - 480) / (1400 - 480)));
  const unitsVisible = UNITS_VISIBLE_NARROW + (UNITS_VISIBLE - UNITS_VISIBLE_NARROW) * zoom;

  return {
    width,
    height,
    horizonY: height * (0.48 + squat * 0.06),
    roadFarY: height * (0.64 + squat * 0.04),
    roadNearY: height * (0.85 + squat * 0.03),
    pxPerUnit: width / unitsVisible,
    unitsVisible,
    squeeze: travelSqueeze(width),
  };
}

/** Smooth 0→1 ramp, used for every scroll-driven reveal. */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

/**
 * Everything the layers need for one frame, computed once per tick.
 *
 * Mutated in place rather than rebuilt — this object is handed to a dozen
 * subscribers sixty times a second, and allocating it fresh each time is pure
 * garbage for no benefit.
 */
export interface SceneState {
  progress: number;
  /** Sky-to-land camera descent progress (0..1) */
  descent?: number;
  /** The truck's position along the route, in world units. */
  truckWorldX: number;
  /** The camera's left edge, in world units. */
  cameraX: number;
  /** The truck's screen x, in pixels. */
  truckScreenX: number;
  /** Seconds since mount, for ambient motion. */
  time: number;
  /**
   * The descent camera’s downward tilt in degrees; 0 is this side elevation.
   *
   * Carried on the scene because it is a property of the frame, like time.
   * Layers that look the same from every angle can ignore it; the truck
   * cannot, because which of its faces is toward camera depends on it.
   */
  pitch: number;
  metrics: StageMetrics;
}

/**
 * Advances the camera to a progress value.
 *
 * The camera is derived from the truck rather than the other way round: the
 * truck's screen position is specified, so the camera is whatever puts it
 * there. That inversion is what lets the brief's keyframes be exact while
 * every world object still slides at a single consistent rate.
 */
export function updateScene(scene: SceneState, progress: number, time: number) {
  const m = scene.metrics;
  scene.progress = progress;
  scene.time = time;
  scene.truckWorldX = progress * WORLD_LENGTH;
  scene.truckScreenX = truckScreenFraction(progress, m.squeeze) * m.width;
  scene.cameraX = scene.truckWorldX - scene.truckScreenX / m.pxPerUnit;
}

/** Screen x of a point on the road plane. */
export function roadX(scene: SceneState, worldX: number): number {
  return (worldX - scene.cameraX) * scene.metrics.pxPerUnit;
}

/** Screen x of a point on a parallax layer. */
export function layerX(scene: SceneState, worldX: number, depth: number): number {
  return (worldX - scene.cameraX) * scene.metrics.pxPerUnit * depth;
}

/** How far a parallax layer has slid, in pixels. Used for tiled plates. */
export function layerShift(scene: SceneState, depth: number): number {
  return -scene.cameraX * scene.metrics.pxPerUnit * depth;
}

/**
 * Atmospheric fade for distant things, by depth rather than by distance.
 *
 * A side view has no per-object distance to fade by, so haze is a property of
 * the layer: the further back a plate sits, the less of its own contrast
 * survives. Same effect, expressed the way this camera can express it.
 */
export function layerClarity(depth: number): number {
  return Math.min(1, 0.28 + depth * 2.1);
}

/** Is a road-plane object anywhere near the frame? Cheap cull. */
export function onStage(scene: SceneState, worldX: number, marginUnits = 40): boolean {
  const x = roadX(scene, worldX);
  const margin = marginUnits * scene.metrics.pxPerUnit;
  return x > -margin && x < scene.metrics.width + margin;
}
