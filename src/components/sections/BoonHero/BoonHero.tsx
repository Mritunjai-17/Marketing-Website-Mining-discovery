"use client";

import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import styles from "./BoonHero.module.css";
import { MineralDustField } from "@/components/sections/hero-layers/MineralDustField";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export interface BoonHeroProps {
  /** Scroll progress from 0 (top) to 1. Directly scrubs the reference animation timeline. */
  progress?: number;
  onExploreClick?: () => void;
}

const TOTAL_FRAMES = 240; // 240 frames extracted from Continuous_descent_into_mine.mp4

function getFrameUrl(index: number): string {
  const padded = String(index).padStart(4, "0");
  return `/frames/hero-sequence/frame_${padded}.webp`;
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
  const openPitLayerRef = useRef<HTMLDivElement | null>(null);
  const undergroundLayerRef = useRef<HTMLDivElement | null>(null);

  // In-memory image cache for zero-latency 60-120fps hardware canvas blitting
  const imageCache = useRef<Map<number, HTMLImageElement>>(new Map());
  const currentFrameRef = useRef<number>(1);
  const lastDrawnFrameRef = useRef<number>(-1);

  // Target mouse position for GSAP 3D Parallax tilt
  const mousePos = useRef({ x: 0, y: 0 });

  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  // ========================================================================
  // 1. HARDWARE CANVAS RENDER FUNCTION (Instant 0.1ms render time, NO LAG)
  // ========================================================================
  const renderFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx = ctxRef.current;
    if (!ctx) {
      ctx = canvas.getContext("2d", { alpha: false });
      ctxRef.current = ctx;
    }
    if (!ctx) return;

    // Find requested frame or closest available in memory cache
    let img = imageCache.current.get(frameIndex);
    if (!img || !img.complete || img.naturalWidth === 0) {
      // Fast bidirectional outward search for nearest cached frame
      for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
        const lower = frameIndex - offset;
        if (lower >= 1) {
          const cand = imageCache.current.get(lower);
          if (cand && cand.complete && cand.naturalWidth > 0) {
            img = cand;
            break;
          }
        }
        const higher = frameIndex + offset;
        if (higher <= TOTAL_FRAMES) {
          const cand = imageCache.current.get(higher);
          if (cand && cand.complete && cand.naturalWidth > 0) {
            img = cand;
            break;
          }
        }
      }
    }

    if (!img || !img.complete || img.naturalWidth === 0) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    // Aspect-ratio cover math
    const scale = Math.max(cw / iw, ch / ih);
    const nw = iw * scale;
    const nh = ih * scale;
    const nx = (cw - nw) / 2;
    const ny = (ch - nh) / 2;

    ctx.drawImage(img, nx, ny, nw, nh);
    lastDrawnFrameRef.current = frameIndex;
  }, []);

  const lastDimensionsRef = useRef({ width: 0, height: 0 });

  // Resize Canvas to device resolution with High-DPI support
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    const last = lastDimensionsRef.current;
    const widthChanged = Math.abs(width - last.width) > 1;
    // On mobile, URL bar expand/collapse changes height by ~50-80px.
    // Avoid reallocating canvas buffer on scroll-induced address bar resizes.
    const heightChanged = Math.abs(height - last.height) > 100 || last.height === 0;

    if (widthChanged || heightChanged) {
      lastDimensionsRef.current = { width, height };
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      renderFrame(currentFrameRef.current);
    }
  }, [renderFrame]);

  // ========================================================================
  // 2. HIGH-SPEED PROGRESSIVE PRELOADER FOR 240 WEBP FRAMES
  // ========================================================================
  useEffect(() => {
    let isCancelled = false;

    const onImageLoaded = (idx: number, img: HTMLImageElement) => {
      if (isCancelled) return;
      imageCache.current.set(idx, img);
      const cur = currentFrameRef.current;
      const lastDrawn = lastDrawnFrameRef.current;
      // If this newly loaded image is closer to current scrubbing position than what's currently drawn:
      if (Math.abs(idx - cur) < Math.abs(lastDrawn - cur)) {
        renderFrame(cur);
      }
    };

    // Step A: Load Frame 1 immediately and draw
    const frame1 = new Image();
    frame1.src = getFrameUrl(1);
    frame1.onload = () => {
      if (isCancelled) return;
      imageCache.current.set(1, frame1);
      resizeCanvas();
      renderFrame(currentFrameRef.current);
    };

    // Step B: Preload key frames first (every 4th frame for instant scrub coverage)
    const keyIndices: number[] = [];
    for (let i = 1; i <= TOTAL_FRAMES; i += 4) {
      keyIndices.push(i);
    }
    if (keyIndices[keyIndices.length - 1] !== TOTAL_FRAMES) {
      keyIndices.push(TOTAL_FRAMES);
    }

    let keyPointer = 0;
    const loadNextKeyFrame = () => {
      if (isCancelled) return;
      if (keyPointer >= keyIndices.length) {
        loadAllRemainingFrames();
        return;
      }
      const idx = keyIndices[keyPointer++];
      if (!imageCache.current.has(idx)) {
        const img = new Image();
        img.src = getFrameUrl(idx);
        img.onload = () => {
          onImageLoaded(idx, img);
          loadNextKeyFrame();
        };
        img.onerror = () => loadNextKeyFrame();
      } else {
        loadNextKeyFrame();
      }
    };

    // Launch 3 parallel keyframe loaders
    loadNextKeyFrame();
    loadNextKeyFrame();
    loadNextKeyFrame();

    // Step C: Load remaining interstitial frames with 6 parallel streams
    const loadAllRemainingFrames = () => {
      let idx = 1;
      const loadNext = () => {
        if (isCancelled || idx > TOTAL_FRAMES) return;
        const currentIdx = idx++;
        if (!imageCache.current.has(currentIdx)) {
          const img = new Image();
          img.src = getFrameUrl(currentIdx);
          img.onload = () => {
            onImageLoaded(currentIdx, img);
            loadNext();
          };
          img.onerror = () => loadNext();
        } else {
          loadNext();
        }
      };
      for (let s = 0; s < 6; s++) {
        loadNext();
      }
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    return () => {
      isCancelled = true;
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [resizeCanvas, renderFrame]);

  // ========================================================================
  // 3. ZERO-LATENCY SYNCHRONOUS FRAME SCRUBBING (Before Paint)
  // ========================================================================
  useIsomorphicLayoutEffect(() => {
    // Map progress 0..1 to exact frame 1..240
    const targetFrame = Math.min(TOTAL_FRAMES, Math.max(1, Math.round(p * (TOTAL_FRAMES - 1)) + 1));
    currentFrameRef.current = targetFrame;
    renderFrame(targetFrame);
  }, [p, renderFrame]);

  // ========================================================================
  // 4. PARALLAX & LAYER ANIMATIONS (Synchronous Hardware Transforms)
  // ========================================================================
  useIsomorphicLayoutEffect(() => {
    // Calculate normalized progress phases
    // Act 1: Surface Mountains (p = 0 to 0.32)
    const act1Fade = Math.max(0, 1 - p / 0.28);
    const act1Y = -p * 60; // vh
    const act1Blur = Math.max(0, (1 - act1Fade) * 10);

    // Act 2: Open Pit Haulage (p = 0.32 to 0.68)
    const act2Enter = Math.max(0, Math.min(1, (p - 0.28) / 0.12));
    const act2Exit = Math.max(0, 1 - Math.max(0, (p - 0.62) / 0.1));
    const act2Opacity = act2Enter * act2Exit;
    const act2Y = (1 - act2Enter) * 30 - Math.max(0, (p - 0.62) * 50);
    const act2Blur = Math.max(0, (1 - act2Opacity) * 8);

    // Act 3: Deep Underground Mine (p = 0.68 to 1.0)
    const act3Enter = Math.max(0, Math.min(1, (p - 0.68) / 0.12));
    const act3Exit = Math.max(0, 1 - Math.max(0, (p - 0.88) / 0.12));
    const act3Opacity = act3Enter * act3Exit;
    const act3Y = (1 - act3Enter) * 30;
    const act3Blur = Math.max(0, (1 - act3Opacity) * 8);

    const isMobile = typeof window !== "undefined" && (window.innerWidth < 900 || window.matchMedia("(pointer: coarse)").matches);

    // On mobile: Direct inline style application with translate3d runs directly in the GPU compositor
    // with 0 latency, 0 tween scheduling, and 0 ease fighting touch finger movement!
    if (isMobile) {
      if (surfaceLayerRef.current) {
        surfaceLayerRef.current.style.opacity = act1Fade.toFixed(3);
        surfaceLayerRef.current.style.transform = `translate3d(0, ${act1Y}vh, 0)`;
        surfaceLayerRef.current.style.filter = "none";
      }
      if (openPitLayerRef.current) {
        openPitLayerRef.current.style.opacity = act2Opacity.toFixed(3);
        openPitLayerRef.current.style.transform = `translate3d(0, ${act2Y}px, 0)`;
        openPitLayerRef.current.style.filter = "none";
      }
      if (undergroundLayerRef.current) {
        undergroundLayerRef.current.style.opacity = act3Opacity.toFixed(3);
        undergroundLayerRef.current.style.transform = `translate3d(0, ${act3Y}px, 0)`;
        undergroundLayerRef.current.style.filter = "none";
      }
    } else {
      if (surfaceLayerRef.current) {
        gsap.to(surfaceLayerRef.current, {
          opacity: act1Fade,
          y: `${act1Y}vh`,
          filter: `blur(${act1Blur.toFixed(1)}px)`,
          duration: 0.2,
          ease: "power2.out",
          overwrite: "auto",
        });
      }

      if (openPitLayerRef.current) {
        gsap.to(openPitLayerRef.current, {
          opacity: act2Opacity,
          y: `${act2Y}px`,
          filter: `blur(${act2Blur.toFixed(1)}px)`,
          duration: 0.2,
          ease: "power2.out",
          overwrite: "auto",
        });
      }

      if (undergroundLayerRef.current) {
        gsap.to(undergroundLayerRef.current, {
          opacity: act3Opacity,
          y: `${act3Y}px`,
          filter: `blur(${act3Blur.toFixed(1)}px)`,
          duration: 0.2,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
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
      }}
      aria-label="Mining Discovery - From Alpine Summit to Deep Underground Extraction"
    >
      {/* 1. 240-FRAME HARDWARE CANVAS (Instant 0.1ms scroll scrubbing) */}
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
          <h1 className={styles.heroTitle}>
            <span>MINING</span>
            <span>DISCOVERY</span>
          </h1>

          <p className={styles.heroSubline}>
            From alpine geological exploration to high-valuation institutional capital.
          </p>
        </div>


        {/* ================================================================= */}
        {/* ACT 2: OPEN PIT HAULAGE OVERLAY (p = 0.32 to 0.68)                */}
        {/* ================================================================= */}
        <div
          ref={openPitLayerRef}
          className={styles.openPitLayer}
          style={{ opacity: 0 }}
        >
          <h2 className={styles.actHeadline}>
            THE SCALE OF EXTRACTION
          </h2>

          <p className={styles.actSubline}>
            Spiral haul roads connecting high-tonnage extraction zones directly to the primary underground portal.
          </p>
        </div>

        {/* ================================================================= */}
        {/* ACT 3: DEEP UNDERGROUND EXTRACTION (p = 0.68 to 1.0)              */}
        {/* ================================================================= */}
        <div
          ref={undergroundLayerRef}
          className={styles.undergroundLayer}
          style={{ opacity: 0 }}
        >
          <h2 className={styles.actHeadline}>
            WHERE VALUE IS UNEARTHED
          </h2>

          <p className={styles.actSubline}>
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

    </section>
  );
};

export default BoonHero;
