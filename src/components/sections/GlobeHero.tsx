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
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const isMobileRef = useRef(false);

  const [totalScrollVh, setTotalScrollVh] = useState(DESKTOP_SCROLL_VH);
  const lastHeroPRef = useRef<number>(-1);

  const mobileHeroBoxRef = useRef<HTMLDivElement>(null);
  const mobileHeroScrollPxRef = useRef(800);
  const [mobileHeroScrollPx, setMobileHeroScrollPx] = useState(1300);

  useEffect(() => {
    setMounted(true);
    let lastWidth = window.innerWidth;
    const updateHeight = () => {
      const currentWidth = window.innerWidth;
      if (Math.abs(currentWidth - lastWidth) < 2) return;
      lastWidth = currentWidth;
      const isMobileDevice =
        currentWidth <= 900 ||
        window.matchMedia("(pointer: coarse)").matches;
      isMobileRef.current = isMobileDevice;
      setIsMobile(isMobileDevice);
      setTotalScrollVh(isMobileDevice ? MOBILE_SCROLL_VH : DESKTOP_SCROLL_VH);
      const heroPx = Math.round(window.innerHeight * 1.70);
      mobileHeroScrollPxRef.current = heroPx;
      setMobileHeroScrollPx(heroPx);
    };
    const isMobileDevice =
      window.innerWidth <= 900 ||
      window.matchMedia("(pointer: coarse)").matches;
    isMobileRef.current = isMobileDevice;
    setIsMobile(isMobileDevice);
    setTotalScrollVh(isMobileDevice ? MOBILE_SCROLL_VH : DESKTOP_SCROLL_VH);
    const initialHeroPx = Math.round(window.innerHeight * 1.70);
    mobileHeroScrollPxRef.current = initialHeroPx;
    setMobileHeroScrollPx(initialHeroPx);

    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  // Passive natural scroll listener with critically-damped lerp loop for silky 60-120fps scrubbing & top takeover
  useEffect(() => {
    if (!mounted || !isMobile) return;

    let targetProgress = 0;
    let currentProgress = 0;
    let targetOpacity = 1.0;
    let currentOpacity = 1.0;
    let rafId: number | null = null;

    const renderLoop = () => {
      // Critically damped inertial glide (silky smooth 60-120fps response)
      const progDiff = targetProgress - currentProgress;
      const opacDiff = targetOpacity - currentOpacity;

      const isProgDone = Math.abs(progDiff) < 0.0006;
      const isOpacDone = Math.abs(opacDiff) < 0.004;

      if (isProgDone) {
        currentProgress = targetProgress;
      } else {
        currentProgress += progDiff * 0.16;
      }

      if (isOpacDone) {
        currentOpacity = targetOpacity;
      } else {
        currentOpacity += opacDiff * 0.18;
      }

      // 1. Direct hardware canvas & text scrub
      if (boonHeroRef.current) {
        boonHeroRef.current.scrub(currentProgress);
      }

      // 2. Direct hardware opacity write to container
      const box = mobileHeroBoxRef.current;
      if (box) {
        box.style.opacity = currentOpacity.toFixed(3);
        if (currentOpacity <= 0.01) {
          box.style.visibility = "hidden";
          box.style.pointerEvents = "none";
        } else {
          box.style.visibility = "visible";
          box.style.pointerEvents = currentOpacity > 0.4 ? "auto" : "none";
        }
      }

      if (!isProgDone || !isOpacDone) {
        rafId = requestAnimationFrame(renderLoop);
      } else {
        rafId = null;
      }
    };

    const onMobileScroll = () => {
      const y = window.scrollY;
      const scrollPx = mobileHeroScrollPxRef.current || Math.round(window.innerHeight * 1.70);
      const fadeStartY = scrollPx * 0.82;
      const fadeEndY = scrollPx;

      // Frame progress reaches 1.0 at fadeStartY
      targetProgress = Math.min(1, Math.max(0, y / fadeStartY));

      if (y >= fadeEndY) {
        targetOpacity = 0.0;
      } else if (y > fadeStartY) {
        targetOpacity = Math.max(0, 1.0 - (y - fadeStartY) / (fadeEndY - fadeStartY));
      } else {
        targetOpacity = 1.0;
      }

      if (!rafId) {
        rafId = requestAnimationFrame(renderLoop);
      }
    };

    window.addEventListener("scroll", onMobileScroll, { passive: true });
    // Immediate initial sync
    onMobileScroll();

    return () => {
      window.removeEventListener("scroll", onMobileScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [mounted, isMobile]);

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
    // DYNAMIC MOBILE STEP PROGRESSION (HEADING-ALIGNED, SMOOTH & LIGHTWEIGHT)
    // - Hero: 3 scrolls (Act 1 -> 2 -> 3), 4th scroll brings Building Values from top
    // - Building Values: 4 scrolls (1 for each stakeholder card from top of heading)
    // - Mining Events: 4 scrolls (1 for each event card from top of heading)
    // - Publications: 4 scrolls (1 for each subheading from top of heading)
    // - 5th scroll of Publications: changes section to Services (5 cards)
    // - After Services: smoothly releases to normal free scroll
    // =========================================================================
    const getMobileStepTargets = (): number[] => {
      const { travel } = rangeMetricsRef.current;
      if (travel <= 0) return [];

      // Hero: 3 internal scrolls (Act 1 -> 2 -> 3 -> complete)
      // On the 4th scroll, the next section (Building Values) appears from the top
      const heroT = [0.000, 0.075, 0.150, 0.220];

      const bridgeBox = bridgeBoxRef.current;
      const track = bridgeBox ? (bridgeBox.querySelector('[class*="scrollTrack"]') as HTMLElement | null) : null;

      const bridgeElementIds = [
        "building-value-top",
        "stakeholder-campaigns",
        "stakeholder-syndication",
        "stakeholder-liquidity",
        "stakeholder-partnerships",
        "event-the-mining-investment-event",
        "event-pdac-convention",
        "event-mines-and-money",
        "event-mining-indaba",
        "pub-magazines",
        "pub-newsletter",
        "pub-articles",
        "pub-ceo-profile",
      ];

      const getElementByIdWithAliases = (id: string): HTMLElement | null => {
        const direct = document.getElementById(id);
        if (direct) return direct;
        if (id === "stakeholder-campaigns" || id === "stakeholder-spotlight") {
          return document.getElementById("stakeholder-campaigns") || document.getElementById("stakeholder-spotlight") || document.querySelector('[data-stakeholder-index="0"]') || document.querySelector('[class*="alternatingRow"]:nth-of-type(1)');
        }
        if (id === "stakeholder-syndication" || id === "stakeholder-milestones") {
          return document.getElementById("stakeholder-syndication") || document.getElementById("stakeholder-milestones") || document.querySelector('[data-stakeholder-index="1"]') || document.querySelector('[class*="alternatingRow"]:nth-of-type(2)');
        }
        if (id === "stakeholder-liquidity" || id === "stakeholder-intelligence") {
          return document.getElementById("stakeholder-liquidity") || document.getElementById("stakeholder-intelligence") || document.querySelector('[data-stakeholder-index="2"]') || document.querySelector('[class*="alternatingRow"]:nth-of-type(3)');
        }
        if (id === "stakeholder-partnerships") {
          return document.getElementById("stakeholder-partnerships") || document.querySelector('[data-stakeholder-index="3"]') || document.querySelector('[class*="alternatingRow"]:nth-of-type(4)');
        }
        if (id === "pub-newsletter" || id === "pub-newsletters") {
          return document.getElementById("pub-newsletter") || document.getElementById("pub-newsletters");
        }
        return null;
      };

      const bridgeT: number[] = [];
      const BRIDGE_FADE_IN_END = isMobileRef.current ? 0.25 : 0.10;
      const BRIDGE_SCROLL_END = isMobileRef.current ? 0.77 : 0.76;
      const bridgeSpan = BRIDGE_SCROLL_END - BRIDGE_FADE_IN_END;

      if (track) {
        const clientH = window.innerHeight || 800;
        const contentH = track.offsetHeight || 5500;
        const maxScroll = Math.max(1, contentH - clientH);
        const NAVBAR_PAD = 70;
        const trackRect = track.getBoundingClientRect();

        let lastT = BRIDGE_FADE_IN_END;
        bridgeElementIds.forEach((id, idx) => {
          const el = getElementByIdWithAliases(id);
          if (el) {
            const elRect = el.getBoundingClientRect();
            // Distance from track origin to element top (invariant to CSS transform)
            const elTop = elRect.top - trackRect.top;
            const targetScrollY = Math.max(0, elTop - NAVBAR_PAD);
            const bScroll = Math.min(1, targetScrollY / maxScroll);
            let t = BRIDGE_FADE_IN_END + bScroll * bridgeSpan;
            if (idx > 0 && t <= lastT) {
              t = lastT + 0.016;
            }
            lastT = t;
            bridgeT.push(t);
          }
        });
      }

      if (bridgeT.length < bridgeElementIds.length) {
        const fallbackBridge = [
          0.250, // building-value-top (appears from top on 4th scroll)
          0.288, // stakeholder 1
          0.328, // stakeholder 2
          0.368, // stakeholder 3
          0.408, // stakeholder 4
          0.450, // event 1
          0.490, // event 2
          0.530, // event 3
          0.570, // event 4
          0.615, // pub 1 (magazines)
          0.655, // pub 2 (newsletters)
          0.700, // pub 3 (articles)
          0.745, // pub 4 (ceo profiles)
        ];
        bridgeT.length = 0;
        bridgeT.push(...fallbackBridge);
      }

      // Services steps (5 cards, with 5th scroll of publications changing section here)
      const servicesT = [
        0.805, // Service Card 1 (5th scroll from pub changes section here!)
        0.845, // Service Card 2
        0.885, // Service Card 3
        0.925, // Service Card 4
        0.970, // Service Card 5
        1.000, // Release to normal free scroll
      ];

      return [...heroT, ...bridgeT, ...servicesT];
    };

    let currentStepIndex = 0;
    let isStepAnimating = false;
    let animRafId: number | null = null;
    let lastStepTime = 0;

    // Feather-light, velvety-smooth RAF glide (360ms, easeOutQuint)
    const smoothScrollTo = (targetY: number, duration = 360, onDone?: () => void) => {
      if (animRafId !== null) cancelAnimationFrame(animRafId);
      const startY = window.scrollY;
      const diff = targetY - startY;
      if (Math.abs(diff) < 2) {
        window.scrollTo(0, targetY);
        isStepAnimating = false;
        onDone?.();
        return;
      }
      isStepAnimating = true;
      const startTime = performance.now();
      const easeOutQuint = (x: number): number => 1 - Math.pow(1 - x, 5);

      const animStep = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const eased = easeOutQuint(progress);
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

    let touchStartY = 0;
    let touchStartX = 0;
    let touchStartTime = 0;
    let isTouchActive = false;

    const onTouchStart = (e: TouchEvent) => {
      if (!isMobileRef.current || e.touches.length !== 1) return;
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
      touchStartTime = performance.now();
      isTouchActive = true;

      // Only re-sync step index if the user was outside the sticky deck
      const { top, travel } = rangeMetricsRef.current;
      const currentY = window.scrollY;
      if (currentY >= top + travel - 2) {
        const targets = getMobileStepTargets();
        currentStepIndex = targets.length - 1;
      } else if (currentY <= top + 2) {
        currentStepIndex = 0;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isMobileRef.current || !isTouchActive || e.touches.length !== 1) return;
      const { top, travel } = rangeMetricsRef.current;
      const currentY = window.scrollY;

      // Inside sticky sequence, prevent native browser scrolling from fighting step controller
      if (currentY <= top + travel - 8) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!isMobileRef.current || !isTouchActive) return;
      isTouchActive = false;

      const dy = touchStartY - (e.changedTouches[0]?.clientY ?? touchStartY);
      const touchDuration = performance.now() - touchStartTime;

      // Responsive flick threshold: 16px or quick swipe
      const isFlick = Math.abs(dy) >= 16 || (Math.abs(dy) > 10 && touchDuration < 250);
      if (!isFlick) return;

      const now = performance.now();
      // Allow fluid chained swipes after 160ms
      if (now - lastStepTime < 160) return;

      const targets = getMobileStepTargets();
      if (targets.length === 0) return;
      const { top, travel } = rangeMetricsRef.current;
      const currentY = window.scrollY;

      if (dy > 0) {
        // Swiping UP -> Advance to NEXT step
        if (currentY < top + travel && currentStepIndex < targets.length - 1) {
          currentStepIndex += 1;
          lastStepTime = now;
          const targetT = targets[currentStepIndex];
          const targetY = top + targetT * travel;
          smoothScrollTo(targetY, 360);
        }
      } else if (dy < 0) {
        // Swiping DOWN -> Go to PREVIOUS step
        if (currentY <= top + travel + 20 && currentStepIndex > 0) {
          currentStepIndex -= 1;
          lastStepTime = now;
          const targetT = targets[currentStepIndex];
          const targetY = top + targetT * travel;
          smoothScrollTo(targetY, 360);
        }
      }
    };

    let wheelAccum = 0;
    const onWheel = (e: WheelEvent) => {
      if (!isMobileRef.current) return;
      const { top, travel } = rangeMetricsRef.current;
      const currentY = window.scrollY;
      if (currentY > top + travel + 10) return;

      const now = performance.now();
      if (now - lastStepTime < 200) {
        if (e.cancelable) e.preventDefault();
        return;
      }

      wheelAccum += e.deltaY;
      if (Math.abs(wheelAccum) > 16) {
        if (e.cancelable) e.preventDefault();
        const isDown = wheelAccum > 0;
        wheelAccum = 0;
        const targets = getMobileStepTargets();
        if (targets.length === 0) return;

        if (isDown && currentStepIndex < targets.length - 1) {
          currentStepIndex += 1;
          lastStepTime = now;
          const targetT = targets[currentStepIndex];
          const targetY = top + targetT * travel;
          smoothScrollTo(targetY, 360);
        } else if (!isDown && currentStepIndex > 0) {
          currentStepIndex -= 1;
          lastStepTime = now;
          const targetT = targets[currentStepIndex];
          const targetY = top + targetT * travel;
          smoothScrollTo(targetY, 360);
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
  }, [mounted, isMobile]);

  // =========================================================================
  // MOBILE LAYOUT (<= 900px): 100% NATURAL, STANDARD VERTICAL DOCUMENT FLOW
  // Zero Lenis, zero GSAP scroll scrubbing, zero sticky pinning traps,
  // zero artificial runways, and zero gesture interception.
  // =========================================================================
  if (mounted && isMobile) {
    return (
      <section className="relative isolate w-full bg-[#030509]">
        {/* Anchor point targeting Publications */}
        <div
          id="publications"
          className="absolute left-0 w-full pointer-events-none"
          style={{ top: "45%" }}
          aria-hidden="true"
        />
        {/* Anchor point targeting Services */}
        <div
          id="services"
          className="absolute left-0 w-full pointer-events-none"
          style={{ top: "70%" }}
          aria-hidden="true"
        />

        {/* 1. Mobile Fixed Hero Stage (Fades out smoothly from top, never climbs from bottom) */}
        <div
          ref={mobileHeroBoxRef}
          className="fixed top-0 left-0 w-full h-[100dvh] overflow-hidden bg-[#030509]"
          style={{
            zIndex: 25,
            willChange: "opacity",
          }}
        >
          <BoonHero ref={boonHeroRef} progress={0} />
        </div>

        {/* Natural scroll runway spacer matching the hero descent travel */}
        <div
          className="relative w-full pointer-events-none"
          style={{ height: `${mobileHeroScrollPx}px` }}
          aria-hidden="true"
        />

        {/* 2. Client & Investor Bridge: Building Value appears cleanly from the top under navbar */}
        <div className="relative w-full bg-[#D9D6CE]" style={{ zIndex: 10 }}>
          <ClientInvestorGrowth scrollProgress={0} opacity={1} />
        </div>

        {/* 3. Services Section: 5 Services Cards in standard vertical flow */}
        <div className="relative w-full bg-[#030509]">
          <Journey3D
            progress={{
              current: 0,
              pitch: 0,
              descent: 0,
              cardsProgress: 0,
            }}
            active={false}
          />
        </div>
      </section>
    );
  }

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
          className="sticky top-0 h-screen supports-[height:100dvh]:h-[100dvh] w-full overflow-hidden bg-[#030509] touch-none md:touch-pan-y"
        >
          <div ref={slotRef} className="relative h-full w-full touch-none md:touch-pan-y">
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
