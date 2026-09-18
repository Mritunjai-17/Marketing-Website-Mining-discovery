"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { UP, getJourneyPoint, getJourneySide, getJourneyTangent } from "./journeyPath";
import { useJourneyProgress } from "../journeyProgress";

/**
 * Straight horizontal roadside tracking camera.
 * Positions camera beside the truck looking across the straight road,
 * creating a clean, level horizontal highway across the screen.
 */
const CHASE_SIDE = 54;
const CHASE_HEIGHT = 1.6;

/** Where the camera aims to center the truck profile higher and give more space under road */
const LOOK_HEIGHT = -1.8;

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

function smoothstep(min: number, max: number, value: number): number {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

/**
 * A cinematic camera that tracks the truck along the journey.
 * In the first stage, it views the truck from the side as the roadside text milestones scroll past.
 * After all text finishes, the camera swoops smoothly behind the truck into a rear chase view
 * looking forward down the highway.
 */
export const JourneyCamera: React.FC = () => {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const progress = useJourneyProgress();
  const { size } = useThree();

  const stateRef = useRef<CameraRigState | null>(null);

  const scratch = useMemo(
    () => ({
      sidePos: new THREE.Vector3(),
      sideTarget: new THREE.Vector3(),
      sideUp: new THREE.Vector3(0, 1, 0),
      overheadPos: new THREE.Vector3(),
      overheadTarget: new THREE.Vector3(),
      overheadUp: new THREE.Vector3(0, 0, 1),
      currentUp: new THREE.Vector3(),
    }),
    [],
  );

  useFrame((_, delta) => {
    const camera = cameraRef.current;
    if (!camera) return;

    stateRef.current ??= createRigState();
    const state = stateRef.current;

    const t = progress.current;

    getJourneyPoint(t, state.truckPosition);
    getJourneyTangent(t, state.tangent);
    getJourneySide(t, state.side);

    const aspect = size.width / Math.max(1, size.height);
    const isPortrait = aspect < 1.0;

    // Mobile / Portrait responsive scaling:
    // PerspectiveCamera has a fixed vertical FOV (33deg). In portrait mode (aspect ~0.45 - 0.55),
    // the horizontal FOV is roughly 3x narrower than in landscape (aspect ~1.78).
    // Scaling camera distance dynamically by aspect ratio keeps the truck and highway perfectly framed across phones, tablets, and desktops.
    const sideDistanceScale = isPortrait
      ? Math.min(2.35, 1.12 / Math.max(0.42, aspect))
      : size.width < 1200
      ? 1.15
      : 1.0;

    // On tall mobile screens, aim the side view slightly lower so the truck is centered in the upper portion
    // with plenty of clearance above the under-road text cards.
    const effectiveLookHeight = isPortrait ? -3.0 : LOOK_HEIGHT;

    // After Milestone 05 (t >= 0.82), the camera smoothly turns 90 degrees downward by t = 0.90
    // so the road aligns vertically from top to bottom, and the truck runs vertically down the screen!
    const turnS = smoothstep(0.82, 0.90, t);
    const easeTurn = turnS * turnS * (3 - 2 * turnS);

    // 1. Profile Side View (t <= 0.82)
    scratch.sidePos
      .copy(state.truckPosition)
      .addScaledVector(state.side, CHASE_SIDE * sideDistanceScale)
      .addScaledVector(UP, CHASE_HEIGHT * (isPortrait ? 1.0 : sideDistanceScale));

    scratch.sideTarget
      .copy(state.truckPosition)
      .addScaledVector(UP, effectiveLookHeight);

    scratch.sideUp.set(0, 1, 0);

    // 2. Downward Vertical Overhead View (t >= 0.90)
    // Camera is positioned directly above the highway.
    // Height of 82 ensures the full truck (cab + trailer + wheels) is completely visible with ample breathing room.
    const OVERHEAD_HEIGHT = 82 * (isPortrait ? 1.45 : 1.0);

    // The truck body's geometric midpoint is 4.2 units behind the truck group origin along tangent.
    // Offsetting the target to the midpoint ensures the full tractor + trailer is perfectly centered.
    const TRUCK_MIDPOINT_OFFSET = -4.2;

    // As user scrolls from t = 0.90 to 0.99, the truck visibly advances downward across the screen
    const runProgress = smoothstep(0.90, 0.99, t);
    const camLead = (1 - runProgress * 2) * 3.5;
    const totalOffset = TRUCK_MIDPOINT_OFFSET + camLead;

    scratch.overheadPos
      .copy(state.truckPosition)
      .addScaledVector(UP, OVERHEAD_HEIGHT)
      .addScaledVector(state.tangent, TRUCK_MIDPOINT_OFFSET + camLead * 0.35);

    scratch.overheadTarget
      .copy(state.truckPosition)
      .addScaledVector(state.tangent, totalOffset);

    scratch.overheadUp.copy(state.tangent).negate(); // (0, 0, 1)

    // 3. Smooth 90° circular arc sweep from side profile view to downward vertical road
    const angle = easeTurn * (Math.PI / 2);
    const arcSide = Math.cos(angle) * (CHASE_SIDE * sideDistanceScale);
    const arcHeight = Math.sin(angle) * OVERHEAD_HEIGHT + (1 - easeTurn) * (CHASE_HEIGHT * (isPortrait ? 1.0 : sideDistanceScale));

    state.desiredPosition
      .copy(state.truckPosition)
      .addScaledVector(state.side, arcSide)
      .addScaledVector(UP, arcHeight)
      .addScaledVector(state.tangent, easeTurn * (TRUCK_MIDPOINT_OFFSET + camLead * 0.35));

    state.desiredTarget.lerpVectors(scratch.sideTarget, scratch.overheadTarget, easeTurn);

    scratch.currentUp.lerpVectors(scratch.sideUp, scratch.overheadUp, easeTurn).normalize();

    state.smoothedPosition.copy(state.desiredPosition);
    state.smoothedTarget.copy(state.desiredTarget);

    camera.up.copy(scratch.currentUp);
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
      position={[CHASE_SIDE, CHASE_HEIGHT, 0]}
    />
  );
};

export default JourneyCamera;
