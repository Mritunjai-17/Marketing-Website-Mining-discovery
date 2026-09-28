"use client";

import React, { useRef } from "react";
import styles from "./Journey2D.module.css";
import {
  TRUCK_Z,
  project,
  relativeRoadX,
  type StageMetrics,
} from "./journeyPerspective";
import { useJourneyFrame } from "./journeyScroll";

/**
 * The truck, seen from behind.
 *
 * It sits at a fixed distance ahead of the camera, which is the whole trick of
 * the shot: the camera is chasing it, so it never changes size, and the sense
 * of speed comes entirely from the world flowing past. What the truck *does*
 * do is move laterally — its position is read from the road's centreline at
 * its own distance, so it swings through every bend a moment before the camera
 * does, exactly as a vehicle being followed would.
 *
 * Drawn as vector rather than a sprite: it has to hold up large in the
 * foreground, its lights need to be animated independently of the body, and a
 * raster of this at the widths a desktop display wants would be a heavier
 * download than the whole rest of the scene.
 */

/** Trailer dimensions in world units. A 2.6m-wide box on a 19m carriageway. */
const BODY_W = 5.1;
const BODY_H = 5.6;

export const JourneyTruck: React.FC<{ metrics: StageMetrics }> = ({ metrics }) => {
  const groupRef = useRef<SVGGElement>(null);
  const lampsRef = useRef<SVGGElement>(null);

  useJourneyFrame((scene) => {
    const group = groupRef.current;
    if (!group) return;

    const lateral = relativeRoadX(scene, TRUCK_Z);
    const anchor = project(TRUCK_Z, lateral, 0, scene.metrics);

    /*
     * A very small vertical bob and lateral sway, driven by time rather than
     * progress so the vehicle is never completely dead even when the page is
     * still. Fractions of a world unit — enough to suggest suspension, not
     * enough to read as floating.
     */
    const bob = Math.sin(scene.time * 1.7) * 0.9 + Math.sin(scene.time * 2.9) * 0.4;
    const sway = Math.sin(scene.time * 0.8) * 0.6;

    group.style.transform =
      `translate3d(${(anchor.x + sway).toFixed(2)}px, ${(anchor.y + bob).toFixed(2)}px, 0) ` +
      `scale(${anchor.scale.toFixed(4)})`;

    // Rear lamps breathe fractionally, as real LED clusters do under load.
    if (lampsRef.current) {
      lampsRef.current.style.opacity = (0.82 + Math.sin(scene.time * 1.3) * 0.08).toFixed(3);
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
        <linearGradient id="journey-truck-body" x1="0" y1="0" x2="0" y2="1">
          {/* Lit from above by the sky, falling into shadow at the skirt. */}
          <stop offset="0%" stopColor="#cdd6e4" />
          <stop offset="42%" stopColor="#8e9bb0" />
          <stop offset="100%" stopColor="#4a566a" />
        </linearGradient>
        <linearGradient id="journey-truck-door" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.16" />
        </linearGradient>
        <radialGradient id="journey-truck-lamp">
          <stop offset="0%" stopColor="#ff9f86" stopOpacity="0.85" />
          <stop offset="45%" stopColor="#d8412a" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#d8412a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="journey-truck-shadow">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.62" />
          <stop offset="70%" stopColor="#000000" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* World units; the group transform places and scales it. Origin is the
          point where the tyres meet the road. */}
      <g ref={groupRef}>
        {/* Contact shadow, wider than the vehicle and squashed flat. */}
        <ellipse cx="0" cy="0.1" rx={BODY_W * 0.72} ry="0.9" fill="url(#journey-truck-shadow)" />

        {/* Warm wash the rear lamps throw onto the road behind. */}
        <ellipse cx="0" cy="0.5" rx={BODY_W * 0.62} ry="1.5" fill="url(#journey-truck-lamp)" opacity="0.28" />

        {/* Tyres, visible either side of the skirt. */}
        {[-BODY_W * 0.42, BODY_W * 0.42].map((x) => (
          <rect key={x} x={x - 0.34} y="-1.5" width="0.68" height="1.5" rx="0.16" fill="#0a0e15" />
        ))}

        {/* Underrun bar — the detail that makes the back of a trailer read
            as a trailer rather than as a plain box. */}
        <rect x={-BODY_W * 0.46} y="-1.72" width={BODY_W * 0.92} height="0.26" rx="0.1" fill="#232b39" />
        {[-BODY_W * 0.3, BODY_W * 0.3].map((x) => (
          <rect key={x} x={x - 0.09} y="-2.3" width="0.18" height="0.7" fill="#232b39" />
        ))}

        {/* Trailer body. */}
        <rect
          x={-BODY_W / 2}
          y={-BODY_H - 1.6}
          width={BODY_W}
          height={BODY_H}
          rx="0.22"
          fill="url(#journey-truck-body)"
        />
        {/* Door split and hardware, so the rear face has structure. */}
        <rect x={-BODY_W / 2} y={-BODY_H - 1.6} width={BODY_W} height={BODY_H} rx="0.22" fill="url(#journey-truck-door)" />
        <rect x="-0.045" y={-BODY_H - 1.5} width="0.09" height={BODY_H - 0.2} fill="#33405288" />
        {[-BODY_W * 0.2, BODY_W * 0.2].map((x) => (
          <rect key={x} x={x - 0.05} y={-BODY_H - 1.3} width="0.1" height={BODY_H - 0.7} fill="#2d3747" opacity="0.6" />
        ))}

        {/*
         * The single gold note on the vehicle: one hairline livery stripe.
         * Consistent with how gold is used everywhere else in the scene —
         * bound to an edge of a real object, never floating.
         */}
        <rect x={-BODY_W / 2} y={-BODY_H * 0.42 - 1.6} width={BODY_W} height="0.14" fill="#b8860b" opacity="0.85" />

        {/* Roof lip and marker lamps along the top edge. */}
        <rect x={-BODY_W / 2 - 0.08} y={-BODY_H - 1.78} width={BODY_W + 0.16} height="0.2" rx="0.08" fill="#5d6878" />
        {[-BODY_W * 0.34, 0, BODY_W * 0.34].map((x) => (
          <rect key={x} x={x - 0.12} y={-BODY_H - 1.88} width="0.24" height="0.12" rx="0.05" fill="#e8a94a" opacity="0.7" />
        ))}

        {/* Rear lamp clusters. */}
        <g ref={lampsRef}>
          {[-BODY_W * 0.37, BODY_W * 0.37].map((x) => (
            <g key={x}>
              <rect x={x - 0.28} y="-2.62" width="0.56" height="0.92" rx="0.12" fill="#c33b28" />
              <rect x={x - 0.2} y="-2.52" width="0.4" height="0.34" rx="0.08" fill="#ff6a4d" />
              <rect x={x - 0.2} y="-2.06" width="0.4" height="0.26" rx="0.07" fill="#e8a94a" opacity="0.8" />
            </g>
          ))}
        </g>

        {/* Plate panel, lit from its own small lamp. */}
        <rect x="-0.62" y="-2.5" width="1.24" height="0.6" rx="0.08" fill="#d7dde7" opacity="0.5" />
      </g>
    </svg>
  );
};

export default JourneyTruck;
