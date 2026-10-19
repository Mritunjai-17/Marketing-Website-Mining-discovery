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
const DESKTOP_SCROLL_VH = 1050;
const MOBILE_SCROLL_VH = 550;

function clamp(v: number, lo: number, hi: number) {
  return Math.min(Math.max(v, lo), hi);
}

export const GlobeHero: React.FC = () => {
  const rangeRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const boonHeroBoxRef = useRef<HTMLDivElement>(null);
  const bridgeBoxRef = useRef<HTMLDivElement>(null);
  const journeyBoxRef = useRef<HTMLDivElement>(null);

  const journeyProgress = useCreateJourneyProgress();
  const [journeyActive, setJourneyActive] = useState(false);
  const journeyActiveRef = useRef(false);
  const boonHeroRef = useRef<BoonHeroHandle>(null);

  const progressRef = useRef(0);
  const rangeMetricsRef = useRef({ top: 0, travel: 0 });
  const reduceMotionRef = useRef(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const [bridgeScroll, setBridgeScroll] = useState(0);
  const bridgeScrollRef = useRef(0);
  const isMobileRef = useRef(false);

  const [totalScrollVh, setTotalScrollVh] = useState(DESKTOP_SCROLL_VH);
  const lastHeroPRef = useRef<number>(-1);

  useEffect(() => {
    let lastWidth = window.innerWidth;
    const updateHeight = () => {
      const currentWidth = window.innerWidth;
      if (Math.abs(currentWidth - lastWidth) < 2) return;
      lastWidth = currentWidth;
      const isMobile =
        currentWidth < 900 ||
        window.matchMedia("(pointer: coarse)").matches;
      isMobileRef.current = isMobile;
      setTotalScrollVh(isMobile ? MOBILE_SCROLL_VH : DESKTOP_SCROLL_VH);
    };
    const isMobile =
      window.innerWidth < 900 ||
      window.matchMedia("(pointer: coarse)").matches;
    isMobileRef.current = isMobile;
    setTotalScrollVh(isMobile ? MOBILE_SCROLL_VH : DESKTOP_SCROLL_VH);
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  /**
   * Writes the sequence state for the current scroll progress.
   * Only transform and opacity are touched — zero layout triggers.
   */
  const applyStage = useCallback(() => {
    const boonHeroBox = boonHeroBoxRef.current;
    const journeyBox = journeyBoxRef.current;
    if (reduceMotionRef.current) return true;

    // --- Sample scroll progress in direct 1:1 synchrony with scroll position ---------
    const { top, travel } = rangeMetricsRef.current;
    const target = travel > 0 ? clamp((window.scrollY - top) / travel, 0, 1) : 0;
    const t = target;
    progressRef.current = t;

    // 1. Hardware-scrubbed Hero sequence:
    // Act 1 (Alpine summit) -> Act 2 (Open Pit) -> Act 3 (Cave Continuous Miner)
    // On mobile, dedicated runway allows the full 3-act visual descent and video to play with smooth pacing
    const isMobile = isMobileRef.current;
    const HERO_END = isMobile ? 0.22 : 0.08;
    const HERO_FADE_END = isMobile ? 0.25 : 0.10;
    const heroP = clamp(t / HERO_END, 0, 1);
    if (boonHeroRef.current) {
      if (t >= HERO_FADE_END) {
        if (lastHeroPRef.current !== 1) {
          boonHeroRef.current.scrub(1);
          lastHeroPRef.current = 1;
        }
      } else {
        boonHeroRef.current.scrub(heroP);
        lastHeroPRef.current = heroP;
      }
    }

    if (boonHeroBox) {
      if (t >= HERO_FADE_END) {
        boonHeroBox.style.opacity = "0";
        boonHeroBox.style.visibility = "hidden";
        boonHeroBox.style.pointerEvents = "none";
        boonHeroBox.style.zIndex = "10";
      } else if (t >= HERO_END) {
        const heroOpacity = 1.0 - (t - HERO_END) / (HERO_FADE_END - HERO_END);
        boonHeroBox.style.opacity = heroOpacity.toFixed(3);
        boonHeroBox.style.visibility = "visible";
        boonHeroBox.style.pointerEvents = "none";
        boonHeroBox.style.zIndex = "30";
      } else {
        boonHeroBox.style.opacity = "1";
        boonHeroBox.style.visibility = "visible";
        boonHeroBox.style.pointerEvents = "auto";
        boonHeroBox.style.zIndex = "30";
      }
    }

    // 2. Value Bridge: Client & Investor Growth Section ("Building Value for Every Stakeholder")
    // Proportionally balanced scroll runway giving 1:1 natural scroll travel for all cards, events & publications
    const BRIDGE_START = isMobile ? 0.22 : 0.08;
    const BRIDGE_FADE_IN_END = isMobile ? 0.25 : 0.10;
    const BRIDGE_SCROLL_END = isMobile ? 0.77 : 0.76;
    const BRIDGE_END = isMobile ? 0.80 : 0.785;

    let bOpacity = 0;
    if (t < BRIDGE_START || t >= BRIDGE_END) {
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

    const bridgeBox = bridgeBoxRef.current;
    if (bridgeBox) {
      bridgeBox.style.opacity = bOpacity.toFixed(3);
      bridgeBox.style.visibility = bOpacity > 0 ? "visible" : "hidden";
      bridgeBox.style.pointerEvents = bOpacity > 0.5 ? "auto" : "none";
      bridgeBox.style.zIndex = bOpacity > 0 ? "35" : "10";
    }

    const scrollThreshold = isMobileRef.current ? 0.008 : 0.003;
    if (Math.abs(bScroll - bridgeScrollRef.current) > scrollThreshold || bScroll === 0 || bScroll === 1) {
      bridgeScrollRef.current = bScroll;
      setBridgeScroll(bScroll);
    }

    // 3. Services Section (5 Interactive Cards):
    // Takes over cleanly and fully opaquely after the Value Bridge section finishes
    const SERVICES_START = isMobile ? 0.80 : 0.785;
    const SERVICES_END = 0.99;

    let servicesP = 0;
    if (t < SERVICES_START) {
      servicesP = 0;
    } else {
      servicesP = clamp((t - SERVICES_START) / (SERVICES_END - SERVICES_START), 0, 1);
    }

    journeyProgress.current = servicesP;
    journeyProgress.descent = 1.0;
    journeyProgress.cardsProgress = 0;

    // Services section active state: only activate when bridge has completed
    const shouldJourneyBeActive = t >= SERVICES_START && t <= 1.0;
    if (shouldJourneyBeActive !== journeyActiveRef.current) {
      journeyActiveRef.current = shouldJourneyBeActive;
      setJourneyActive(shouldJourneyBeActive);
    }

    if (journeyBox) {
      if (t < SERVICES_START) {
        journeyBox.style.opacity = "0";
        journeyBox.style.visibility = "hidden";
        journeyBox.style.pointerEvents = "none";
        journeyBox.style.zIndex = "10";
      } else {
        // Immediate clean solid handoff so previous section never bleeds through
        journeyBox.style.opacity = "1";
        journeyBox.style.visibility = "visible";
        journeyBox.style.pointerEvents = "auto";
        journeyBox.style.zIndex = "40";
      }
    }

    return true;
  }, [journeyProgress]);

  const applyStageRef = useRef(applyStage);
  applyStageRef.current = applyStage;

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
      applyStageRef.current();
      isTicking = false;
      animId = null;
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
    const lenis = typeof window !== "undefined" ? (window as any).lenis : null;
    if (lenis) {
      lenis.on("scroll", onScroll);
    }
    const onResize = () => {
      measureRange();
      requestTick();
    };
    window.addEventListener("resize", onResize);

    // =========================================================================
    // DISCRETE MOBILE THUMB-SCROLL STEP PROGRESSION
    // 3 Hero + 4 Building Values + 4 Mining Events + 4 Publications + 5 Services
    // =========================================================================
    const MOBILE_STEP_T_MAP = [
      0.000, // Step 0: Hero Act 1
      0.110, // Step 1: Hero Act 2
      0.220, // Step 2: Hero Act 3
      0.260, // Step 3: Building Values Card 1 (Mining Companies)
      0.300, // Step 4: Building Values Card 2 (Junior Miners)
      0.340, // Step 5: Building Values Card 3 (Mining Investors)
      0.380, // Step 6: Building Values Card 4 (Equipment & Tech)
      0.425, // Step 7: Mining Events 01 (Investment Event of the North)
      0.468, // Step 8: Mining Events 02 (PDAC Convention)
      0.510, // Step 9: Mining Events 03 (Mines and Money London)
      0.552, // Step 10: Mining Events 04 (Mining Indaba Cape Town)
      0.598, // Step 11: Publications Category 1 (Magazines)
      0.640, // Step 12: Publications Category 2 (Newsletters)
      0.682, // Step 13: Publications Category 3 (Articles)
      0.728, // Step 14: Publications Category 4 (CEO Profiles)
      0.805, // Step 15: Services Card 1
      0.845, // Step 16: Services Card 2
      0.885, // Step 17: Services Card 3
      0.925, // Step 18: Services Card 4
      0.975, // Step 19: Services Card 5
      1.000, // Step 20: Exit to MiningPackages & free normal scroll
    ];

    let currentStepIndex = 0;
    let isStepAnimating = false;
    let animRafId: number | null = null;

    const smoothScrollTo = (targetY: number, duration = 540, onDone?: () => void) => {
      if (animRafId !== null) cancelAnimationFrame(animRafId);
      const startY = window.scrollY;
      const diff = targetY - startY;
      if (Math.abs(diff) < 2) {
        window.scrollTo(0, targetY);
        onDone?.();
        return;
      }
      isStepAnimating = true;
      const startTime = performance.now();
      // Silky cubic-bezier ease-out curve for moderate, luxurious glide
      const easeOutCubic = (x: number): number => 1 - Math.pow(1 - x, 3);

      const animStep = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const eased = easeOutCubic(progress);
        window.scrollTo(0, startY + diff * eased);
        if (progress < 1) {
          animRafId = requestAnimationFrame(animStep);
        } else {
          window.scrollTo(0, targetY);
          animRafId = null;
          isStepAnimating = false;
          onDone?.();
        }
      };
      animRafId = requestAnimationFrame(animStep);
    };

    const syncCurrentStep = () => {
      if (isStepAnimating) return;
      const { top, travel } = rangeMetricsRef.current;
      if (travel <= 0) return;
      const t = clamp((window.scrollY - top) / travel, 0, 1);
      let closest = 0;
      let minDiff = Infinity;
      for (let i = 0; i < MOBILE_STEP_T_MAP.length; i++) {
        const d = Math.abs(t - MOBILE_STEP_T_MAP[i]);
        if (d < minDiff) {
          minDiff = d;
          closest = i;
        }
      }
      currentStepIndex = closest;
    };

    let touchStartY = 0;
    let touchStartX = 0;
    let isTouchActive = false;

    const onTouchStart = (e: TouchEvent) => {
      if (!isMobileRef.current || e.touches.length !== 1) return;
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
      isTouchActive = true;
      syncCurrentStep();
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isMobileRef.current || !isTouchActive || e.touches.length !== 1) return;
      const { top, travel } = rangeMetricsRef.current;
      const currentY = window.scrollY;

      // Inside hero/bridge/services range: prevent default rubber-band drag to keep step discrete
      if (currentY <= top + travel - 10) {
        const dy = touchStartY - e.touches[0].clientY;
        const dx = touchStartX - e.touches[0].clientX;
        if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
          if (e.cancelable) {
            e.preventDefault();
          }
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!isMobileRef.current || !isTouchActive) return;
      isTouchActive = false;
      if (isStepAnimating) return;

      const dy = touchStartY - (e.changedTouches[0]?.clientY ?? touchStartY);
      if (Math.abs(dy) < 35) return;

      const { top, travel } = rangeMetricsRef.current;
      const currentY = window.scrollY;

      if (dy > 0) {
        // Swiping UP -> Advance to NEXT step
        if (currentY < top + travel && currentStepIndex < MOBILE_STEP_T_MAP.length - 1) {
          currentStepIndex += 1;
          const targetT = MOBILE_STEP_T_MAP[currentStepIndex];
          const targetY = top + targetT * travel;
          smoothScrollTo(targetY, 540);
        }
      } else if (dy < 0) {
        // Swiping DOWN -> Go to PREVIOUS step
        if (currentY <= top + travel + 20 && currentStepIndex > 0) {
          currentStepIndex -= 1;
          const targetT = MOBILE_STEP_T_MAP[currentStepIndex];
          const targetY = top + targetT * travel;
          smoothScrollTo(targetY, 540);
        }
      }
    };

    let wheelAccum = 0;
    let wheelCooldown = false;

    const onWheel = (e: WheelEvent) => {
      if (!isMobileRef.current) return;
      const { top, travel } = rangeMetricsRef.current;
      const currentY = window.scrollY;
      if (currentY > top + travel + 10) return;

      if (isStepAnimating || wheelCooldown) {
        if (e.cancelable) e.preventDefault();
        return;
      }

      wheelAccum += e.deltaY;
      if (Math.abs(wheelAccum) > 35) {
        if (e.cancelable) e.preventDefault();
        const isDown = wheelAccum > 0;
        wheelAccum = 0;
        wheelCooldown = true;

        if (isDown && currentStepIndex < MOBILE_STEP_T_MAP.length - 1) {
          currentStepIndex += 1;
          const targetT = MOBILE_STEP_T_MAP[currentStepIndex];
          const targetY = top + targetT * travel;
          smoothScrollTo(targetY, 540, () => {
            setTimeout(() => { wheelCooldown = false; }, 80);
          });
        } else if (!isDown && currentStepIndex > 0) {
          currentStepIndex -= 1;
          const targetT = MOBILE_STEP_T_MAP[currentStepIndex];
          const targetY = top + targetT * travel;
          smoothScrollTo(targetY, 540, () => {
            setTimeout(() => { wheelCooldown = false; }, 80);
          });
        } else {
          wheelCooldown = false;
        }
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      if (animId !== null) cancelAnimationFrame(animId);
      if (animRafId !== null) cancelAnimationFrame(animRafId);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("wheel", onWheel);
      if (lenis) {
        lenis.off("scroll", onScroll);
      }
    };
  }, []);

  return (
    <section className="relative isolate w-full bg-[#030509]">
      {/* Story Range — pins hero and drives entire journey from scroll 0 */}
      <div
        ref={rangeRef}
        className="relative w-full"
        style={{ height: reduceMotion ? "100vh" : `${totalScrollVh}vh` }}
      >
        {/* Anchor point targeting the Publications Showcase (Magazines, Newsletters, Articles, CEO Profiles) */}
        <div
          id="publications"
          className="absolute left-0 w-full pointer-events-none"
          style={{ top: "62%" }}
          aria-hidden="true"
        />
        {/* Anchor point targeting the Brand & Visual Identity Services stage */}
        <div
          id="services"
          className="absolute left-0 w-full pointer-events-none"
          style={{ top: "82%" }}
          aria-hidden="true"
        />
        <div
          ref={cardRef}
          className="sticky top-0 h-screen supports-[height:100dvh]:h-[100dvh] w-full overflow-hidden bg-[#030509] touch-pan-y"
        >
          <div ref={slotRef} className="relative h-full w-full touch-pan-y">
            {/* Boon-Inspired Dark Hero Overlay */}
            <div
              ref={boonHeroBoxRef}
              className="absolute inset-0 h-full w-full touch-pan-y"
              style={{
                zIndex: 30,
              }}
            >
              <BoonHero ref={boonHeroRef} />
            </div>

            {/* Value Bridge: How Mining Discovery Enhances Growth for Clients & Investors */}
            <div
              ref={bridgeBoxRef}
              className="absolute inset-0 h-full w-full touch-pan-y"
              style={{
                zIndex: 10,
                visibility: "hidden",
                pointerEvents: "none",
                opacity: 0,
              }}
            >
              <ClientInvestorGrowth
                scrollProgress={bridgeScroll}
              />
            </div>

            {/* Services Section (Interactive Cards) */}
            <div
              ref={journeyBoxRef}
              className="absolute inset-0 h-full w-full bg-[#030509] touch-pan-y"
              style={{
                zIndex: 40,
              }}
            >
              <Journey3D progress={journeyProgress} active={journeyActive} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GlobeHero;
