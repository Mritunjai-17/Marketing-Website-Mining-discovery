"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useCreateJourneyProgress } from "@/components/journey/journeyProgress";
import { DescentBackdrop } from "@/components/journey/DescentBackdrop";
import {
  deriveDescentCamera,
  JOURNEY_RUNS_FROM,
} from "@/components/journey/descentCamera";
import { BoonHero } from "@/components/sections/BoonHero";

const Journey3D = dynamic(
  () => import("@/components/journey/Journey3D"),
  { ssr: false },
);

export type TransitionState =
  | "HERO_ACTIVE"
  | "CAMERA_ANGLE_SHIFT"
  | "SIDE_VIEW_LOCKED"
  | "JOURNEY_ACTIVE";

/** Total viewport heights for the entire continuous story (provides comfortable, normal scrolling pace) */
const TOTAL_SCROLL_VH = 1650;

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
  const [transitionState, setTransitionState] = useState<TransitionState>("HERO_ACTIVE");
  const transitionStateRef = useRef<TransitionState>("HERO_ACTIVE");
  const [heroProgress, setHeroProgress] = useState(0);
  const lastHeroPRef = useRef(0);

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
      // 1:1 direct tracking gives instant, buttery responsiveness without spring lag.
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

    // 1. Hero scrubbed animation span in the pinned scroll timeline (exact 264vh distance)
    const HERO_SPAN = 0.160;
    const heroP = clamp(t / HERO_SPAN, 0, 1);
    // 240 frames total: only trigger React state updates when the frame index changes (~0.0041)
    const MIN_FRAME_STEP = 1 / 240;
    if (
      Math.abs(heroP - lastHeroPRef.current) >= MIN_FRAME_STEP ||
      heroP === 0 ||
      heroP === 1
    ) {
      lastHeroPRef.current = heroP;
      setHeroProgress(heroP);
    }

    // --- Master Progress & Phase Partitioning ---------------------------------------
    // Exact same scroll pixel distance for Transition (624vh) and Preroll (87.4vh)
    const TRANSITION_SPAN = 0.3782;
    const transP = t <= TRANSITION_SPAN ? clamp(t / TRANSITION_SPAN, 0, 1) : 1.0;

    const JOURNEY_PREROLL = 0.0529;
    const journeyFrom = TRANSITION_SPAN - JOURNEY_PREROLL; // 0.3253

    // Milestones 0-5 maintain 100% exact same scroll distance (583.7vh)
    // Milestone 5 ends at journeyP = 0.88 (t = 0.6791)
    // From t = 0.6791 to 1.0000, 529.5vh is dedicated to:
    // "One platform. Every major mining audience." + 3D worker pull + services hold
    const MILESTONE_5_T = 0.6791;
    let journeyP = 0;
    if (t <= journeyFrom) {
      journeyP = 0;
    } else if (t <= MILESTONE_5_T) {
      journeyP = clamp(((t - journeyFrom) / (MILESTONE_5_T - journeyFrom)) * 0.88, 0, 0.88);
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
    if (transP < 0.89) nextState = "HERO_ACTIVE";
    else if (transP < 0.99) nextState = "CAMERA_ANGLE_SHIFT";
    else if (t <= TRANSITION_SPAN) nextState = "SIDE_VIEW_LOCKED";
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
            <BoonHero progress={heroProgress} />

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
