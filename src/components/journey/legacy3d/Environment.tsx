"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { PAVED_HALF_WIDTH, getExtendedPoint, getExtendedSide } from "./journeyPath";
import { buildRibbon } from "./ribbon";
import {
  CORRIDOR_HALF_WIDTH,
  byVariant,
  scatter,
  terrainHeight,
  type ScatterItem,
} from "./terrain";
import { useEmissiveReveal } from "./reveal";

/** The corridor runs a little past both ends so the world never stops mid-air. */
const CORRIDOR_FROM = -0.06;
/**
 * Extended well past the road's end so the destination district has ground to
 * stand on. The road stops at t = 1; the world does not.
 */
const CORRIDOR_TO = 1.42;
const CORRIDOR_SEGMENTS = 360;

/**
 * Lateral vertex columns across the corridor.
 *
 * Deliberately non-uniform. An evenly spaced grid wide enough to reach the
 * horizon would either be too coarse at the roadside — where every vertex is
 * a few metres from the camera — or ruinously dense in the distance where a
 * whole hill covers ten pixels. Squaring the distribution puts the vertices
 * where the eye actually is.
 */
function buildColumns(): number[] {
  const inner = [0, PAVED_HALF_WIDTH * 0.55, PAVED_HALF_WIDTH];
  const outer: number[] = [];
  const STEPS = 13;
  for (let i = 1; i <= STEPS; i++) {
    const f = i / STEPS;
    outer.push(PAVED_HALF_WIDTH + (CORRIDOR_HALF_WIDTH - PAVED_HALF_WIDTH) * Math.pow(f, 2.1));
  }
  const half = [...inner, ...outer];
  // Mirror to the left, dropping the duplicated centreline column.
  return [...half.slice(1).reverse().map((v) => -v), ...half];
}

/*
 * Terrain tones, lifted well above the near-black they were.
 *
 * The scene was reading as "dark low-poly forest" largely because the ground
 * was almost the same value as the sky behind it, so nothing had a silhouette.
 * Blue hour is not a dark scene — it is a scene with a luminous sky and a
 * ground that is *readable* but low in contrast, and these values put the
 * terrain where it can actually catch the key light.
 */
const LOW = new THREE.Color("#2a3e5c");
const HIGH = new THREE.Color("#4e6c96");

/**
 * The landscape the road runs through.
 *
 * Swept along the same curve as the road rather than laid out as a flat world
 * grid. That is what guarantees the ground is exactly level at the verge for
 * the road's entire length — with a world grid the road would sink into a hill
 * or hang over a dip somewhere along the route, and finding where is a manual
 * hunt every time the path is retuned.
 */
const Terrain: React.FC = () => {
  const geometry = useMemo(() => {
    const columns = buildColumns();
    return buildRibbon({
      offsets: columns,
      segments: CORRIDOR_SEGMENTS,
      from: CORRIDOR_FROM,
      to: CORRIDOR_TO,
      height: terrainHeight,
      // Higher ground reads very slightly cooler and lighter, as if catching
      // more sky. Vertex colours rather than a texture: the variation is
      // low-frequency, so per-vertex is already more resolution than it needs.
      color: (_t, _offset, height) =>
        LOW.clone().lerp(HIGH, THREE.MathUtils.clamp(height / 46, 0, 1)),
    });
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.96} metalness={0.02} flatShading={false} />
    </mesh>
  );
};

/**
 * Places scattered instances onto an InstancedMesh.
 *
 * Every scattered element in the scene goes through this: hundreds of objects
 * for one draw call each, which is the only reason a populated landscape is
 * affordable at all here.
 */
interface ScatterInstanceOptions {
  /** Height above the ground, scaled with the instance. */
  lift?: number;
  /** Tonal range: instances lerp between these by their `tone`. */
  colorFrom?: THREE.Color;
  colorTo?: THREE.Color;
  /** Whether to apply each item's per-axis stretch. */
  useStretch?: boolean;
}

function useScatterInstances(
  meshRef: React.RefObject<THREE.InstancedMesh | null>,
  items: ScatterItem[],
  options: ScatterInstanceOptions = {},
) {
  const { lift = 0, colorFrom, colorTo, useStretch = true } = options;

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const side = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const tiltQuat = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const tiltAxis = new THREE.Vector3();
    const color = new THREE.Color();

    items.forEach((item, index) => {
      getExtendedPoint(item.t, position);
      getExtendedSide(item.t, side);
      position.addScaledVector(side, item.offset);
      position.y = item.y + lift * item.scale * (useStretch ? item.stretch[1] : 1);

      quaternion.setFromAxisAngle(up, item.rotation);
      if (item.tilt) {
        // Lean about a horizontal axis chosen by the item's own yaw, so the
        // lean direction varies with the instance rather than all leaning east.
        tiltAxis.set(Math.cos(item.rotation), 0, Math.sin(item.rotation));
        tiltQuat.setFromAxisAngle(tiltAxis, item.tilt);
        quaternion.multiply(tiltQuat);
      }

      if (useStretch) {
        scale.set(
          item.scale * item.stretch[0],
          item.scale * item.stretch[1],
          item.scale * item.stretch[2],
        );
      } else {
        scale.setScalar(item.scale);
      }

      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(index, matrix);

      if (colorFrom && colorTo) {
        mesh.setColorAt(index, color.copy(colorFrom).lerp(colorTo, item.tone));
      }
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [meshRef, items, lift, colorFrom, colorTo, useStretch]);
}

/**
 * Conifers, as a cone on a trunk.
 *
 * Twelve triangles each and no texture, because at every distance they are
 * ever seen they are silhouettes — the fog takes their detail long before the
 * camera could resolve it. Spending geometry on them would buy nothing.
 */
const FOLIAGE_DARK = new THREE.Color("#22394a");
const FOLIAGE_LIGHT = new THREE.Color("#365561");

const Trees: React.FC = () => {
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const spireRef = useRef<THREE.InstancedMesh>(null);
  const broadConiferRef = useRef<THREE.InstancedMesh>(null);
  const roundedRef = useRef<THREE.InstancedMesh>(null);

  const items = useMemo(
    () =>
      scatter({
        /*
         * Down from 260. The landscape was reading as a forest the road had
         * been cut through, which is the opposite of the open, designed
         * country the brief calls for. Fewer trees in tighter stands, with
         * real emptiness between them, is what makes the terrain itself —
         * and the road running across it — the subject.
         */
        count: 118,
        seed: 0x2f6b13a9,
        // Kept well clear of the carriageway: close enough to give the
        // roadside scale, far enough that nothing flicks past the camera.
        minOffset: 38,
        maxOffset: 360,
        minScale: 2.6,
        maxScale: 7.2,
        offsetBias: 0.75,
        variants: 3,
        stretchRange: 0.34,
        maxTilt: 0.07,
        clusters: 19,
        clusterSpread: 0.02,
        clusterWidth: 46,
      }),
    [],
  );

  /*
   * Three species rather than one, and each instance independently stretched
   * and leaned. Previously every tree was the same cone at a different size,
   * which the eye reads as a copy no matter how many there are — silhouette is
   * what gives repetition away, not count. Three silhouettes crossed with
   * per-axis stretch and a tonal range is enough that no two read as the same
   * object at the distances involved.
   */
  const [spires, broad, rounded] = useMemo(() => byVariant(items, 3), [items]);

  const tone = { colorFrom: FOLIAGE_DARK, colorTo: FOLIAGE_LIGHT };

  useScatterInstances(trunkRef, items, { lift: 0.42 });
  useScatterInstances(spireRef, spires, { lift: 2.25, ...tone });
  useScatterInstances(broadConiferRef, broad, { lift: 1.6, ...tone });
  useScatterInstances(roundedRef, rounded, { lift: 1.75, ...tone });

  return (
    <group>
      {/* One trunk mesh serves every species — they differ only above it. */}
      <instancedMesh
        ref={trunkRef}
        args={[undefined, undefined, items.length]}
        castShadow
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.1, 0.17, 0.95, 5]} />
        <meshStandardMaterial color="#121a26" roughness={0.95} />
      </instancedMesh>

      {/* Tall narrow conifer. */}
      <instancedMesh
        ref={spireRef}
        args={[undefined, undefined, Math.max(spires.length, 1)]}
        castShadow
        frustumCulled={false}
      >
        <coneGeometry args={[0.66, 3.9, 7]} />
        <meshStandardMaterial roughness={0.92} metalness={0.02} flatShading />
      </instancedMesh>

      {/* Shorter, broader conifer. */}
      <instancedMesh
        ref={broadConiferRef}
        args={[undefined, undefined, Math.max(broad.length, 1)]}
        castShadow
        frustumCulled={false}
      >
        <coneGeometry args={[1.12, 2.5, 6]} />
        <meshStandardMaterial roughness={0.93} metalness={0.02} flatShading />
      </instancedMesh>

      {/* Rounded broadleaf, to break the run of triangles entirely. */}
      <instancedMesh
        ref={roundedRef}
        args={[undefined, undefined, Math.max(rounded.length, 1)]}
        castShadow
        frustumCulled={false}
      >
        <icosahedronGeometry args={[1.25, 0]} />
        <meshStandardMaterial roughness={0.94} metalness={0.02} flatShading />
      </instancedMesh>
    </group>
  );
};

/**
 * Low scrub along the verge.
 *
 * Small, dark and numerous. Its whole job is to break the clean line where the
 * shoulder meets the terrain, which would otherwise read as a seam between two
 * meshes rather than as a roadside.
 */
const SCRUB_DARK = new THREE.Color("#263a4c");
const SCRUB_LIGHT = new THREE.Color("#3d5469");

const Vegetation: React.FC = () => {
  const shrubRef = useRef<THREE.InstancedMesh>(null);
  const rockRef = useRef<THREE.InstancedMesh>(null);

  const items = useMemo(
    () =>
      scatter({
        // Down from 440, and gathered into patches for the same reason as the
        // trees: continuous verge planting the whole length of the road is
        // what made it look procedurally filled.
        count: 156,
        seed: 0x7d41c05b,
        minOffset: PAVED_HALF_WIDTH + 1.6,
        maxOffset: 74,
        minScale: 0.5,
        maxScale: 1.9,
        // Biased hard toward the road: this is verge planting, and anything
        // far out is already covered by the trees.
        offsetBias: 2.4,
        variants: 2,
        // Wide, because a boulder and a bush are the same primitive here —
        // the stretch is doing the work of distinguishing them.
        stretchRange: 0.55,
        maxTilt: 0.35,
        clusters: 30,
        clusterSpread: 0.014,
        clusterWidth: 22,
      }),
    [],
  );

  const [shrubs, rocks] = useMemo(() => byVariant(items, 2), [items]);
  const tone = { colorFrom: SCRUB_DARK, colorTo: SCRUB_LIGHT };

  useScatterInstances(shrubRef, shrubs, { lift: 0.22, ...tone });
  useScatterInstances(rockRef, rocks, { lift: 0.16, ...tone });

  return (
    <group>
      <instancedMesh
        ref={shrubRef}
        args={[undefined, undefined, Math.max(shrubs.length, 1)]}
        frustumCulled={false}
      >
        <icosahedronGeometry args={[0.62, 0]} />
        <meshStandardMaterial roughness={0.98} flatShading />
      </instancedMesh>

      {/* Angular rather than round, so rocks read as rock next to the shrubs. */}
      <instancedMesh
        ref={rockRef}
        args={[undefined, undefined, Math.max(rocks.length, 1)]}
        castShadow
        frustumCulled={false}
      >
        <dodecahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial roughness={0.95} metalness={0.05} flatShading />
      </instancedMesh>
    </group>
  );
};

/**
 * Reflective delineator posts along both shoulders.
 *
 * The one piece of roadside furniture worth its draw call: evenly spaced
 * markers are how a road communicates speed. Without them a curving strip of
 * asphalt gives the eye nothing to measure motion against, and the truck
 * appears to drift rather than travel.
 */
const DelineatorPosts: React.FC = () => {
  const postRef = useRef<THREE.InstancedMesh>(null);
  const reflectorRef = useRef<THREE.InstancedMesh>(null);

  const items = useMemo<ScatterItem[]>(() => {
    const out: ScatterItem[] = [];
    const COUNT = 74;
    const offset = PAVED_HALF_WIDTH + 1.5;
    for (let i = 0; i < COUNT; i++) {
      const t = i / (COUNT - 1);
      for (const sign of [-1, 1]) {
        out.push({
          t,
          offset: sign * offset,
          y: terrainHeight(t, sign * offset),
          scale: 1,
          rotation: 0,
          stretch: [1, 1, 1],
          variant: 0,
          tone: 0,
          tilt: 0,
        });
      }
    }
    return out;
  }, []);

  useScatterInstances(postRef, items, { lift: 0.62, useStretch: false });
  useScatterInstances(reflectorRef, items, { lift: 1.06, useStretch: false });

  return (
    <group>
      <instancedMesh ref={postRef} args={[undefined, undefined, items.length]} castShadow>
        <boxGeometry args={[0.1, 1.24, 0.1]} />
        <meshStandardMaterial color="#2a3242" roughness={0.7} metalness={0.25} />
      </instancedMesh>
      {/*
       * The restrained gold accent, and the only one in the environment. It
       * works precisely because it is 10cm wide and repeated — a line of warm
       * points receding into fog, rather than a gold surface anywhere.
       */}
      <instancedMesh ref={reflectorRef} args={[undefined, undefined, items.length]}>
        <boxGeometry args={[0.12, 0.17, 0.05]} />
        <meshStandardMaterial
          color="#B8860B"
          emissive="#D4AF37"
          emissiveIntensity={1.35}
          roughness={0.35}
          metalness={0.6}
        />
      </instancedMesh>
    </group>
  );
};

/**
 * Street lighting along the approach to the destination.
 *
 * Deliberately confined to the last quarter of the route. Lit highway is a
 * signal of infrastructure and proximity to somewhere — running it the whole
 * length would say the opposite, that the road is developed all the way, and
 * the journey would lose its "open country, then arrival" shape entirely.
 *
 * The lamps come up with progress so they read as being reached rather than as
 * having always been on.
 */
const ApproachLighting: React.FC = () => {
  const columnRef = useRef<THREE.InstancedMesh>(null);
  const armRef = useRef<THREE.InstancedMesh>(null);
  const lampRef = useRef<THREE.InstancedMesh>(null);

  const items = useMemo<ScatterItem[]>(() => {
    const out: ScatterItem[] = [];
    const COUNT = 26;
    const FROM = 0.74;
    const TO = 1.0;
    const offset = PAVED_HALF_WIDTH + 3.2;
    const side = new THREE.Vector3();

    for (let i = 0; i < COUNT; i++) {
      const t = FROM + ((TO - FROM) * i) / (COUNT - 1);
      // Alternating sides, the way real motorway lighting is staggered.
      const sign = i % 2 === 0 ? 1 : -1;

      /*
       * Yaw is derived from the road's lateral direction at this point, not
       * set to a fixed angle. The route curves, so a constant rotation would
       * leave the lamp arms pointing along world X and reaching across the
       * carriageway only where the road happens to run east-west.
       *
       * Rot_Y(theta) maps local +X to (cos theta, 0, -sin theta), so aiming
       * local +X down the inward vector means theta = atan2(-inward.z, inward.x).
       */
      getExtendedSide(t, side);
      const inwardX = -side.x * sign;
      const inwardZ = -side.z * sign;
      const yaw = Math.atan2(-inwardZ, inwardX);

      out.push({
        t,
        offset: sign * offset,
        y: terrainHeight(t, sign * offset),
        scale: 1,
        rotation: yaw,
        stretch: [1, 1, 1],
        variant: 0,
        tone: 0,
        tilt: 0,
      });
    }
    return out;
  }, []);

  /*
   * The arm and lamp head hang out over the road, so they are placed at
   * reduced lateral offsets rather than on the column's own axis — but they
   * keep the column's ground height, because they are attached to the pole,
   * not standing on whatever terrain is beneath them.
   */
  const armItems = useMemo(
    () => items.map((item) => ({ ...item, offset: item.offset - Math.sign(item.offset) * 1.7 })),
    [items],
  );
  const lampItems = useMemo(
    () => items.map((item) => ({ ...item, offset: item.offset - Math.sign(item.offset) * 3.3 })),
    [items],
  );

  useScatterInstances(columnRef, items, { lift: 4.4, useStretch: false });
  useScatterInstances(armRef, armItems, { lift: 8.6, useStretch: false });
  useScatterInstances(lampRef, lampItems, { lift: 8.45, useStretch: false });

  useEmissiveReveal(lampRef, 0.56, 0.86, 0.05, 2.4);

  return (
    <group>
      <instancedMesh
        ref={columnRef}
        args={[undefined, undefined, items.length]}
        castShadow
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.13, 0.2, 8.8, 6]} />
        <meshStandardMaterial color="#222c3a" roughness={0.68} metalness={0.5} />
      </instancedMesh>

      {/* The arm reaches inward along local -X toward the carriageway. */}
      <instancedMesh
        ref={armRef}
        args={[undefined, undefined, items.length]}
        castShadow
        frustumCulled={false}
      >
        <boxGeometry args={[3.4, 0.14, 0.14]} />
        <meshStandardMaterial color="#222c3a" roughness={0.68} metalness={0.5} />
      </instancedMesh>

      {/* Lamp head. Warm, small, and the only lit thing on the pole. */}
      <instancedMesh
        ref={lampRef}
        args={[undefined, undefined, items.length]}
        frustumCulled={false}
      >
        <boxGeometry args={[1.0, 0.16, 0.42]} />
        <meshStandardMaterial
          color="#8a7448"
          emissive="#e8c07a"
          emissiveIntensity={0.05}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
};

/**
 * Gradient sky dome.
 *
 * Follows the camera so it can never be reached or left behind, and opts out
 * of fog — it *is* the colour the fog resolves to, so fogging it would wash
 * the gradient into a flat field. A plain background colour was the previous
 * behaviour and it is what made the scene read as empty: with no horizon
 * gradient there is nothing for distant hills to be silhouetted against.
 */
const SkyDome: React.FC<{ radius?: number }> = ({ radius = 1200 }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        /*
         * Blue hour, not night. The horizon is genuinely luminous — that is
         * what the hour is — and it is the single biggest lever on whether the
         * scene reads as premium dusk or as an underlit night scene. Distant
         * hills and the destination's towers all depend on having something
         * bright enough behind them to be silhouetted against.
         */
        uniforms: {
          uHorizon: { value: new THREE.Color("#4d7ba8") },
          uZenith: { value: new THREE.Color("#162844") },
          uGround: { value: new THREE.Color("#1a2638") },
          uGlow: { value: new THREE.Color("#d49b42") },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDirection;
          void main() {
            vDirection = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uHorizon;
          uniform vec3 uZenith;
          uniform vec3 uGround;
          uniform vec3 uGlow;
          varying vec3 vDirection;

          void main() {
            float h = vDirection.y;

            // Above the horizon: warm-ish navy fading up to near-black.
            vec3 sky = mix(uHorizon, uZenith, pow(clamp(h, 0.0, 1.0), 0.55));
            // Below it: darker still, so the terrain sits against something.
            vec3 ground = mix(uHorizon, uGround, pow(clamp(-h, 0.0, 1.0), 0.4));
            vec3 color = h > 0.0 ? sky : ground;

            // A single low, wide band of warmth sitting just on the horizon —
            // the suggestion of a sun long since set. Tight enough in height
            // that it never reads as a light source of its own.
            float band = exp(-pow(h / 0.085, 2.0));
            color += uGlow * band * 0.75;

            gl_FragColor = vec4(color, 1.0);
          }
        `,
      }),
    [],
  );

  useEffect(() => () => material.dispose(), [material]);

  useFrame(() => {
    if (meshRef.current) meshRef.current.position.copy(camera.position);
  });

  return (
    <mesh ref={meshRef} material={material} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[radius, 32, 20]} />
    </mesh>
  );
};

/**
 * The world the journey happens in.
 *
 * Grouped here so JourneyScene stays a composition rather than a pile of
 * geometry, and so the whole landscape can be swapped or dropped for a
 * low-powered device with one line.
 */
export const JourneyEnvironment: React.FC = () => (
  <group>
    <SkyDome />
    <Terrain />
    <Trees />
    <Vegetation />
    <DelineatorPosts />
    <ApproachLighting />
  </group>
);

export default JourneyEnvironment;
