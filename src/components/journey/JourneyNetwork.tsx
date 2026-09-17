"use client";

import React, { useRef } from "react";
import styles from "./Journey2D.module.css";
import {
  CONVERGE_PULL,
  DIGITISATION,
  NETWORK_CONNECT,
  NETWORK_CONVERGE,
  NETWORK_EXPAND,
  NETWORK_SETTLE,
  OPPORTUNITY_ANCHOR,
  ROUTES,
} from "./journeyChapters";
import { roadX, smoothstep, type SceneState, type StageMetrics } from "./journeySideView";
import { useJourneyFrame } from "./journeyScroll";

/**
 * REACH, CONNECTION and OPPORTUNITY: the routes, the network and its centre.
 *
 * Each route leaves the carriageway at a real world position and curves up
 * into the quiet upper right of the frame. Because its origin is a point on
 * the road plane, the junction slides with the road and the split genuinely
 * happens on the tarmac — lines drawn over the scene drift out of register the
 * moment the camera moves.
 *
 * Late in the story each node's position blends from where it physically sits
 * to a composed position in the frame. That blend is what lets the network
 * survive its junctions sliding off the left edge: landscape early, diagram
 * late, one continuous interpolation with no cut between them.
 */

/** Ring order walks the constellation, so the loop does not cross itself. */
const RING: [number, number][] = [
  [0, 2],
  [2, 4],
  [4, 3],
  [3, 1],
  [1, 0],
];

interface NodePoint {
  x: number;
  y: number;
  originScreenX: number;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Resolves every point in the network for one frame. */
function resolve(scene: SceneState) {
  const m = scene.metrics;
  const p = scene.progress;

  const settle = smoothstep(NETWORK_SETTLE.from, NETWORK_SETTLE.to, p);
  const connect = smoothstep(NETWORK_CONNECT.from, NETWORK_CONNECT.to, p);
  const converge = smoothstep(NETWORK_CONVERGE.from, NETWORK_CONVERGE.to, p);
  // The final chapter pushes the constellation back outward: the network does
  // not end gathered, it ends reaching.
  const expand = smoothstep(NETWORK_EXPAND.from, NETWORK_EXPAND.to, p);

  const centre = {
    x: m.width * OPPORTUNITY_ANCHOR.x,
    y: m.height * OPPORTUNITY_ANCHOR.y,
  };

  const nodes: NodePoint[] = ROUTES.map((route) => {
    const originScreenX = roadX(scene, route.originX);
    const endScreenX = roadX(scene, route.originX + route.runX);
    const endScreenY = m.roadFarY - m.height * route.riseY;

    let x = lerp(endScreenX, m.width * route.anchor.x, settle);
    let y = lerp(endScreenY, m.height * route.anchor.y, settle);

    // Drawn in, but never all the way: the final figure is a network gathered
    // around a centre, not collapsed into it.
    const pull = converge * CONVERGE_PULL * (1 - expand * 0.7);
    x = lerp(x, centre.x, pull);
    y = lerp(y, centre.y, pull);

    // Expansion pushes outward from the centre in the last chapter.
    x = centre.x + (x - centre.x) * (1 + expand * 0.3);
    y = centre.y + (y - centre.y) * (1 + expand * 0.3);

    return { x, y, originScreenX };
  });

  return { settle, connect, converge, expand, centre, nodes };
}

export const JourneyNetwork: React.FC<{ metrics: StageMetrics }> = ({ metrics }) => {
  const routeRefs = useRef<(SVGPathElement | null)[]>(ROUTES.map(() => null));
  const nodeRefs = useRef<(SVGGElement | null)[]>(ROUTES.map(() => null));
  const labelRefs = useRef<(SVGTextElement | null)[]>(ROUTES.map(() => null));
  const ringRefs = useRef<(SVGLineElement | null)[]>(RING.map(() => null));
  const spokeRefs = useRef<(SVGLineElement | null)[]>(ROUTES.map(() => null));
  const centreRef = useRef<SVGGElement>(null);
  const centreLabelRef = useRef<SVGTextElement>(null);

  useJourneyFrame((scene: SceneState) => {
    const m = scene.metrics;
    const net = resolve(scene);
    const digital = smoothstep(DIGITISATION.from, DIGITISATION.to, scene.progress);

    ROUTES.forEach((route, index) => {
      const node = net.nodes[index];
      const emerge = smoothstep(route.reveal.from, route.reveal.to, scene.progress);

      const path = routeRefs.current[index];
      if (path) {
        if (emerge <= 0.001) {
          path.style.opacity = "0";
        } else {
          /*
           * A quadratic from the junction to the node, with its control point
           * level with the road and out toward the node — so the route leaves
           * the carriageway flat and only then climbs. A route peeling off,
           * rather than a line drawn to a dot.
           *
           * The end point is interpolated by `emerge`, so the route grows out
           * of the junction instead of appearing along its whole length.
           */
          const x0 = node.originScreenX;
          const y0 = m.roadFarY;
          const x1 = lerp(x0, node.x, emerge);
          const y1 = lerp(y0, node.y, emerge);
          const cx = lerp(x0, x1, 0.62);
          const cy = lerp(y0, y1, 0.08);

          path.setAttribute(
            "d",
            `M ${x0.toFixed(1)} ${y0.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`,
          );
          // Hairline, pinned in screen space: a gold route that thickened as
          // it grew would become the neon the brief rules out.
          path.setAttribute("stroke-width", (1 + digital * 0.5).toFixed(2));
          path.style.opacity = (emerge * (0.55 + digital * 0.45)).toFixed(3);
        }
      }

      const nodeGroup = nodeRefs.current[index];
      if (nodeGroup) {
        const arrive = smoothstep(route.reveal.from + 0.04, route.reveal.to + 0.02, scene.progress);
        nodeGroup.setAttribute("transform", `translate(${node.x.toFixed(1)} ${node.y.toFixed(1)})`);
        nodeGroup.style.opacity = arrive.toFixed(3);
      }

      const label = labelRefs.current[index];
      if (label) {
        label.setAttribute("x", (node.x + m.width * 0.016).toFixed(1));
        label.setAttribute("y", (node.y + 4).toFixed(1));
        // Labels arrive just after their node, so the dot lands first and is
        // then named — the order a reader expects.
        label.style.opacity = (
          smoothstep(route.reveal.to - 0.02, route.reveal.to + 0.05, scene.progress) * 0.85
        ).toFixed(3);
      }
    });

    RING.forEach((edge, index) => {
      const line = ringRefs.current[index];
      if (!line) return;
      const a = net.nodes[edge[0]];
      const b = net.nodes[edge[1]];
      line.setAttribute("x1", a.x.toFixed(1));
      line.setAttribute("y1", a.y.toFixed(1));
      line.setAttribute("x2", b.x.toFixed(1));
      line.setAttribute("y2", b.y.toFixed(1));
      // Staggered, so the network assembles link by link rather than
      // switching on whole.
      const stagger = index / RING.length;
      line.style.opacity = (smoothstep(stagger * 0.5, 0.5 + stagger * 0.5, net.connect) * 0.7).toFixed(3);
    });

    ROUTES.forEach((_, index) => {
      const line = spokeRefs.current[index];
      if (!line) return;
      const a = net.nodes[index];
      line.setAttribute("x1", a.x.toFixed(1));
      line.setAttribute("y1", a.y.toFixed(1));
      line.setAttribute("x2", net.centre.x.toFixed(1));
      line.setAttribute("y2", net.centre.y.toFixed(1));
      line.style.opacity = (net.converge * 0.6).toFixed(3);
    });

    if (centreRef.current) {
      const emerge = smoothstep(NETWORK_CONVERGE.from, NETWORK_CONVERGE.to - 0.03, scene.progress);
      // A slow breath, a few percent — alive, not a pulsing objective marker.
      const breath = 1 + Math.sin(scene.time * 0.7) * 0.04;
      const size = m.width * 0.011 * breath * (1 + net.expand * 0.35);
      centreRef.current.setAttribute(
        "transform",
        `translate(${net.centre.x.toFixed(1)} ${net.centre.y.toFixed(1)}) scale(${size.toFixed(2)})`,
      );
      centreRef.current.style.opacity = emerge.toFixed(3);
    }
    if (centreLabelRef.current) {
      centreLabelRef.current.setAttribute("x", net.centre.x.toFixed(1));
      centreLabelRef.current.setAttribute("y", (net.centre.y + m.width * 0.03).toFixed(1));
      centreLabelRef.current.style.opacity = smoothstep(0.86, 0.93, scene.progress).toFixed(3);
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
        <radialGradient id="journey-net-node">
          <stop offset="0%" stopColor="#e8c87a" stopOpacity="0.45" />
          <stop offset="45%" stopColor="#d4af37" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="journey-net-centre">
          <stop offset="0%" stopColor="#f2d489" stopOpacity="0.55" />
          <stop offset="38%" stopColor="#d4af37" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Routes, then links, then nodes on top of what joins them. */}
      {ROUTES.map((route, index) => (
        <path
          key={route.id}
          ref={(node) => {
            routeRefs.current[index] = node;
          }}
          fill="none"
          stroke="#d4af37"
          strokeWidth="1.1"
          strokeLinecap="round"
          opacity="0"
        />
      ))}

      {RING.map((_, index) => (
        <line
          key={`ring-${index}`}
          ref={(node) => {
            ringRefs.current[index] = node;
          }}
          stroke="#c69a2e"
          strokeWidth="0.8"
          strokeLinecap="round"
          opacity="0"
        />
      ))}

      {ROUTES.map((route, index) => (
        <line
          key={`spoke-${route.id}`}
          ref={(node) => {
            spokeRefs.current[index] = node;
          }}
          stroke="#d4af37"
          strokeWidth="0.9"
          strokeLinecap="round"
          opacity="0"
        />
      ))}

      {ROUTES.map((route, index) => (
        <g key={`node-${route.id}`}>
          <g
            ref={(node) => {
              nodeRefs.current[index] = node;
            }}
            opacity="0"
          >
            <circle r={metrics.width * 0.012} fill="url(#journey-net-node)" />
            <circle r={metrics.width * 0.0032} fill="none" stroke="#d4af37" strokeWidth="0.7" opacity="0.7" />
            <circle r={metrics.width * 0.0014} fill="#f0d386" />
          </g>
          {/*
           * One small label per node. The brief names these audiences, and a
           * network of unlabelled dots claims connection without saying to
           * whom — which is the difference between a diagram and decoration.
           */}
          <text
            ref={(node) => {
              labelRefs.current[index] = node;
            }}
            fill="rgba(232, 200, 122, 0.9)"
            fontSize={Math.max(9, metrics.width * 0.0072)}
            letterSpacing="1.6"
            fontFamily="var(--font-mono-custom), ui-monospace, monospace"
            opacity="0"
          >
            {route.audience.toUpperCase()}
          </text>
        </g>
      ))}

      {/*
       * The opportunity point: larger than the others and the only one with a
       * second ring, because it is what the network resolves onto — but still
       * a mark, not a reticle.
       */}
      <g ref={centreRef} opacity="0">
        <circle r="3.6" fill="url(#journey-net-centre)" />
        <circle r="1.25" fill="none" stroke="#d4af37" strokeWidth="0.13" opacity="0.55" />
        <circle r="0.78" fill="none" stroke="#e0bd53" strokeWidth="0.16" opacity="0.85" />
        <circle r="0.34" fill="#f7e3ab" />
      </g>
      <text
        ref={centreLabelRef}
        textAnchor="middle"
        fill="#d4af37"
        fontSize={Math.max(9, metrics.width * 0.0068)}
        letterSpacing="3.2"
        fontFamily="var(--font-mono-custom), ui-monospace, monospace"
        opacity="0"
      >
        OPPORTUNITY
      </text>
    </svg>
  );
};

export default JourneyNetwork;
