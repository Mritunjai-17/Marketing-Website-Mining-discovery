"use client";

import React, { useRef } from "react";
import styles from "./Journey2D.module.css";
import {
  ROAD_HALF_WIDTH,
  clarity,
  project,
  relativeRoadX,
  smoothstep,
  type SceneState,
  type StageMetrics,
} from "./journeyPerspective";
import { useJourneyFrame } from "./journeyScroll";
import { BRANCHES, CROSSOVER, DIGITISATION } from "./journeyChapters";
import { branchElevation, branchLateral, resolveNetwork } from "./networkModel";

/**
 * REACH: the road branching into separate routes.
 *
 * Each route is built in world space and projected through the same pinhole as
 * the road, so it genuinely leaves the carriageway at a point on the road's
 * own edge. Drawing lines over the top of the scene — the obvious shortcut —
 * is what the brief rules out, and it never survives a camera that moves.
 *
 * Each route is drawn twice: a tapering filled ribbon for the physical road
 * surface, strongest at the junction and gone by the crossover, and a hairline
 * stroke for the gold connection, absent at the junction and full beyond it.
 * The crossover between them travels back toward the junction as the journey
 * closes, so the transformation happens in front of the viewer rather than as
 * a dissolve.
 *
 * Late in the story the geometry blends from its projected position toward the
 * network's composed one. See `networkModel.ts` for why.
 */

const SAMPLES = 20;
const BRANCH_HALF_WIDTH = ROAD_HALF_WIDTH * 0.62;

interface BranchRefs {
  group: SVGGElement | null;
  surface: SVGPathElement | null;
  line: SVGPathElement | null;
  leadIn: SVGPathElement | null;
  surfaceGradient: SVGLinearGradientElement | null;
  lineGradient: SVGLinearGradientElement | null;
  lineStops: (SVGStopElement | null)[];
}

/**
 * Half-width of the physical surface at u, tapering out at the crossover.
 *
 * Also narrows with u regardless, so even before the crossover bites the route
 * is visibly thinning — a road running out rather than a stripe of constant
 * width that suddenly stops.
 */
function surfaceHalfWidth(u: number, crossover: number): number {
  const taper = 1 - smoothstep(crossover - 0.22, crossover + 0.12, u);
  return BRANCH_HALF_WIDTH * (1 - u * 0.45) * taper;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export const JourneyRoutes: React.FC<{ metrics: StageMetrics }> = ({ metrics }) => {
  const refs = useRef<BranchRefs[]>(
    BRANCHES.map(() => ({
      group: null,
      surface: null,
      line: null,
      leadIn: null,
      surfaceGradient: null,
      lineGradient: null,
      lineStops: [null, null],
    })),
  );

  useJourneyFrame((scene: SceneState) => {
    const m = scene.metrics;
    const net = resolveNetwork(scene);

    const digital = smoothstep(DIGITISATION.from, DIGITISATION.to, scene.progress);
    const crossover = CROSSOVER.physical + (CROSSOVER.digital - CROSSOVER.physical) * digital;

    BRANCHES.forEach((branch, index) => {
      const r = refs.current[index];
      if (!r.group) return;

      const emerge = smoothstep(branch.reveal.from, branch.reveal.to, scene.progress);
      if (emerge <= 0.001) {
        r.group.style.opacity = "0";
        return;
      }

      const originZ = branch.originZ - scene.travel;
      const node = net.nodes[index];

      /*
       * The route grows out of the junction rather than appearing along its
       * whole length: `emerge` caps how much of the curve is drawn, so the
       * first thing the viewer sees is a short stub at the road edge that
       * extends outward. That is what makes it read as the road branching, not
       * as a line switching on.
       */
      const extent = emerge;

      const left: string[] = [];
      const right: string[] = [];
      const centre: string[] = [];
      let startX = 0;
      let startY = 0;
      let endX = node.x;
      let endY = node.y;

      for (let i = 0; i <= SAMPLES; i++) {
        const u = (i / SAMPLES) * extent;
        const z = Math.max(originZ + branch.lengthZ * u, 40);

        const lateral = relativeRoadX(scene, z) + branchLateral(branch, u);
        const elevation = branchElevation(branch, u);
        const half = surfaceHalfWidth(u, crossover);

        const c = project(z, lateral, elevation, m);
        const l = project(z, lateral - half, elevation, m);
        const rr = project(z, lateral + half, elevation, m);

        /*
         * The blend from landscape to diagram. The hub end stays put and the
         * far end travels to its node, with the pull ramped along u — so the
         * route pivots about its junction instead of sliding sideways as a
         * whole, and the join to the road never breaks.
         */
        const pull = net.settle * (u * u);
        const hubX = lerp(c.x, net.hub.x, net.settle * (1 - u) * 0.35);
        const cx = lerp(hubX, node.x, pull);
        const cy = lerp(c.y, node.y, pull);

        if (i === 0) {
          startX = cx;
          startY = cy;
        }
        endX = cx;
        endY = cy;

        // Surface edges collapse onto the centreline as the diagram takes over,
        // because a diagram has no road width.
        const edgeFade = 1 - net.settle;
        left.push(`${lerp(cx, l.x, edgeFade).toFixed(1)} ${lerp(cy, l.y, edgeFade).toFixed(1)}`);
        right.push(`${lerp(cx, rr.x, edgeFade).toFixed(1)} ${lerp(cy, rr.y, edgeFade).toFixed(1)}`);
        centre.push(`${cx.toFixed(1)} ${cy.toFixed(1)}`);
      }

      if (centre.length < 2) {
        r.group.style.opacity = "0";
        return;
      }

      /*
       * Haze, softened, and lifted as the routes become diagram. A connection
       * line is partly a statement rather than an object, so it is allowed to
       * read clearer than atmosphere alone would permit — but while it is
       * still road it fades with distance like everything else.
       */
      const depth = 0.45 + clarity(Math.max(originZ, 0)) * 0.55;
      r.group.style.opacity = (lerp(depth, 0.95, net.settle) * emerge).toFixed(3);

      if (r.surface) {
        r.surface.setAttribute(
          "d",
          `M ${left.join(" L ")} L ${right.slice().reverse().join(" L ")} Z`,
        );
      }
      if (r.line) {
        r.line.setAttribute("d", `M ${centre.join(" L ")}`);
        // Hairline, pinned in screen space rather than scaled by projection:
        // a gold route that thickened as it neared would become the neon the
        // brief rules out.
        r.line.setAttribute("stroke-width", (1.1 + digital * 0.5).toFixed(2));
      }

      /*
       * A short gold accent hugging the highway's own edge just before the
       * junction — the first rung of the physical-to-digital ladder, the road
       * edge picking up the accent before anything leaves it. It fades out
       * with the landscape, since in diagram space there is no road edge left
       * to trace.
       */
      if (r.leadIn) {
        const leadPoints: string[] = [];
        for (let i = 0; i <= 6; i++) {
          const z = originZ - 120 + (120 * i) / 6;
          if (z <= 10) continue;
          const lateral = relativeRoadX(scene, z) + branch.side * (ROAD_HALF_WIDTH * 0.85);
          const pt = project(z, lateral, 0, m);
          leadPoints.push(`${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`);
        }
        if (leadPoints.length > 1) {
          r.leadIn.setAttribute("d", `M ${leadPoints.join(" L ")}`);
          r.leadIn.style.opacity = (emerge * 0.7 * (1 - net.settle)).toFixed(3);
        } else {
          r.leadIn.style.opacity = "0";
        }
      }

      // Both gradients get their coordinates written explicitly rather than one
      // inheriting from the other via href: gradient attribute inheritance is an
      // SVG2 feature with uneven support, and a silent failure would put the
      // crossover in the wrong place with nothing to show why.
      for (const gradient of [r.surfaceGradient, r.lineGradient]) {
        if (!gradient) continue;
        gradient.setAttribute("x1", startX.toFixed(1));
        gradient.setAttribute("y1", startY.toFixed(1));
        gradient.setAttribute("x2", endX.toFixed(1));
        gradient.setAttribute("y2", endY.toFixed(1));
      }
      const fadeIn = Math.max(0, Math.min(0.98, crossover - 0.2));
      const full = Math.max(fadeIn + 0.02, Math.min(1, crossover + 0.14));
      r.lineStops[0]?.setAttribute("offset", fadeIn.toFixed(3));
      r.lineStops[1]?.setAttribute("offset", full.toFixed(3));
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
        {BRANCHES.map((branch, index) => (
          <React.Fragment key={branch.id}>
            <linearGradient
              id={`journey-route-surface-${branch.id}`}
              gradientUnits="userSpaceOnUse"
              ref={(node) => {
                refs.current[index].surfaceGradient = node;
              }}
            >
              <stop offset="0" stopColor="#2b3648" stopOpacity="0.9" />
              <stop offset="1" stopColor="#1b2534" stopOpacity="0" />
            </linearGradient>

            <linearGradient
              id={`journey-route-line-${branch.id}`}
              gradientUnits="userSpaceOnUse"
              ref={(node) => {
                refs.current[index].lineGradient = node;
              }}
            >
              <stop
                ref={(node) => {
                  refs.current[index].lineStops[0] = node;
                }}
                offset="0.5"
                stopColor="#b8860b"
                stopOpacity="0"
              />
              <stop
                ref={(node) => {
                  refs.current[index].lineStops[1] = node;
                }}
                offset="0.8"
                stopColor="#d4af37"
                stopOpacity="0.92"
              />
              <stop offset="1" stopColor="#e0bd53" stopOpacity="0.95" />
            </linearGradient>
          </React.Fragment>
        ))}
      </defs>

      {BRANCHES.map((branch, index) => (
        <g
          key={branch.id}
          opacity="0"
          ref={(node) => {
            refs.current[index].group = node;
          }}
        >
          <path
            ref={(node) => {
              refs.current[index].surface = node;
            }}
            fill={`url(#journey-route-surface-${branch.id})`}
          />
          <path
            ref={(node) => {
              refs.current[index].leadIn = node;
            }}
            fill="none"
            stroke="#b8860b"
            strokeWidth="1.4"
            strokeLinecap="round"
            opacity="0"
          />
          <path
            ref={(node) => {
              refs.current[index].line = node;
            }}
            fill="none"
            stroke={`url(#journey-route-line-${branch.id})`}
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ))}
    </svg>
  );
};

export default JourneyRoutes;
