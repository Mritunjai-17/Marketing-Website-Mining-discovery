"use client";

import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { UP, getJourneyPoint, getJourneySide, getJourneyTangent } from "./journeyPath";
import { useJourneyProgress } from "../journeyProgress";

/**
 * Where the camera sits relative to the truck, in the truck's own frame.
 *
 * Pulled a long way back from a conventional chase rig on purpose. The brief
 * wants the truck to hold roughly a fifth of the attention and the world the
 * rest, and framing is the only honest lever for that — shrinking the truck
 * would break its scale against the road, and crowding the frame with scenery
 * would fight the composition rather than compose it. At 54 units with a 33°
 * lens the truck spans about a fifth of the frame width and a good deal less
 * of its area, with the road and landscape carrying everything else.
 */
const CHASE_BEHIND = 54;
const CHASE_HEIGHT = 19;

/** How far ahead of the truck the camera aims, so bends open up before arrival. */
const LOOK_AHEAD = 30;
const LOOK_HEIGHT = 4.2;

/** Fixed. An animated FOV is the classic source of a "zoom" nobody asked for. */
const FIELD_OF_VIEW = 33;

/**
 * Seconds for the camera to close roughly 63% of its remaining gap to the
 * ideal position. Larger = looser, more cinematic trail; smaller = stiffer.
 * Position lags slightly more than aim, which is what makes the rig read as a
 * camera car being driven rather than a rigidly parented boom.
 */
const POSITION_SMOOTHING = 0.32;
const TARGET_SMOOTHING = 0.22;

/**
 * The lateral swing, in world units, across the whole journey.
 *
 * This is the "subtle cinematic offset" and it is deliberately one single slow
 * movement rather than a sequence of moves: the camera drifts from the truck's
 * left shoulder to its right over the entire route, which re-frames the
 * landscape continuously without ever being fast enough to notice as a camera
 * move. Anything more energetic belongs in the later choreography stage.
 */
const SIDE_SWING = 9;
const HEIGHT_SWING = 3.5;

/**
 * Frame-rate independent exponential damping.
 *
 * A plain `lerp(a, b, 0.1)` per frame moves twice as fast on a 120Hz display
 * as on a 60Hz one — the same scroll would produce visibly different camera
 * lag on different machines. Converting the smoothing time into a per-frame
 * factor with `1 - exp(-dt / tau)` removes that dependence.
 */
function dampFactor(smoothingSeconds: number, delta: number): number {
  return 1 - Math.exp(-delta / smoothingSeconds);
}

/** Scratch vectors plus the smoothed state the rig carries between frames. */
interface CameraRigState {
  truckPosition: THREE.Vector3;
  tangent: THREE.Vector3;
  side: THREE.Vector3;
  desiredPosition: THREE.Vector3;
  desiredTarget: THREE.Vector3;
  smoothedPosition: THREE.Vector3;
  smoothedTarget: THREE.Vector3;
  /** First frame snaps instead of damping, so the camera never flies in from the origin. */
  initialised: boolean;
}

function createRigState(): CameraRigState {
  return {
    truckPosition: new THREE.Vector3(),
    tangent: new THREE.Vector3(),
    side: new THREE.Vector3(),
    desiredPosition: new THREE.Vector3(),
    desiredTarget: new THREE.Vector3(),
    smoothedPosition: new THREE.Vector3(),
    smoothedTarget: new THREE.Vector3(),
    initialised: false,
  };
}

/**
 * A cinematic chase camera that follows the truck along the journey.
 *
 * It derives its own framing from the path rather than reading the truck's
 * transform, so there is no ordering dependency between the two `useFrame`
 * callbacks — both are pure functions of the same progress value, and neither
 * can ever be a frame behind the other.
 *
 * Every offset below is a function of progress alone, which is what keeps the
 * shot perfectly reversible: scrolling back up retraces the identical camera
 * path rather than unwinding some accumulated state.
 */
export const JourneyCamera: React.FC = () => {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const progress = useJourneyProgress();
  const { size } = useThree();

  // Held in a ref and built on first frame: the rig mutates this every frame,
  // and mutating a value produced during render is what React's lint rules
  // (correctly) reject. Nothing here is ever read during render.
  const stateRef = useRef<CameraRigState | null>(null);

  /*
   * Narrow viewports see less of the scene at a given FOV, so the chase
   * distance is scaled up a little on small screens to keep the truck fully in
   * frame. This is the only responsive concession in the prototype — a proper
   * mobile treatment comes later — but it means the desktop framing is not
   * silently broken when someone opens it on a phone.
   */
  const distanceScale = size.width < 768 ? 1.28 : size.width < 1200 ? 1.1 : 1;

  useFrame((_, delta) => {
    const camera = cameraRef.current;
    if (!camera) return;

    stateRef.current ??= createRigState();
    const state = stateRef.current;

    // Guard against tab-restore spikes, which would otherwise damp a whole
    // second of motion into one frame.
    const dt = Math.min(delta, 1 / 20);
    const t = progress.current;

    getJourneyPoint(t, state.truckPosition);
    getJourneyTangent(t, state.tangent);
    getJourneySide(t, state.side);

    // A single cosine sweep across the journey: starts left, crosses to right,
    // never reverses direction, never accelerates.
    const swing = Math.cos(t * Math.PI);
    const sideOffset = -swing * SIDE_SWING;
    // Rises gently through the middle of the route, where the hills are
    // tallest and the extra elevation buys the most landscape.
    const heightOffset = Math.sin(t * Math.PI) * HEIGHT_SWING;

    state.desiredPosition
      .copy(state.truckPosition)
      .addScaledVector(state.tangent, -CHASE_BEHIND * distanceScale)
      .addScaledVector(state.side, sideOffset * distanceScale)
      .addScaledVector(UP, (CHASE_HEIGHT + heightOffset) * distanceScale);

    state.desiredTarget
      .copy(state.truckPosition)
      .addScaledVector(state.tangent, LOOK_AHEAD)
      .addScaledVector(UP, LOOK_HEIGHT);

    if (!state.initialised) {
      state.smoothedPosition.copy(state.desiredPosition);
      state.smoothedTarget.copy(state.desiredTarget);
      state.initialised = true;
    } else {
      state.smoothedPosition.lerp(state.desiredPosition, dampFactor(POSITION_SMOOTHING, dt));
      state.smoothedTarget.lerp(state.desiredTarget, dampFactor(TARGET_SMOOTHING, dt));
    }

    camera.position.copy(state.smoothedPosition);
    camera.lookAt(state.smoothedTarget);
  });

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      fov={FIELD_OF_VIEW}
      near={1}
      // Far enough to contain the sky dome at radius 1200.
      far={2600}
      position={[0, CHASE_HEIGHT, CHASE_BEHIND + 60]}
    />
  );
};

export default JourneyCamera;
