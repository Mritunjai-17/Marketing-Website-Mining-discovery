"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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
    clientName: "Pan Global Resources Inc.",
    storyLead:
      "When Pan Global began hitting high-grade copper and gold at Escacena, the challenge wasn't the geology—it was cutting through market noise and getting European and North American institutional desks to pay attention before financing windows closed.",
    storyDetail:
      "We took their complex technical assays and built an undeniable market narrative across executive video dispatches and direct institutional syndication. The result was over 45,000 engaged investors and immediate participation in their C$1.15M warrant funding round.",
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
    clientName: "Phenom Resources Corp.",
    storyLead:
      "Exploring deep Carlin-type gold systems in Nevada takes immense technical discipline. But retail shareholders rarely read 40-page geophysical reports, and institutional backers needed clarity on the path toward a major discovery.",
    storyDetail:
      "We transformed Phenom's technical drill data into clear visual storytelling and strategic dispatches. That focused spotlight helped Phenom close a $1.275M private placement and negotiate an executed strategic JV agreement with Tier-1 producer SSR Mining.",
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
    clientName: "Arizona Gold & Silver Inc.",
    storyLead:
      "A 10-meter intercept of bonanza-grade gold means nothing if the broader market never understands its continuity. Arizona Gold & Silver had exceptional assays at Philadelphia, but needed sustained liquidity and trading interest.",
    storyDetail:
      "We mapped their drill holes and vein structures into interactive 3D visualizations and concise mobile dispatches. By showing investors exactly where the drill was turning, qualified investor engagement leaped +320% and trading liquidity stabilized.",
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
    clientName: "Astra Exploration & National Mining Event",
    storyLead:
      "Whether announcing bonanza gold-silver veins at Pampa Paciencia in Chile or hosting international mining dignitaries in Quebec City, real market momentum comes from being in the right room with the right decision-makers.",
    storyDetail:
      "Alongside generating millions of campaign impressions for Astra, Mining Discovery signed an exclusive 2-year media partnership for The Mining Investment Event of the North—putting our partner companies directly alongside Glencore, Agnico Eagle, and Bay Street leaders.",
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

  const innerContent = (
    <>
      {/* Top Header — Pure Editorial Typography Connecting Methodology to Execution */}
      <header className={styles.header}>
        <div className={styles.eyebrowRow}>
          <span className={styles.eyebrowRule} />
          <span className={styles.eyebrowText}>
            THE METHODOLOGY IN ACTION // FIELDWORK TO VALUATION
          </span>
          <span className={styles.eyebrowRule} />
        </div>

        <h2 className={styles.mainTitle}>
          <span className={styles.titleLine}>WHERE HIGH-GRADE EXPLORATION</span>
          <span className={styles.titleLine}>MEETS <em>REAL CAPITAL.</em></span>
        </h2>

        <p className={styles.description}>
          Junior miners rarely struggle because their rocks lack metal—they struggle when the
          market fails to grasp the scale of what they’ve uncovered. Here is how our capital bridge
          turns drill core assays into institutional conviction, active liquidity, and Tier-1 joint ventures.
        </p>

        {/* Minimal Editorial KPI Strip — Pure Text, No Card Boxes */}
        <div className={styles.editorialMetricsStrip}>
          <div className={styles.editorialMetric}>
            <span className={styles.metricBigVal}>13.7M+</span>
            <span className={styles.metricSubLbl}>Targeted Investor Views</span>
          </div>
          <div className={styles.metricSeparator} />
          <div className={styles.editorialMetric}>
            <span className={styles.metricBigVal}>+120%</span>
            <span className={styles.metricSubLbl}>Lead Generation Surge</span>
          </div>
          <div className={styles.metricSeparator} />
          <div className={styles.editorialMetric}>
            <span className={styles.metricBigVal}>13,780</span>
            <span className={styles.metricSubLbl}>Watch Hours Logged</span>
          </div>
          <div className={styles.metricSeparator} />
          <div className={styles.editorialMetric}>
            <span className={styles.metricBigVal}>500K+</span>
            <span className={styles.metricSubLbl}>Global Mining Network</span>
          </div>
        </div>
      </header>

      {/* Alternating Pure-Text Chapters:
          Chapter 1: Heading Left, Content Right
          Chapter 2: Content Left, Heading Right
          Chapter 3: Heading Left, Content Right
          Chapter 4: Content Left, Heading Right
          Zero cards, zero boxes, pure humanized editorial storytelling.
      */}
      <div className={styles.chaptersStack}>
        {CHAPTERS.map((chapter) => {
          const isHeadingLeft = chapter.align === "heading-left";

          return (
            <section
              key={chapter.id}
              className={`${styles.alternatingRow} ${
                isHeadingLeft ? styles.rowHeadingLeft : styles.rowHeadingRight
              }`}
            >
              {/* Heading Block */}
              <div className={styles.headingColumn}>
                <div className={styles.metaRow}>
                  <span className={styles.chapterNum}>{chapter.chapterNumber}</span>
                  <span className={styles.metaDivider}>/</span>
                  <span className={styles.categoryTag}>{chapter.category}</span>
                </div>

                <h3 className={styles.chapterTitle}>
                  <span className={styles.titleLine}>{chapter.titleLine1}</span>
                  <span className={styles.titleLine}>{chapter.titleLine2}</span>
                </h3>

                <div className={styles.clientDetails}>
                  <span className={styles.clientName}>{chapter.clientName}</span>
                  <span className={styles.tickerText}>{chapter.ticker}</span>
                </div>
              </div>

              {/* Content Block — Pure Narrative & Typography (No Card Background) */}
              <div className={styles.contentColumn}>
                <p className={styles.storyLead}>{chapter.storyLead}</p>
                <p className={styles.storyDetail}>{chapter.storyDetail}</p>

                {/* Clean Typographic Metrics Line — No Cards, Just Editorial Text */}
                <div className={styles.textMetricsLine}>
                  <div className={styles.textMetricCol}>
                    <span className={styles.textMetricNum}>{chapter.metric1Val}</span>
                    <span className={styles.textMetricLbl}>{chapter.metric1Lbl}</span>
                  </div>

                  <div className={styles.textMetricDivider} />

                  <div className={styles.textMetricCol}>
                    <span className={styles.textMetricNum}>{chapter.metric2Val}</span>
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
      <section className={styles.featuredWorkSection} aria-label="Client Case Studies & Market Performance">
        {/* Subtle Architectural Coordinate Grid on Deep Mineral Blue */}
        <div className={styles.gridOverlay} aria-hidden="true">
          <div className={styles.gridLine} />
          <div className={styles.gridLine} />
          <div className={styles.gridLine} />
          <div className={styles.gridLine} />
        </div>

        <div className={styles.sectionInner}>
          {innerContent}
        </div>
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

