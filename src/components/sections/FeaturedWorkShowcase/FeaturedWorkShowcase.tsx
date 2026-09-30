"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AnimatedMetric } from "@/components/ui/AnimatedMetric";
import { PublicationsShowcase } from "@/components/sections/PublicationsShowcase";
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
  bgType?: "image" | "logo";
  logoImage?: string;
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
    id: "the-mining-investment-event-north",
    chapterNumber: "EVENT 01",
    category: "QUEBEC CITY // TIER-1 INSTITUTIONAL SUMMIT",
    ticker: "OFFICIAL MEDIA PARTNER • INVITATION ONLY",
    titleLine1: "THE MINING INVESTMENT",
    titleLine2: "EVENT OF THE NORTH",
    coordinates: "LAT 46°48'N / LON 71°12'W // CHÂTEAU FRONTENAC",
    bgImage: "/images/events/the_mining_investment_event_watermark.png",
    bgType: "logo",
    logoImage: "/images/events/the_mining_investment_event_logo.png",
    clientName: "The Mining Investment Event of the North",
    storyLead:
      "Canada’s premier tier-1 invitation-only mining conference, connecting c-suite executives directly with senior institutional funds, Bay Street desks, and major producers.",
    storyDetail: "",
    metric1Val: "2-Year",
    metric1Lbl: "Official Media Partner",
    metric2Val: "Tier-1",
    metric2Lbl: "Institutional Mining Summit",
    deliverables: "Executive Video Series • On-Site Broadcasts • Institutional Syndication",
    align: "heading-left",
  },
  {
    id: "pdac-convention",
    chapterNumber: "EVENT 02",
    category: "TORONTO // GLOBAL EXPLORATION HUB",
    ticker: "THE WORLD'S PREMIER MINERAL CONVENTION",
    titleLine1: "PDAC GLOBAL EXPLORATION",
    titleLine2: "& INVESTMENT CONVENTION",
    coordinates: "LAT 43°38'N / LON 79°23'W // METRO TORONTO CONVENTION CENTRE",
    bgImage: "/images/events/pdac_watermark.png",
    bgType: "logo",
    logoImage: "/images/events/pdac_logo.png",
    clientName: "Prospectors & Developers Association of Canada",
    storyLead:
      "The world’s leading mineral exploration gathering, bringing together 30,000+ delegates and junior explorers across 130 countries for dealmaking and exploration capital.",
    storyDetail: "",
    metric1Val: "30,000+",
    metric1Lbl: "Global Mining Delegates",
    metric2Val: "130+",
    metric2Lbl: "Participating Countries",
    deliverables: "Discovery Stage Coverage • Junior Miner Spotlights • Investor Briefs",
    align: "heading-left",
  },
  {
    id: "mines-and-money",
    chapterNumber: "EVENT 03",
    category: "LONDON // EUROPEAN CAPITAL FORUM",
    ticker: "LONDON CITY • CAPITAL MATCHMAKING",
    titleLine1: "MINES AND MONEY &",
    titleLine2: "RESOURCING TOMORROW",
    coordinates: "LAT 51°32'N / LON 0°06'W // BUSINESS DESIGN CENTRE",
    bgImage: "/images/events/mines_and_money_watermark.png",
    bgType: "logo",
    logoImage: "/images/events/mines_and_money_logo.png",
    clientName: "Mines and Money / Resourcing Tomorrow",
    storyLead:
      "Europe’s flagship natural resource investment summit, linking active miners with London City asset managers, private equity funds, and European family offices.",
    storyDetail: "",
    metric1Val: "2,500+",
    metric1Lbl: "Active Resource Investors",
    metric2Val: "500+",
    metric2Lbl: "Mining Corporates & Desks",
    deliverables: "European Capital Matchmaking • C-Suite Interviews • Bourse Visibility",
    align: "heading-left",
  },
  {
    id: "mining-indaba",
    chapterNumber: "EVENT 04",
    category: "CAPE TOWN // AFRICAN & GLOBAL M&A",
    ticker: "PAN-AFRICAN & GLOBAL PROJECT FINANCING",
    titleLine1: "INVESTING IN AFRICAN",
    titleLine2: "MINING INDABA",
    coordinates: "LAT 33°55'S / LON 18°25'E // CTICC CAPE TOWN",
    bgImage: "/images/events/mining_indaba_watermark.png",
    bgType: "logo",
    logoImage: "/images/events/mining_indaba_logo.png",
    clientName: "Investing in African Mining Indaba",
    storyLead:
      "Africa’s largest mining investment summit, uniting sovereign wealth funds, major global producers, and international banks to finance major resource assets.",
    storyDetail: "",
    metric1Val: "9,000+",
    metric1Lbl: "Mining Leaders & Investors",
    metric2Val: "100+",
    metric2Lbl: "Sovereign & Corporate Delegations",
    deliverables: "Sovereign Project Spotlights • M&A Coverage • Global Syndication",
    align: "heading-left",
  },
];

interface StatSet {
  category: string;
  stats: {
    value: string;
    label: string;
  }[];
}

const STAT_SETS: StatSet[] = [
  {
    category: "Global Scale",
    stats: [
      { value: "45,000+", label: "Annual Summit Delegates" },
      { value: "130+", label: "Countries Represented" },
      { value: "$3.5T+", label: "Combined Market Cap" },
      { value: "350+", label: "C-Suite Broadcasts" },
    ],
  },
  {
    category: "Media Partnerships",
    stats: [
      { value: "4 Major", label: "Tier-1 Mining Summits" },
      { value: "12,000+", label: "Institutional Funds Reached" },
      { value: "60+", label: "Resource Jurisdictions" },
      { value: "100%", label: "On-Site Executive Coverage" },
    ],
  },
  {
    category: "Audience & Dealmaking",
    stats: [
      { value: "50,000+", label: "Global Mining Leaders" },
      { value: "1,500+", label: "Fund Managers & Desks" },
      { value: "130+", label: "Sovereign Delegations" },
      { value: "250+", label: "Executive Deep-Dives" },
    ],
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

  const [headerInView, setHeaderInView] = useState(false);
  const [revealedChapters, setRevealedChapters] = useState<boolean[]>([true, true, true, true]);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [activeStatSet, setActiveStatSet] = useState<number>(0);
  const [isStatsHovered, setIsStatsHovered] = useState<boolean>(false);
  const activeChapterRef = useRef<number>(0);
  const currentProgressRef = useRef<number>(0);
  const targetProgressRef = useRef<number>(0);
  const isManualClickRef = useRef<boolean>(false);
  const manualTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastDeckHeightIdx = useRef<number>(-1);

  // Auto-cycle stats set every 5.5s unless hovered
  useEffect(() => {
    if (isStatsHovered) return;
    const interval = setInterval(() => {
      setActiveStatSet((prev) => (prev + 1) % STAT_SETS.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isStatsHovered]);

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

  // Dedicated IntersectionObserver to reliably trigger kinetic header reveal as soon as it enters viewport
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHeaderInView(true);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
            GLOBAL EVENT COVERAGE // INSTITUTIONAL REACH
          </span>
          <span className={styles.eyebrowRule} />
        </div>

        <h2 className={styles.mainTitle}>
          <span className={styles.maskWrapper}>
            <span className={`${styles.maskedLine} ${styles.line1}`}>
              THE 4 MAJOR MINING
            </span>
          </span>
          <span className={styles.maskWrapper}>
            <span className={`${styles.maskedLine} ${styles.line2}`}>
              INVESTMENT EVENTS <em className={styles.shimmerText}>IN THE WORLD.</em>
            </span>
          </span>
        </h2>

        <p className={styles.description}>
          Where mining companies meet institutional capital. We cover the world&apos;s most influential mining conferences on the ground, putting junior explorers and mid-tier producers directly in front of active investors.
        </p>

        {/* Minimal Editorial KPI Strip with Animated Count-Ups and Category Switcher */}
        <div
          className={styles.metricsStripContainer}
          onMouseEnter={() => setIsStatsHovered(true)}
          onMouseLeave={() => setIsStatsHovered(false)}
        >
          <div className={styles.statsPillRow} role="tablist" aria-label="Summit Statistics Dimensions">
            {STAT_SETS.map((set, sIdx) => (
              <button
                key={set.category}
                type="button"
                role="tab"
                aria-selected={activeStatSet === sIdx}
                onClick={() => setActiveStatSet(sIdx)}
                className={`${styles.statPillBtn} ${activeStatSet === sIdx ? styles.statPillActive : ""}`}
              >
                <span className={styles.statPillDot} />
                <span>{set.category}</span>
              </button>
            ))}
          </div>

          <div className={styles.editorialMetricsStrip}>
            {STAT_SETS[activeStatSet].stats.map((stat, stIdx) => (
              <React.Fragment key={`${activeStatSet}-${stat.label}`}>
                {stIdx > 0 && <div className={styles.metricSeparator} />}
                <div className={styles.editorialMetric}>
                  <AnimatedMetric
                    value={stat.value}
                    inView={headerInView}
                    className={styles.metricBigVal}
                  />
                  <span className={styles.metricSubLbl}>{stat.label}</span>
                </div>
              </React.Fragment>
            ))}
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

                  {/* Dedicated Chapter Background Image or Partner Logo */}
                  <div
                    className={`${styles.chapterBgWrap} ${
                      chapter.bgType === "logo" ? styles.chapterBgLogoWrap : ""
                    }`}
                    aria-hidden="true"
                  >
                    {chapter.bgType === "logo" ? (
                      <div className={styles.logoBgContainer}>
                        <div className={styles.logoAmbientGlow} />
                        <img
                          src={chapter.bgImage}
                          alt=""
                          className={styles.chapterLogoBgImg}
                          loading="lazy"
                        />
                        <div className={styles.logoVignetteOverlay} />
                      </div>
                    ) : (
                      <>
                        <img
                          src={chapter.bgImage}
                          alt=""
                          className={styles.chapterBgImg}
                          loading="lazy"
                        />
                        <div className={styles.chapterBgOverlay} />
                      </>
                    )}
                  </div>

                  {/* Heading Block */}
                  <div className={styles.headingColumn}>
                    <div className={styles.headingTopGroup}>
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
                    </div>

                    <div className={styles.clientDetails}>
                      {chapter.logoImage && (
                        <div className={styles.clientLogoWrap}>
                          <img
                            src={chapter.logoImage}
                            alt={chapter.clientName}
                            className={styles.clientLogoBadge}
                          />
                        </div>
                      )}
                      <div className={styles.clientTextWrap}>
                        <span className={styles.clientName}>{chapter.clientName}</span>
                        <span className={styles.tickerText}>{chapter.ticker}</span>
                      </div>
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
                      <span>Explore event coverage</span>
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

      {/* EXPLORE OUR PUBLICATIONS: 4 CARDS (MAGAZINE, NEWSLETTER, ARTICLES, CEO PROFILE) */}
      <PublicationsShowcase />
    </>
  );

  if (isConnectedFlow) {
    return (
      <section
        className={styles.featuredWorkSection}
        aria-label="The 4 Major Mining Investment Events in the World"
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
        backgroundColor: "#D9D6CE",
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
