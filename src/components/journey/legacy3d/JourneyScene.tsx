"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment as DreiEnvironment } from "@react-three/drei";
import { JourneyCamera } from "./JourneyCamera";
import { JourneyEnvironment } from "./Environment";
import { Billboard } from "./Billboard";
import { Destination } from "./Destination";
import { DustParticles } from "./DustParticles";
import { Road } from "./Road";
import { Truck } from "./Truck";
import { getJourneyPoint, getJourneySide, getJourneyTangent } from "./journeyPath";
import { JourneyProgressProvider, type JourneyProgress } from "../journeyProgress";

/**
 * The colour everything resolves to at distance. Matches the sky dome's
 * horizon so terrain fades into the sky rather than into a different navy.
 */
const HAZE = "#24476f";

/**
 * Exponential-squared fog, tuned against the corridor's dimensions.
 *
 * Thinned from 0.0028 so the road stays legible into the distance — the brief
 * asks for haze, not weather. The corridor was widened to 720 units in step
 * with this: at the new density its far edge still sits at about 5% opacity,
 * so the landscape's outer boundary remains invisible despite the thinner air.
 * Lose that pairing and the world ends on a line across the horizon.
 *
 * Exponential rather than linear because atmospheric perspective really is
 * exponential, and linear fog's constant falloff is the thing that makes cheap
 * 3D scenes read as having a grey curtain hung across them.
 */
const FOG_DENSITY = 0.0024;

/**
 * Lights that travel with the truck.
 *
 * A directional light covering a 1000-unit road would need a shadow frustum
 * roughly that size, which spreads a 2048px shadow map over ~0.5 units per
 * texel — far too coarse for a truck. Moving the rig with the truck lets the
 * frustum stay tight (68 units across, ~3cm per texel) for a fraction of the
 * cost. The light *directions* are constant, so the lighting never appears to
 * move; only the shadowed region does.
 */
const TravellingLights: React.FC<{ progress: JourneyProgress }> = ({ progress }) => {
  const keyRef = useRef<THREE.DirectionalLight>(null);
  const rimRef = useRef<THREE.DirectionalLight>(null);
  const bounceRef = useRef<THREE.PointLight>(null);

  /*
   * The aim point both directional lights share. It lives as a real node in
   * the scene graph (a light's target has to, or three never updates its world
   * matrix) and is driven through a ref rather than a value created during
   * render — which also neatly sidesteps the usual ordering problem, since
   * `light.target` is assigned inside the frame loop where every ref is
   * already populated.
   */
  const targetRef = useRef<THREE.Object3D>(null);
  const scratch = useMemo(
    () => ({
      point: new THREE.Vector3(),
      tangent: new THREE.Vector3(),
      side: new THREE.Vector3(),
    }),
    [],
  );

  useFrame(() => {
    const target = targetRef.current;
    if (!target) return;

    // Cheap identity checks; these settle on the first frame and never fire again.
    if (keyRef.current && keyRef.current.target !== target) keyRef.current.target = target;
    if (rimRef.current && rimRef.current.target !== target) rimRef.current.target = target;

    const t = progress.current;
    getJourneyPoint(t, scratch.point);
    getJourneyTangent(t, scratch.tangent);
    getJourneySide(t, scratch.side);

    const { point, tangent, side } = scratch;

    target.position.set(point.x, point.y + 1.6, point.z);
    target.updateMatrixWorld();

    // Key: high, ahead and to the left, so it rakes across the cab and throws
    // the truck's shadow back along the road toward the camera.
    keyRef.current?.position.set(
      point.x - side.x * 52 - tangent.x * 38,
      point.y + 58,
      point.z - side.z * 52 - tangent.z * 38,
    );

    /*
     * Rim: low, behind and opposite the key. This is the light doing the most
     * work in the shot — it draws a bright edge down the trailer's flank and
     * separates a near-white truck from a near-black landscape, which no
     * amount of key intensity can achieve on its own.
     */
    rimRef.current?.position.set(
      point.x + side.x * 30 + tangent.x * 26,
      point.y + 9,
      point.z + side.z * 30 + tangent.z * 26,
    );

    // A dim warm point just above the road under the truck, standing in for
    // light bouncing off the asphalt into the underbody and wheel arches.
    bounceRef.current?.position.set(point.x, point.y + 0.9, point.z);
  });

  return (
    <>
      <object3D ref={targetRef} />
      <directionalLight
        ref={keyRef}
        intensity={2.8}
        color="#ffeacb"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0006}
        shadow-normalBias={0.04}
        shadow-camera-near={20}
        shadow-camera-far={190}
        shadow-camera-left={-34}
        shadow-camera-right={34}
        shadow-camera-top={34}
        shadow-camera-bottom={-34}
      />
      <directionalLight ref={rimRef} intensity={2.05} color="#a6c8f5" />
      <pointLight ref={bounceRef} intensity={22} distance={20} decay={2} color="#d0b078" />
    </>
  );
};

/**
 * A procedural image-based light.
 *
 * drei's Environment renders its children into a cubemap, which means a
 * believable IBL with no HDR file to download — worth doing deliberately,
 * because the preset environments fetch several megabytes from a CDN and this
 * is a production marketing page. `frames={1}` bakes it once; nothing in here
 * moves, so re-rendering it per frame would be pure waste.
 *
 * The contents are three soft panels and a gradient shell, which is all an IBL
 * needs: it supplies the broad, soft reflections on the cab paint and glass
 * that separate a physically-shaded vehicle from a flatly-lit one.
 */
const ProceduralEnvironmentLight: React.FC = () => (
  <DreiEnvironment resolution={128} frames={1} background={false}>
    {/* Shell: the ambient colour the whole scene sits inside. */}
    <mesh scale={100}>
      <sphereGeometry args={[1, 24, 16]} />
      <meshBasicMaterial color="#22395a" side={THREE.BackSide} />
    </mesh>
    {/* Cool sky panel overhead. */}
    <mesh position={[0, 40, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[70, 70, 1]}>
      <planeGeometry />
      <meshBasicMaterial color="#7fa3d8" />
    </mesh>
    {/* Warm key panel, matching the directional key's direction and colour. */}
    <mesh position={[-38, 26, -30]} rotation={[0, Math.PI / 4, 0]} scale={[40, 40, 1]}>
      <planeGeometry />
      <meshBasicMaterial color="#c2a068" />
    </mesh>
    {/* Dark ground panel, so reflections fall off downward as they should. */}
    <mesh position={[0, -30, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[90, 90, 1]}>
      <planeGeometry />
      <meshBasicMaterial color="#0e1826" />
    </mesh>
  </DreiEnvironment>
);

/** Everything inside the Canvas. Split out so the Canvas props stay readable. */
const SceneContents: React.FC<{ progress: JourneyProgress }> = ({ progress }) => (
  <JourneyProgressProvider value={progress}>
    <color attach="background" args={[HAZE]} />
    <fogExp2 attach="fog" args={[HAZE, FOG_DENSITY]} />

    <ProceduralEnvironmentLight />

    {/*
     * Fill, raised substantially. The previous values left everything that the
     * key light did not directly touch sitting at near-black, which is what
     * made the scene read as night rather than dusk. At blue hour the sky is a
     * huge soft source and shadows stay open — so the fill does most of the
     * work of making terrain and road readable, and the key and rim are left
     * to do shaping rather than basic visibility.
     */}
    <ambientLight intensity={0.62} color="#9db7dc" />
    {/* Sky/ground bounce: cool from above, warmer off the road surface. */}
    <hemisphereLight intensity={1.15} color="#7ea0d4" groundColor="#2a2318" />

    <TravellingLights progress={progress} />

    <JourneyCamera />
    <JourneyEnvironment />
    {/*
     * The destination sits past the road's end, so it is genuinely distant
     * early on and genuinely arrived at late — the progression is physical
     * first, with the reveal ramps only shaping how its lights come up.
     */}
    <Destination />
    <Billboard />
    <Road />
    <Truck />
    <DustParticles />
  </JourneyProgressProvider>
);

export interface JourneySceneProps {
  /** Shared scroll progress, written by JourneyController. */
  progress: JourneyProgress;
  /**
   * When false the canvas stops rendering. The controller flips this from an
   * IntersectionObserver so an off-screen journey costs nothing — which is
   * what makes it safe to drop into a long marketing page.
   */
  active: boolean;
}

/**
 * The 3D journey scene.
 *
 * Client-only and self-contained: it owns no DOM outside its canvas, reads
 * exactly one value from the page (scroll progress), and can be unmounted
 * without leaving anything behind.
 */
export const JourneyScene: React.FC<JourneySceneProps> = ({ progress, active }) => (
  <Canvas
    /*
     * "percentage" maps to PCFShadowMap. R3F's default (`shadows` / `true`)
     * selects PCFSoftShadowMap, which three deprecated in r183 — it falls back
     * to PCFShadowMap anyway and logs a console error on every single frame
     * while doing it. Asking for the destination directly gets identical
     * shadows and a clean console.
     */
    shadows="percentage"
    // Capped at 1.6 rather than the full device ratio: a 3x phone screen would
    // otherwise render nine times the pixels for no visible gain.
    dpr={[1, 1.6]}
    frameloop={active ? "always" : "demand"}
    gl={{
      antialias: true,
      powerPreference: "high-performance",
      toneMapping: THREE.ACESFilmicToneMapping,
      toneMappingExposure: 1.28,
    }}
    style={{ width: "100%", height: "100%", display: "block" }}
  >
    <SceneContents progress={progress} />
  </Canvas>
);

export default JourneyScene;
