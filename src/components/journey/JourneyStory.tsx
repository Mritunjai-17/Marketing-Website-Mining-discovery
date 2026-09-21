"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { X, Newspaper, BookOpen, TrendingUp, Globe, Sparkles, ChevronLeft, ChevronRight, ArrowRight, Maximize2 } from "lucide-react";
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
import { WorkerPullRig, type WorkerPullRigHandle } from "./WorkerPullRig";

const MILESTONE_ICONS = [TrendingUp, Newspaper, BookOpen, Globe, Sparkles, Sparkles];

export interface ServiceCardItem {
  id: string;
  num: string;
  category: string;
  title: string;
  italicTitle: string;
  metaPrice: string;
  metaSeason: string;
  summary: string;
  description: string;
  image: string;
  badge: string;
  features: {
    title: string;
    text: string;
  }[];
  ctaText: string;
  ctaHref: string;
}

export const SERVICE_CARDS: ServiceCardItem[] = [
  {
    id: "investor-growth",
    num: "01",
    category: "CAPITAL & INVESTOR REACH",
    title: "Investor Growth",
    italicTitle: "Investor Growth",
    metaPrice: "CAPITAL STRATEGY",
    metaSeason: "GLOBAL OUTREACH",
    summary: "TURN MINING OPPORTUNITIES INTO INVESTOR ATTENTION.",
    description:
      "Connect mining projects with relevant investors, stakeholders and decision-makers through focused investor campaigns and global industry outreach.",
    image: "/images/services/service_01_investor_light.jpg",
    badge: "01 / CAPITAL & INVESTOR REACH",
    features: [
      {
        title: "INVESTOR CAMPAIGNS",
        text: "Targeted campaigns designed to communicate the opportunity and story behind mining projects to relevant audiences.",
      },
      {
        title: "GLOBAL OUTREACH",
        text: "Extend project visibility across international mining audiences and create connections with global stakeholders.",
      },
    ],
    ctaText: "DISCUSS INVESTOR OUTREACH",
    ctaHref: "/contact",
  },
  {
    id: "media-authority",
    num: "02",
    category: "CREDIBILITY & INDUSTRY PRESENCE",
    title: "Media Authority",
    italicTitle: "Media Authority",
    metaPrice: "TIER-1 SYNDICATION",
    metaSeason: "CONFERENCE MEDIA",
    summary: "BUILD AUTHORITY ACROSS THE MINING MEDIA LANDSCAPE.",
    description:
      "Strengthen credibility and visibility through mining media coverage, press communication and conference presence.",
    image: "/images/services/service_02_media_light.jpg",
    badge: "02 / CREDIBILITY & INDUSTRY PRESENCE",
    features: [
      {
        title: "NEWS & SYNDICATION",
        text: "Direct editorial syndication into Bloomberg, Reuters, Mining Journal and Tier-1 terminals.",
      },
      {
        title: "PRESS & CONFERENCE",
        text: "Communicate key milestones and amplify the impact of mining stories through media coverage and industry events.",
      },
    ],
    ctaText: "ELEVATE YOUR MEDIA PROFILE",
    ctaHref: "/contact",
  },
  {
    id: "brand-digital",
    num: "03",
    category: "IDENTITY & CREATIVE PRESENCE",
    title: "Brand & Digital",
    italicTitle: "Brand & Digital",
    metaPrice: "DIGITAL IDENTITY",
    metaSeason: "3D VISUALIZATION",
    summary: "BUILD A DISTINCTIVE DIGITAL IDENTITY FOR MINING.",
    description:
      "Build a distinctive visual and digital identity that makes mining companies easier to recognise, understand and remember.",
    image: "/images/services/service_03_brand_light.jpg",
    badge: "03 / IDENTITY & CREATIVE PRESENCE",
    features: [
      {
        title: "DIGITAL BRANDING",
        text: "Modern visual identity, corporate presentations, and investor-facing digital assets.",
      },
      {
        title: "MULTIMEDIA PRODUCTION",
        text: "High-impact cinematography, drone mapping, and interactive mining asset models.",
      },
    ],
    ctaText: "EXPLORE BRAND SOLUTIONS",
    ctaHref: "/contact",
  },
  {
    id: "audience-reach",
    num: "04",
    category: "REACH & AMPLIFICATION",
    title: "Audience Reach",
    italicTitle: "Audience Reach",
    metaPrice: "40,000+ NETWORK",
    metaSeason: "PAID AMPLIFICATION",
    summary: "EXPAND YOUR REACH. OWN YOUR AUDIENCE.",
    description:
      "Turn content into measurable audience growth through targeted social campaigns, network distribution and paid promotion.",
    image: "/images/services/service_04_reach_light.jpg",
    badge: "04 / REACH & AMPLIFICATION",
    features: [
      {
        title: "SOCIAL GROWTH & ADS",
        text: "Targeted campaigns engaging family offices, brokers and institutional mining investors.",
      },
      {
        title: "NETWORK DISTRIBUTION",
        text: "Direct weekly newsletter reaching 40,000+ active mining decision-makers and brokers.",
      },
    ],
    ctaText: "SCALE YOUR REACH",
    ctaHref: "/contact",
  },
  {
    id: "mining-intelligence",
    num: "05",
    category: "MARKET DATA & INSIGHTS",
    title: "Mining Intelligence",
    italicTitle: "Mining Intelligence",
    metaPrice: "30+ JURISDICTIONS",
    metaSeason: "AI SENTIMENT",
    summary: "AI-DRIVEN INSIGHTS AND GLOBAL JURISDICTION DATA.",
    description:
      "Access proprietary market sentiment, real-time commodity data and regulatory intelligence across 30+ mining jurisdictions.",
    image: "/images/services/service_05_intelligence_light.jpg",
    badge: "05 / MARKET DATA & INSIGHTS",
    features: [
      {
        title: "EXECUTIVE BRIEFINGS",
        text: "Real-time market intel, commodity tracking, and strategic transaction analysis.",
      },
      {
        title: "STRATEGIC ANALYTICS",
        text: "AI sentiment models tracking global mining momentum and investor perception.",
      },
    ],
    ctaText: "ACCESS INTELLIGENCE",
    ctaHref: "/contact",
  },
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

  // Settle stage, controls, and interactive elements
  const settleStageRef = useRef<HTMLDivElement>(null);
  const workerRigRef = useRef<WorkerPullRigHandle>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const creasesOverlayRef = useRef<HTMLDivElement>(null);
  const grommetRef = useRef<HTMLDivElement>(null);

  // Interactive mouse tracker for spotlight and mountain parallax
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

  // 5 Services Flick Accordion (White Desert Luxury Style)
  // Default to 2 (Page 3 active in center, matching user screenshot)
  const [activeService, setActiveService] = useState(2);
  const activeServiceRef = useRef(2);

  // When a card is clicked, that same card expands to cover the screen
  const [expandedService, setExpandedService] = useState<number | null>(null);

  const handleCardSelect = useCallback((idx: number) => {
    if (activeServiceRef.current !== idx) {
      activeServiceRef.current = idx;
      setActiveService(idx);
    }
  }, []);

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

  // Handle Escape key to collapse expanded service card
  useEffect(() => {
    if (expandedService !== null) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setExpandedService(null);
        }
      };
      window.addEventListener("keydown", handleKeyDown);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [expandedService]);

  useJourneyFrame((scene) => {
    const p = scene.progress;

    // 1. Under-road horizontal milestone cards:
    // When camera is far, NO text is shown! After camera zooms down (descent >= 0.82), text smoothly reveals!
    // And fades out as road turns downward (p >= 0.82 to 0.86)
    if (underRoadRef.current) {
      const descentP = scene.descent ?? 1.0;
      const zoomReveal = smoothstep(0.82, 0.89, descentP);
      const underRoadFade = (1 - smoothstep(0.82, 0.86, p)) * zoomReveal;
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

        // Auto-scroll the stats track upward from the bottom in lockstep with the truck driving down the road
        if (statsTrackRef.current) {
          const statsProgress = Math.max(0, Math.min(1, (p - 0.90) / 0.024));
          const maxScroll = Math.max(0, statsTrackRef.current.scrollHeight - statsTrackRef.current.clientHeight);
          statsTrackRef.current.scrollTop = statsProgress * maxScroll;
        }

        // Entrance upward float: text gracefully rises up as truck begins vertical highway run
        if (leftColRef.current) {
          const enterY = (1 - fadeIn) * 20;
          leftColRef.current.style.transform = `translate3d(0, ${enterY.toFixed(1)}px, 0)`;
        }
        if (rightColRef.current) {
          const enterY = (1 - fadeIn) * 32;
          rightColRef.current.style.transform = `translate3d(0, ${enterY.toFixed(1)}px, 0)`;
        }
      } else {
        opacity = 0;
      }

      secondPartRef.current.style.opacity = opacity.toFixed(3);
      secondPartRef.current.style.pointerEvents = opacity > 0.5 ? "auto" : "none";
    }

    // Smooth mouse lerp for interactive dynamic spotlight and parallax
    const m = mousePosRef.current;
    m.x += (m.targetX - m.x) * 0.08;
    m.y += (m.targetY - m.y) * 0.08;
    m.px += (m.targetPx - m.px) * 0.08;
    m.py += (m.targetPy - m.py) * 0.08;

    if (spotlightRef.current) {
      if (p < 0.934) {
        spotlightRef.current.style.opacity = "0";
      } else {
        const spotAlpha = Math.min(1, (p - 0.934) / 0.015);
        spotlightRef.current.style.opacity = spotAlpha.toFixed(3);
        spotlightRef.current.style.background = `radial-gradient(circle 540px at ${(m.x * 100).toFixed(1)}% ${(m.y * 100).toFixed(1)}%, rgba(212, 175, 55, 0.16) 0%, rgba(212, 175, 55, 0.05) 45%, transparent 75%)`;
      }
    }

    // ====================================================================
    // CINEMATIC 3D HORIZONTAL SERVICES SECTION (PULLED BY 3D WORKER)
    // ====================================================================
    if (settleStageRef.current) {
      const winW = typeof window !== "undefined" ? window.innerWidth : 1440;
      const winH = typeof window !== "undefined" ? window.innerHeight : 900;

      if (p < 0.934) {
        settleStageRef.current.style.opacity = "0";
        settleStageRef.current.style.pointerEvents = "none";
        settleStageRef.current.style.transform = `translate3d(${winW}px, 0, 0)`;
        settleStageRef.current.style.clipPath = "none";
        if (creasesOverlayRef.current) creasesOverlayRef.current.style.opacity = "0";
        if (grommetRef.current) grommetRef.current.style.opacity = "0";
        workerRigRef.current?.update(0, winW, winW, winH, 0, 0, false, 0);
      } else if (p >= 0.934 && p < 0.966) {
        const progress = Math.max(0, Math.min(1, (p - 0.934) / (0.966 - 0.934)));
        const isMobile = winW < 640;

        // Phase split:
        // 0.00 to 0.74: The webpage physically slides in horizontally from right to left (panelEdgeX: winW -> 0)
        // 0.74 to 1.00: ONCE THE PAGE REACHES ITS FINAL POSITION (panelEdgeX = 0):
        //               - The worker releases the rope (slack gravity sag & falls away)
        //               - The page settles with a subtle bounce (elastic spring damped oscillation)
        const PULL_COMPLETE = 0.74;

        let panelEdgeX = 0;
        let bounceX = 0;
        let topLag = 0;
        let bottomLag = 0;
        let isReleasing = false;
        let releaseProgress = 0;

        if (progress < PULL_COMPLETE) {
          const pullP = progress / PULL_COMPLETE;
          const easePull = pullP < 0.5
            ? 2 * pullP * pullP
            : 1 - Math.pow(-2 * pullP + 2, 2) / 2;
          panelEdgeX = (1 - easePull) * winW;

          topLag = (1 - pullP) * Math.min(220, winW * 0.15);
          bottomLag = (1 - pullP) * Math.min(320, winW * 0.22);

          const tensionFade = Math.max(0, 1 - Math.pow(pullP, 2.2));
          if (creasesOverlayRef.current) {
            creasesOverlayRef.current.style.opacity = tensionFade.toFixed(3);
          }
          if (grommetRef.current) {
            grommetRef.current.style.opacity = "1";
          }

          isReleasing = false;
          releaseProgress = 0;
        } else {
          panelEdgeX = 0;
          isReleasing = true;
          releaseProgress = (progress - PULL_COMPLETE) / (1 - PULL_COMPLETE);

          const bounceAmp = isMobile ? -8 : -12;
          bounceX = bounceAmp * Math.sin(releaseProgress * 2.2 * Math.PI) * Math.exp(-releaseProgress * 3.2);

          topLag = Math.max(0, 1 - releaseProgress * 2.2) * Math.min(30, winW * 0.02);
          bottomLag = Math.max(0, 1 - releaseProgress * 2.2) * Math.min(45, winW * 0.03);

          if (creasesOverlayRef.current) {
            creasesOverlayRef.current.style.opacity = Math.max(0, 1 - releaseProgress * 2.5).toFixed(3);
          }
          if (grommetRef.current) {
            grommetRef.current.style.opacity = Math.max(0, 1 - releaseProgress * 2.0).toFixed(3);
          }
        }

        if (releaseProgress >= 0.5) {
          settleStageRef.current.style.clipPath = "none";
        } else {
          const grommetY = winH * (isMobile ? 0.54 : 0.56);
          const pts: string[] = [];
          pts.push(`${topLag.toFixed(1)}px 0px`);
          for (let i = 1; i <= 4; i++) {
            const t = i / 5;
            const cy = grommetY * t;
            const cx = topLag * (1 - t) * (1 - 0.72 * t);
            pts.push(`${cx.toFixed(1)}px ${cy.toFixed(1)}px`);
          }
          pts.push(`0px ${grommetY.toFixed(1)}px`);
          for (let j = 1; j <= 3; j++) {
            const u = j / 4;
            const dy = grommetY + (winH - grommetY) * u;
            const dx = bottomLag * u;
            pts.push(`${dx.toFixed(1)}px ${dy.toFixed(1)}px`);
          }
          pts.push(`${bottomLag.toFixed(1)}px 100%`);
          pts.push(`100% 100%`);
          pts.push(`100% 0px`);

          settleStageRef.current.style.clipPath = `polygon(${pts.join(", ")})`;
        }

        settleStageRef.current.style.opacity = "1";
        settleStageRef.current.style.transform = `translate3d(${(panelEdgeX + bounceX).toFixed(1)}px, 0, 0)`;
        settleStageRef.current.style.pointerEvents = "auto";
        workerRigRef.current?.update(progress, panelEdgeX, winW, winH, topLag, bottomLag, isReleasing, releaseProgress);

      } else {
        settleStageRef.current.style.opacity = "1";
        settleStageRef.current.style.transform = "translate3d(0, 0, 0)";
        settleStageRef.current.style.clipPath = "none";
        settleStageRef.current.style.pointerEvents = "auto";
        if (creasesOverlayRef.current) creasesOverlayRef.current.style.opacity = "0";
        if (grommetRef.current) grommetRef.current.style.opacity = "0";
        workerRigRef.current?.update(1.0, 0, winW, winH, 0, 0, true, 1.0);
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

      {/* Realistic 3D Worker Pull Rig (positioned in the background behind the page) */}
        <WorkerPullRig ref={workerRigRef} />

        {/* MOUNTAIN LANDSCAPE & EDITORIAL SETTLE STAGE (rendered in front of the worker) */}
        <div ref={settleStageRef} className={styles.settleMountainStage}>
          {/* Photorealistic Silver Chrome Grommet Ring punched on the page leading edge */}
          <div ref={grommetRef} className={styles.settleEdgeGrommet} aria-hidden="true">
            <img
              src="/images/page_pull_grommet.png"
              alt=""
              className={styles.settleGrommetImg}
            />
          </div>

          {/* Photorealistic Silk/Paper Tension Folds Overlay during Pull */}
          <div ref={creasesOverlayRef} className={styles.settleCreasesOverlay} aria-hidden="true" />

          {/* Subtle Architectural Grid Lines Overlay (White Desert Light Theme) */}
          <div className={styles.lightGridOverlay} aria-hidden="true">
            <div className={styles.lightGridLine} />
            <div className={styles.lightGridLine} />
            <div className={styles.lightGridLine} />
            <div className={styles.lightGridLine} />
            <div className={styles.lightGridLine} />
            <div className={styles.lightGridLine} />
          </div>

          {/* Light Theme Services Section Container */}
          <div className={styles.lightServicesContainer}>
            {/* Top Centered Header */}
            {/* Top Centered Header - Big Prominent "OUR SERVICES" */}
            <div className={styles.lightServicesHeader}>
              <div className={styles.lightEyebrowRow}>
                <span className={styles.lightEyebrowRule} aria-hidden="true" />
                <h2 className={styles.lightServicesBigTitle}>OUR SERVICES</h2>
                <span className={styles.lightEyebrowRule} aria-hidden="true" />
              </div>
            </div>

            {/* 5-Panel Expandable Flick Accordion Grid (Pages 1 to 5) */}
            <div
              className={`${styles.cardFlickWrap} ${expandedService !== null ? styles.cardFlickWrapExpanded : ""}`}
              role="region"
              aria-label="Services Showcase"
            >
              <div className={`${styles.cardFlickGrid} ${expandedService !== null ? styles.cardFlickGridExpanded : ""}`}>
                {SERVICE_CARDS.map((card, idx) => {
                  const isExpanded = expandedService === idx;
                  const isCollapsed = expandedService !== null && !isExpanded;
                  const isActive = isExpanded || (expandedService === null && activeService === idx);

                  return (
                    <div
                      key={card.id}
                      className={`${styles.cardFlickItem} ${
                        isExpanded
                          ? styles.cardFlickItemExpanded
                          : isCollapsed
                          ? styles.cardFlickItemCollapsed
                          : isActive
                          ? styles.cardFlickItemActive
                          : ""
                      }`}
                      onMouseEnter={() => {
                        if (expandedService === null) handleCardSelect(idx);
                      }}
                      onMouseMove={() => {
                        if (expandedService === null) handleCardSelect(idx);
                      }}
                      onPointerEnter={() => {
                        if (expandedService === null) handleCardSelect(idx);
                      }}
                      onPointerOver={() => {
                        if (expandedService === null) handleCardSelect(idx);
                      }}
                      onPointerDown={() => {
                        if (expandedService === null) handleCardSelect(idx);
                      }}
                      onTouchStart={() => {
                        if (expandedService === null) handleCardSelect(idx);
                      }}
                      onClick={() => {
                        if (expandedService === null) {
                          if (activeService !== idx) {
                            handleCardSelect(idx);
                          } else {
                            setExpandedService(idx);
                          }
                        }
                      }}
                      role="tabpanel"
                      aria-selected={isActive}
                      tabIndex={0}
                    >
                      {/* Full-bleed Background Image */}
                      <div className={styles.cardFlickImage}>
                        <img
                          src={card.image}
                          alt={card.title}
                          loading="lazy"
                        />
                        <div className={styles.cardFlickGradient} />
                      </div>

                      {/* Gaussian Blur Overlay for Side (Inactive) Pages */}
                      <div className={styles.cardFlickBlurOverlay} aria-hidden="true" />

                      {/* Content on the Active / Expanded Page */}
                      <div className={styles.cardFlickContent}>
                        <div className={styles.cardFlickHeader}>
                          <div className={styles.cardFlickHeaderRow}>
                            <span className={styles.cardFlickBadge}>
                              <span className={styles.cardFlickBadgeNum}>{card.num}</span>
                              <span className={styles.cardFlickBadgeText}>{card.category}</span>
                            </span>
                            {isExpanded && (
                              <button
                                type="button"
                                className={styles.cardFlickCloseBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedService(null);
                                }}
                                aria-label="Collapse"
                              >
                                <X size={18} />
                                <span>CLOSE</span>
                              </button>
                            )}
                          </div>
                          <h3 className={styles.cardFlickTitle}>
                            {card.italicTitle}
                          </h3>
                        </div>

                        <div className={styles.cardFlickFooter}>
                          <div className={styles.cardFlickMeta}>
                            <span className={styles.cardFlickMetaItem}>{card.metaPrice}</span>
                            <span className={styles.cardFlickMetaDivider} aria-hidden="true" />
                            <span className={styles.cardFlickMetaItem}>{card.metaSeason}</span>
                          </div>

                          <Link
                            href="/contact"
                            className={styles.cardFlickLearnMore}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span>Learn More</span>
                            <span className={styles.cardFlickLearnMoreStar}>✦</span>
                          </Link>

                          <p className={styles.cardFlickExcerpt}>
                            {card.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
