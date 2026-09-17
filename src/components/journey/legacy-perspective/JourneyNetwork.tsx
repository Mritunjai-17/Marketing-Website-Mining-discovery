"use client";

import React, { useRef } from "react";
import styles from "./Journey2D.module.css";
import { smoothstep, type StageMetrics } from "./journeyPerspective";
import { useJourneyFrame } from "./journeyScroll";
import { BRANCHES, NETWORK_CONVERGE } from "./journeyChapters";
import { NODE_COUNT, RING_EDGES, allNodes, resolveNetwork } from "./networkModel";

/**
 * CONNECTION and OPPORTUNITY: the routes link, then converge.
 *
 * Draws only what the routes layer does not — the destination nodes, the links
 * between them, and the point they gather around. Node positions come from the
 * shared `resolveNetwork`, so a route's far end and its node are the same
 * coordinate rather than two calculations that drift apart.
 *
 * Everything here is a hairline and a small disc. The restraint is the point:
 * the brief asks for a premium editorial network, and the difference between
 * that and a HUD is almost entirely line weight and glow radius.
 */

/** Spokes only reach out to the branch nodes, not the link nodes. */
const SPOKE_TARGETS = BRANCHES.map((_, i) => i);

interface NetworkRefs {
  ring: (SVGLineElement | null)[];
  spokes: (SVGLineElement | null)[];
  nodes: (SVGGElement | null)[];
  centre: SVGGElement | null;
  centreLabel: SVGTextElement | null;
}

export const JourneyNetwork: React.FC<{ metrics: StageMetrics }> = ({ metrics }) => {
  const refs = useRef<NetworkRefs>({
    ring: RING_EDGES.map(() => null),
    spokes: SPOKE_TARGETS.map(() => null),
    nodes: Array.from({ length: NODE_COUNT }, () => null),
    centre: null,
    centreLabel: null,
  });

  useJourneyFrame((scene) => {
    const net = resolveNetwork(scene);
    const points = allNodes(net);
    const r = refs.current;

    /*
     * Nodes appear as their route arrives; the two link nodes have no route,
     * so they come in with the connections that create them.
     */
    points.forEach((point, index) => {
      const group = r.nodes[index];
      if (!group) return;

      const isBranch = index < BRANCHES.length;
      const arrive = isBranch
        ? smoothstep(
            BRANCHES[index].reveal.from + 0.06,
            BRANCHES[index].reveal.to + 0.04,
            scene.progress,
          )
        : net.connect;

      // Size settles to a constant as the diagram takes over: in landscape it
      // scales with distance like anything else, in the diagram it is a mark
      // on a page and marks do not have perspective.
      const projected = isBranch ? Math.max(2.6, Math.min(11, net.nodeScales[index] * 5.5)) : 5;
      const radius = projected + (5.4 - projected) * net.settle;

      group.setAttribute(
        "transform",
        `translate(${point.x.toFixed(1)} ${point.y.toFixed(1)}) scale(${radius.toFixed(2)})`,
      );
      group.style.opacity = arrive.toFixed(3);
    });

    // Ring links.
    RING_EDGES.forEach((edge, index) => {
      const line = r.ring[index];
      if (!line) return;
      const a = points[edge[0]];
      const b = points[edge[1]];
      line.setAttribute("x1", a.x.toFixed(1));
      line.setAttribute("y1", a.y.toFixed(1));
      line.setAttribute("x2", b.x.toFixed(1));
      line.setAttribute("y2", b.y.toFixed(1));
      /*
       * Links stagger in rather than all appearing together, so the network
       * assembles edge by edge. A ring that completes in one frame reads as a
       * graphic being switched on; one that closes progressively reads as
       * connections being made.
       */
      const stagger = index / RING_EDGES.length;
      line.style.opacity = (smoothstep(stagger * 0.55, 0.55 + stagger * 0.45, net.connect) * 0.78).toFixed(3);
    });

    // Spokes to the opportunity point, during the final chapter.
    SPOKE_TARGETS.forEach((target, index) => {
      const line = r.spokes[index];
      if (!line) return;
      const a = points[target];
      line.setAttribute("x1", a.x.toFixed(1));
      line.setAttribute("y1", a.y.toFixed(1));
      line.setAttribute("x2", net.centre.x.toFixed(1));
      line.setAttribute("y2", net.centre.y.toFixed(1));
      line.style.opacity = (net.converge * 0.72).toFixed(3);
    });

    if (r.centre) {
      const emerge = smoothstep(NETWORK_CONVERGE.from, NETWORK_CONVERGE.to - 0.06, scene.progress);
      // A slow breath, a few percent. Enough that the point is alive; not
      // enough to read as a pulsing objective marker.
      const breath = 1 + Math.sin(scene.time * 0.7) * 0.04;
      r.centre.setAttribute(
        "transform",
        `translate(${net.centre.x.toFixed(1)} ${net.centre.y.toFixed(1)}) scale(${(9 * breath).toFixed(2)})`,
      );
      r.centre.style.opacity = emerge.toFixed(3);
    }
    if (r.centreLabel) {
      r.centreLabel.style.opacity = smoothstep(0.92, 1, scene.progress).toFixed(3);
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

      {/* Links first, so nodes sit on top of the lines that join them. */}
      {RING_EDGES.map((edge, index) => (
        <line
          key={`ring-${index}`}
          ref={(node) => {
            refs.current.ring[index] = node;
          }}
          stroke="#c69a2e"
          strokeWidth="0.9"
          strokeLinecap="round"
          opacity="0"
        />
      ))}

      {SPOKE_TARGETS.map((target, index) => (
        <line
          key={`spoke-${index}`}
          ref={(node) => {
            refs.current.spokes[index] = node;
          }}
          stroke="#d4af37"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0"
        />
      ))}

      {Array.from({ length: NODE_COUNT }, (_, index) => (
        <g
          key={`node-${index}`}
          ref={(node) => {
            refs.current.nodes[index] = node;
          }}
          opacity="0"
        >
          <circle r="3.2" fill="url(#journey-net-node)" />
          <circle r="1" fill="none" stroke="#d4af37" strokeWidth="0.16" opacity="0.7" />
          <circle r="0.4" fill="#f0d386" />
        </g>
      ))}

      {/*
       * The opportunity point. Larger than the others and the only one with a
       * second ring, because it is the thing the whole network resolves onto —
       * but still a mark, not a target reticle.
       */}
      <g
        ref={(node) => {
          refs.current.centre = node;
        }}
        opacity="0"
      >
        <circle r="3.6" fill="url(#journey-net-centre)" />
        <circle r="1.25" fill="none" stroke="#d4af37" strokeWidth="0.13" opacity="0.55" />
        <circle r="0.78" fill="none" stroke="#e0bd53" strokeWidth="0.16" opacity="0.85" />
        <circle r="0.34" fill="#f7e3ab" />
      </g>

      {/* One small caption, set in the site's mono at the composition's scale. */}
      <text
        ref={(node) => {
          refs.current.centreLabel = node;
        }}
        x={metrics.vanishX + 0.1 * metrics.width}
        y={metrics.horizonY + 0.01 * metrics.height + 34}
        textAnchor="middle"
        fill="#d4af37"
        fontSize="10"
        letterSpacing="3.4"
        fontFamily="var(--font-mono-custom), ui-monospace, monospace"
        opacity="0"
      >
        OPPORTUNITY
      </text>
    </svg>
  );
};

export default JourneyNetwork;
