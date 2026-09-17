"use client";

import React, { useRef } from "react";
import styles from "./Journey2D.module.css";
import {
  BILLBOARD_ACTIVATION,
  BILLBOARD_CROSSFADE,
  BILLBOARD_MESSAGES,
} from "./journeyChapters";
import { roadX, smoothstep, type StageMetrics } from "./journeySideView";
import { useJourneyFrame } from "./journeyScroll";

/**
 * VISIBILITY: the roadside billboard, seen from the side.
 *
 * Stands at a real world position on the road plane, so it slides at exactly
 * the rate the road does and the truck genuinely passes it — the alternative,
 * an element positioned as a fraction of the screen, drifts out of register
 * with the carriageway the moment anything changes.
 *
 * Its chapter is an argument in three beats — the publisher, the story, the
 * audience — and the panel cycles through them as the truck closes on it.
 */

/** Where it stands, in world units. The truck draws level at 980/2400. */
export const BILLBOARD_WORLD_X = 980;

/** Panel size in world units. A real highway bulletin is about 14m x 7m. */
const PANEL_W = 26;
const PANEL_H = 13;
const PANEL_BASE = 13;

export const JourneyBillboard: React.FC<{ metrics: StageMetrics }> = ({ metrics }) => {
  const groupRef = useRef<SVGGElement>(null);
  const screenRef = useRef<SVGGElement>(null);
  const haloRef = useRef<SVGEllipseElement>(null);
  const spillRef = useRef<SVGEllipseElement>(null);
  const sweepRef = useRef<SVGRectElement>(null);
  const messageRefs = useRef<(SVGGElement | null)[]>(BILLBOARD_MESSAGES.map(() => null));

  useJourneyFrame((scene) => {
    const group = groupRef.current;
    if (!group) return;
    const m = scene.metrics;

    const x = roadX(scene, BILLBOARD_WORLD_X);
    // Culled generously: the panel is wide, and clipping it at the frame edge
    // would pop a quarter of the screen out of existence.
    if (x < -m.width * 0.8 || x > m.width * 1.8) {
      group.style.opacity = "0";
      return;
    }

    // Stands on the verge, behind the guard rail.
    const y = m.roadFarY - (m.roadNearY - m.roadFarY) * 0.2;
    group.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${m.pxPerUnit.toFixed(4)})`;
    group.style.opacity = "1";

    /*
     * Activation: the panel comes up from a resting glow to full output as its
     * chapter opens. This is the chapter's visual event — the moment the story
     * becomes visible — so it is tied to the chapter, not to distance.
     */
    const lit = smoothstep(BILLBOARD_ACTIVATION.from, BILLBOARD_ACTIVATION.to, scene.progress);
    if (screenRef.current) screenRef.current.style.opacity = (0.4 + lit * 0.6).toFixed(3);
    if (haloRef.current) haloRef.current.style.opacity = (lit * 0.34).toFixed(3);
    if (spillRef.current) spillRef.current.style.opacity = (lit * 0.26).toFixed(3);

    // A soft refresh band easing down the panel — a hint of a scan, not a
    // scanline, and slow enough that a full pass takes about fourteen seconds.
    if (sweepRef.current) {
      const phase = (scene.time * 0.07) % 1;
      sweepRef.current.setAttribute("y", (-PANEL_H - PANEL_BASE + phase * PANEL_H).toFixed(2));
    }

    /*
     * The creative cycle. Each exit is the next one's entrance exactly, so the
     * pair always sums to one and the panel is never blank at a changeover —
     * on a lit billboard a blank moment is far more conspicuous than a brief
     * dissolve.
     */
    BILLBOARD_MESSAGES.forEach((message, index) => {
      const element = messageRefs.current[index];
      if (!element) return;
      const entering =
        index === 0
          ? 1
          : smoothstep(message.hold.from, message.hold.from + BILLBOARD_CROSSFADE, scene.progress);
      const leaving =
        index === BILLBOARD_MESSAGES.length - 1
          ? 0
          : smoothstep(message.hold.to, message.hold.to + BILLBOARD_CROSSFADE, scene.progress);

      element.style.opacity = (entering * (1 - leaving)).toFixed(3);
      const drift = (1 - entering) * PANEL_H * 0.09 - leaving * PANEL_H * 0.11;
      element.style.transform = `translate(0px, ${drift.toFixed(3)}px)`;
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
        <linearGradient id="journey-bb-screen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#143a63" />
          <stop offset="55%" stopColor="#0b1f3a" />
          <stop offset="100%" stopColor="#06152a" />
        </linearGradient>
        <linearGradient id="journey-bb-frame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2f3849" />
          <stop offset="100%" stopColor="#141a24" />
        </linearGradient>
        <radialGradient id="journey-bb-halo">
          <stop offset="0%" stopColor="#8fb4e8" stopOpacity="0.45" />
          <stop offset="60%" stopColor="#5c7fb5" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#5c7fb5" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="journey-bb-spill">
          <stop offset="0%" stopColor="#9db8e0" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#9db8e0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="journey-bb-sweep" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.09" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* World units below; the group transform places and scales it. */}
      <g ref={groupRef} opacity="0">
        {/* Light spilling onto the ground the sign stands over. */}
        <ellipse ref={spillRef} cx="0" cy="1.5" rx={PANEL_W * 0.7} ry="4" fill="url(#journey-bb-spill)" opacity="0" />
        <ellipse
          ref={haloRef}
          cx="0"
          cy={-(PANEL_BASE + PANEL_H / 2)}
          rx={PANEL_W * 1.1}
          ry={PANEL_H * 1.25}
          fill="url(#journey-bb-halo)"
          opacity="0"
        />

        {/* Twin legs, footings and a cross brace — a real support structure. */}
        {[-PANEL_W * 0.3, PANEL_W * 0.3].map((legX) => (
          <g key={legX}>
            <rect x={legX - 0.55} y={-PANEL_BASE} width="1.1" height={PANEL_BASE} fill="url(#journey-bb-frame)" />
            <rect x={legX - 1.6} y="-0.8" width="3.2" height="1" fill="#0b111b" />
          </g>
        ))}
        <path
          d={`M ${-PANEL_W * 0.3} ${-PANEL_BASE * 0.9} L ${PANEL_W * 0.3} ${-PANEL_BASE * 0.35}
              M ${PANEL_W * 0.3} ${-PANEL_BASE * 0.9} L ${-PANEL_W * 0.3} ${-PANEL_BASE * 0.35}`}
          stroke="#1b2230"
          strokeWidth="0.45"
          fill="none"
        />
        <rect x={-PANEL_W * 0.56} y={-PANEL_BASE - 1} width={PANEL_W * 1.12} height="1.2" fill="url(#journey-bb-frame)" />

        {/* Frame, larger than the screen so the panel has real thickness. */}
        <rect
          x={-PANEL_W / 2 - 0.7}
          y={-PANEL_BASE - PANEL_H - 0.7}
          width={PANEL_W + 1.4}
          height={PANEL_H + 1.4}
          fill="url(#journey-bb-frame)"
          rx="0.4"
        />

        <g ref={screenRef} opacity="0.4">
          <rect x={-PANEL_W / 2} y={-PANEL_BASE - PANEL_H} width={PANEL_W} height={PANEL_H} fill="url(#journey-bb-screen)" />

          {BILLBOARD_MESSAGES.map((message, index) => (
            <g
              key={message.id}
              ref={(node) => {
                messageRefs.current[index] = node;
              }}
              opacity={index === 0 ? 1 : 0}
            >
              {message.lines.map((line, lineIndex) => (
                <text
                  key={line}
                  x="0"
                  y={-PANEL_BASE - PANEL_H * (message.caption ? 0.6 : 0.64) + lineIndex * PANEL_H * 0.3}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize={PANEL_H * 0.26}
                  fontFamily="var(--font-display-custom), Georgia, serif"
                  /*
                   * Pinned lengths, not styling: SVG text neither wraps nor
                   * shrinks, and the display serif may not have loaded when
                   * the panel first paints. Without this the fallback's wider
                   * metrics push copy past the panel edge.
                   */
                  textLength={PANEL_W * message.lineWidths[lineIndex]}
                  lengthAdjust="spacingAndGlyphs"
                >
                  {line}
                </text>
              ))}
              <rect
                x={-PANEL_W * 0.12}
                y={-PANEL_BASE - PANEL_H * 0.2}
                width={PANEL_W * 0.24}
                height={PANEL_H * 0.016}
                fill="#d4af37"
              />
              {message.caption && (
                <text
                  x="0"
                  y={-PANEL_BASE - PANEL_H * 0.09}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.5)"
                  fontSize={PANEL_H * 0.068}
                  fontFamily="var(--font-mono-custom), ui-monospace, monospace"
                  textLength={PANEL_W * 0.54}
                  lengthAdjust="spacingAndGlyphs"
                >
                  {message.caption}
                </text>
              )}
            </g>
          ))}

          <rect
            ref={sweepRef}
            x={-PANEL_W / 2}
            y={-PANEL_BASE - PANEL_H}
            width={PANEL_W}
            height={PANEL_H * 0.34}
            fill="url(#journey-bb-sweep)"
          />
        </g>

        {/* The gold edge: four hairlines bound to the frame's actual edge. */}
        <rect
          x={-PANEL_W / 2 - 0.7}
          y={-PANEL_BASE - PANEL_H - 0.7}
          width={PANEL_W + 1.4}
          height={PANEL_H + 1.4}
          fill="none"
          stroke="#b8860b"
          strokeWidth="0.24"
          rx="0.4"
        />
      </g>
    </svg>
  );
};

export default JourneyBillboard;
