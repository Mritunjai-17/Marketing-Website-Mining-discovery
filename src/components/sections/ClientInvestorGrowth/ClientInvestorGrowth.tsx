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

interface GrowthPillar {
  id: string;
  badge: string;
  targetAudience: string;
  title: string;
  description: string;
  bullets: string[];
  image: string;
  alt: string;
  align: "left-card" | "right-card";
}

const GROWTH_PILLARS: GrowthPillar[] = [
  {
    id: "campaigns",
    badge: "FOR MINING COMPANIES",
    targetAudience: "FOR EXPLORATION & JUNIOR RESOURCE MINERS",
    title: "Turn Your Drill Results Into Market Liquidity & Higher Share Value",
    description:
      "Finding copper, gold, or critical minerals is only half the battle. If trading volume goes quiet between drill seasons, your share price suffers. We broadcast your assays and exploration milestones to thousands of active institutional funds and retail buyers across TSX, ASX, and OTC markets.",
    bullets: [
      "Global exposure through digital magazines, weekly dispatches, and CEO spotlights",
      "Sustained trading volume and market liquidity between assay announcements",
      "Direct connection with qualified funds and family offices looking to finance drill programs",
    ],
    image: "/services/02-drill.webp",
    alt: "Geological drill rig and high-grade mineral core samples in the field",
    align: "left-card",
  },
  {
    id: "syndication",
    badge: "FOR RESOURCE INVESTORS",
    targetAudience: "FOR FUNDS, FAMILY OFFICES & PRIVATE INVESTORS",
    title: "Find Early-Stage Discoveries Before the Broader Market Catches On",
    description:
      "Mineral exploration offers explosive upside, but sorting high-grade discoveries from empty market hype is tough. We provide verified geological teardowns, simplify technical assay data, and introduce you directly to leadership teams before major price runs.",
    bullets: [
      "Vetted discovery reports focused on real drill intercepts, safe jurisdictions, and strong balance sheets",
      "Direct access and interviews with C-suite executives and chief geologists",
      "First-mover intelligence delivered weekly so you can position ahead of the crowd",
    ],
    image: "/services/03-assay.webp",
    alt: "Institutional mining analysts and investors evaluating exploration data",
    align: "right-card",
  },
  {
    id: "liquidity",
    badge: "FOR TRADERS & READERS",
    targetAudience: "FOR DAILY READERS, COMMODITY TRADERS & MARKET ENTHUSIASTS",
    title: "Clear, Unbiased Mining News and Research You Can Actually Use",
    description:
      "Mining news is often packed with dense geological jargon. Mining Discovery breaks down complex drill cores, commodity cycles, and market swings into easy-to-read, actionable intelligence so you can trade and follow the sector with clarity.",
    bullets: [
      "100% free access to digital magazines, weekly newspapers, and technical PDFs",
      "Plain-English translations of high-grade drill results and resource estimates",
      "Up-to-date tracking of upcoming drill assays, permit decisions, and buyout rumors",
    ],
    image: "/services/01-survey.webp",
    alt: "Market analysis and commodity trading charts for resource equities",
    align: "left-card",
  },
  {
    id: "partnerships",
    badge: "FOR TIER-1 STRATEGIC JVS",
    targetAudience: "FOR SENIOR PRODUCERS & CORPORATE DEVELOPMENT",
    title: "Spot Premier Deposits for Joint Ventures, Farm-Ins & Buyouts",
    description:
      "Major producers need to replace depleting reserves with long-life deposits. We highlight top-tier junior discoveries and QP-verified projects with genuine scale, making deal-flow accessible for corporate development and M&A desks.",
    bullets: [
      "Curated pipeline of high-potential assets ready for partnership or acquisition",
      "Verified geological continuity backed by independent technical reporting",
      "High-level networking access at premier mining investment conferences",
    ],
    image: "/services/04-pit.webp",
    alt: "Large-scale modern mining processing facility and open pit production infrastructure",
    align: "right-card",
  },
];

export const ClientInvestorGrowth: React.FC<ClientInvestorGrowthProps> = ({
  scrollProgress = 0,
  opacity = 1,
}) => {
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
  const isVisible = clampedOpacity > 0.01;
  const pointerEvents = clampedOpacity > 0.6 ? "auto" : "none";

  // Measure static layout metrics once on mount/resize (zero DOM reads during scroll)
  const measureLayout = () => {
    if (!trackRef.current) return;
    const track = trackRef.current;
    const trackRect = track.getBoundingClientRect();
    const currentTransformY = -parseFloat(
      track.style.transform.replace(/[^0-9.-]/g, "") || "0"
    );
    const trackTop = trackRect.top - currentTransformY;
    const clientH = window.innerHeight || 800;
    const contentH = track.offsetHeight || 5500;
    const maxScroll = Math.max(0, contentH - clientH + 180);

    const headerTop = headerRef.current
      ? headerRef.current.getBoundingClientRect().top - trackTop - currentTransformY
      : 100;

    const rowCenters: number[] = [];
    rowRefs.current.forEach((el) => {
      if (el) {
        const r = el.getBoundingClientRect();
        const topRelativeToTrack = r.top - trackTop - currentTransformY;
        rowCenters.push(topRelativeToTrack + r.height * 0.5);
      } else {
        rowCenters.push(0);
      }
    });

    const metricsTop = metricsRef.current
      ? metricsRef.current.getBoundingClientRect().top - trackTop - currentTransformY
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
        zIndex: 35,
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
            {/* Top Header & Overview Description with Masked Line Reveals */}
            <header
              ref={headerRef}
              className={`${styles.header} ${headerInView ? styles.inView : ""}`}
            >
              <div className={styles.eyebrowRow}>
                <span className={styles.eyebrowRule} />
                <span className={styles.eyebrowText}>FOR MINERS • INVESTORS • TRADERS</span>
                <span className={styles.eyebrowRule} />
              </div>

              <h2 className={styles.mainTitle}>
                <span className={styles.maskWrapper}>
                  <span className={`${styles.maskedLine} ${styles.line1}`}>
                    BUILDING VALUE FOR
                  </span>
                </span>
                <span className={styles.maskWrapper}>
                  <span className={`${styles.maskedLine} ${styles.line2}`}>
                    <em className={styles.shimmerText}>EVERY STAKEHOLDER</em>
                  </span>
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
                    className={`${styles.alternatingRow} ${
                      isLeftCard ? styles.rowLeftCard : styles.rowRightCard
                    } ${isRevealed ? styles.rowRevealed : ""} ${
                      isFocal ? styles.rowFocal : ""
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
                      <div className={styles.targetAudience}>{item.targetAudience}</div>

                      <div className={styles.itemTitleMask}>
                        <h3 className={styles.itemTitle}>{item.title}</h3>
                      </div>

                      <p className={styles.itemDescription}>{item.description}</p>

                      <ul className={styles.bulletList}>
                        {item.bullets.map((bullet, bIdx) => (
                          <li
                            key={bIdx}
                            className={styles.bulletItem}
                            style={{ ["--b-idx" as string]: bIdx }}
                          >
                            <CheckCircle2 size={18} className={styles.bulletIcon} />
                            <span>{bullet}</span>
                          </li>
                        ))}
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
};

export default ClientInvestorGrowth;
