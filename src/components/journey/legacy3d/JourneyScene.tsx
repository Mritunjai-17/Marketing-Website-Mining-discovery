"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment as DreiEnvironment } from "@react-three/drei";
import { JourneyCamera } from "./JourneyCamera";
import { Road } from "./Road";
import { Truck } from "./Truck";
import { getJourneyPoint, getJourneySide, getJourneyTangent } from "./journeyPath";
import { JourneyProgressProvider, type JourneyProgress } from "../journeyProgress";

/**
 * Pure white background matching the editorial website canvas.
 */
const WHITE_BG = "#ffffff";

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
        intensity={3.2}
        color="#fffcf5"
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
      <directionalLight ref={rimRef} intensity={1.5} color="#e2e8f0" />
      <pointLight ref={bounceRef} intensity={16} distance={20} decay={2} color="#f4ede0" />
    </>
  );
};

/**
 * A procedural image-based studio light.
 */
const ProceduralEnvironmentLight: React.FC = () => (
  <DreiEnvironment resolution={128} frames={1} background={false}>
    {/* Shell: clean studio ambient shell. */}
    <mesh scale={100}>
      <sphereGeometry args={[1, 24, 16]} />
      <meshBasicMaterial color="#ffffff" side={THREE.BackSide} />
    </mesh>
    {/* Clean daylight panel overhead. */}
    <mesh position={[0, 40, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[70, 70, 1]}>
      <planeGeometry />
      <meshBasicMaterial color="#ffffff" />
    </mesh>
    {/* Warm subtle key panel. */}
    <mesh position={[-38, 26, -30]} rotation={[0, Math.PI / 4, 0]} scale={[40, 40, 1]}>
      <planeGeometry />
      <meshBasicMaterial color="#fff6e8" />
    </mesh>
    {/* Clean neutral ground bounce panel. */}
    <mesh position={[0, -30, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[90, 90, 1]}>
      <planeGeometry />
      <meshBasicMaterial color="#f1f5f9" />
    </mesh>
  </DreiEnvironment>
);

/** Fog matching white canvas while allowing background elements behind canvas */
const DynamicSceneBackground: React.FC<{ progress: JourneyProgress }> = () => {
  const { scene } = useThree();
  const bgColor = useMemo(() => new THREE.Color(WHITE_BG), []);

  useFrame(() => {
    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.color.copy(bgColor);
    }
  });

  return (
    <fogExp2 attach="fog" args={[WHITE_BG, FOG_DENSITY]} />
  );
};

/** Everything inside the Canvas: Road and Truck on seamless canvas. */
const SceneContents: React.FC<{ progress: JourneyProgress }> = ({ progress }) => (
  <JourneyProgressProvider value={progress}>
    <DynamicSceneBackground progress={progress} />

    <ProceduralEnvironmentLight />

    {/* Clean ambient and hemisphere fill for the scene. */}
    <ambientLight intensity={1.45} color="#ffffff" />
    <hemisphereLight intensity={1.1} color="#ffffff" groundColor="#cbd5e1" />

    <TravellingLights progress={progress} />

    <JourneyCamera />
    <Road />
    <Truck />
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
    // Native crisp resolution up to 2x pixel density, eliminating blurriness
    dpr={[1, 2]}
    frameloop={active ? "always" : "demand"}
    gl={{
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
      toneMapping: THREE.ACESFilmicToneMapping,
      toneMappingExposure: 1.08,
    }}
    style={{ width: "100%", height: "100%", display: "block", position: "relative", zIndex: 2 }}
  >
    <SceneContents progress={progress} />
  </Canvas>
);

export default JourneyScene;
