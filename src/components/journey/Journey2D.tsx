"use client";

import React, { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import styles from "./Journey2D.module.css";
import { JourneyBillboard } from "./JourneyBillboard";
import { JourneyStory } from "./JourneyStory";
import { JourneyRoad } from "./JourneyRoad";
import { JourneyNetwork } from "./JourneyNetwork";
import {
  CloudLayer,
  DestinationLayer,
  ForegroundLayer,
  RangeLayer,
  SkyLayer,
} from "./JourneyEnvironment";
import { JourneyMarkers } from "./JourneyMarkers";
import { JourneyTruck } from "./JourneyTruck";
import { deriveMetrics, updateScene, type SceneState } from "./journeySideView";
import {
  JourneySceneContext,
  useStageMetrics,
  usePrefersReducedMotion,
  type JourneyFrameFn,
  type JourneySceneApi,
} from "./journeyScroll";
import type { JourneyProgress } from "./journeyProgress";

/**
 * The cinematic 2D journey.
 *
 * Replaces the WebGL prototype's renderer while leaving its scroll machinery
 * completely untouched — JourneyController still pins the section and scrubs a
 * GSAP proxy into the shared progress box, and this component simply reads
 * that box. The 3D implementation is preserved under `legacy3d/` rather than
 * deleted.
 *
 * Composition, back to front:
 *
 *   SkyLayer         gradient dusk, barely moves
 *   CloudLayer       two bands at different rates
 *   MountainLayer    three ranges, contrast rising as they near
 *   CityLayer        the destination, projected and growing
 *   TerrainLayer     ground plane and foreground banks
 *   JourneyRoad      canvas: carriageway, markings, barriers, lamps
 *   JourneyBillboard the roadside sign, projected like everything else
 *   JourneyTruck     fixed distance ahead, steering through the bends
 *   JourneyAtmosphere haze, motes, grade, vignette
 *   JourneyOverlay   editorial type and progress indicators
 */

export interface Journey2DProps {
  /** The shared scroll progress box, driven by JourneyController. */
  progress: JourneyProgress;
  /**
   * When false the frame loop stops. The controller flips this from an
   * IntersectionObserver, so an off-screen journey costs nothing.
   */
  active: boolean;
}

export const Journey2D: React.FC<Journey2DProps> = ({ progress, active }) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const metrics = useStageMetrics(stageRef);
  const reducedMotion = usePrefersReducedMotion();

  /*
   * One scene object, mutated in place and handed to every subscriber. It is
   * read sixty times a second by a dozen layers; rebuilding it each tick would
   * be pure garbage collection for no benefit.
   */
  const sceneRef = useRef<SceneState>({
    progress: 0,
    truckWorldX: 0,
    cameraX: 0,
    truckScreenX: 0,
    time: 0,
    pitch: 0,
    metrics: deriveMetrics(1600, 900),
  });

  const listenersRef = useRef<Set<JourneyFrameFn>>(new Set());

  const api = useMemo<JourneySceneApi>(
    () => ({
      subscribe: (fn) => {
        listenersRef.current.add(fn);
        return () => {
          listenersRef.current.delete(fn);
        };
      },
      sceneRef,
    }),
    [],
  );

  // Metrics change only on resize, so they are pushed into the scene object
  // from an effect rather than being read during render by the frame loop.
  useEffect(() => {
    sceneRef.current.metrics = metrics;
  }, [metrics]);

  useEffect(() => {
    if (!active) return;

    const start = performance.now();

    /*
     * Driven by GSAP's ticker rather than a private requestAnimationFrame.
     *
     * The site already runs one: SmoothScroll drives Lenis from gsap.ticker,
     * and ScrollTrigger updates from Lenis. Adding a second rAF loop would put
     * this scene's reads on a different frame boundary from the scroll that
     * feeds it — which shows up as the layers lagging the truck by a frame
     * under fast scrolling. Sharing the ticker keeps everything on one beat.
     */
    const tick = () => {
      const scene = sceneRef.current;
      const time = reducedMotion ? 0 : (performance.now() - start) / 1000;
      // The camera tilt travels in the same box as progress and is copied onto
      // the scene here, so every layer sees one consistent frame.
      scene.pitch = progress.pitch;
      updateScene(scene, progress.current, time);
      for (const listener of listenersRef.current) listener(scene);
    };

    gsap.ticker.add(tick);
    // One immediate pass, so the scene is composed before the first paint
    // rather than showing a frame of unpositioned layers.
    tick();

    return () => {
      gsap.ticker.remove(tick);
    };
  }, [active, progress, reducedMotion]);

  return (
    <JourneySceneContext.Provider value={api}>
      <div ref={stageRef} className={styles.stage}>
        <SkyLayer metrics={metrics} />
        <CloudLayer metrics={metrics} />
        <RangeLayer metrics={metrics} />
        <DestinationLayer metrics={metrics} />
        <JourneyRoad metrics={metrics} />
        {/* Roadside furniture sits above the road and below the network. */}
        <JourneyMarkers metrics={metrics} />
        <JourneyBillboard metrics={metrics} />
        <JourneyNetwork metrics={metrics} />
        <JourneyTruck metrics={metrics} />
        {/* Nearest band last, so it passes in front of everything. */}
        <ForegroundLayer metrics={metrics} />
        <div className={styles.grade} aria-hidden="true" />
        <div className={styles.vignette} aria-hidden="true" />
        <JourneyStory />
      </div>
    </JourneySceneContext.Provider>
  );
};

export default Journey2D;
