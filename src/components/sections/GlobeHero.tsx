"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { BoonHero, type BoonHeroHandle } from "@/components/sections/BoonHero";
import { ClientInvestorGrowth } from "@/components/sections/ClientInvestorGrowth/ClientInvestorGrowth";
import OurServicesSection from "@/components/sections/OurServicesSection";

/** Total viewport heights for the continuous story (Hero -> Value Bridge -> Featured Work & ROI -> Our Services 8 Cards) */
const TOTAL_SCROLL_VH = 3400;

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
  const boonHeroRef = useRef<BoonHeroHandle>(null);

  const [bridgeOpacity, setBridgeOpacity] = useState(0);
  const [bridgeScroll, setBridgeScroll] = useState(0);
  const bridgeOpacityRef = useRef(0);
  const bridgeScrollRef = useRef(0);

  const [servicesOpacity, setServicesOpacity] = useState(0);
  const [servicesScroll, setServicesScroll] = useState(0);
  const servicesOpacityRef = useRef(0);
  const servicesScrollRef = useRef(0);
  const servicesTrackRef = useRef<HTMLDivElement>(null);
  const servicesContainerRef = useRef<HTMLDivElement>(null);

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
    if (reduceMotionRef.current) return;

    // --- Sample and damp scroll progress ---------------------------------------------
    const { top, travel } = rangeMetricsRef.current;
    const target = travel > 0 ? clamp((window.scrollY - top) / travel, 0, 1) : 0;

    const now = performance.now();
    const gap = (now - lastSampleRef.current) / 1000;
    lastSampleRef.current = now;

    const isTouch =
      typeof window !== "undefined" &&
      (window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 900);
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
    // Scrubbed from t = 0.00 to t = 0.085
    const HERO_END = 0.085;
    const heroP = clamp(t / HERO_END, 0, 1);
    if (boonHeroRef.current) {
      boonHeroRef.current.scrub(heroP);
    }

    // 2. Value Bridge & Real Client Case Studies (Connected Architectural Flow)
    // Continuous physical scroll: Part 1 (#D9D6CE) -> Part 2 (#18222B)
    const BRIDGE_START = 0.085;
    const BRIDGE_FADE_IN_END = 0.105;
    const BRIDGE_SCROLL_END = 0.58;
    const BRIDGE_END = 0.61;

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

    const bScroll = clamp(
      (t - BRIDGE_FADE_IN_END) / (BRIDGE_SCROLL_END - BRIDGE_FADE_IN_END),
      0,
      1
    );

    if (
      Math.abs(bOpacity - bridgeOpacityRef.current) > 0.005 ||
      bOpacity === 0 ||
      bOpacity === 1
    ) {
      bridgeOpacityRef.current = bOpacity;
      setBridgeOpacity(bOpacity);
    }

    if (
      Math.abs(bScroll - bridgeScrollRef.current) > 0.003 ||
      bScroll === 0 ||
      bScroll === 1
    ) {
      bridgeScrollRef.current = bScroll;
      setBridgeScroll(bScroll);
    }

    // 4. Our Services Section (All 8 Delivered Cards)
    // Glides through all 8 cards between t = 0.59 and t = 0.94
    const SERVICES_START = 0.59;
    const SERVICES_FADE_IN_END = 0.62;
    const SERVICES_END = 0.94;

    let sOpacity = 0;
    if (t < SERVICES_START) {
      sOpacity = 0;
    } else if (t < SERVICES_FADE_IN_END) {
      sOpacity = (t - SERVICES_START) / (SERVICES_FADE_IN_END - SERVICES_START);
    } else {
      sOpacity = 1.0;
    }
    sOpacity = clamp(sOpacity, 0, 1);

    const sScroll = clamp(
      (t - SERVICES_FADE_IN_END) / (SERVICES_END - SERVICES_FADE_IN_END),
      0,
      1
    );

    if (
      Math.abs(sOpacity - servicesOpacityRef.current) > 0.005 ||
      sOpacity === 0 ||
      sOpacity === 1
    ) {
      servicesOpacityRef.current = sOpacity;
      setServicesOpacity(sOpacity);
    }

    if (
      Math.abs(sScroll - servicesScrollRef.current) > 0.003 ||
      sScroll === 0 ||
      sScroll === 1
    ) {
      servicesScrollRef.current = sScroll;
      setServicesScroll(sScroll);
    }

    // Scrub the services editorial grid upwards
    if (servicesTrackRef.current) {
      const contentH = servicesTrackRef.current.offsetHeight || 2600;
      const clientH = typeof window !== "undefined" ? window.innerHeight : 800;
      const maxScroll = Math.max(0, contentH - clientH + 160);
      const cardsY = sScroll * maxScroll;
      servicesTrackRef.current.style.transform = `translate3d(0, -${cardsY.toFixed(1)}px, 0)`;
    }
  }, []);

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
            {/* 1. Boon-Inspired Dark Hero Overlay */}
            <BoonHero ref={boonHeroRef} />

            {/* 2. Value Bridge & Real Client Case Studies (Connected Architectural Flow) */}
            <ClientInvestorGrowth
              scrollProgress={bridgeScroll}
              opacity={bridgeOpacity}
            />

            {/* 4. Our Services Section (All 8 Delivered Cards) */}
            <div
              ref={servicesContainerRef}
              className="absolute inset-0 h-full w-full overflow-hidden"
              style={{
                opacity: servicesOpacity,
                visibility: servicesOpacity <= 0.005 ? "hidden" : "visible",
                pointerEvents: servicesOpacity > 0.5 ? "auto" : "none",
                background: "#FAF7F2",
                zIndex: 38,
              }}
            >
              <OurServicesSection
                isEmbedded
                trackRef={servicesTrackRef}
                containerRef={servicesContainerRef}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GlobeHero;
