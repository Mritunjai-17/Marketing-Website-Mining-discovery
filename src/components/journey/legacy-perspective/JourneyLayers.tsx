"use client";

import React, { useMemo, useRef } from "react";
import styles from "./Journey2D.module.css";
import {
  CITY_Z,
  project,
  relativeRoadX,
  smoothstep,
  type StageMetrics,
} from "./journeyPerspective";
import { DESTINATION_REVEAL } from "./journeyChapters";
import { useJourneyFrame } from "./journeyScroll";
import { buildClouds, buildSkyline, ridgePath } from "./journeyShapes";

/**
 * The backdrop: everything behind the road.
 *
 * Each band is a separate element with its own transform, and their relative
 * speeds are not invented — they come from how far away each band is. The sky
 * barely shifts, the far range creeps, the near range slides, and the city
 * grows as it is approached. That ordering is the depth cue doing the work.
 */

/* ------------------------------------------------------------------- sky */

export const SkyLayer: React.FC<{ metrics: StageMetrics }> = ({ metrics }) => {
  const ref = useRef<HTMLDivElement>(null);

  useJourneyFrame((scene) => {
    const element = ref.current;
    if (!element) return;
    /*
     * The sky moves at all only because the camera's lateral wander should
     * carry through the whole frame — without it the sky is visibly pinned
     * while everything in front of it swings, which reads as a painted
     * backdrop. A twentieth of the camera's drift is enough to sell it.
     */
    const drift = -scene.cameraX * 0.05;
    const rise = scene.progress * metrics.height * 0.02;
    element.style.transform = `translate3d(${drift.toFixed(2)}px, ${rise.toFixed(2)}px, 0)`;
  });

  return (
    <div ref={ref} className={`${styles.layer} ${styles.overscan} ${styles.sky}`} aria-hidden="true" />
  );
};

/* ---------------------------------------------------------------- clouds */

export const CloudLayer: React.FC<{ metrics: StageMetrics }> = ({ metrics }) => {
  const nearRef = useRef<SVGGElement>(null);
  const farRef = useRef<SVGGElement>(null);

  const { width, height } = metrics;
  const far = useMemo(() => buildClouds(width * 1.5, height, 5, 0x51c7a3), [width, height]);
  const near = useMemo(() => buildClouds(width * 1.5, height, 4, 0x2b90ff), [width, height]);

  useJourneyFrame((scene) => {
    /*
     * Two rates, both tiny. The brief asks for movement that is almost
     * imperceptible, so the drift is driven mostly by elapsed time at a few
     * pixels per second — fast enough that the sky is not frozen, slow enough
     * that you have to look for it.
     */
    const ambient = scene.time * 1.6;
    if (farRef.current) {
      const x = -scene.cameraX * 0.1 - ambient * 0.35;
      farRef.current.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
    }
    if (nearRef.current) {
      const x = -scene.cameraX * 0.19 - ambient * 0.8;
      nearRef.current.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
    }
  });

  return (
    <svg
      className={`${styles.layer} ${styles.overscan} ${styles.svgLayer}`}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="journey-cloud" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8fb0d8" />
          <stop offset="100%" stopColor="#40618f" />
        </linearGradient>
      </defs>
      <g ref={farRef}>
        {far.map((band, index) => (
          <path key={index} d={band.d} fill="url(#journey-cloud)" opacity={band.opacity * 0.7} />
        ))}
      </g>
      <g ref={nearRef}>
        {near.map((band, index) => (
          <path key={index} d={band.d} fill="url(#journey-cloud)" opacity={band.opacity} />
        ))}
      </g>
    </svg>
  );
};

/* ------------------------------------------------------------- mountains */

interface RangeSpec {
  /** Notional distance, used to set drift rate. */
  depth: number;
  peak: number;
  base: number;
  fill: string;
  opacity: number;
  seed: number;
  roughness: number;
}

/**
 * Three ranges at decreasing distance.
 *
 * Contrast rises and colour warms as they come forward, which is atmospheric
 * perspective done as art direction: the far range is barely separable from
 * the sky, the near one is a firm silhouette. That spread is what gives the
 * upper half of the frame its depth.
 */
const RANGES: RangeSpec[] = [
  { depth: 0.06, peak: 0.2, base: 0.53, fill: "#20406b", opacity: 0.5, seed: 0x9e1f22, roughness: 0.58 },
  { depth: 0.13, peak: 0.16, base: 0.55, fill: "#16304f", opacity: 0.78, seed: 0x3ac5d1, roughness: 0.52 },
  { depth: 0.24, peak: 0.12, base: 0.575, fill: "#0d1f38", opacity: 1, seed: 0x77b208, roughness: 0.48 },
];

export const MountainLayer: React.FC<{ metrics: StageMetrics }> = ({ metrics }) => {
  const refs = useRef<(SVGGElement | null)[]>([]);
  const { width, height } = metrics;

  // Generated a good deal wider than the stage so the ranges can drift
  // sideways without an end ever entering frame.
  const plateWidth = width * 1.6;

  const paths = useMemo(
    () =>
      RANGES.map((range) =>
        ridgePath({
          width: plateWidth,
          height,
          peak: range.peak,
          base: range.base,
          roughness: range.roughness,
          detail: 7,
          seed: range.seed,
        }),
      ),
    [plateWidth, height],
  );

  useJourneyFrame((scene) => {
    RANGES.forEach((range, index) => {
      const group = refs.current[index];
      if (!group) return;
      // Lateral: the camera's wander, scaled by how near the range is.
      const x = -scene.cameraX * range.depth;
      // Vertical: ranges sink very slightly as the journey advances, which
      // reads as the ground rising toward the destination.
      const y = scene.progress * height * range.depth * 0.09;
      group.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    });
  });

  return (
    <svg
      className={`${styles.layer} ${styles.svgLayer}`}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      {RANGES.map((range, index) => (
        <g
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
        >
          <path
            d={paths[index]}
            fill={range.fill}
            opacity={range.opacity}
            transform={`translate(${(-(plateWidth - width) / 2).toFixed(1)} 0)`}
          />
        </g>
      ))}
    </svg>
  );
};

/* ------------------------------------------------------------------ city */

/**
 * The destination.
 *
 * Positioned and scaled through the same projection as the road, at the road's
 * own lateral position at that distance — so the highway genuinely points at
 * it rather than the two merely both being on screen. It starts as a smudge on
 * the horizon and resolves into a skyline as the journey closes.
 */
/** Communication masts at the district — the first lights the journey shows. */
const MASTS = [
  { x: -148, height: 74 },
  { x: 96, height: 92 },
  { x: 182, height: 62 },
];

export const CityLayer: React.FC<{ metrics: StageMetrics }> = ({ metrics }) => {
  const groupRef = useRef<SVGGElement>(null);
  const silhouetteRef = useRef<SVGGElement>(null);
  const beaconsRef = useRef<SVGGElement>(null);
  const windowsRef = useRef<SVGGElement>(null);
  const glowRef = useRef<SVGEllipseElement>(null);

  // Built in world units; the projection scales it. 1 unit ≈ 1 metre.
  const buildings = useMemo(() => buildSkyline({ width: 360, maxHeight: 96, count: 17, seed: 0x4d81b2 }), []);

  useJourneyFrame((scene) => {
    const group = groupRef.current;
    if (!group) return;

    const z = CITY_Z - scene.travel;
    const lateral = relativeRoadX(scene, z);
    const point = project(z, lateral, 0, scene.metrics);

    group.style.transform = `translate3d(${point.x.toFixed(2)}px, ${point.y.toFixed(2)}px, 0) scale(${point.scale.toFixed(4)})`;

    /*
     * The staged reveal. Each band changes one distinct thing, so the
     * destination resolves in steps rather than simply fading up as a whole —
     * silhouettes separate from the haze, then the masts light, then the
     * windows, then the district's glow spreads.
     *
     * None of this is what makes the city *appear*: it has been physically
     * approaching since the first frame. These ramps shape how it resolves on
     * top of an approach that is already happening, which is why nothing pops.
     */
    const p = scene.progress;
    const R = DESTINATION_REVEAL;

    if (silhouetteRef.current) {
      const emerge = smoothstep(R.silhouette.from, R.silhouette.to, p);
      const sharpen = smoothstep(R.clarity.from, R.clarity.to, p);
      silhouetteRef.current.style.opacity = (0.16 + emerge * 0.64 + sharpen * 0.2).toFixed(3);
    }
    if (beaconsRef.current) {
      beaconsRef.current.style.opacity = smoothstep(R.beacons.from, R.beacons.to, p).toFixed(3);
    }
    if (windowsRef.current) {
      windowsRef.current.style.opacity = smoothstep(R.windows.from, R.windows.to, p).toFixed(3);
    }
    if (glowRef.current) {
      glowRef.current.style.opacity = (smoothstep(R.glow.from, R.glow.to, p) * 0.55).toFixed(3);
    }
  });

  return (
    <svg
      className={`${styles.layer} ${styles.svgLayer}`}
      viewBox={`0 0 ${metrics.width} ${metrics.height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="journey-city-glow">
          <stop offset="0%" stopColor="#e8b765" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#c78f45" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#c78f45" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="journey-tower" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1b3355" />
          <stop offset="100%" stopColor="#0a1729" />
        </linearGradient>
      </defs>

      {/* Transform is written per frame; this group holds the world-unit city. */}
      <g ref={groupRef}>
        {/* The district's light pollution, sitting behind the silhouettes. */}
        <ellipse ref={glowRef} cx="0" cy="-34" rx="220" ry="74" fill="url(#journey-city-glow)" opacity="0" />

        <g ref={silhouetteRef} opacity="0.16">
        {buildings.map((building, index) => (
          <g key={index}>
            <rect
              x={building.x}
              y={-building.height}
              width={building.width}
              height={building.height}
              fill="url(#journey-tower)"
            />
            {/* A stepped crown or a mast, so the skyline is not a row of boxes. */}
            {building.form === 1 && (
              <rect
                x={building.x + building.width * 0.2}
                y={-building.height - building.height * 0.07}
                width={building.width * 0.6}
                height={building.height * 0.07}
                fill="#0a1729"
              />
            )}
            {building.form === 2 && (
              <>
                <rect
                  x={building.x + building.width * 0.47}
                  y={-building.height - 13}
                  width={building.width * 0.06}
                  height={13}
                  fill="#0a1729"
                />
                {/* Aircraft warning light: one of the scene's few gold points. */}
                <circle
                  cx={building.x + building.width * 0.5}
                  cy={-building.height - 13}
                  r={1.5}
                  fill="#d4af37"
                />
              </>
            )}
          </g>
        ))}

          {/*
           * Communication masts. Slim lattice towers flanking the district —
           * the vocabulary the brief asks for, and the tallest things in the
           * skyline, so they break the horizon before any building does.
           */}
          {MASTS.map((mast) => (
            <g key={mast.x}>
              <rect x={mast.x - 0.5} y={-mast.height} width="1" height={mast.height} fill="#0a1729" />
              {/* Two cross-stays, enough to read as lattice at this distance. */}
              <rect x={mast.x - 3} y={-mast.height * 0.62} width="6" height="0.6" fill="#0a1729" />
              <rect x={mast.x - 4.6} y={-mast.height * 0.3} width="9.2" height="0.6" fill="#0a1729" />
            </g>
          ))}
        </g>

        {/*
         * Mast beacons. These carry the brief's 20–40% band on their own: they
         * are the "distant lights beginning to appear", and because they sit
         * above every rooftop they are visible while the buildings below are
         * still indistinguishable from the haze.
         */}
        <g ref={beaconsRef} opacity="0">
          {MASTS.map((mast) => (
            <g key={mast.x}>
              <circle cx={mast.x} cy={-mast.height} r="2.6" fill="#d4af37" opacity="0.28" />
              <circle cx={mast.x} cy={-mast.height} r="1.1" fill="#f0cd7a" />
              <circle cx={mast.x} cy={-mast.height * 0.62} r="0.7" fill="#d4af37" opacity="0.7" />
            </g>
          ))}
        </g>

        <g ref={windowsRef} opacity="0">
          {buildings.map((building, buildingIndex) =>
            building.windows.map((w, windowIndex) => (
              <rect
                key={`${buildingIndex}-${windowIndex}`}
                x={w.x}
                y={w.y}
                width={w.w}
                height={w.h}
                fill="#f0c986"
                opacity={w.lit * 0.8}
              />
            )),
          )}
        </g>
      </g>
    </svg>
  );
};

/* --------------------------------------------------------------- terrain */

/**
 * The ground the road crosses, plus the foreground banks that frame it.
 *
 * Two jobs. The ground plane fills everything below the horizon so the road is
 * laid on land rather than floating over the sky gradient. The foreground
 * banks are the nearest thing in the scene — they move fastest, and they are
 * what makes the composition feel like it has a camera inside it.
 */
export const TerrainLayer: React.FC<{ metrics: StageMetrics }> = ({ metrics }) => {
  const midRef = useRef<SVGGElement>(null);
  const nearRef = useRef<SVGGElement>(null);
  const { width, height, horizonY } = metrics;

  const plateWidth = width * 1.8;

  const midHills = useMemo(
    () => ridgePath({ width: plateWidth, height, peak: 0.055, base: 0.6, roughness: 0.5, detail: 6, seed: 0x1188cd }),
    [plateWidth, height],
  );

  useJourneyFrame((scene) => {
    if (midRef.current) {
      const x = -scene.cameraX * 0.42;
      midRef.current.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
    }
    if (nearRef.current) {
      /*
       * The nearest thing in the scene, so it must move faster than anything
       * else — including the road surface immediately ahead of the camera,
       * which shifts about 5.7px for the same step. At the 1.15 this started
       * at the banks moved 3.3px and therefore read as *further away* than the
       * road they frame, which inverts the depth cue they exist to provide.
       */
      const x = -scene.cameraX * 2.4;
      nearRef.current.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
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
        <linearGradient id="journey-ground" x1="0" y1="0" x2="0" y2="1">
          {/* Meets the sky exactly at the horizon, then darkens toward the
              foreground — the ground reading lighter far away is the same
              atmospheric cue the mountains use. */}
          <stop offset="0%" stopColor="#1b3454" />
          <stop offset="26%" stopColor="#122540" />
          <stop offset="100%" stopColor="#060d1a" />
        </linearGradient>
        <linearGradient id="journey-bank" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0c1728" />
          <stop offset="100%" stopColor="#04080f" />
        </linearGradient>
      </defs>

      {/* Ground plane. Static: it is the surface everything else sits on. */}
      <rect x="0" y={horizonY} width={width} height={height - horizonY} fill="url(#journey-ground)" />

      <g ref={midRef}>
        <path
          d={midHills}
          fill="#0a1526"
          opacity="0.9"
          transform={`translate(${(-(plateWidth - width) / 2).toFixed(1)} 0)`}
        />
      </g>

      {/* Foreground banks: two wedges rising from the bottom corners, framing
          the road without ever crossing it. */}
      <g ref={nearRef}>
        <path
          d={`M ${-width * 0.1} ${height} L ${-width * 0.1} ${height * 0.86} Q ${width * 0.12} ${height * 0.78} ${width * 0.3} ${height} Z`}
          fill="url(#journey-bank)"
        />
        <path
          d={`M ${width * 1.1} ${height} L ${width * 1.1} ${height * 0.84} Q ${width * 0.9} ${height * 0.76} ${width * 0.74} ${height} Z`}
          fill="url(#journey-bank)"
        />
      </g>
    </svg>
  );
};
