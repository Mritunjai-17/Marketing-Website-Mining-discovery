"use client";

import React, { useMemo, useRef } from "react";
import styles from "./Journey2D.module.css";
import {
  JOURNEY_DEPTH,
  ROAD_HALF_WIDTH,
  clarity,
  project,
  relativeRoadX,
  smoothstep,
  type StageMetrics,
} from "./journeyPerspective";
import { useJourneyFrame } from "./journeyScroll";
import { METRICS, MILESTONES, SERVICE_GROUPS } from "./journeyContent";

/**
 * Roadside markers: the milestones, the service markers and the result posts.
 *
 * One component for all three because they are the same object — a panel on a
 * post, standing at a real distance, lighting as the truck closes on it and
 * sweeping past. Only the content differs, so building three near-identical
 * layers would have been three places to fix the same projection bug.
 *
 * These carry most of the story's visual events. The road is the company's
 * timeline, which means the milestones have to be things you physically drive
 * past rather than captions that appear over the scene — that distinction is
 * the whole reason they live here and not in the overlay.
 */

export type MarkerKind = "year" | "service" | "result";

interface Marker {
  id: string;
  kind: MarkerKind;
  worldZ: number;
  /** Which side of the road it stands on. */
  side: 1 | -1;
  /** The large text: a year, a category number, or a figure. */
  lead: string;
  /** Supporting lines, small. */
  lines: string[];
}

/** Panel geometry in world units. Smaller than the billboard — these are signs. */
const PANEL_W = 15;
const PANEL_H = 8.2;
const PANEL_BASE = 6.4;
const OFFSET = ROAD_HALF_WIDTH + 8;

/** Below this the panel is level with the camera and its projection is meaningless. */
const PASS_Z = 26;

/**
 * Every marker in the journey, in world order.
 *
 * Sides alternate so the eye is not always drawn to the same edge of the road,
 * and so a run of six service markers reads as a roadside rather than a fence.
 */
function buildMarkers(): Marker[] {
  const markers: Marker[] = [];

  MILESTONES.forEach((milestone, index) => {
    markers.push({
      id: milestone.id,
      kind: "year",
      worldZ: milestone.worldZ,
      side: index % 2 === 0 ? 1 : -1,
      lead: milestone.year,
      lines: milestone.lines,
    });
  });

  SERVICE_GROUPS.forEach((group, index) => {
    markers.push({
      id: `service-${group.num}`,
      kind: "service",
      worldZ: group.worldZ,
      side: index % 2 === 0 ? 1 : -1,
      lead: group.num,
      lines: [group.title.toUpperCase()],
    });
  });

  METRICS.forEach((metric, index) => {
    markers.push({
      id: metric.id,
      kind: "result",
      worldZ: metric.worldZ,
      side: index % 2 === 0 ? 1 : -1,
      lead: metric.value,
      lines: [],
    });
  });

  return markers.sort((a, b) => a.worldZ - b.worldZ);
}

const LEAD_COLOUR: Record<MarkerKind, string> = {
  // Years are the brand's own gold: they are the company's own history.
  year: "#e0bd53",
  // Service numbers are quiet — the name beneath them is the content.
  service: "#9fb0c8",
  // Results are gold too, and the largest type on any marker.
  result: "#e8c87a",
};

export const JourneyMarkers: React.FC<{ metrics: StageMetrics }> = ({ metrics }) => {
  const markers = useMemo(() => buildMarkers(), []);
  const refs = useRef<(SVGGElement | null)[]>(markers.map(() => null));
  const panelRefs = useRef<(SVGGElement | null)[]>(markers.map(() => null));

  useJourneyFrame((scene) => {
    markers.forEach((marker, index) => {
      const group = refs.current[index];
      if (!group) return;

      const z = marker.worldZ - scene.travel;
      if (z <= PASS_Z || z > 1400) {
        group.style.opacity = "0";
        return;
      }

      const lateral = relativeRoadX(scene, z) + marker.side * OFFSET;
      const anchor = project(z, lateral, 0, scene.metrics);

      group.style.transform = `translate3d(${anchor.x.toFixed(2)}px, ${anchor.y.toFixed(2)}px, 0) scale(${anchor.scale.toFixed(4)})`;

      /*
       * Haze at distance, and a short fade over the last few metres so the
       * sign does not vanish mid-stride as it crosses the near plane.
       */
      const leaving = smoothstep(PASS_Z, PASS_Z + 40, z);
      group.style.opacity = ((0.3 + clarity(z) * 0.7) * leaving).toFixed(3);

      /*
       * The panel lights on approach rather than on a scroll range. Tying it to
       * distance is what makes it read as the truck's headlights finding the
       * sign — the illumination belongs to the encounter, not to a timeline.
       */
      const panel = panelRefs.current[index];
      if (panel) {
        panel.style.opacity = (0.28 + (1 - smoothstep(60, 460, z)) * 0.72).toFixed(3);
      }
    });
  });

  return (
    <svg
      className={`${styles.layer} ${styles.svgLayer}`}
      viewBox={`0 0 ${metrics.width} ${metrics.height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="journey-marker-face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#12294a" />
          <stop offset="100%" stopColor="#07162b" />
        </linearGradient>
        <linearGradient id="journey-marker-post" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a3243" />
          <stop offset="100%" stopColor="#141a24" />
        </linearGradient>
      </defs>

      {markers.map((marker, index) => (
        <g
          key={marker.id}
          opacity="0"
          ref={(node) => {
            refs.current[index] = node;
          }}
        >
          {/* Post and footing. */}
          <rect x="-0.45" y={-PANEL_BASE} width="0.9" height={PANEL_BASE} fill="url(#journey-marker-post)" />
          <rect x="-1.4" y="-0.55" width="2.8" height="0.75" fill="#0d131d" />

          {/* Panel face, with the gold hairline edge used everywhere else. */}
          <g
            ref={(node) => {
              panelRefs.current[index] = node;
            }}
            opacity="0.28"
          >
            <rect
              x={-PANEL_W / 2}
              y={-PANEL_BASE - PANEL_H}
              width={PANEL_W}
              height={PANEL_H}
              fill="url(#journey-marker-face)"
              rx="0.25"
            />
            <rect
              x={-PANEL_W / 2}
              y={-PANEL_BASE - PANEL_H}
              width={PANEL_W}
              height={PANEL_H}
              fill="none"
              stroke="#b8860b"
              strokeWidth="0.16"
              rx="0.25"
            />

            {/*
             * Text lengths are pinned rather than left to the font. SVG text
             * neither wraps nor shrinks, and the display serif may not have
             * loaded when a marker first paints — without a forced length the
             * fallback's wider metrics push copy past the panel edge.
             */}
            <text
              x="0"
              y={-PANEL_BASE - PANEL_H * (marker.lines.length ? 0.62 : 0.46)}
              textAnchor="middle"
              fill={LEAD_COLOUR[marker.kind]}
              fontSize={PANEL_H * (marker.kind === "service" ? 0.24 : 0.34)}
              fontFamily="var(--font-display-custom), Georgia, serif"
              textLength={PANEL_W * (marker.kind === "service" ? 0.16 : Math.min(0.62, 0.15 * marker.lead.length))}
              lengthAdjust="spacingAndGlyphs"
            >
              {marker.lead}
            </text>

            {marker.lines.map((line, lineIndex) => (
              <text
                key={line}
                x="0"
                y={-PANEL_BASE - PANEL_H * 0.32 + lineIndex * PANEL_H * 0.17}
                textAnchor="middle"
                fill="rgba(226,233,243,0.72)"
                fontSize={PANEL_H * 0.088}
                fontFamily="var(--font-mono-custom), ui-monospace, monospace"
                textLength={PANEL_W * Math.min(0.84, 0.035 * line.length)}
                lengthAdjust="spacingAndGlyphs"
              >
                {line}
              </text>
            ))}
          </g>
        </g>
      ))}
    </svg>
  );
};

/** When a marker passes the camera, as a progress value. Used by the overlay. */
export function passProgress(worldZ: number): number {
  return worldZ / JOURNEY_DEPTH;
}

export default JourneyMarkers;
