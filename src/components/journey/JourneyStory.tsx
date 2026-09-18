"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { X, Newspaper, BookOpen, TrendingUp, Globe, Sparkles } from "lucide-react";
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
}

export const REVEAL_CARDS: RevealCard[] = [
  { id: 1 },
  { id: 2 },
  { id: 3 },
  { id: 4 },
  { id: 5 },
  { id: 6 },
];

export interface DustParticle {
  cardIndex: number;
  edgeX: number;
  edgeY: number;
  size: number;
  alpha: number;
  color: string;
  driftSpeed: number;
  waveFreq: number;
  waveAmp: number;
  phase: number;
  settleRatioX: number;
  settleRatioY: number;
}

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

  // The Golden Dust Transition (Idea 6): Fine mineral dust & mountain stage refs
  const dustCanvasRef = useRef<HTMLCanvasElement>(null);
  const settleStageRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const mountainPhotoRef = useRef<HTMLImageElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  // Interactive mouse tracker for spotlight, parallax, and dust physics
  const mousePosRef = useRef({
    x: 0.5,
    y: 0.5,
    targetX: 0.5,
    targetY: 0.5,
    px: 600,
    py: 400,
    targetPx: 600,
    targetPy: 400,
    active: false,
  });

  // Deterministic pool of fine mineral dust / photographic grain particles
  const dustParticles = useMemo<DustParticle[]>(() => {
    const particles: DustParticle[] = [];
    const colors = [
      "rgba(212, 175, 55,",   // Classic Gold Ore #D4AF37
      "rgba(243, 229, 171,",  // Pale Vanilla Gold #F3E5AB
      "rgba(197, 155, 39,",   // Deep Amber Ore #C59B27
      "rgba(230, 202, 101,",  // Champagne Gold #E6CA65
      "rgba(255, 248, 220,",  // Specular Fleck #FFF8DC
    ];

    let seed = 42;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let i = 0; i < 340; i++) {
      const cardIndex = i % 6;
      const edgeChoice = rand();
      let edgeX = 0;
      let edgeY = 0;
      const inset = (rand() - 0.5) * 0.15;

      if (edgeChoice < 0.25) {
        edgeX = rand() * 2 - 1;
        edgeY = -1 + inset;
      } else if (edgeChoice < 0.5) {
        edgeX = 1 + inset;
        edgeY = rand() * 2 - 1;
      } else if (edgeChoice < 0.75) {
        edgeX = rand() * 2 - 1;
        edgeY = 1 + inset;
      } else {
        edgeX = -1 + inset;
        edgeY = rand() * 2 - 1;
      }

      const size = 0.8 + rand() * 1.8;
      const colorBase = colors[Math.floor(rand() * colors.length)];
      const alpha = 0.45 + rand() * 0.5;

      particles.push({
        cardIndex,
        edgeX,
        edgeY,
        size,
        alpha,
        color: colorBase,
        driftSpeed: 0.75 + rand() * 0.65,
        waveFreq: 1.0 + rand() * 1.6,
        waveAmp: 10 + rand() * 25,
        phase: rand() * Math.PI * 2,
        settleRatioX: 0.05 + rand() * 0.9,
        settleRatioY: 0.62 + rand() * 0.22,
      });
    }
    return particles;
  }, []);

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
    const handlePointerMove = (e: PointerEvent) => {
      const m = mousePosRef.current;
      const w = window.innerWidth || 1200;
      const h = window.innerHeight || 800;
      m.targetX = Math.max(0, Math.min(1, e.clientX / w));
      m.targetY = Math.max(0, Math.min(1, e.clientY / h));
      m.targetPx = e.clientX;
      m.targetPy = e.clientY;
      m.active = true;
    };
    const handlePointerLeave = () => {
      const m = mousePosRef.current;
      m.targetX = 0.5;
      m.targetY = 0.5;
    };
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave, { passive: true });

    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
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

    // 4. ROAD-TO-SCREEN 3D CARD GALLERY (HUGE INC PERSPECTIVE CAROUSEL):
    // 6 tall cards arranged along a shallow 3D semicircular/cylindrical arc in perspective.
    // The current center card remains dominant:
    // - faces almost directly toward the viewer
    // - appears larger and closer
    // - has the strongest visual hierarchy
    // Cards toward the LEFT:
    // - progressively move farther into depth
    // - rotate slightly inward toward the center
    // - become smaller as they move away from the center
    // Cards toward the RIGHT:
    // - mirror the same behavior
    // - progressively move farther into depth
    // - rotate inward toward the center
    // Scrolling drives the 3D camera travel through all 6 cards.
    if (magazineWrapRef.current) {
      if (p < 0.938) {
        magazineWrapRef.current.style.opacity = "0";
        magazineWrapRef.current.style.pointerEvents = "none";
        magazineWrapRef.current.style.backgroundColor = "transparent";
        magazineWrapRef.current.style.backdropFilter = "none";
        if (servicesTitleRef.current) {
          servicesTitleRef.current.style.opacity = "0";
        }
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

        const isMobile = winW < 768;
        const isTablet = winW < 1024;

        // Position of the card emission point on the road behind the truck
        const startX = winW * 0.04;
        const startY = -winH * 0.26;

        // Arch Geometry matching Huge Inc reference
        // Balanced "little gap" (~50px-65px) so cards never touch or crowd
        const deltaX = isMobile
          ? winW * 0.46
          : isTablet
          ? Math.min(360, winW * 0.38)
          : Math.min(460, winW * 0.325);

        // Apex Y position: center card sits high up
        const originY = isMobile ? -winH * 0.05 : -winH * 0.07;
        const baseDrop = isMobile ? 105 : isTablet ? 125 : 150;
        const rotZAngle = isMobile ? 15 : isTablet ? 14 : 13;

        // 1. Emergence from truck: 0.938 -> 0.948
        const EMERGE_START = 0.938;
        const EMERGE_END = 0.948;

        // 2. Continuous semicircle rotation across cards driven by scroll: 0.948 -> 0.968
        const CARDS_ACTIVE_END = 0.968;
        const totalCards = REVEAL_CARDS.length; // 6
        let focal = 0;

        if (p >= EMERGE_END && p < CARDS_ACTIVE_END) {
          const galleryP = (p - EMERGE_END) / (CARDS_ACTIVE_END - EMERGE_END);
          const rawTarget = galleryP * totalCards;

          const k = Math.floor(rawTarget);
          const sub = rawTarget - k;

          // Cinematic dwell at apex & smooth rotation along arc
          let stepT = 0;
          if (sub <= 0.16) {
            stepT = 0;
          } else if (sub >= 0.84) {
            stepT = 1;
          } else {
            const tau = (sub - 0.16) / 0.68;
            stepT = tau * tau * (3 - 2 * tau);
          }

          focal = k + stepT;
        } else if (p >= CARDS_ACTIVE_END) {
          focal = totalCards;
        }

        // Dissolve cards into golden mineral dust: 0.966 -> 0.978
        const cardExitP = smoothstep(0.966, 0.978, p);

        // Track card positions for particle emission
        const cardScreenCoords: { x: number; y: number; width: number; height: number; opacity: number }[] = [];
        const cardW = isMobile ? 250 : isTablet ? 290 : Math.min(370, winW * 0.25);
        const cardH = cardW * 1.38;

        REVEAL_CARDS.forEach((_, idx) => {
          const el = cardRefs.current[idx];
          if (!el) return;

          // Wrapped circular distance so all transitions are continuous
          let d = ((idx - focal) % totalCards + totalCards) % totalCards;
          if (d > totalCards / 2) {
            d -= totalCards;
          }

          // Trajectory: Parabolic Arch from bottom-right -> up into center -> down into bottom-left
          // Center card (d = 0): Apex peak (arcX = 0, arcY = originY, rotZ = 0)
          // Left card (d < 0): Moves LEFT and plunges DOWN, tilted counter-clockwise (rotZ < 0)
          // Right card (d > 0): Plunges DOWN to the right, tilted clockwise (rotZ > 0), rising UP into center as scroll advances
          const archDrop = Math.pow(Math.abs(d), 1.38) * baseDrop;
          const arcX = d * deltaX;
          const arcY = originY + archDrop;

          // 3D Rotations matching Huge Inc (media_1789728259487.png):
          // Left card (d < 0): tilts counter-clockwise (arcRotZ < 0) & faces inward (arcRotY > 0)
          // Right card (d > 0): tilts clockwise (arcRotZ > 0) & faces inward (arcRotY < 0)
          const arcRotZ = Math.max(-32, Math.min(32, d * rotZAngle));
          const arcRotY = Math.max(-20, Math.min(20, -d * 14));
          const arcZ = -Math.abs(d) * (isMobile ? 35 : 55);

          // Scale: Center card is 1.0, flanks scale down subtly to 0.89, far edges to ~0.76
          const arcScale = Math.max(0.74, Math.min(1.0, 1.0 - Math.abs(d) * 0.11));
          const zIndex = Math.round(50 - Math.abs(d) * 15);

          // Card Visibility: 3 main cards dominant, incoming card from bottom-right and outgoing card to bottom-left visible at edges
          const absD = Math.abs(d);
          let arcOpacity = 0;
          if (absD <= 1.15) {
            arcOpacity = 1.0;
          } else if (absD < 1.75) {
            arcOpacity = 1.0 - (absD - 1.15) / 0.60;
          } else {
            arcOpacity = 0;
          }

          let curX = arcX;
          let curY = arcY;
          let curZ = arcZ;
          let curRotY = arcRotY;
          let curRotZ = arcRotZ;
          let curScale = arcScale;
          let curOpacity = arcOpacity;

          if (p < EMERGE_START) {
            el.style.opacity = "0";
            el.style.pointerEvents = "none";
            el.style.transform = `translate3d(calc(-50% + ${startX.toFixed(1)}px), calc(-50% + ${startY.toFixed(1)}px), -500px) scale(0.05)`;
            cardScreenCoords[idx] = { x: winW * 0.5 + startX, y: winH * 0.5 + startY, width: cardW, height: cardH, opacity: 0 };
            return;
          }

          if (p >= EMERGE_START && p < EMERGE_END) {
            const emergeP = (p - EMERGE_START) / (EMERGE_END - EMERGE_START);
            const easeEmerge = 1 - Math.pow(1 - emergeP, 2.5);

            curX = (1 - easeEmerge) * startX + easeEmerge * arcX;
            curY = (1 - easeEmerge) * startY + easeEmerge * arcY;
            curZ = (1 - easeEmerge) * -500 + easeEmerge * arcZ;
            curRotY = easeEmerge * arcRotY;
            curRotZ = easeEmerge * arcRotZ;
            curScale = (0.05 + 0.95 * easeEmerge) * arcScale;
            curOpacity = Math.min(arcOpacity, emergeP * 3.5);
          }

          // Dissolve smoothly into golden dust
          curOpacity *= (1 - cardExitP);
          curScale *= (1 - cardExitP * 0.08);
          curX += cardExitP * 30; // Subtle eastward drift into the dust

          const isInteractive = absD < 0.7 && cardExitP < 0.1;

          el.style.opacity = curOpacity.toFixed(3);
          el.style.pointerEvents = isInteractive ? "auto" : "none";
          el.style.zIndex = `${zIndex}`;
          el.style.transform = `translate3d(calc(-50% + ${curX.toFixed(1)}px), calc(-50% + ${curY.toFixed(1)}px), ${curZ.toFixed(1)}px) rotateY(${curRotY.toFixed(2)}deg) rotateZ(${curRotZ.toFixed(2)}deg) scale(${curScale.toFixed(3)})`;

          cardScreenCoords[idx] = {
            x: winW * 0.5 + curX,
            y: winH * 0.5 + curY,
            width: cardW * curScale,
            height: cardH * curScale,
            opacity: curOpacity,
          };
        });

        // Update active index
        const currentDominant = ((Math.round(focal) % totalCards) + totalCards) % totalCards;
        if (currentDominant !== activeIndexRef.current) {
          activeIndexRef.current = currentDominant;
          setActiveIndex(currentDominant);
        }

        // Smooth mouse lerp for interactive dynamic spotlight, parallax, and dust deflection
        const m = mousePosRef.current;
        m.x += (m.targetX - m.x) * 0.08;
        m.y += (m.targetY - m.y) * 0.08;
        m.px += (m.targetPx - m.px) * 0.08;
        m.py += (m.targetPy - m.py) * 0.08;

        // Interactive subtle mountain parallax: responds seamlessly to mouse movement
        if (mountainPhotoRef.current) {
          const pX = (m.x - 0.5) * -22;
          const pY = (m.y - 0.5) * -14;
          mountainPhotoRef.current.style.transform = `scale(1.08) translate3d(${pX.toFixed(1)}px, ${pY.toFixed(1)}px, 0)`;
        }

        // Interactive golden spotlight following cursor
        if (spotlightRef.current) {
          if (p < 0.966) {
            spotlightRef.current.style.opacity = "0";
          } else {
            const spotAlpha = Math.min(1, (p - 0.966) / 0.012);
            spotlightRef.current.style.opacity = spotAlpha.toFixed(3);
            spotlightRef.current.style.background = `radial-gradient(circle 560px at ${(m.x * 100).toFixed(1)}% ${(m.y * 100).toFixed(1)}%, rgba(255, 215, 110, 0.26) 0%, rgba(212, 175, 55, 0.12) 36%, rgba(14, 32, 64, 0.04) 65%, transparent 82%)`;
          }
        }

        // Controls visibility: cleanly hide 6 dots when cards dissolve into mountain stage
        if (controlsRef.current) {
          if (p < 0.948 || p >= 0.966) {
            controlsRef.current.style.opacity = "0";
            controlsRef.current.style.pointerEvents = "none";
          } else {
            controlsRef.current.style.opacity = "1";
            controlsRef.current.style.pointerEvents = "auto";
          }
        }

        // Deepen background to dark cinematic backdrop during cards, transparent during mountain stage so rich alpine dawn breathes
        if (p >= 0.966) {
          magazineWrapRef.current.style.backgroundColor = "transparent";
          magazineWrapRef.current.style.backdropFilter = "none";
        } else {
          const bgAlpha = (Math.min(1, (p - 0.938) / 0.035) * 0.88).toFixed(3);
          magazineWrapRef.current.style.backgroundColor = `rgba(6, 10, 18, ${bgAlpha})`;
          magazineWrapRef.current.style.backdropFilter = p > 0.945 ? "blur(12px)" : "none";
        }

        // Background typography ("OUR SERVICES")
        if (servicesTitleRef.current) {
          if (p < 0.948) {
            servicesTitleRef.current.style.opacity = "0";
          } else {
            const titleP = smoothstep(0.948, 0.965, p) * (1 - cardExitP);
            servicesTitleRef.current.style.opacity = (titleP * 0.12).toFixed(3);
            servicesTitleRef.current.style.transform = `translate3d(-50%, -50%, 0)`;
          }
        }

        // ====================================================================
        // THE GOLDEN DUST TRANSITION (IDEA 6): Fine mineral dust canvas
        // ====================================================================
        const canvas = dustCanvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            if (p < 0.965) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            } else {
              const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
              const targetW = Math.round(winW * dpr);
              const targetH = Math.round(winH * dpr);
              if (canvas.width !== targetW || canvas.height !== targetH) {
                canvas.width = targetW;
                canvas.height = targetH;
              }

              ctx.save();
              ctx.scale(dpr, dpr);
              ctx.clearRect(0, 0, winW, winH);

              // Phase 1: Detach & Stream Horizontally: 0.966 -> 0.982
              // Phase 2: Decelerate & Settle into Mountain: 0.982 -> 1.000
              const driftP = Math.max(0, Math.min(1, (p - 0.966) / (0.982 - 0.966)));
              const settleP = Math.max(0, Math.min(1, (p - 0.982) / (1.000 - 0.982)));

              let systemAlpha = 0;
              if (p >= 0.966 && p < 0.972) {
                systemAlpha = (p - 0.966) / 0.006;
              } else if (p >= 0.972 && p <= 0.990) {
                systemAlpha = 1;
              } else if (p > 0.990) {
                systemAlpha = Math.max(0, 1 - (p - 0.990) / 0.010);
              }

              const easeSettle = settleP * settleP * (3 - 2 * settleP);

              dustParticles.forEach((pt) => {
                const cardCoord = cardScreenCoords[pt.cardIndex] || {
                  x: winW * 0.5,
                  y: winH * 0.5,
                  width: 300,
                  height: 420,
                  opacity: 1,
                };

                // Origin at perimeter of the card
                const startX = cardCoord.x + pt.edgeX * cardCoord.width * 0.5;
                const startY = cardCoord.y + pt.edgeY * cardCoord.height * 0.5;

                // Horizontal drift across the screen to the right
                const maxDriftDist = winW * 0.72 * pt.driftSpeed;
                const driftX = startX + driftP * maxDriftDist;
                const waveY = Math.sin(driftP * Math.PI * pt.waveFreq + pt.phase) * pt.waveAmp;
                const driftY = startY + waveY - driftP * 35;

                // Natural atmospheric mist dispersion across the mountain landscape
                const targetX = pt.settleRatioX * winW;
                const targetY = pt.settleRatioY * winH + Math.sin(pt.settleRatioX * 2.5 * Math.PI) * 16;

                const curX = driftX * (1 - easeSettle) + targetX * easeSettle;
                const curY = driftY * (1 - easeSettle) + targetY * easeSettle;

                // Interactive cursor deflection: particles physically part and swirl around cursor
                const mouseCanvasX = m.px;
                const mouseCanvasY = m.py;
                const distToMouse = Math.hypot(curX - mouseCanvasX, curY - mouseCanvasY);
                let drawX = curX;
                let drawY = curY;
                if (m.active && distToMouse < 140 && distToMouse > 0.001) {
                  const force = (1 - distToMouse / 140) * 35;
                  const angle = Math.atan2(curY - mouseCanvasY, curX - mouseCanvasX);
                  drawX += Math.cos(angle) * force;
                  drawY += Math.sin(angle) * force;
                }

                const particleAlpha = pt.alpha * systemAlpha;
                if (particleAlpha <= 0.01) return;

                ctx.fillStyle = `${pt.color}${particleAlpha.toFixed(3)})`;
                ctx.beginPath();
                ctx.arc(drawX, drawY, pt.size, 0, Math.PI * 2);
                ctx.fill();

                // Specular glint on larger flecks
                if (pt.size > 2.0) {
                  ctx.fillStyle = `rgba(255, 255, 255, ${(particleAlpha * 0.6).toFixed(3)})`;
                  ctx.beginPath();
                  ctx.arc(drawX - 0.5, drawY - 0.5, pt.size * 0.45, 0, Math.PI * 2);
                  ctx.fill();
                }
              });

              // Golden dust "writing quill" particles active at the leading reveal edge
              const writeProgress = Math.max(0, Math.min(1, (p - 0.966) / (0.985 - 0.966)));
              const easeWrite = 1 - Math.pow(1 - writeProgress, 2.2);

              if (writeProgress > 0.02 && writeProgress < 0.99) {
                const brushX = easeWrite * winW;
                ctx.fillStyle = "rgba(243, 229, 171, 0.85)";
                for (let b = 0; b < 28; b++) {
                  const bSeed = (b * 9301 + Math.round(p * 10000)) % 233280;
                  const bRand1 = (bSeed % 1000) / 1000;
                  const bRand2 = ((bSeed * 13) % 1000) / 1000;
                  const px = brushX + (bRand1 - 0.5) * 50;
                  const py = winH * 0.15 + bRand2 * winH * 0.7;
                  const psize = 0.8 + bRand1 * 1.6;
                  ctx.beginPath();
                  ctx.arc(px, py, psize, 0, Math.PI * 2);
                  ctx.fill();
                }
              }

              ctx.restore();
            }
          }
        }

        // ====================================================================
        // MOUNTAIN LANDSCAPE & EDITORIAL FOCUS AREAS
        // The text is progressively written down as the golden dust moves across
        // ====================================================================
        if (settleStageRef.current) {
          if (p < 0.966) {
            settleStageRef.current.style.opacity = "0";
            settleStageRef.current.style.pointerEvents = "none";
            settleStageRef.current.style.clipPath = "inset(0 100% 0 0)";
          } else {
            const writeProgress = Math.max(0, Math.min(1, (p - 0.966) / (0.985 - 0.966)));
            const easeWrite = 1 - Math.pow(1 - writeProgress, 2.2);
            const revealPct = (easeWrite * 100).toFixed(1);

            settleStageRef.current.style.opacity = "1";
            settleStageRef.current.style.clipPath = `inset(0 calc(100% - ${revealPct}%) 0 0)`;
            settleStageRef.current.style.pointerEvents = writeProgress > 0.85 ? "auto" : "none";
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

      {/* 3D CYLINDRICAL ARC CARD GALLERY (HUGE INC PERSPECTIVE INTERACTION):
          6 tall cards arranged along a shallow 3D semicircular arc in perspective.
          Scrolling drives the 3D camera travel through all 6 cards. */}
      <div ref={magazineWrapRef} className={styles.magazinePresentationWrap}>
        {/* Subtle background typography behind the 6 cards */}
        <div ref={servicesTitleRef} className={styles.servicesBackgroundText} aria-hidden="true">
          OUR SERVICES
        </div>

        {/* Pure Semicircular Arc Gallery (Exactly 3 Cards Seen Rotating) */}
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
              aria-label={`Service Card 0${card.id}`}
            >
              {/* Clean blank card shell preserving exact frame, spine, sheen, and shield */}
              <div aria-hidden="true" className={magStyles.coverSpine} />
              <div aria-hidden="true" className={magStyles.coverSheen} />
              <div aria-hidden="true" className={magStyles.coverShield} />
            </div>
          ))}
        </div>

        {/* Minimal dot navigation indicator */}
        <div ref={controlsRef} className={styles.alignedControls}>
          {REVEAL_CARDS.map((card, idx) => (
            <button
              key={card.id}
              type="button"
              className={`${styles.alignedDot} ${
                activeIndex === idx ? styles.alignedDotActive : ""
              }`}
              onClick={() => setActiveIndex(idx)}
              aria-label={`Focus card ${idx + 1}`}
            />
          ))}
        </div>

        {/* THE GOLDEN DUST TRANSITION (IDEA 6): Fine mineral dust canvas */}
        <canvas ref={dustCanvasRef} className={styles.dustCanvas} aria-hidden="true" />

        {/* MOUNTAIN LANDSCAPE & EDITORIAL SETTLE STAGE */}
        <div ref={settleStageRef} className={styles.settleMountainStage}>
          {/* Photorealistic alpine mountain landscape with golden morning sunlight */}
          <img
            ref={mountainPhotoRef}
            src="/images/alpine_gold_mountain.jpg"
            alt="Alpine Mountain Horizon"
            className={styles.settleMountainPhoto}
            aria-hidden="true"
          />
          {/* Luminous dawn & twilight sapphire atmospheric mist gradient */}
          <div className={styles.settleBackdropGradient} aria-hidden="true" />

          {/* Interactive Mouse-Follow Amber/Gold Spotlight */}
          <div ref={spotlightRef} className={styles.settleInteractiveSpotlight} aria-hidden="true" />

          {/* Settled Editorial Content — Progressively written down as the golden dust moves across */}
          <div className={styles.settleContent}>
            {/* Top Row: Eyebrow + Headline on Left, Editorial Subtitle on Right */}
            <div className={styles.settleTopRow}>
              <div className={styles.settleTopLeft}>
                <div className={styles.settleEyebrowRow}>
                  <span className={styles.settleEyebrowBar} aria-hidden="true" />
                  <span className={styles.settleEyebrowText}>OUR FOCUS AREAS</span>
                </div>
                <h2 className={styles.settleHeadline}>
                  Driving Sustainable
                  <br />
                  Growth in Mining
                </h2>
              </div>

              <div className={styles.settleTopRight}>
                <p className={styles.settleDescription}>
                  We connect industry leaders, foster collaboration and create opportunities for a stronger, more sustainable mining future.
                </p>
              </div>
            </div>

            {/* 4 Pillars Non-Card Editorial Ledger */}
            <div className={styles.settlePillarsRow}>
              {/* Pillar 01 */}
              <div className={styles.settlePillarItem}>
                <span className={styles.settlePillarBadge}>01 — CONFERENCE &amp; POLICY</span>
                <p className={styles.settlePillarCategory}>STRATEGIC ALLIANCE</p>
                <h3 className={styles.settlePillarTitle}>Leading Mining Associations</h3>
                <p className={styles.settlePillarText}>
                  Knowledge sharing, policy alignment, and keynote conference partnerships.
                </p>
                <Link href="/contact" className={styles.settlePillarLink}>
                  <span>EXPLORE ALLIANCE</span>
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>

              {/* Pillar 02 */}
              <div className={styles.settlePillarItem}>
                <span className={styles.settlePillarBadge}>02 — TECH &amp; PLATFORMS</span>
                <p className={styles.settlePillarCategory}>INTEGRATED INFRASTRUCTURE</p>
                <h3 className={styles.settlePillarTitle}>Service &amp; Technology Providers</h3>
                <p className={styles.settlePillarText}>
                  Co-branded digital campaigns, software integration, and investor showcase events.
                </p>
                <Link href="/contact" className={styles.settlePillarLink}>
                  <span>EXPLORE ALLIANCE</span>
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>

              {/* Pillar 03 */}
              <div className={styles.settlePillarItem}>
                <span className={styles.settlePillarBadge}>03 — GROWTH &amp; CAPITAL</span>
                <p className={styles.settlePillarCategory}>CORPORATE EXPANSION</p>
                <h3 className={styles.settlePillarTitle}>Corporate Growth Partners</h3>
                <p className={styles.settlePillarText}>
                  Digital transformation in marketing, corporate re-branding, and liquidity acceleration.
                </p>
                <Link href="/contact" className={styles.settlePillarLink}>
                  <span>EXPLORE ALLIANCE</span>
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>

              {/* Pillar 04 */}
              <div className={styles.settlePillarItem}>
                <span className={styles.settlePillarBadge}>04 — ESG &amp; GOVERNANCE</span>
                <p className={styles.settlePillarCategory}>MARKET INTEGRITY</p>
                <h3 className={styles.settlePillarTitle}>Regulatory &amp; Transparency Bodies</h3>
                <p className={styles.settlePillarText}>
                  Promoting ESG reporting standards, investor trust, and verified market intelligence.
                </p>
                <Link href="/contact" className={styles.settlePillarLink}>
                  <span>EXPLORE ALLIANCE</span>
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </div>
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
