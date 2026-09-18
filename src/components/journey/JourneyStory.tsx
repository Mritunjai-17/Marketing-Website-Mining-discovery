"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Newspaper, BookOpen, TrendingUp, Globe, Sparkles } from "lucide-react";
import styles from "./Journey2D.module.css";
import { smoothstep } from "./journeySideView";
import { useJourneyFrame } from "./journeyScroll";
import { ShowcaseCardCover } from "@/components/sections/MagazineShowcase/MagazineShowcase";
import { MagazineSpread } from "@/components/sections/MagazineShowcase/MagazineSpread";
import { getChronologicalMagazines, type MagazineEdition } from "@/data/magazines";

const MILESTONE_ICONS = [TrendingUp, Newspaper, BookOpen, Globe, Sparkles, Sparkles];

// Latest 5 single magazines ordered chronologically as shown on port 3001
const showcaseMagazines: MagazineEdition[] = getChronologicalMagazines(false).slice(0, 5);

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
  const speedometerRef = useRef<HTMLDivElement>(null);
  const hotspotRef = useRef<HTMLDivElement>(null);
  const secondPartRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const leftSubtextRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);
  const statsTrackRef = useRef<HTMLDivElement>(null);

  // Magazine row and card refs
  const rowRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Magazine reader modal state
  const [selectedMagazine, setSelectedMagazine] = useState<MagazineEdition | null>(null);
  const [readerState, setReaderState] = useState<"closed" | "opening" | "open" | "closing">("closed");
  const [isMounted, setIsMounted] = useState(false);
  const totalTravelRef = useRef(3200);

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

    // Fade out under-road section when truck opens cargo doors (p >= 0.88)
    // 1. Fade out under-road text cards as the journey completes all text (p >= 0.82 to 0.86)
    if (underRoadRef.current) {
      const underRoadFade = 1 - smoothstep(0.82, 0.86, p);
      underRoadRef.current.style.opacity = underRoadFade.toFixed(3);
      underRoadRef.current.style.pointerEvents = underRoadFade > 0.1 ? "auto" : "none";
      underRoadRef.current.style.transform = `translate3d(0, ${((1 - underRoadFade) * 16).toFixed(1)}px, 0)`;
    }

    // 2. Roadside Milestone Track:
    // Text cards enter from the right side of the screen, travel across beneath the truck,
    // and exit off the left side of the screen in lockstep with the truck's forward travel.
    if (trackRef.current) {
      const roadProgress = Math.min(1.0, Math.max(0.0, p / 0.82));
      const currentX = -roadProgress * totalTravelRef.current;
      trackRef.current.style.transform = `translate3d(${currentX.toFixed(2)}px, 0, 0)`;
    }

    // Second Part roadside text animation:
    // Text fades in smoothly on sides as road turns downward, then as truck runs vertically down the highway,
    // drifts outward and fades away so it is completely gone as the truck goes on.
    if (secondPartRef.current) {
      let opacity = 0;

      if (p >= 0.88 && p <= 0.995) {
        // Smooth entrance as road turns downward
        const fadeIn = smoothstep(0.88, 0.915, p);
        // Stays visible through the vertical highway run
        const fadeOut = 1 - smoothstep(0.975, 1.0, p);
        opacity = fadeIn * fadeOut;

        // Auto-scroll the stats track on the right in lockstep with the truck driving down the road
        if (statsTrackRef.current) {
          const statsProgress = Math.max(0, Math.min(1, (p - 0.90) / 0.085));
          const maxScroll = Math.max(0, statsTrackRef.current.scrollHeight - statsTrackRef.current.clientHeight);
          statsTrackRef.current.scrollTop = statsProgress * maxScroll;
        }
      } else {
        opacity = 0;
      }

      secondPartRef.current.style.opacity = opacity.toFixed(3);
      secondPartRef.current.style.pointerEvents = opacity > 0.5 ? "auto" : "none";
    }

    // 3. Cards emerge from truck ONE BY ONE and ALL REMAIN ALIGNED ON SCREEN (NO TEXT)
    // Every card physically originates directly from the truck's open cargo doors!
    const cardStep = 0.022; // Staggered arrival for each of the 5 cards
    const rowEl = rowRef.current;
    const rowCenter = rowEl ? rowEl.offsetWidth / 2 : (typeof window !== "undefined" ? window.innerWidth / 2 : 600);
    // Truck's rear cargo doors in viewport coordinates: center-aligned horizontally, slightly below center vertically
    const truckOffsetX = typeof window !== "undefined" && window.innerWidth < 768 ? 0 : -18;
    const truckOffsetY = typeof window !== "undefined" ? Math.round(window.innerHeight * 0.125) : 100;

    showcaseMagazines.forEach((_, idx) => {
      const el = cardRefs.current[idx];
      if (!el) return;

      const cardStart = 0.880 + idx * cardStep;
      const cardEnd = cardStart + cardStep;

      // Distance from this card's aligned slot center to the truck's cargo doors
      const cardCenterInRow = el.offsetLeft + el.offsetWidth / 2;
      const slotDeltaX = cardCenterInRow - (rowCenter + truckOffsetX);

      if (p < cardStart) {
        // Hasn't emerged yet: hidden inside the truck cargo bay
        el.style.opacity = "0";
        el.style.pointerEvents = "none";
        el.style.transform = `translate3d(${-slotDeltaX.toFixed(1)}px, ${truckOffsetY}px, 0) scale(0.04) rotateZ(0deg)`;
        return;
      }

      if (p >= cardStart && p < cardEnd) {
        // Emerging directly out of the truck's cargo bay and zooming into its aligned slot
        const t = smoothstep(cardStart, cardEnd, p);

        // Fast initial burst out of the truck doors, then smooth deceleration into slot
        const burstProgress = Math.pow(t, 0.72);
        const easeOut = 1 - Math.pow(1 - t, 3);

        // Scale zooms outward from tiny inside the truck (0.04) up to full size (1.0)
        const scale = 0.04 + Math.pow(t, 0.82) * 0.96;

        // X moves from truck doors (-slotDeltaX) to aligned slot (0)
        const curX = -slotDeltaX * (1 - easeOut);

        // Y shoots out from truck doors (+truckOffsetY) with a parabolic flight arc, then lands in row (0)
        const arc = Math.sin(t * Math.PI) * -34;
        const curY = truckOffsetY * (1 - burstProgress) + arc;

        // 3D rotations as the card flies toward camera and fans outward to its column
        const rotZ = (1 - t) * (slotDeltaX < -20 ? -8 : slotDeltaX > 20 ? 8 : 0);
        const rotY = (1 - t) * (slotDeltaX < -20 ? -14 : slotDeltaX > 20 ? 14 : 0);
        const rotX = (1 - t) * 12;

        const opacity = Math.min(1, t * 5.5);

        el.style.opacity = opacity.toFixed(3);
        el.style.transform = `translate3d(${curX.toFixed(1)}px, ${curY.toFixed(1)}px, 0) scale(${scale.toFixed(3)}) rotateX(${rotX.toFixed(1)}deg) rotateY(${rotY.toFixed(1)}deg) rotateZ(${rotZ.toFixed(1)}deg)`;
        el.style.pointerEvents = opacity > 0.8 ? "auto" : "none";
      } else {
        // p >= cardEnd: Arrived in place and REMAINS ALIGNED ON SCREEN
        el.style.opacity = "1";
        el.style.transform = "translate3d(0, 0, 0) scale(1) rotateX(0deg) rotateY(0deg) rotateZ(0deg)";
        el.style.pointerEvents = "auto";
      }
    });
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
          </div>
        </div>
      </div>

      {/* ROAD-TO-SCREEN ANIMATED MAGAZINE SHOWCASE: Hidden to keep top-down view unobstructed */}
      <div className={styles.magazineRiseWrap} style={{ display: "none" }}>
        <div ref={rowRef} className={styles.cardsAlignedRow}>
          {showcaseMagazines.map((mag, idx) => (
            <div
              key={mag.id}
              ref={(el) => {
                cardRefs.current[idx] = el;
              }}
              className={styles.alignedCardItem}
              onClick={() => handleOpenReader(mag)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleOpenReader(mag);
                }
              }}
              aria-label={`${mag.month} Edition ${mag.year}`}
              style={{ opacity: 0, transform: "scale(0.15)", pointerEvents: "none" }}
            >
              <div className={styles.cardHoverShell}>
                <ShowcaseCardCover mag={mag} />
                <div aria-hidden="true" className={styles.magSpine} />
                <div aria-hidden="true" className={styles.magSheen} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two-Page Magazine Reader Modal */}
      {readerState !== "closed" && isMounted && createPortal(
        <div
          className={`${styles.readerModalOverlay} ${
            readerState === "open"
              ? styles.readerModalOpen
              : readerState === "opening"
              ? styles.readerModalOpening
              : styles.readerModalClosing
          }`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseReader();
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedMagazine?.title || "Magazine"} Reader`}
        >
          <div className={styles.readerModalHeader}>
            <div className={styles.readerMetaLeft}>
              <span className={styles.readerBrand}>MINING DISCOVERY</span>
              <span className={styles.magDotDivider} aria-hidden="true" />
              <span className={styles.readerIssue}>
                {selectedMagazine?.month?.toUpperCase()} {selectedMagazine?.year} • ISSUE {selectedMagazine?.issueNumber ?? "14"}
              </span>
            </div>
            <button
              type="button"
              className={styles.readerCloseBtn}
              onClick={handleCloseReader}
              aria-label="Close magazine reader"
            >
              <X className={styles.readerCloseIcon} />
              <span>CLOSE</span>
            </button>
          </div>
          <div
            className={styles.readerModalBody}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCloseReader();
              }
            }}
          >
            {selectedMagazine && (
              <MagazineSpread
                pdfUrl={selectedMagazine.pdf}
                title={selectedMagazine.title}
              />
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default JourneyStory;
