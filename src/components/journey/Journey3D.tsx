"use client";

import React, { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import styles from "./Journey2D.module.css";
import { JourneyStory } from "./JourneyStory";
import { JourneyScene } from "./legacy3d/JourneyScene";
import {
  JourneySceneContext,
  type JourneyFrameFn,
  type JourneySceneApi,
} from "./journeyScroll";
import type { JourneyProgress } from "./journeyProgress";
import { deriveMetrics, type SceneState } from "./journeySideView";

export interface Journey3DProps {
  progress: JourneyProgress;
  active: boolean;
}

/**
 * 3D Journey experience with full storytelling integration.
 * Renders the 3D Three.js scene (road, truck, chase camera, landscape)
 * combined with the narrative storytelling chapters, service groups,
 * and live progress tracking that connect the whole website.
 */
export const Journey3D: React.FC<Journey3DProps> = ({ progress, active }) => {
  const watermarkRef = useRef<HTMLDivElement>(null);
  const sideForestRef = useRef<HTMLDivElement>(null);
  const topDownForestRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!active) return;

    const start = performance.now();
    const tick = () => {
      const scene = sceneRef.current;
      scene.progress = progress.current;
      scene.time = (performance.now() - start) / 1000;
      scene.pitch = progress.pitch;
      scene.descent = progress.descent ?? 1.0;
      for (const listener of listenersRef.current) listener(scene);

      const descentP = progress.descent ?? 1.0;
      const zoomT = Math.min(1, Math.max(0, descentP / 0.30));
      const zoomReveal = zoomT * zoomT * (3 - 2 * zoomT);
      const t = progress.current;

      // Side view panoramic forest canopy backdrop (in white area above road)
      if (sideForestRef.current) {
        const forestFade = 1 - Math.max(0, Math.min(1, (t - 0.78) / 0.08));
        const forestOpacity = (zoomReveal * forestFade * forestFade * (3 - 2 * forestFade)).toFixed(3);
        sideForestRef.current.style.opacity = forestOpacity;
      }

      if (watermarkRef.current) {
        const roadP = Math.min(1.0, Math.max(0.0, t / 0.82));
        const winW = typeof window !== "undefined" ? window.innerWidth : 1400;
        const travelDistance = winW * 1.05;
        const startX = winW * 0.20;
        const currentX = startX - roadP * travelDistance;

        const fade = 1 - Math.max(0, Math.min(1, (t - 0.79) / 0.025));
        const opacity = (zoomReveal * fade * fade * (3 - 2 * fade)).toFixed(3);

        watermarkRef.current.style.opacity = opacity;
        watermarkRef.current.style.display = t >= 0.815 ? "none" : "block";
        watermarkRef.current.style.transform = `translate3d(calc(-50% + ${currentX.toFixed(1)}px), -84%, 0)`;
      }

      // Top-down vertical drone highway & rainforest canopy backdrop (matching reference)
      if (topDownForestRef.current) {
        let topDownAlpha = 0;
        if (t >= 0.82 && t <= 0.936) {
          const fadeIn = Math.max(0, Math.min(1, (t - 0.82) / 0.06));
          const easeIn = fadeIn * fadeIn * (3 - 2 * fadeIn);
          const fadeOut = 1 - Math.max(0, Math.min(1, (t - 0.922) / 0.012));
          const easeOut = fadeOut * fadeOut * (3 - 2 * fadeOut);
          topDownAlpha = easeIn * easeOut;
        }
        topDownForestRef.current.style.opacity = topDownAlpha.toFixed(3);
        if (t >= 0.82) {
          const driftY = (t - 0.85) * 50;
          topDownForestRef.current.style.transform = `translate3d(0, ${driftY.toFixed(1)}px, 0)`;
        }
      }
    };

    gsap.ticker.add(tick);
    tick();

    return () => {
      gsap.ticker.remove(tick);
    };
  }, [active, progress]);

  return (
    <JourneySceneContext.Provider value={api}>
      <div className={styles.stage}>
        <div ref={sideForestRef} className={styles.sideForestBg} aria-hidden="true" />
        <div ref={watermarkRef} className={styles.watermarkBg} aria-hidden="true">
          OUR EVOLUTION
        </div>
        <div ref={topDownForestRef} className={styles.topDownForestBg} aria-hidden="true" />
        <JourneyScene progress={progress} active={active} />
        <JourneyStory />
      </div>
    </JourneySceneContext.Provider>
  );
};

export default Journey3D;
