"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { getExtendedPoint, getExtendedSide, smoothstep } from "./journeyPath";
import { buildRibbon, mergeRibbons } from "./ribbon";
import { useJourneyProgress } from "../journeyProgress";

// Deterministic PRNG for consistent placement across re-renders
function makeRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Photorealistic Dense Conifer Crown Geometry
 *
 * Recreates the lush, unbroken, circular pine crowns seen in overhead drone footage:
 * - Central conical spire tip
 * - 5 dense, overlapping tiers with 8 to 14 rounded needle lobes per tier
 * - Baked vertex color gradients: sunlit chartreuse at the crest, transitioning
 *   to rich spruce green, and deep forest shadow in the under-skirt.
 * - Produces full, rounded, multi-faceted conifer silhouettes with NO empty star gaps.
 */
function createDenseDronePineGeometry(): THREE.BufferGeometry {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  let vertIndex = 0;

  // Color anchors for baked internal tree lighting
  const cSunlit = new THREE.Color("#8ec446"); // Sun-kissed golden needle crest
  const cMid = new THREE.Color("#2c6333");    // Healthy mountain spruce body
  const cDeep = new THREE.Color("#0e2414");   // Deep shaded under-skirt

  // 1. Central apical spire tip
  const apexIdx = vertIndex;
  positions.push(0, 3.2, 0);
  colors.push(cSunlit.r, cSunlit.g, cSunlit.b);
  vertIndex++;

  const spireSegments = 10;
  for (let s = 0; s < spireSegments; s++) {
    const angle = (s / spireSegments) * Math.PI * 2;
    positions.push(Math.cos(angle) * 0.28, 0.4, Math.sin(angle) * 0.28);
    colors.push(cMid.r, cMid.g, cMid.b);
    vertIndex++;
  }
  for (let s = 0; s < spireSegments; s++) {
    const nextS = (s + 1) % spireSegments;
    indices.push(apexIdx, apexIdx + 1 + s, apexIdx + 1 + nextS);
  }

  // 2. 5 Dense Tiers of overlapping rounded needle lobes (8 to 13 lobes per tier)
  // Packing 10-13 lobes per tier creates a full, dense, circular crown without star gaps
  const tiers = [
    { y: 2.65, r: 0.85, count: 8,  rot: 0.12, lobeW: 0.44, droop: 0.14, col: cSunlit },
    { y: 2.05, r: 1.35, count: 10, rot: 0.52, lobeW: 0.48, droop: 0.20, col: cSunlit.clone().lerp(cMid, 0.35) },
    { y: 1.45, r: 1.85, count: 11, rot: 1.15, lobeW: 0.52, droop: 0.26, col: cMid },
    { y: 0.90, r: 2.30, count: 12, rot: 0.38, lobeW: 0.56, droop: 0.32, col: cMid.clone().lerp(cDeep, 0.45) },
    { y: 0.35, r: 2.65, count: 13, rot: 0.95, lobeW: 0.60, droop: 0.38, col: cDeep },
  ];

  tiers.forEach((tier) => {
    for (let b = 0; b < tier.count; b++) {
      const angle = (b / tier.count) * Math.PI * 2 + tier.rot;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const perpX = -sinA;
      const perpZ = cosA;

      const L = tier.r;
      const w = tier.lobeW * L * 0.52;
      const droop = tier.droop;

      // 6 Vertices per lobe with baked vertex colors
      const vTrunk = [0, tier.y, 0];
      const vRidge = [cosA * L * 0.52, tier.y + 0.10 * L, sinA * L * 0.52];
      const vLeft  = [cosA * L * 0.62 + perpX * w, tier.y - 0.08 * L, sinA * L * 0.62 + perpZ * w];
      const vRight = [cosA * L * 0.62 - perpX * w, tier.y - 0.08 * L, sinA * L * 0.62 - perpZ * w];
      const vTip   = [cosA * L, tier.y - droop * L, sinA * L];
      const vBelly = [cosA * L * 0.55, tier.y - 0.22 * L, sinA * L * 0.55];

      const start = vertIndex;
      positions.push(...vTrunk, ...vRidge, ...vLeft, ...vRight, ...vTip, ...vBelly);

      // Vertex color gradients
      const cTip = tier.col;
      const cTrunk = cDeep;
      colors.push(cTrunk.r, cTrunk.g, cTrunk.b); // 0: Trunk
      colors.push(cTip.r * 1.08, cTip.g * 1.08, cTip.b * 1.08); // 1: Ridge
      colors.push(cTip.r * 0.92, cTip.g * 0.92, cTip.b * 0.92); // 2: Left
      colors.push(cTip.r * 0.88, cTip.g * 0.88, cTip.b * 0.88); // 3: Right
      colors.push(cTip.r, cTip.g, cTip.b); // 4: Tip
      colors.push(cDeep.r, cDeep.g, cDeep.b); // 5: Belly

      vertIndex += 6;

      // Upper facets
      indices.push(start + 0, start + 2, start + 1);
      indices.push(start + 0, start + 1, start + 3);
      indices.push(start + 1, start + 2, start + 4);
      indices.push(start + 1, start + 4, start + 3);

      // Under-facets
      indices.push(start + 0, start + 5, start + 2);
      indices.push(start + 0, start + 3, start + 5);
      indices.push(start + 5, start + 4, start + 2);
      indices.push(start + 5, start + 3, start + 4);
    }
  });

  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
  geom.setAttribute("color", new THREE.BufferAttribute(new Float32Array(colors), 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Dense Understory Shrub Mound (fills gaps between tree trunks)
 */
function createBushGeometry(): THREE.BufferGeometry {
  const geom = new THREE.DodecahedronGeometry(1.2, 1);
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const bump = 1 + 0.22 * Math.sin(x * 6 + y * 8 + z * 5);
    pos.setXYZ(i, x * bump, Math.max(0.12, y * bump * 0.70), z * bump);
  }
  geom.computeVertexNormals();
  return geom;
}

/**
 * Roadside Granite Boulder Geometry
 */
function createRockGeometry(): THREE.BufferGeometry {
  const geom = new THREE.DodecahedronGeometry(0.9, 0);
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    pos.setXYZ(i, x * 1.35, y * 0.72, z * 1.15);
  }
  geom.computeVertexNormals();
  return geom;
}

/**
 * Tree Tint Palette (multiplied with baked vertex colors)
 * Matches the reference drone image:
 * - 70% deep rich forest evergreen
 * - 30% warm sun-drenched conifer tones
 */
const PINE_TINTS = [
  new THREE.Color("#163d20"), // Deep evergreen
  new THREE.Color("#1c4826"), // Classic pine
  new THREE.Color("#22542e"), // Rich mountain spruce
  new THREE.Color("#2a6136"), // Vibrant conifer
  new THREE.Color("#35723f"), // Upper canopy green
  new THREE.Color("#488746"), // Sunlit spruce
  new THREE.Color("#689e3a"), // Golden moss crest
  new THREE.Color("#7db542"), // Sunlit chartreuse highlight
];

// Understory shrub colors (rich mossy conifer tones)
const BUSH_COLORS = [
  new THREE.Color("#193e22"),
  new THREE.Color("#214c2a"),
  new THREE.Color("#2b5c34"),
  new THREE.Color("#376d3e"),
  new THREE.Color("#468045"),
];

// Roadside granite boulder colors (matching rocky road verge in photo)
const ROCK_COLORS = [
  new THREE.Color("#5a5146"),
  new THREE.Color("#463e36"),
  new THREE.Color("#685f53"),
  new THREE.Color("#3a342d"),
  new THREE.Color("#756b5e"),
];

// Packing density: 2400 trees + 1200 bushes concentrated directly in visible window
const PINE_COUNT = 2400;
const BUSH_COUNT = 1200;
const ROCK_COUNT = 150;

export const TopDownForest: React.FC = () => {
  const progress = useJourneyProgress();
  const groupRef = useRef<THREE.Group>(null);

  const pineMeshRef = useRef<THREE.InstancedMesh>(null);
  const trunkMeshRef = useRef<THREE.InstancedMesh>(null);
  const bushMeshRef = useRef<THREE.InstancedMesh>(null);
  const rockMeshRef = useRef<THREE.InstancedMesh>(null);
  const mistGroupRef = useRef<THREE.Group>(null);

  // Generate deterministic trees, bushes, and rocks flanking the road
  const { pines, bushes, rocks } = useMemo(() => {
    const rand = makeRandom(0x5c9f2b18);

    const FROM_T = 0.68;
    const TO_T = 1.32;

    // 1. Dominant & Filler Conifer Trees
    // Crucial: Packed tightly within the visible camera viewport (offset 12.8 to 46.0)
    // Overlapping each other to form a 100% solid, continuous, gap-free forest carpet!
    const pineList = [];
    for (let i = 0; i < PINE_COUNT; i++) {
      const isLeft = i % 2 === 0;
      const flankSign = isLeft ? -1 : 1;

      const stratum = i / PINE_COUNT;
      const t = FROM_T + (TO_T - FROM_T) * (stratum + (rand() - 0.5) * 0.022);

      // Concentrated directly within the visible 35-unit flank band
      const distFromVerge = Math.pow(rand(), 1.15) * 34;
      const offset = flankSign * (12.8 + distFromVerge);

      // Subtle natural elevation variation
      const y = -0.30 + Math.log(distFromVerge + 1) * 0.22 + (rand() - 0.5) * 0.35;

      // Realistic scale: crown diameter between 3.6 and 5.4 units, overlapping neighboring trees
      const isDominant = rand() < 0.30;
      const baseScale = isDominant ? (1.35 + rand() * 0.35) : (0.95 + rand() * 0.32);
      const scaleX = baseScale * (0.92 + rand() * 0.16);
      const scaleY = baseScale * (1.0 + rand() * 0.22);
      const scaleZ = scaleX;

      const rotation = rand() * Math.PI * 2;
      const colorIndex = Math.floor(rand() * PINE_TINTS.length);

      pineList.push({ t, offset, y, scaleX, scaleY, scaleZ, rotation, colorIndex });
    }

    // 2. Dense Understory Bushes packing every under-canopy crevice
    const bushList = [];
    for (let i = 0; i < BUSH_COUNT; i++) {
      const flankSign = i % 2 === 0 ? -1 : 1;
      const t = FROM_T + (TO_T - FROM_T) * rand();
      const dist = Math.pow(rand(), 1.3) * 32;
      const offset = flankSign * (12.6 + dist);
      const y = -0.38 + Math.log(dist + 1) * 0.18;
      const scale = 1.0 + rand() * 1.2;
      const rotation = rand() * Math.PI * 2;
      const colorIndex = Math.floor(rand() * BUSH_COLORS.length);
      bushList.push({ t, offset, y, scale, rotation, colorIndex });
    }

    // 3. Roadside Granite Boulders lining the amber curbs
    const rockList = [];
    for (let i = 0; i < ROCK_COUNT; i++) {
      const flankSign = i % 2 === 0 ? -1 : 1;
      const t = FROM_T + (TO_T - FROM_T) * rand();
      const offset = flankSign * (11.7 + rand() * 1.6);
      const y = -0.12 + (rand() - 0.5) * 0.12;
      const scale = 0.8 + rand() * 1.1;
      const rotation = rand() * Math.PI * 2;
      const colorIndex = Math.floor(rand() * ROCK_COLORS.length);
      rockList.push({ t, offset, y, scale, rotation, colorIndex });
    }

    return { pines: pineList, bushes: bushList, rocks: rockList };
  }, []);

  // Geometries
  const pineCrownGeom = useMemo(() => createDenseDronePineGeometry(), []);
  const bushGeom = useMemo(() => createBushGeometry(), []);
  const rockGeom = useMemo(() => createRockGeometry(), []);

  useEffect(() => {
    return () => {
      pineCrownGeom.dispose();
      bushGeom.dispose();
      rockGeom.dispose();
    };
  }, [pineCrownGeom, bushGeom, rockGeom]);

  // Continuous Forest Floor Terrain: covers the entire ground beneath the trees
  const groundGeometry = useMemo(() => {
    const FROM_T = 0.68;
    const TO_T = 1.32;
    const SEGMENTS = 280;
    const groundColor = new THREE.Color();

    const buildFlank = (sign: number) =>
      buildRibbon({
        offsets: [
          sign * 11.5,
          sign * 13.0,
          sign * 16.5,
          sign * 24.0,
          sign * 36.0,
          sign * 54.0,
          sign * 85.0,
        ],
        segments: SEGMENTS,
        from: FROM_T,
        to: TO_T,
        height: (_t, offset) => {
          const dist = Math.abs(offset) - 11.5;
          return -0.32 + Math.sin(dist * 0.22) * 0.35 + Math.log(dist + 1) * 0.25;
        },
        color: (t, offset) => {
          const dist = Math.abs(offset) - 11.5;
          const noise = Math.sin(t * 85 + offset * 0.6) * 0.03;
          if (dist < 2.2) {
            // Earthy rocky gravel shoulder beside the glowing amber curbs
            const v = THREE.MathUtils.clamp(0.14 + noise, 0.09, 0.20);
            return groundColor.setRGB(v * 1.15, v * 1.05, v * 0.88);
          } else {
            // Deep, rich, mossy forest humus beneath the conifer canopy
            const mossFactor = THREE.MathUtils.clamp((dist - 2.2) / 22, 0, 1);
            const r = THREE.MathUtils.lerp(0.06, 0.035, mossFactor) + noise * 0.15;
            const g = THREE.MathUtils.lerp(0.16, 0.11, mossFactor) + noise * 0.25;
            const b = THREE.MathUtils.lerp(0.07, 0.045, mossFactor) + noise * 0.15;
            return groundColor.setRGB(r, g, b);
          }
        },
        vScale: 90,
      });

    return mergeRibbons([buildFlank(-1), buildFlank(1)]);
  }, []);

  useEffect(() => () => groundGeometry.dispose(), [groundGeometry]);

  // Populate InstancedMesh matrices
  useLayoutEffect(() => {
    const pineMesh = pineMeshRef.current;
    const trunkMesh = trunkMeshRef.current;
    const bushMesh = bushMeshRef.current;
    const rockMesh = rockMeshRef.current;
    if (!pineMesh || !trunkMesh || !bushMesh || !rockMesh) return;

    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const side = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);

    // 1. Pines & Trunks
    pines.forEach((pine, idx) => {
      getExtendedPoint(pine.t, position);
      getExtendedSide(pine.t, side);

      position.addScaledVector(side, pine.offset);
      position.y += pine.y;

      quaternion.setFromAxisAngle(up, pine.rotation);

      // Foliage Crown
      scale.set(pine.scaleX, pine.scaleY, pine.scaleZ);
      matrix.compose(position, quaternion, scale);
      pineMesh.setMatrixAt(idx, matrix);
      pineMesh.setColorAt(idx, PINE_TINTS[pine.colorIndex]);

      // Trunk
      scale.set(pine.scaleX * 0.22, pine.scaleY * 0.45, pine.scaleZ * 0.22);
      const trunkPos = position.clone();
      trunkPos.y -= pine.scaleY * 0.22;
      matrix.compose(trunkPos, quaternion, scale);
      trunkMesh.setMatrixAt(idx, matrix);
    });

    pineMesh.instanceMatrix.needsUpdate = true;
    if (pineMesh.instanceColor) pineMesh.instanceColor.needsUpdate = true;
    pineMesh.computeBoundingSphere();

    trunkMesh.instanceMatrix.needsUpdate = true;
    trunkMesh.computeBoundingSphere();

    // 2. Understory Bushes
    bushes.forEach((bush, idx) => {
      getExtendedPoint(bush.t, position);
      getExtendedSide(bush.t, side);

      position.addScaledVector(side, bush.offset);
      position.y += bush.y;

      quaternion.setFromAxisAngle(up, bush.rotation);
      scale.set(bush.scale, bush.scale * 0.75, bush.scale);
      matrix.compose(position, quaternion, scale);
      bushMesh.setMatrixAt(idx, matrix);
      bushMesh.setColorAt(idx, BUSH_COLORS[bush.colorIndex]);
    });

    bushMesh.instanceMatrix.needsUpdate = true;
    if (bushMesh.instanceColor) bushMesh.instanceColor.needsUpdate = true;
    bushMesh.computeBoundingSphere();

    // 3. Roadside Rocks
    rocks.forEach((rock, idx) => {
      getExtendedPoint(rock.t, position);
      getExtendedSide(rock.t, side);

      position.addScaledVector(side, rock.offset);
      position.y += rock.y;

      quaternion.setFromAxisAngle(up, rock.rotation);
      scale.set(rock.scale, rock.scale * 0.65, rock.scale);
      matrix.compose(position, quaternion, scale);
      rockMesh.setMatrixAt(idx, matrix);
      rockMesh.setColorAt(idx, ROCK_COLORS[rock.colorIndex]);
    });

    rockMesh.instanceMatrix.needsUpdate = true;
    if (rockMesh.instanceColor) rockMesh.instanceColor.needsUpdate = true;
    rockMesh.computeBoundingSphere();
  }, [pines, bushes, rocks]);

  // Scaled / revealed smoothly when camera swoops into top-down view (t >= 0.81)
  useFrame((state) => {
    const grp = groupRef.current;
    if (!grp) return;

    const t = progress.current;

    // Side view (t < 0.81): completely hidden so side view is 100% clean
    // Top-down view (t >= 0.81 to 0.965): smoothly appears and stays active as road scrolls
    if (t < 0.805 || t > 0.965) {
      grp.visible = false;
      return;
    }

    const fadeIn = smoothstep(0.805, 0.875, t);
    const fadeOut = 1 - smoothstep(0.945, 0.965, t);
    const reveal = fadeIn * fadeOut;

    grp.visible = reveal > 0.005;
    grp.scale.set(reveal, reveal, reveal);

    // Subtle alpine mist drift
    if (mistGroupRef.current) {
      const time = state.clock.getElapsedTime();
      mistGroupRef.current.position.x = Math.sin(time * 0.12) * 3;
      mistGroupRef.current.position.z = Math.cos(time * 0.10) * 3;
    }
  });

  return (
    <group ref={groupRef}>
      {/* 
        Directional Sunlight: Warm golden-hour light from top-left, matching the reference image.
        Casts crisp natural tree shadows across the canopy facets.
      */}
      <directionalLight
        position={[-45, 80, -25]}
        intensity={2.1}
        color="#fff4d4"
        castShadow={false}
      />
      {/* Rich forest sky ambient fill to keep deep shadows lush evergreen */}
      <ambientLight intensity={0.62} color="#1e3a24" />

      {/* 3D Forest Floor Terrain: mossy earth base filling entire ground */}
      <mesh geometry={groundGeometry} receiveShadow>
        <meshStandardMaterial
          roughness={0.92}
          metalness={0.02}
          vertexColors={true}
          flatShading={false}
        />
      </mesh>

      {/* Instanced Dense Conifer Tree Crowns with Baked Vertex Color Gradients */}
      <instancedMesh
        ref={pineMeshRef}
        args={[pineCrownGeom, undefined, PINE_COUNT]}
        castShadow
        receiveShadow
        frustumCulled={false}
      >
        <meshStandardMaterial
          roughness={0.72}
          metalness={0.04}
          vertexColors={true}
          flatShading={true} // Multi-lobed needle facets catch directional sunlight
        />
      </instancedMesh>

      {/* Instanced Understory Bush Mounds */}
      <instancedMesh
        ref={bushMeshRef}
        args={[bushGeom, undefined, BUSH_COUNT]}
        receiveShadow
        frustumCulled={false}
      >
        <meshStandardMaterial
          roughness={0.88}
          metalness={0.02}
          flatShading={true}
        />
      </instancedMesh>

      {/* Instanced Roadside Granite Rocks */}
      <instancedMesh
        ref={rockMeshRef}
        args={[rockGeom, undefined, ROCK_COUNT]}
        receiveShadow
        frustumCulled={false}
      >
        <meshStandardMaterial
          roughness={0.92}
          metalness={0.08}
          flatShading={true}
        />
      </instancedMesh>

      {/* Instanced Tree Trunks */}
      <instancedMesh
        ref={trunkMeshRef}
        args={[undefined, undefined, PINE_COUNT]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.22, 0.35, 1.2, 5]} />
        <meshStandardMaterial color="#1a140e" roughness={0.95} />
      </instancedMesh>

      {/* Soft Forest Mist Wisps */}
      <group ref={mistGroupRef}>
        {[-48, -26, 26, 48].map((xOffset, idx) => (
          <mesh
            key={idx}
            position={[xOffset * 1.15, 11 + idx * 1.2, idx * 28 - 35]}
            rotation={[-Math.PI / 2, 0, (idx * Math.PI) / 3]}
          >
            <circleGeometry args={[26, 24]} />
            <meshBasicMaterial
              color="#e6f2eb"
              transparent
              opacity={0.07}
              depthWrite={false}
              blending={THREE.NormalBlending}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
};

export default TopDownForest;
