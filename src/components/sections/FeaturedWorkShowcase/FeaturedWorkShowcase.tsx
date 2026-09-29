"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AnimatedMetric } from "@/components/ui/AnimatedMetric";
import styles from "./FeaturedWorkShowcase.module.css";

export interface FeaturedWorkShowcaseProps {
  /** Scroll scrub progress through the chapters (0.0 to 1.0) when standalone */
  scrollProgress?: number;
  /** Section fade opacity (0.0 to 1.0) when standalone */
  opacity?: number;
  /** When true, renders in connected document flow directly underneath the Value Bridge */
  isConnectedFlow?: boolean;
}

interface ChapterData {
  id: string;
  chapterNumber: string;
  category: string;
  ticker: string;
  titleLine1: string;
  titleLine2: string;
  coordinates: string;
  bgImage: string;
  clientName: string;
  storyLead: string;
  storyDetail: string;
  metric1Val: string;
  metric1Lbl: string;
  metric2Val: string;
  metric2Lbl: string;
  deliverables: string;
  align: "heading-left" | "heading-right";
}

const CHAPTERS: ChapterData[] = [
  {
    id: "pan-global",
    chapterNumber: "CHAPTER 01",
    category: "SPAIN // COPPER & GOLD DISCOVERY",
    ticker: "TSX-V: PGZ • OTCQB: PGZFF",
    titleLine1: "DELINEATING SPAIN'S",
    titleLine2: "PREMIER MINERAL DISTRICT",
    coordinates: "LAT 37°31'N / LON 6°19'W // ESCACENA DRILL CORRIDOR",
    bgImage: "/images/chapters/chapter_01_spain.jpg",
    clientName: "Pan Global Resources Inc.",
    storyLead:
      "Translated Escacena’s copper-gold assays into institutional dispatches and European syndication, engaging 45,000+ qualified resource investors.",
    storyDetail: "",
    metric1Val: "C$1.15M",
    metric1Lbl: "Warrant Financing Closed",
    metric2Val: "+185%",
    metric2Lbl: "Institutional Inquiries Lift",
    deliverables: "Executive Video Series • Technical Dispatches • Global Investor Syndication",
    align: "heading-left",
  },
  {
    id: "phenom-resources",
    chapterNumber: "CHAPTER 02",
    category: "NEVADA // CARLIN GOLD & TIER-1 JV",
    ticker: "TSX-V: PHNM • OTCQX: PHNMF",
    titleLine1: "FROM CARLIN TARGETS TO",
    titleLine2: "TIER-1 PRODUCER VALIDATION",
    coordinates: "LAT 40°47'N / LON 116°15'W // CARLIN STRATIGRAPHY",
    bgImage: "/images/chapters/chapter_02_nevada.jpg",
    clientName: "Phenom Resources Corp.",
    storyLead:
      "Positioned deep Carlin-trend geophysics through strategic visual storytelling, accelerating capital placement and securing an SSR Mining Tier-1 JV.",
    storyDetail: "",
    metric1Val: "$1.275M",
    metric1Lbl: "Private Placement Closed",
    metric2Val: "SSR Mining JV",
    metric2Lbl: "Strategic Partner Agreement",
    deliverables: "Geological Visual Storytelling • Private Placement Blitz • Editorial Feature",
    align: "heading-left",
  },
  {
    id: "arizona-gold-silver",
    chapterNumber: "CHAPTER 03",
    category: "ARIZONA // HIGH-GRADE DRILL ASSAYS",
    ticker: "TSX-V: AZS • OTCQB: AZASF",
    titleLine1: "TRANSLATING DRILL CORE ASSAYS",
    titleLine2: "INTO MARKET CONVICTION",
    coordinates: "LAT 35°05'N / LON 114°21'W // PHILADELPHIA VEIN SYSTEM",
    bgImage: "/images/chapters/chapter_03_arizona.jpg",
    clientName: "Arizona Gold & Silver Inc.",
    storyLead:
      "Mapped Philadelphia's bonanza drill intercepts into interactive 3D assays, proving vein continuity and expanding North American desk liquidity.",
    storyDetail: "",
    metric1Val: "+320%",
    metric1Lbl: "Investor Engagement Lift",
    metric2Val: "High-Grade",
    metric2Lbl: "Vein Continuity Proved",
    deliverables: "3D Drill Hole Mapping • Interactive Assays • Mobile Investor Briefs",
    align: "heading-left",
  },
  {
    id: "astra-exploration",
    chapterNumber: "CHAPTER 04",
    category: "CHILE & QUEBEC // BONANZA TO NATIONAL STAGE",
    ticker: "TSX-V: ASTR • OFFICIAL MEDIA ALLIANCE",
    titleLine1: "BRIDGING GRASSROOTS DISCOVERY",
    titleLine2: "WITH BAY STREET TITANS",
    coordinates: "LAT 25°28'S / LON 69°55'W // ATACAMA TO BAY STREET",
    bgImage: "/images/chapters/chapter_04_chile.jpg",
    clientName: "Astra Exploration & National Mining Event",
    storyLead:
      "Expanded discovery reach across Tier-1 institutions through an exclusive multi-year alliance with The Mining Investment Event of the North.",
    storyDetail: "",
    metric1Val: "13.7M+",
    metric1Lbl: "Network Campaign Reach",
    metric2Val: "2-Year Partner",
    metric2Lbl: "Premier Canadian Mining Summit",
    deliverables: "National Summit Coverage • C-Suite Interviews • Institutional Networking",
    align: "heading-left",
  },
];

export const FeaturedWorkShowcase: React.FC<FeaturedWorkShowcaseProps> = ({
  scrollProgress = 0,
  opacity = 1,
  isConnectedFlow = false,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const chapterRefs = useRef<(HTMLElement | null)[]>([]);
  const stackOuterRef = useRef<HTMLDivElement>(null);
  const stackStickyRef = useRef<HTMLDivElement>(null);
  const cardDeckRef = useRef<HTMLDivElement>(null);

  const [headerInView, setHeaderInView] = useState(true);
  const [revealedChapters, setRevealedChapters] = useState<boolean[]>([true, true, true, true]);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const activeChapterRef = useRef<number>(0);
  const currentProgressRef = useRef<number>(0);
  const targetProgressRef = useRef<number>(0);
  const isManualClickRef = useRef<boolean>(false);
  const manualTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastDeckHeightIdx = useRef<number>(-1);

  // Tab click handler with smooth continuous glide
  const handleTabClick = (idx: number) => {
    targetProgressRef.current = idx;
    setActiveChapterIndex(idx);
    activeChapterRef.current = idx;
    setRevealedChapters((prev) => {
      const updated = [...prev];
      updated[idx] = true;
      return updated;
    });
    isManualClickRef.current = true;
    if (manualTimerRef.current) clearTimeout(manualTimerRef.current);
    manualTimerRef.current = setTimeout(() => {
      isManualClickRef.current = false;
    }, 1500);
  };

  // Overall section visibility and opacity
  const clampedOpacity = Math.max(0, Math.min(1, opacity));
  const isVisible = clampedOpacity > 0.01;
  const pointerEvents = clampedOpacity > 0.6 ? "auto" : "none";

  // Translate the alternating chapters track smoothly when in standalone mode
  useEffect(() => {
    if (isConnectedFlow || !trackRef.current || !containerRef.current) return;
    const contentH = trackRef.current.offsetHeight || 2600;
    const clientH = window.innerHeight || 800;
    const maxScroll = Math.max(0, contentH - clientH + 160);
    const scrollY = scrollProgress * maxScroll;
    trackRef.current.style.transform = `translate3d(0, -${scrollY.toFixed(1)}px, 0)`;
  }, [scrollProgress, isConnectedFlow]);

  // Dynamic in-view and active focal depth detection & Continuous Card Stack Glide
  useEffect(() => {
    const updateTransforms = () => {
      const clientH = window.innerHeight || 800;

      // Check header in-view once
      if (!headerInView && headerRef.current) {
        const hRect = headerRef.current.getBoundingClientRect();
        if (hRect.top < clientH * 0.88 && hRect.bottom > 0) {
          setHeaderInView(true);
        }
      }

      // Check card deck dynamic height only when active index changes (eliminates layout thrashing)
      if (activeChapterRef.current !== lastDeckHeightIdx.current) {
        lastDeckHeightIdx.current = activeChapterRef.current;
        const activeEl = chapterRefs.current[activeChapterRef.current];
        if (activeEl && cardDeckRef.current) {
          const h = activeEl.offsetHeight;
          if (h > 0) {
            cardDeckRef.current.style.height = `${h}px`;
            cardDeckRef.current.style.minHeight = `${h}px`;
          }
        }
      }

      // Check stack pinning and continuous scroll progress
      if (stackOuterRef.current && stackStickyRef.current) {
        const outerRect = stackOuterRef.current.getBoundingClientRect();
        const stickyEl = stackStickyRef.current;
        const stickyH = stickyEl.offsetHeight || 620;

        // Position where the card deck pins comfortably below navbar & KPI strip
        const pinTop = Math.max(70, Math.min(130, (clientH - stickyH) / 2));
        const maxTravel = Math.max(0, outerRect.height - stickyH);

        // Distance scrolled past pinTop
        const scrollOffset = pinTop - outerRect.top;
        const clampedOffset = Math.max(0, Math.min(maxTravel, scrollOffset));

        // Pin smoothly inside stackOuter
        stickyEl.style.transform = `translate3d(0, ${clampedOffset.toFixed(1)}px, 0)`;

        // Scroll scrub continuously drives targetProgress (0.0 to 3.0)
        if (!isManualClickRef.current && maxTravel > 0) {
          const progressRatio = Math.max(0, Math.min(1, clampedOffset / maxTravel));
          targetProgressRef.current = progressRatio * 3.0;
        }
      }

      // Fluid lerp: responsive 0.28 for scroll momentum, 0.08 for chapter tab clicks
      const lerpSpeed = isManualClickRef.current ? 0.08 : 0.28;
      const diff = targetProgressRef.current - currentProgressRef.current;
      if (Math.abs(diff) > 0.0002) {
        currentProgressRef.current += diff * lerpSpeed;
      } else {
        currentProgressRef.current = targetProgressRef.current;
      }
      const pVal = currentProgressRef.current;

      // Update active chapter tab pill based on nearest integer
      const nearestIdx = Math.max(0, Math.min(3, Math.round(pVal)));
      if (nearestIdx !== activeChapterRef.current) {
        activeChapterRef.current = nearestIdx;
        setActiveChapterIndex(nearestIdx);
        setRevealedChapters((prev) => {
          if (prev[nearestIdx]) return prev;
          const updated = [...prev];
          updated[nearestIdx] = true;
          return updated;
        });
      }

      // Continuous, fluid downward-to-upward transform for each card
      chapterRefs.current.forEach((el, idx) => {
        if (!el) return;
        const delta = pVal - idx;
        let ty = 0;
        let scale = 1;
        let op = 1;
        let zIndex = 20;

        if (delta < 0) {
          // Upcoming card waiting below or sliding up
          const dist = -delta;
          if (dist >= 1) {
            ty = 108;
            scale = 1;
            op = 0;
            zIndex = 30 + idx;
          } else {
            // Actively gliding upward: 108% -> 0%
            const t = 1 - dist;
            // Smooth Hermite interpolation (smoothstep): continuous velocity with zero flat sticking spots
            const easedT = t * t * (3 - 2 * t);
            ty = (1 - easedT) * 108;
            scale = 1;
            op = Math.min(1, t * 1.8);
            zIndex = 30 + idx;
          }
        } else {
          // Active or preceding card receding upward into the stack behind
          const depth = delta;
          ty = -(depth * 16);
          scale = Math.max(0.92, 1 - depth * 0.02);
          op = Math.max(0.45, 1 - depth * 0.15);
          zIndex = depth < 0.5 ? 20 + idx : 10 + idx;
        }

        const transformStr = delta < 0
          ? `translate3d(0, ${ty.toFixed(2)}%, 0)`
          : `translate3d(0, ${ty.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;

        el.style.transform = transformStr;
        el.style.opacity = op.toFixed(3);
        el.style.zIndex = `${zIndex}`;
        el.style.pointerEvents = delta < -0.5 ? "none" : "auto";
      });
    };

    updateTransforms();
    let rafId: number;
    const loop = () => {
      updateTransforms();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    const handleUserInteraction = () => {
      if (isManualClickRef.current) {
        isManualClickRef.current = false;
        if (manualTimerRef.current) clearTimeout(manualTimerRef.current);
      }
    };

    const handleResize = () => {
      lastDeckHeightIdx.current = -1;
      updateTransforms();
    };

    window.addEventListener("scroll", updateTransforms, { passive: true });
    window.addEventListener("resize", handleResize);
    window.addEventListener("wheel", handleUserInteraction, { passive: true });
    window.addEventListener("touchmove", handleUserInteraction, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", updateTransforms);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("wheel", handleUserInteraction);
      window.removeEventListener("touchmove", handleUserInteraction);
      if (manualTimerRef.current) clearTimeout(manualTimerRef.current);
    };
  }, [scrollProgress, headerInView]);

  const innerContent = (
    <>
      {/* Top Header — Pure Editorial Typography with Masked Line Reveals */}
      <header
        ref={headerRef}
        className={`${styles.header} ${headerInView ? styles.inView : ""}`}
      >
        <div className={styles.eyebrowRow}>
          <span className={styles.eyebrowRule} />
          <span className={styles.eyebrowText}>
            THE METHODOLOGY IN ACTION // FIELDWORK TO VALUATION
          </span>
          <span className={styles.eyebrowRule} />
        </div>

        <h2 className={styles.mainTitle}>
          <span className={styles.maskWrapper}>
            <span className={`${styles.maskedLine} ${styles.line1}`}>
              WHERE HIGH-GRADE EXPLORATION
            </span>
          </span>
          <span className={styles.maskWrapper}>
            <span className={`${styles.maskedLine} ${styles.line2}`}>
              MEETS <em className={styles.shimmerText}>REAL CAPITAL.</em>
            </span>
          </span>
        </h2>

        <p className={styles.description}>
          Junior miners rarely struggle because their rocks lack metal—they struggle when the
          market fails to grasp the scale of what they’ve uncovered. Here is how our capital bridge
          turns drill core assays into institutional conviction, active liquidity, and Tier-1 joint ventures.
        </p>

        {/* Minimal Editorial KPI Strip with Animated Count-Ups and Laser Dividers */}
        <div className={styles.editorialMetricsStrip}>
          <div className={styles.editorialMetric}>
            <AnimatedMetric
              value="13.7M+"
              inView={headerInView}
              className={styles.metricBigVal}
            />
            <span className={styles.metricSubLbl}>Targeted Investor Views</span>
          </div>
          <div className={styles.metricSeparator} />
          <div className={styles.editorialMetric}>
            <AnimatedMetric
              value="+120%"
              inView={headerInView}
              className={styles.metricBigVal}
            />
            <span className={styles.metricSubLbl}>Lead Generation Surge</span>
          </div>
          <div className={styles.metricSeparator} />
          <div className={styles.editorialMetric}>
            <AnimatedMetric
              value="13,780"
              inView={headerInView}
              className={styles.metricBigVal}
            />
            <span className={styles.metricSubLbl}>Watch Hours Logged</span>
          </div>
          <div className={styles.metricSeparator} />
          <div className={styles.editorialMetric}>
            <AnimatedMetric
              value="500K+"
              inView={headerInView}
              className={styles.metricBigVal}
            />
            <span className={styles.metricSubLbl}>Global Mining Network</span>
          </div>
        </div>
      </header>

      {/* Card Stack Scroll Track Container (Comfortable scroll travel for user) */}
      <div ref={stackOuterRef} className={styles.stackOuter}>
        {/* Sticky Deck Wrapper: Keeps tabs and active card deck pinned together */}
        <div ref={stackStickyRef} className={styles.stackSticky}>
          <div ref={cardDeckRef} className={styles.cardDeck}>
            {CHAPTERS.map((chapter, idx) => {
              const isHeadingLeft = chapter.align === "heading-left";
              const isRevealed = revealedChapters[idx];
              const isActive = activeChapterIndex === idx;
              const isPreceding = idx < activeChapterIndex;

              return (
                <section
                  key={chapter.id}
                  ref={(el) => {
                    chapterRefs.current[idx] = el;
                  }}
                  onClick={() => {
                    if (isPreceding) handleTabClick(idx);
                  }}
                  className={`${styles.alternatingRow} ${styles.stackCard} ${
                    isHeadingLeft ? styles.rowHeadingLeft : styles.rowHeadingRight
                  } ${isRevealed ? styles.rowRevealed : ""} ${
                    isActive ? styles.rowActive : ""
                  } ${isPreceding ? styles.rowPreceding : ""}`}
                >
                  {/* Subtle active notch / dot indicator at top-left matching user screenshot */}
                  <div className={styles.cardHeaderNotch} aria-hidden="true">
                    <span className={styles.notchDot} />
                  </div>

                  {/* Dedicated Chapter Background Image strictly contained within its row */}
                  <div className={styles.chapterBgWrap} aria-hidden="true">
                    <img
                      src={chapter.bgImage}
                      alt=""
                      className={styles.chapterBgImg}
                      loading="lazy"
                    />
                    <div className={styles.chapterBgOverlay} />
                  </div>

                  {/* Subtle Atmospheric Coordinate Watermark */}
                  <div className={styles.geoWatermark} aria-hidden="true">
                    {chapter.coordinates}
                  </div>

                  {/* Heading Block */}
                  <div className={styles.headingColumn}>
                    <div className={styles.metaRow}>
                      <span className={styles.chapterNum}>{chapter.chapterNumber}</span>
                      <span className={styles.metaDivider}>/</span>
                      <span className={styles.categoryTag}>{chapter.category}</span>
                    </div>

                    <h3 className={styles.chapterTitle}>
                      <span className={styles.maskWrapper}>
                        <span className={`${styles.maskedLine} ${styles.line1}`}>
                          {chapter.titleLine1}
                        </span>
                      </span>
                      <span className={styles.maskWrapper}>
                        <span className={`${styles.maskedLine} ${styles.line2}`}>
                          {chapter.titleLine2}
                        </span>
                      </span>
                    </h3>

                    <div className={styles.clientDetails}>
                      <span className={styles.clientName}>{chapter.clientName}</span>
                      <span className={styles.tickerText}>{chapter.ticker}</span>
                    </div>
                  </div>

                  {/* Content Block — Pure Narrative (3 lines) & Dynamic Animated Metrics */}
                  <div className={styles.contentColumn}>
                    <p className={styles.storyLead}>{chapter.storyLead}</p>

                    {/* Clean Typographic Metrics Line with Count-Ups and Laser Divider */}
                    <div className={styles.textMetricsLine}>
                      <div className={styles.textMetricCol}>
                        <AnimatedMetric
                          value={chapter.metric1Val}
                          inView={isRevealed}
                          className={styles.textMetricNum}
                        />
                        <span className={styles.textMetricLbl}>{chapter.metric1Lbl}</span>
                      </div>

                      <div className={styles.textMetricDivider} />

                      <div className={styles.textMetricCol}>
                        <AnimatedMetric
                          value={chapter.metric2Val}
                          inView={isRevealed}
                          className={styles.textMetricNum}
                        />
                        <span className={styles.textMetricLbl}>{chapter.metric2Lbl}</span>
                      </div>
                    </div>

                    {/* Deliverables Meta Line */}
                    <div className={styles.deliverablesLine}>
                      <span className={styles.deliverablesTag}>DELIVERABLES:</span>
                      <span className={styles.deliverablesContent}>{chapter.deliverables}</span>
                    </div>

                    <Link href="/work" className={styles.readStoryLink}>
                      <span>Read case narrative</span>
                      <ArrowUpRight size={15} />
                    </Link>
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>

      {/* Minimal Editorial Footer Divider */}
      <footer className={styles.editorialFooter}>
        <div className={styles.footerRule} />
        <div className={styles.footerContent}>
          <span className={styles.footerBadge}>OFFICIAL MEDIA PARTNER</span>
          <p className={styles.footerText}>
            The Mining Investment Event of the North (Quebec City) — Collaborating with Glencore,
            Agnico Eagle, AtkinsRéalis, Stifel, and TMX.
          </p>
        </div>
        <div className={styles.footerRule} />
      </footer>
    </>
  );

  if (isConnectedFlow) {
    return (
      <section
        className={styles.featuredWorkSection}
        aria-label="Client Case Studies & Market Performance"
      >
        {/* Subtle Architectural Coordinate Grid on Deep Mineral Blue */}
        <div className={styles.gridOverlay} aria-hidden="true">
          <div className={styles.gridLine} />
          <div className={styles.gridLine} />
          <div className={styles.gridLine} />
          <div className={styles.gridLine} />
        </div>

        <div className={styles.sectionInner}>{innerContent}</div>
      </section>
    );
  }

  return (
    <div
      ref={containerRef}
      className={styles.showcaseContainer}
      style={{
        backgroundColor: "#1A1512",
        opacity: clampedOpacity.toFixed(3),
        visibility: isVisible ? "visible" : "hidden",
        pointerEvents: pointerEvents as "auto" | "none",
      }}
      aria-label="Client Case Studies & Market Performance"
      aria-hidden={!isVisible}
    >
      {/* Subtle Architectural Coordinate Grid */}
      <div className={styles.gridOverlay} aria-hidden="true">
        <div className={styles.gridLine} />
        <div className={styles.gridLine} />
        <div className={styles.gridLine} />
        <div className={styles.gridLine} />
      </div>

      {/* Normal vertical scroll track */}
      <div ref={trackRef} className={styles.scrollTrack}>
        {innerContent}
      </div>
    </div>
  );
};

export default FeaturedWorkShowcase;
