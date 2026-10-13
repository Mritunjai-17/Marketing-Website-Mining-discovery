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
const DESKTOP_SCROLL_VH = 2600;
const MOBILE_SCROLL_VH = 2000;

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

  const [totalScrollVh, setTotalScrollVh] = useState(DESKTOP_SCROLL_VH);

  useEffect(() => {
    let lastWidth = window.innerWidth;
    const updateHeight = () => {
      const currentWidth = window.innerWidth;
      if (Math.abs(currentWidth - lastWidth) < 2) return;
      lastWidth = currentWidth;
      const isMobile =
        currentWidth < 900 ||
        window.matchMedia("(pointer: coarse)").matches;
      setTotalScrollVh(isMobile ? MOBILE_SCROLL_VH : DESKTOP_SCROLL_VH);
    };
    const isMobile =
      window.innerWidth < 900 ||
      window.matchMedia("(pointer: coarse)").matches;
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
    // Scrubbed gracefully from t = 0.00 to t = 0.08, cleanly completes and hands over by t = 0.10
    const HERO_END = 0.08;
    const HERO_FADE_END = 0.10;
    const heroP = clamp(t / HERO_END, 0, 1);
    if (boonHeroRef.current) {
      boonHeroRef.current.scrub(heroP);
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
    const BRIDGE_START = 0.08;
    const BRIDGE_FADE_IN_END = 0.10;
    const BRIDGE_SCROLL_END = 0.76;
    const BRIDGE_END = 0.785;

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

    if (Math.abs(bScroll - bridgeScrollRef.current) > 0.003 || bScroll === 0 || bScroll === 1) {
      bridgeScrollRef.current = bScroll;
      setBridgeScroll(bScroll);
    }

    // 3. Services Section (5 Interactive Cards):
    // Takes over cleanly and fully opaquely after the Value Bridge section finishes
    const SERVICES_START = 0.785;
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

    return () => {
      if (animId !== null) cancelAnimationFrame(animId);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
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
          className="sticky top-0 h-screen supports-[height:100dvh]:h-[100dvh] w-full overflow-hidden bg-[#030509]"
        >
          <div ref={slotRef} className="relative h-full w-full">
            {/* Boon-Inspired Dark Hero Overlay */}
            <div
              ref={boonHeroBoxRef}
              className="absolute inset-0 h-full w-full"
              style={{
                zIndex: 30,
              }}
            >
              <BoonHero ref={boonHeroRef} />
            </div>

            {/* Value Bridge: How Mining Discovery Enhances Growth for Clients & Investors */}
            <div
              ref={bridgeBoxRef}
              className="absolute inset-0 h-full w-full"
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
              className="absolute inset-0 h-full w-full bg-[#030509]"
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
