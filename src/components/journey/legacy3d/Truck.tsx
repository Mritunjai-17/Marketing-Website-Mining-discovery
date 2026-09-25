"use client";

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, useGLTF } from "@react-three/drei";
import { getJourneyPoint, getJourneyTangent, journeyLength } from "./journeyPath";
import { useJourneyProgress } from "../journeyProgress";
import { createContactShadow, createGlowSprite } from "./proceduralTextures";

/**
 * Path to a web-optimised commercial truck GLB, relative to /public.
 *
 * `null` means "no model supplied yet", and the component draws the built-in
 * body instead. Set it to e.g. "/models/journey-truck.glb" and the built-in
 * one is replaced with no other code change — that is the whole point of
 * routing it through one constant rather than wiring useGLTF in directly.
 *
 * Whatever model goes here should be a modern tractor-trailer or box truck in
 * the low hundreds of KB (Draco or Meshopt compressed), NOT a mining haul
 * truck — the journey is about logistics and reach, not extraction.
 */
export const TRUCK_MODEL_URL: string | null = null;

/** Radius the wheels roll on. Drives the rotation rate, so it must be real. */
const WHEEL_RADIUS = 0.62;
const WHEEL_WIDTH = 0.44;

/** Axle stations along the truck: 1 steer axle, 1 tractor drive axle, and 3 trailer bogie axles matching European commercial semi-trucks. */
const AXLE_Z = [-4.9, -1.8, 7.3, 8.8, 10.3];
const AXLE_X = 1.3;

/**
 * A wheel the rotation system knows how to drive.
 *
 * The base orientation is captured once at registration and never recomputed,
 * because the roll is applied *relative* to it — that is what lets the same
 * code drive the built-in wheels and a GLB's wheels without either needing to
 * agree on how they were modelled.
 */
interface RegisteredWheel {
  mesh: THREE.Object3D;
  base: THREE.Quaternion;
  /** The wheel's own axle direction, in its local space. */
  axis: THREE.Vector3;
}

export interface TruckProps {
  /**
   * Corrects a model authored facing some direction other than -Z. The rig
   * orients the truck with lookAt, which points an object's -Z axis down the
   * road, so a model built nose-along +Z needs Math.PI here.
   */
  modelRotationY?: number;
  /** Uniform scale applied to the loaded model, to normalise its export units. */
  modelScale?: number;
  /** Lifts the model so its wheels sit on the road rather than in it. */
  modelYOffset?: number;
  /**
   * Node names in a GLB that should be treated as wheels. Matched
   * case-insensitively as a substring, so "Wheel_FL" and "tyre.003" both hit.
   */
  wheelNamePattern?: RegExp;
  /** Rolling radius of the GLB's wheels, if it differs from the built-in body. */
  wheelRadius?: number;
}

/**
 * Drives the truck along the path.
 *
 * Position comes from the curve, never from an accumulated translation — read
 * journeyPath.ts for why arc-length parameterisation matters here. Heading
 * comes from the curve's tangent, so the truck turns into every bend without
 * anything having to describe the bends separately, and because the heading is
 * a continuous function of a continuous curve there is no angle to wrap and so
 * no rotation flip to guard against.
 */
function useJourneyRig(groupRef: React.RefObject<THREE.Group | null>) {
  const progress = useJourneyProgress();

  // Scratch vectors, allocated once. Allocating inside useFrame would hand the
  // GC three new Vector3s per frame for no reason.
  const position = useMemo(() => new THREE.Vector3(), []);
  const tangent = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    const t = progress.current;
    getJourneyPoint(t, position);
    getJourneyTangent(t, tangent);

    group.position.copy(position);

    // In Three.js, Object3D.lookAt aims +Z at target. Since the truck body
    // is authored nose-along -Z, aiming at (position - tangent) points the nose
    // along +tangent (forward down the road).
    lookTarget.copy(position).sub(tangent);
    group.lookAt(lookTarget);

    // As soon as cards emerge from cargo rear (t >= 0.940),
    // the truck accelerates smoothly down the highway into the distance
    // and dissolves into the fog, yielding the stage entirely to Our Services.
    if (t >= 0.940) {
      const exitProgress = Math.min(1, Math.max(0, (t - 0.940) / 0.016));
      const easeExit = exitProgress * exitProgress * (3 - 2 * exitProgress);
      group.position.addScaledVector(tangent, easeExit * 160);
      const currentScale = 1.4 * Math.max(0, 1 - easeExit);
      group.scale.setScalar(currentScale);
      group.visible = currentScale > 0.005;
    } else {
      group.scale.setScalar(1.4);
      group.visible = true;
    }
  });
}

interface WheelState {
  angle: number;
  lastProgress: number;
  initialised: boolean;
}

/**
 * Rolls the wheels in step with the distance actually travelled.
 *
 * The angle is integrated from real displacement — progress delta scaled by
 * the route's arc length, divided by the rolling radius — rather than from a
 * timer. Three consequences, all of them required by the brief: the wheels
 * stop dead when scrolling stops, they reverse when the journey reverses, and
 * the contact patch never slips, because the rotation *is* the distance.
 */
function useWheelRotation(
  wheelsRef: React.RefObject<RegisteredWheel[]>,
  radius: number,
  enabled: boolean,
) {
  const progress = useJourneyProgress();
  const stateRef = useRef<WheelState | null>(null);
  const roll = useMemo(() => new THREE.Quaternion(), []);

  useFrame(() => {
    if (!enabled) return;
    const wheels = wheelsRef.current;
    if (!wheels.length) return;

    stateRef.current ??= { angle: 0, lastProgress: progress.current, initialised: true };
    const state = stateRef.current;

    const t = progress.current;
    // Signed, so reversing the journey reverses the wheels.
    const travelled = (t - state.lastProgress) * journeyLength;
    state.lastProgress = t;

    if (travelled === 0) return;

    // Negative: rolling forward (down -Z) turns the wheel one way, and this is
    // the sign that makes the tread move backwards relative to the truck.
    state.angle -= travelled / radius;

    for (const wheel of wheels) {
      roll.setFromAxisAngle(wheel.axis, state.angle);
      // Post-multiply, so the roll happens about the wheel's own axle in its
      // own space rather than about a world axis.
      wheel.mesh.quaternion.copy(wheel.base).multiply(roll);
    }
  });
}

/**
 * The supplied GLB, when one exists.
 *
 * Cloned rather than used directly: useGLTF caches the loaded scene, and
 * mounting the cached object graph in two places at once (a second journey
 * instance, or a React StrictMode double-mount in dev) would move one instance
 * out from under the other.
 */
const TruckModel: React.FC<{
  url: string;
  modelRotationY: number;
  modelScale: number;
  modelYOffset: number;
  wheelNamePattern: RegExp;
  registerWheel: (mesh: THREE.Object3D, axis: THREE.Vector3) => void;
}> = ({ url, modelRotationY, modelScale, modelYOffset, wheelNamePattern, registerWheel }) => {
  const { scene } = useGLTF(url);

  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
      /*
       * Wheel discovery is by name, which is the only convention GLB exporters
       * reliably preserve. A model whose wheels are merged into the body will
       * simply register none, and the truck still renders and still drives —
       * the feature degrades rather than breaking, as the brief requires.
       */
      if (wheelNamePattern.test(child.name)) {
        registerWheel(child, new THREE.Vector3(1, 0, 0));
      }
    });
    return clone;
  }, [scene, wheelNamePattern, registerWheel]);

  return (
    <primitive
      object={model}
      scale={modelScale}
      rotation-y={modelRotationY}
      position-y={modelYOffset}
    />
  );
};

/** White-ish fleet paint with a clearcoat, so the cab reads as a painted panel. */
const BodyPaint: React.FC<{ color: string; roughness?: number }> = ({
  color,
  roughness = 0.34,
}) => (
  <meshPhysicalMaterial
    color={color}
    roughness={roughness}
    metalness={0.18}
    clearcoat={0.85}
    clearcoatRoughness={0.22}
    // Raised with the brighter IBL: the cab picks up more of the sky panel,
    // which is what stops a white truck reading as a flat cut-out against the
    // landscape and instead ties it to the light the rest of the scene is in.
    envMapIntensity={1.75}
  />
);

interface CardTrajectory {
  startX: number;
  startY: number;
  startZ: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  targetRotY: number;
  tumbleSpinX: number;
  tumbleSpinZ: number;
  startT: number;
  endT: number;
  texIndex: number;
}

const CARD_COUNT = 14;

/**
 * Animated truck cargo rear:
 * As the road ends (progress > 0.86), the back doors swing wide open
 * and milestone cards cascade/tumble out onto the road behind the truck.
 */
const TruckCargoRear: React.FC = () => {
  const progress = useJourneyProgress();
  const leftDoorRef = useRef<THREE.Group>(null);
  const rightDoorRef = useRef<THREE.Group>(null);
  const cardRefs = useRef<(THREE.Group | null)[]>([]);

  // Pre-calculated deterministic card trajectories
  // 14 milestone cards cascade & spill out of the truck onto the road behind it
  const cards = useMemo<CardTrajectory[]>(() => {
    function prng(seed: number) {
      const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    }

    return Array.from({ length: CARD_COUNT }, (_, i) => {
      // Staggered tumbling out as truck doors swing open (from p = 0.935 to 0.950)
      const startT = 0.935 + (i / CARD_COUNT) * 0.012;
      const endT = Math.min(0.952, startT + 0.012);

      return {
        // Starts inside the trailer rear cavity
        startX: (prng(i * 3 + 1) - 0.5) * 1.5,
        startY: 1.6 + prng(i * 5 + 2) * 1.2,
        startZ: 10.5 + prng(i * 7 + 3) * 0.9,
        // Tumbles out through the rear doors and scatters onto the road behind the truck
        targetX: (prng(i * 11 + 2) - 0.5) * 4.6,
        targetY: 0.12 + prng(i * 13 + 4) * 0.04,
        targetZ: 13.0 + i * 0.75 + prng(i * 17 + 5) * 2.2,
        targetRotY: (prng(i * 19 + 4) - 0.5) * 3.1,
        tumbleSpinX: (prng(i * 23) > 0.5 ? 1 : -1) * (Math.PI * 2.5 + prng(i * 29) * 2.0),
        tumbleSpinZ: (prng(i * 31) - 0.5) * 3.0,
        startT,
        endT,
        texIndex: i % 5,
      };
    });
  }, []);

  // Card textures
  const cardTextures = useMemo(() => {
    if (typeof window === "undefined") return [];
    const loader = new THREE.TextureLoader();
    const urls = [
      "/cards/bg_card_1.webp",
      "/cards/bg_card_2.webp",
      "/cards/bg_card_3.webp",
      "/cards/bg_card_4.webp",
      "/about/open-pit-golden-hour.webp",
    ];
    return urls.map((url) => {
      const tex = loader.load(url);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    });
  }, []);

  useFrame(() => {
    const p = progress.current;

    // Keep doors closed and cards hidden until vertical highway text finishes (p >= 0.934)
    if (p < 0.934) {
      if (leftDoorRef.current) leftDoorRef.current.rotation.y = 0;
      if (rightDoorRef.current) rightDoorRef.current.rotation.y = 0;
      cards.forEach((_, i) => {
        const grp = cardRefs.current[i];
        if (grp) grp.visible = false;
      });
      return;
    }

    // Door opening: p = 0.934 to 0.946
    const doorOpen = Math.min(1, Math.max(0, (p - 0.934) / 0.012));
    const easeDoor = doorOpen * doorOpen * (3 - 2 * doorOpen);
    if (leftDoorRef.current) leftDoorRef.current.rotation.y = -easeDoor * (Math.PI * 0.72);
    if (rightDoorRef.current) rightDoorRef.current.rotation.y = easeDoor * (Math.PI * 0.72);

    // Cards tumbling out through the rear doors onto the road behind the truck
    cards.forEach((card, i) => {
      const grp = cardRefs.current[i];
      if (!grp) return;

      if (p < card.startT) {
        grp.visible = false;
        return;
      }

      grp.visible = true;
      if (p >= card.endT) {
        // Flat on the road surface as fallen cards
        grp.position.set(card.targetX, card.targetY, card.targetZ);
        grp.rotation.set(0, card.targetRotY, 0);
      } else {
        // Tumble flight arc
        const t = (p - card.startT) / (card.endT - card.startT);
        const easeT = t * t * (3 - 2 * t);
        const curX = card.startX + (card.targetX - card.startX) * easeT;
        const curZ = card.startZ + (card.targetZ - card.startZ) * easeT;
        const arc = Math.sin(t * Math.PI) * 1.8;
        const curY = card.startY + (card.targetY - card.startY) * easeT + arc;

        grp.position.set(curX, curY, curZ);
        grp.rotation.set(
          card.tumbleSpinX * (1 - t),
          card.targetRotY * t,
          card.tumbleSpinZ * (1 - t)
        );
      }
    });
  });

  return (
    <group>
      {/* Trailer cargo bay interior cavity */}
      <group position={[0, 2.46, 10.0]}>
        <mesh position={[0, -1.36, 0]} receiveShadow>
          <boxGeometry args={[2.42, 0.04, 3.2]} />
          <meshStandardMaterial color="#2d2218" roughness={0.88} metalness={0.1} />
        </mesh>
        <mesh position={[0, 1.36, 0]}>
          <boxGeometry args={[2.42, 0.04, 3.2]} />
          <meshStandardMaterial color="#1a202c" roughness={0.7} metalness={0.3} />
        </mesh>
        <mesh position={[-1.21, 0, 0]}>
          <boxGeometry args={[0.04, 2.68, 3.2]} />
          <meshStandardMaterial color="#1e293b" roughness={0.65} metalness={0.35} />
        </mesh>
        <mesh position={[1.21, 0, 0]}>
          <boxGeometry args={[0.04, 2.68, 3.2]} />
          <meshStandardMaterial color="#1e293b" roughness={0.65} metalness={0.35} />
        </mesh>
        <mesh position={[0, 0, -1.6]}>
          <boxGeometry args={[2.42, 2.68, 0.04]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} metalness={0.2} />
        </mesh>
        <pointLight position={[0, 0.8, 0]} intensity={4.5} distance={8} decay={2} color="#f59e0b" />
      </group>

      {/* Left rear door hinged at x = -1.24, z = 11.62 */}
      <group ref={leftDoorRef} position={[-1.24, 2.46, 11.62]}>
        <mesh position={[0.61, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.22, 2.76, 0.08]} />
          <meshStandardMaterial color="#151922" roughness={0.42} metalness={0.15} />
        </mesh>
        <mesh position={[1.1, 0, 0.06]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 2.65, 8]} />
          <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[1.05, -0.15, 0.09]} castShadow>
          <boxGeometry args={[0.16, 0.04, 0.04]} />
          <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.8} />
        </mesh>
      </group>

      {/* Right rear door hinged at x = +1.24, z = 11.62 */}
      <group ref={rightDoorRef} position={[1.24, 2.46, 11.62]}>
        <mesh position={[-0.61, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.22, 2.76, 0.08]} />
          <meshStandardMaterial color="#151922" roughness={0.42} metalness={0.15} />
        </mesh>
        <mesh position={[-1.1, 0, 0.06]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 2.65, 8]} />
          <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[-1.05, -0.15, 0.09]} castShadow>
          <boxGeometry args={[0.16, 0.04, 0.04]} />
          <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.8} />
        </mesh>
      </group>

      {/* Falling Cards */}
      {cards.map((card, i) => (
        <group
          key={i}
          ref={(el) => {
            cardRefs.current[i] = el;
          }}
          visible={false}
        >
          {/* Silver metallic card rim - scaled for high visibility from overhead camera */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.8, 0.03, 2.5]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.25} />
          </mesh>
          {/* Front face with marketing/milestone artwork */}
          {cardTextures[card.texIndex] && (
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.72, 2.42]} />
              <meshStandardMaterial
                map={cardTextures[card.texIndex]}
                roughness={0.35}
                metalness={0.1}
              />
            </mesh>
          )}
          {/* Luxury dark back face */}
          <mesh position={[0, -0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.72, 2.42]} />
            <meshStandardMaterial color="#0b111a" roughness={0.5} metalness={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/**
 * Trailer side branding: "MINING DISCOVERY" in bold yellow livery.
 */
const TruckSideBranding: React.FC = () => {
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // Modern bold sans-serif lettering
    ctx.font = "900 156px 'Montserrat', 'Inter', 'Segoe UI', Arial, sans-serif";
    if ("letterSpacing" in ctx) {
      (ctx as any).letterSpacing = "8px";
    }
    // Clean high-contrast typography for black container livery
    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = "#ffffff"; // Crisp white lettering on black container
    ctx.fillText("MINING DISCOVERY", canvas.width / 2, canvas.height / 2);
    ctx.restore();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }, []);

  useEffect(() => {
    return () => {
      texture?.dispose();
    };
  }, [texture]);

  if (!texture) return null;

  return (
    <group position={[0, 2.46, 5.2]}>
      {/* Right side facing camera (+X) */}
      <mesh position={[1.28, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[9.8, 2.0]} />
        <meshStandardMaterial
          map={texture}
          transparent
          roughness={0.35}
          metalness={0.15}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-1}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Left side (-X) */}
      <mesh position={[-1.28, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[9.8, 2.0]} />
        <meshStandardMaterial
          map={texture}
          transparent
          roughness={0.35}
          metalness={0.15}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-1}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

/**
 * Built-in truck body.
 *
 * A modern aerodynamic tractor-trailer: rounded cab, roof fairing, side
 * skirts, fenders and a curtain-side trailer. Rounded boxes rather than plain
 * ones throughout — a bevel catches a highlight along every edge, and that
 * single change is most of the difference between geometry that reads as a
 * vehicle and geometry that reads as a stack of blocks.
 *
 * Still cheap: no textures, one material per part, well under 10k triangles.
 * Built nose-first along -Z to match the lookAt convention above.
 */
const BuiltInTruck: React.FC<{
  registerWheel: (mesh: THREE.Object3D, axis: THREE.Vector3) => void;
}> = ({ registerWheel }) => {
  /** Wheels roll about their own local Y: a cylinder's axis before the tilt. */
  const wheelAxis = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  /*
   * Order 'ZYX' matters. The cylinder is tilted by 90° about Z to stand it
   * upright across the truck, and the roll then has to be applied *inside*
   * that tilt. The rotation system post-multiplies a quaternion so it is
   * order-independent, but the authored rest pose has to be right regardless.
   */
  const wheelRest = useMemo(() => new THREE.Euler(0, 0, Math.PI / 2, "ZYX"), []);

  const handleWheelRef = useCallback(
    (mesh: THREE.Mesh | null) => {
      if (mesh) registerWheel(mesh, wheelAxis);
    },
    [registerWheel, wheelAxis],
  );

  return (
    <group>
      {/* ====================================================================
          1. CHASSIS RAILS & RUNNING GEAR
          ==================================================================== */}
      {/* Tractor main steel ladder chassis */}
      <mesh position={[0, 0.72, -3.3]} castShadow>
        <boxGeometry args={[1.72, 0.28, 4.8]} />
        <meshStandardMaterial color="#0e141d" roughness={0.72} metalness={0.55} />
      </mesh>

      {/* Fifth wheel coupling plate & kingpin lock */}
      <group position={[0, 0.98, -1.8]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.52, 0.54, 0.12, 18]} />
          <meshStandardMaterial color="#1a202c" roughness={0.4} metalness={0.8} />
        </mesh>
        {/* Grease top pad & V-notch */}
        <mesh position={[0, 0.07, 0]}>
          <cylinderGeometry args={[0.44, 0.44, 0.02, 18]} />
          <meshStandardMaterial color="#0b0f17" roughness={0.2} metalness={0.1} />
        </mesh>
      </group>

      {/* Suzie coils: Coiled pneumatic/electrical umbilical cables between cab and trailer */}
      <group position={[0, 1.8, -2.6]}>
        {[-0.22, -0.07, 0.07, 0.22].map((cx, idx) => {
          const coilColor = idx === 0 ? "#dc2626" : idx === 1 ? "#eab308" : idx === 2 ? "#2563eb" : "#111827";
          return (
            <mesh key={`suzie-${idx}`} position={[cx, 0, 0]} rotation={[0.4, 0, (idx - 1.5) * 0.15]}>
              <cylinderGeometry args={[0.025, 0.025, 0.82, 8]} />
              <meshStandardMaterial color={coilColor} roughness={0.5} />
            </mesh>
          );
        })}
      </group>

      {/* Large cylindrical polished aluminum fuel tank (driver side) */}
      <group position={[-1.24, 0.95, -3.35]} rotation={[0, 0, Math.PI / 2]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.48, 0.48, 2.2, 24]} />
          <meshStandardMaterial color="#d1d5db" roughness={0.24} metalness={0.92} />
        </mesh>
        {/* Fuel tank chrome mounting straps */}
        {[-0.75, 0.75].map((sy, i) => (
          <mesh key={`tank-strap-${i}`} position={[0, sy, 0]}>
            <cylinderGeometry args={[0.495, 0.495, 0.06, 24]} />
            <meshStandardMaterial color="#1f2937" roughness={0.3} metalness={0.7} />
          </mesh>
        ))}
      </group>

      {/* Passenger side auxiliary equipment: Battery box & AdBlue tank with step plate */}
      <group position={[1.24, 0.95, -3.35]}>
        <mesh castShadow>
          <boxGeometry args={[0.46, 0.62, 1.9]} />
          <meshStandardMaterial color="#374151" roughness={0.4} metalness={0.7} />
        </mesh>
        {/* Ribbed aluminum step tread */}
        <mesh position={[0.02, 0.33, 0]}>
          <boxGeometry args={[0.44, 0.03, 1.86]} />
          <meshStandardMaterial color="#9ca3af" roughness={0.3} metalness={0.85} />
        </mesh>
      </group>

      {/* Tractor drive axle curved mudguards (quarter fenders) */}
      {[-1.26, 1.26].map((mx) => (
        <group key={`drive-fender-${mx}`} position={[mx, 1.05, -1.8]}>
          <mesh castShadow>
            <boxGeometry args={[0.48, 0.48, 1.35]} />
            <meshStandardMaterial color="#0f172a" roughness={0.7} metalness={0.1} />
          </mesh>
          {/* Black rubber mudflap behind rear tractor wheel */}
          <mesh position={[0, -0.42, 0.64]}>
            <boxGeometry args={[0.44, 0.48, 0.03]} />
            <meshStandardMaterial color="#020617" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* ====================================================================
          2. EUROPEAN CABOVER (COE) AERODYNAMIC HIGH-ROOF TRACTOR CAB
          ==================================================================== */}
      {/* Main cab shell */}
      <RoundedBox
        args={[2.55, 2.38, 2.75]}
        radius={0.22}
        smoothness={3}
        position={[0, 2.05, -4.3]}
        castShadow
        receiveShadow
      >
        <BodyPaint color="#1d5ec9" roughness={0.28} />
      </RoundedBox>

      {/* Aerodynamic high-roof sleeper deflector cap (slopes up to trailer roofline) */}
      <mesh position={[0, 3.55, -3.8]} rotation={[-0.14, 0, 0]} castShadow>
        <boxGeometry args={[2.46, 0.65, 2.4]} />
        <BodyPaint color="#1d5ec9" roughness={0.26} />
      </mesh>

      {/* Cab side aerodynamic collar extenders (wings) bridging gap to trailer */}
      {[-1.28, 1.28].map((wx) => (
        <mesh key={`cab-wing-${wx}`} position={[wx, 2.35, -2.15]} castShadow>
          <boxGeometry args={[0.08, 2.25, 1.45]} />
          <BodyPaint color="#1d5ec9" roughness={0.3} />
        </mesh>
      ))}

      {/* Large wrap-around aerodynamic windshield */}
      <mesh position={[0, 2.38, -5.72]} rotation={[0.12, 0, 0]} castShadow>
        <boxGeometry args={[2.34, 1.22, 0.12]} />
        <meshPhysicalMaterial
          color="#080f18"
          roughness={0.06}
          metalness={0.25}
          clearcoat={1}
          clearcoatRoughness={0.04}
          envMapIntensity={2.4}
        />
      </mesh>

      {/* Exterior smoked-acrylic sunvisor across top of windshield */}
      <group position={[0, 3.12, -5.74]} rotation={[0.18, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[2.42, 0.22, 0.22]} />
          <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.6} />
        </mesh>
        {/* Twin amber roof clearance lights */}
        {[-0.92, 0.92].map((lx) => (
          <mesh key={`sunvisor-light-${lx}`} position={[lx, 0.02, 0.1]}>
            <boxGeometry args={[0.18, 0.08, 0.05]} />
            <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={2.2} />
          </mesh>
        ))}
      </group>

      {/* Side door windows with black pillars */}
      {[-1.29, 1.29].map((sx) => (
        <group key={`side-glass-${sx}`} position={[sx, 2.32, -4.5]}>
          <mesh castShadow>
            <boxGeometry args={[0.04, 0.88, 1.48]} />
            <meshPhysicalMaterial
              color="#080f18"
              roughness={0.06}
              metalness={0.25}
              clearcoat={1}
              envMapIntensity={2.4}
            />
          </mesh>
          {/* Chrome door handle */}
          <mesh position={[Math.sign(sx) * 0.03, -0.25, 0.2]}>
            <boxGeometry args={[0.03, 0.06, 0.22]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.2} metalness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Recessed driver entry steps in lower cab skirt */}
      {[-1.27, 1.27].map((stepX) => (
        <group key={`entry-step-${stepX}`} position={[stepX, 1.15, -4.7]}>
          <mesh>
            <boxGeometry args={[0.06, 0.42, 0.72]} />
            <meshStandardMaterial color="#0b0f17" roughness={0.8} />
          </mesh>
          {[-0.08, 0.08].map((sy, i) => (
            <mesh key={`step-tread-${i}`} position={[Math.sign(stepX) * 0.02, sy, 0]}>
              <boxGeometry args={[0.08, 0.03, 0.58]} />
              <meshStandardMaterial color="#cbd5e1" roughness={0.3} metalness={0.85} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Aerodynamic dual-lens rearview mirror assemblies */}
      {[-1.44, 1.44].map((mx) => (
        <group key={`mirror-arm-${mx}`} position={[mx, 2.45, -5.35]}>
          {/* Main vertical mirror housing */}
          <mesh castShadow>
            <boxGeometry args={[0.12, 0.68, 0.24]} />
            <meshStandardMaterial color="#111827" roughness={0.32} metalness={0.65} />
          </mesh>
          {/* Upper support bracket */}
          <mesh position={[-Math.sign(mx) * 0.12, 0.22, 0.08]}>
            <boxGeometry args={[0.22, 0.04, 0.04]} />
            <meshStandardMaterial color="#374151" metalness={0.8} />
          </mesh>
          {/* Lower support bracket */}
          <mesh position={[-Math.sign(mx) * 0.12, -0.22, 0.08]}>
            <boxGeometry args={[0.22, 0.04, 0.04]} />
            <meshStandardMaterial color="#374151" metalness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Front radiator grille & bumper assembly */}
      <group position={[0, 1.25, -5.72]}>
        {/* Multi-tier horizontal slatted grille */}
        <RoundedBox args={[2.24, 0.88, 0.16]} radius={0.06} smoothness={2} castShadow>
          <meshStandardMaterial color="#0f172a" roughness={0.48} metalness={0.65} />
        </RoundedBox>
        {/* Central horizontal chrome badge / logo bar */}
        <mesh position={[0, 0.14, 0.09]}>
          <boxGeometry args={[1.65, 0.06, 0.04]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.95} />
        </mesh>
        {/* Front bumper */}
        <mesh position={[0, -0.42, 0.02]} castShadow>
          <boxGeometry args={[2.52, 0.38, 0.22]} />
          <meshStandardMaterial color="#1a51b0" roughness={0.35} metalness={0.4} />
        </mesh>
        {/* Corner aerodynamic air turning vanes (deflectors) */}
        {[-1.22, 1.22].map((cx) => (
          <mesh key={`air-vane-${cx}`} position={[cx, 0.05, -0.05]} rotation={[0, Math.sign(cx) * 0.45, 0]}>
            <boxGeometry args={[0.06, 0.78, 0.24]} />
            <meshStandardMaterial color="#1d5ec9" roughness={0.3} metalness={0.4} />
          </mesh>
        ))}
      </group>

      {/* Composite front headlights & integrated DRL strips */}
      {[-0.98, 0.98].map((hx) => (
        <group key={`headlamp-${hx}`} position={[hx, 1.24, -5.76]}>
          <mesh castShadow>
            <boxGeometry args={[0.42, 0.24, 0.1]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#fff8e7"
              emissiveIntensity={2.8}
              roughness={0.15}
            />
          </mesh>
          {/* Lower auxiliary fog light */}
          <mesh position={[0, -0.28, 0]}>
            <boxGeometry args={[0.26, 0.12, 0.08]} />
            <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={1.8} />
          </mesh>
        </group>
      ))}

      {/* ====================================================================
          3. REFRIGERATED 3-AXLE TRAILER WITH FRONT CHILLER UNIT
          ==================================================================== */}
      {/* Front refrigeration chiller unit (Thermo King / Carrier style) */}
      <group position={[0, 2.78, -1.06]}>
        {/* Chiller casing */}
        <RoundedBox args={[2.18, 1.44, 0.38]} radius={0.08} smoothness={2} castShadow>
          <meshStandardMaterial color="#e2e8f0" roughness={0.32} metalness={0.15} />
        </RoundedBox>
        {/* Front horizontal cooling louvers */}
        <mesh position={[0, 0.08, -0.2]}>
          <boxGeometry args={[1.86, 0.88, 0.04]} />
          <meshStandardMaterial color="#0f172a" roughness={0.7} metalness={0.4} />
        </mesh>
        {/* Digital temperature / status LED display */}
        <mesh position={[0.65, -0.45, -0.2]}>
          <boxGeometry args={[0.32, 0.14, 0.03]} />
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={2.5} />
        </mesh>
      </group>

      {/* Main refrigerated box trailer body in sleek black finish */}
      <RoundedBox
        args={[2.54, 2.96, 13.0]}
        radius={0.10}
        smoothness={2}
        position={[0, 2.46, 5.3]}
        castShadow
        receiveShadow
      >
        <BodyPaint color="#12151b" roughness={0.38} />
      </RoundedBox>

      {/* Polished aluminum corner extrusions / rub rails for trailer */}
      {[-1.27, 1.27].map((ex) => (
        <group key={`corner-rail-${ex}`}>
          {/* Bottom rub rail */}
          <mesh position={[ex, 1.0, 5.3]}>
            <boxGeometry args={[0.04, 0.08, 12.96]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.25} metalness={0.9} />
          </mesh>
          {/* Top roof rub rail */}
          <mesh position={[ex, 3.92, 5.3]}>
            <boxGeometry args={[0.04, 0.08, 12.96]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.25} metalness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Side branding: "MINING DISCOVERY" in white lettering on black container */}
      <TruckSideBranding />

      {/* Animated rear cargo bay, swinging doors, and cascading falling cards */}
      <TruckCargoRear />

      {/* Shipping container corrugated roof ribs for overhead top-down view in matching black finish */}
      {Array.from({ length: 54 }, (_, i) => {
        const rz = -1.0 + i * (12.3 / 53);
        return (
          <mesh key={`roof-rib-${i}`} position={[0, 3.96, rz]}>
            <boxGeometry args={[2.48, 0.04, 0.11]} />
            <meshStandardMaterial color="#1c2129" roughness={0.48} metalness={0.25} />
          </mesh>
        );
      })}

      {/* 4 Corner Castings on Container Roof */}
      {[
        [-1.20, -1.1],
        [1.20, -1.1],
        [-1.20, 11.5],
        [1.20, 11.5],
      ].map(([cx, cz], i) => (
        <mesh key={`casting-${i}`} position={[cx, 3.97, cz]}>
          <boxGeometry args={[0.22, 0.06, 0.28]} />
          <meshStandardMaterial color="#2d333f" roughness={0.35} metalness={0.75} />
        </mesh>
      ))}

      {/* Trailer telescopic landing gear legs with square footpads */}
      <group position={[0, 0.65, 0.5]}>
        {[-0.92, 0.92].map((lx) => (
          <group key={`landing-leg-${lx}`} position={[lx, 0, 0]}>
            {/* Telescoping vertical post */}
            <mesh castShadow>
              <boxGeometry args={[0.14, 0.72, 0.14]} />
              <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.7} />
            </mesh>
            {/* Ground footpad */}
            <mesh position={[0, -0.38, 0]}>
              <boxGeometry args={[0.28, 0.05, 0.28]} />
              <meshStandardMaterial color="#0f172a" roughness={0.7} metalness={0.8} />
            </mesh>
            {/* Diagonal support brace */}
            <mesh position={[0, 0.12, 0.28]} rotation={[0.55, 0, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.62, 8]} />
              <meshStandardMaterial color="#334155" metalness={0.8} />
            </mesh>
          </group>
        ))}
        {/* Connecting cross shaft */}
        <mesh position={[0, 0.18, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.035, 0.035, 1.84, 8]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>
      </group>

      {/* Aerodynamic side belly skirt / enclosed pallet storage box in matching royal blue */}
      <group position={[0, 0.98, 3.8]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.46, 0.62, 5.2]} />
          <meshStandardMaterial color="#1d5ec9" roughness={0.32} metalness={0.25} />
        </mesh>
        {/* Row of amber LED side marker reflectors along the trailer flank */}
        {[-1.24, 1.24].map((mx) =>
          [-2.2, -1.1, 0, 1.1, 2.2].map((mz, idx) => (
            <mesh key={`belly-marker-${mx}-${idx}`} position={[mx, 0.24, mz]}>
              <boxGeometry args={[0.02, 0.05, 0.12]} />
              <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={1.5} />
            </mesh>
          ))
        )}
      </group>

      {/* Triple curved thermoplastic mudguards over the 3 trailer axles */}
      {[-AXLE_X, AXLE_X].map((fx) =>
        [7.3, 8.8, 10.3].map((fz, idx) => (
          <group key={`tri-mudguard-${fx}-${idx}`} position={[fx, 1.18, fz]}>
            {/* Curved top fender arch */}
            <mesh castShadow>
              <boxGeometry args={[0.48, 0.22, 1.12]} />
              <meshStandardMaterial color="#0f172a" roughness={0.8} />
            </mesh>
            {/* Orange side reflector above wheel */}
            <mesh position={[Math.sign(fx) * 0.25, 0.02, 0]}>
              <boxGeometry args={[0.02, 0.06, 0.14]} />
              <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={1.8} />
            </mesh>
          </group>
        ))
      )}

      {/* Rear steel underrun protection bumper bar (ICC bumper) */}
      <group position={[0, 0.58, 11.85]}>
        {/* Horizontal bumper beam */}
        <mesh castShadow>
          <boxGeometry args={[2.48, 0.14, 0.1]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.3} metalness={0.85} />
        </mesh>
        {/* Vertical support drops */}
        {[-0.85, 0.85].map((bx) => (
          <mesh key={`bumper-post-${bx}`} position={[bx, 0.26, 0]}>
            <boxGeometry args={[0.08, 0.42, 0.08]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} />
          </mesh>
        ))}
        {/* Yellow/Red reflective diagonal chevron safety hazard plates */}
        {[-1.0, 1.0].map((cx) => (
          <mesh key={`chevron-${cx}`} position={[cx, 0, 0.055]}>
            <planeGeometry args={[0.42, 0.12]} />
            <meshStandardMaterial color="#facc15" emissive="#ca8a04" emissiveIntensity={0.6} />
          </mesh>
        ))}
        {/* Rear commercial multi-element LED taillight strips */}
        {[-0.55, 0.55].map((tx) => (
          <mesh key={`taillight-${tx}`} position={[tx, 0, 0.055]}>
            <boxGeometry args={[0.42, 0.1, 0.02]} />
            <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={2.2} />
          </mesh>
        ))}
      </group>

      {/* ====================================================================
          4. 5-AXLE EUROPEAN ALLOY WHEELS & HUBS (1 STEER, 1 DRIVE, 3 TRAILER)
          ==================================================================== */}
      {AXLE_Z.map((z) =>
        [-AXLE_X, AXLE_X].map((x) => (
          <group key={`${z}:${x}`} position={[x, WHEEL_RADIUS, z]}>
            {/* Outer semi-truck rubber tyre */}
            <mesh ref={handleWheelRef} rotation={wheelRest} castShadow>
              <cylinderGeometry args={[WHEEL_RADIUS, WHEEL_RADIUS, WHEEL_WIDTH, 32]} />
              <meshStandardMaterial color="#0f141a" roughness={0.92} metalness={0.06} />
            </mesh>
            {/* Polished silver alloy disc wheel */}
            <mesh
              ref={handleWheelRef}
              position={[Math.sign(x) * (WHEEL_WIDTH / 2 + 0.01), 0, 0]}
              rotation={wheelRest}
              castShadow
            >
              <cylinderGeometry args={[WHEEL_RADIUS * 0.68, WHEEL_RADIUS * 0.68, 0.06, 24]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.22} metalness={0.92} />
            </mesh>
            {/* Dark hub center with chrome wheel nut ring */}
            <mesh
              ref={handleWheelRef}
              position={[Math.sign(x) * (WHEEL_WIDTH / 2 + 0.035), 0, 0]}
              rotation={wheelRest}
            >
              <cylinderGeometry args={[WHEEL_RADIUS * 0.32, WHEEL_RADIUS * 0.32, 0.04, 16]} />
              <meshStandardMaterial color="#1e293b" roughness={0.35} metalness={0.8} />
            </mesh>
          </group>
        )),
      )}
    </group>
  );
};

/**
 * A soft dark ellipse pinned under the truck.
 *
 * The travelling key light casts a real shadow, but a 1024px map spread over a
 * 68-unit frustum cannot resolve the few centimetres where tyre meets asphalt.
 * This sits underneath that shadow and supplies the contact cue, which is what
 * stops the truck reading as hovering a little above its own shadow.
 */
const ContactShadow: React.FC = () => {
  const texture = useMemo(() => createContactShadow(128), []);
  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.09, 2.8]} renderOrder={1}>
      <planeGeometry args={[5.6, 20]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.5}
        depthWrite={false}
        // Multiplied into the road rather than drawn over it, so it darkens
        // the asphalt instead of greying it out.
        //
        // MultiplyBlending is only defined for premultiplied alpha — without
        // this flag three logs a WebGLState error every frame and the blend
        // factors are wrong. With it, the sprite's black texel over alpha `a`
        // resolves to dst * (1 - a): a true shadow, not a grey wash.
        blending={THREE.MultiplyBlending}
        premultipliedAlpha
      />
    </mesh>
  );
};

/**
 * The pool the headlights throw onto the road ahead.
 *
 * Travels with the truck because it is parented inside its group, so it needs
 * no per-frame work at all. Like the billboard's spill, this is an additive
 * decal rather than a real spotlight: two cones of actual light would have to
 * be evaluated against every surface in the scene for an effect that only ever
 * lands on the fifteen metres of asphalt directly in front of the cab.
 *
 * It is what ties the truck to the road surface — the vehicle stops being an
 * object standing on the road and becomes one that is lighting it.
 */
const HeadlightSpill: React.FC = () => {
  /*
   * The glow sprite, not the contact-shadow one. They look identical as
   * gradients but differ where it matters: the shadow sprite is black with a
   * radial alpha, and additive blending multiplies source colour by alpha —
   * black times anything is black, so it would contribute nothing at all. The
   * glow sprite is white with the same alpha, so the material's colour comes
   * through.
   */
  const texture = useMemo(() => createGlowSprite(128), []);
  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, -13]} renderOrder={2}>
      <planeGeometry args={[11, 19]} />
      <meshBasicMaterial
        map={texture}
        color="#6b5c3a"
        transparent
        opacity={0.5}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
};

/**
 * The truck: a path-driven rig wrapping whichever body is available.
 *
 * The rig, the wheels and the body are three separate concerns. Swapping in a
 * real GLB changes only what sits inside the group — path following,
 * orientation, wheel rotation, the contact shadow and everything the camera
 * and lighting rely on are unaffected.
 */
export const Truck: React.FC<TruckProps> = ({
  modelRotationY = 0,
  modelScale = 1,
  modelYOffset = 0,
  wheelNamePattern = /wheel|tyre|tire|rim/i,
  wheelRadius = WHEEL_RADIUS * 1.4,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const wheelsRef = useRef<RegisteredWheel[]>([]);

  const registerWheel = useCallback((mesh: THREE.Object3D, axis: THREE.Vector3) => {
    if (wheelsRef.current.some((w) => w.mesh === mesh)) return;
    wheelsRef.current.push({ mesh, base: mesh.quaternion.clone(), axis });
  }, []);

  // React reuses mesh objects across re-renders but not across remounts, so
  // the registry is cleared when the body it belongs to goes away.
  useEffect(() => {
    const wheels = wheelsRef.current;
    return () => {
      wheels.length = 0;
    };
  }, []);

  useJourneyRig(groupRef);
  useWheelRotation(wheelsRef, wheelRadius, true);

  return (
    <group ref={groupRef}>
      {TRUCK_MODEL_URL ? (
        <TruckModel
          url={TRUCK_MODEL_URL}
          modelRotationY={modelRotationY}
          modelScale={modelScale}
          modelYOffset={modelYOffset}
          wheelNamePattern={wheelNamePattern}
          registerWheel={registerWheel}
        />
      ) : (
        <BuiltInTruck registerWheel={registerWheel} />
      )}
      <ContactShadow />
      <HeadlightSpill />
    </group>
  );
};

// Warms the GLB cache during idle time, but only once a model actually exists.
if (TRUCK_MODEL_URL) useGLTF.preload(TRUCK_MODEL_URL);

export default Truck;
