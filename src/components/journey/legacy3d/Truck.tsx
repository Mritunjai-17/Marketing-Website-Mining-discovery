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

/** Axle stations along the truck: steer axle, tractor drive pair, trailer bogie. */
const AXLE_Z = [-4.9, -2.6, -1.7, 4.3, 5.4];
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

    // lookAt aims -Z at the target, so a point one unit further along the
    // direction of travel makes the truck face where it is going.
    lookTarget.copy(position).add(tangent);
    group.lookAt(lookTarget);
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
      <mesh position={[0, 0.74, 0.4]} castShadow>
        <boxGeometry args={[2.05, 0.3, 12.4]} />
        <meshStandardMaterial color="#0e141d" roughness={0.72} metalness={0.55} />
      </mesh>

      {/* Tractor cab. */}
      <RoundedBox
        args={[2.58, 2.1, 3.0]}
        radius={0.3}
        smoothness={3}
        position={[0, 1.88, -4.1]}
        castShadow
        receiveShadow
      >
        <BodyPaint color="#eef1f5" />
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
        <BodyPaint color="#e4e8ee" />
      </RoundedBox>

      {/*
       * Roof fairing. Aerodynamic kit is the single clearest visual signal that
       * a truck is a modern long-haul vehicle rather than a generic box, and it
       * costs one wedge.
       */}
      <mesh position={[0, 3.32, -3.3]} rotation={[-0.19, 0, 0]} castShadow>
        <boxGeometry args={[2.42, 0.62, 2.6]} />
        <BodyPaint color="#e9edf2" roughness={0.3} />
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

      {/* Trailer body. */}
      <RoundedBox
        args={[2.6, 2.96, 8.2]}
        radius={0.12}
        smoothness={2}
        position={[0, 2.46, 2.9]}
        castShadow
        receiveShadow
      >
        <BodyPaint color="#f7f8f9" roughness={0.44} />
      </RoundedBox>

      {/* Trailer side skirts, hiding the gap between body and road. */}
      {[-1.28, 1.28].map((x) => (
        <mesh key={x} position={[x, 1.02, 3.1]} castShadow>
          <boxGeometry args={[0.07, 0.72, 6.6]} />
          <meshStandardMaterial color="#c2c8d1" roughness={0.55} metalness={0.15} />
        </mesh>
      ))}

      {/*
       * The single brand note: one thin livery stripe down each flank. Kept to
       * a hairline because the brief is explicit that gold should not be
       * overused, and a gold trailer would read as a toy.
       */}
      {[-1.312, 1.312].map((x) => (
        <mesh key={x} position={[x, 1.74, 2.9]}>
          <boxGeometry args={[0.02, 0.15, 7.7]} />
          <meshStandardMaterial
            color="#B8860B"
            roughness={0.3}
            metalness={0.85}
            emissive="#6a4c06"
            emissiveIntensity={0.35}
          />
        </mesh>
      ))}

      {/* Rear doors, marker lamps and underrun bar. */}
      <mesh position={[0, 2.46, 7.02]} castShadow>
        <boxGeometry args={[2.48, 2.8, 0.1]} />
        <meshStandardMaterial color="#d8dce3" roughness={0.52} metalness={0.14} />
      </mesh>
      {[-0.96, 0.96].map((x) => (
        <mesh key={x} position={[x, 1.24, 7.08]}>
          <boxGeometry args={[0.42, 0.17, 0.08]} />
          <meshStandardMaterial color="#8e3628" emissive="#c9432f" emissiveIntensity={1.5} />
        </mesh>
      ))}
      <mesh position={[0, 0.72, 7.05]} castShadow>
        <boxGeometry args={[2.2, 0.12, 0.08]} />
        <meshStandardMaterial color="#2b3340" roughness={0.5} metalness={0.7} />
      </mesh>

      {/* Wheels: tyre, rim and a fender over each axle station. */}
      {AXLE_Z.map((z) =>
        [-AXLE_X, AXLE_X].map((x) => (
          <group key={`${z}:${x}`} position={[x, WHEEL_RADIUS, z]}>
            <mesh ref={handleWheelRef} rotation={wheelRest} castShadow>
              <cylinderGeometry args={[WHEEL_RADIUS, WHEEL_RADIUS, WHEEL_WIDTH, 18]} />
              <meshStandardMaterial color="#0b0e13" roughness={0.92} metalness={0.08} />
            </mesh>
            {/*
             * The rim is a child of nothing — it is registered as a wheel too,
             * so it turns with the tyre. Without it the tyre is a featureless
             * black disc and the rotation is invisible at any distance.
             */}
            <mesh
              ref={handleWheelRef}
              position={[Math.sign(x) * (WHEEL_WIDTH / 2 + 0.01), 0, 0]}
              rotation={wheelRest}
              castShadow
            >
              <cylinderGeometry args={[WHEEL_RADIUS * 0.58, WHEEL_RADIUS * 0.58, 0.05, 6]} />
              <meshStandardMaterial color="#6b7480" roughness={0.3} metalness={0.9} />
            </mesh>
          </group>
        )),
      )}

      {/* Fenders over the drive and trailer axles. */}
      {[-2.15, 4.85].map((z) =>
        [-AXLE_X, AXLE_X].map((x) => (
          <mesh key={`f${z}:${x}`} position={[x, 1.42, z]} castShadow>
            <boxGeometry args={[0.72, 0.1, 3.1]} />
            <meshStandardMaterial color="#aeb5c0" roughness={0.6} metalness={0.2} />
          </mesh>
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
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.09, 0.6]} renderOrder={1}>
      <planeGeometry args={[5.6, 15]} />
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
  wheelRadius = WHEEL_RADIUS,
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
