"use client";

import React, { useEffect, useRef, useCallback, useImperativeHandle } from "react";
import styles from "./ParallaxDescentHero.module.css";

export interface ParallaxDescentHeroHandle {
  setProgress: (p: number) => void;
}

export interface ParallaxDescentHeroProps {
  /** Scroll progress from 0 (summit) to 1 (underground depth) */
  progress?: number;
  onExploreClick?: () => void;
}

const LAYERS = [
  { id: "L_sky", f: 0.05, y0: -0.25, src: "/images/parallax-descent/L_sky.jpg", alt: "Alpine Sky" },
  { id: "L_peaks", f: 0.20, y0: 0.0, src: "/images/parallax-descent/L_peaks.webp", alt: "Mountain Peaks" },
  { id: "L_mid", f: 0.35, y0: 0.0, src: "/images/parallax-descent/L_mid.webp", alt: "Mid Range Ridge" },
  { id: "L_camp", f: 0.50, y0: 0.0, src: "/images/parallax-descent/L_camp.webp", alt: "Exploration Camp" },
  { id: "L_pit", f: 0.70, y0: 0.75, src: "/images/parallax-descent/L_pit.webp", alt: "Open Pit Extraction Mine" },
  { id: "L_portal", f: 1.05, y0: 2.15, src: "/images/parallax-descent/L_portal.webp", alt: "Mine Entrance Portal" },
  { id: "L_tunnel", f: 1.30, y0: 3.15, src: "/images/parallax-descent/L_tunnel.webp", alt: "Underground Stope Tunnel" },
];

const CMAX = 2.42; // Camera travel in photo heights

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function seg(p: number, a: number, b: number, e?: (t: number) => number) {
  const t = clamp((p - a) / (b - a), 0, 1);
  return e ? e(t) : t;
}

function eOut(t: number) {
  return 1 - (1 - t) * (1 - t);
}

function eIO(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function mixHex(a: string, b: string, t: number) {
  const c = (h: string) => [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16));
  const A = c(a);
  const B = c(b);
  return (
    "#" +
    A.map((v, i) => Math.round(lerp(v, B[i], t)).toString(16).padStart(2, "0")).join("")
  );
}

const ParallaxDescentHeroComponent = React.forwardRef<
  ParallaxDescentHeroHandle,
  ParallaxDescentHeroProps
>(function ParallaxDescentHero({ progress = 0, onExploreClick }, ref) {
  const p = clamp(progress, 0, 1);
  const pRef = useRef(p);

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const hazeRef = useRef<HTMLDivElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const lampRef = useRef<HTMLDivElement>(null);
  const glintsRef = useRef<HTMLDivElement>(null);
  const vigRef = useRef<HTMLDivElement>(null);
  const dustFRef = useRef<HTMLDivElement>(null);
  const dustCRef = useRef<HTMLDivElement>(null);

  const hudRef = useRef<HTMLDivElement>(null);
  const elevRef = useRef<HTMLSpanElement>(null);
  const phaseRef = useRef<HTMLSpanElement>(null);
  const markerRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  const w1Ref = useRef<HTMLDivElement>(null);
  const w2Ref = useRef<HTMLDivElement>(null);
  const b3Ref = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const videoLoadedRef = useRef(false);
  const latestTargetTimeRef = useRef(0);

  const mouseRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const dimsRef = useRef({ vh: 900, vw: 1440, Hp: 900, railH: 500 });
  const lastHudColorRef = useRef<string>("");
  const lastElevTextRef = useRef<string>("");
  const lastPhaseTextRef = useRef<string>("");

  const measure = useCallback(() => {
    if (!stageRef.current) return;
    const vh = stageRef.current.clientHeight || window.innerHeight;
    const vw = stageRef.current.clientWidth || window.innerWidth;
    const Hp = Math.max(vw, vh * 1.7917) / 1.7917;
    const railH = railRef.current?.clientHeight || 500;
    dimsRef.current = { vh, vw, Hp, railH };
  }, []);

  const renderFrame = useCallback(() => {
    const curP = pRef.current;
    const { vh, vw, Hp, railH } = dimsRef.current;
    const c = curP * CMAX * Hp;
    const mouse = mouseRef.current;
    const isMobile = vw < 768;

    if (containerRef.current) {
      containerRef.current.style.opacity = "1";
    }

    // 1. Layer-Specific 3D Camera Dive: Iced Mountains -> Mountain Pass -> Open Pit Bowl -> Stope
    LAYERS.forEach((L) => {
      const el = layerRefs.current[L.id];
      if (!el) return;

      const yBase = L.y0 * Hp - L.f * c;
      const mx = isMobile ? 0 : mouse.x * L.f * 22;
      const my = isMobile ? 0 : mouse.y * L.f * 10;

      let layerScale = 1.0;
      let layerY = yBase + my;
      let layerOpacity = 1.0;
      let origin = "50% 50%";

      if (L.id === "L_sky") {
        layerScale = 1.0 + 0.08 * seg(curP, 0, 0.5);
      } else if (L.id === "L_peaks") {
        // Camera dives forward into the iced mountain peaks (curP: 0.10 to 0.46)
        const diveP = seg(curP, 0.10, 0.46, eIO);
        layerScale = 1.0 + 0.36 * diveP;
        layerY -= 35 * diveP;
        origin = "50% 48%";
        layerOpacity = 1.0 - seg(curP, 0.32, 0.48);
      } else if (L.id === "L_mid") {
        // Mid-range ridge parts and swoops forward
        const diveP = seg(curP, 0.08, 0.44, eIO);
        layerScale = 1.0 + 0.46 * diveP;
        layerY -= 20 * diveP;
        origin = "50% 50%";
        layerOpacity = 1.0 - seg(curP, 0.28, 0.44);
      } else if (L.id === "L_camp") {
        // High mountain camp on the ridge
        const diveP = seg(curP, 0.08, 0.42, eIO);
        layerScale = 1.0 + 0.50 * diveP;
        origin = "50% 55%";
        layerOpacity = 1.0 - seg(curP, 0.24, 0.40);
      } else if (L.id === "L_pit") {
        // Open Pit Mine physically nestled inside the mountain bowl!
        // As the camera crests the iced mountain ridge, the vast pit emerges from deep perspective
        const pitEntrance = seg(curP, 0.22, 0.44, eOut);
        const basePitScale = 0.85 + 0.17 * pitEntrance;
        const portalDive = seg(curP, 0.62, 0.78, eIO);
        layerScale = basePitScale + 0.28 * portalDive;
        layerY += (1 - pitEntrance) * 80;
        origin = "50% 52%";
        const pitExit = seg(curP, 0.66, 0.78);
        layerOpacity = pitEntrance * (1 - pitExit);
      } else if (L.id === "L_portal") {
        // Portal at pit bottom
        const portalEntrance = seg(curP, 0.60, 0.76, eOut);
        const portalExit = seg(curP, 0.80, 0.88);
        layerScale = 0.90 + 0.35 * seg(curP, 0.65, 0.86, eIO);
        layerOpacity = portalEntrance * (1 - portalExit);
        origin = "50% 50%";
      } else if (L.id === "L_tunnel") {
        // Level -450M underground cavern & road origin
        layerOpacity = seg(curP, 0.76, 0.88, eOut);
      }

      // Cull offscreen or fully transparent layers
      const isHidden = layerOpacity <= 0.005;
      if (isHidden) {
        if (el.style.visibility !== "hidden") {
          el.style.visibility = "hidden";
        }
      } else {
        if (el.style.visibility !== "visible") {
          el.style.visibility = "visible";
        }
        el.style.opacity = layerOpacity.toFixed(3);
        el.style.transformOrigin = origin;
        el.style.transform = `translate3d(${mx.toFixed(1)}px, ${layerY.toFixed(1)}px, 0) scale(${layerScale.toFixed(4)})`;
      }
    });

    // 1b. Text inside stack - Phase 01: Mining Discovery
    // Stably anchored until camera drops over summit ridge into clouds
    if (w1Ref.current) {
      const mx = isMobile ? 0 : mouse.x * 0.42 * 22;
      const my = isMobile ? 0 : mouse.y * 4;
      const dissolve1 = seg(curP, 0.18, 0.26, eIO);
      const op1 = Math.max(0, 1 - dissolve1);
      const dy1 = -24 * dissolve1;
      const blur1 = dissolve1 * 4;

      w1Ref.current.style.transform = `translate3d(${mx.toFixed(1)}px, ${(dy1 + my).toFixed(1)}px, 0)`;
      w1Ref.current.style.opacity = op1.toFixed(3);
      if (blur1 > 0.1 && blur1 < 3.9) {
        w1Ref.current.style.filter = `blur(${blur1.toFixed(1)}px)`;
      } else {
        w1Ref.current.style.filter = "none";
      }
      w1Ref.current.style.visibility = op1 <= 0.005 ? "hidden" : "visible";
    }

    // Phase 02: The scale of extraction
    // Emerges: 0.26 to 0.34 (Open pit and haul trucks in mountain bowl)
    // Holds: 0.34 to 0.48 (Panoramic view of spiral roads)
    // Dissolves: 0.48 to 0.56 (Camera accelerates into underground tunnel mouth)
    if (w2Ref.current) {
      const mx = isMobile ? 0 : mouse.x * 0.42 * 22;
      const my = isMobile ? 0 : mouse.y * 4;

      let op2 = 0;
      let dy2 = 0;
      let blur2 = 0;

      if (curP >= 0.26 && curP <= 0.56) {
        if (curP < 0.34) {
          const emerge2 = seg(curP, 0.26, 0.34, eOut);
          op2 = emerge2;
          dy2 = 20 * (1 - emerge2);
          blur2 = (1 - emerge2) * 4;
        } else if (curP <= 0.48) {
          op2 = 1;
          dy2 = 0;
          blur2 = 0;
        } else {
          const dissolve2 = seg(curP, 0.48, 0.56, eIO);
          op2 = Math.max(0, 1 - dissolve2);
          dy2 = -24 * dissolve2;
          blur2 = dissolve2 * 4;
        }
      }

      w2Ref.current.style.transform = `translate3d(${mx.toFixed(1)}px, ${(dy2 + my).toFixed(1)}px, 0)`;
      w2Ref.current.style.opacity = op2.toFixed(3);
      if (blur2 > 0.1 && blur2 < 3.9) {
        w2Ref.current.style.filter = `blur(${blur2.toFixed(1)}px)`;
      } else {
        w2Ref.current.style.filter = "none";
      }
      w2Ref.current.style.visibility = op2 <= 0.005 ? "hidden" : "visible";
    }

    // 3. Atmosphere (skip on mobile where dust, lamp, and grain are display:none)
    if (!isMobile) {
      if (dustFRef.current) {
        const dF = 0.10 + 0.35 * seg(curP, 0.25, 0.5) - 0.2 * seg(curP, 0.82, 0.95);
        dustFRef.current.style.opacity = dF.toFixed(3);
        dustFRef.current.style.transform = `translate3d(0, ${(-(1.15 * c) % (vh * 1.4)).toFixed(1)}px, 0)`;
      }
      if (dustCRef.current) {
        const dC = 0.35 * seg(curP, 0.32, 0.55) * (1 - seg(curP, 0.70, 0.82));
        dustCRef.current.style.opacity = dC.toFixed(3);
        dustCRef.current.style.transform = `translate3d(0, ${(-(1.15 * c) % (vh * 1.4)).toFixed(1)}px, 0)`;
      }
      if (lampRef.current) {
        lampRef.current.style.opacity = (0.85 * seg(curP, 0.86, 0.96)).toFixed(3);
        lampRef.current.style.transform = `translate(calc(-50% + ${(mouse.x * 60).toFixed(1)}px), calc(-50% + ${(mouse.y * 40).toFixed(1)}px))`;
      }
    }
    if (hazeRef.current) {
      hazeRef.current.style.opacity = (0.30 * seg(curP, 0.32, 0.55) * (1 - seg(curP, 0.72, 0.86))).toFixed(3);
    }
    if (blackRef.current) {
      blackRef.current.style.opacity = (0.35 * seg(curP, 0.80, 0.96)).toFixed(3);
    }
    if (vigRef.current) {
      vigRef.current.style.opacity = (0.15 + 0.55 * seg(curP, 0.45, 0.92)).toFixed(3);
    }
    if (glintsRef.current) {
      glintsRef.current.style.opacity = seg(curP, 0.90, 0.97).toFixed(3);
    }

    // 4. HUD Telemetry & Secondary UI Elements
    // During the visually intricate open-pit section (curP ~ 0.28 to 0.78), deliberately soften secondary UI elements
    // so the cinematic mine landscape remains the hero without visual competition
    const pitFactor = seg(curP, 0.28, 0.38) * (1 - seg(curP, 0.70, 0.80));

    if (hudRef.current) {
      const hudColor = mixHex("#1E2A34", "#F3EFE6", seg(curP, 0.22, 0.38));
      if (hudColor !== lastHudColorRef.current) {
        lastHudColorRef.current = hudColor;
        hudRef.current.style.setProperty("--hud", hudColor);
        hudRef.current.style.textShadow = curP < 0.30 ? "0 1px 2px rgba(255,255,255,.35)" : "0 1px 2px rgba(0,0,0,.45)";
      }
      // Soften telemetry text opacity during open pit
      const hudOp = lerp(1.0, 0.68, pitFactor);
      hudRef.current.style.opacity = hudOp.toFixed(3);
    }

    if (railRef.current) {
      // Soften elevation ruler scale by ~50% during open pit so ticks don't fight mine textures
      const railOp = lerp(0.85, 0.42, pitFactor);
      railRef.current.style.opacity = railOp.toFixed(3);
    }

    let e = 2400;
    if (curP < 0.25) {
      // 0 to 10s: Icy peaks down through clouds into open pit
      e = lerp(2400, 1150, seg(curP, 0.04, 0.25, eIO));
    } else if (curP < 0.55) {
      // 10s to 22s: Open pit haul roads into tunnel mouth
      e = lerp(1150, 450, seg(curP, 0.25, 0.55));
    } else if (curP < 0.80) {
      // 22s to 32s: Tunnel interior stope with miners at depth
      e = lerp(450, -450, seg(curP, 0.55, 0.72, eOut));
    } else {
      // 32s to 40s: Tunnel exit onto mountain surface highway
      e = lerp(-450, 850, seg(curP, 0.80, 0.95));
    }
    e = Math.round(e / 10) * 10;

    const elevText = (e >= 0 ? "+" : "\u2212") + Math.abs(e).toLocaleString("en-US");
    if (elevRef.current && elevText !== lastElevTextRef.current) {
      lastElevTextRef.current = elevText;
      elevRef.current.textContent = elevText;
    }

    const phaseText =
      curP < 0.25
        ? "Summit"
        : curP < 0.55
        ? "Open pit"
        : curP < 0.80
        ? "Underground stope"
        : "Haulage Highway";
    if (phaseRef.current && phaseText !== lastPhaseTextRef.current) {
      lastPhaseTextRef.current = phaseText;
      phaseRef.current.textContent = phaseText;
    }

    if (markerRef.current) {
      const markerY = railH * (20 / 720 + (680 / 720) * (2400 - e) / 2850);
      markerRef.current.style.transform = `translateY(${markerY.toFixed(1)}px)`;
      // Soften orange indicator during open pit
      const markerOp = lerp(1.0, 0.60, pitFactor);
      markerRef.current.style.opacity = markerOp.toFixed(3);
    }

    // Phase 03: Where value is unearthed (Inside active tunnel with miners working)
    // Emerges: 0.58 to 0.66
    // Holds: 0.66 to 0.80
    // Dissolves: 0.80 to 0.88
    if (b3Ref.current) {
      let o3 = 0;
      let dy3 = 0;
      let blur3 = 0;

      if (curP >= 0.58 && curP <= 0.88) {
        if (curP < 0.66) {
          const emerge3 = seg(curP, 0.58, 0.66, eOut);
          o3 = emerge3;
          dy3 = 20 * (1 - emerge3);
          blur3 = (1 - emerge3) * 4;
        } else if (curP <= 0.78) {
          o3 = 1;
          dy3 = 0;
          blur3 = 0;
        } else {
          const dissolve3 = seg(curP, 0.78, 0.88, eIO);
          o3 = Math.max(0, 1 - dissolve3);
          dy3 = -20 * dissolve3;
          blur3 = dissolve3 * 4;
        }
      }

      b3Ref.current.style.opacity = o3.toFixed(3);
      b3Ref.current.style.transform = `translate3d(0, ${dy3.toFixed(1)}px, 0)`;
      if (blur3 > 0.1 && blur3 < 3.9) {
        b3Ref.current.style.filter = `blur(${blur3.toFixed(1)}px)`;
      } else {
        b3Ref.current.style.filter = "none";
      }
      b3Ref.current.style.visibility = o3 <= 0.005 ? "hidden" : "visible";
    }
    if (ctaRef.current) {
      const ctaOp = seg(curP, 0.80, 0.88);
      ctaRef.current.style.opacity = ctaOp.toFixed(3);
      ctaRef.current.style.pointerEvents = curP > 0.80 ? "auto" : "none";
      ctaRef.current.style.visibility = ctaOp <= 0.005 ? "hidden" : "visible";
    }
    if (hintRef.current) {
      const hintOp = 0.85 * (1 - seg(curP, 0.02, 0.08));
      hintRef.current.style.opacity = hintOp.toFixed(3);
      hintRef.current.style.visibility = hintOp <= 0.005 ? "hidden" : "visible";
    }

    // Scroll-scrubbed Cinematic Hero Video (Peaks -> Open Pit -> Tunnel Workers -> Highway Truck)
    if (videoRef.current && videoLoadedRef.current) {
      const v = videoRef.current;
      const vDuration = v.duration || 40.0;
      const targetTime = clamp(curP * (vDuration - 0.08), 0, vDuration - 0.08);
      latestTargetTimeRef.current = targetTime;

      if (!v.seeking && Math.abs(v.currentTime - targetTime) > 0.035) {
        if (typeof (v as any).fastSeek === "function") {
          (v as any).fastSeek(targetTime);
        } else {
          v.currentTime = targetTime;
        }
      }

      v.style.opacity = "1";
      v.style.visibility = "visible";
    }
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      setProgress: (nextP: number) => {
        const clamped = clamp(nextP, 0, 1);
        if (
          Math.abs(clamped - pRef.current) > 0.0001 ||
          clamped === 0 ||
          clamped === 1
        ) {
          pRef.current = clamped;
          renderFrame();
        }
      },
    }),
    [renderFrame]
  );

  // Resize and initial measure
  useEffect(() => {
    measure();
    renderFrame();

    const handleResize = () => {
      measure();
      renderFrame();
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [measure, renderFrame]);

  // Pointer parallax loop (mouse hover only; runs on-demand and sleeps when idle)
  useEffect(() => {
    if (typeof window === "undefined" || window.innerWidth < 768) return;

    let animId: number;
    let isRunning = false;

    const loop = () => {
      const m = mouseRef.current;
      const dx = m.tx - m.x;
      const dy = m.ty - m.y;
      m.x += dx * 0.08;
      m.y += dy * 0.08;
      renderFrame();

      if (Math.abs(dx) > 0.0005 || Math.abs(dy) > 0.0005) {
        animId = requestAnimationFrame(loop);
      } else {
        m.x = m.tx;
        m.y = m.ty;
        isRunning = false;
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      mouseRef.current.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.ty = (e.clientY / window.innerHeight - 0.5) * 2;
      if (!isRunning) {
        isRunning = true;
        animId = requestAnimationFrame(loop);
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      cancelAnimationFrame(animId);
    };
  }, [renderFrame]);

  // Sync when prop changes
  useEffect(() => {
    pRef.current = clamp(progress, 0, 1);
    renderFrame();
  }, [progress, renderFrame]);

  // Download the full video as a Blob so all timestamps are instantly seekable.
  // This eliminates the "hanging" at the end (truck-on-highway ~80-100% of video)
  // because the browser had not buffered that section during streaming.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let blobUrl: string | null = null;
    let cancelled = false;

    const startScrub = () => {
      if (cancelled) return;
      videoLoadedRef.current = true;
      video.pause();
      const initialTime = pRef.current * (video.duration || 40.0);
      if (typeof (video as any).fastSeek === "function") {
        (video as any).fastSeek(initialTime);
      } else {
        video.currentTime = initialTime;
      }
      renderFrame();
    };

    const onSeeked = () => {
      if (!videoLoadedRef.current) return;
      const target = latestTargetTimeRef.current;
      if (Math.abs(video.currentTime - target) > 0.035) {
        if (typeof (video as any).fastSeek === "function") {
          (video as any).fastSeek(target);
        } else {
          video.currentTime = target;
        }
      }
    };

    video.addEventListener("seeked", onSeeked);

    // Fetch entire video file into memory as a Blob
    fetch("/videos/hero_cinematic_full.mp4")
      .then((res) => res.blob())
      .then((blob) => {
        if (cancelled) return;
        blobUrl = URL.createObjectURL(blob);
        video.src = blobUrl;
        video.load();

        const onCanPlay = () => {
          video.removeEventListener("canplay", onCanPlay);
          startScrub();
        };
        video.addEventListener("canplay", onCanPlay);
        // Fallback: if already ready
        if (video.readyState >= 3) startScrub();
      })
      .catch(() => {
        // Fetch failed (offline etc) — fall back to streaming src
        if (cancelled) return;
        video.src = "/videos/hero_cinematic_full.mp4";
        video.load();
        const onCanPlay = () => {
          video.removeEventListener("canplay", onCanPlay);
          startScrub();
        };
        video.addEventListener("canplay", onCanPlay);
      });

    return () => {
      cancelled = true;
      video.removeEventListener("seeked", onSeeked);
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [renderFrame]);


  return (
    <div ref={containerRef} className={styles.descentContainer}>
      <div ref={stageRef} className={styles.stage}>
        {/* Cinematic Scroll-Scrubbed Video (Peaks -> Open Pit -> Tunnel Workers -> Highway) */}
        <video
          ref={videoRef}
          className={styles.diveVideo}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
        />

        {/* Layer Stack: Summit -> Mountain Camp -> Open Pit -> Underground Portal -> Tunnel */}
        {LAYERS.map((L) => (
          <div
            key={L.id}
            ref={(el) => {
              layerRefs.current[L.id] = el;
            }}
            id={L.id}
            className={styles.layer}
            data-f={L.f}
            data-y={L.y0}
          >
            <img src={L.src} alt={L.alt} />
            {L.id === "L_tunnel" && (
              <div ref={glintsRef} className={styles.glints} aria-hidden="true">
                <i className={styles.glint} style={{ left: "46.3%", top: "24.6%", animationDelay: "0s" }} />
                <i className={styles.glint} style={{ left: "49.2%", top: "29.8%", animationDelay: "0.7s" }} />
                <i className={styles.glint} style={{ left: "47.6%", top: "35.7%", animationDelay: "1.3s" }} />
                <i className={styles.glint} style={{ left: "50.5%", top: "39.5%", animationDelay: "1.9s" }} />
                <i className={styles.glint} style={{ left: "44.7%", top: "27.5%", animationDelay: "0.4s" }} />
              </div>
            )}
          </div>
        ))}

        {/* Phase 01 Editorial Headline Tile */}
        <div ref={w1Ref} className={`${styles.wtext} ${styles.w1}`}>
          <p className={styles.kicker}>Natural resource discovery</p>
          <h1 className={styles.headline1}>
            Mining<br />Discovery
          </h1>
          <p className={styles.lede}>
            From alpine geological exploration to high-valuation institutional capital.
          </p>
        </div>

        {/* Phase 02 Open Pit Haulage Tile */}
        <div ref={w2Ref} className={`${styles.wtext} ${styles.w2}`} style={{ visibility: "hidden", opacity: 0 }}>
          <p className={styles.kicker}>Phase 02: open pit haulage</p>
          <h2 className={styles.headline2}>The scale of extraction</h2>
          <p className={styles.lede}>
            Spiral haul roads connecting high-tonnage extraction zones directly to the primary underground portal.
          </p>
        </div>

        {/* Atmospheric Layers & Overlays */}
        <div ref={hazeRef} className={`${styles.wash} ${styles.haze}`} />

        <div ref={dustFRef} className={styles.dust} />
        <div ref={dustCRef} className={`${styles.dust} ${styles.dustCoarse}`} />
        <div ref={blackRef} className={`${styles.wash} ${styles.black}`} />
        <div ref={lampRef} className={styles.lamp} />
        <div ref={vigRef} className={styles.vig} />
        <div className={styles.grain} />

        {/* Geological Telemetry HUD & Elevation Rail */}
        <div ref={hudRef} className={styles.hud}>
          <div className={styles.tele}>
            Geological telemetry
            <strong>
              Elev <span ref={elevRef}>+2,400</span> m
            </strong>
            <span ref={phaseRef}>Summit</span>
          </div>

          <div ref={railRef} className={styles.rail}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 720">
              <line x1="40" y1="20" x2="40" y2="700" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
              <line x1="26" y1="20" x2="54" y2="20" stroke="currentColor" strokeWidth="2" />
              <text x="62" y="24" fontFamily="DejaVu Sans Mono, Menlo, monospace" fontSize="14" fill="currentColor">+2400</text>
              <line x1="34" y1="54" x2="46" y2="54" stroke="currentColor" strokeWidth="1" opacity="0.6" />
              <line x1="34" y1="88" x2="46" y2="88" stroke="currentColor" strokeWidth="1" opacity="0.6" />
              <line x1="34" y1="122" x2="46" y2="122" stroke="currentColor" strokeWidth="1" opacity="0.6" />
              <line x1="26" y1="156" x2="54" y2="156" stroke="currentColor" strokeWidth="2" />
              <text x="62" y="160" fontFamily="DejaVu Sans Mono, Menlo, monospace" fontSize="14" fill="currentColor">+1800</text>
              <line x1="34" y1="190" x2="46" y2="190" stroke="currentColor" strokeWidth="1" opacity="0.6" />
              <line x1="34" y1="224" x2="46" y2="224" stroke="currentColor" strokeWidth="1" opacity="0.6" />
              <line x1="34" y1="258" x2="46" y2="258" stroke="currentColor" strokeWidth="1" opacity="0.6" />
              <line x1="26" y1="292" x2="54" y2="292" stroke="currentColor" strokeWidth="2" />
              <text x="62" y="296" fontFamily="DejaVu Sans Mono, Menlo, monospace" fontSize="14" fill="currentColor">+1200</text>
              <line x1="34" y1="326" x2="46" y2="326" stroke="currentColor" strokeWidth="1" opacity="0.6" />
              <line x1="34" y1="360" x2="46" y2="360" stroke="currentColor" strokeWidth="1" opacity="0.6" />
              <line x1="34" y1="394" x2="46" y2="394" stroke="currentColor" strokeWidth="1" opacity="0.6" />
              <line x1="26" y1="428" x2="54" y2="428" stroke="currentColor" strokeWidth="2" />
              <text x="62" y="432" fontFamily="DejaVu Sans Mono, Menlo, monospace" fontSize="14" fill="currentColor">+600</text>
              <line x1="34" y1="462" x2="46" y2="462" stroke="currentColor" strokeWidth="1" opacity="0.6" />
              <line x1="34" y1="496" x2="46" y2="496" stroke="currentColor" strokeWidth="1" opacity="0.6" />
              <line x1="34" y1="530" x2="46" y2="530" stroke="currentColor" strokeWidth="1" opacity="0.6" />
              <line x1="26" y1="564" x2="54" y2="564" stroke="currentColor" strokeWidth="2" />
              <text x="62" y="568" fontFamily="DejaVu Sans Mono, Menlo, monospace" fontSize="14" fill="currentColor">0</text>
              <line x1="34" y1="598" x2="46" y2="598" stroke="currentColor" strokeWidth="1" opacity="0.6" />
              <line x1="34" y1="632" x2="46" y2="632" stroke="currentColor" strokeWidth="1" opacity="0.6" />
              <line x1="34" y1="666" x2="46" y2="666" stroke="currentColor" strokeWidth="1" opacity="0.6" />
              <line x1="26" y1="700" x2="54" y2="700" stroke="currentColor" strokeWidth="2" />
              <text x="62" y="704" fontFamily="DejaVu Sans Mono, Menlo, monospace" fontSize="14" fill="currentColor">-450</text>
            </svg>
            <i ref={markerRef} className={styles.marker} />
          </div>

          {/* Phase 03 Underground Stope Copy */}
          <div className={styles.copy}>
            <div ref={b3Ref} className={styles.blk}>
              <p className={styles.kicker}>Phase 03: underground stope</p>
              <h2 className={styles.headline2}>Where value is unearthed</h2>
              <p className={styles.lede}>
                Continuous miners cutting high-grade ore at depth. Ground truth engineered into unprecedented market valuation.
              </p>
              <a
                ref={ctaRef}
                className={styles.cta}
                href="#journey"
                onClick={(e) => {
                  e.preventDefault();
                  onExploreClick?.();
                }}
              >
                Enter capital showcase
              </a>
            </div>
          </div>

          <div ref={hintRef} className={styles.hint}>
            Scroll to explore
          </div>
        </div>
      </div>
    </div>
  );
});

ParallaxDescentHeroComponent.displayName = "ParallaxDescentHero";

export const ParallaxDescentHero = React.memo(ParallaxDescentHeroComponent);
export default ParallaxDescentHero;
