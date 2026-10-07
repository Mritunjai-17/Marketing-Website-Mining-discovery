"use client";

import React, { useRef, useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { FeaturedWorkShowcase } from "@/components/sections/FeaturedWorkShowcase/FeaturedWorkShowcase";
import { AnimatedMetric } from "@/components/ui/AnimatedMetric";
import styles from "./ClientInvestorGrowth.module.css";

export interface ClientInvestorGrowthProps {
  /** Scroll scrub progress through the connected section (0.0 to 1.0) */
  scrollProgress?: number;
  /** Section fade opacity (0.0 to 1.0) */
  opacity?: number;
}

interface GrowthBulletObj {
  title: string;
}

interface GrowthPillar {
  id: string;
  badge: string;
  targetAudience: string;
  title: string;
  description: string;
  bullets: Array<string | GrowthBulletObj>;
  image: string;
  alt: string;
  align: "left-card" | "right-card";
}

const GROWTH_PILLARS: GrowthPillar[] = [
  {
    id: "campaigns",
    badge: "FOR MINING COMPANIES",
    targetAudience: "FOR EXPLORATION & JUNIOR RESOURCE MINERS",
    title: "Turn Your Mining Milestones Into Market Visibility",
    description:
      "Great exploration results and project updates deserve more than a single announcement. Mining Discovery helps mining companies turn discoveries, milestones and company news into clear, engaging stories that reach investors and the wider mining community.",
    bullets: [
      "Put your company in front of the right audience",
      "Give your project a stronger voice",
      "Build visibility beyond the announcement",
    ],
    image: "/services/02-drill.webp",
    alt: "Mining company visual marketing presentation and executive media suite",
    align: "left-card",
  },
  {
    id: "syndication",
    badge: "FOR RESOURCE INVESTORS",
    targetAudience: "FOR FUNDS, FAMILY OFFICES & PRIVATE INVESTORS",
    title: "Stay Close to the Mining Stories That Matter",
    description:
      "Finding the right opportunities starts with knowing what is happening across the resource sector. Mining Discovery brings together company news, exploration updates, project developments and industry stories to help investors stay informed about the mining market.",
    bullets: [
      "Follow emerging mining companies and projects",
      "Hear directly from industry leaders",
      "Keep up with a fast-moving industry",
    ],
    image: "/services/03-assay.webp",
    alt: "Institutional mining analysts and investors evaluating exploration data",
    align: "right-card",
  },
  {
    id: "liquidity",
    badge: "FOR TRADERS & READERS",
    targetAudience: "FOR DAILY READERS, COMMODITY TRADERS & MARKET ENTHUSIASTS",
    title: "Mining News & Market Intelligence Without the Noise",
    description:
      "The mining and resource market moves quickly across commodities and jurisdictions. We make it easier to follow by bringing together verified company news, assay discoveries, commodity developments and industry insights in one clear, concise feed.",
    bullets: [
      "Follow high-impact discoveries and project news",
      "Understand commodity trends with clear insights",
      "Stay ahead of fast-moving resource markets",
    ],
    image: "/services/01-survey.webp",
    alt: "Market analysis and commodity trading charts for resource equities",
    align: "left-card",
  },
  {
    id: "partnerships",
    badge: "FOR TIER-1 STRATEGIC JVS",
    targetAudience: "FOR SENIOR PRODUCERS & CORPORATE DEVELOPMENT",
    title: "Discover Projects, Companies & Growth Opportunities",
    description:
      "Established mining companies are always looking for new projects, emerging assets and strategic partners. Mining Discovery keeps corporate leaders and producers connected to developments across the exploration and resource sector.",
    bullets: [
      "Stay informed on emerging high-value projects",
      "Discover exploration companies beyond your usual network",
      "Accelerate strategic partnerships and joint ventures",
    ],
    image: "/services/04-pit.webp",
    alt: "Large-scale modern mining processing facility and open pit production infrastructure",
    align: "right-card",
  },
];

export const ClientInvestorGrowth = React.memo<ClientInvestorGrowthProps>(function ClientInvestorGrowth({
  scrollProgress = 0,
  opacity = 1,
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const metricsRef = useRef<HTMLDivElement>(null);

  const [headerInView, setHeaderInView] = useState(false);
  const [revealedPillars, setRevealedPillars] = useState<boolean[]>([true, false, false, false]);
  const [activeFocalIndex, setActiveFocalIndex] = useState<number>(0);
  const [metricsInView, setMetricsInView] = useState(false);

  const activeFocalRef = useRef<number>(0);
  const layoutMetricsRef = useRef<{
    maxScroll: number;
    headerTop: number;
    rowCenters: number[];
    metricsTop: number;
    clientH: number;
  }>({
    maxScroll: 4000,
    headerTop: 100,
    rowCenters: [400, 950, 1500, 2050],
    metricsTop: 2600,
    clientH: 800,
  });

  // Overall section visibility and opacity
  const clampedOpacity = Math.max(0, Math.min(1, opacity));
  const isVisible = clampedOpacity > 0.05;
  const pointerEvents = clampedOpacity > 0.4 ? "auto" : "none";

  // Measure static layout metrics once on mount/resize (zero DOM reads during scroll)
  const measureLayout = () => {
    if (!trackRef.current) return;
    const track = trackRef.current;
    const trackRect = track.getBoundingClientRect();
    const clientH = window.innerHeight || 800;
    const contentH = track.offsetHeight || 5500;
    const maxScroll = Math.max(0, contentH - clientH);

    // Exact relative coordinate: distance from track top to element is invariant to CSS transform
    const headerTop = headerRef.current
      ? headerRef.current.getBoundingClientRect().top - trackRect.top
      : 100;

    const rowCenters: number[] = [];
    rowRefs.current.forEach((el) => {
      if (el) {
        const r = el.getBoundingClientRect();
        const topRelativeToTrack = r.top - trackRect.top;
        rowCenters.push(topRelativeToTrack + r.height * 0.5);
      } else {
        rowCenters.push(0);
      }
    });

    const metricsTop = metricsRef.current
      ? metricsRef.current.getBoundingClientRect().top - trackRect.top
      : 2600;

    layoutMetricsRef.current = {
      maxScroll,
      headerTop,
      rowCenters,
      metricsTop,
      clientH,
    };
  };

  useEffect(() => {
    measureLayout();
    const timer = setTimeout(measureLayout, 250);
    const observer = new ResizeObserver(() => {
      measureLayout();
    });
    if (trackRef.current) {
      observer.observe(trackRef.current);
    }
    window.addEventListener("resize", measureLayout);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener("resize", measureLayout);
    };
  }, []);

  // Silky-smooth GPU scroll translation & non-thrashing in-view detection
  useEffect(() => {
    if (!trackRef.current) return;

    const { maxScroll, headerTop, rowCenters, metricsTop, clientH } = layoutMetricsRef.current;
    const scrollY = scrollProgress * maxScroll;

    // Direct GPU-accelerated transform
    trackRef.current.style.transform = `translate3d(0, -${scrollY.toFixed(1)}px, 0)`;

    // Header reveal
    if (!headerInView && scrollY + clientH * 0.9 > headerTop) {
      setHeaderInView(true);
    }

    // Reveal pillars once reached
    setRevealedPillars((prev) => {
      let changed = false;
      const next = [...prev];
      rowCenters.forEach((center, idx) => {
        if (!next[idx] && scrollY + clientH * 0.95 > center - 180) {
          next[idx] = true;
          changed = true;
        }
      });
      return changed ? next : prev;
    });

    // Optical center focal row
    const opticalCenter = scrollY + clientH * 0.5;
    let closestIdx = 0;
    let minDistance = Infinity;

    rowCenters.forEach((center, idx) => {
      const dist = Math.abs(center - opticalCenter);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = idx;
      }
    });

    if (closestIdx !== activeFocalRef.current) {
      activeFocalRef.current = closestIdx;
      setActiveFocalIndex(closestIdx);
    }

    // Metrics strip reveal
    if (!metricsInView && scrollY + clientH * 0.92 > metricsTop) {
      setMetricsInView(true);
    }

  }, [scrollProgress, headerInView, metricsInView]);

  return (
    <div
      ref={containerRef}
      className={styles.bridgeContainer}
      style={{
        zIndex: isVisible ? 45 : 10,
        opacity: clampedOpacity.toFixed(3),
        visibility: isVisible ? "visible" : "hidden",
        pointerEvents: pointerEvents as "auto" | "none",
      }}
      aria-label="How Mining Discovery Accelerates Value for Clients and Investors"
      aria-hidden={!isVisible}
    >
      <div ref={trackRef} className={styles.scrollTrack}>
        {/* ==============================================================
            PART 1: VALUE BRIDGE (Warm Architectural Stone #D9D6CE)
            ============================================================== */}
        <section className={styles.valueBridgeSection}>
          <div className={styles.sectionInner}>
            {/* Top Header & Overview Description */}
            <header
              ref={headerRef}
              className={`${styles.header} ${headerInView ? styles.inView : ""}`}
            >
              <div className={styles.eyebrowRow}>
                <span className={styles.eyebrowRule} />
                <span className={styles.eyebrowText}>
                  <span className={styles.eyebrowPip}>✦</span> FOR MINERS • INVESTORS • TRADERS <span className={styles.eyebrowPip}>✦</span>
                </span>
                <span className={styles.eyebrowRule} />
              </div>

              <h2 className={styles.mainTitle}>
                <span className={styles.titleLine}>BUILDING VALUE FOR</span>
                <span className={styles.titleLine}>
                  <em className={styles.shimmerText}>EVERY STAKEHOLDER</em>
                </span>
              </h2>

              <p className={styles.subtitle}>
                Whether you run a mining company, manage an investment portfolio, or track commodity
                markets, Mining Discovery gives you the reach, data, and access to grow.
              </p>
            </header>

            {/* Alternating Zig-Zag Showcase Rows (4 Pillars) */}
            <div className={styles.cardsStack}>
              {GROWTH_PILLARS.map((item, idx) => {
                const isLeftCard = item.align === "left-card";
                const isRevealed = revealedPillars[idx];
                const isFocal = activeFocalIndex === idx;

                return (
                  <div
                    key={item.id}
                    ref={(el) => {
                      rowRefs.current[idx] = el;
                    }}
                    className={`${styles.alternatingRow} ${isLeftCard ? styles.rowLeftCard : styles.rowRightCard
                      } ${isRevealed ? styles.rowRevealed : ""} ${isFocal ? styles.rowFocal : ""
                      }`}
                  >
                    {/* Visual Image Card */}
                    <div className={styles.cardVisualWrap}>
                      <div className={styles.imageCard}>
                        <img
                          src={item.image}
                          alt={item.alt}
                          className={styles.cardImage}
                          loading="lazy"
                        />
                        <div className={styles.imageOverlay} />
                        <div className={styles.cardBadge}>
                          <span>{item.badge}</span>
                        </div>
                      </div>
                    </div>

                    {/* Text Content Block */}
                    <div className={styles.cardTextWrap}>
                      <div className={styles.cardTextMain}>
                        <div className={styles.targetAudience}>{item.targetAudience}</div>

                        <div className={styles.itemTitleMask}>
                          <h3 className={styles.itemTitle}>{item.title}</h3>
                        </div>

                        <p className={styles.itemDescription}>{item.description}</p>
                      </div>

                      <ul className={styles.bulletList}>
                        {item.bullets.map((bullet, bIdx) => {
                          const isObj = typeof bullet === "object" && bullet !== null;
                          return (
                            <li
                              key={bIdx}
                              className={styles.bulletItem}
                              style={{ ["--b-idx" as string]: bIdx }}
                            >
                              <CheckCircle2 size={18} className={styles.bulletIcon} />
                              {isObj ? (
                                <div className={styles.bulletContent}>
                                  <strong className={styles.bulletTitle}>{bullet.title}</strong>
                                </div>
                              ) : (
                                <span>{bullet}</span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Clean Proof Metrics Strip with Dynamic Counter */}
            <div
              ref={metricsRef}
              className={`${styles.metricsBar} ${metricsInView ? styles.inView : ""}`}
            >
              <div className={styles.metricItem}>
                <AnimatedMetric
                  value="$3.5B+"
                  inView={metricsInView}
                  className={styles.metricValue}
                />
                <span className={styles.metricLabel}>Client Capital Reach</span>
              </div>

              <div className={styles.metricDivider} />

              <div className={styles.metricItem}>
                <AnimatedMetric
                  value="50,000+"
                  inView={metricsInView}
                  className={styles.metricValue}
                />
                <span className={styles.metricLabel}>Accredited Investors &amp; Funds</span>
              </div>

              <div className={styles.metricDivider} />

              <div className={styles.metricItem}>
                <AnimatedMetric
                  value="250,000+"
                  inView={metricsInView}
                  className={styles.metricValue}
                />
                <span className={styles.metricLabel}>Global Readers &amp; Traders</span>
              </div>

              <div className={styles.metricDivider} />

              <div className={styles.metricItem}>
                <AnimatedMetric
                  value="60+"
                  inView={metricsInView}
                  className={styles.metricValue}
                />
                <span className={styles.metricLabel}>Mining Jurisdictions Covered</span>
              </div>
            </div>
          </div>
        </section>

        {/* ==============================================================
            PART 2: CASE STUDIES & PROVEN IMPACT (Deep Mineral Blue #18222B)
            Directly connected beneath Part 1 — scrolls into view seamlessly
            with scroll-linked animations and focal spotlight!
            ============================================================== */}
        <FeaturedWorkShowcase isConnectedFlow scrollProgress={scrollProgress} />
      </div>
    </div>
  );
});

export default ClientInvestorGrowth;
