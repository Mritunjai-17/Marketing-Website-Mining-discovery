"use client";

import React, { useRef, useEffect } from "react";
import {
  TrendingUp,
  BarChart3,
  Users,
  Globe2,
  CheckCircle2,
} from "lucide-react";
import styles from "./ClientInvestorGrowth.module.css";
import { FeaturedWorkShowcase } from "@/components/sections/FeaturedWorkShowcase";

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
    id: "valuation-reach",
    badge: "01 / CORPORATE VALUATION & REACH",
    targetAudience: "FOR MINING OPERATORS & EXPLORERS",
    title: "Sovereign Capital Reach & Multi-Bourse Valuation",
    description:
      "We connect your drill discoveries and technical feasibility milestones directly to institutional mining funds in London, Toronto, Sydney, and New York, helping your company command premium multiples and lower its cost of capital.",
    bullets: [
      "Direct exposure to 140,000+ institutional fund decision-makers",
      "Sustained equity valuation to support non-dilutive capital raises",
    ],
    image: "/images/approach_drill_core.jpg",
    alt: "Mining exploration drill core assay evaluation",
    align: "left-card",
  },
  {
    id: "vetted-dealflow",
    badge: "02 / UNBIASED INTELLIGENCE & ALPHA",
    targetAudience: "FOR INSTITUTIONAL INVESTORS & RESOURCE FUNDS",
    title: "Verified Technical Intelligence & High-Conviction Dealflow",
    description:
      "Gain early, unfiltered access to verified drill assays, metallurgical testwork, and pre-production feasibility models before broad market repricing, vetted by seasoned geological analysts.",
    bullets: [
      "Independent geological teardowns and commodity cost curve analytics",
      "Early-stage discovery dispatches with ESG compliance scoring",
    ],
    image: "/images/approach_gold_vein_macro.jpg",
    alt: "High-grade mineral vein macro geological analysis",
    align: "right-card",
  },
  {
    id: "executive-access",
    badge: "03 / C-SUITE DIALOGUE & GOVERNANCE",
    targetAudience: "FOR INSTITUTIONAL DEAL-MAKERS & MANAGEMENT",
    title: "Direct Leadership Access & Boardroom Briefings",
    description:
      "We facilitate exclusive boardroom introductions, closed-door CEO roundtables, and technical site tours that bridge corporate management with institutional capital allocators.",
    bullets: [
      "1-on-1 private executive briefings and site-tour intelligence",
      "Direct communication channels with geological and operations leads",
    ],
    image: "/images/approach_molten_gold.jpg",
    alt: "Refined precious metals production and executive briefing",
    align: "left-card",
  },
  {
    id: "global-syndication",
    badge: "04 / TIER-1 MEDIA & CONTINUOUS VISIBILITY",
    targetAudience: "GLOBAL MINING AUDIENCE & CAPITAL ECOSYSTEM",
    title: "Omnichannel Visibility That Sustains Conviction",
    description:
      "From our premier monthly magazine publication to daily digital dispatches and Tier-1 financial press syndication, your story commands sustained attention across the global mining ecosystem.",
    bullets: [
      "Monthly print & digital magazine distribution across institutional desks",
      "Tier-1 press syndication reaching sovereign wealth and family offices",
    ],
    image: "/images/mining_discovery_aerial_landscape.jpg",
    alt: "Global Tier-1 mining discovery aerial landscape",
    align: "right-card",
  },
];

interface ClientInvestorGrowthProps {
  /** Scroll scrub progress through the 4 alternating cards (0.0 to 1.0) */
  scrollProgress: number;
  /** Section fade opacity (0.0 to 1.0) */
  opacity: number;
}

export const ClientInvestorGrowth: React.FC<ClientInvestorGrowthProps> = ({
  scrollProgress,
  opacity,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Overall section visibility and opacity
  const clampedOpacity = Math.max(0, Math.min(1, opacity));
  const isVisible = clampedOpacity > 0.01;
  const pointerEvents = clampedOpacity > 0.6 ? "auto" : "none";

  // Translate the connected track smoothly as user scrolls through both sections
  useEffect(() => {
    if (!trackRef.current || !containerRef.current) return;
    const contentH = trackRef.current.offsetHeight || 5500;
    const clientH = window.innerHeight || 800;
    const maxScroll = Math.max(0, contentH - clientH + 180);
    const scrollY = scrollProgress * maxScroll;
    trackRef.current.style.transform = `translate3d(0, -${scrollY.toFixed(1)}px, 0)`;
  }, [scrollProgress]);

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
            {/* Top Header & Overview Description */}
            <header className={styles.header}>
          <div className={styles.eyebrowRow}>
            <span className={styles.eyebrowRule} />
            <span className={styles.eyebrowText}>THE VALUE BRIDGE • DISCOVERY TO CAPITAL</span>
            <span className={styles.eyebrowRule} />
          </div>

          <h2 className={styles.mainTitle}>
            TURNING GEOLOGY INTO <em>ENTERPRISE VALUE</em>
          </h2>

          <p className={styles.subtitle}>
            Exploration unearths the mineral deposit. Mining Discovery ensures global institutional capital recognizes, values, and finances it. We bridge physical exploration milestones with multi-bourse liquidity and sustained investor conviction.
          </p>
        </header>

        {/* Alternating Zig-Zag Showcase Rows (3 to 4 Cards) */}
        <div className={styles.cardsStack}>
          {GROWTH_PILLARS.map((item, idx) => {
            const isLeftCard = item.align === "left-card";

            return (
              <div
                key={item.id}
                className={`${styles.alternatingRow} ${isLeftCard ? styles.rowLeftCard : styles.rowRightCard
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
                  <div className={styles.targetAudience}>
                    {item.targetAudience}
                  </div>

                  <h3 className={styles.itemTitle}>{item.title}</h3>

                  <p className={styles.itemDescription}>{item.description}</p>

                  <ul className={styles.bulletList}>
                    {item.bullets.map((bullet, bIdx) => (
                      <li key={bIdx} className={styles.bulletItem}>
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

        {/* Bottom Clean Proof Metrics Strip */}
        <div className={styles.metricsBar}>
          <div className={styles.metricItem}>
            <span className={styles.metricValue}>$2.4B+</span>
            <span className={styles.metricLabel}>Institutional Capital Network</span>
          </div>

          <div className={styles.metricDivider} />

          <div className={styles.metricItem}>
            <span className={styles.metricValue}>140,000+</span>
            <span className={styles.metricLabel}>C-Suite &amp; Fund Decision-Makers</span>
          </div>

          <div className={styles.metricDivider} />

          <div className={styles.metricItem}>
            <span className={styles.metricValue}>48+</span>
            <span className={styles.metricLabel}>Mining Jurisdictions Covered</span>
          </div>

          <div className={styles.metricDivider} />

          <div className={styles.metricItem}>
            <span className={styles.metricValue}>100%</span>
            <span className={styles.metricLabel}>Verified Geological Teardowns</span>
          </div>
        </div>
      </div>
    </section>

    {/* ==============================================================
        PART 2: CASE STUDIES & PROVEN IMPACT (Deep Mineral Blue #18222B)
        Directly connected beneath Part 1 — scrolls into view seamlessly
        just like the user's reference!
        ============================================================== */}
    <FeaturedWorkShowcase isConnectedFlow />
  </div>
</div>
  );
};

export default ClientInvestorGrowth;
