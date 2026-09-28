"use client";

import type React from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { smoothstep } from "./journeyPath";
import { useJourneyProgress } from "../journeyProgress";

/**
 * Progressive reveal, driven by scroll position.
 *
 * The brief asks for a world that changes as the journey advances rather than
 * one that is fully present from the first frame. Most of that is already
 * physical — the destination really is at the far end of the road, and fog
 * really does hide it — but distance alone cannot make lights *come on*, and a
 * business district that is fully lit from a kilometre away has no arrival to
 * it.
 *
 * So these ramps sit on top of the fog rather than replacing it. Each is a
 * smoothstep across a span of progress, which matters: a linear fade has
 * corners at both ends, and a corner in a brightness curve is exactly what
 * reads as something "switching on" instead of resolving out of the haze.
 *
 * Everything here is a pure function of progress, so scrolling back up dims
 * the world again in perfect step — no accumulated state to unwind.
 */

/** Ramps a mesh's emissive intensity as the journey progresses. */
export function useEmissiveReveal(
  ref: React.RefObject<THREE.Mesh | THREE.InstancedMesh | null>,
  from: number,
  to: number,
  minIntensity: number,
  maxIntensity: number,
) {
  const progress = useJourneyProgress();

  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const material = mesh.material as THREE.MeshStandardMaterial | undefined;
    if (!material || !("emissiveIntensity" in material)) return;

    const reveal = smoothstep(from, to, progress.current);
    material.emissiveIntensity = minIntensity + (maxIntensity - minIntensity) * reveal;
  });
}

/** Ramps a sprite's opacity, for the additive glow halos. */
export function useOpacityReveal(
  ref: React.RefObject<THREE.Sprite | THREE.Mesh | null>,
  from: number,
  to: number,
  minOpacity: number,
  maxOpacity: number,
) {
  const progress = useJourneyProgress();

  useFrame(() => {
    const object = ref.current;
    if (!object) return;
    const material = object.material as THREE.Material | undefined;
    if (!material) return;

    const reveal = smoothstep(from, to, progress.current);
    material.opacity = minOpacity + (maxOpacity - minOpacity) * reveal;
  });
}
