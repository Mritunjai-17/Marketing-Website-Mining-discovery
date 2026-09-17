"use client";

import React, { useMemo, useRef } from "react";
import styles from "./Journey2D.module.css";
import {
  DEPTH,
  layerClarity,
  layerShift,
  smoothstep,
  type SceneState,
  type StageMetrics,
} from "./journeySideView";
import { useJourneyFrame } from "./journeyScroll";
import { buildClouds, buildSkyline, ridgePath } from "./journeyShapes";

/**
 * The world the road runs through, as parallax plates.
 *
 * Every band here is a plate wider than the stage, repeated three times and
 * translated horizontally. That tiling is what makes the journey's length
 * independent of the artwork's: the camera pans tens of thousands of pixels
 * across the full scroll, and a single plate long enough to cover that would
 * be an enormous path for no benefit. Three tiles and a modulo cover it with
 * three copies of a few kilobytes.
 *
 * Speeds are not chosen per layer — they come from one depth table, so the
 * ordering is guaranteed rather than tuned, and a new band only has to say how
 * far away it is.
 */

interface PlateProps {
  metrics: StageMetrics;
  depth: number;
  /** Path data, drawn at `tileWidth` across. */
  d: string;
  fill: string;
  opacity: number;
  /** Vertical offset from the stage top, in pixels. */
  top?: number;
}

/**
 * One tiled parallax band.
 *
 * The three copies sit at -1, 0 and +1 tiles so the strip is covered whichever
 * way the modulo lands, and the group is translated by the remainder — which
 * stays inside one tile's width however far the camera has travelled, so the
 * transform never grows large enough to lose precision.
 */
const Plate: React.FC<PlateProps> = ({ metrics, depth, d, fill, opacity, top = 0 }) => {
  const ref = useRef<SVGGElement>(null);
  const tileWidth = metrics.width * 1.5;

  useJourneyFrame((scene) => {
    const group = ref.current;
    if (!group) return;
    const shift = layerShift(scene, depth) % tileWidth;
    group.style.transform = `translate3d(${shift.toFixed(2)}px, ${top}px, 0)`;
  });

  return (
    <g ref={ref} opacity={opacity}>
      {[-1, 0, 1].map((tile) => (
        <g key={tile} transform={`translate(${tile * tileWidth} 0)`}>
          <path d={d} fill={fill} />
        </g>
      ))}
    </g>
  );
};

/* ------------------------------------------------------------------- sky */

export const SkyLayer: React.FC<{ metrics: StageMetrics }> = ({ metrics }) => {
  const glowRef = useRef<HTMLDivElement>(null);

  useJourneyFrame((scene) => {
    // The sun's glow drifts a little, so the sky is not visibly pinned while
    // everything in front of it slides.
    if (glowRef.current) {
      const shift = layerShift(scene, DEPTH.glow) * 0.4;
      glowRef.current.style.transform = `translate3d(${shift.toFixed(1)}px, 0, 0)`;
    }
  });

  return (
    <>
      <div className={`${styles.layer} ${styles.sky}`} aria-hidden="true" />
      {/*
       * The horizon glow: a wide, low warm band sitting where the sun has just
       * gone. It is the scene's only large warm area, and it is what keeps the
       * navy from reading as night.
       */}
      <div
        ref={glowRef}
        className={styles.layer}
        style={{
          background: `radial-gradient(58% 26% at 62% ${((metrics.horizonY / metrics.height) * 100).toFixed(1)}%, rgba(226, 150, 72, 0.34) 0%, rgba(186, 112, 56, 0.14) 38%, rgba(11, 31, 58, 0) 74%)`,
        }}
        aria-hidden="true"
      />
    </>
  );
};

/* ---------------------------------------------------------------- ranges */

interface Band {
  depth: number;
  peak: number;
  base: number;
  fill: string;
  opacity: number;
  seed: number;
  roughness: number;
}

/**
 * Three mountain ranges plus a pine treeline.
 *
 * Contrast rises and value darkens as the bands come forward — atmospheric
 * perspective as art direction. The far range is barely separable from the
 * sky; the treeline is a hard silhouette. That spread is the depth cue the
 * upper half of the frame runs on.
 */
const BANDS: Band[] = [
  { depth: DEPTH.farRange, peak: 0.23, base: 0.58, fill: "#14253a", opacity: 0.65, seed: 0x9e1f22, roughness: 0.62 },
  { depth: DEPTH.midRange, peak: 0.17, base: 0.60, fill: "#0c1827", opacity: 0.88, seed: 0x3ac5d1, roughness: 0.54 },
  { depth: DEPTH.forest, peak: 0.09, base: 0.64, fill: "#050d16", opacity: 1, seed: 0x77b208, roughness: 0.38 },
];

export const RangeLayer: React.FC<{ metrics: StageMetrics }> = ({ metrics }) => {
  const { width, height } = metrics;
  const tileWidth = width * 1.5;

  const paths = useMemo(
    () =>
      BANDS.map((band) =>
        ridgePath({
          width: tileWidth,
          height,
          peak: band.peak,
          base: band.base,
          roughness: band.roughness,
          detail: 7,
          seed: band.seed,
        }),
      ),
    [tileWidth, height],
  );

  return (
    <svg
      className={`${styles.layer} ${styles.svgLayer}`}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {BANDS.map((band, index) => (
        <Plate
          key={index}
          metrics={metrics}
          depth={band.depth}
          d={paths[index]}
          fill={band.fill}
          opacity={band.opacity * layerClarity(band.depth)}
        />
      ))}
    </svg>
  );
};

/* ---------------------------------------------------------------- clouds */

export const CloudLayer: React.FC<{ metrics: StageMetrics }> = ({ metrics }) => {
  const ref = useRef<SVGGElement>(null);
  const { width, height } = metrics;
  const tileWidth = width * 1.5;

  const bands = useMemo(() => buildClouds(tileWidth, height * 0.62, 6, 0x51c7a3), [tileWidth, height]);

  useJourneyFrame((scene) => {
    const group = ref.current;
    if (!group) return;
    // Parallax plus a little time-driven drift, so the sky is never frozen
    // even when the page is still — but slow enough to have to look for.
    const shift = (layerShift(scene, DEPTH.clouds) - scene.time * 2.2) % tileWidth;
    group.style.transform = `translate3d(${shift.toFixed(2)}px, 0, 0)`;
  });

  return (
    <svg
      className={`${styles.layer} ${styles.svgLayer}`}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="journey-cloud" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b08a68" />
          <stop offset="100%" stopColor="#3c5d8c" />
        </linearGradient>
      </defs>
      <g ref={ref}>
        {[-1, 0, 1].map((tile) => (
          <g key={tile} transform={`translate(${tile * tileWidth} 0)`}>
            {bands.map((band, index) => (
              <path key={index} d={band.d} fill="url(#journey-cloud)" opacity={band.opacity * 1.5} />
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
};

/* ------------------------------------------------- city and industry */

/**
 * The destination city and the mining structures between here and it.
 *
 * Placed at explicit world positions rather than tiled: these are landmarks,
 * and a landmark that repeats is scenery. The city sits far enough along the
 * route that it is only reached near the end, which is what makes it read as
 * where the journey is going.
 */
const CITY_WORLD_X = 2150;

export const DestinationLayer: React.FC<{ metrics: StageMetrics }> = ({ metrics }) => {
  const cityRef = useRef<SVGGElement>(null);
  const windowsRef = useRef<SVGGElement>(null);
  const industryRef = useRef<SVGGElement>(null);
  const { width, height } = metrics;

  const buildings = useMemo(
    () => buildSkyline({ width: width * 0.5, maxHeight: height * 0.17, count: 15, seed: 0x4d81b2 }),
    [width, height],
  );

  useJourneyFrame((scene: SceneState) => {
    const m = scene.metrics;
    if (cityRef.current) {
      const x = (CITY_WORLD_X - scene.cameraX) * m.pxPerUnit * DEPTH.city;
      cityRef.current.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
    }
    if (industryRef.current) {
      industryRef.current.style.transform = `translate3d(${layerShift(scene, DEPTH.industry).toFixed(1)}px, 0, 0)`;
    }
    // Windows light through the middle of the journey: the destination is
    // always physically there, so this is dusk deepening, not an arrival.
    if (windowsRef.current) {
      windowsRef.current.style.opacity = smoothstep(0.3, 0.8, scene.progress).toFixed(3);
    }
  });

  return (
    <svg
      className={`${styles.layer} ${styles.svgLayer}`}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="journey-tower" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1d3450" />
          <stop offset="100%" stopColor="#0a1729" />
        </linearGradient>
        <radialGradient id="journey-city-glow">
          <stop offset="0%" stopColor="#e8b765" stopOpacity="0.4" />
          <stop offset="60%" stopColor="#c78f45" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#c78f45" stopOpacity="0" />
        </radialGradient>
        {/* Mining Industrial Facility Lighting Gradients */}
        <radialGradient id="mining-ambient-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFB300" stopOpacity="0.42" />
          <stop offset="45%" stopColor="#FF8F00" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#FF6F00" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="mining-flood-flare" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="20%" stopColor="#FFF2B2" stopOpacity="0.9" />
          <stop offset="55%" stopColor="#FFB300" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#FF8F00" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mining-stockpile-light" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFB300" stopOpacity="0" />
          <stop offset="100%" stopColor="#FFA000" stopOpacity="0.25" />
        </linearGradient>
      </defs>

      {/*
       * Illuminated Industrial Mining Complex matching the reference screenshot:
       * Features ore stockpiles, angled conveyor belt trusses, processing towers,
       * and vibrant warm golden floodlights illuminating the site against the mountains.
       */}
      <g ref={industryRef}>
        {/* Main active mining facility on the right */}
        <g transform={`translate(${width * 0.74} ${metrics.roadFarY - height * 0.015}) scale(${Math.min(1.2, width / 1400)})`}>
          {/* Luminous golden haze / bloom behind the entire mining complex */}
          <circle cx="80" cy="-65" r="140" fill="url(#mining-ambient-glow)" />
          <circle cx="-10" cy="-45" r="90" fill="url(#mining-ambient-glow)" opacity="0.6" />

          {/* Background Ore Stockpile (Dark mineral mound) */}
          <path
            d="M -120 0 C -70 -50, -20 -68, 25 -72 C 75 -76, 125 -48, 175 0 Z"
            fill="#0b131e"
          />

          {/* Foreground Ore Stockpile with golden light wash on slopes */}
          <path
            d="M -40 0 C 5 -75, 45 -98, 95 -104 C 145 -110, 185 -65, 230 0 Z"
            fill="#060c14"
          />
          <path
            d="M 95 -104 C 145 -110, 185 -65, 230 0 L 95 0 Z"
            fill="url(#mining-stockpile-light)"
          />

          {/* Angled Steel Conveyor Belt Truss */}
          <g>
            {/* Top & bottom chord rails */}
            <line x1="-80" y1="-12" x2="65" y2="-92" stroke="#223347" strokeWidth="2.8" />
            <line x1="-80" y1="-6" x2="65" y2="-86" stroke="#182738" strokeWidth="2.8" />
            {/* Structural diagonal cross lacing */}
            <path
              d="M -80 -6 L -70 -23 L -58 -14 L -46 -31 L -34 -22 L -22 -39 L -10 -30 L 2 -47 L 14 -38 L 26 -55 L 38 -46 L 50 -63 L 62 -54 L 65 -86"
              stroke="#1a2b3d"
              strokeWidth="1.4"
              fill="none"
            />
            {/* Support Trestle A-Frames */}
            <line x1="-34" y1="-22" x2="-38" y2="0" stroke="#182738" strokeWidth="2.2" />
            <line x1="-34" y1="-22" x2="-28" y2="0" stroke="#182738" strokeWidth="2.2" />
            <line x1="14" y1="-38" x2="8" y2="0" stroke="#182738" strokeWidth="2.2" />
            <line x1="14" y1="-38" x2="18" y2="0" stroke="#182738" strokeWidth="2.2" />
          </g>

          {/* Primary Processing & Crushing Tower (Steel Gantry Structure) */}
          <g>
            {/* Main vertical structural columns */}
            <line x1="65" y1="-118" x2="65" y2="0" stroke="#263a50" strokeWidth="2.6" />
            <line x1="108" y1="-118" x2="108" y2="0" stroke="#263a50" strokeWidth="2.6" />
            <line x1="86" y1="-118" x2="86" y2="0" stroke="#1e2f42" strokeWidth="1.8" />
            {/* Horizontal platform beams */}
            <line x1="62" y1="-28" x2="111" y2="-28" stroke="#263a50" strokeWidth="2" />
            <line x1="62" y1="-58" x2="111" y2="-58" stroke="#263a50" strokeWidth="2" />
            <line x1="62" y1="-88" x2="111" y2="-88" stroke="#263a50" strokeWidth="2" />
            <line x1="62" y1="-118" x2="111" y2="-118" stroke="#263a50" strokeWidth="2.4" />
            {/* Cross bracing trusses */}
            <line x1="65" y1="-28" x2="108" y2="0" stroke="#162536" strokeWidth="1.4" />
            <line x1="108" y1="-28" x2="65" y2="0" stroke="#162536" strokeWidth="1.4" />
            <line x1="65" y1="-58" x2="108" y2="-28" stroke="#162536" strokeWidth="1.4" />
            <line x1="108" y1="-58" x2="65" y2="-28" stroke="#162536" strokeWidth="1.4" />
            <line x1="65" y1="-88" x2="108" y2="-58" stroke="#162536" strokeWidth="1.4" />
            <line x1="108" y1="-88" x2="65" y2="-58" stroke="#162536" strokeWidth="1.4" />
            {/* Top Enclosure / Screening House */}
            <rect x="63" y="-126" width="47" height="22" rx="1.5" fill="#111c29" stroke="#2a3e54" strokeWidth="1.2" />
            {/* Roof equipment & cantilever boom */}
            <line x1="72" y1="-126" x2="132" y2="-130" stroke="#263a50" strokeWidth="2" />
            <line x1="132" y1="-130" x2="108" y2="-118" stroke="#1e2f42" strokeWidth="1.4" />
          </g>

          {/* Secondary Transfer Tower & Gantry */}
          <g>
            <line x1="126" y1="-96" x2="126" y2="0" stroke="#1e2f42" strokeWidth="2.2" />
            <line x1="156" y1="-96" x2="156" y2="0" stroke="#1e2f42" strokeWidth="2.2" />
            <line x1="124" y1="-46" x2="158" y2="-46" stroke="#1e2f42" strokeWidth="1.8" />
            <line x1="124" y1="-96" x2="158" y2="-96" stroke="#1e2f42" strokeWidth="2" />
            <line x1="126" y1="-96" x2="156" y2="-46" stroke="#142130" strokeWidth="1.3" />
            <line x1="156" y1="-96" x2="126" y2="-46" stroke="#142130" strokeWidth="1.3" />
            {/* Storage Silo / Hopper */}
            <path d="M 128 -96 L 154 -96 L 150 -58 L 132 -58 Z" fill="#0f1925" stroke="#223347" strokeWidth="1" />
          </g>

          {/* Brilliant Golden Industrial Work Lights & Floodlights */}
          <g>
            {/* High-mast floodlight cluster atop main tower */}
            <circle cx="86" cy="-132" r="38" fill="url(#mining-flood-flare)" opacity="0.95" />
            <circle cx="86" cy="-132" r="4.2" fill="#fffdf2" />

            {/* Conveyor discharge head floodlight */}
            <circle cx="65" cy="-92" r="24" fill="url(#mining-flood-flare)" opacity="0.9" />
            <circle cx="65" cy="-92" r="3.2" fill="#fffdf2" />

            {/* Walkway lights along conveyor */}
            {[-65, -45, -25, -5, 15, 35].map((lx, i) => {
              const ly = -12 + (i / 5) * -72;
              return (
                <g key={lx}>
                  <circle cx={lx} cy={ly} r="6" fill="url(#mining-flood-flare)" opacity="0.6" />
                  <circle cx={lx} cy={ly} r="1.3" fill="#fff7d6" />
                </g>
              );
            })}

            {/* Secondary tower floodlight */}
            <circle cx="141" cy="-100" r="28" fill="url(#mining-flood-flare)" opacity="0.88" />
            <circle cx="141" cy="-100" r="3.4" fill="#fffdf2" />

            {/* Stockpile yard floodlights */}
            <circle cx="-15" cy="-35" r="20" fill="url(#mining-flood-flare)" opacity="0.75" />
            <circle cx="-15" cy="-35" r="2.4" fill="#ffeec2" />
            <circle cx="185" cy="-42" r="22" fill="url(#mining-flood-flare)" opacity="0.75" />
            <circle cx="185" cy="-42" r="2.4" fill="#ffeec2" />
          </g>
        </g>

        {/* Distant headframe in the mid-ground left for depth */}
        <g transform={`translate(${width * 0.22} ${metrics.roadFarY - height * 0.02})`} opacity="0.6">
          <path d="M -16 0 L 0 -48 L 16 0 Z" fill="none" stroke="#0e1f32" strokeWidth="2.2" />
          <path d="M -10 -20 L 10 -20" stroke="#0e1f32" strokeWidth="1.8" />
          <circle cx="0" cy="-50" r="5" fill="none" stroke="#0e1f32" strokeWidth="2.4" />
          <circle cx="0" cy="-24" r="8" fill="url(#mining-flood-flare)" opacity="0.7" />
          <circle cx="0" cy="-24" r="1.4" fill="#ffeab0" />
        </g>
      </g>

      {/* The destination city, low on the horizon. */}
      <g ref={cityRef}>
        <g transform={`translate(${width * 0.5} ${metrics.horizonY + height * 0.035})`}>
          <ellipse cx="0" cy={-height * 0.04} rx={width * 0.3} ry={height * 0.08} fill="url(#journey-city-glow)" />
          {buildings.map((building, index) => (
            <g key={index}>
              <rect
                x={building.x}
                y={-building.height}
                width={building.width}
                height={building.height}
                fill="url(#journey-tower)"
              />
              {building.form === 2 && (
                <>
                  <rect x={building.x + building.width * 0.46} y={-building.height - height * 0.02} width={building.width * 0.08} height={height * 0.02} fill="#0a1729" />
                  <circle cx={building.x + building.width * 0.5} cy={-building.height - height * 0.02} r={1.6} fill="#d4af37" />
                </>
              )}
            </g>
          ))}
          <g ref={windowsRef} opacity="0">
            {buildings.map((building, bi) =>
              building.windows.map((w, wi) => (
                <rect key={`${bi}-${wi}`} x={w.x} y={w.y} width={w.w} height={w.h} fill="#f0c986" opacity={w.lit * 0.85} />
              )),
            )}
          </g>
        </g>
      </g>
    </svg>
  );
};

/* ------------------------------------------------------------ foreground */

/**
 * The nearest band: dark verge shapes sliding past below the road.
 *
 * Fastest layer in the scene, and almost pure silhouette. Its job is to give
 * the bottom of the frame something moving at close range, which is what makes
 * the middle distance read as middle distance.
 */
export const ForegroundLayer: React.FC<{ metrics: StageMetrics }> = ({ metrics }) => {
  const { width, height } = metrics;
  const tileWidth = width * 1.5;

  const d = useMemo(
    () =>
      ridgePath({
        width: tileWidth,
        height,
        peak: 0.055,
        base: 1,
        roughness: 0.42,
        detail: 5,
        seed: 0x1188cd,
      }),
    [tileWidth, height],
  );

  return (
    <svg
      className={`${styles.layer} ${styles.svgLayer}`}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <Plate metrics={metrics} depth={DEPTH.foreground} d={d} fill="#04080f" opacity={1} />
    </svg>
  );
};
