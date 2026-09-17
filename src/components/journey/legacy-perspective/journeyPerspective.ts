/**
 * The scene's geometry model.
 *
 * This is a 2D scene, but "2D" does not have to mean "layers sliding at
 * arbitrary speeds". Every element here — road, lamp posts, billboard, city,
 * hills — is given a distance and projected through one small pinhole formula.
 * That buys three things a hand-tuned parallax stack cannot:
 *
 *   - Depth ordering and relative speed come out correct automatically. Far
 *     things move slowly because they are far, not because someone picked 0.2.
 *   - Anything can be placed by saying where it *is*, and it lands in the right
 *     spot at the right size in every frame of the journey.
 *   - The road, the lights on it and the billboard beside it stay physically
 *     consistent with each other, which is what stops the composition reading
 *     as cut-out shapes on a moving backdrop.
 *
 * No 3D engine is involved: this is about twenty lines of arithmetic feeding
 * CSS transforms and one 2D canvas.
 */

/** World units the camera covers across the full scroll. */
export const JOURNEY_DEPTH = 2400;

/** Closest distance anything is drawn at. Below this, projection explodes. */
export const NEAR = 24;

/** Furthest distance the road itself is drawn to. */
export const ROAD_FAR = 900;

/** Camera height above the road surface, in world units. */
export const CAM_HEIGHT = 7.2;

/** Half the carriageway width. The truck is about 5 units wide for scale. */
export const ROAD_HALF_WIDTH = 9.5;

/** Distance the truck sits ahead of the camera. Constant, so it never resizes. */
export const TRUCK_Z = 46;

/**
 * Where the billboard stands.
 *
 * Brought in from 2480 when VISIBILITY moved from the end of the journey to
 * its second chapter. The panel has to be readable while that chapter runs —
 * about 48px wide as it opens at 20%, 171px by the time it closes at 40% —
 * and then sweep past at 45%, which is what lets REACH begin "after the truck
 * passes the billboard" as the brief describes.
 */
export const BILLBOARD_Z = 1080;
export const BILLBOARD_OFFSET = 21;

/** The destination skyline. */
export const CITY_Z = 2900;

/** Haze scale: distance at which atmospheric fade is well advanced. */
const HAZE_SCALE = 620;

export interface StageMetrics {
  width: number;
  height: number;
  /** Screen y of the horizon line. */
  horizonY: number;
  /** Screen x the road converges toward when it runs straight. */
  vanishX: number;
  /** Focal length in pixels. Larger = longer lens = flatter perspective. */
  focal: number;
}

/**
 * Derives the projection constants from the stage's pixel size.
 *
 * The horizon sits high — at 46% rather than mid-frame — because the
 * composition wants the road and its foreground to own the lower half while
 * sky, mountains and the distant city share a band above it. The vanishing
 * point is pushed right of centre so the editorial text on the left has quiet
 * space to sit in, which is the reference composition's basic geometry.
 */
export function deriveMetrics(width: number, height: number): StageMetrics {
  return {
    width,
    height,
    horizonY: height * 0.455,
    vanishX: width * 0.565,
    // Tied to width so the field of view is stable as the stage changes shape,
    // rather than the scene appearing to zoom when a window is resized.
    focal: width * 0.78,
  };
}

/**
 * Lateral position of the road's centreline at a given world distance.
 *
 * Three sines at unrelated frequencies, so the highway wanders without ever
 * repeating a shape the eye can latch onto. Amplitudes are large against the
 * road's own width — this is a road seen across kilometres, and a highway that
 * only deviates by its own width reads as dead straight.
 */
export function roadCenterX(z: number): number {
  return (
    52 * Math.sin(z * 0.00118) +
    26 * Math.sin(z * 0.00287 + 1.31) +
    11 * Math.sin(z * 0.00623 + 2.42)
  );
}

export interface Projected {
  x: number;
  y: number;
  /** Pixels per world unit at this distance. */
  scale: number;
}

/**
 * Projects a world point to the stage.
 *
 * @param z distance ahead of the camera (already camera-relative)
 * @param lateral world offset right of the camera's own lateral position
 * @param elevation world height above the road surface
 */
export function project(
  z: number,
  lateral: number,
  elevation: number,
  m: StageMetrics,
): Projected {
  const safeZ = Math.max(z, NEAR * 0.35);
  const scale = m.focal / safeZ;
  return {
    x: m.vanishX + lateral * scale,
    // Road level falls below the horizon by the camera's height; elevation
    // lifts back toward it. This single line is what puts everything on the
    // same ground plane.
    y: m.horizonY + (CAM_HEIGHT - elevation) * scale,
    scale,
  };
}

/**
 * Atmospheric perspective: how much of an object's own contrast survives at a
 * given distance. Exponential, because real haze is.
 */
export function clarity(z: number): number {
  return Math.exp(-Math.max(z, 0) / HAZE_SCALE);
}

/** Smooth 0→1 ramp, used for every scroll-driven reveal. */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Everything the layers need for one frame, computed once per tick.
 *
 * Passed by reference and mutated in place rather than rebuilt — this object is
 * handed to a dozen subscribers sixty times a second, and allocating it fresh
 * each time is pure garbage for no benefit.
 */
export interface SceneState {
  /** Normalised journey progress, 0..1. */
  progress: number;
  /** World distance the camera has travelled. */
  travel: number;
  /** The camera's own lateral position, following the road. */
  cameraX: number;
  /** Seconds since the scene mounted, for ambient motion. */
  time: number;
  metrics: StageMetrics;
}

/**
 * Advances the camera to a progress value.
 *
 * The camera tracks the road's centreline exactly, which is why the truck can
 * sit at a fixed lateral offset and still appear to steer through every bend:
 * the world swings around it rather than it moving across the world.
 */
export function updateScene(scene: SceneState, progress: number, time: number) {
  scene.progress = progress;
  scene.travel = progress * JOURNEY_DEPTH;
  scene.cameraX = roadCenterX(scene.travel);
  scene.time = time;
}

/** Lateral offset of the road centre at world distance `z` ahead of the camera. */
export function relativeRoadX(scene: SceneState, z: number): number {
  return roadCenterX(scene.travel + z) - scene.cameraX;
}
