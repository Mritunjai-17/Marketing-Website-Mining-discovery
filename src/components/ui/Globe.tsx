"use client";

import React, { useEffect, useRef, useState } from "react";
import createGlobe from "cobe";

export interface GlobeProps {
  className?: string;
  size?: number;
  enableMarkers?: boolean;
}

export interface CityMarkerData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  color: string;
}

/**
 * SINGLE SOURCE OF TRUTH FOR GLOBE LOCATION MARKERS
 * Target coordinates requested:
 * - TORONTO: latitude 43.653° N, longitude 79.383° W (-79.383)
 * - JOHANNESBURG: latitude 26.204° S (-26.204), longitude 28.047° E
 * - PERTH: latitude 31.951° S (-31.951), longitude 115.861° E
 * - SANTIAGO: latitude 33.449° S (-33.449), longitude 70.669° W (-70.669)
 */
export const CITY_MARKERS: CityMarkerData[] = [
  {
    id: "toronto",
    name: "TORONTO",
    lat: 43.653,
    lng: -79.383,
    color: "#D4AF37",
  },
  {
    id: "johannesburg",
    name: "JOHANNESBURG",
    lat: -26.204,
    lng: 28.047,
    color: "#FFFFFF",
  },
  {
    id: "perth",
    name: "PERTH",
    lat: -31.951,
    lng: 115.861,
    color: "#D4AF37",
  },
  {
    id: "santiago",
    name: "SANTIAGO",
    lat: -33.449,
    lng: -70.669,
    color: "#D4AF37",
  },
];

// Connections between hubs
const CONNECTIONS = [
  { from: "perth", to: "toronto" },
  { from: "toronto", to: "santiago" },
  { from: "santiago", to: "johannesburg" },
  { from: "johannesburg", to: "perth" },
];

/**
 * COBE NATIVE 3D SPHERICAL PROJECTION MATH
 * Uses cobe's exact internal 3D spherical point conversion (U) and WebGL view matrix
 * projection (O) to guarantee 1:1 alignment between HTML/SVG markers and WebGL landmasses.
 */
function getCobe3DPoint(lat: number, lng: number): [number, number, number] {
  const r = (lat * Math.PI) / 180;
  const a = (lng * Math.PI) / 180 - Math.PI; // cobe 180° prime meridian texture offset
  const o = Math.cos(r);
  return [-o * Math.cos(a), Math.sin(r), o * Math.sin(a)];
}

function projectCobePoint(
  point: [number, number, number],
  phi: number,
  theta: number
) {
  const r = Math.cos(theta);
  const a = Math.cos(phi);
  const o = Math.sin(theta);
  const i = Math.sin(phi);

  const c = a * point[0] + i * point[2];
  const s = i * o * point[0] + r * point[1] - a * o * point[2];

  const xNorm = (c + 1) / 2;
  const yNorm = (-s + 1) / 2;

  const left = xNorm * 100;
  const top = yNorm * 100;
  const xPx = xNorm * 680;
  const yPx = yNorm * 680;

  const depth = -i * r * point[0] + o * point[1] + a * r * point[2];
  const isFront = depth >= 0.05;
  const opacity = isFront ? Math.min(1, (depth - 0.05) / 0.25) : 0;

  return { left, top, xPx, yPx, depth, isFront, opacity };
}

/**
 * Internal render resolution, fixed and deliberately far above the element's CSS size.
 *
 * The element displays at its container width (~680px) and the scroll tour magnifies it
 * with a CSS scale() up to ~3x, so at a stop it occupies ~2040 screen pixels. A buffer
 * sized to the resting element has nothing left to supply there and every zoomed pixel
 * is pure upscale. Rendering at 2400 instead means the compositor is always DOWNscaling a
 * denser render: crisp at rest, still native-ish at full zoom.
 *
 * Fixed rather than derived from offsetWidth so it never changes during scroll — the
 * canvas is created exactly once and no zoom level can trigger a rebuild.
 */
const RENDER_SIZE = 2400;
/** Dot-matrix density. Raised because individual dots are resolvable at full zoom. */
const MAP_SAMPLES = 45000;

export const Globe: React.FC<GlobeProps> = ({
  className = "",
  size = 680,
  enableMarkers = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const arcPathRefs = useRef<Array<SVGPathElement | null>>([]);
  const hoveredTagRef = useRef<string | null>(null);

  const pointerInteracting = useRef<{ x: number; y: number } | null>(null);
  const pointerInteractionMovement = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const phiRef = useRef(0);
  const thetaRef = useRef(0.25);
  const autoRotateTimer = useRef<NodeJS.Timeout | null>(null);

  const [isInView, setIsInView] = useState(true);
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);

  useEffect(() => {
    hoveredTagRef.current = hoveredTag;
  }, [hoveredTag]);

  // Intersection Observer to pause rendering when scrolled out
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (canvasRef.current) {
      observer.observe(canvasRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const currentCanvas = canvasRef.current;
    if (!currentCanvas || !isInView) return;

    // No resize handling any more, and none is needed: the drawing buffer is fixed at
    // RENDER_SIZE and the element is sized entirely by CSS (w-full h-full), so the
    // browser rescales an already-dense render. The globe is created exactly once.

    // Initialize WebGL Globe with exact city lat/lng markers and arcs
    const globe = createGlobe(currentCanvas, {
      // 4, not 2. This is what actually multiplies the internal pixel count, and it also
      // scales cobe's dot and marker sizing so the denser matrix keeps its proportions.
      devicePixelRatio: 4,
      // Fixed, and independent of offsetWidth: the buffer is sized for the zoomed-in
      // stop, not for the resting element. See RENDER_SIZE.
      width: RENDER_SIZE,
      height: RENDER_SIZE,
      phi: phiRef.current,
      theta: thetaRef.current,
      dark: 0,
      diffuse: 1.35,
      mapSamples: MAP_SAMPLES,
      mapBrightness: 6.5,
      mapBaseBrightness: 0.12,
      baseColor: [0.86, 0.78, 0.65], // Warm rich copper-gold tan dots
      markerColor: [0.85, 0.65, 0.12], // Gold
      glowColor: [0.92, 0.75, 0.35], // Soft outer gold ambient glow
      markers: CITY_MARKERS.map((h) => ({
        location: [h.lat, h.lng],
        size: 0.04,
        color: h.color === "#FFFFFF" ? [0.92, 0.92, 0.92] : [0.85, 0.65, 0.12],
      })),
      arcs: CONNECTIONS.map((conn) => {
        const fromCity = CITY_MARKERS.find((c) => c.id === conn.from)!;
        const toCity = CITY_MARKERS.find((c) => c.id === conn.to)!;
        return {
          from: [fromCity.lat, fromCity.lng],
          to: [toCity.lat, toCity.lng],
          color: [0.85, 0.65, 0.12],
        };
      }),
      arcColor: [0.85, 0.65, 0.12],
      arcWidth: 1.4,
      arcHeight: 0.32,
    });

    let animFrameId: number;

    /**
     * UNIFIED RENDER FRAME LOOP
     * Updates WebGL globe canvas and mutates HTML/SVG marker DOM nodes synchronously
     * on the exact same requestAnimationFrame frame for 0-latency scroll synchronization.
     */
    const renderFrame = () => {
      if (pointerInteracting.current === null) {
        phiRef.current += 0.003; // Continuous rotation
      }

      const currentPhi = phiRef.current + pointerInteractionMovement.current.x;
      const rawTheta = thetaRef.current - pointerInteractionMovement.current.y;
      const currentTheta = Math.max(-1.35, Math.min(1.35, rawTheta));

      globe.update({ phi: currentPhi, theta: currentTheta });

      if (enableMarkers) {
        const projMap: Record<string, ReturnType<typeof projectCobePoint>> = {};

        CITY_MARKERS.forEach((city) => {
          const point3d = getCobe3DPoint(city.lat, city.lng);
          const proj = projectCobePoint(point3d, currentPhi, currentTheta);
          projMap[city.id] = proj;

          const el = markerRefs.current[city.id];
          if (el) {
            const isHovered = hoveredTagRef.current === city.id;
            el.style.left = `${proj.left}%`;
            el.style.top = `${proj.top}%`;
            el.style.opacity = `${proj.opacity}`;
            el.style.transform = `translate(-50%, -50%) scale(${isHovered ? 1.1 : 1})`;
            el.style.pointerEvents = proj.opacity > 0.1 ? "auto" : "none";
          }
        });

        CONNECTIONS.forEach((conn, idx) => {
          const pathEl = arcPathRefs.current[idx];
          if (pathEl) {
            const pFrom = projMap[conn.from];
            const pTo = projMap[conn.to];
            if (pFrom && pTo) {
              const arcOpacity = Math.min(pFrom.opacity, pTo.opacity);
              if (arcOpacity > 0.05) {
                const midX = (pFrom.xPx + pTo.xPx) / 2;
                const midY = (pFrom.yPx + pTo.yPx) / 2;
                const dx = midX - 340;
                const dy = midY - 340;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const ctrlX = midX + (dx / dist) * 35;
                const ctrlY = midY + (dy / dist) * 35;

                pathEl.setAttribute(
                  "d",
                  `M ${pFrom.xPx} ${pFrom.yPx} Q ${ctrlX} ${ctrlY} ${pTo.xPx} ${pTo.yPx}`
                );
                pathEl.style.opacity = `${arcOpacity * 0.7}`;
              } else {
                pathEl.style.opacity = "0";
              }
            }
          }
        });
      }

      animFrameId = requestAnimationFrame(renderFrame);
    };

    animFrameId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(animFrameId);
      globe.destroy();
    };
  }, [isInView, size, enableMarkers]);

  const handlePointerUpOrOut = () => {
    if (pointerInteracting.current !== null) {
      phiRef.current += pointerInteractionMovement.current.x;
      const newTheta = thetaRef.current - pointerInteractionMovement.current.y;
      thetaRef.current = Math.max(-1.35, Math.min(1.35, newTheta));

      pointerInteractionMovement.current = { x: 0, y: 0 };
      pointerInteracting.current = null;
    }
  };

  return (
    <div
      className={`relative flex flex-col items-center select-none w-full max-w-[680px] aspect-square ${className}`}
    >
      {/* Soft Outer Ambient Gold Glow */}
      <div className="absolute inset-0 rounded-full pointer-events-none transition-all duration-300 blur-3xl opacity-30 bg-radial from-[#D4AF37]/40 via-[#B8860B]/20 to-transparent -z-10" />

      {/* Responsive Globe WebGL Canvas Container */}
      <div
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing touch-pan-y aspect-square"
        onPointerDown={(e) => {
          if ((e as any).pointerType === "touch") return;
          pointerInteracting.current = {
            x: e.clientX,
            y: e.clientY,
          };
          pointerInteractionMovement.current = { x: 0, y: 0 };
          if (autoRotateTimer.current) clearTimeout(autoRotateTimer.current);
        }}
        onPointerUp={handlePointerUpOrOut}
        onPointerLeave={handlePointerUpOrOut}
        onMouseMove={(e) => {
          if (pointerInteracting.current !== null) {
            const deltaX = e.clientX - pointerInteracting.current.x;
            const deltaY = e.clientY - pointerInteracting.current.y;
            pointerInteractionMovement.current = {
              x: deltaX * 0.006,
              y: deltaY * 0.006,
            };
          }
        }}
        onTouchMove={(e) => {
          if (pointerInteracting.current !== null && e.touches[0]) {
            const deltaX = e.touches[0].clientX - pointerInteracting.current.x;
            const deltaY = e.touches[0].clientY - pointerInteracting.current.y;
            pointerInteractionMovement.current = {
              x: deltaX * 0.006,
              y: deltaY * 0.006,
            };
          }
        }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full aspect-square transition-opacity duration-700 filter drop-shadow-xl object-contain"
          style={{ contain: "layout paint size" }}
        />

        {/* 3D PROJECTED CONNECTION ARCS SVG OVERLAY */}
        {enableMarkers && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-10"
            viewBox="0 0 680 680"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="globeArcGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.85" />
                <stop offset="60%" stopColor="#B8860B" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.15" />
              </linearGradient>
              <linearGradient id="globeArcGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#D4AF37" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#B8860B" stopOpacity="0.2" />
              </linearGradient>
            </defs>

            {/* Dashed Decorative Orbit Ring */}
            <ellipse
              cx="340"
              cy="340"
              rx="295"
              ry="120"
              stroke="#D4AF37"
              strokeWidth="1.2"
              strokeOpacity="0.3"
              strokeDasharray="6 3"
              transform="rotate(-15 340 340)"
            />

            {/* Dynamic Arcs Connecting Projected City Points */}
            {CONNECTIONS.map((conn, idx) => (
              <path
                key={`${conn.from}-${conn.to}`}
                ref={(el) => {
                  arcPathRefs.current[idx] = el;
                }}
                stroke={idx % 2 === 0 ? "url(#globeArcGrad1)" : "url(#globeArcGrad2)"}
                strokeWidth="1.5"
                strokeLinecap="round"
                style={{
                  opacity: 0,
                  transition: "opacity 0.15s ease-out",
                }}
              />
            ))}
          </svg>
        )}

        {/* 3D PROJECTED LOCATION MARKERS (LABELS & ANCHOR DOTS IN SAME RELATIVE WRAPPER) */}
        {enableMarkers && (
          <div className="absolute inset-0 pointer-events-auto z-20">
            {CITY_MARKERS.map((marker) => {
              const isHovered = hoveredTag === marker.id;

              return (
                <div
                  key={marker.id}
                  ref={(el) => {
                    markerRefs.current[marker.id] = el;
                  }}
                  className="absolute cursor-pointer group"
                  style={{
                    left: "50%",
                    top: "50%",
                    opacity: 0,
                    transform: "translate(-50%, -50%)",
                  }}
                  onMouseEnter={() => setHoveredTag(marker.id)}
                  onMouseLeave={() => setHoveredTag(null)}
                >
                  {/* Anchor Dot (Exact Geographic 3D Point on Globe Surface) */}
                  <div className="relative flex items-center justify-center">
                    <div
                      className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shadow-[0_0_10px_#D4AF37] transition-transform duration-200 ${
                        isHovered ? "scale-125" : ""
                      }`}
                      style={{ backgroundColor: marker.color }}
                    />
                    <div className="absolute w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-[#D4AF37]/50 animate-ping opacity-40 pointer-events-none" />
                  </div>

                  {/* Connector Line & Location Label Pill */}
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 top-3.5 sm:top-4.5 flex items-center gap-1 sm:gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-[#0B1F3A]/95 border shadow-lg backdrop-blur-md transition-all duration-200 whitespace-nowrap ${
                      isHovered
                        ? "border-[#D4AF37] bg-[#0B1F3A] shadow-[0_0_16px_rgba(212,175,55,0.5)] scale-105"
                        : "border-[#D4AF37]/40 hover:border-[#D4AF37]/80"
                    }`}
                  >
                    <span className="text-[9px] sm:text-[10px] font-bold tracking-wider text-white uppercase font-sans">
                      {marker.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
