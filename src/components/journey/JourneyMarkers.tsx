"use client";

import React, { useMemo, useRef } from "react";
import styles from "./Journey2D.module.css";
import { METRICS, MILESTONES, SERVICE_GROUPS } from "./journeyContent";
import { WORLD_LENGTH, roadX, smoothstep, type StageMetrics } from "./journeySideView";
import { useJourneyFrame } from "./journeyScroll";

/**
 * Roadside markers: milestones, service signs and result posts.
 *
 * One component for all three because they are the same object — a panel on a
 * post, standing on the verge, lighting as the truck draws level and sliding
 * past. Only the content differs, so three near-identical layers would have
 * been three places to fix the same bug.
 *
 * These carry the environmental storytelling. The road is the company's
 * timeline, which means the milestones have to be things the truck physically
 * passes rather than captions that appear over the scene.
 */

export type MarkerKind = "year" | "service" | "result";

interface Marker {
  id: string;
  kind: MarkerKind;
  worldX: number;
  lead: string;
  lines: string[];
}

/** Panel geometry in world units. Smaller than the billboard — these are signs. */
const PANEL_W = 17;
const PANEL_H = 9;
const PANEL_BASE = 9;

function buildMarkers(): Marker[] {
  return [
    ...MILESTONES.map((m) => ({
      id: m.id,
      kind: "year" as const,
      worldX: m.worldX,
      lead: m.year,
      lines: m.lines,
    })),
    ...SERVICE_GROUPS.map((g) => ({
      id: `service-${g.num}`,
      kind: "service" as const,
      worldX: g.worldX,
      lead: g.num,
      lines: [g.title.toUpperCase()],
    })),
    ...METRICS.map((m) => ({
      id: m.id,
      kind: "result" as const,
      worldX: m.worldX,
      lead: m.value,
      lines: [],
    })),
  ].sort((a, b) => a.worldX - b.worldX);
}

const LEAD_COLOUR: Record<MarkerKind, string> = {
  // Years and results are the brand's gold — the company's own history and
  // its own outcomes. Service numbers stay quiet; the name beneath is content.
  year: "#e0bd53",
  service: "#9fb0c8",
  result: "#e8c87a",
};

export const JourneyMarkers: React.FC<{ metrics: StageMetrics }> = ({ metrics }) => {
  const markers = useMemo(() => buildMarkers(), []);
  const refs = useRef<(SVGGElement | null)[]>(markers.map(() => null));
  const panelRefs = useRef<(SVGGElement | null)[]>(markers.map(() => null));

  useJourneyFrame((scene) => {
    const m = scene.metrics;
    markers.forEach((marker, index) => {
      const group = refs.current[index];
      if (!group) return;

      const x = roadX(scene, marker.worldX);
      if (x < -m.width * 0.5 || x > m.width * 1.5) {
        group.style.opacity = "0";
        return;
      }

      // Stands on the verge, behind the rail, like the billboard.
      const y = m.roadFarY - (m.roadNearY - m.roadFarY) * 0.18;
      group.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${m.pxPerUnit.toFixed(4)})`;

      // A short fade at both frame edges, so nothing pops in or out.
      const edge = Math.min(
        smoothstep(-m.width * 0.45, -m.width * 0.1, x),
        1 - smoothstep(m.width * 1.05, m.width * 1.4, x),
      );
      group.style.opacity = edge.toFixed(3);

      /*
       * The panel lights as the truck approaches rather than on a scroll
       * range. Tying it to proximity is what makes it read as the truck's
       * headlights finding the sign — the illumination belongs to the
       * encounter, not to a timeline.
       */
      const panel = panelRefs.current[index];
      if (panel) {
        const nearness = 1 - smoothstep(10, 90, Math.abs(marker.worldX - scene.truckWorldX));
        panel.style.opacity = (0.3 + nearness * 0.7).toFixed(3);
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
          <stop offset="100%" stopColor="#111721" />
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
          <rect x="-0.5" y={-PANEL_BASE} width="1" height={PANEL_BASE} fill="url(#journey-marker-post)" />
          <rect x="-1.5" y="-0.6" width="3" height="0.8" fill="#0b111b" />

          <g
            ref={(node) => {
              panelRefs.current[index] = node;
            }}
            opacity="0.3"
          >
            <rect
              x={-PANEL_W / 2}
              y={-PANEL_BASE - PANEL_H}
              width={PANEL_W}
              height={PANEL_H}
              fill="url(#journey-marker-face)"
              rx="0.3"
            />
            <rect
              x={-PANEL_W / 2}
              y={-PANEL_BASE - PANEL_H}
              width={PANEL_W}
              height={PANEL_H}
              fill="none"
              stroke="#b8860b"
              strokeWidth="0.18"
              rx="0.3"
            />

            {/*
             * Text lengths pinned rather than left to the font: SVG text
             * neither wraps nor shrinks, and the display serif may not have
             * loaded when a marker first paints.
             */}
            <text
              x="0"
              y={-PANEL_BASE - PANEL_H * (marker.lines.length ? 0.6 : 0.44)}
              textAnchor="middle"
              fill={LEAD_COLOUR[marker.kind]}
              fontSize={PANEL_H * (marker.kind === "service" ? 0.22 : 0.32)}
              fontFamily="var(--font-display-custom), Georgia, serif"
              textLength={PANEL_W * (marker.kind === "service" ? 0.14 : Math.min(0.6, 0.145 * marker.lead.length))}
              lengthAdjust="spacingAndGlyphs"
            >
              {marker.lead}
            </text>

            {marker.lines.map((line, lineIndex) => (
              <text
                key={line}
                x="0"
                y={-PANEL_BASE - PANEL_H * 0.3 + lineIndex * PANEL_H * 0.16}
                textAnchor="middle"
                fill="rgba(226,233,243,0.75)"
                fontSize={PANEL_H * 0.082}
                fontFamily="var(--font-mono-custom), ui-monospace, monospace"
                textLength={PANEL_W * Math.min(0.86, 0.034 * line.length)}
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

/** When the truck draws level with a marker, as a progress value. */
export function passProgress(worldX: number): number {
  return worldX / WORLD_LENGTH;
}

export default JourneyMarkers;
