"use client";

import React from "react";
import styles from "./BoonHero.module.css";

export interface BoonHeroProps {
  /** Scroll progress from 0 (top) to 1. Directly scrubs the reference animation timeline. */
  progress?: number;
  onExploreClick?: () => void;
}

export const BoonHero: React.FC<BoonHeroProps> = ({
  progress = 0,
  onExploreClick,
}) => {
  // Damped scrubbed progress strictly bounded in [0, 1]
  const p = Math.max(0, Math.min(1, progress));

  // ========================================================================
  // 1. HERO TYPOGRAPHY MOTION (Reference Animation Behavior)
  // Physical horizontal translation across viewport + viewport clipping
  // ========================================================================

  // Line 1: "MINING" translates horizontally to the LEFT across the viewport
  // Stays fully opaque as it moves; clips on left edge, leaves viewport cleanly
  const pText1 = Math.pow(p, 1.05);
  const text1X = -pText1 * 95; // vw
  const text1Y = -pText1 * 10; // vh
  const text1Opacity = Math.max(0, 1 - Math.max(0, (p - 0.72) / 0.28));

  // Line 2: "DISCOVERY" translates horizontally to the RIGHT across the viewport
  // Starts with a slight stagger/progression offset as requested
  const p2Raw = Math.max(0, (p - 0.035) / 0.965);
  const pText2 = Math.pow(p2Raw, 1.15);
  const text2X = pText2 * 105; // vw
  const text2Y = pText2 * 6; // vh
  const text2Opacity = Math.max(0, 1 - Math.max(0, (p - 0.75) / 0.25));

  // ========================================================================
  // 2. IMAGE / VISUAL PANEL ANIMATION (Fragmented Editorial Composition)
  // The visual separates into independent quadrant panels that pull apart
  // ========================================================================

  // Panel 1 (Top Left) moves up and left
  const pPanel1 = Math.pow(p, 1.08);
  const p1X = -pPanel1 * 50; // vw
  const p1Y = -pPanel1 * 14; // vh

  // Panel 2 (Top Right) moves up and right
  const pPanel2 = Math.pow(p, 1.14);
  const p2X = pPanel2 * 35; // vw
  const p2Y = -pPanel2 * 26; // vh

  // Panel 3 (Bottom Left) moves down and left
  const pPanel3 = Math.pow(p, 1.10);
  const p3X = -pPanel3 * 45; // vw
  const p3Y = pPanel3 * 22; // vh

  // Panel 4 (Bottom Right) moves down and right
  const pPanel4 = Math.pow(p, 1.16);
  const p4X = pPanel4 * 40; // vw
  const p4Y = pPanel4 * 22; // vh

  // ========================================================================
  // 3. BOTTOM DETAILS (Mission statement & scroll cue)
  // Move outward and dissolve cleanly
  // ========================================================================
  const pBottomLeft = Math.pow(p, 1.08);
  const bLeftX = -pBottomLeft * 45; // vw
  const bLeftY = pBottomLeft * 14; // vh
  const bLeftOp = Math.max(0, 1 - p / 0.65);

  const pBottomRight = Math.pow(p, 1.12);
  const bRightX = pBottomRight * 35; // vw
  const bRightY = pBottomRight * 14; // vh
  const bRightOp = Math.max(0, 1 - p / 0.55);

  // ========================================================================
  // 4. GRID SEAMS
  // ========================================================================
  const seamOp = Math.max(0, 1 - p / 0.45);

  // Overall container stays 100% visible while panels separate,
  // then dissolves seamlessly between p = 0.85 and 1.00 for the downstream scene
  const heroOpacity = p >= 0.85 ? Math.max(0, 1 - (p - 0.85) / 0.15) : 1.0;
  const isHidden = heroOpacity <= 0.005;
  const pointerEvents = heroOpacity > 0.05 && p < 0.5 ? "auto" : "none";

  const handleScrollClick = () => {
    if (onExploreClick) {
      onExploreClick();
    } else {
      window.scrollBy({
        top: window.innerHeight * 0.9,
        behavior: "smooth",
      });
    }
  };

  return (
    <section
      className={styles.heroContainer}
      style={{
        opacity: heroOpacity.toFixed(3),
        pointerEvents: pointerEvents as "auto" | "none",
        visibility: isHidden ? "hidden" : "visible",
        display: isHidden ? "none" : undefined,
      }}
      aria-label="Mining Discovery - Global Mining Media & Capital Platform"
    >
      {/* FRAGMENTED EDITORIAL QUADRANT PANELS (Reference Motion Philosophy) */}
      <div className={styles.heroVisualWrap} aria-hidden="true">
        {/* Panel 1: Top Left */}
        <div
          className={styles.panelTopLeft}
          style={{
            transform: `translate3d(${p1X.toFixed(2)}vw, ${p1Y.toFixed(2)}vh, 0)`,
          }}
        >
          <div
            className={styles.panelInnerImage}
            style={{ left: 0, top: 0 }}
          />
        </div>

        {/* Panel 2: Top Right */}
        <div
          className={styles.panelTopRight}
          style={{
            transform: `translate3d(${p2X.toFixed(2)}vw, ${p2Y.toFixed(2)}vh, 0)`,
          }}
        >
          <div
            className={styles.panelInnerImage}
            style={{ left: "-44vw", top: 0 }}
          />
        </div>

        {/* Panel 3: Bottom Left */}
        <div
          className={styles.panelBottomLeft}
          style={{
            transform: `translate3d(${p3X.toFixed(2)}vw, ${p3Y.toFixed(2)}vh, 0)`,
          }}
        >
          <div
            className={styles.panelInnerImage}
            style={{ left: 0, top: "-50vh" }}
          />
          {/* Lower Left Box Accent Frame */}
          <div className={styles.lowerLeftBoxAccent} style={{ width: "100%" }} />
        </div>

        {/* Panel 4: Bottom Right */}
        <div
          className={styles.panelBottomRight}
          style={{
            transform: `translate3d(${p4X.toFixed(2)}vw, ${p4Y.toFixed(2)}vh, 0)`,
          }}
        >
          <div
            className={styles.panelInnerImage}
            style={{ left: "-44vw", top: "-50vh" }}
          />
          {/* Amber Ember Glow */}
          <div className={styles.ambientEmberGlow} />
        </div>

        {/* Soft Vignette Overlay */}
        <div
          className={styles.heroVignetteOverlay}
          style={{ opacity: seamOp.toFixed(3) }}
        />

        {/* Technical Grid Seams (Separate / Fade on scroll) */}
        <div
          className={styles.gridSeamHorizontal}
          style={{
            opacity: seamOp.toFixed(3),
            transform: `scaleX(${(1 + p * 0.15).toFixed(3)})`,
          }}
        />
        <div
          className={styles.gridSeamVertical}
          style={{
            opacity: seamOp.toFixed(3),
            transform: `translate3d(${(p1X * 0.8).toFixed(2)}vw, 0, 0)`,
          }}
        />
      </div>

      {/* Main Content Overlay: Typography & Bottom Bar */}
      <div className={styles.heroContentOverlay}>
        {/* Massive Asymmetric Display Typography (Physical Horizontal Translations) */}
        <div className={styles.titleArea}>
          <h1
            className={styles.headlineLine1}
            style={{
              transform: `translate3d(${text1X.toFixed(2)}vw, calc(-50% + ${text1Y.toFixed(2)}vh), 0)`,
              opacity: text1Opacity.toFixed(3),
            }}
          >
            MINING
          </h1>
          <h2
            className={styles.headlineLine2}
            style={{
              transform: `translate3d(${text2X.toFixed(2)}vw, calc(-50% + ${text2Y.toFixed(2)}vh), 0)`,
              opacity: text2Opacity.toFixed(3),
            }}
          >
            DISCOVERY
          </h2>
        </div>

        {/* Bottom Bar: Mission statement on left, animated scroll cue on right */}
        <div className={styles.bottomBar}>
          <p
            className={styles.missionStatement}
            style={{
              transform: `translate3d(${bLeftX.toFixed(2)}vw, ${bLeftY.toFixed(2)}vh, 0)`,
              opacity: bLeftOp.toFixed(3),
            }}
          >
            We engineer strategic media, institutional capital, and global intelligence to drive{" "}
            <span className={styles.accentHighlight}>unprecedented market valuation</span> for natural resource leaders.
          </p>

          <div
            className={styles.scrollCue}
            onClick={handleScrollClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleScrollClick();
              }
            }}
            style={{
              transform: `translate3d(${bRightX.toFixed(2)}vw, ${bRightY.toFixed(2)}vh, 0)`,
              opacity: bRightOp.toFixed(3),
            }}
            aria-label="Scroll down to begin 3D story journey"
          >
            <span className={styles.scrollText}>SCROLL FOR MORE</span>
            <div className={styles.scrollDots} aria-hidden="true">
              <span className={styles.scrollDot} />
              <span className={styles.scrollDot} />
              <span className={styles.scrollDot} />
              <span className={styles.scrollDot} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BoonHero;
