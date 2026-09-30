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
    badge: "MILESTONE-DRIVEN CAMPAIGNS",
    targetAudience: "FOR DISCOVERY MINERS & PROJECT GENERATORS",
    title: "Translating Drill Hole Assays into Market Narrative",
    description:
      "A 50-meter intercept of high-grade copper or gold doesn't create market conviction on its own. We structure continuous editorial and video dispatches that explain the geological continuity, jurisdictional leverage, and exploration upside to qualified global buyers.",
    bullets: [
      "Technical assay teardowns translated for institutional capital",
      "Executive video dispatches filmed on-site at active rigs",
      "Multi-bourse editorial syndication across TSX, ASX, and OTC",
    ],
    image: "/services/02-drill.webp",
    alt: "High-grade geological drill core assays and rock samples arranged in core boxes",
    align: "left-card",
  },
  {
    id: "syndication",
    badge: "INSTITUTIONAL SYNDICATION",
    targetAudience: "FOR FAMILY OFFICES, FUNDS & RESOURCE INVESTORS",
    title: "Direct Access to Pre-Discovery & Growth-Stage Drill Programs",
    description:
      "Institutional and high-net-worth resource investors receive curated, data-rich intelligence dispatches. We highlight tier-one geological jurisdictions, experienced management teams, and near-term catalysts before generalist retail markets catch on.",
    bullets: [
      "Curated discovery intelligence before headline press releases",
      "Direct introductions to C-suite and lead geological teams",
      "Strict due diligence on jurisdiction, permits, and balance sheets",
    ],
    image: "/services/03-assay.webp",
    alt: "Institutional financial trading floor with analysts reviewing technical geological data",
    align: "right-card",
  },
  {
    id: "liquidity",
    badge: "MULTI-BOURSE LIQUIDITY",
    targetAudience: "FOR PUBLIC JUNIOR & MID-TIER MINERS",
    title: "Stabilizing Trading Volume & Expanding Cross-Border Bourses",
    description:
      "Market caps erode when trading volume goes dormant between drill seasons. Our sustained communication strategy keeps global trading desks active across Canadian, Australian, US, and European capital markets throughout 12-month exploration cycles.",
    bullets: [
      "Continuous trading desk visibility between assay news releases",
      "Cross-border investor expansion (TSX-V, CSE, OTCQX, Frankfurt)",
      "Warrant acceleration support and liquidity depth stabilization",
    ],
    image: "/services/01-survey.webp",
    alt: "High-level board meeting analyzing mining valuation models and cross-border liquidity",
    align: "left-card",
  },
  {
    id: "partnerships",
    badge: "TIER-1 STRATEGIC JVS",
    targetAudience: "FOR SENIOR MINERS & STRATEGIC ALLIANCES",
    title: "Positioning Premier Deposits for Major Producer Buyouts",
    description:
      "The ultimate validation of a junior explorer is a farm-in agreement or joint venture with a Tier-1 major. We position your land package, technical data room, and ESG track record directly in front of M&A desks looking to replace reserves.",
    bullets: [
      "Strategic showcase targeting senior producer corporate development",
      "Technical credibility verified through independent QP data",
      "High-profile exposure at The Mining Investment Event of the North",
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
                <span className={styles.eyebrowText}>THE VALUE BRIDGE • DISCOVERY TO CAPITAL</span>
                <span className={styles.eyebrowRule} />
              </div>

              <h2 className={styles.mainTitle}>
                <span className={styles.maskWrapper}>
                  <span className={`${styles.maskedLine} ${styles.line1}`}>
                    TURNING GEOLOGY INTO
                  </span>
                </span>
                <span className={styles.maskWrapper}>
                  <span className={`${styles.maskedLine} ${styles.line2}`}>
                    <em className={styles.shimmerText}>ENTERPRISE VALUE</em>
                  </span>
                </span>
              </h2>

              <p className={styles.subtitle}>
                Exploration unearths the mineral deposit. Mining Discovery ensures global
                institutional capital recognizes, values, and finances it. We bridge physical
                exploration milestones with multi-bourse liquidity and sustained investor conviction.
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
                  value="$2.4B+"
                  inView={metricsInView}
                  className={styles.metricValue}
                />
                <span className={styles.metricLabel}>Institutional Capital Network</span>
              </div>

              <div className={styles.metricDivider} />

              <div className={styles.metricItem}>
                <AnimatedMetric
                  value="140,000+"
                  inView={metricsInView}
                  className={styles.metricValue}
                />
                <span className={styles.metricLabel}>C-Suite &amp; Fund Decision-Makers</span>
              </div>

              <div className={styles.metricDivider} />

              <div className={styles.metricItem}>
                <AnimatedMetric
                  value="48+"
                  inView={metricsInView}
                  className={styles.metricValue}
                />
                <span className={styles.metricLabel}>Mining Jurisdictions Covered</span>
              </div>

              <div className={styles.metricDivider} />

              <div className={styles.metricItem}>
                <AnimatedMetric
                  value="100%"
                  inView={metricsInView}
                  className={styles.metricValue}
                />
                <span className={styles.metricLabel}>Verified Geological Teardowns</span>
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
