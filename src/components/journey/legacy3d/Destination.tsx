"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { getExtendedPoint, getExtendedSide } from "./journeyPath";
import { createGlowSprite } from "./proceduralTextures";
import { useEmissiveReveal, useOpacityReveal } from "./reveal";
import { makeRandom, terrainHeight } from "./terrain";

/**
 * The destination: a modern business and communications district at the end of
 * the road.
 *
 * Restraint is the brief, so this is about forty low-poly forms in total, not
 * a city. What sells it is not quantity but layering — an approach edge, a
 * core, and a far silhouette band, each at a different distance so that
 * atmospheric perspective separates them into foreground, midground and
 * background on its own.
 *
 * Nothing here is mining infrastructure. The vocabulary is deliberately
 * corporate and communications: clean towers, masts, lit facades.
 */

/** Where the district sits along the route. The road ends at t = 1. */
const CORE_FROM = 0.98;
const CORE_TO = 1.24;

interface Structure {
  position: THREE.Vector3;
  /** Footprint width, depth and height. */
  size: [number, number, number];
  rotation: number;
  tone: number;
}

/**
 * Places a band of buildings.
 *
 * Positions come from the same path-relative sampling as everything else, so
 * the district follows the road's final heading rather than sitting at some
 * fixed world angle that would only line up by luck.
 */
function buildBand(
  count: number,
  seed: number,
  tFrom: number,
  tTo: number,
  minOffset: number,
  maxOffset: number,
  minHeight: number,
  maxHeight: number,
): Structure[] {
  const random = makeRandom(seed);
  const out: Structure[] = [];
  const point = new THREE.Vector3();
  const side = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    // Stratified, so the band never leaves a conspicuous gap.
    const t = tFrom + ((tTo - tFrom) * (i + random())) / count;
    const offset = (minOffset + (maxOffset - minOffset) * Math.pow(random(), 0.85)) *
      (random() < 0.5 ? -1 : 1);

    getExtendedPoint(t, point);
    getExtendedSide(t, side);

    const position = point.clone().addScaledVector(side, offset);
    position.y = terrainHeight(t, offset);

    const height = minHeight + (maxHeight - minHeight) * Math.pow(random(), 1.6);
    const width = 6 + random() * 12;
    const depth = 6 + random() * 12;

    out.push({
      position,
      size: [width, depth, height],
      // Slight variation off the road's axis, so the block plan reads as a
      // real street grid rather than as a row.
      rotation: (random() - 0.5) * 0.7,
      tone: random(),
    });
  }
  return out;
}

const DARK = new THREE.Color("#16243a");
const PALE = new THREE.Color("#2b3f5f");

/**
 * Applies structures to an InstancedMesh.
 *
 * The box geometry is authored with its origin at the base rather than its
 * centre, so a building's height can be scaled without it sinking into or
 * floating above the terrain.
 */
function useStructureInstances(
  meshRef: React.RefObject<THREE.InstancedMesh | null>,
  structures: Structure[],
) {
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const color = new THREE.Color();

    structures.forEach((structure, index) => {
      quaternion.setFromAxisAngle(up, structure.rotation);
      scale.set(structure.size[0], structure.size[2], structure.size[1]);
      matrix.compose(structure.position, quaternion, scale);
      mesh.setMatrixAt(index, matrix);
      mesh.setColorAt(index, color.copy(DARK).lerp(PALE, structure.tone));
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [meshRef, structures]);
}

/** A unit box sitting on y = 0 rather than centred on it. */
function useBaseAnchoredBox(): THREE.BufferGeometry {
  const geometry = useMemo(() => {
    const box = new THREE.BoxGeometry(1, 1, 1);
    box.translate(0, 0.5, 0);
    return box;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
}

/**
 * The buildings.
 *
 * Two instanced meshes: the masses themselves, and a separate set of thin
 * emissive bands representing lit floors. Keeping the light separate from the
 * mass is what allows the buildings to stay genuinely dark — the district
 * reads as lit without any surface actually glowing, which is the difference
 * between premium and video-game.
 */
const Buildings: React.FC<{ structures: Structure[]; revealFrom: number; revealTo: number }> = ({
  structures,
  revealFrom,
  revealTo,
}) => {
  const massRef = useRef<THREE.InstancedMesh>(null);
  const bandRef = useRef<THREE.InstancedMesh>(null);
  const geometry = useBaseAnchoredBox();

  useStructureInstances(massRef, structures);

  /*
   * Lit bands, on roughly half the buildings and at varying heights. Not every
   * building gets one: a district where every single tower is lit identically
   * is the thing that reads as procedurally generated.
   */
  const bands = useMemo(() => {
    const random = makeRandom(0x5c1a77d3);
    const out: Structure[] = [];
    for (const structure of structures) {
      if (random() > 0.55) continue;
      const bandCount = 1 + Math.floor(random() * 3);
      for (let i = 0; i < bandCount; i++) {
        const height = structure.size[2];
        const y = height * (0.25 + random() * 0.6);
        out.push({
          position: new THREE.Vector3(
            structure.position.x,
            structure.position.y + y,
            structure.position.z,
          ),
          size: [structure.size[0] * 1.01, structure.size[1] * 1.01, 0.5 + random() * 0.8],
          rotation: structure.rotation,
          tone: random(),
        });
      }
    }
    return out;
  }, [structures]);

  useStructureInstances(bandRef, bands);
  useEmissiveReveal(bandRef, revealFrom, revealTo, 0.12, 2.4);

  return (
    <group>
      <instancedMesh
        ref={massRef}
        geometry={geometry}
        args={[undefined, undefined, Math.max(structures.length, 1)]}
        castShadow
        receiveShadow
        frustumCulled={false}
      >
        <meshStandardMaterial roughness={0.86} metalness={0.12} />
      </instancedMesh>

      <instancedMesh
        ref={bandRef}
        geometry={geometry}
        args={[undefined, undefined, Math.max(bands.length, 1)]}
        frustumCulled={false}
      >
        <meshStandardMaterial
          color="#2a2a26"
          // Warm, low and consistent with the gold accent used everywhere else.
          emissive="#d8b877"
          emissiveIntensity={0.05}
          roughness={0.5}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
};

interface Mast {
  position: THREE.Vector3;
  height: number;
}

/**
 * Communications masts.
 *
 * These carry most of the "MIDDLE JOURNEY: distant lights begin appearing"
 * requirement. Several are placed far off to the side at mid-route rather than
 * all at the destination — a mast a kilometre down the road is simply not
 * visible through the fog when the truck is halfway, so putting them laterally
 * is what actually makes lights appear when the brief says they should.
 */
const Masts: React.FC<{ masts: Mast[]; revealFrom: number; revealTo: number }> = ({
  masts,
  revealFrom,
  revealTo,
}) => {
  const poleRef = useRef<THREE.InstancedMesh>(null);
  const beaconRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const pole = poleRef.current;
    const beacon = beaconRef.current;
    if (!pole || !beacon) return;

    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const position = new THREE.Vector3();

    masts.forEach((mast, index) => {
      scale.set(1, mast.height, 1);
      matrix.compose(mast.position, quaternion, scale);
      pole.setMatrixAt(index, matrix);

      position.copy(mast.position);
      position.y += mast.height;
      scale.setScalar(1);
      matrix.compose(position, quaternion, scale);
      beacon.setMatrixAt(index, matrix);
    });

    pole.instanceMatrix.needsUpdate = true;
    beacon.instanceMatrix.needsUpdate = true;
    pole.computeBoundingSphere();
    beacon.computeBoundingSphere();
  }, [masts]);

  useEmissiveReveal(beaconRef, revealFrom, revealTo, 0.15, 4.2);

  const poleGeometry = useMemo(() => {
    const geom = new THREE.CylinderGeometry(0.5, 1.5, 1, 5);
    geom.translate(0, 0.5, 0);
    return geom;
  }, []);
  useEffect(() => () => poleGeometry.dispose(), [poleGeometry]);

  return (
    <group>
      <instancedMesh
        ref={poleRef}
        geometry={poleGeometry}
        args={[undefined, undefined, Math.max(masts.length, 1)]}
        castShadow
        frustumCulled={false}
      >
        <meshStandardMaterial color="#1f2d42" roughness={0.78} metalness={0.4} />
      </instancedMesh>

      {/* Aircraft warning beacons — the small warm points that read as
          civilisation long before any structure is legible. */}
      <instancedMesh
        ref={beaconRef}
        args={[undefined, undefined, Math.max(masts.length, 1)]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1.05, 8, 6]} />
        <meshStandardMaterial
          color="#c9a24a"
          emissive="#D4AF37"
          emissiveIntensity={0.1}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
};

/**
 * Warm haze over the district.
 *
 * Three additive sprites standing in for the light pollution a lit district
 * throws into the air. Sprites always face the camera, so the halo stays
 * correct from every angle the follow camera reaches without any billboarding
 * maths, and three additive quads cost nothing next to a bloom pass.
 */
const DistrictGlow: React.FC<{ anchors: THREE.Vector3[] }> = ({ anchors }) => {
  const texture = useMemo(() => createGlowSprite(128), []);
  useEffect(() => () => texture.dispose(), [texture]);

  /*
   * Three separate refs rather than an array of them, because the reveal hooks
   * are hooks: they cannot be called in a loop whose length could change, and
   * each halo wants its own ramp timing anyway.
   */
  const ref0 = useRef<THREE.Sprite>(null);
  const ref1 = useRef<THREE.Sprite>(null);
  const ref2 = useRef<THREE.Sprite>(null);
  const spriteRefs = [ref0, ref1, ref2];

  useOpacityReveal(ref0, 0.42, 0.82, 0, 0.3);
  useOpacityReveal(ref1, 0.48, 0.86, 0, 0.24);
  useOpacityReveal(ref2, 0.52, 0.9, 0, 0.2);

  return (
    <group>
      {anchors.slice(0, 3).map((anchor, index) => (
        <sprite
          key={index}
          ref={spriteRefs[index]}
          position={[anchor.x, anchor.y + 34, anchor.z]}
          scale={[260 - index * 40, 120 - index * 18, 1]}
        >
          <spriteMaterial
            map={texture}
            color={index === 0 ? "#c89a4e" : "#6f8fc4"}
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </sprite>
      ))}
    </group>
  );
};

/**
 * The whole destination.
 *
 * Composed of three depth bands plus masts and glow, so the district resolves
 * gradually: masts first, then the far silhouette, then the core, then the lit
 * approach edge as the truck arrives.
 */
export const Destination: React.FC = () => {
  /* Approach edge — low buildings flanking the road just before the end. */
  const approach = useMemo(
    () => buildBand(10, 0x11a7f3b1, 0.86, 1.0, 40, 120, 8, 22),
    [],
  );

  /* Core — the district proper, taller, spanning the road's end. */
  const core = useMemo(() => buildBand(16, 0x39d05c7f, CORE_FROM, CORE_TO, 26, 200, 16, 62), []);

  /* Far band — tall, thin, pure silhouette. Deep in fog by design. */
  const far = useMemo(() => buildBand(12, 0x6ae2914d, 1.1, 1.38, 90, 380, 30, 96), []);

  const masts = useMemo<Mast[]>(() => {
    const random = makeRandom(0x24fb8a06);
    /*
     * Placements are chosen against the fog curve, not by eye. Each has to be
     * essentially invisible in the opening stretch (under ~10% opacity at
     * t = 0.12, where the brief wants open landscape and nothing else) while
     * still reading clearly by mid-route.
     *
     * That rules out anything much before t ≈ 0.70 on the outside of the
     * route's first bend: a mast at t = 0.52 and 215 units out measures 44%
     * opacity from the very start of the journey, because the road curves
     * toward it. The lateral distance is doing as much work here as the
     * along-route position.
     *
     * These moved again when the fog was thinned from 0.0028 to 0.0024 in the
     * refinement pass — clearer air pulled two of them back into view at
     * t = 0.12, at 16% and 12% opacity. Anything that changes the fog has to
     * come back through here; the two settings are not independent.
     */
    const specs: [number, number][] = [
      // The first lights the journey shows — far to the side, not far ahead,
      // because fog hides anything a kilometre down the road entirely.
      [0.74, 240], // 7% opacity at t=0.12, 30% by t=0.45
      [0.7, -300], // 9% at t=0.12, 49% by t=0.45
      [0.76, 196], // 6% at t=0.12, 32% by t=0.45
      [0.84, -170], // 9% at t=0.12, 54% by t=0.45
      // In and around the district: invisible until the approach.
      [1.0, 150],
      [1.08, -128],
    ];
    const point = new THREE.Vector3();
    const side = new THREE.Vector3();

    return specs.map(([t, offset]) => {
      getExtendedPoint(t, point);
      getExtendedSide(t, side);
      const position = point.clone().addScaledVector(side, offset);
      position.y = terrainHeight(t, offset);
      return { position, height: 46 + random() * 34 };
    });
  }, []);

  const glowAnchors = useMemo(() => {
    const point = new THREE.Vector3();
    return [1.02, 1.12, 0.94].map((t) => {
      getExtendedPoint(t, point);
      return new THREE.Vector3(point.x, terrainHeight(t, 0), point.z);
    });
  }, []);

  return (
    <group>
      <Masts masts={masts} revealFrom={0.26} revealTo={0.52} />
      <Buildings structures={far} revealFrom={0.4} revealTo={0.76} />
      <Buildings structures={core} revealFrom={0.46} revealTo={0.82} />
      <Buildings structures={approach} revealFrom={0.56} revealTo={0.9} />
      <DistrictGlow anchors={glowAnchors} />
    </group>
  );
};

export default Destination;
