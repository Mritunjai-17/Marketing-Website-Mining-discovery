"use client";

import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { getJourneyPoint, getJourneySide, getJourneyTangent, journeyLength } from "./journeyPath";
import { useJourneyProgress } from "../journeyProgress";
import { createDustSprite } from "./proceduralTextures";
import { makeRandom } from "./terrain";

/**
 * Small by design. The brief is explicit that this must not become a particle
 * explosion, and 110 sprites is enough to read as disturbed air behind a
 * vehicle while staying invisible in a frame profile.
 */
const MAX_PARTICLES = 110;

/** Seconds a particle lives before it is recycled. */
const LIFETIME = 1.85;

/** Metres per second above which dust is at full strength. */
const FULL_SPEED = 42;

/** Below this the truck is effectively parked and nothing should be emitted. */
const MIN_SPEED = 2.5;

/** Particles emitted per second at full speed. */
const EMISSION_RATE = 58;

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  age: number;
  life: number;
  seed: number;
}

interface DustState {
  particles: Particle[];
  /** Fractional particles carried between frames, so slow emission still works. */
  emissionDebt: number;
  /** Previous progress, for deriving speed. */
  lastProgress: number;
  /** Smoothed speed, so a single jittery frame cannot flash the dust on. */
  smoothedSpeed: number;
  initialised: boolean;
}

function createState(): DustState {
  return {
    particles: Array.from({ length: MAX_PARTICLES }, () => ({
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      // Start fully expired so nothing is visible until the truck moves.
      age: Infinity,
      life: LIFETIME,
      seed: 0,
    })),
    emissionDebt: 0,
    lastProgress: 0,
    smoothedSpeed: 0,
    initialised: false,
  };
}

/**
 * Road dust kicked up behind the truck.
 *
 * Emission is driven by the truck's actual speed along the path, derived from
 * how much progress changed this frame. That is what satisfies the
 * "no spinning wheels on a parked truck" half of the brief for particles: stop
 * scrolling and emission stops, the existing puffs finish their lives and fade,
 * and the effect goes quiet on its own rather than idling forever.
 *
 * Scrolling backwards emits too — the truck is still moving, and suppressing
 * it would make reverse look broken rather than deliberate.
 */
export const DustParticles: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const stateRef = useRef<DustState | null>(null);
  const progress = useJourneyProgress();

  const sprite = useMemo(() => createDustSprite(64), []);

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES * 3), 3),
    );
    geom.setAttribute("size", new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES), 1));
    geom.setAttribute("alpha", new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES), 1));
    // The particles move every frame and are scattered along the road, so a
    // computed bounding sphere would be wrong immediately. Frustum culling is
    // switched off on the mesh instead.
    geom.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Infinity);
    return geom;
  }, []);

  /**
   * A small custom material rather than PointsMaterial.
   *
   * PointsMaterial applies one size and one opacity to every point. Dust needs
   * each puff to grow and fade on its own schedule, which means per-particle
   * attributes, which means a shader.
   */
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
        uniforms: {
          // Bound at construction rather than patched in afterwards, so the
          // material is never briefly rendered with a null sampler.
          uSprite: { value: sprite },
          uColor: { value: new THREE.Color("#8d9bb0") },
        },
        vertexShader: /* glsl */ `
          attribute float size;
          attribute float alpha;
          varying float vAlpha;
          void main() {
            vAlpha = alpha;
            vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
            // Perspective scaling, so a puff shrinks with distance like
            // anything else in the scene.
            gl_PointSize = size * (300.0 / -viewPosition.z);
            gl_Position = projectionMatrix * viewPosition;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform sampler2D uSprite;
          uniform vec3 uColor;
          varying float vAlpha;
          void main() {
            if (vAlpha <= 0.001) discard;
            vec4 sprite = texture2D(uSprite, gl_PointCoord);
            gl_FragColor = vec4(uColor, sprite.a * vAlpha);
          }
        `,
      }),
    [sprite],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
      sprite.dispose();
    },
    [geometry, material, sprite],
  );

  // Scratch vectors, reused every frame.
  const scratch = useMemo(
    () => ({
      point: new THREE.Vector3(),
      tangent: new THREE.Vector3(),
      side: new THREE.Vector3(),
      random: makeRandom(0x4b17f2a3),
    }),
    [],
  );

  useFrame((_, delta) => {
    const points = pointsRef.current;
    if (!points) return;

    stateRef.current ??= createState();
    const state = stateRef.current;

    const dt = Math.min(delta, 1 / 20);
    const t = progress.current;

    if (!state.initialised) {
      state.lastProgress = t;
      state.initialised = true;
    }

    // Progress is normalised, so scaling by the route's arc length turns it
    // into metres — the same conversion the wheels use.
    const travelled = Math.abs(t - state.lastProgress) * journeyLength;
    const instantSpeed = dt > 0 ? travelled / dt : 0;
    state.lastProgress = t;

    // Asymmetric smoothing: dust should appear promptly when the truck sets
    // off but settle slowly when it stops, which is how real airborne dust
    // behaves and also hides any single-frame jitter in the scroll.
    const blend = instantSpeed > state.smoothedSpeed ? 0.25 : 0.045;
    state.smoothedSpeed += (instantSpeed - state.smoothedSpeed) * blend;

    const intensity = THREE.MathUtils.clamp(
      (state.smoothedSpeed - MIN_SPEED) / (FULL_SPEED - MIN_SPEED),
      0,
      1,
    );

    getJourneyPoint(t, scratch.point);
    getJourneyTangent(t, scratch.tangent);
    getJourneySide(t, scratch.side);

    // Emit from behind the rear axle, not from the truck's centre.
    const emitX = scratch.point.x + scratch.tangent.x * 5.6;
    const emitZ = scratch.point.z + scratch.tangent.z * 5.6;

    state.emissionDebt += EMISSION_RATE * intensity * dt;

    const positions = geometry.getAttribute("position") as THREE.BufferAttribute;
    const sizes = geometry.getAttribute("size") as THREE.BufferAttribute;
    const alphas = geometry.getAttribute("alpha") as THREE.BufferAttribute;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const particle = state.particles[i];

      if (particle.age >= particle.life) {
        if (state.emissionDebt >= 1) {
          state.emissionDebt -= 1;
          const r = scratch.random;
          // Spawn at one of the rear wheel tracks rather than on the centreline.
          const track = (r() < 0.5 ? -1 : 1) * (1.1 + r() * 0.5);
          particle.position.set(
            emitX + scratch.side.x * track,
            0.16 + r() * 0.2,
            emitZ + scratch.side.z * track,
          );
          particle.velocity.set(
            scratch.tangent.x * (1.4 + r() * 2.2) + scratch.side.x * (r() - 0.5) * 2.4,
            0.7 + r() * 1.1,
            scratch.tangent.z * (1.4 + r() * 2.2) + scratch.side.z * (r() - 0.5) * 2.4,
          );
          particle.age = 0;
          particle.life = LIFETIME * (0.7 + r() * 0.6);
          particle.seed = 0.55 + r() * 0.75;
        } else {
          alphas.setX(i, 0);
          continue;
        }
      }

      particle.age += dt;
      const life = THREE.MathUtils.clamp(particle.age / particle.life, 0, 1);

      particle.position.addScaledVector(particle.velocity, dt);
      // Air drag, plus a touch of lift decaying into settling.
      particle.velocity.multiplyScalar(1 - 1.65 * dt);
      particle.velocity.y -= 0.32 * dt;
      // Never let a puff sink through the road.
      if (particle.position.y < 0.08) particle.position.y = 0.08;

      positions.setXYZ(i, particle.position.x, particle.position.y, particle.position.z);
      // Puffs expand as they disperse.
      sizes.setX(i, (2.1 + life * 7.4) * particle.seed);
      // Quick rise, long fade — the shape of settling dust.
      const fade = Math.sin(Math.PI * Math.pow(life, 0.62));
      alphas.setX(i, fade * 0.3 * intensity);
    }

    positions.needsUpdate = true;
    sizes.needsUpdate = true;
    alphas.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
  );
};

export default DustParticles;
