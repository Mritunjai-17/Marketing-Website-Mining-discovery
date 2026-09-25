/**
 * The camera that descends from the globe onto the journey.
 *
 * ONE CAMERA, ONE TRUCK. This module exists because the previous transition
 * was built the other way round: a separate `CameraDescentStage` drew its own
 * terrain, its own highway and its own hand-drawn SVG truck, then crossfaded
 * into the real Journey. For the length of that crossfade both trucks were on
 * screen at once, which is what read as two trucks — they were two trucks.
 *
 * Nothing here draws anything. It returns where the camera is at a given
 * transition progress, and the caller applies that to the *real* Journey
 * stage, so what the descent reveals is the actual scene with the actual
 * truck in it. The truck is never faded in, never duplicated and never moved
 * between scenes; it is simply too far away and too steeply foreshortened to
 * read as a truck until the camera gets down to it.
 *
 * THE ORDER MATTERS, and the brief is strict about it: the camera holds a
 * fixed overhead pitch through the cloud, the land, the road and the whole of
 * the truck reveal, and only starts rotating once the truck is plainly
 * visible. So pitch is a constant here until ROTATE begins — the truck is
 * brought into view by the camera closing distance, not by the camera
 * turning, and not by anything fading up.
 *
 * Every value is a pure function of progress, which is what makes scrolling
 * back up reverse cleanly: there is no state to unwind and nothing that
 * latches, so any progress value produces the same camera whichever direction
 * it was reached from.
 */

import { clamp01, smoothstep } from "./journeySideView";

/**
 * The stage becomes opaque well before it can be seen.
 *
 * The clouds sit above the journey in z-order, so the land does not need to
 * fade up — it needs to already be there, underneath, while the cloud deck is
 * still solid. The brief is explicit that the camera reveals what was already
 * below rather than swapping one scene for another, and that is the whole
 * difference: this ramp finishes at 0.42, and the clouds do not begin parting
 * until 0.44.
 */
const MATERIALISE = { from: 0.02, to: 0.12 };

/**
 * The camera's fall from altitude. Runs under the hero handover and past it.
 */
const DESCEND = { from: 0.12, to: 0.65 };

/**
 * The hold, between the descent ending and the orbit beginning.
 */
const HOLD = { from: 0.65, to: 0.78 };

/**
 * The orbit to side view. Nothing rotates before this.
 */
const ROTATE = { from: 0.78, to: 0.98 };

/**
 * The overhead pitch, in degrees.
 *
 * Steep enough that the carriageway rakes away and the scene reads as ground
 * seen from above rather than as a horizon. Not 90: at exactly edge-on a
 * plane has no thickness and the road would vanish to a line, taking the
 * truck with it. 78 keeps the road legible as a surface while leaving no
 * doubt that the camera is above it.
 */
const OVERHEAD_PITCH = 78;

/** Horizontal orbit during the rotation, in degrees. Settles to zero. */
const ORBIT_YAW = 13;

/**
 * How far back the camera starts, in pixels of Z.
 *
 * Read together with START_SCALE and the 1250px perspective on the container,
 * these two put the stage at about 0.44 of its final size at the top of the
 * descent — which is the number that actually matters, because the truck is
 * 60% of the stage wide and so crosses the reveal from roughly a quarter of
 * the frame to three-fifths of it.
 *
 * Not deeper than that, and the limit is the geometry rather than taste: the
 * stage is a plane, so shrinking it shrinks the picture and not the field of
 * view — past this it stops reading as a camera high above the ground and
 * starts reading as a small picture of the ground. What is left over around
 * it is DescentBackdrop's job, and a backdrop can sit behind a raked slab
 * convincingly; it cannot sit behind a postage stamp.
 */
const START_DOLLY = -1000;

/** How much smaller the world is from altitude. */
const START_SCALE = 0.78;

/**
 * How far the scene sits down the frame at altitude, in pixels.
 *
 * Looking steeply down puts the ground below the camera, not in front of it,
 * so the stage starts low and rises to its own composition as the camera
 * levels out.
 */
const START_LIFT = 230;

export interface DescentCamera {
  /** Stage opacity. Reaches 1 while the cloud deck still hides everything. */
  opacity: number;
  /** Degrees of downward tilt. 0 is the Journey's own side elevation. */
  pitch: number;
  /** Degrees of horizontal orbit. 0 is the Journey's own side elevation. */
  yaw: number;
  /** Z offset in pixels. Negative is further from camera. */
  dolly: number;
  /** Uniform scale. */
  scale: number;
  /** Y offset in pixels. */
  lift: number;
  /**
   * True once the camera is exactly the Journey's own composition, so the
   * caller can drop the transform entirely rather than write an identity one.
   */
  locked: boolean;
}

/*
 * Note on easing: `smoothstep` is already an ease-in-out, so these ramps use
 * it once and not twice. Composing it with a cubic ease — which is what this
 * first did — stacks two S-curves and makes the middle savagely steep: the
 * rotation put 61 of its 78 degrees into three percent of the transition,
 * which is a snap however smooth the maths is, and the descent finished a
 * full six percent before its own window closed. One ease per ramp.
 */

/**
 * Where the camera is at a given transition progress.
 *
 * At `progress >= ROTATE.to` this returns exact identity — pitch, yaw, dolly
 * and lift all zero and scale exactly 1 — because the next thing that happens
 * is the Journey's own scroll taking over. Anything left over at that moment,
 * even a fraction of a degree, would show up as the scene shifting at the
 * exact frame control changes hands.
 */
export function deriveDescentCamera(progress: number): DescentCamera {
  const p = clamp01(progress);
  const opacity = smoothstep(0.0, 0.30, p);

  return {
    opacity,
    pitch: 0,
    yaw: 0,
    dolly: 0,
    scale: 1,
    lift: 0,
    locked: true,
  };
}

/** The CSS transform for a camera, or `none` once it is locked. */
export function descentTransform(camera: DescentCamera): string {
  if (camera.locked) return "none";
  return (
    `translate3d(0px, ${camera.lift.toFixed(2)}px, ${camera.dolly.toFixed(1)}px) ` +
    `rotateX(${camera.pitch.toFixed(2)}deg) ` +
    `rotateY(${camera.yaw.toFixed(2)}deg) ` +
    `scale(${camera.scale.toFixed(4)})`
  );
}

/**
 * When the Journey's own frame loop must be running.
 *
 * Well before the stage can be seen: the road, the lamps and the truck all
 * draw from that loop, so if it starts at the moment the clouds part there is
 * nothing underneath them to reveal.
 */
export const JOURNEY_RUNS_FROM = MATERIALISE.from - 0.04;

export const DESCENT_PHASES = { MATERIALISE, DESCEND, HOLD, ROTATE, OVERHEAD_PITCH } as const;
