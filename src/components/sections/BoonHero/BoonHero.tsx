"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import styles from "./BoonHero.module.css";
import { MineralDustField } from "@/components/sections/hero-layers/MineralDustField";

export interface BoonHeroProps {
  /** Scroll progress from 0 (top) to 1. Directly scrubs the reference animation timeline. */
  progress?: number;
  onExploreClick?: () => void;
}

const TOTAL_FRAMES = 300;

function getFrameUrl(index: number): string {
  const padded = String(index).padStart(4, "0");
  return `/frames/hero-sequence/frame_${padded}.png`;
}

export const BoonHero: React.FC<BoonHeroProps> = ({
  progress = 0,
  onExploreClick,
}) => {
  // Damped scrubbed progress strictly bounded in [0, 1]
  const p = Math.max(0, Math.min(1, progress));

  // Refs for Canvas, GSAP Parallax & DOM Elements
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  // GSAP animated overlay refs
  const surfaceLayerRef = useRef<HTMLDivElement | null>(null);
  const telemetryCardRef = useRef<HTMLDivElement | null>(null);
  const openPitLayerRef = useRef<HTMLDivElement | null>(null);
  const undergroundLayerRef = useRef<HTMLDivElement | null>(null);

  // Image cache: index -> HTMLImageElement
  const imageCache = useRef<Map<number, HTMLImageElement>>(new Map());
  const currentFrameRef = useRef<number>(1);
  const lastDrawnFrameRef = useRef<number>(-1);
  const isInitialFrameLoaded = useRef<boolean>(false);

  // Target mouse position for GSAP 3D Parallax tilt
  const mousePos = useRef({ x: 0, y: 0 });

  // Depth calculation for live telemetry UI: +2400m at summit down to -850m deep in mine
  const currentAltitude = Math.round(2400 - p * 3250);

  // ========================================================================
  // 1. CANVAS RENDER FUNCTION WITH OBJECT-FIT: COVER MATH
  // ========================================================================
  const renderFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Find requested frame or closest available in cache
    let img = imageCache.current.get(frameIndex);
    if (!img || !img.complete || img.naturalWidth === 0) {
      // Find closest cached frame
      let bestDist = Infinity;
      let fallbackIndex = 1;
      imageCache.current.forEach((cachedImg, idx) => {
        if (cachedImg.complete && cachedImg.naturalWidth > 0) {
          const dist = Math.abs(idx - frameIndex);
          if (dist < bestDist) {
            bestDist = dist;
            fallbackIndex = idx;
          }
        }
      });
      img = imageCache.current.get(fallbackIndex);
    }

    if (!img || !img.complete || img.naturalWidth === 0) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    // Calculate aspect ratio cover
    const scale = Math.max(cw / iw, ch / ih);
    const nw = iw * scale;
    const nh = ih * scale;
    const nx = (cw - nw) / 2;
    const ny = (ch - nh) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, nx, ny, nw, nh);
    lastDrawnFrameRef.current = frameIndex;
  }, []);

  // Resize Canvas to device resolution with High-DPI support
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      renderFrame(currentFrameRef.current);
    }
  }, [renderFrame]);

  // ========================================================================
  // 2. PROGRESSIVE PRELOADER FOR 300 FRAMES
  // ========================================================================
  useEffect(() => {
    // Step A: Load Frame 1 immediately and draw
    const frame1 = new Image();
    frame1.src = getFrameUrl(1);
    frame1.onload = () => {
      imageCache.current.set(1, frame1);
      isInitialFrameLoaded.current = true;
      resizeCanvas();
    };

    // Step B: Preload key frames first (every 4th frame for instant scrub response)
    const keyIndices: number[] = [];
    for (let i = 1; i <= TOTAL_FRAMES; i += 4) {
      keyIndices.push(i);
    }

    let keyPointer = 0;
    const loadNextKeyFrame = () => {
      if (keyPointer >= keyIndices.length) {
        // Step C: After key frames, load all remaining frames
        loadAllRemainingFrames();
        return;
      }
      const idx = keyIndices[keyPointer++];
      if (!imageCache.current.has(idx)) {
        const img = new Image();
        img.src = getFrameUrl(idx);
        img.onload = () => {
          imageCache.current.set(idx, img);
          loadNextKeyFrame();
        };
        img.onerror = () => loadNextKeyFrame();
      } else {
        loadNextKeyFrame();
      }
    };
    loadNextKeyFrame();

    const loadAllRemainingFrames = () => {
      let idx = 1;
      const loadNext = () => {
        if (idx > TOTAL_FRAMES) return;
        if (!imageCache.current.has(idx)) {
          const img = new Image();
          img.src = getFrameUrl(idx);
          img.onload = () => {
            imageCache.current.set(idx, img);
            idx++;
            loadNext();
          };
          img.onerror = () => {
            idx++;
            loadNext();
          };
        } else {
          idx++;
          loadNext();
        }
      };
      // 3 parallel preloader streams
      loadNext();
      loadNext();
      loadNext();
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [resizeCanvas]);

  // ========================================================================
  // 3. FRAME SCRUBBING ON SCROLL
  // ========================================================================
  useEffect(() => {
    // Map progress 0..1 to frame index 1..300
    const targetFrame = Math.min(TOTAL_FRAMES, Math.max(1, Math.floor(p * (TOTAL_FRAMES - 1)) + 1));
    currentFrameRef.current = targetFrame;
    renderFrame(targetFrame);
  }, [p, renderFrame]);

  // ========================================================================
  // 4. GSAP PARALLAX TWEENING (Scroll & Mouse Movement)
  // ========================================================================
  useEffect(() => {
    // Calculate normalized progress phases
    // Act 1: Surface Mountains (p = 0 to 0.32)
    const act1Fade = Math.max(0, 1 - p / 0.28);
    const act1Y = -p * 60; // vh

    // Act 2: Open Pit Haulage (p = 0.32 to 0.68)
    const act2Enter = Math.max(0, Math.min(1, (p - 0.28) / 0.12));
    const act2Exit = Math.max(0, 1 - Math.max(0, (p - 0.62) / 0.1));
    const act2Opacity = act2Enter * act2Exit;
    const act2Y = (1 - act2Enter) * 30 - Math.max(0, (p - 0.62) * 50);

    // Act 3: Deep Underground Mine (p = 0.68 to 1.0)
    const act3Enter = Math.max(0, Math.min(1, (p - 0.68) / 0.12));
    const act3Exit = Math.max(0, 1 - Math.max(0, (p - 0.88) / 0.12));
    const act3Opacity = act3Enter * act3Exit;
    const act3Y = (1 - act3Enter) * 30;

    // GSAP Animate Overlays
    if (surfaceLayerRef.current) {
      gsap.to(surfaceLayerRef.current, {
        opacity: act1Fade,
        y: `${act1Y}vh`,
        duration: 0.25,
        ease: "power2.out",
        overwrite: "auto",
      });
    }

    if (telemetryCardRef.current) {
      gsap.to(telemetryCardRef.current, {
        opacity: act1Fade,
        y: `${act1Y * 0.7}vh`,
        duration: 0.25,
        ease: "power2.out",
        overwrite: "auto",
      });
    }

    if (openPitLayerRef.current) {
      gsap.to(openPitLayerRef.current, {
        opacity: act2Opacity,
        y: `${act2Y}px`,
        duration: 0.25,
        ease: "power2.out",
        overwrite: "auto",
      });
    }

    if (undergroundLayerRef.current) {
      gsap.to(undergroundLayerRef.current, {
        opacity: act3Opacity,
        y: `${act3Y}px`,
        duration: 0.25,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  }, [p]);

  // GSAP 3D Perspective Tilt on Mouse Movement
  useEffect(() => {
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isTouch || reducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      mousePos.current = { x: nx, y: ny };

      const damp = Math.max(0, 1 - p * 2.2);
      if (stageRef.current) {
        gsap.to(stageRef.current, {
          rotationY: nx * 3.5 * damp,
          rotationX: -ny * 2.8 * damp,
          transformPerspective: 1200,
          duration: 0.6,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [p]);

  // Handover to downstream scene at p >= 0.88
  const heroOpacity = p >= 0.88 ? Math.max(0, 1 - (p - 0.88) / 0.12) : 1.0;
  const isHidden = heroOpacity <= 0.005;
  const pointerEvents = heroOpacity > 0.05 && p < 0.5 ? "auto" : "none";

  const handleScrollClick = () => {
    if (onExploreClick) {
      onExploreClick();
    } else {
      window.scrollBy({
        top: window.innerHeight * 0.95,
        behavior: "smooth",
      });
    }
  };

  return (
    <section
      ref={containerRef}
      className={styles.heroContainer}
      style={{
        opacity: heroOpacity.toFixed(3),
        pointerEvents: pointerEvents as "auto" | "none",
        visibility: isHidden ? "hidden" : "visible",
        display: isHidden ? "none" : undefined,
      }}
      aria-label="Mining Discovery - From Alpine Summit to Deep Underground Extraction"
    >
      {/* 1. 300-FRAME HIGH-PERFORMANCE CANVAS */}
      <div className={styles.canvasContainer}>
        <canvas ref={canvasRef} className={styles.sequenceCanvas} />
        <div className={styles.cinematicVignette} />
      </div>

      {/* 2. AMBIENT MINERAL DUST / EMBERS */}
      <div className="absolute inset-0 pointer-events-none z-8" aria-hidden="true">
        <MineralDustField disabled={p > 0.88} />
      </div>

      {/* 3. GSAP 3D PARALLAX OVERLAY STAGE */}
      <div ref={stageRef} className={styles.overlayStage}>
        {/* ================================================================= */}
        {/* ACT 1: SURFACE MOUNTAIN OVERLAY (p = 0 to 0.32)                   */}
        {/* ================================================================= */}
        <div ref={surfaceLayerRef} className={styles.surfaceLayer}>
          <div className={styles.glassBadge}>
            <span className={styles.badgePulseDot} />
            <span className={styles.badgeText}>Natural Resource Discovery</span>
          </div>

          <h1 className={styles.heroTitle}>
            <span>MINING</span>
            <span>DISCOVERY</span>
          </h1>

          <p className={styles.heroSubline}>
            From alpine geological exploration to high-valuation institutional capital.
          </p>
        </div>

        {/* Floating Telemetry Glass Card (Top Right) */}
        <div ref={telemetryCardRef} className={`${styles.glassPanel} ${styles.glassTelemetryCard}`}>
          <span className={styles.telemetryLabel}>GEOLOGICAL TELEMETRY</span>
          <div className={styles.telemetryValue}>
            <span>ALT {currentAltitude > 0 ? `+${currentAltitude}` : currentAltitude}M</span>
          </div>
          <p className={styles.telemetryDesc}>
            High-grade core drill verification & aerial lidar terrain mapping.
          </p>
        </div>

        {/* ================================================================= */}
        {/* ACT 2: OPEN PIT HAULAGE OVERLAY (p = 0.32 to 0.68)                */}
        {/* ================================================================= */}
        <div ref={openPitLayerRef} className={`${styles.glassPanel} ${styles.openPitLayer}`}>
          <div className={styles.glassBadge} style={{ marginBottom: "0.8rem" }}>
            <span className={styles.badgePulseDot} style={{ background: "#ff8c00", boxShadow: "0 0 8px #ff8c00" }} />
            <span className={styles.badgeText}>Phase 02: Open Pit Haulage</span>
          </div>

          <h2 className={styles.actHeadline}>
            THE SCALE OF EXTRACTION
          </h2>

          <p className={styles.heroSubline} style={{ textAlign: "left", margin: 0 }}>
            Spiral haul roads connecting high-tonnage extraction zones directly to the primary underground portal.
          </p>
        </div>

        {/* ================================================================= */}
        {/* ACT 3: DEEP UNDERGROUND EXTRACTION (p = 0.68 to 1.0)              */}
        {/* ================================================================= */}
        <div ref={undergroundLayerRef} className={`${styles.glassPanel} ${styles.undergroundLayer}`}>
          <div className={styles.glassBadge} style={{ marginBottom: "0.8rem" }}>
            <span className={styles.badgePulseDot} />
            <span className={styles.badgeText}>Phase 03: Underground Stope</span>
          </div>

          <h2 className={styles.actHeadline}>
            WHERE VALUE IS UNEARTHED
          </h2>

          <p className={styles.heroSubline} style={{ textAlign: "left", margin: 0 }}>
            Continuous miners cutting high-grade ore at depth. Ground truth engineered into unprecedented market valuation.
          </p>

          <button
            type="button"
            className={styles.undergroundCtaButton}
            onClick={handleScrollClick}
            aria-label="Explore Showcase"
          >
            <span>ENTER CAPITAL SHOWCASE</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 4. BOTTOM BAR: LIVE DEPTH INDICATOR & SCROLL CUE                  */}
      {/* ================================================================= */}
      <div className={styles.bottomBar}>
        {/* Live Depth Indicator */}
        <div className={styles.depthIndicator}>
          <span className={styles.depthLabel}>
            {currentAltitude >= 0 ? `ELEV +${currentAltitude}M` : `DEPTH ${Math.abs(currentAltitude)}M`}
          </span>
          <div className={styles.depthTrack}>
            <div
              className={styles.depthFill}
              style={{ width: `${Math.round(p * 100)}%` }}
            />
          </div>
          <span className={styles.depthLabel} style={{ opacity: 0.6 }}>
            {p < 0.35 ? "SUMMIT" : p < 0.7 ? "OPEN PIT" : "DEEP SHAFT"}
          </span>
        </div>

        {/* Scroll Cue */}
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
          aria-label="Scroll down to begin 3D story journey"
        >
          <span className={styles.scrollText}>SCROLL TO EXPLORE</span>
          <div className={styles.scrollDots} aria-hidden="true">
            <span className={styles.scrollDot} />
            <span className={styles.scrollDot} />
            <span className={styles.scrollDot} />
            <span className={styles.scrollDot} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default BoonHero;
