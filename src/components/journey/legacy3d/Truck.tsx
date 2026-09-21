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

/** Axle stations along the truck: steer axle, tractor drive pair, trailer bogie pair at rear. */
const AXLE_Z = [-4.9, -2.6, -1.7, 8.8, 10.1];
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
      "/cards/bg_card_1.jpg",
      "/cards/bg_card_2.jpg",
      "/cards/bg_card_3.jpg",
      "/cards/bg_card_4.jpg",
      "/about/open-pit-golden-hour.png",
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
          <meshStandardMaterial color="#d8dce3" roughness={0.52} metalness={0.14} />
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
          <meshStandardMaterial color="#d8dce3" roughness={0.52} metalness={0.14} />
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
          {/* Gold foiled card rim - scaled for high visibility from overhead camera */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.8, 0.03, 2.5]} />
            <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.25} />
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
    // High-visibility crisp shadow for contrast on white paint
    ctx.shadowColor = "rgba(0, 0, 0, 0.32)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = "#f5be18"; // Vibrant yellow
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
      {/* Chassis rail, tying tractor and trailer together. */}
      <mesh position={[0, 0.74, 2.8]} castShadow>
        <boxGeometry args={[2.05, 0.3, 17.2]} />
        <meshStandardMaterial color="#0e141d" roughness={0.72} metalness={0.55} />
      </mesh>

      {/* Tractor cab - sleek dark finish matching unitedcarriers.com */}
      <RoundedBox
        args={[2.58, 2.1, 3.0]}
        radius={0.3}
        smoothness={3}
        position={[0, 1.88, -4.1]}
        castShadow
        receiveShadow
      >
        <BodyPaint color="#1c212a" roughness={0.28} />
      </RoundedBox>

      {/* Sleeper section behind the cab. */}
      <RoundedBox
        args={[2.54, 2.34, 1.15]}
        radius={0.22}
        smoothness={3}
        position={[0, 2.0, -2.3]}
        castShadow
        receiveShadow
      >
        <BodyPaint color="#181d26" roughness={0.32} />
      </RoundedBox>

      {/*
       * Roof fairing. Aerodynamic kit is the single clearest visual signal that
       * a truck is a modern long-haul vehicle rather than a generic box, and it
       * costs one wedge.
       */}
      <mesh position={[0, 3.32, -3.3]} rotation={[-0.19, 0, 0]} castShadow>
        <boxGeometry args={[2.42, 0.62, 2.6]} />
        <BodyPaint color="#222834" roughness={0.25} />
      </mesh>

      {/* Windscreen — dark glass, slightly proud of the cab face. */}
      <mesh position={[0, 2.26, -5.58]} rotation={[0.1, 0, 0]} castShadow>
        <boxGeometry args={[2.3, 1.16, 0.1]} />
        <meshPhysicalMaterial
          color="#0a121d"
          roughness={0.08}
          metalness={0.2}
          clearcoat={1}
          clearcoatRoughness={0.05}
          envMapIntensity={2.2}
        />
      </mesh>

      {/* Side windows. */}
      {[-1.3, 1.3].map((x) => (
        <mesh key={x} position={[x, 2.22, -4.4]} castShadow>
          <boxGeometry args={[0.06, 0.86, 1.5]} />
          <meshPhysicalMaterial
            color="#0a121d"
            roughness={0.08}
            metalness={0.2}
            clearcoat={1}
            envMapIntensity={2.2}
          />
        </mesh>
      ))}

      {/* Mirror arms. */}
      {[-1.42, 1.42].map((x) => (
        <group key={x} position={[x, 2.5, -5.2]}>
          <mesh castShadow>
            <boxGeometry args={[0.28, 0.06, 0.06]} />
            <meshStandardMaterial color="#1a222e" roughness={0.5} metalness={0.6} />
          </mesh>
          <mesh position={[Math.sign(x) * 0.2, -0.16, 0]} castShadow>
            <boxGeometry args={[0.09, 0.56, 0.16]} />
            <meshStandardMaterial color="#141b25" roughness={0.35} metalness={0.7} />
          </mesh>
        </group>
      ))}

      {/* Bumper and grille. */}
      <RoundedBox
        args={[2.52, 0.76, 0.26]}
        radius={0.09}
        smoothness={2}
        position={[0, 1.0, -5.6]}
        castShadow
      >
        <meshStandardMaterial color="#19212e" roughness={0.42} metalness={0.75} />
      </RoundedBox>
      <mesh position={[0, 1.66, -5.56]} castShadow>
        <boxGeometry args={[2.1, 0.62, 0.1]} />
        <meshStandardMaterial color="#10171f" roughness={0.5} metalness={0.7} />
      </mesh>

      {/* Headlamps. Emissive, but small — the truck is lit, not glowing. */}
      {[-0.94, 0.94].map((x) => (
        <mesh key={x} position={[x, 1.5, -5.62]}>
          <boxGeometry args={[0.5, 0.26, 0.12]} />
          <meshStandardMaterial
            color="#fff7e6"
            emissive="#ffeec8"
            emissiveIntensity={2.6}
            roughness={0.2}
          />
        </mesh>
      ))}

      {/* Exhaust stack. */}
      <mesh position={[1.24, 2.1, -2.9]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, 2.6, 8]} />
        <meshStandardMaterial color="#3a424f" roughness={0.3} metalness={0.9} />
      </mesh>

      {/* Fuel tank. */}
      <mesh position={[-1.22, 1.0, -2.2]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.42, 0.42, 1.7, 12]} />
        <meshStandardMaterial color="#5d6774" roughness={0.26} metalness={0.92} />
      </mesh>

      {/* Trailer body - elongated 40ft/53ft container proportions matching unitedcarriers.com */}
      <RoundedBox
        args={[2.54, 2.96, 12.8]}
        radius={0.10}
        smoothness={2}
        position={[0, 2.46, 5.2]}
        castShadow
        receiveShadow
      >
        <BodyPaint color="#f7f8f9" roughness={0.44} />
      </RoundedBox>

      {/* Side branding: "MINING DISCOVERY" in yellow lettering */}
      <TruckSideBranding />

      {/* Animated rear cargo bay, swinging doors, and cascading falling cards */}
      <TruckCargoRear />

      {/* Shipping container corrugated roof ribs for overhead top-down view (56 ribs across 12.4m length) */}
      {Array.from({ length: 54 }, (_, i) => {
        const rz = -1.0 + i * (12.3 / 53);
        return (
          <mesh key={`roof-rib-${i}`} position={[0, 3.96, rz]}>
            <boxGeometry args={[2.48, 0.04, 0.11]} />
            <meshStandardMaterial color="#d4d9df" roughness={0.52} metalness={0.2} />
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
          <meshStandardMaterial color="#828d9b" roughness={0.35} metalness={0.75} />
        </mesh>
      ))}

      {/* Wheels: tyre, rim over each axle station matching slim trailer clearance */}
      {AXLE_Z.map((z) =>
        [-AXLE_X, AXLE_X].map((x) => (
          <group key={`${z}:${x}`} position={[x, WHEEL_RADIUS, z]}>
            <mesh ref={handleWheelRef} rotation={wheelRest} castShadow>
              <cylinderGeometry args={[WHEEL_RADIUS, WHEEL_RADIUS, WHEEL_WIDTH, 32]} />
              <meshStandardMaterial color="#0b0e13" roughness={0.92} metalness={0.08} />
            </mesh>
            <mesh
              ref={handleWheelRef}
              position={[Math.sign(x) * (WHEEL_WIDTH / 2 + 0.01), 0, 0]}
              rotation={wheelRest}
              castShadow
            >
              <cylinderGeometry args={[WHEEL_RADIUS * 0.58, WHEEL_RADIUS * 0.58, 0.05, 16]} />
              <meshStandardMaterial color="#6b7480" roughness={0.3} metalness={0.9} />
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
