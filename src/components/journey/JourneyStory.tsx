"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { ArrowRight, X, Newspaper, BookOpen, TrendingUp, Globe, Sparkles } from "lucide-react";
import styles from "./Journey2D.module.css";
import magStyles from "@/components/sections/MagazineShowcase/MagazineShowcase.module.css";
import { smoothstep } from "./journeySideView";
import { useJourneyFrame } from "./journeyScroll";
import {
  ShowcaseCardCover,
  EditionCoverCard,
} from "@/components/sections/MagazineShowcase/MagazineShowcase";
import { MagazineSpread } from "@/components/sections/MagazineShowcase/MagazineSpread";
import { getChronologicalMagazines, type MagazineEdition } from "@/data/magazines";

const MILESTONE_ICONS = [TrendingUp, Newspaper, BookOpen, Globe, Sparkles, Sparkles];

export interface RevealCard {
  id: number;
  type: "magazine" | "newsletter" | "placeholder";
}

export const REVEAL_CARDS: RevealCard[] = [
  { id: 1, type: "magazine" },
  { id: 2, type: "newsletter" },
  { id: 3, type: "placeholder" },
  { id: 4, type: "placeholder" },
  { id: 5, type: "placeholder" },
  { id: 6, type: "placeholder" },
  { id: 7, type: "placeholder" },
];

export interface StoryPoint {
  id: string;
  index: number;
  year: string;
  tag: string;
  shortTitle: string;
  eyebrow: string;
  headline: string;
  emphasis: string;
  description: string;
  meta: string;
  image: string;
  badge: string;
  from: number;
  to: number;
}

export const STORY_POINTS: StoryPoint[] = [
  {
    id: "evolution",
    index: 0,
    year: "OUR EVOLUTION",
    tag: "OUR EVOLUTION",
    shortTitle: "From Mining News to Global Influence",
    eyebrow: "OUR EVOLUTION",
    headline: "FROM MINING NEWS TO GLOBAL INFLUENCE",
    emphasis: "EVOLUTION",
    description: "The strategic journey of Mining Discovery from a dedicated digital news outlet into an international full-service media authority.",
    meta: "GLOBAL MEDIA · STRATEGIC REACH · INDUSTRY AUTHORITY",
    image: "/cards/bg_card_1.jpg",
    badge: "ORIGIN",
    from: 0.0,
    to: 0.14,
  },
  {
    id: "2022",
    index: 1,
    year: "2022",
    tag: "2022 · FOUNDATION",
    shortTitle: "Foundation of Mining Media",
    eyebrow: "01 — FOUNDATION · 2022",
    headline: "FOUNDATION OF MINING MEDIA",
    emphasis: "FOUNDATION",
    description: "Mining Discovery launched as a digital mining news platform in Chandigarh, establishing our foothold in trusted resource reporting.",
    meta: "DIGITAL NEWS · INDUSTRY INSIGHTS · CHANDIGARH",
    image: "/cards/bg_card_1.jpg",
    badge: "2022",
    from: 0.14,
    to: 0.28,
  },
  {
    id: "2023",
    index: 2,
    year: "2023",
    tag: "2023 · EXPANSION",
    shortTitle: "Multi-Channel Media Platform",
    eyebrow: "02 — MEDIA EXPANSION · 2023",
    headline: "MULTI-CHANNEL MEDIA PLATFORM",
    emphasis: "PLATFORM",
    description: "Expanded into newsletters, monthly magazines, and an interactive digital platform for global mining stakeholders.",
    meta: "MONTHLY MAGAZINES · NEWSLETTERS · DIGITAL SUITE",
    image: "/cards/bg_card_2.jpg",
    badge: "2023",
    from: 0.28,
    to: 0.44,
  },
  {
    id: "2024",
    index: 3,
    year: "2024",
    tag: "2024 · ENGAGEMENT",
    shortTitle: "Branding & Investor Engagement",
    eyebrow: "03 — INDUSTRY ENGAGEMENT · 2024",
    headline: "BRANDING & INVESTOR ENGAGEMENT",
    emphasis: "ENGAGEMENT",
    description: "Began offering targeted investor campaigns, digital branding, and international conference media coverage.",
    meta: "INVESTOR CAMPAIGNS · CONFERENCES · BRAND STRATEGY",
    image: "/cards/bg_card_3.jpg",
    badge: "2024",
    from: 0.44,
    to: 0.60,
  },
  {
    id: "2025",
    index: 4,
    year: "2025",
    tag: "2025 · FULL-SERVICE",
    shortTitle: "Full-Service Digital Media Agency",
    eyebrow: "04 — FULL-SERVICE EVOLUTION · 2025",
    headline: "FULL-SERVICE DIGITAL AGENCY",
    emphasis: "FULL-SERVICE",
    description: "Operating as a full-service digital media, global syndication, and investor-engagement agency.",
    meta: "FULL-SERVICE AGENCY · GLOBAL REACH · 360° DIGITAL",
    image: "/cards/bg_card_4.jpg",
    badge: "2025",
    from: 0.60,
    to: 0.74,
  },
  {
    id: "future",
    index: 5,
    year: "FUTURE",
    tag: "FUTURE · HORIZON",
    shortTitle: "The Journey Continues",
    eyebrow: "05 — WHAT COMES NEXT · FUTURE",
    headline: "THE JOURNEY CONTINUES",
    emphasis: "JOURNEY",
    description: "Expanding global investor networks, AI-driven mining intelligence, and strategic media operations worldwide.",
    meta: "GLOBAL INVESTOR NETWORKS · AI INTELLIGENCE · STRATEGIC MEDIA",
    image: "/about/open-pit-golden-hour.png",
    badge: "FUTURE",
    from: 0.74,
    to: 0.88,
  },
];

/** Splits a line so one word can carry the accent style. */
function renderLine(line: string, emphasis: string | null): React.ReactNode {
  if (!emphasis || !line.includes(emphasis)) return line;
  const at = line.indexOf(emphasis);
  return (
    <>
      {line.slice(0, at)}
      <em>{emphasis}</em>
      {line.slice(at + emphasis.length)}
    </>
  );
}

export const JourneyStory: React.FC = () => {
  const underRoadRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const secondPartRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const leftSubtextRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);
  const statsTrackRef = useRef<HTMLDivElement>(null);

  const magazineWrapRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const activeIndexRef = useRef(1); // Default to June 2026 Edition 13 (matching reference screenshot)
  const servicesTitleRef = useRef<HTMLDivElement>(null);

  // All 14 magazines and the 5 latest editions
  const allMagazines = useMemo(() => getChronologicalMagazines(false), []);
  const showcaseMagazines = useMemo(() => allMagazines.slice(0, 5), [allMagazines]);

  const [activeIndex, setActiveIndex] = useState(1);
  const [selectedMagazine, setSelectedMagazine] = useState<MagazineEdition | null>(null);
  const [readerState, setReaderState] = useState<"closed" | "opening" | "open" | "closing">("closed");
  const [spreadLabel, setSpreadLabel] = useState("INSIDE OPENING SPREAD • PAGES 2–3");
  const [showAllArchive, setShowAllArchive] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const totalTravelRef = useRef(3200);

  const activeMagazine = selectedMagazine || showcaseMagazines[activeIndex] || showcaseMagazines[0];

  useEffect(() => {
    setIsMounted(true);
    const measure = () => {
      const trackEl = trackRef.current;
      if (!trackEl) return;
      const firstCard = trackEl.firstElementChild as HTMLElement | null;
      const lastCard = trackEl.lastElementChild as HTMLElement | null;
      if (firstCard && lastCard) {
        totalTravelRef.current = Math.max(600, lastCard.offsetLeft - firstCard.offsetLeft);
      }
    };
    measure();
    window.addEventListener("resize", measure, { passive: true });
    const timer = setTimeout(measure, 400);
    return () => {
      window.removeEventListener("resize", measure);
      clearTimeout(timer);
    };
  }, []);

  const handleOpenReader = useCallback((mag: MagazineEdition) => {
    setSelectedMagazine(mag);
    setReaderState("opening");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setReaderState("open");
      });
    });
  }, []);

  const handleCloseReader = useCallback(() => {
    if (readerState === "open" || readerState === "opening") {
      setReaderState("closing");
      setTimeout(() => {
        setReaderState("closed");
        setSelectedMagazine(null);
      }, 350);
    }
  }, [readerState]);

  const handleCardClick = useCallback((idx: number, mag: MagazineEdition) => {
    setActiveIndex(idx);
    activeIndexRef.current = idx;
    handleOpenReader(mag);
  }, [handleOpenReader]);

  // Lock scroll & handle Escape key when reader is active
  useEffect(() => {
    if (readerState === "open" || readerState === "opening") {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          handleCloseReader();
        }
      };
      window.addEventListener("keydown", handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [readerState, handleCloseReader]);

  useJourneyFrame((scene) => {
    const p = scene.progress;

    // 1. Under-road horizontal milestone cards fade out as road turns downward (p >= 0.82 to 0.86)
    if (underRoadRef.current) {
      const underRoadFade = 1 - smoothstep(0.82, 0.86, p);
      underRoadRef.current.style.opacity = underRoadFade.toFixed(3);
      underRoadRef.current.style.pointerEvents = underRoadFade > 0.1 ? "auto" : "none";
      underRoadRef.current.style.transform = `translate3d(0, ${((1 - underRoadFade) * 16).toFixed(1)}px, 0)`;
    }

    // 2. Roadside Milestone Track (horizontal travel)
    if (trackRef.current) {
      const roadProgress = Math.min(1.0, Math.max(0.0, p / 0.82));
      const currentX = -roadProgress * totalTravelRef.current;
      trackRef.current.style.transform = `translate3d(${currentX.toFixed(2)}px, 0, 0)`;
    }

    // 3. Second Part roadside text (vertical highway run):
    // Smooth entrance as road turns downward, stays visible through highway run,
    // and cleanly fades out at p = 0.922 to 0.934 BEFORE the truck doors open
    if (secondPartRef.current) {
      let opacity = 0;
      if (p >= 0.88 && p <= 0.934) {
        const fadeIn = smoothstep(0.88, 0.908, p);
        const fadeOut = 1 - smoothstep(0.922, 0.934, p);
        opacity = fadeIn * fadeOut;

        // Auto-scroll the stats track on the right in lockstep with the truck driving down the road
        if (statsTrackRef.current) {
          const statsProgress = Math.max(0, Math.min(1, (p - 0.90) / 0.024));
          const maxScroll = Math.max(0, statsTrackRef.current.scrollHeight - statsTrackRef.current.clientHeight);
          statsTrackRef.current.scrollTop = statsProgress * maxScroll;
        }
      } else {
        opacity = 0;
      }

      secondPartRef.current.style.opacity = opacity.toFixed(3);
      secondPartRef.current.style.pointerEvents = opacity > 0.5 ? "auto" : "none";
    }

    // 4. ROAD-TO-SCREEN ANIMATED CARD SHOWCASE:
    // Phase 2: Cards tumble out of truck back doors onto the road (p = 0.935 to 0.950).
    // Phase 3: One by one, 7 cards come on screen directly from the fallen cards (p = 0.950 to 0.970).
    // Phase 4: All 7 cards align together across the screen (p = 0.970 to 1.000)!
    if (magazineWrapRef.current) {
      const rowEl = rowRef.current;

      if (p < 0.948) {
        magazineWrapRef.current.style.opacity = "0";
        magazineWrapRef.current.style.pointerEvents = "none";
        magazineWrapRef.current.style.backgroundColor = "transparent";
        magazineWrapRef.current.style.backdropFilter = "none";
        if (servicesTitleRef.current) {
          servicesTitleRef.current.style.opacity = "0";
        }
        if (rowEl) rowEl.style.transform = "scale(1)";
        REVEAL_CARDS.forEach((_, idx) => {
          const el = cardRefs.current[idx];
          if (el) {
            el.style.opacity = "0";
            el.style.pointerEvents = "none";
          }
        });
      } else {
        magazineWrapRef.current.style.opacity = "1";
        magazineWrapRef.current.style.pointerEvents = "auto";

        const winW = typeof window !== "undefined" ? window.innerWidth : 1200;
        const winH = typeof window !== "undefined" ? window.innerHeight : 800;

        // Position of the card emission point on the road behind the truck (right-side offset)
        const startX = winW * 0.52;
        const startY = winH * 0.22;

        const rowRect = rowEl ? rowEl.getBoundingClientRect() : null;

        const isMobile = winW < 768;

        const originX = winW / 2;
        const originY = isMobile ? winH * 0.46 : winH * 0.50;

        // Base coordinate for the right-side queue
        const queueBaseX = originX + (isMobile ? winW * 0.18 : Math.min(winW * 0.20, 260));
        const queueBaseY = originY;

        // Stable slot definitions for the right-side queue (slots 0 to 6)
        const getQueueX = (i: number) => queueBaseX + i * (isMobile ? 18 : 26);
        const getQueueY = (i: number) => queueBaseY + (i - 3) * 5;
        const getQueueRotZ = (i: number) => (i - 2.5) * 1.6;
        const getQueueScale = (i: number) => (isMobile ? 0.68 : 0.76) - i * 0.012;
        const getQueueZIndex = (i: number) => 16 - i;

        // Center slot definition (Slot 0 - Featured Position)
        const centerX = originX;
        const centerY = originY;
        const centerScale = isMobile ? 0.85 : 1.0;

        // 1. Emergence from truck into initial state (Card 1 at center, Cards 2-7 in queue): 0.948 -> 0.952
        const EMERGE_START = 0.948;
        const EMERGE_END = 0.952;

        // 2. Sequential Carousel transitions (6 transitions between adjacent cards): 0.952 -> 1.000
        const CAROUSEL_START = 0.952;
        const CAROUSEL_END = 1.000;
        const TRANSITION_SPAN = (CAROUSEL_END - CAROUSEL_START) / 6;

        let activeTransition = 0;
        let easeT = 0;

        if (p >= CAROUSEL_START) {
          const progressInTransitions = (p - CAROUSEL_START) / TRANSITION_SPAN;
          activeTransition = Math.min(5, Math.max(0, Math.floor(progressInTransitions)));
          const subT = progressInTransitions - activeTransition;
          const MOVE_RATIO = 0.65; // 65% smooth handoff travel, 35% solid center hold

          let rawT = 0;
          if (subT < MOVE_RATIO) {
            rawT = subT / MOVE_RATIO;
          } else {
            rawT = 1.0;
          }
          easeT = rawT * rawT * (3 - 2 * rawT);
        }

        REVEAL_CARDS.forEach((_, idx) => {
          const el = cardRefs.current[idx];
          if (!el) return;

          // Card slot in DOM flow
          const slotX = (rowRect ? rowRect.left : winW * 0.2) + el.offsetLeft + el.offsetWidth / 2;
          const slotY = (rowRect ? rowRect.top : winH * 0.5) + el.offsetTop + el.offsetHeight / 2;

          let curX = getQueueX(idx);
          let curY = getQueueY(idx);
          let curScale = getQueueScale(idx);
          let curRotX = 0;
          let curRotZ = getQueueRotZ(idx);
          let opacity = 0;
          let zIndex = getQueueZIndex(idx);
          let isInteractive = false;

          if (p < EMERGE_START) {
            // Hidden before truck stops
            el.style.opacity = "0";
            el.style.pointerEvents = "none";
            const tx = startX - slotX;
            const ty = startY - slotY;
            el.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) scale(0.05)`;
            return;
          }

          if (p >= EMERGE_START && p < EMERGE_END) {
            // Emerges from truck directly into the initial state:
            // Card 1 (idx 0) emerges to CENTER, Cards 2-7 (idx 1-6) emerge to their right queue slots
            const emergeP = (p - EMERGE_START) / (EMERGE_END - EMERGE_START);
            const easeEmerge = 1 - Math.pow(1 - emergeP, 2.5);

            if (idx === 0) {
              curX = (1 - easeEmerge) * startX + easeEmerge * centerX;
              curY = (1 - easeEmerge) * startY + easeEmerge * centerY;
              curScale = (0.05 + 0.95 * easeEmerge) * centerScale;
              curRotZ = 0;
              curRotX = (1 - easeEmerge) * 16;
              zIndex = 25;
            } else {
              curX = (1 - easeEmerge) * startX + easeEmerge * getQueueX(idx);
              curY = (1 - easeEmerge) * startY + easeEmerge * getQueueY(idx);
              curScale = (0.05 + 0.95 * easeEmerge) * getQueueScale(idx);
              curRotZ = easeEmerge * getQueueRotZ(idx);
              curRotX = (1 - easeEmerge) * 16;
              zIndex = getQueueZIndex(idx);
            }
            opacity = Math.min(1, emergeP * 3.5);
          } else {
            // Carousel State:
            // During transition `k`:
            // - Outgoing card (idx === k) moves from CENTER to queue slot
            // - Incoming card (idx === k + 1) moves from queue slot to CENTER
            // - ALL other 5 cards remain completely stationary in their right queue slots!
            opacity = 1;
            const k = activeTransition;

            if (idx === k) {
              // Outgoing card: CENTER -> its queue slot
              curX = (1 - easeT) * centerX + easeT * getQueueX(k);
              curY = (1 - easeT) * centerY + easeT * getQueueY(k);
              curRotZ = easeT * getQueueRotZ(k);
              curScale = (1 - easeT) * centerScale + easeT * getQueueScale(k);
              curRotX = Math.sin(easeT * Math.PI) * 8;
              zIndex = 22;
              isInteractive = easeT < 0.2;
            } else if (idx === k + 1) {
              // Incoming card: its queue slot -> CENTER
              curX = (1 - easeT) * getQueueX(k + 1) + easeT * centerX;
              curY = (1 - easeT) * getQueueY(k + 1) + easeT * centerY;
              curRotZ = (1 - easeT) * getQueueRotZ(k + 1);
              curScale = (1 - easeT) * getQueueScale(k + 1) + easeT * centerScale;
              curRotX = Math.sin(easeT * Math.PI) * 10;
              zIndex = 25; // Elevated in front
              isInteractive = easeT > 0.8;
            } else {
              // Non-transitioning cards remain completely stationary in their assigned queue slots
              curX = getQueueX(idx);
              curY = getQueueY(idx);
              curRotZ = getQueueRotZ(idx);
              curScale = getQueueScale(idx);
              curRotX = 0;
              zIndex = getQueueZIndex(idx);
            }
          }

          const tx = curX - slotX;
          const ty = curY - slotY;

          el.style.opacity = opacity.toFixed(3);
          el.style.pointerEvents = isInteractive ? "auto" : "none";
          el.style.zIndex = `${zIndex}`;
          el.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) scale(${curScale.toFixed(3)}) rotateX(${curRotX.toFixed(1)}deg) rotateZ(${curRotZ.toFixed(1)}deg)`;
        });

        // Phase 4: Display all five cards at once on screen without overzooming!
        if (p >= 0.970) {
          const focusProgress = smoothstep(0.970, 0.995, p);
          if (rowEl) {
            rowEl.style.transform = "scale(1)";
          }
          // Deepen background to dark cinematic backdrop with backdrop blur
          const bgAlpha = (focusProgress * 0.85).toFixed(3);
          magazineWrapRef.current.style.backgroundColor = `rgba(6, 10, 18, ${bgAlpha})`;
          const blurPx = (focusProgress * 12).toFixed(1);
          magazineWrapRef.current.style.backdropFilter = focusProgress > 0.02 ? `blur(${blurPx}px)` : "none";
        } else {
          if (rowEl) {
            rowEl.style.transform = "scale(1)";
          }
          magazineWrapRef.current.style.backgroundColor = "transparent";
          magazineWrapRef.current.style.backdropFilter = "none";
        }

        // Animate OUR SERVICES background text behind cards
        if (servicesTitleRef.current) {
          if (p < 0.960) {
            servicesTitleRef.current.style.opacity = "0";
          } else {
            const titleP = smoothstep(0.960, 0.988, p);
            const titleY = (1 - titleP) * 16;
            const titleScale = 0.97 + titleP * 0.03;
            servicesTitleRef.current.style.opacity = (titleP * 0.24).toFixed(3);
            servicesTitleRef.current.style.transform = `translate3d(-50%, calc(-50% + ${titleY.toFixed(1)}px), 0) scale(${titleScale.toFixed(3)})`;
          }
        }
      }
    }
  });

  return (
    <div className={styles.overlay}>
      {/* BLACK PART: ROADSIDE MILESTONE TRACK
          Text cards enter from the right side of the screen and travel across
          to the left side as the truck moves forward along the road */}
      <div ref={underRoadRef} className={styles.underRoadSection} aria-live="polite">
        <div ref={trackRef} className={styles.roadTextTrack}>
          {STORY_POINTS.map((point, index) => {
            const Icon = MILESTONE_ICONS[index] || Globe;
            return (
              <div
                key={point.id}
                className={styles.roadCard}
              >
                <div className={styles.milestoneIconRow}>
                  <Icon className={styles.milestoneIcon} strokeWidth={1.5} />
                  <span className={styles.milestoneTag}>{point.eyebrow}</span>
                </div>
                <h3 className={styles.milestoneHeadline}>
                  {point.headline}
                </h3>
                <div className={styles.milestoneBar} />
                <p className={styles.milestoneDescription}>{point.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECOND PART (VERTICAL ROAD HERO): MINING DISCOVERY EDITORIAL & STATS */}
      <div
        ref={secondPartRef}
        className={styles.secondPartSidesWrap}
        aria-label="One platform. Every major mining audience."
      >
        {/* Left Side: Big Heading (Matching user picture) */}
        <div ref={leftColRef} className={styles.secondPartLeftSide}>
          <h2 className={styles.secondPartBigHeadline}>
            &ldquo;One platform. Every major mining audience.&rdquo;
          </h2>
        </div>

        {/* Left Side: Subtext Little Down (Bottom-Left) */}
        <div ref={leftSubtextRef} className={styles.secondPartLeftBottom}>
          <p className={styles.secondPartDescription}>
            Mining Discovery bridges the gap between mining companies and the global investment community through targeted editorial coverage and market intelligence. Connecting global mining companies directly with institutional investors, analysts, and executive decision-makers.
          </p>
        </div>

        {/* Right Side: Main Data with Signs (matching Pic 1 reference) */}
        <div ref={rightColRef} className={styles.secondPartRightSide}>
          <div ref={statsTrackRef} className={styles.statsScrollTrack}>
            {/* Point 1: 150,000+ Active Monthly Audience */}
            <div className={styles.statEditorialItem}>
              {/* Sign 1: Audience & Executive Investor Profile */}
              <div className={styles.statSignWrap} aria-hidden="true">
                <svg className={styles.statItemSign} viewBox="0 0 48 48" fill="none">
                  {/* Subtle matrix lattice background */}
                  <g opacity="0.18" fill="#0b1f3a">
                    <circle cx="4" cy="4" r="0.85" /><circle cx="8" cy="4" r="0.85" /><circle cx="12" cy="4" r="0.85" /><circle cx="16" cy="4" r="0.85" /><circle cx="20" cy="4" r="0.85" /><circle cx="24" cy="4" r="0.85" /><circle cx="28" cy="4" r="0.85" /><circle cx="32" cy="4" r="0.85" /><circle cx="36" cy="4" r="0.85" /><circle cx="40" cy="4" r="0.85" /><circle cx="44" cy="4" r="0.85" />
                    <circle cx="4" cy="8" r="0.85" /><circle cx="8" cy="8" r="0.85" /><circle cx="12" cy="8" r="0.85" /><circle cx="16" cy="8" r="0.85" /><circle cx="20" cy="8" r="0.85" /><circle cx="24" cy="8" r="0.85" /><circle cx="28" cy="8" r="0.85" /><circle cx="32" cy="8" r="0.85" /><circle cx="36" cy="8" r="0.85" /><circle cx="40" cy="8" r="0.85" /><circle cx="44" cy="8" r="0.85" />
                    <circle cx="4" cy="12" r="0.85" /><circle cx="8" cy="12" r="0.85" /><circle cx="12" cy="12" r="0.85" /><circle cx="16" cy="12" r="0.85" /><circle cx="20" cy="12" r="0.85" /><circle cx="24" cy="12" r="0.85" /><circle cx="28" cy="12" r="0.85" /><circle cx="32" cy="12" r="0.85" /><circle cx="36" cy="12" r="0.85" /><circle cx="40" cy="12" r="0.85" /><circle cx="44" cy="12" r="0.85" />
                    <circle cx="4" cy="16" r="0.85" /><circle cx="8" cy="16" r="0.85" /><circle cx="12" cy="16" r="0.85" /><circle cx="16" cy="16" r="0.85" /><circle cx="20" cy="16" r="0.85" /><circle cx="24" cy="16" r="0.85" /><circle cx="28" cy="16" r="0.85" /><circle cx="32" cy="16" r="0.85" /><circle cx="36" cy="16" r="0.85" /><circle cx="40" cy="16" r="0.85" /><circle cx="44" cy="16" r="0.85" />
                    <circle cx="4" cy="20" r="0.85" /><circle cx="8" cy="20" r="0.85" /><circle cx="12" cy="20" r="0.85" /><circle cx="16" cy="20" r="0.85" /><circle cx="20" cy="20" r="0.85" /><circle cx="24" cy="20" r="0.85" /><circle cx="28" cy="20" r="0.85" /><circle cx="32" cy="20" r="0.85" /><circle cx="36" cy="20" r="0.85" /><circle cx="40" cy="20" r="0.85" /><circle cx="44" cy="20" r="0.85" />
                    <circle cx="4" cy="24" r="0.85" /><circle cx="8" cy="24" r="0.85" /><circle cx="12" cy="24" r="0.85" /><circle cx="16" cy="24" r="0.85" /><circle cx="20" cy="24" r="0.85" /><circle cx="24" cy="24" r="0.85" /><circle cx="28" cy="24" r="0.85" /><circle cx="32" cy="24" r="0.85" /><circle cx="36" cy="24" r="0.85" /><circle cx="40" cy="24" r="0.85" /><circle cx="44" cy="24" r="0.85" />
                    <circle cx="4" cy="28" r="0.85" /><circle cx="8" cy="28" r="0.85" /><circle cx="12" cy="28" r="0.85" /><circle cx="16" cy="28" r="0.85" /><circle cx="20" cy="28" r="0.85" /><circle cx="24" cy="28" r="0.85" /><circle cx="28" cy="28" r="0.85" /><circle cx="32" cy="28" r="0.85" /><circle cx="36" cy="28" r="0.85" /><circle cx="40" cy="28" r="0.85" /><circle cx="44" cy="28" r="0.85" />
                    <circle cx="4" cy="32" r="0.85" /><circle cx="8" cy="32" r="0.85" /><circle cx="12" cy="32" r="0.85" /><circle cx="16" cy="32" r="0.85" /><circle cx="20" cy="32" r="0.85" /><circle cx="24" cy="32" r="0.85" /><circle cx="28" cy="32" r="0.85" /><circle cx="32" cy="32" r="0.85" /><circle cx="36" cy="32" r="0.85" /><circle cx="40" cy="32" r="0.85" /><circle cx="44" cy="32" r="0.85" />
                    <circle cx="4" cy="36" r="0.85" /><circle cx="8" cy="36" r="0.85" /><circle cx="12" cy="36" r="0.85" /><circle cx="16" cy="36" r="0.85" /><circle cx="20" cy="36" r="0.85" /><circle cx="24" cy="36" r="0.85" /><circle cx="28" cy="36" r="0.85" /><circle cx="32" cy="36" r="0.85" /><circle cx="36" cy="36" r="0.85" /><circle cx="40" cy="36" r="0.85" /><circle cx="44" cy="36" r="0.85" />
                    <circle cx="4" cy="40" r="0.85" /><circle cx="8" cy="40" r="0.85" /><circle cx="12" cy="40" r="0.85" /><circle cx="16" cy="40" r="0.85" /><circle cx="20" cy="40" r="0.85" /><circle cx="24" cy="40" r="0.85" /><circle cx="28" cy="40" r="0.85" /><circle cx="32" cy="40" r="0.85" /><circle cx="36" cy="40" r="0.85" /><circle cx="40" cy="40" r="0.85" /><circle cx="44" cy="40" r="0.85" />
                    <circle cx="4" cy="44" r="0.85" /><circle cx="8" cy="44" r="0.85" /><circle cx="12" cy="44" r="0.85" /><circle cx="16" cy="44" r="0.85" /><circle cx="20" cy="44" r="0.85" /><circle cx="24" cy="44" r="0.85" /><circle cx="28" cy="44" r="0.85" /><circle cx="32" cy="44" r="0.85" /><circle cx="36" cy="44" r="0.85" /><circle cx="40" cy="44" r="0.85" /><circle cx="44" cy="44" r="0.85" />
                  </g>
                  {/* Dark Audience / Executive Investor Profile dots */}
                  <g fill="#0b1f3a">
                    {/* Head */}
                    <circle cx="24" cy="6" r="2.1" />
                    <circle cx="20" cy="9" r="2.0" /><circle cx="24" cy="9" r="2.1" /><circle cx="28" cy="9" r="2.0" />
                    <circle cx="18" cy="13" r="2.0" /><circle cx="22" cy="13" r="2.0" /><circle cx="26" cy="13" r="2.0" /><circle cx="30" cy="13" r="2.0" />
                    <circle cx="20" cy="17" r="2.0" /><circle cx="24" cy="17" r="2.1" /><circle cx="28" cy="17" r="2.0" />
                    <circle cx="24" cy="20" r="2.1" />
                    {/* Shoulders & Mantle */}
                    <circle cx="20" cy="24" r="2.0" /><circle cx="24" cy="24" r="2.1" /><circle cx="28" cy="24" r="2.0" />
                    <circle cx="15" cy="27" r="2.0" /><circle cx="33" cy="27" r="2.0" />
                    <circle cx="11" cy="31" r="2.0" /><circle cx="37" cy="31" r="2.0" />
                    <circle cx="8" cy="36" r="2.0" /><circle cx="40" cy="36" r="2.0" />
                    {/* Base */}
                    <circle cx="8" cy="40" r="1.8" /><circle cx="12" cy="40" r="1.8" /><circle cx="16" cy="40" r="1.8" /><circle cx="20" cy="40" r="1.8" />
                    <circle cx="24" cy="40" r="1.8" /><circle cx="28" cy="40" r="1.8" /><circle cx="32" cy="40" r="1.8" /><circle cx="36" cy="40" r="1.8" /><circle cx="40" cy="40" r="1.8" />
                  </g>
                </svg>
              </div>
              <div className={styles.secondPartStatValue}>150,000+</div>
              <div className={styles.secondPartStatLabel}>ACTIVE MONTHLY AUDIENCE</div>
              <p className={styles.secondPartStatDesc}>
                Institutional investors, mining executives, and industry analysts reading market updates.
              </p>
            </div>

            {/* Point 2: 40,000+ Newsletter Subscribers */}
            <div className={styles.statEditorialItem}>
              {/* Sign 2: Newsletter Mail Envelope */}
              <div className={styles.statSignWrap} aria-hidden="true">
                <svg className={styles.statItemSign} viewBox="0 0 48 48" fill="none">
                  {/* Subtle matrix lattice background */}
                  <g opacity="0.18" fill="#0b1f3a">
                    <circle cx="4" cy="4" r="0.85" /><circle cx="8" cy="4" r="0.85" /><circle cx="12" cy="4" r="0.85" /><circle cx="16" cy="4" r="0.85" /><circle cx="20" cy="4" r="0.85" /><circle cx="24" cy="4" r="0.85" /><circle cx="28" cy="4" r="0.85" /><circle cx="32" cy="4" r="0.85" /><circle cx="36" cy="4" r="0.85" /><circle cx="40" cy="4" r="0.85" /><circle cx="44" cy="4" r="0.85" />
                    <circle cx="4" cy="8" r="0.85" /><circle cx="8" cy="8" r="0.85" /><circle cx="12" cy="8" r="0.85" /><circle cx="16" cy="8" r="0.85" /><circle cx="20" cy="8" r="0.85" /><circle cx="24" cy="8" r="0.85" /><circle cx="28" cy="8" r="0.85" /><circle cx="32" cy="8" r="0.85" /><circle cx="36" cy="8" r="0.85" /><circle cx="40" cy="8" r="0.85" /><circle cx="44" cy="8" r="0.85" />
                    <circle cx="4" cy="12" r="0.85" /><circle cx="8" cy="12" r="0.85" /><circle cx="12" cy="12" r="0.85" /><circle cx="16" cy="12" r="0.85" /><circle cx="20" cy="12" r="0.85" /><circle cx="24" cy="12" r="0.85" /><circle cx="28" cy="12" r="0.85" /><circle cx="32" cy="12" r="0.85" /><circle cx="36" cy="12" r="0.85" /><circle cx="40" cy="12" r="0.85" /><circle cx="44" cy="12" r="0.85" />
                    <circle cx="4" cy="16" r="0.85" /><circle cx="8" cy="16" r="0.85" /><circle cx="12" cy="16" r="0.85" /><circle cx="16" cy="16" r="0.85" /><circle cx="20" cy="16" r="0.85" /><circle cx="24" cy="16" r="0.85" /><circle cx="28" cy="16" r="0.85" /><circle cx="32" cy="16" r="0.85" /><circle cx="36" cy="16" r="0.85" /><circle cx="40" cy="16" r="0.85" /><circle cx="44" cy="16" r="0.85" />
                    <circle cx="4" cy="20" r="0.85" /><circle cx="8" cy="20" r="0.85" /><circle cx="12" cy="20" r="0.85" /><circle cx="16" cy="20" r="0.85" /><circle cx="20" cy="20" r="0.85" /><circle cx="24" cy="20" r="0.85" /><circle cx="28" cy="20" r="0.85" /><circle cx="32" cy="20" r="0.85" /><circle cx="36" cy="20" r="0.85" /><circle cx="40" cy="20" r="0.85" /><circle cx="44" cy="20" r="0.85" />
                    <circle cx="4" cy="24" r="0.85" /><circle cx="8" cy="24" r="0.85" /><circle cx="12" cy="24" r="0.85" /><circle cx="16" cy="24" r="0.85" /><circle cx="20" cy="24" r="0.85" /><circle cx="24" cy="24" r="0.85" /><circle cx="28" cy="24" r="0.85" /><circle cx="32" cy="24" r="0.85" /><circle cx="36" cy="24" r="0.85" /><circle cx="40" cy="24" r="0.85" /><circle cx="44" cy="24" r="0.85" />
                    <circle cx="4" cy="28" r="0.85" /><circle cx="8" cy="28" r="0.85" /><circle cx="12" cy="28" r="0.85" /><circle cx="16" cy="28" r="0.85" /><circle cx="20" cy="28" r="0.85" /><circle cx="24" cy="28" r="0.85" /><circle cx="28" cy="28" r="0.85" /><circle cx="32" cy="28" r="0.85" /><circle cx="36" cy="28" r="0.85" /><circle cx="40" cy="28" r="0.85" /><circle cx="44" cy="28" r="0.85" />
                    <circle cx="4" cy="32" r="0.85" /><circle cx="8" cy="32" r="0.85" /><circle cx="12" cy="32" r="0.85" /><circle cx="16" cy="32" r="0.85" /><circle cx="20" cy="32" r="0.85" /><circle cx="24" cy="32" r="0.85" /><circle cx="28" cy="32" r="0.85" /><circle cx="32" cy="32" r="0.85" /><circle cx="36" cy="32" r="0.85" /><circle cx="40" cy="32" r="0.85" /><circle cx="44" cy="32" r="0.85" />
                    <circle cx="4" cy="36" r="0.85" /><circle cx="8" cy="36" r="0.85" /><circle cx="12" cy="36" r="0.85" /><circle cx="16" cy="36" r="0.85" /><circle cx="20" cy="36" r="0.85" /><circle cx="24" cy="36" r="0.85" /><circle cx="28" cy="36" r="0.85" /><circle cx="32" cy="36" r="0.85" /><circle cx="36" cy="36" r="0.85" /><circle cx="40" cy="36" r="0.85" /><circle cx="44" cy="36" r="0.85" />
                    <circle cx="4" cy="40" r="0.85" /><circle cx="8" cy="40" r="0.85" /><circle cx="12" cy="40" r="0.85" /><circle cx="16" cy="40" r="0.85" /><circle cx="20" cy="40" r="0.85" /><circle cx="24" cy="40" r="0.85" /><circle cx="28" cy="40" r="0.85" /><circle cx="32" cy="40" r="0.85" /><circle cx="36" cy="40" r="0.85" /><circle cx="40" cy="40" r="0.85" /><circle cx="44" cy="40" r="0.85" />
                    <circle cx="4" cy="44" r="0.85" /><circle cx="8" cy="44" r="0.85" /><circle cx="12" cy="44" r="0.85" /><circle cx="16" cy="44" r="0.85" /><circle cx="20" cy="44" r="0.85" /><circle cx="24" cy="44" r="0.85" /><circle cx="28" cy="44" r="0.85" /><circle cx="32" cy="44" r="0.85" /><circle cx="36" cy="44" r="0.85" /><circle cx="40" cy="44" r="0.85" /><circle cx="44" cy="44" r="0.85" />
                  </g>
                  {/* Dark Newsletter Mail Envelope dots */}
                  <g fill="#0b1f3a">
                    {/* Envelope Rectangle */}
                    <circle cx="8" cy="12" r="2.0" /><circle cx="12" cy="12" r="2.0" /><circle cx="16" cy="12" r="2.0" /><circle cx="20" cy="12" r="2.0" /><circle cx="24" cy="12" r="2.0" /><circle cx="28" cy="12" r="2.0" /><circle cx="32" cy="12" r="2.0" /><circle cx="36" cy="12" r="2.0" /><circle cx="40" cy="12" r="2.0" />
                    <circle cx="8" cy="16" r="2.0" /><circle cx="8" cy="20" r="2.0" /><circle cx="8" cy="24" r="2.0" /><circle cx="8" cy="28" r="2.0" /><circle cx="8" cy="32" r="2.0" />
                    <circle cx="40" cy="16" r="2.0" /><circle cx="40" cy="20" r="2.0" /><circle cx="40" cy="24" r="2.0" /><circle cx="40" cy="28" r="2.0" /><circle cx="40" cy="32" r="2.0" />
                    <circle cx="8" cy="36" r="2.0" /><circle cx="12" cy="36" r="2.0" /><circle cx="16" cy="36" r="2.0" /><circle cx="20" cy="36" r="2.0" /><circle cx="24" cy="36" r="2.0" /><circle cx="28" cy="36" r="2.0" /><circle cx="32" cy="36" r="2.0" /><circle cx="36" cy="36" r="2.0" /><circle cx="40" cy="36" r="2.0" />
                    {/* Flap V fold */}
                    <circle cx="12" cy="16" r="2.0" /><circle cx="36" cy="16" r="2.0" />
                    <circle cx="16" cy="20" r="2.0" /><circle cx="32" cy="20" r="2.0" />
                    <circle cx="20" cy="24" r="2.0" /><circle cx="28" cy="24" r="2.0" />
                    <circle cx="24" cy="28" r="2.2" />
                    {/* Inner bottom folds */}
                    <circle cx="12" cy="32" r="1.8" /><circle cx="36" cy="32" r="1.8" />
                    <circle cx="16" cy="28" r="1.8" /><circle cx="32" cy="28" r="1.8" />
                  </g>
                </svg>
              </div>
              <div className={styles.secondPartStatValue}>40,000+</div>
              <div className={styles.secondPartStatLabel}>NEWSLETTER SUBSCRIBERS</div>
              <p className={styles.secondPartStatDesc}>
                Weekly executive briefing delivered directly to decision-maker inboxes worldwide.
              </p>
            </div>

            {/* Point 3: 450+ Mining Companies Featured */}
            <div className={styles.statEditorialItem}>
              {/* Sign 3: Mining Industry Crossed Pickaxes */}
              <div className={styles.statSignWrap} aria-hidden="true">
                <svg className={styles.statItemSign} viewBox="0 0 48 48" fill="none">
                  {/* Subtle matrix lattice background */}
                  <g opacity="0.18" fill="#0b1f3a">
                    <circle cx="4" cy="4" r="0.85" /><circle cx="8" cy="4" r="0.85" /><circle cx="12" cy="4" r="0.85" /><circle cx="16" cy="4" r="0.85" /><circle cx="20" cy="4" r="0.85" /><circle cx="24" cy="4" r="0.85" /><circle cx="28" cy="4" r="0.85" /><circle cx="32" cy="4" r="0.85" /><circle cx="36" cy="4" r="0.85" /><circle cx="40" cy="4" r="0.85" /><circle cx="44" cy="4" r="0.85" />
                    <circle cx="4" cy="8" r="0.85" /><circle cx="8" cy="8" r="0.85" /><circle cx="12" cy="8" r="0.85" /><circle cx="16" cy="8" r="0.85" /><circle cx="20" cy="8" r="0.85" /><circle cx="24" cy="8" r="0.85" /><circle cx="28" cy="8" r="0.85" /><circle cx="32" cy="8" r="0.85" /><circle cx="36" cy="8" r="0.85" /><circle cx="40" cy="8" r="0.85" /><circle cx="44" cy="8" r="0.85" />
                    <circle cx="4" cy="12" r="0.85" /><circle cx="8" cy="12" r="0.85" /><circle cx="12" cy="12" r="0.85" /><circle cx="16" cy="12" r="0.85" /><circle cx="20" cy="12" r="0.85" /><circle cx="24" cy="12" r="0.85" /><circle cx="28" cy="12" r="0.85" /><circle cx="32" cy="12" r="0.85" /><circle cx="36" cy="12" r="0.85" /><circle cx="40" cy="12" r="0.85" /><circle cx="44" cy="12" r="0.85" />
                    <circle cx="4" cy="16" r="0.85" /><circle cx="8" cy="16" r="0.85" /><circle cx="12" cy="16" r="0.85" /><circle cx="16" cy="16" r="0.85" /><circle cx="20" cy="16" r="0.85" /><circle cx="24" cy="16" r="0.85" /><circle cx="28" cy="16" r="0.85" /><circle cx="32" cy="16" r="0.85" /><circle cx="36" cy="16" r="0.85" /><circle cx="40" cy="16" r="0.85" /><circle cx="44" cy="16" r="0.85" />
                    <circle cx="4" cy="20" r="0.85" /><circle cx="8" cy="20" r="0.85" /><circle cx="12" cy="20" r="0.85" /><circle cx="16" cy="20" r="0.85" /><circle cx="20" cy="20" r="0.85" /><circle cx="24" cy="20" r="0.85" /><circle cx="28" cy="20" r="0.85" /><circle cx="32" cy="20" r="0.85" /><circle cx="36" cy="20" r="0.85" /><circle cx="40" cy="20" r="0.85" /><circle cx="44" cy="20" r="0.85" />
                    <circle cx="4" cy="24" r="0.85" /><circle cx="8" cy="24" r="0.85" /><circle cx="12" cy="24" r="0.85" /><circle cx="16" cy="24" r="0.85" /><circle cx="20" cy="24" r="0.85" /><circle cx="24" cy="24" r="0.85" /><circle cx="28" cy="24" r="0.85" /><circle cx="32" cy="24" r="0.85" /><circle cx="36" cy="24" r="0.85" /><circle cx="40" cy="24" r="0.85" /><circle cx="44" cy="24" r="0.85" />
                    <circle cx="4" cy="28" r="0.85" /><circle cx="8" cy="28" r="0.85" /><circle cx="12" cy="28" r="0.85" /><circle cx="16" cy="28" r="0.85" /><circle cx="20" cy="28" r="0.85" /><circle cx="24" cy="28" r="0.85" /><circle cx="28" cy="28" r="0.85" /><circle cx="32" cy="28" r="0.85" /><circle cx="36" cy="28" r="0.85" /><circle cx="40" cy="28" r="0.85" /><circle cx="44" cy="28" r="0.85" />
                    <circle cx="4" cy="32" r="0.85" /><circle cx="8" cy="32" r="0.85" /><circle cx="12" cy="32" r="0.85" /><circle cx="16" cy="32" r="0.85" /><circle cx="20" cy="32" r="0.85" /><circle cx="24" cy="32" r="0.85" /><circle cx="28" cy="32" r="0.85" /><circle cx="32" cy="32" r="0.85" /><circle cx="36" cy="32" r="0.85" /><circle cx="40" cy="32" r="0.85" /><circle cx="44" cy="32" r="0.85" />
                    <circle cx="4" cy="36" r="0.85" /><circle cx="8" cy="36" r="0.85" /><circle cx="12" cy="36" r="0.85" /><circle cx="16" cy="36" r="0.85" /><circle cx="20" cy="36" r="0.85" /><circle cx="24" cy="36" r="0.85" /><circle cx="28" cy="36" r="0.85" /><circle cx="32" cy="36" r="0.85" /><circle cx="36" cy="36" r="0.85" /><circle cx="40" cy="36" r="0.85" /><circle cx="44" cy="36" r="0.85" />
                    <circle cx="4" cy="40" r="0.85" /><circle cx="8" cy="40" r="0.85" /><circle cx="12" cy="40" r="0.85" /><circle cx="16" cy="40" r="0.85" /><circle cx="20" cy="40" r="0.85" /><circle cx="24" cy="40" r="0.85" /><circle cx="28" cy="40" r="0.85" /><circle cx="32" cy="40" r="0.85" /><circle cx="36" cy="40" r="0.85" /><circle cx="40" cy="40" r="0.85" /><circle cx="44" cy="40" r="0.85" />
                    <circle cx="4" cy="44" r="0.85" /><circle cx="8" cy="44" r="0.85" /><circle cx="12" cy="44" r="0.85" /><circle cx="16" cy="44" r="0.85" /><circle cx="20" cy="44" r="0.85" /><circle cx="24" cy="44" r="0.85" /><circle cx="28" cy="44" r="0.85" /><circle cx="32" cy="44" r="0.85" /><circle cx="36" cy="44" r="0.85" /><circle cx="40" cy="44" r="0.85" /><circle cx="44" cy="44" r="0.85" />
                  </g>
                  {/* Dark Mining Crossed Pickaxes (⚒) dots */}
                  <g fill="#0b1f3a">
                    {/* Center crossing point */}
                    <circle cx="24" cy="22" r="2.1" /><circle cx="24" cy="26" r="2.1" />
                    {/* Handle A (slanted / ) */}
                    <circle cx="8" cy="42" r="1.9" /><circle cx="12" cy="38" r="1.9" /><circle cx="16" cy="34" r="1.9" /><circle cx="20" cy="30" r="1.9" /><circle cx="28" cy="18" r="1.9" /><circle cx="32" cy="14" r="1.9" /><circle cx="36" cy="10" r="2.0" />
                    {/* Handle B (slanted \ ) */}
                    <circle cx="40" cy="42" r="1.9" /><circle cx="36" cy="38" r="1.9" /><circle cx="32" cy="34" r="1.9" /><circle cx="28" cy="30" r="1.9" /><circle cx="20" cy="18" r="1.9" /><circle cx="16" cy="14" r="1.9" /><circle cx="12" cy="10" r="2.0" />
                    {/* Pick Head A (top-right curved pick head) */}
                    <circle cx="28" cy="6" r="2.0" /><circle cx="32" cy="5" r="2.0" /><circle cx="36" cy="6" r="2.1" /><circle cx="40" cy="8" r="2.0" /><circle cx="43" cy="12" r="2.0" /><circle cx="44" cy="17" r="1.9" /><circle cx="41" cy="14" r="1.9" />
                    {/* Pick Head B (top-left curved pick head) */}
                    <circle cx="20" cy="6" r="2.0" /><circle cx="16" cy="5" r="2.0" /><circle cx="12" cy="6" r="2.1" /><circle cx="8" cy="8" r="2.0" /><circle cx="5" cy="12" r="2.0" /><circle cx="4" cy="17" r="1.9" /><circle cx="7" cy="14" r="1.9" />
                  </g>
                </svg>
              </div>
              <div className={styles.secondPartStatValue}>450+</div>
              <div className={styles.secondPartStatLabel}>MINING COMPANIES FEATURED</div>
              <p className={styles.secondPartStatDesc}>
                From junior exploration companies to Tier-1 global mining producers.
              </p>
            </div>

            {/* Point 4: 8+ Years Industry Coverage */}
            <div className={styles.statEditorialItem}>
              {/* Sign 4: Industry Coverage Calendar & Timeline */}
              <div className={styles.statSignWrap} aria-hidden="true">
                <svg className={styles.statItemSign} viewBox="0 0 48 48" fill="none">
                  {/* Matrix lattice background */}
                  <g opacity="0.18" fill="#0b1f3a">
                    <circle cx="4" cy="4" r="0.85" /><circle cx="8" cy="4" r="0.85" /><circle cx="12" cy="4" r="0.85" /><circle cx="16" cy="4" r="0.85" /><circle cx="20" cy="4" r="0.85" /><circle cx="24" cy="4" r="0.85" /><circle cx="28" cy="4" r="0.85" /><circle cx="32" cy="4" r="0.85" /><circle cx="36" cy="4" r="0.85" /><circle cx="40" cy="4" r="0.85" /><circle cx="44" cy="4" r="0.85" />
                    <circle cx="4" cy="8" r="0.85" /><circle cx="8" cy="8" r="0.85" /><circle cx="12" cy="8" r="0.85" /><circle cx="16" cy="8" r="0.85" /><circle cx="20" cy="8" r="0.85" /><circle cx="24" cy="8" r="0.85" /><circle cx="28" cy="8" r="0.85" /><circle cx="32" cy="8" r="0.85" /><circle cx="36" cy="8" r="0.85" /><circle cx="40" cy="8" r="0.85" /><circle cx="44" cy="8" r="0.85" />
                    <circle cx="4" cy="12" r="0.85" /><circle cx="8" cy="12" r="0.85" /><circle cx="12" cy="12" r="0.85" /><circle cx="16" cy="12" r="0.85" /><circle cx="20" cy="12" r="0.85" /><circle cx="24" cy="12" r="0.85" /><circle cx="28" cy="12" r="0.85" /><circle cx="32" cy="12" r="0.85" /><circle cx="36" cy="12" r="0.85" /><circle cx="40" cy="12" r="0.85" /><circle cx="44" cy="12" r="0.85" />
                    <circle cx="4" cy="16" r="0.85" /><circle cx="8" cy="16" r="0.85" /><circle cx="12" cy="16" r="0.85" /><circle cx="16" cy="16" r="0.85" /><circle cx="20" cy="16" r="0.85" /><circle cx="24" cy="16" r="0.85" /><circle cx="28" cy="16" r="0.85" /><circle cx="32" cy="16" r="0.85" /><circle cx="36" cy="16" r="0.85" /><circle cx="40" cy="16" r="0.85" /><circle cx="44" cy="16" r="0.85" />
                    <circle cx="4" cy="20" r="0.85" /><circle cx="8" cy="20" r="0.85" /><circle cx="12" cy="20" r="0.85" /><circle cx="16" cy="20" r="0.85" /><circle cx="20" cy="20" r="0.85" /><circle cx="24" cy="20" r="0.85" /><circle cx="28" cy="20" r="0.85" /><circle cx="32" cy="20" r="0.85" /><circle cx="36" cy="20" r="0.85" /><circle cx="40" cy="20" r="0.85" /><circle cx="44" cy="20" r="0.85" />
                    <circle cx="4" cy="24" r="0.85" /><circle cx="8" cy="24" r="0.85" /><circle cx="12" cy="24" r="0.85" /><circle cx="16" cy="24" r="0.85" /><circle cx="20" cy="24" r="0.85" /><circle cx="24" cy="24" r="0.85" /><circle cx="28" cy="24" r="0.85" /><circle cx="32" cy="24" r="0.85" /><circle cx="36" cy="24" r="0.85" /><circle cx="40" cy="24" r="0.85" /><circle cx="44" cy="24" r="0.85" />
                    <circle cx="4" cy="28" r="0.85" /><circle cx="8" cy="28" r="0.85" /><circle cx="12" cy="28" r="0.85" /><circle cx="16" cy="28" r="0.85" /><circle cx="20" cy="28" r="0.85" /><circle cx="24" cy="28" r="0.85" /><circle cx="28" cy="28" r="0.85" /><circle cx="32" cy="28" r="0.85" /><circle cx="36" cy="28" r="0.85" /><circle cx="40" cy="28" r="0.85" /><circle cx="44" cy="28" r="0.85" />
                    <circle cx="4" cy="32" r="0.85" /><circle cx="8" cy="32" r="0.85" /><circle cx="12" cy="32" r="0.85" /><circle cx="16" cy="32" r="0.85" /><circle cx="20" cy="32" r="0.85" /><circle cx="24" cy="32" r="0.85" /><circle cx="28" cy="32" r="0.85" /><circle cx="32" cy="32" r="0.85" /><circle cx="36" cy="32" r="0.85" /><circle cx="40" cy="32" r="0.85" /><circle cx="44" cy="32" r="0.85" />
                    <circle cx="4" cy="36" r="0.85" /><circle cx="8" cy="36" r="0.85" /><circle cx="12" cy="36" r="0.85" /><circle cx="16" cy="36" r="0.85" /><circle cx="20" cy="36" r="0.85" /><circle cx="24" cy="36" r="0.85" /><circle cx="28" cy="36" r="0.85" /><circle cx="32" cy="36" r="0.85" /><circle cx="36" cy="36" r="0.85" /><circle cx="40" cy="36" r="0.85" /><circle cx="44" cy="36" r="0.85" />
                    <circle cx="4" cy="40" r="0.85" /><circle cx="8" cy="40" r="0.85" /><circle cx="12" cy="40" r="0.85" /><circle cx="16" cy="40" r="0.85" /><circle cx="20" cy="40" r="0.85" /><circle cx="24" cy="40" r="0.85" /><circle cx="28" cy="40" r="0.85" /><circle cx="32" cy="40" r="0.85" /><circle cx="36" cy="40" r="0.85" /><circle cx="40" cy="40" r="0.85" /><circle cx="44" cy="40" r="0.85" />
                    <circle cx="4" cy="44" r="0.85" /><circle cx="8" cy="44" r="0.85" /><circle cx="12" cy="44" r="0.85" /><circle cx="16" cy="44" r="0.85" /><circle cx="20" cy="44" r="0.85" /><circle cx="24" cy="44" r="0.85" /><circle cx="28" cy="44" r="0.85" /><circle cx="32" cy="44" r="0.85" /><circle cx="36" cy="44" r="0.85" /><circle cx="40" cy="44" r="0.85" /><circle cx="44" cy="44" r="0.85" />
                  </g>
                  {/* Dark Calendar & Date Grid dots */}
                  <g fill="#0b1f3a">
                    {/* Top binders */}
                    <circle cx="14" cy="6" r="2.0" /><circle cx="14" cy="10" r="2.0" />
                    <circle cx="34" cy="6" r="2.0" /><circle cx="34" cy="10" r="2.0" />
                    {/* Top header bar */}
                    <circle cx="8" cy="12" r="2.0" /><circle cx="12" cy="12" r="2.0" /><circle cx="16" cy="12" r="2.0" /><circle cx="20" cy="12" r="2.0" /><circle cx="24" cy="12" r="2.0" /><circle cx="28" cy="12" r="2.0" /><circle cx="32" cy="12" r="2.0" /><circle cx="36" cy="12" r="2.0" /><circle cx="40" cy="12" r="2.0" />
                    {/* Outer frame */}
                    <circle cx="8" cy="16" r="2.0" /><circle cx="8" cy="20" r="2.0" /><circle cx="8" cy="24" r="2.0" /><circle cx="8" cy="28" r="2.0" /><circle cx="8" cy="32" r="2.0" /><circle cx="8" cy="36" r="2.0" />
                    <circle cx="40" cy="16" r="2.0" /><circle cx="40" cy="20" r="2.0" /><circle cx="40" cy="24" r="2.0" /><circle cx="40" cy="28" r="2.0" /><circle cx="40" cy="32" r="2.0" /><circle cx="40" cy="36" r="2.0" />
                    <circle cx="12" cy="36" r="2.0" /><circle cx="16" cy="36" r="2.0" /><circle cx="20" cy="36" r="2.0" /><circle cx="24" cy="36" r="2.0" /><circle cx="28" cy="36" r="2.0" /><circle cx="32" cy="36" r="2.0" /><circle cx="36" cy="36" r="2.0" />
                    {/* Internal grid dates */}
                    <circle cx="16" cy="20" r="1.8" /><circle cx="24" cy="20" r="1.8" /><circle cx="32" cy="20" r="1.8" />
                    <circle cx="16" cy="26" r="1.8" /><circle cx="24" cy="26" r="1.8" /><circle cx="32" cy="26" r="1.8" />
                    <circle cx="16" cy="31" r="1.8" /><circle cx="24" cy="31" r="1.8" />
                  </g>
                </svg>
              </div>
              <div className={styles.secondPartStatValue}>8+</div>
              <div className={styles.secondPartStatLabel}>YEARS INDUSTRY COVERAGE</div>
              <p className={styles.secondPartStatDesc}>
                Established track record of independent editorial authority and market intelligence.
              </p>
            </div>

            {/* Point 5: 30+ Mining Jurisdictions */}
            <div className={styles.statEditorialItem}>
              {/* Sign 5: Global Mining Jurisdictions Globe */}
              <div className={styles.statSignWrap} aria-hidden="true">
                <svg className={styles.statItemSign} viewBox="0 0 48 48" fill="none">
                  {/* Matrix lattice background */}
                  <g opacity="0.18" fill="#0b1f3a">
                    <circle cx="4" cy="4" r="0.85" /><circle cx="8" cy="4" r="0.85" /><circle cx="12" cy="4" r="0.85" /><circle cx="16" cy="4" r="0.85" /><circle cx="20" cy="4" r="0.85" /><circle cx="24" cy="4" r="0.85" /><circle cx="28" cy="4" r="0.85" /><circle cx="32" cy="4" r="0.85" /><circle cx="36" cy="4" r="0.85" /><circle cx="40" cy="4" r="0.85" /><circle cx="44" cy="4" r="0.85" />
                    <circle cx="4" cy="8" r="0.85" /><circle cx="8" cy="8" r="0.85" /><circle cx="12" cy="8" r="0.85" /><circle cx="16" cy="8" r="0.85" /><circle cx="20" cy="8" r="0.85" /><circle cx="24" cy="8" r="0.85" /><circle cx="28" cy="8" r="0.85" /><circle cx="32" cy="8" r="0.85" /><circle cx="36" cy="8" r="0.85" /><circle cx="40" cy="8" r="0.85" /><circle cx="44" cy="8" r="0.85" />
                    <circle cx="4" cy="12" r="0.85" /><circle cx="8" cy="12" r="0.85" /><circle cx="12" cy="12" r="0.85" /><circle cx="16" cy="12" r="0.85" /><circle cx="20" cy="12" r="0.85" /><circle cx="24" cy="12" r="0.85" /><circle cx="28" cy="12" r="0.85" /><circle cx="32" cy="12" r="0.85" /><circle cx="36" cy="12" r="0.85" /><circle cx="40" cy="12" r="0.85" /><circle cx="44" cy="12" r="0.85" />
                    <circle cx="4" cy="16" r="0.85" /><circle cx="8" cy="16" r="0.85" /><circle cx="12" cy="16" r="0.85" /><circle cx="16" cy="16" r="0.85" /><circle cx="20" cy="16" r="0.85" /><circle cx="24" cy="16" r="0.85" /><circle cx="28" cy="16" r="0.85" /><circle cx="32" cy="16" r="0.85" /><circle cx="36" cy="16" r="0.85" /><circle cx="40" cy="16" r="0.85" /><circle cx="44" cy="16" r="0.85" />
                    <circle cx="4" cy="20" r="0.85" /><circle cx="8" cy="20" r="0.85" /><circle cx="12" cy="20" r="0.85" /><circle cx="16" cy="20" r="0.85" /><circle cx="20" cy="20" r="0.85" /><circle cx="24" cy="20" r="0.85" /><circle cx="28" cy="20" r="0.85" /><circle cx="32" cy="20" r="0.85" /><circle cx="36" cy="20" r="0.85" /><circle cx="40" cy="20" r="0.85" /><circle cx="44" cy="20" r="0.85" />
                    <circle cx="4" cy="24" r="0.85" /><circle cx="8" cy="24" r="0.85" /><circle cx="12" cy="24" r="0.85" /><circle cx="16" cy="24" r="0.85" /><circle cx="20" cy="24" r="0.85" /><circle cx="24" cy="24" r="0.85" /><circle cx="28" cy="24" r="0.85" /><circle cx="32" cy="24" r="0.85" /><circle cx="36" cy="24" r="0.85" /><circle cx="40" cy="24" r="0.85" /><circle cx="44" cy="24" r="0.85" />
                    <circle cx="4" cy="28" r="0.85" /><circle cx="8" cy="28" r="0.85" /><circle cx="12" cy="28" r="0.85" /><circle cx="16" cy="28" r="0.85" /><circle cx="20" cy="28" r="0.85" /><circle cx="24" cy="28" r="0.85" /><circle cx="28" cy="28" r="0.85" /><circle cx="32" cy="28" r="0.85" /><circle cx="36" cy="28" r="0.85" /><circle cx="40" cy="28" r="0.85" /><circle cx="44" cy="28" r="0.85" />
                    <circle cx="4" cy="32" r="0.85" /><circle cx="8" cy="32" r="0.85" /><circle cx="12" cy="32" r="0.85" /><circle cx="16" cy="32" r="0.85" /><circle cx="20" cy="32" r="0.85" /><circle cx="24" cy="32" r="0.85" /><circle cx="28" cy="32" r="0.85" /><circle cx="32" cy="32" r="0.85" /><circle cx="36" cy="32" r="0.85" /><circle cx="40" cy="32" r="0.85" /><circle cx="44" cy="32" r="0.85" />
                    <circle cx="4" cy="36" r="0.85" /><circle cx="8" cy="36" r="0.85" /><circle cx="12" cy="36" r="0.85" /><circle cx="16" cy="36" r="0.85" /><circle cx="20" cy="36" r="0.85" /><circle cx="24" cy="36" r="0.85" /><circle cx="28" cy="36" r="0.85" /><circle cx="32" cy="36" r="0.85" /><circle cx="36" cy="36" r="0.85" /><circle cx="40" cy="36" r="0.85" /><circle cx="44" cy="36" r="0.85" />
                    <circle cx="4" cy="40" r="0.85" /><circle cx="8" cy="40" r="0.85" /><circle cx="12" cy="40" r="0.85" /><circle cx="16" cy="40" r="0.85" /><circle cx="20" cy="40" r="0.85" /><circle cx="24" cy="40" r="0.85" /><circle cx="28" cy="40" r="0.85" /><circle cx="32" cy="40" r="0.85" /><circle cx="36" cy="40" r="0.85" /><circle cx="40" cy="40" r="0.85" /><circle cx="44" cy="40" r="0.85" />
                    <circle cx="4" cy="44" r="0.85" /><circle cx="8" cy="44" r="0.85" /><circle cx="12" cy="44" r="0.85" /><circle cx="16" cy="44" r="0.85" /><circle cx="20" cy="44" r="0.85" /><circle cx="24" cy="44" r="0.85" /><circle cx="28" cy="44" r="0.85" /><circle cx="32" cy="44" r="0.85" /><circle cx="36" cy="44" r="0.85" /><circle cx="40" cy="44" r="0.85" /><circle cx="44" cy="44" r="0.85" />
                  </g>
                  {/* Dark Globe Coordinates dots */}
                  <g fill="#0b1f3a">
                    {/* Outer circle */}
                    <circle cx="20" cy="6" r="2.0" /><circle cx="24" cy="6" r="2.0" /><circle cx="28" cy="6" r="2.0" />
                    <circle cx="12" cy="10" r="2.0" /><circle cx="36" cy="10" r="2.0" />
                    <circle cx="8" cy="15" r="2.0" /><circle cx="40" cy="15" r="2.0" />
                    <circle cx="6" cy="20" r="2.0" /><circle cx="42" cy="20" r="2.0" />
                    <circle cx="6" cy="24" r="2.1" /><circle cx="42" cy="24" r="2.1" />
                    <circle cx="6" cy="28" r="2.0" /><circle cx="42" cy="28" r="2.0" />
                    <circle cx="8" cy="33" r="2.0" /><circle cx="40" cy="33" r="2.0" />
                    <circle cx="12" cy="38" r="2.0" /><circle cx="36" cy="38" r="2.0" />
                    <circle cx="20" cy="42" r="2.0" /><circle cx="24" cy="42" r="2.0" /><circle cx="28" cy="42" r="2.0" />
                    {/* Equator */}
                    <circle cx="10" cy="24" r="2.0" /><circle cx="16" cy="24" r="2.0" /><circle cx="20" cy="24" r="2.0" /><circle cx="24" cy="24" r="2.1" /><circle cx="28" cy="24" r="2.0" /><circle cx="32" cy="24" r="2.0" /><circle cx="38" cy="24" r="2.0" />
                    {/* Prime meridian */}
                    <circle cx="24" cy="12" r="2.0" /><circle cx="24" cy="18" r="2.0" /><circle cx="24" cy="30" r="2.0" /><circle cx="24" cy="36" r="2.0" />
                    {/* Latitudes */}
                    <circle cx="16" cy="15" r="1.8" /><circle cx="20" cy="15" r="1.8" /><circle cx="28" cy="15" r="1.8" /><circle cx="32" cy="15" r="1.8" />
                    <circle cx="16" cy="33" r="1.8" /><circle cx="20" cy="33" r="1.8" /><circle cx="28" cy="33" r="1.8" /><circle cx="32" cy="33" r="1.8" />
                  </g>
                </svg>
              </div>
              <div className={styles.secondPartStatValue}>30+</div>
              <div className={styles.secondPartStatLabel}>MINING JURISDICTIONS</div>
              <p className={styles.secondPartStatDesc}>
                Extensive reach across key financial capitals and global mining jurisdictions.
              </p>
            </div>

            {/* Streamlined Editorial Callout Block (matching user picture) */}
            <div className={styles.statCalloutBlock}>
              <p className={styles.statCalloutHeadline}>
                With direct access to institutional investors and industry analysts, your company&apos;s news reaches the decision-makers who matter most in global mining.
              </p>
              <div className={styles.statCalloutBulletRow}>
                <div className={styles.statCalloutBulletBadge} aria-hidden="true">
                  <span className={styles.statCalloutBulletDot} />
                </div>
                <p className={styles.statCalloutBulletText}>
                  No fragmented messaging between channels. Just one dedicated team accountable for reaching decision-makers worldwide.
                </p>
              </div>
              <Link href="/about" className={styles.statCalloutBtn}>
                <span>LEARN MORE ABOUT US</span>
                <span className={styles.statCalloutBtnArrow} aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ROAD-TO-SCREEN ANIMATED MAGAZINE SHOWCASE:
          Directly emerges and zooms up from the truck's rear cargo doors into center stage.
          Presents the cards one by one in series ("single by single") matching the user reference image. */}
      <div ref={magazineWrapRef} className={styles.magazinePresentationWrap}>
        {/* Large background typography behind the 7 cards */}
        <div ref={servicesTitleRef} className={styles.servicesBackgroundText} aria-hidden="true">
          OUR SERVICES
        </div>

        <div className={magStyles.magazinePresentation}>
          {/* 7 Cards Row - Aligned horizontally across the screen */}
          <div ref={rowRef} className={styles.cardsAlignedRow}>
            {REVEAL_CARDS.map((card, idx) => (
              <div
                key={card.id}
                ref={(el) => {
                  cardRefs.current[idx] = el;
                }}
                className={`${styles.alignedCardItem} ${
                  activeIndex === idx ? styles.alignedCardItemActive : ""
                }`}
                onClick={() => setActiveIndex(idx)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveIndex(idx);
                  }
                }}
                aria-label={`Card ${card.id}`}
              >
                {/* Clean blank card shell preserving exact frame, spine, sheen, and shield */}
                <div aria-hidden="true" className={magStyles.coverSpine} />
                <div aria-hidden="true" className={magStyles.coverSheen} />
                <div aria-hidden="true" className={magStyles.coverShield} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Complete Magazine Archive Modal */}
      {showAllArchive && isMounted && createPortal(
        <div
          className={styles.archiveModalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAllArchive(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Complete Magazine Catalog"
        >
          <div className={styles.archiveModalContent}>
            <div className={styles.archiveModalHeader}>
              <div className={magStyles.archiveEyebrow}>
                <span className={magStyles.archiveEyebrowRule} aria-hidden="true" />
                <span>Complete Catalog</span>
                <span className={magStyles.archiveEyebrowRule} aria-hidden="true" />
              </div>
              <button
                type="button"
                className={magStyles.readerCloseBtn}
                onClick={() => setShowAllArchive(false)}
                aria-label="Close archive"
              >
                <X className={magStyles.readerCloseIcon} />
                <span>CLOSE</span>
              </button>
            </div>
            <h3 className={magStyles.archiveTitle}>All Published Editions</h3>
            <p className={magStyles.archiveSubtitle}>
              Explore all {allMagazines.length} monthly publications from the Mining Discovery library. Select any edition to open the complete magazine reader.
            </p>
            <div className={magStyles.archiveGrid}>
              {allMagazines.map((edition) => (
                <EditionCoverCard
                  key={edition.id}
                  edition={edition}
                  isSelected={activeMagazine.id === edition.id}
                  onSelect={(ed) => {
                    handleOpenReader(ed);
                  }}
                />
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Two-Page Magazine Reader Modal */}
      {readerState !== "closed" && isMounted && createPortal(
        <div
          className={`${magStyles.readerOverlay} ${
            readerState === "open"
              ? magStyles.readerOverlayOpen
              : readerState === "opening"
              ? magStyles.readerOverlayOpening
              : magStyles.readerOverlayClosing
          }`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseReader();
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-label={`${activeMagazine?.title || "Magazine"} Reader`}
        >
          <div className={magStyles.readerHeader}>
            <div className={magStyles.readerMetaLeft}>
              <span className={magStyles.readerBrand}>MINING DISCOVERY</span>
              <span className={magStyles.editionDot} aria-hidden="true" />
              <span className={magStyles.readerIssue}>
                {activeMagazine?.month?.toUpperCase()} {activeMagazine?.year} • ISSUE {activeMagazine?.issueNumber ?? "13"}
              </span>
            </div>
            <button
              type="button"
              className={magStyles.readerCloseBtn}
              onClick={handleCloseReader}
              aria-label="Close magazine reader"
            >
              <X className={magStyles.readerCloseIcon} />
              <span>CLOSE</span>
            </button>
          </div>
          <div
            className={magStyles.readerStage}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCloseReader();
              }
            }}
          >
            {activeMagazine && (
              <MagazineSpread
                pdfUrl={activeMagazine.pdf}
                title={activeMagazine.title}
                onSpreadChange={setSpreadLabel}
              />
            )}
          </div>
          <div className={magStyles.readerFooter}>
            <span>{spreadLabel}</span>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default JourneyStory;
