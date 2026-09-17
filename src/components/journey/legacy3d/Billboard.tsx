"use client";

import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { getExtendedPoint, getExtendedSide, smoothstep } from "./journeyPath";
import { useJourneyProgress } from "../journeyProgress";
import { createBillboardScreen, createGlowSprite } from "./proceduralTextures";
import { useOpacityReveal } from "./reveal";
import { terrainHeight } from "./terrain";

/**
 * Where along the route the billboard stands.
 *
 * 0.62 puts it in the last third but well before the destination, so the
 * journey reads movement → open road → a first sign of the business world →
 * arrival, rather than everything arriving at once.
 */
const BILLBOARD_T = 0.62;

/** Lateral offset. Positive is the truck's right — the side traffic reads from. */
const BILLBOARD_OFFSET = 27;

/** Panel size in world units. A real highway bulletin is about 14m x 4.8m. */
const PANEL_WIDTH = 16;
const PANEL_HEIGHT = 8;

/** Height of the panel's bottom edge above the ground. */
const PANEL_BASE = 7.4;

const PANEL_CENTRE_Y = PANEL_BASE + PANEL_HEIGHT / 2;

/**
 * A single large digital billboard, built into the roadside.
 *
 * Everything about the construction is in service of one requirement: it has
 * to be a physical object in the world, not an overlay. So it has legs that
 * reach the actual terrain height at its position, a truss it sits on, a frame
 * with depth, a maintenance catwalk, and it is angled toward oncoming traffic
 * the way a real one is — because it is aimed at a point further back along
 * the road rather than at a hand-picked rotation.
 */
export const Billboard: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const screenRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Sprite>(null);
  const spillRef = useRef<THREE.Mesh>(null);
  const progress = useJourneyProgress();

  const screenTexture = useMemo(() => createBillboardScreen(), []);
  const glowTexture = useMemo(() => createGlowSprite(128), []);
  // Glow sprite (white over alpha), not the contact shadow (black over alpha):
  // additive blending multiplies colour by alpha, so a black source adds nothing.
  const spillTexture = useMemo(() => createGlowSprite(128), []);

  /**
   * The screen, as a shader rather than a standard material.
   *
   * A standard material could show the artwork and emit light, but it cannot
   * do the two things that make a display read as *running*: a slow brightness
   * drift, and a soft refresh band travelling down the panel. Both are a few
   * lines here and neither costs a texture upload per frame, which is what
   * animating the canvas would have meant.
   *
   * Everything stays deliberately gentle — no flicker, no glitch, no strobing.
   * The panel should look like an expensive advertising display idling, not
   * like a screen with a fault.
   */
  const screenMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        toneMapped: false,
        uniforms: {
          uMap: { value: screenTexture },
          uTime: { value: 0 },
          uReveal: { value: 0 },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform sampler2D uMap;
          uniform float uTime;
          uniform float uReveal;
          varying vec2 vUv;

          void main() {
            vec4 art = texture2D(uMap, vUv);

            // Slow brightness drift, a few percent. Two frequencies so it
            // never settles into an obvious loop.
            float breathe = 1.0
              + 0.035 * sin(uTime * 0.55)
              + 0.018 * sin(uTime * 0.23 + 1.7);

            // A soft refresh band easing down the panel roughly every nine
            // seconds. Wide and shallow — a hint of a scan, not a scanline.
            float sweep = fract(uTime * 0.11);
            float band = exp(-pow((vUv.y - (1.0 - sweep)) / 0.16, 2.0));

            // The panel never goes fully dark: 0.5 at the floor, rising to
            // full on approach. A billboard that is black until you are close
            // is not a billboard, and the previous version read as an unlit
            // slab for most of the journey.
            float output_gain = mix(0.5, 2.3, uReveal);

            vec3 color = art.rgb * breathe * output_gain;
            color += art.rgb * band * 0.22 * uReveal;

            gl_FragColor = vec4(color, 1.0);
          }
        `,
      }),
    [screenTexture],
  );

  /*
   * Uniforms are reached through the mesh ref rather than through the memoised
   * material directly. Both point at the same object, but writing to a value
   * produced during render is the pattern React's lint rules reject, and
   * going via the ref keeps the mutation where it belongs — in the frame loop.
   */
  useFrame((state) => {
    const mesh = screenRef.current;
    if (!mesh) return;
    const material = mesh.material as THREE.ShaderMaterial;
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uReveal.value = smoothstep(0.26, 0.56, progress.current);
  });

  useEffect(
    () => () => {
      screenTexture.dispose();
      glowTexture.dispose();
      spillTexture.dispose();
      screenMaterial.dispose();
    },
    [screenTexture, glowTexture, spillTexture, screenMaterial],
  );

  /*
   * Placement and aim, computed once. The structure never moves, so this is a
   * static transform rather than anything the frame loop needs to touch.
   */
  const placement = useMemo(() => {
    const point = getExtendedPoint(BILLBOARD_T, new THREE.Vector3());
    const side = getExtendedSide(BILLBOARD_T, new THREE.Vector3());

    const position = point.clone().addScaledVector(side, BILLBOARD_OFFSET);
    // Sits on the ground, wherever the terrain happens to be at this point.
    position.y = terrainHeight(BILLBOARD_T, BILLBOARD_OFFSET);

    /*
     * Aimed at a point on the road roughly 50 units back up the route. Because
     * the billboard stands 27 units off the carriageway, that works out to
     * about a 28 degree turn toward the road — which is the angle a real
     * billboard is set at, arrived at by geometry rather than by taste.
     *
     * The target is pinned to the structure's own height so the aim is pure
     * yaw; letting it pitch would tip the legs off vertical.
     */
    const target = getExtendedPoint(BILLBOARD_T - 0.05, new THREE.Vector3());
    target.y = position.y;

    return { position, target };
  }, []);

  useEffect(() => {
    groupRef.current?.lookAt(placement.target);
  }, [placement]);

  /*
   * The halo and the ground spill ramp alongside the screen's own gain, so the
   * sign's light arrives as one coherent thing rather than as three effects
   * with slightly different timings.
   */
  useOpacityReveal(haloRef, 0.24, 0.58, 0.05, 0.4);
  useOpacityReveal(spillRef, 0.26, 0.6, 0.04, 0.5);

  const legSpan = PANEL_WIDTH * 0.3;

  return (
    <group ref={groupRef} position={placement.position}>
      {/* Legs. Two braced steel columns down to the ground. */}
      {[-legSpan, legSpan].map((x) => (
        <group key={x}>
          <mesh position={[x, PANEL_BASE / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.62, PANEL_BASE, 0.62]} />
            <meshStandardMaterial color="#222a38" roughness={0.62} metalness={0.72} />
          </mesh>
          {/* Footing, so the column meets the ground in something. */}
          <mesh position={[x, 0.22, 0]} castShadow>
            <boxGeometry args={[1.5, 0.44, 1.5]} />
            <meshStandardMaterial color="#161c26" roughness={0.9} metalness={0.1} />
          </mesh>
        </group>
      ))}

      {/* Cross brace between the legs. */}
      <mesh position={[0, PANEL_BASE * 0.55, 0]} castShadow>
        <boxGeometry args={[legSpan * 2, 0.28, 0.28]} />
        <meshStandardMaterial color="#1e2532" roughness={0.6} metalness={0.7} />
      </mesh>

      {/* Truss the panel sits on. */}
      <mesh position={[0, PANEL_BASE - 0.3, 0]} castShadow>
        <boxGeometry args={[PANEL_WIDTH + 0.6, 0.5, 1.0]} />
        <meshStandardMaterial color="#232b39" roughness={0.58} metalness={0.74} />
      </mesh>

      {/* Frame: a box behind the screen, giving the panel real thickness. */}
      <mesh position={[0, PANEL_CENTRE_Y, 0.22]} castShadow receiveShadow>
        <boxGeometry args={[PANEL_WIDTH + 0.7, PANEL_HEIGHT + 0.7, 0.5]} />
        <meshStandardMaterial color="#1a212c" roughness={0.55} metalness={0.68} />
      </mesh>

      {/*
       * The screen itself. Self-lit through the shader above, so it needs no
       * scene light falling on it — which is correct for an emissive display
       * and is why it stays readable at the far end of the approach.
       */}
      <mesh ref={screenRef} position={[0, PANEL_CENTRE_Y, -0.04]} material={screenMaterial}>
        <planeGeometry args={[PANEL_WIDTH, PANEL_HEIGHT]} />
      </mesh>

      {/*
       * A thin gold edge around the panel. This is the brief's gold language
       * used the way it asks for — bound to a real object's real edge, four
       * strips a few centimetres wide, rather than a glow floating near it.
       */}
      {[
        { pos: [0, PANEL_CENTRE_Y + PANEL_HEIGHT / 2 + 0.16, -0.06], size: [PANEL_WIDTH + 0.36, 0.1, 0.1] },
        { pos: [0, PANEL_CENTRE_Y - PANEL_HEIGHT / 2 - 0.16, -0.06], size: [PANEL_WIDTH + 0.36, 0.1, 0.1] },
        { pos: [-PANEL_WIDTH / 2 - 0.16, PANEL_CENTRE_Y, -0.06], size: [0.1, PANEL_HEIGHT + 0.36, 0.1] },
        { pos: [PANEL_WIDTH / 2 + 0.16, PANEL_CENTRE_Y, -0.06], size: [0.1, PANEL_HEIGHT + 0.36, 0.1] },
      ].map(({ pos, size }, index) => (
        <mesh key={index} position={pos as [number, number, number]}>
          <boxGeometry args={size as [number, number, number]} />
          <meshStandardMaterial
            color="#8a6a1f"
            emissive="#B8860B"
            emissiveIntensity={0.85}
            roughness={0.32}
            metalness={0.85}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Maintenance catwalk along the bottom edge. */}
      <mesh position={[0, PANEL_BASE - 0.62, -0.5]} castShadow>
        <boxGeometry args={[PANEL_WIDTH, 0.1, 1.0]} />
        <meshStandardMaterial color="#2b3442" roughness={0.7} metalness={0.5} />
      </mesh>
      {/* Catwalk handrail. */}
      <mesh position={[0, PANEL_BASE - 0.12, -0.98]}>
        <boxGeometry args={[PANEL_WIDTH, 0.06, 0.06]} />
        <meshStandardMaterial color="#394353" roughness={0.7} metalness={0.5} />
      </mesh>

      {/*
       * A soft halo in front of the panel. This is the billboard's bloom, and
       * it is one additive sprite rather than a post-processing pass over the
       * whole frame — the glow lands on the sign and nowhere else, which is
       * what keeps the scene premium rather than hazy.
       */}
      <sprite
        ref={haloRef}
        position={[0, PANEL_CENTRE_Y, -1.6]}
        scale={[PANEL_WIDTH * 2.1, PANEL_HEIGHT * 2.4, 1]}
      >
        <spriteMaterial
          map={glowTexture}
          color="#9dbbe8"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </sprite>

      {/*
       * Light spill on the ground in front of the sign.
       *
       * A real lit billboard throws a pool onto whatever is beneath it, and
       * its absence is a large part of why the previous version looked stuck
       * onto the landscape rather than standing in it. An additive decal does
       * the job for one transparent quad — the alternative, a RectAreaLight,
       * would light the whole scene per-pixel for one small effect.
       *
       * Lifted clear of the terrain so it never z-fights with the ground.
       */}
      <mesh
        ref={spillRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.06, -7]}
        renderOrder={2}
      >
        <planeGeometry args={[PANEL_WIDTH * 1.9, 26]} />
        <meshBasicMaterial
          map={spillTexture}
          color="#5f7db0"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
};

export default Billboard;
