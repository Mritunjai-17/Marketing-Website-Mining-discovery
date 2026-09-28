"use client";

import React, { useRef, useMemo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import styles from "./MiningApproachSequence.module.css";

export interface MiningApproachSequenceProps {
  /**
   * Normalized sequence progress (0.0 to 1.0)
   * 0.0 - 0.45: Kinetic Typography zoom-through ("letter appears")
   * 0.40 - 0.90: "Our Approach To Every Resource" showcase
   * 0.88 - 1.00: Fadeout & seamless handover to the 3D Truck road
   */
  progress: number;
}

const PARTNER_LOGOS = [
  "Arras Minerals",
  "Kodiak Copper",
  "Arizona Gold",
  "Astra Exploration",
  "Aurion Resources",
  "Guanajuato",
  "Harfang",
  "West Red Lake",
];

export const MiningApproachSequence: React.FC<MiningApproachSequenceProps> = ({ progress: rawP }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Strictly clamp progress between 0 and 1
  const p = Math.max(0, Math.min(1, rawP));

  // 1. Master Sequence Visibility
  const isVisible = p > 0.001 && p < 0.999;
  if (!isVisible) return null;

  // Master fade in / fade out
  const masterEnter = Math.min(1, p / 0.05);
  const masterExit = Math.max(0, 1 - Math.max(0, (p - 0.88) / 0.11));
  const masterOpacity = masterEnter * masterExit;

  // -------------------------------------------------------------------------
  // PHASE 1: KINETIC TYPOGRAPHY & WORD SEPARATION
  // -------------------------------------------------------------------------
  // Enters cleanly from p = 0 to 0.08
  const typoEnter = Math.min(1, p / 0.07);

  // Between p = 0.15 and 0.32:
  // Surrounding words drift apart:
  // - Eyebrow drifts upwards and dissolves
  // - Line 1: "We Don't Just" drifts left, "Report Mining." drifts right
  // - Line 1 gently shifts down ~26px to align its gap directly with the screen center (50%, 50%)
  // - Line 2: "We Build Market Valuation." drifts downwards and dissolves
  const driftP = Math.max(0, Math.min(1, (p - 0.15) / (0.32 - 0.15)));
  const driftOpacity = typoEnter * Math.max(0, 1 - Math.pow(driftP, 1.3));
  const driftY = driftP * 40;
  const driftX = driftP * 75; // separates left and right words
  const line1CenterY = driftP * 26; // smoothly centers Line 1 vertically

  // Overall typography stage opacity
  const typoStageOpacity = driftOpacity;

  // -------------------------------------------------------------------------
  // PHASE 2: THE EXPANDING PORTAL CARD ("OUR APPROACH" SHOWCASE)
  // -------------------------------------------------------------------------
  // Emerges between "Just" and "Report" from an ultra-tiny shape ("ekdm chote se shape me")
  // and smoothly expands on scroll until reaching full viewport.
  const approachEnter = Math.max(0, Math.min(1, (p - 0.18) / 0.05));
  const approachExit = Math.max(0, 1 - Math.max(0, (p - 0.86) / 0.12));
  const approachOpacity = approachEnter * approachExit;

  // Card expansion progress: 0 (micro seed between "Just" & "Report") -> 1 (full viewport)
  const expandProgress = Math.max(0, Math.min(1, (p - 0.19) / (0.48 - 0.19)));
  // Exponential growth curve: stays tiny at start, then accelerates outwards smoothly
  const eased = Math.pow(expandProgress, 2.4);

  // Card dimensions: Starts at micro size (1.5vw x 1.0vh ~ 22px x 10px), expands to 100vw x 100vh
  const cardWidthVw = 1.5 + eased * 98.5;
  const cardHeightVh = 1.0 + eased * 99.0;
  const cardBorderRadius = Math.max(0, (1 - Math.min(1, eased * 1.5)) * 24);

  // Shadow: Clean deep dark drop shadow while floating, disappears when full bleed
  const cardShadowOpacity = Math.max(0, 1 - eased);

  // Background macro image counter-zoom & subtle scroll parallax
  const bgScale = 1.30 - eased * 0.22;
  const bgY = (p - 0.50) * -45;

  // Inside the card:
  // 1. Compact preview partner logos at bottom of card during mid-expansion
  const previewLogosOpacity =
    expandProgress > 0.36 && expandProgress < 0.72
      ? Math.min(1, (expandProgress - 0.36) / 0.12) * Math.max(0, 1 - (expandProgress - 0.58) / 0.14)
      : 0;

  // 2. Full editorial content (title, quote, CTA) blooms in as card reaches full screen
  const editorialOpacity = Math.max(0, Math.min(1, (expandProgress - 0.65) / 0.35));
  const editorialY = (1 - editorialOpacity) * 20;

  // Bottom progress rail (active while full screen from p = 0.50 to 0.86)
  const railProgressPct = Math.round(
    Math.min(100, Math.max(0, ((p - 0.50) / 0.36) * 100))
  );

  return (
    <div
      ref={containerRef}
      className={styles.container}
      style={{
        opacity: masterOpacity.toFixed(3),
        pointerEvents: expandProgress > 0.90 && editorialOpacity > 0.8 ? "auto" : "none",
      }}
      aria-hidden={!isVisible}
    >
      {/* =================================================================== */}
      {/* 1. KINETIC TYPOGRAPHY STAGE (Splits between "Just" & "Report")       */}
      {/* =================================================================== */}
      {typoStageOpacity > 0.005 && (
        <div
          className={styles.typoStage}
          style={{
            opacity: typoStageOpacity.toFixed(3),
            pointerEvents: "none",
          }}
        >
          <span
            className={styles.typoEyebrow}
            style={{
              opacity: driftOpacity.toFixed(3),
              transform: `translate3d(0, -${driftY.toFixed(1)}px, 0)`,
            }}
          >
            [ 01 — THE MINING CONVICTION ]
          </span>

          <div className={styles.typoHeadline}>
            {/* Line 1: Splits between "Just" and "Report" */}
            <div
              className={styles.typoLine1}
              style={{
                transform: `translate3d(0, ${line1CenterY.toFixed(1)}px, 0)`,
              }}
            >
              <span
                className={styles.driftLeft}
                style={{
                  opacity: driftOpacity.toFixed(3),
                  transform: `translate3d(-${driftX.toFixed(1)}px, 0, 0)`,
                }}
              >
                <span className={styles.typoWord}>We</span>
                <span className={styles.typoWord}>Don&apos;t</span>
                <span className={styles.typoWord}>Just</span>
              </span>

              <span
                className={styles.driftRight}
                style={{
                  opacity: driftOpacity.toFixed(3),
                  transform: `translate3d(${driftX.toFixed(1)}px, 0, 0)`,
                }}
              >
                <span className={styles.typoWord}>Report</span>
                <span className={styles.typoWord}>Mining.</span>
              </span>
            </div>

            {/* Line 2: Drifts downwards and dissolves */}
            <div
              className={styles.typoLine2}
              style={{
                opacity: driftOpacity.toFixed(3),
                transform: `translate3d(0, ${driftY.toFixed(1)}px, 0)`,
              }}
            >
              <span className={styles.typoWord}>We</span>
              <span className={`${styles.typoWord} ${styles.goldWord}`}>Build</span>
              <span className={styles.typoWord}>Market</span>
              <span className={`${styles.typoWord} ${styles.goldWord}`}>Valuation.</span>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 2. "OUR APPROACH" SHOWCASE (Emerges between "Just" & "Report")       */}
      {/* =================================================================== */}
      {approachOpacity > 0.005 && (
        <div
          className={styles.approachStage}
          style={{
            opacity: approachOpacity.toFixed(3),
            width: `${cardWidthVw.toFixed(2)}vw`,
            height: `${cardHeightVh.toFixed(2)}vh`,
            borderRadius: `${cardBorderRadius.toFixed(1)}px`,
            border: "none",
            boxShadow:
              cardShadowOpacity > 0.01 && expandProgress < 0.98
                ? `0 25px 80px rgba(0, 0, 0, ${(0.95 * cardShadowOpacity).toFixed(3)})`
                : "none",
          }}
        >
          {/* Macro Gold Mineral Crystal Texture Background */}
          <div
            className={styles.macroBg}
            style={{
              backgroundImage: "url('/images/approach_drill_core.jpg')",
              transform: `scale(${bgScale.toFixed(3)}) translateY(${bgY.toFixed(1)}px)`,
            }}
          />
          <div className={styles.macroOverlay} />
          <div className={styles.vignetteGlow} />

          {/* Compact Partner Logos preview visible at bottom of card while expanding */}
          {previewLogosOpacity > 0.01 && (
            <div
              className={styles.cardPreviewLogos}
              style={{ opacity: previewLogosOpacity.toFixed(3) }}
              aria-hidden="true"
            >
              {PARTNER_LOGOS.slice(0, 5).map((name) => (
                <span key={name} className={styles.cardPreviewLogo}>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E5A93C]/80" />
                  {name}
                </span>
              ))}
            </div>
          )}

          {/* Full Editorial Content Grid (fades in as card expands to full screen) */}
          <div
            className={styles.innerEditorialWrapper}
            style={{
              opacity: editorialOpacity.toFixed(3),
              pointerEvents: editorialOpacity > 0.6 ? "auto" : "none",
            }}
          >
            <div
              className={styles.contentGrid}
              style={{
                transform: `translate3d(0, ${editorialY.toFixed(1)}px, 0)`,
              }}
            >
              {/* Left Column: Heading & Client Badges */}
              <div className={styles.leftCol}>
                <div className={styles.eyebrowTag}>
                  <span className={styles.eyebrowDot} />
                  <span>02 — STRATEGIC METHODOLOGY</span>
                </div>

                <h2 className={styles.mainTitle}>
                  OUR APPROACH<br />
                  <span className={styles.goldTitleWord}>TO EVERY RESOURCE</span>
                </h2>

                {/* Roster of Partner / Client Brands */}
                <div className={styles.logosRow}>
                  {PARTNER_LOGOS.map((name) => (
                    <span key={name} className={styles.logoBadge}>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E5A93C]/80" />
                      {name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right Column: High-conviction copy & Call to Action */}
              <div className={styles.rightCol}>
                <blockquote className={styles.philosophyQuote}>
                  &ldquo;Every campaign is intentional, every thesis engineered with institutional conviction.
                  Connecting ground-truth geology directly to global sovereign and capital market authority.&rdquo;
                </blockquote>

                <Link
                  href="/contact"
                  className={styles.ctaBtn}
                  aria-label="Start Your Project"
                >
                  <span>SCHEDULE STRATEGY BRIEFING</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Bottom Progress Rail */}
            <div className={styles.bottomRail}>
              <span className={styles.progressLabel}>
                DEEP EXTRACTION → OUR APPROACH → HAULAGE
              </span>

              <div className={styles.progressTrack} aria-hidden="true">
                <div
                  className={styles.progressBar}
                  style={{ width: `${railProgressPct}%` }}
                />
              </div>

              <span className={styles.chapterCount}>
                02 / 03
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MiningApproachSequence;
