"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useCreateJourneyProgress } from "@/components/journey/journeyProgress";
import { BoonHero, type BoonHeroHandle } from "@/components/sections/BoonHero";
import { ClientInvestorGrowth } from "@/components/sections/ClientInvestorGrowth/ClientInvestorGrowth";

const Journey3D = dynamic(
  () => import("@/components/journey/Journey3D"),
  { ssr: false },
);

export type TransitionState =
  | "HERO_ACTIVE"
  | "CAMERA_ANGLE_SHIFT"
  | "SIDE_VIEW_LOCKED"
  | "JOURNEY_ACTIVE";

/** Viewport heights for the continuous story (Hero -> Client & Investor Bridge -> Our Services 8 Cards) */
const DESKTOP_SCROLL_VH = 2200;
const MOBILE_SCROLL_VH = 1600;

/**
 * How the sampled progress follows the true scroll position.
 * Responsive, critically damped spring for instant, silky scroll-scrubbing.
 */
const PROGRESS_SPRING = { stiffness: 180, damping: 26 };
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
  const boonHeroRef = useRef<BoonHeroHandle>(null);

  const progressRef = useRef(0);
  const progressSpring = useRef<SpringState>({ value: 0, velocity: 0 });
  const rangeMetricsRef = useRef({ top: 0, travel: 0 });
  const lastSampleRef = useRef(0);
  const reduceMotionRef = useRef(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const [bridgeOpacity, setBridgeOpacity] = useState(0);
  const [bridgeScroll, setBridgeScroll] = useState(0);
  const bridgeOpacityRef = useRef(0);
  const bridgeScrollRef = useRef(0);

  const [totalScrollVh, setTotalScrollVh] = useState(DESKTOP_SCROLL_VH);

  useEffect(() => {
    const updateHeight = () => {
      const isMobile =
        window.innerWidth < 900 ||
        window.matchMedia("(pointer: coarse)").matches;
      setTotalScrollVh(isMobile ? MOBILE_SCROLL_VH : DESKTOP_SCROLL_VH);
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  /**
   * Writes the sequence state for the current scroll progress.
   * Only transform and opacity are touched — zero layout triggers.
   */
  const applyStage = useCallback(() => {
    const journeyBox = journeyBoxRef.current;
    if (reduceMotionRef.current) return true;

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
    // Scrubbed gracefully from t = 0.00 to t = 0.18
    const HERO_END = 0.18;
    const heroP = clamp(t / HERO_END, 0, 1);
    if (boonHeroRef.current) {
      boonHeroRef.current.scrub(heroP);
    }

    // 2. Value Bridge: Client & Investor Growth Section ("Building Value for Every Stakeholder")
    // Generously paced scroll runway so each pillar card can be comfortably read
    const BRIDGE_START = 0.18;
    const BRIDGE_FADE_IN_END = 0.21;
    const BRIDGE_SCROLL_END = 0.60;
    const BRIDGE_END = 0.64;

    let bOpacity = 0;
    if (t < BRIDGE_START || t > BRIDGE_END) {
      bOpacity = 0;
    } else if (t < BRIDGE_FADE_IN_END) {
      bOpacity = (t - BRIDGE_START) / (BRIDGE_FADE_IN_END - BRIDGE_START);
    } else if (t <= BRIDGE_SCROLL_END) {
      bOpacity = 1.0;
    } else {
      bOpacity = 1.0 - (t - BRIDGE_SCROLL_END) / (BRIDGE_END - BRIDGE_SCROLL_END);
    }
    bOpacity = clamp(bOpacity, 0, 1);

    const bScroll = clamp((t - BRIDGE_FADE_IN_END) / (BRIDGE_SCROLL_END - BRIDGE_FADE_IN_END), 0, 1);

    if (Math.abs(bOpacity - bridgeOpacityRef.current) > 0.005 || bOpacity === 0 || bOpacity === 1) {
      bridgeOpacityRef.current = bOpacity;
      setBridgeOpacity(bOpacity);
    }

    if (Math.abs(bScroll - bridgeScrollRef.current) > 0.003 || bScroll === 0 || bScroll === 1) {
      bridgeScrollRef.current = bScroll;
      setBridgeScroll(bScroll);
    }

    // 3. Services Section (8 Interactive Cards):
    // Takes over seamlessly after the Value Bridge section finishes
    const SERVICES_START = 0.62;
    const SERVICES_END = 0.98;

    let servicesP = 0;
    if (t <= SERVICES_START) {
      servicesP = 0;
    } else {
      servicesP = clamp((t - SERVICES_START) / (SERVICES_END - SERVICES_START), 0, 1);
    }

    journeyProgress.current = servicesP;
    journeyProgress.descent = 1.0;
    journeyProgress.cardsProgress = 0;

    // Transition state
    let nextState: TransitionState = "HERO_ACTIVE";
    if (t < HERO_END) nextState = "HERO_ACTIVE";
    else if (t < SERVICES_START) nextState = "SIDE_VIEW_LOCKED";
    else nextState = "JOURNEY_ACTIVE";

    if (nextState !== transitionStateRef.current) {
      transitionStateRef.current = nextState;
      setTransitionState(nextState);
    }

    // Services section active state
    const shouldJourneyBeActive = t >= 0.61;
    if (shouldJourneyBeActive !== journeyActiveRef.current) {
      journeyActiveRef.current = shouldJourneyBeActive;
      setJourneyActive(shouldJourneyBeActive);
    }

    if (journeyBox) {
      if (t < 0.61) {
        journeyBox.style.opacity = "0";
        journeyBox.style.visibility = "hidden";
        journeyBox.style.pointerEvents = "none";
      } else {
        const fade = clamp((t - 0.61) / (0.64 - 0.61), 0, 1);
        journeyBox.style.opacity = fade.toFixed(3);
        journeyBox.style.visibility = "visible";
        journeyBox.style.pointerEvents = "auto";
      }
    }

    const isSettled = isTouch
      ? true
      : Math.abs(target - progress.value) < 1e-4 && Math.abs(progress.velocity) < 1e-3;
    return isSettled;
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

    let animId: number | null = null;
    let isTicking = false;

    const tick = () => {
      const isSettled = applyStage();
      if (!isSettled) {
        animId = requestAnimationFrame(tick);
      } else {
        isTicking = false;
        animId = null;
      }
    };

    const requestTick = () => {
      if (!isTicking) {
        isTicking = true;
        animId = requestAnimationFrame(tick);
      }
    };

    measureRange();
    requestTick();

    const observer = new ResizeObserver(() => {
      measureRange();
      requestTick();
    });
    observer.observe(range);

    const onScroll = () => {
      requestTick();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const onResize = () => {
      measureRange();
      requestTick();
    };
    window.addEventListener("resize", onResize);

    return () => {
      if (animId !== null) cancelAnimationFrame(animId);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [applyStage]);

  return (
    <section className="relative isolate w-full bg-[#030509]">
      {/* Story Range — pins hero and drives entire journey from scroll 0 */}
      <div
        ref={rangeRef}
        className="relative w-full"
        style={{ height: reduceMotion ? "100vh" : `${totalScrollVh}vh` }}
      >
        <div
          ref={cardRef}
          className="sticky top-0 h-screen supports-[height:100dvh]:h-[100dvh] w-full overflow-hidden bg-[#030509]"
        >
          <div ref={slotRef} className="relative h-full w-full">
            {/* Boon-Inspired Dark Hero Overlay */}
            <BoonHero ref={boonHeroRef} />

            {/* Value Bridge: How Mining Discovery Enhances Growth for Clients & Investors */}
            <ClientInvestorGrowth
              scrollProgress={bridgeScroll}
              opacity={bridgeOpacity}
            />

            {/* Services Section (All 8 Interactive Cards) */}
            <div
              className="absolute inset-0 h-full w-full pointer-events-none"
              style={{ zIndex: 40 }}
            >
              <div
                ref={journeyBoxRef}
                className="h-full w-full pointer-events-none"
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
