"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useCreateJourneyProgress } from "@/components/journey/journeyProgress";
import { DescentBackdrop } from "@/components/journey/DescentBackdrop";
import {
  deriveDescentCamera,
  JOURNEY_RUNS_FROM,
} from "@/components/journey/descentCamera";
import { BoonHero, type BoonHeroHandle } from "@/components/sections/BoonHero";
import { MiningApproachSequence } from "@/components/sections/MiningApproachSequence";

const Journey3D = dynamic(
  () => import("@/components/journey/Journey3D"),
  { ssr: false },
);

export type TransitionState =
  | "HERO_ACTIVE"
  | "APPROACH_ACTIVE"
  | "CAMERA_ANGLE_SHIFT"
  | "SIDE_VIEW_LOCKED"
  | "JOURNEY_ACTIVE";

/** Total viewport heights for the continuous story (comfortably accommodates Hero -> Approach -> Truck Journey) */
const TOTAL_SCROLL_VH = 1950;

/**
 * How the sampled progress follows the true scroll position.
 * Critically damped Euler spring for smooth, responsive scroll-scrubbing.
 */
const PROGRESS_SPRING = { stiffness: 120, damping: 22 };
const RESUME_GAP = 0.8;

interface SpringState {
  value: number;
  velocity: number;
}

function stepSpring(
  spring: SpringState,
  target: number,
  dt: number,
  { stiffness, damping }: { stiffness: number; damping: number },
) {
  const steps = Math.min(6, Math.max(1, Math.ceil(dt * 60)));
  const h = dt / steps;
  for (let i = 0; i < steps; i += 1) {
    const accel = (target - spring.value) * stiffness - spring.velocity * damping;
    spring.velocity += accel * h;
    spring.value += spring.velocity * h;
  }
  if (Math.abs(target - spring.value) < 1e-4 && Math.abs(spring.velocity) < 1e-3) {
    spring.value = target;
    spring.velocity = 0;
  }
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(Math.max(v, lo), hi);
}

export const GlobeHero: React.FC = () => {
  const rangeRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const journeyBoxRef = useRef<HTMLDivElement>(null);

  const journeyProgress = useCreateJourneyProgress();
  const [journeyActive, setJourneyActive] = useState(false);
  const journeyActiveRef = useRef(false);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const lastTransPRef = useRef(0);
  const [approachProgress, setApproachProgress] = useState(0);
  const lastAppPRef = useRef(0);
  const [transitionState, setTransitionState] = useState<TransitionState>("HERO_ACTIVE");
  const transitionStateRef = useRef<TransitionState>("HERO_ACTIVE");
  const boonHeroRef = useRef<BoonHeroHandle>(null);

  const progressRef = useRef(0);
  const progressSpring = useRef<SpringState>({ value: 0, velocity: 0 });
  const rangeMetricsRef = useRef({ top: 0, travel: 0 });
  const lastSampleRef = useRef(0);
  const reduceMotionRef = useRef(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  /**
   * Writes the sequence state for the current scroll progress.
   * Only transform and opacity are touched — zero layout triggers.
   */
  const applyStage = useCallback(() => {
    const journeyBox = journeyBoxRef.current;
    if (reduceMotionRef.current) return;

    // --- Sample and damp scroll progress ---------------------------------------------
    const { top, travel } = rangeMetricsRef.current;
    const target = travel > 0 ? clamp((window.scrollY - top) / travel, 0, 1) : 0;

    const now = performance.now();
    const gap = (now - lastSampleRef.current) / 1000;
    lastSampleRef.current = now;

    const isTouch = typeof window !== "undefined" && (window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 900);
    const progress = progressSpring.current;

    if (isTouch) {
      // Mobile touch devices natively apply inertia momentum scrolling.
      progress.value = target;
      progress.velocity = 0;
    } else if (gap > RESUME_GAP) {
      progress.value = target;
      progress.velocity = 0;
    } else if (gap > 0) {
      stepSpring(progress, target, gap, PROGRESS_SPRING);
    }
    const t = clamp(progress.value, 0, 1);
    progressRef.current = t;

    // 1. Hardware-scrubbed Hero sequence:
    // Act 1 (Alpine summit) -> Act 2 (Open Pit) -> Act 3 (Cave Continuous Miner)
    // Scrubbed from t = 0.00 to t = 0.18
    const heroP = clamp(t / 0.17, 0, 1);
    if (boonHeroRef.current) {
      boonHeroRef.current.scrub(heroP);
    }

    // 2. Mining Approach Sequence (Kinetic Typography + "Our Approach" Showcase):
    // Directly after the cave continuous miner machine cuts ore (t = 0.16 to 0.40)
    const APPROACH_START = 0.16;
    const APPROACH_END = 0.40;
    const appP = clamp((t - APPROACH_START) / (APPROACH_END - APPROACH_START), 0, 1);

    if (Math.abs(appP - lastAppPRef.current) > 0.002 || appP === 0 || appP === 1) {
      lastAppPRef.current = appP;
      setApproachProgress(appP);
    }

    // 3. 3D Truck Highway Journey:
    // Takes over seamlessly after "Our Approach" finishes
    const TRANS_START = 0.35;
    const TRANS_END = 0.40;
    const transP = clamp((t - TRANS_START) / (TRANS_END - TRANS_START), 0, 1);

    const JOURNEY_START = 0.365;
    const MILESTONE_5_T = 0.72;

    let journeyP = 0;
    if (t <= JOURNEY_START) {
      journeyP = 0;
    } else if (t <= MILESTONE_5_T) {
      journeyP = clamp(((t - JOURNEY_START) / (MILESTONE_5_T - JOURNEY_START)) * 0.88, 0, 0.88);
    } else {
      journeyP = clamp(0.88 + ((t - MILESTONE_5_T) / (1.0 - MILESTONE_5_T)) * 0.12, 0.88, 1.0);
    }

    journeyProgress.current = journeyP;
    journeyProgress.descent = transP;

    // Throttle state update to keep React rendering lightweight
    if (
      Math.abs(transP - lastTransPRef.current) > 0.002 ||
      transP === 0 ||
      transP === 1 ||
      (transP >= 0.89 && lastTransPRef.current < 0.89)
    ) {
      lastTransPRef.current = transP;
      setTransitionProgress(transP);
    }

    // Explicit Transition State
    let nextState: TransitionState = "HERO_ACTIVE";
    if (t < APPROACH_START) nextState = "HERO_ACTIVE";
    else if (t < JOURNEY_START) nextState = "APPROACH_ACTIVE";
    else if (transP < 0.99) nextState = "CAMERA_ANGLE_SHIFT";
    else if (t <= TRANS_END) nextState = "SIDE_VIEW_LOCKED";
    else nextState = "JOURNEY_ACTIVE";

    if (nextState !== transitionStateRef.current) {
      transitionStateRef.current = nextState;
      setTransitionState(nextState);
    }

    // Journey active state
    const shouldJourneyBeActive = transP >= JOURNEY_RUNS_FROM;
    if (shouldJourneyBeActive !== journeyActiveRef.current) {
      journeyActiveRef.current = shouldJourneyBeActive;
      setJourneyActive(shouldJourneyBeActive);
    }

    // --- The descent camera, flown over the real Journey ---------------------------
    if (journeyBox) {
      const camera = deriveDescentCamera(transP);
      journeyProgress.pitch = camera.pitch;
      journeyProgress.descent = transP;
      journeyBox.style.opacity = camera.opacity.toFixed(3);
      journeyBox.style.visibility = camera.opacity <= 0.005 ? "hidden" : "visible";
      journeyBox.style.pointerEvents = camera.locked ? "auto" : "none";
    }
  }, [journeyProgress]);

  useEffect(() => {
    const range = rangeRef.current;
    if (!range) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    reduceMotionRef.current = reduced;
    setReduceMotion(reduced);
    if (reduced) return;

    const measureRange = () => {
      const rect = range.getBoundingClientRect();
      rangeMetricsRef.current = {
        top: rect.top + window.scrollY,
        travel: rect.height - window.innerHeight,
      };
    };

    measureRange();
    applyStage();

    let animId: number;
    const loop = () => {
      applyStage();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    const observer = new ResizeObserver(() => {
      measureRange();
      applyStage();
    });
    observer.observe(range);

    // The requestAnimationFrame loop samples window.scrollY continuously on every display frame
    // onScroll does not need to duplicate applyStage(), avoiding dual-execution timing jitter
    const onScroll = () => {};
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measureRange);

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measureRange);
    };
  }, [applyStage]);

  return (
    <section className="relative isolate w-full bg-[#030509]">
      {/* Story Range — pins hero and drives entire journey from scroll 0 */}
      <div
        ref={rangeRef}
        className="relative w-full"
        style={{ height: reduceMotion ? "100vh" : `${TOTAL_SCROLL_VH}vh` }}
      >
        <div
          ref={cardRef}
          className="sticky top-0 h-screen w-full overflow-hidden bg-[#030509]"
        >
          <div ref={slotRef} className="relative h-full w-full">
            {/* Boon-Inspired Dark Hero Overlay */}
            <BoonHero ref={boonHeroRef} />

            {/* Mining Approach Sequence (Kinetic Typography + "Our Approach" Showcase) */}
            <MiningApproachSequence progress={approachProgress} />

            {/* Dark Descent Backdrop & 3D Truck Journey */}
            <DescentBackdrop progress={transitionProgress} />

            <div
              className="pointer-events-none absolute inset-0 z-24 h-full w-full"
            >
              <div
                ref={journeyBoxRef}
                className="h-full w-full"
                style={{
                  opacity: 0,
                }}
              >
                <Journey3D progress={journeyProgress} active={journeyActive} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GlobeHero;
