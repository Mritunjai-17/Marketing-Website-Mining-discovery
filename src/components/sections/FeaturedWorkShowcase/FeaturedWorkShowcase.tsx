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
      "We transformed Pan Global's Escacena copper-gold technical assays into institutional executive video dispatches and direct European syndication, engaging 45,000+ investors and driving oversubscribed C$1.15M warrant funding.",
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
      "We translated Phenom's deep Carlin-trend geophysics into clear visual storytelling and strategic market spotlights, accelerating a $1.275M private placement and negotiating a Tier-1 JV with SSR Mining.",
    storyDetail: "",
    metric1Val: "$1.275M",
    metric1Lbl: "Private Placement Closed",
    metric2Val: "SSR Mining JV",
    metric2Lbl: "Strategic Partner Agreement",
    deliverables: "Geological Visual Storytelling • Private Placement Blitz • Editorial Feature",
    align: "heading-right",
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
      "We mapped Philadelphia's bonanza drill intercepts into interactive 3D assays and mobile briefs, proving vein continuity to North American desks, expanding qualified engagement +320% and stabilizing liquidity.",
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
      "Alongside generating millions of campaign impressions for Astra, Mining Discovery signed an exclusive 2-year partnership with The Mining Investment Event of the North, placing client assets directly before Tier-1 institutional leaders.",
    storyDetail: "",
    metric1Val: "13.7M+",
    metric1Lbl: "Network Campaign Reach",
    metric2Val: "2-Year Partner",
    metric2Lbl: "Premier Canadian Mining Summit",
    deliverables: "National Summit Coverage • C-Suite Interviews • Institutional Networking",
    align: "heading-right",
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

  const [headerInView, setHeaderInView] = useState(true);
  const [revealedChapters, setRevealedChapters] = useState<boolean[]>([true, true, true, true]);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);

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

  // Dynamic in-view and active focal depth detection
  useEffect(() => {
    const checkPositions = () => {
      const clientH = window.innerHeight || 800;

      // Check header in-view
      if (headerRef.current) {
        const hRect = headerRef.current.getBoundingClientRect();
        if (hRect.top < clientH * 0.88 && hRect.bottom > 0) {
          setHeaderInView(true);
        }
      }

      // Check chapters for reveal and focal depth
      let bestDist = Infinity;
      let closestIdx = 0;

      chapterRefs.current.forEach((el, idx) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();

        // Reveal chapter when it approaches viewport
        if (rect.top < clientH * 0.88 && rect.bottom > clientH * 0.08) {
          setRevealedChapters((prev) => {
            if (prev[idx]) return prev;
            const updated = [...prev];
            updated[idx] = true;
            return updated;
          });
        }

        // Focal depth: calculate distance from screen vertical center
        const elCenter = rect.top + rect.height / 2;
        const screenCenter = clientH * 0.52;
        const dist = Math.abs(elCenter - screenCenter);

        if (dist < bestDist && rect.bottom > clientH * 0.2 && rect.top < clientH * 0.8) {
          bestDist = dist;
          closestIdx = idx;
        }
      });

      if (bestDist < clientH * 0.5) {
        setActiveChapterIndex(closestIdx);
      }
    };

    checkPositions();
    const rafId = requestAnimationFrame(checkPositions);
    window.addEventListener("scroll", checkPositions, { passive: true });
    window.addEventListener("resize", checkPositions);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", checkPositions);
      window.removeEventListener("resize", checkPositions);
    };
  }, [scrollProgress]);

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

      {/* Alternating Pure-Text Chapters with Kinetic Reveals and Focal Spotlight */}
      <div className={styles.chaptersStack}>
        {CHAPTERS.map((chapter, idx) => {
          const isHeadingLeft = chapter.align === "heading-left";
          const isRevealed = revealedChapters[idx];
          const isActive = activeChapterIndex === idx;

          return (
            <section
              key={chapter.id}
              ref={(el) => {
                chapterRefs.current[idx] = el;
              }}
              className={`${styles.alternatingRow} ${isHeadingLeft ? styles.rowHeadingLeft : styles.rowHeadingRight
                } ${isRevealed ? styles.rowRevealed : ""} ${isActive ? styles.rowActive : ""
                }`}
            >
              {/* Dedicated Chapter Background Image strictly contained within its row — Zero overlap */}
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
        backgroundColor: "#18222B",
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
