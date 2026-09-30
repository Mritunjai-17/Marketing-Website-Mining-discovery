"use client";

import React, { useRef } from "react";
import styles from "./Journey2D.module.css";
import {
  BILLBOARD_OFFSET,
  BILLBOARD_Z,
  clarity,
  project,
  relativeRoadX,
  smoothstep,
  type StageMetrics,
} from "./journeyPerspective";
import { useJourneyFrame } from "./journeyScroll";
import {
  BILLBOARD_ACTIVATION,
  BILLBOARD_CROSSFADE,
  BILLBOARD_MESSAGES,
} from "./journeyChapters";

/**
 * VISIBILITY: the roadside digital billboard.
 *
 * Drawn in world units and placed by the same projection the road uses, which
 * is what makes it part of the environment rather than a card laid over it. It
 * stands at a real distance beside a real carriageway, grows at the rate the
 * road beneath it grows, and drifts laterally as the highway bends because its
 * position is measured from the road's own centreline.
 *
 * Its chapter is an argument in three beats — the publisher, the story, the
 * audience — and the panel cycles through them as the truck closes on it, then
 * sweeps past as REACH begins.
 */

/** Panel size in world units — a real highway bulletin is about 14m x 7m. */
const PANEL_W = 23;
const PANEL_H = 11.5;

/** Height of the panel's bottom edge above the road. */
const PANEL_BASE = 8.4;

/**
 * Below this distance the panel is level with the camera and its projection is
 * meaningless — a near-zero z sends scale to infinity. It is hidden rather than
 * clamped, because a billboard frozen at enormous size beside the road is far
 * more conspicuous than one that has simply gone by.
 */
const PASS_Z = 26;

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

    const z = BILLBOARD_Z - scene.travel;
    if (z <= PASS_Z) {
      group.style.opacity = "0";
      return;
    }

    const lateral = relativeRoadX(scene, z) + BILLBOARD_OFFSET;
    // Anchored at road level, so the legs always meet the ground.
    const anchor = project(z, lateral, 0, scene.metrics);

    group.style.transform = `translate3d(${anchor.x.toFixed(2)}px, ${anchor.y.toFixed(2)}px, 0) scale(${anchor.scale.toFixed(4)})`;

    /*
     * Haze thins the structure at distance, and a short fade covers the last
     * few metres before it leaves frame — otherwise the sign would vanish
     * mid-stride as it crossed the near plane.
     */
    const leaving = smoothstep(PASS_Z, PASS_Z + 34, z);
    group.style.opacity = ((0.35 + clarity(z) * 0.65) * leaving).toFixed(3);

    /*
     * Activation: the panel comes up from a resting glow to full output as the
     * chapter opens. This is the chapter's visual event — the moment the story
     * becomes visible — so it is tied to the chapter's own range rather than to
     * distance.
     */
    const lit = smoothstep(BILLBOARD_ACTIVATION.from, BILLBOARD_ACTIVATION.to, scene.progress);
    if (screenRef.current) screenRef.current.style.opacity = (0.4 + lit * 0.6).toFixed(3);
    if (haloRef.current) haloRef.current.style.opacity = (lit * 0.38).toFixed(3);
    if (spillRef.current) spillRef.current.style.opacity = (lit * 0.24).toFixed(3);

    /*
     * A soft refresh band easing down the panel. Slow — a full pass takes about
     * fourteen seconds — and only a few percent of brightness, so it reads as a
     * display that is running rather than one with a fault.
     */
    if (sweepRef.current) {
      const phase = (scene.time * 0.07) % 1;
      sweepRef.current.setAttribute("y", (-PANEL_H - PANEL_BASE + phase * PANEL_H).toFixed(2));
    }

    /*
     * The creative cycle.
     *
     * Each message fades in over its hold's opening and out over its close,
     * with a small vertical drift — outgoing copy rises away, incoming copy
     * settles down into place. Because the fades are offset rather than
     * symmetric, one creative is nearly gone before the next is legible: a
     * straight crossfade would leave two messages at half opacity on a bright
     * panel, reading as one printed over the other.
     */
    BILLBOARD_MESSAGES.forEach((message, index) => {
      const element = messageRefs.current[index];
      if (!element) return;

      /*
       * A creative's exit is the next one's entrance, exactly — the holds are
       * contiguous, so both ramps run over the same span and the pair always
       * sums to one.
       *
       * The earlier version offset them to avoid the two overlapping, and that
       * was the wrong trade: it opened a window around each changeover where
       * the leading creative sat at 26% and the panel read as blank. On a lit
       * billboard a blank moment is far more conspicuous than a brief
       * dissolve, and the crossfade is short enough that the dissolve is over
       * in a few percent of scroll.
       */
      const entering =
        index === 0
          ? 1
          : smoothstep(message.hold.from, message.hold.from + BILLBOARD_CROSSFADE, scene.progress);
      const leavingMessage =
        index === BILLBOARD_MESSAGES.length - 1
          ? 0
          : smoothstep(
              message.hold.to,
              message.hold.to + BILLBOARD_CROSSFADE,
              scene.progress,
            );

      const opacity = entering * (1 - leavingMessage);
      element.style.opacity = opacity.toFixed(3);
      const drift = (1 - entering) * PANEL_H * 0.1 - leavingMessage * PANEL_H * 0.12;
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
          <stop offset="0%" stopColor="#123258" />
          <stop offset="55%" stopColor="#0b1f3a" />
          <stop offset="100%" stopColor="#06152a" />
        </linearGradient>
        <linearGradient id="journey-bb-frame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a3243" />
          <stop offset="100%" stopColor="#151b26" />
        </linearGradient>
        <radialGradient id="journey-bb-halo">
          <stop offset="0%" stopColor="#8fb4e8" stopOpacity="0.5" />
          <stop offset="60%" stopColor="#5c7fb5" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#5c7fb5" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="journey-bb-spill">
          <stop offset="0%" stopColor="#9db8e0" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#9db8e0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="journey-bb-sweep" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.09" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Everything below is in world units; the group transform places it. */}
      <g ref={groupRef}>
        <ellipse ref={spillRef} cx="0" cy="1.5" rx={PANEL_W * 0.85} ry="5" fill="url(#journey-bb-spill)" opacity="0" />
        <ellipse
          ref={haloRef}
          cx="0"
          cy={-(PANEL_BASE + PANEL_H / 2)}
          rx={PANEL_W * 1.15}
          ry={PANEL_H * 1.35}
          fill="url(#journey-bb-halo)"
          opacity="0"
        />

        {/* Legs, footings and cross brace. */}
        {[-PANEL_W * 0.28, PANEL_W * 0.28].map((x) => (
          <g key={x}>
            <rect x={x - 0.5} y={-PANEL_BASE} width="1" height={PANEL_BASE} fill="url(#journey-bb-frame)" />
            <rect x={x - 1.5} y="-0.7" width="3" height="0.9" fill="#0e141f" />
          </g>
        ))}
        <rect x={-PANEL_W * 0.28} y={-PANEL_BASE * 0.55} width={PANEL_W * 0.56} height="0.45" fill="#1b2230" />
        <rect x={-PANEL_W * 0.54} y={-PANEL_BASE - 0.9} width={PANEL_W * 1.08} height="1.1" fill="url(#journey-bb-frame)" />

        {/* Frame, sized a little larger than the screen so it has real depth. */}
        <rect
          x={-PANEL_W / 2 - 0.55}
          y={-PANEL_BASE - PANEL_H - 0.55}
          width={PANEL_W + 1.1}
          height={PANEL_H + 1.1}
          fill="url(#journey-bb-frame)"
          rx="0.3"
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
                  y={
                    -PANEL_BASE -
                    PANEL_H * (message.caption ? 0.58 : 0.62) +
                    lineIndex * PANEL_H * 0.3
                  }
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize={PANEL_H * 0.27}
                  fontFamily="var(--font-display-custom), Georgia, serif"
                  textLength={PANEL_W * message.lineWidths[lineIndex]}
                  lengthAdjust="spacingAndGlyphs"
                >
                  {line}
                </text>
              ))}

              <rect
                x={-PANEL_W * 0.13}
                y={-PANEL_BASE - PANEL_H * 0.2}
                width={PANEL_W * 0.26}
                height={PANEL_H * 0.018}
                fill="#d4af37"
              />

              {message.caption && (
                <text
                  x="0"
                  y={-PANEL_BASE - PANEL_H * 0.09}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.5)"
                  fontSize={PANEL_H * 0.072}
                  fontFamily="var(--font-mono-custom), ui-monospace, monospace"
                  textLength={PANEL_W * 0.58}
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

        {/*
         * The gold edge. Four hairlines bound to the frame's actual edge — the
         * brief's gold language used structurally, not as decoration floating
         * near the sign.
         */}
        <rect
          x={-PANEL_W / 2 - 0.55}
          y={-PANEL_BASE - PANEL_H - 0.55}
          width={PANEL_W + 1.1}
          height={PANEL_H + 1.1}
          fill="none"
          stroke="#b8860b"
          strokeWidth="0.22"
          rx="0.3"
        />
      </g>
    </svg>
  );
};

export default JourneyBillboard;
