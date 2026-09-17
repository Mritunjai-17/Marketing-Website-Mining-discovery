"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HeadlineUnderline } from "@/components/sections/hero-layers/HeadlineUnderline";
import { FOCUS_ANCHOR_ID, GLOBE_FIT } from "@/components/ui/globe/EarthGlobe";
import type {
  GlobeAnchor,
  GlobeArc,
  GlobeFocus,
  ProjectedAnchor,
} from "@/components/ui/globe/EarthGlobe";
import { useCreateJourneyProgress } from "@/components/journey/journeyProgress";
import { AtmosphericCloudLayer } from "@/components/journey/AtmosphericCloudLayer";
import { DescentBackdrop } from "@/components/journey/DescentBackdrop";
import {
  deriveDescentCamera,
  JOURNEY_RUNS_FROM,
} from "@/components/journey/descentCamera";

const Journey3D = dynamic(
  () => import("@/components/journey/Journey3D"),
  { ssr: false },
);

// WebGL has no server render, and the topojson chunk should not block first paint.
const EarthGlobe = dynamic(
  () => import("@/components/ui/globe/EarthGlobe").then((m) => m.EarthGlobe),
  { ssr: false },
);

interface MiningSite extends GlobeAnchor {
  /** Continent, used as the primary label. */
  region: string;
  /** Country or territory, used as the sub-label. */
  country: string;
  /** One short line shown only while the marker is hovered or focused. */
  detail: string;
}

/**
 * One site per continent, positioned by real coordinates rather than by eye.
 *
 * Antarctica is a geographic representation only — the Antarctic Treaty's Madrid
 * Protocol bans commercial mining there, so its detail line says research, not
 * production. Swap it if the company has real data to put behind it.
 */
const MINING_SITES: MiningSite[] = [
  { id: "north-america", region: "North America", country: "Canada", detail: "Mining region", lat: 56, lng: -106 },
  { id: "south-america", region: "South America", country: "Chile", detail: "Mining region", lat: -30, lng: -71 },
  { id: "europe", region: "Europe", country: "Sweden", detail: "Mining region", lat: 60, lng: 18 },
  { id: "africa", region: "Africa", country: "South Africa", detail: "Mining region", lat: -30, lng: 24 },
  { id: "asia", region: "Asia", country: "Mongolia", detail: "Mining region", lat: 46, lng: 104 },
  { id: "australia", region: "Australia", country: "Western Australia", detail: "Mining region", lat: -25, lng: 122 },
  // The three below are markers only — they are not tour stops and carry no arcs.
  //
  // They exist because the original six sat at longitudes -106, -71, 18, 24, 104 and 122,
  // which leaves two wide empty sweeps: the Atlantic between Chile and Sweden, and the
  // whole Pacific from Western Australia back round to Canada. Only about a third of the
  // set was ever on the near face at once. Filling those gaps is what keeps five or more
  // markers presented at any rotation angle, and each is a real mining region rather than
  // a dot placed to space the set out.
  { id: "brazil", region: "South America", country: "Brazil", detail: "Mining region", lat: -20, lng: -44 },
  { id: "central-asia", region: "Central Asia", country: "Kazakhstan", detail: "Mining region", lat: 48, lng: 68 },
  { id: "southeast-asia", region: "Southeast Asia", country: "Indonesia", detail: "Mining region", lat: -4, lng: 137 },
  // NOTE: at -82 this pin sits permanently below the container's bottom crop — the globe
  // is deliberately cut off there, and no view pitch brings 82S onto the visible arc
  // without pushing Sweden and Canada over the top rim. It is kept geographically honest;
  // to actually surface it, either raise VISIBLE_FRACTION toward 0.9 (a ~20% smaller
  // globe) or move the pin to the Antarctic Peninsula.
  { id: "antarctica", region: "Antarctica", country: "Research site", detail: "Geographic representation", lat: -82, lng: 0 },
];

/**
 * The connection network: ten arcs over six of the regions.
 *
 * WHY ASIA IS IN THE SET NOW. The first six were chosen against the RESTING longitude of
 * 18E, where Mongolia sits out on the far limb and an arc to it spends most of its length
 * behind the planet, fading to nothing in the shader's occlusion test. That reasoning only
 * ever held for a stationary globe: this one drifts continuously and the tour aims at all
 * seven stops in turn, Asia among them, so an Asia arc is fully presented for a large part
 * of every cycle and merely grazing for the rest. Leaving the largest landmass unconnected
 * was the more visible problem.
 *
 * The four additions reach it from four different directions — down from Sweden, up from
 * South Africa, across to Western Australia — rather than all from one side, so the new
 * lines open out across the Indian Ocean and the western Pacific instead of stacking in
 * one quarter. na-au is the one that carries no Asia endpoint: it throws a single line
 * across the Pacific, which is the emptiest part of the disc at the resting angle.
 *
 * Antarctica stays out. At -82 it is below the card's crop at every pitch the framing
 * allows, so an arc to it would be cropped rather than drawn.
 *
 * Phases are spread unevenly across the cycle rather than at even tenths: an even split
 * has every arc firing on a common beat, which reads as a metronome. These share no
 * simple ratio, so the set never resolves into a pattern, and the four new values are
 * interleaved into the gaps the original six left rather than appended after them.
 *
 * onMobile thins the set to five on small viewports, over a globe that has far less room
 * to carry them.
 */
const HERO_ARCS: GlobeArc[] = [
  { id: "na-eu", fromId: "north-america", toId: "europe", phase: 0.0, onMobile: true },
  { id: "eu-as", fromId: "europe", toId: "asia", phase: 0.09 },
  { id: "na-sa", fromId: "north-america", toId: "south-america", phase: 0.17 },
  { id: "na-br", fromId: "north-america", toId: "brazil", phase: 0.23 },
  { id: "eu-af", fromId: "europe", toId: "africa", phase: 0.31, onMobile: true },
  { id: "eu-ca", fromId: "europe", toId: "central-asia", phase: 0.35 },
  { id: "af-as", fromId: "africa", toId: "asia", phase: 0.39 },
  { id: "br-af", fromId: "brazil", toId: "africa", phase: 0.44 },
  { id: "sa-af", fromId: "south-america", toId: "africa", phase: 0.48, onMobile: true },
  { id: "ca-as", fromId: "central-asia", toId: "asia", phase: 0.53 },
  { id: "as-se", fromId: "asia", toId: "southeast-asia", phase: 0.56 },
  { id: "as-au", fromId: "asia", toId: "australia", phase: 0.62, onMobile: true },
  { id: "eu-au", fromId: "europe", toId: "australia", phase: 0.68, onMobile: true },
  { id: "se-au", fromId: "southeast-asia", toId: "australia", phase: 0.76, onMobile: true },
  { id: "af-au", fromId: "africa", toId: "australia", phase: 0.83 },
  { id: "na-au", fromId: "north-america", toId: "australia", phase: 0.91 },
];

const ANCHORS: GlobeAnchor[] = MINING_SITES.map(({ id, lat, lng }) => ({
  id,
  lat,
  lng,
}));

/**
 * How far past the card's bottom corners the planet runs. At exactly 1 the arc is
 * tangent to them; a little over reads better than a tangent, which looks accidental.
 */
const HORIZON_OVERRUN = 1.08;

/**
 * Diameter of the sphere whose arc passes exactly through the bottom two corners of a
 * `width` x `height` slot — the horizon framing, solved rather than dialled in.
 *
 * Half-width of a circle of radius r at depth h below its crown is sqrt(r² - (r - h)²).
 * Setting that to width / 2 and solving for the diameter gives the expression below.
 *
 * Two properties fall out of it that hold at every breakpoint, whatever the copy above
 * wraps to, so neither needs a guard constant:
 *   - diameter > height, always — the planet is cropped by the card's floor, never
 *     small enough to sit whole inside the card with white underneath it.
 *   - diameter >= width, always, since it reduces to (width - 2·height)² >= 0 — the
 *     planet is never narrower than the card, so no white gutters beside the arc.
 */
function horizonDiameter(width: number, height: number) {
  return ((width * width) / (4 * height) + height) * HORIZON_OVERRUN;
}

/**
 * Outer bloom, painted in CSS behind the canvas. The shader's haze is an *inner* glow
 * that stops at the silhouette; this is the part that spills onto the white card, so
 * the limb reads as lit rather than as a cut edge.
 *
 * `closest-side` makes 100% the box's half-width, so GLOBE_FIT is directly the stop
 * where the silhouette sits — the halo tracks the sphere at any size.
 *
 * The band is deliberately tight and bright rather than wide and faint. The card crops
 * at the sphere's crown, so glow living far out at 96–100% of the half-width is cut off
 * across most of the arc and never paid for itself; concentrating the same alpha budget
 * into 89.6–95.5% puts the brightest ring immediately outside the limb, where it clears
 * the crop over far more of the visible curve. Peak sits just *past* the silhouette —
 * an atmosphere reads as a rim of light on the edge, not a wash centred on it.
 */
const SILHOUETTE_STOP = GLOBE_FIT * 100;
/** Where the bloom finally reaches zero, as a percent of the box's half-width. */
const HALO_OUTER_STOP = SILHOUETTE_STOP + 5.5;
const ATMOSPHERE_HALO = [
  "radial-gradient(circle closest-side at 50% 50%,",
  `rgba(255,225,160,0) ${SILHOUETTE_STOP - 6}%,`,
  `rgba(255,210,130,0.12) ${SILHOUETTE_STOP - 2.5}%,`,
  `rgba(255,195,95,0.42) ${SILHOUETTE_STOP - 0.3}%,`,
  `rgba(255,210,120,0.52) ${SILHOUETTE_STOP + 0.7}%,`,
  `rgba(255,225,150,0.28) ${SILHOUETTE_STOP + 1.8}%,`,
  `rgba(255,235,180,0.10) ${SILHOUETTE_STOP + 3.5}%,`,
  `rgba(255,245,210,0) ${HALO_OUTER_STOP}%)`,
].join(" ");

/**
 * How far the bloom reaches past the silhouette, as a fraction of the box's edge.
 *
 * The break in the ring at the crown was never a shape mismatch — the bloom and the
 * canvas share one box, so they cannot drift. It was the crop: boxTop used to seat the
 * crown exactly on the card's top edge, which leaves the ring above it nowhere to
 * render. Dropping the crown by precisely this fraction lands the bloom's outermost
 * pixel flush with that edge instead, so the arc closes with no space wasted.
 *
 * Derived from the gradient's own outer stop rather than dialled in, so retuning the
 * bloom moves the headroom with it and the two cannot fall out of sync.
 */
const HALO_HEADROOM = (HALO_OUTER_STOP / 100 - GLOBE_FIT) / 2;

/** Below this projected opacity a pin is edge-on, and takes no pointer events. */
const MARKER_OPACITY_FLOOR = 0.5;

/**
 * Per-marker pulse timing, consumed by .globe-pin-dot and .globe-pin-ring in globals.css.
 *
 * The old stagger was a single stride — index * 0.42s against one shared 3.2s period —
 * which offsets the markers but does not desynchronise them: every ring still opens on
 * the same 3.2s beat, so the set reads as one metronome heard from several places, and
 * any two markers 3.2s apart in delay pulse in exact lockstep.
 *
 * Giving each its OWN period as well is what breaks that. The periods below are spread
 * across the brief's 2-3s and share no simple ratio, so the set has no common multiple to
 * drift back into phase on — the same trick the WebGL arc nodes use, where the comment on
 * ARC_NODE_PERIOD_MIN explains the reasoning at more length.
 *
 * Indexed modulo length, so the table does not have to be kept the same size as the site
 * list — a marker past the end simply reuses an earlier pairing, and with the periods all
 * mutually irrational-ish even a reused pair does not visibly twin with its partner.
 */
type PinPulseStyle = React.CSSProperties &
  Record<"--pin-period" | "--pin-delay", string>;

const PIN_PULSE: PinPulseStyle[] = [
  { "--pin-period": "2.30s", "--pin-delay": "0s" },
  { "--pin-period": "2.75s", "--pin-delay": "0.53s" },
  { "--pin-period": "2.15s", "--pin-delay": "1.11s" },
  { "--pin-period": "2.90s", "--pin-delay": "0.27s" },
  { "--pin-period": "2.45s", "--pin-delay": "1.64s" },
  { "--pin-period": "2.60s", "--pin-delay": "0.82s" },
  { "--pin-period": "2.05s", "--pin-delay": "1.38s" },
];

/** Shimmering gold sparkles in the sky */
const SKY_GOLD_SPARKLES = [
  { top: "22%", left: "9%", size: 14, delay: "0s", duration: "3.2s" },
  { top: "35%", left: "5%", size: 18, delay: "1.1s", duration: "2.8s" },
  { top: "18%", right: "11%", size: 16, delay: "0.6s", duration: "3.5s" },
  { top: "30%", right: "6%", size: 21, delay: "1.8s", duration: "3.0s" },
  { top: "52%", left: "15%", size: 13, delay: "0.9s", duration: "2.5s" },
  { top: "62%", right: "17%", size: 15, delay: "1.4s", duration: "3.1s" },
  { top: "14%", left: "26%", size: 10, delay: "2.1s", duration: "2.7s" },
  { top: "15%", right: "24%", size: 12, delay: "0.4s", duration: "3.3s" },
];

/**
 * Order the tour visits. One entry per continent, matched to MINING_SITES by id, and
 * the scroll range is split into this many equal stages.
 */
const TOUR = [
  "north-america",
  "south-america",
  "europe",
  "africa",
  "asia",
  "australia",
  "antarctica",
] as const;

/**
 * Headline exit. Three lines leaving one after another as the copy block scrolls away.
 *
 * `start` is where each line begins moving, as a fraction of the copy block's own scroll
 * span; `span` is how much of that span the line takes to finish. The three overlap
 * heavily on purpose — a gap between them would read as three separate events rather
 * than as one headline coming apart.
 *
 * `rise` differs slightly per line so the stack opens up as it goes instead of travelling
 * as a rigid unit. All three sit inside the 80–120px brief.
 */
const HEADLINE_LINES: {
  text: string;
  start: number;
  /**
   * The word inside `text` that carries the gold brushstroke, or absent for no stroke.
   *
   * A word rather than a flag because the stroke has to span it and NOT the period after
   * it. The render splits `text` at the word's last occurrence and prints the three runs
   * adjacent with no whitespace between them, so the DOM still reads the line exactly as
   * written. It used to assume a prefix, which only held while "ignore." was a line of
   * its own; the word now sits at the end of a longer line.
   */
  underlineWord?: string;
}[] = [
    { text: "Make your mining story", start: 0.18 },
    { text: "impossible to ignore.", start: 0.36, underlineWord: "ignore" },
  ];

/**
 * How far a line travels, as a percentage of its own height. Past 100 it is fully behind
 * the mask's top edge; 150 carries it clear with margin, and being a percentage it scales
 * itself across the headline's whole clamp range instead of being right at one width.
 */
const HEADLINE_RISE_PERCENT = -150;
/** Scroll fraction each line takes to complete. Overlaps its neighbours by design. */
const HEADLINE_SPAN = 0.32;
/** Peak blur in px. Past about 3 the type stops reading as type and starts reading as fog. */
const HEADLINE_BLUR = 3;

export type TransitionState =
  | "GLOBE_IDLE"
  | "GLOBE_LOCATION_SELECTED"
  | "GLOBE_ZOOMING_IN"
  | "CLOUDS_IN"
  | "LAND_DESCENT"
  | "TRUCK_OVERHEAD_MOVE"
  | "CAMERA_ANGLE_SHIFT"
  | "SIDE_VIEW_LOCKED"
  | "JOURNEY_ACTIVE";

/** The starting location for the 2D journey: Canada mining region */
const STARTING_SITE_ID = "north-america";
const STARTING_SITE = MINING_SITES.find((s) => s.id === STARTING_SITE_ID)!;

/** Cinematic zoom into Canada mining terrain before touching down on the road */
const MAX_ZOOM = 10.5;

/** Total viewport heights for the entire continuous story */
const TOTAL_SCROLL_VH = 2500;

/** Easing curve for cinematic camera zoom in/out (power3.inOut) */
function easeInOutCubic(x: number): number {
  const t = Math.min(Math.max(x, 0), 1);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
/**
 * How the sampled progress follows the true scroll position.
 *
 * THIS WAS DELIBERATELY LAGGY AND IS NOT ANY MORE. The previous values, 60/20, gave a
 * time constant of 272ms and took 816ms to settle — the note here used to describe that
 * as weight that "reads as deliberate rather than as 1:1 scrubbing". It is the same thing
 * a reader feels as the globe being disconnected from the wheel: it accelerates into a
 * move and coasts out of it a third of a second behind the page.
 *
 * 84/18.3 sits between the two extremes this has been tuned to. zeta = 18.3 / (2 *
 * sqrt(84)) = 0.998 — critical to three decimals, so progress still cannot overshoot the
 * scroll position and the tour cannot run past a stop and come back.
 *
 * The time constant is 109ms. That is the ease: flick the wheel and the globe leans into
 * the move and settles out of it rather than snapping onto the new position, trailing a
 * fast scroll by about 29ms. Move slowly and 29ms is below the threshold of noticing, so
 * it tracks the wheel precisely. The three tunings this has had, for the record:
 *
 *   60/20    tau 272ms, trails 106ms   too slow - reads as disconnected from the page
 *   480/44   tau  50ms, trails   1ms   locked on, but no ease into a fast scroll at all
 *   84/18.3  tau 109ms, trails  29ms   eases under a flick, exact under a slow drag
 *
 * WHY ANY FILTER AT ALL. Lenis already smooths the scroll position with its own lerp, so
 * this is a second filter on an already-smooth signal — which is exactly why it must be
 * fast. It earns its place only by absorbing sub-pixel unevenness and the odd long frame;
 * anything slower is double-smoothing, and double-smoothing is the lag.
 *
 * Stability: explicit Euler with substepping needs h * damping < 2. At 60fps that is
 * 0.0167 * 18.3 = 0.31, and the worst substep the cap allows before RESUME_GAP takes over
 * is 0.0333 * 18.3 = 0.61. Both hold comfortably.
 */
const PROGRESS_SPRING = { stiffness: 84, damping: 18.3 };
/**
 * The zoom's own spring, and the only underdamped one.
 *
 * zeta = 14 / (2 * sqrt(90)) = 0.738, and peak overshoot of a step response is
 * exp(-pi * zeta / sqrt(1 - zeta^2)) = 0.03 — a 3% pass beyond the target scale before it
 * settles. During a hop the target is moving and the spring simply trails it; the
 * overshoot only appears where the target stops changing, which is the arrival at a stop.
 * That is the settle, and it costs nothing at rest because the spring latches exactly.
 *
 * Set damping to 2 * sqrt(stiffness) = 18.97 to remove the bounce and keep the easing.
 */
const ZOOM_SPRING = { stiffness: 90, damping: 14 };
/**
 * A frame gap longer than this means the loop was parked — tab hidden, or the globe
 * scrolled out of view and its render loop suspended. Damping across that gap would
 * play the whole skipped span back as a slide, so progress snaps instead.
 */
const RESUME_GAP = 0.8;
/**
 * Milliseconds without a frame before the scroll listener takes over sampling.
 *
 * 100ms is ~6 frames at 60Hz and ~12 at 120Hz, so a running loop never trips it and a
 * genuinely parked one is picked up within a tenth of a second.
 */
const SAMPLE_IDLE = 100;

interface SpringState {
  value: number;
  velocity: number;
}

/**
 * One semi-implicit Euler step of a damped harmonic oscillator toward `target`.
 *
 * Substepped at 60Hz because the integrator is only conditionally stable: a single 100ms
 * step at this stiffness overshoots hard enough to ring, and a dropped frame would show
 * as a visible kick rather than as a stutter.
 */
function stepSpring(
  spring: SpringState,
  target: number,
  dt: number,
  { stiffness, damping }: { stiffness: number; damping: number },
) {
  const steps = Math.min(6, Math.max(1, Math.ceil(dt * 60)));
  const h = dt / steps;
  for (let i = 0; i < steps; i += 1) {
    const accel = (target - spring.value) * stiffness - spring.velocity * damping;
    spring.velocity += accel * h;
    spring.value += spring.velocity * h;
  }
  // Latch, so a settled globe stops rewriting its transform every frame.
  if (Math.abs(target - spring.value) < 1e-4 && Math.abs(spring.velocity) < 1e-3) {
    spring.value = target;
    spring.velocity = 0;
  }
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

/**
 * Quintic ease-in-out. Zero first AND second derivative at both ends, where cubic
 * smoothstep only zeroes the first — so transitions enter and exit with no acceleration step.
 */
function smootherstep(x: number) {
  const t = Math.min(Math.max(x, 0), 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

interface Metrics {
  /** Edge of the square canvas box. The sphere silhouette fills GLOBE_FIT of it. */
  boxSize: number;
  /** Offset from the top of the globe slot, so the sphere's crown lands on the slot. */
  boxTop: number;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(Math.max(v, lo), hi);
}

export const GlobeHero: React.FC = () => {
  const rangeRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const globeBoxRef = useRef<HTMLDivElement>(null);
  const markerLayerRef = useRef<HTMLDivElement>(null);
  const journeyBoxRef = useRef<HTMLDivElement>(null);
  const markerRefs = useRef(new Map<string, HTMLDivElement | null>());

  const journeyProgress = useCreateJourneyProgress();
  const [journeyActive, setJourneyActive] = useState(false);
  const journeyActiveRef = useRef(false);
  const [emphasisId, setEmphasisId] = useState<string | null>(null);
  const emphasisRef = useRef<string | null>(null);
  const [isCanadaStarting, setIsCanadaStarting] = useState(false);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const lastTransPRef = useRef(0);
  const [transitionState, setTransitionState] = useState<TransitionState>("GLOBE_IDLE");
  const transitionStateRef = useRef<TransitionState>("GLOBE_IDLE");

  /**
   * Card bounds in the globe canvas's coordinate space. Cached on resize rather than
   * measured per frame, so the render loop never forces layout.
   */
  const layoutRef = useRef({
    maxY: Infinity,
    minX: -Infinity,
    maxX: Infinity,
    fadeX: 110,
    fadeY: 130,
  });

  const [metrics, setMetrics] = useState<Metrics>({ boxSize: 0, boxTop: 0 });
  const [ready, setReady] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // --- Headline exit ---------------------------------------------------------------
  /**
   * Three lines leaving one after another, each behind its own overflow-hidden mask.
   *
   * WHY THE MASKS ARE LOAD-BEARING, and why the first attempt at this read as one block:
   * over the span this animation covers, the page itself is already carrying the whole
   * headline upward by the copy block's full height — roughly 625px. A per-line offset of
   * ~110px on top of that is a differential of under a fifth, which the eye reads as the
   * heading simply scrolling. A mask changes the terms entirely: the line has a hard edge
   * to disappear behind, so travelling 150% of its own height makes it *gone* while its
   * neighbours are still sitting there. The stagger becomes an event rather than a
   * gradient.
   *
   * GSAP with ScrollTrigger scrub, because SmoothScroll.tsx already registers the plugin
   * and feeds Lenis into it (`lenis.on("scroll", ScrollTrigger.update)`), so this rides
   * the project's existing scroll pipeline rather than opening a second one. It owns no
   * pin and no snap: it reads scroll position and writes to three spans, nothing else, so
   * the globe's own timeline below is untouched by it.
   */
  const copyRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const copy = copyRef.current;
    const lines = lineRefs.current.filter((el): el is HTMLSpanElement => el !== null);
    if (!copy || lines.length !== HEADLINE_LINES.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: copy,
          // start: the copy block's top edge meets the top of the viewport, which is a
          // little way into the scroll — so the headline holds its designed position for
          // the whole of scroll 0. end: that same block has completely left.
          start: "top top",
          end: "bottom top",
          scrub: 0.35,
        },
        defaults: { ease: "none" },
      });

      HEADLINE_LINES.forEach((line, i) => {
        tl.to(
          lines[i],
          {
            // Percent of the line's OWN height, not pixels: 150% clears the mask at every
            // size the clamp produces, from ~37px on a phone to ~66px at 1440.
            yPercent: HEADLINE_RISE_PERCENT,
            opacity: 0,
            filter: `blur(${HEADLINE_BLUR}px)`,
            duration: HEADLINE_SPAN,
          },
          // Absolute position on a duration-1 timeline == fraction of scroll progress.
          line.start
        );
      });

      // Pins the timeline's total length to exactly 1. Without it GSAP would scale the
      // 0.82 of timeline the tweens actually occupy across the whole scroll range, which
      // stretches every window and leaves the last line finishing only as the block
      // disappears. With it, the positions above ARE the scroll fractions.
      tl.set({}, {}, 1);
    }, copy);

    return () => ctx.revert();
  }, []);

  // --- Scroll-linked zoom ----------------------------------------------------------
  /**
   * Progress across the tall pinned range: 0 as its top reaches the top of the
   * viewport, 1 as its bottom does — exactly the span over which the sticky child
   * stays parked. Measured directly rather than through framer-motion's useScroll,
   * whose ref-based target threw "Target ref is defined but not hydrated" here.
   * Everything derived from it is written straight to the DOM, so scrolling never
   * re-renders the tree.
   */
  const progressRef = useRef(0);
  /**
   * Progress and zoom as sprung values rather than as raw scroll readings. Refs, and
   * mutated in place: these change every frame and must never re-render the tree.
   */
  const progressSpring = useRef<SpringState>({ value: 0, velocity: 0 });
  const zoomSpring = useRef<SpringState>({ value: 1, velocity: 0 });

  /** Aim target handed to the globe; mutated in place, never triggers a render. */
  const focusRef = useRef<GlobeFocus | null>(null);
  /** Where the aim actually landed this frame, reported by the projection. */
  const aimPointRef = useRef<{ x: number; y: number } | null>(null);
  /**
   * Where the aimed coordinate lands, and where it should land, in the canvas box's
   * pixel space. `centre` is the middle of the sphere's projected disc; `visible` is
   * the middle of the slice the card actually shows.
   */
  const geometryRef = useRef({ centre: 0, visibleY: 0, tiltBias: 0 });
  /**
   * The range's document-space top and its travel, cached so progress can be sampled
   * from window.scrollY every frame. Reading scrollY is free; a getBoundingClientRect
   * in the render loop would force layout on every frame instead.
   */
  const rangeMetricsRef = useRef({ top: 0, travel: 0 });
  const lastSampleRef = useRef(0);
  const reduceMotionRef = useRef(false);
  /** Index of the stop being visited, for the label highlight. Read every frame. */
  const stageIndexRef = useRef(0);
  const engagedRef = useRef(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Reused across frames so collision resolution allocates nothing per tick.

  useEffect(() => {
    const card = cardRef.current;
    const slot = slotRef.current;
    if (!card || !slot) return;

    const measure = () => {
      const c = card.getBoundingClientRect();
      const s = slot.getBoundingClientRect();
      if (!c.height || !s.width || !s.height) return;

      // The slot is a normal flow child sitting directly under the subtitle and
      // stretching to the card's bottom edge, so its box already *is* the frame the
      // planet has to fill. Nothing here decides where the globe starts — the flow
      // does, which is why no gap can open up between the copy and the sphere.
      const sphereSize = horizonDiameter(s.width, s.height);

      const boxSize = sphereSize / GLOBE_FIT;
      // GLOBE_FIT leaves haze room around the silhouette; lift the box by that margin so
      // the sphere's crown, not the transparent canvas edge, sits on the slot's top.
      // Everything below the card's floor is cropped by its overflow-hidden.
      //
      // Then give the bloom its headroom back: seating the crown *exactly* on the top
      // edge clipped the ring above it, which is the break in the arc at top-centre.
      // This drops the crown by the bloom's own reach, so its outermost pixel lands on
      // the edge and the curve runs unbroken from limb to limb.
      const boxTop = -(boxSize - sphereSize) / 2 + boxSize * HALO_HEADROOM;

      // Aiming puts a coordinate at the centre of the projected disc, which in a horizon
      // framing is far below the card's floor. tiltBias is the extra pitch that lifts it
      // to the middle of the visible slice instead:
      //   the disc's centre sits sphereSize/2 below its crown, the visible middle sits
      //   slotHeight/2 below it, so the gap to close is (sphereSize - slotHeight)/2,
      //   which as a fraction of the radius is 1 - slotHeight/sphereSize.
      geometryRef.current = {
        centre: boxSize / 2,
        visibleY: -boxTop + s.height / 2,
        tiltBias: Math.asin(clamp(1 - s.height / sphereSize, 0, 0.995)),
      };
      setMetrics((prev) => {
        if (
          Math.abs(prev.boxSize - boxSize) < 2 &&
          Math.abs(prev.boxTop - boxTop) < 2
        ) {
          return prev;
        }
        return { boxSize, boxTop };
      });
      // Markers are reported in the canvas box's space, so the card bounds that clip
      // them have to be restated in it.
      const boxTopInCard = s.top - c.top + boxTop;
      const boxLeft = s.left - c.left + (s.width - boxSize) / 2;

      layoutRef.current = {
        maxY: c.height - boxTopInCard,
        minX: -boxLeft,
        maxX: c.width - boxLeft,
        // Scaled to the card: a fixed band would keep a marker faded for most of its
        // pass across a narrow phone container.
        fadeX: Math.min(80, c.width * 0.12),
        fadeY: Math.min(60, c.height * 0.08),
      };
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(card);
    observer.observe(slot);
    return () => observer.disconnect();
  }, []);

  /**
   * Writes the tour state for the current scroll progress: where the globe is aimed,
   * how far it is zoomed, and how the markers should read.
   *
   * Only `transform` and `opacity` are touched here — nothing that can trigger layout.
   * The globe is aimed by rotating the sphere itself rather than by panning the element,
   * which is what lets a stop like Antarctica be reached at all: it never enters the
   * visible crop under free rotation, so no CSS transform could have found it.
   */
  const applyStage = useCallback(() => {
    const box = globeBoxRef.current;
    const journeyBox = journeyBoxRef.current;
    const layer = markerLayerRef.current;
    if (!box || reduceMotionRef.current) return;

    // --- Sample and damp scroll progress ---------------------------------------------
    const { top, travel } = rangeMetricsRef.current;
    const target = travel > 0 ? clamp((window.scrollY - top) / travel, 0, 1) : 0;

    const now = performance.now();
    const gap = (now - lastSampleRef.current) / 1000;
    lastSampleRef.current = now;

    const progress = progressSpring.current;
    if (gap > RESUME_GAP) {
      progress.value = target;
      progress.velocity = 0;
    } else if (gap > 0) {
      stepSpring(progress, target, gap, PROGRESS_SPRING);
    }
    const t = clamp(progress.value, 0, 1);
    progressRef.current = t;

    // --- Master Progress & Phase Partitioning ---------------------------------------
    // Total pinned scroll is partitioned into:
    // 1. TRANSITION (0.00 -> 0.40):
    //    Globe -> Canada emphasis -> 3D camera zoom -> Clouds fill screen -> Clouds part -> Highway & land reveal -> Truck roof -> Truck drive in top-down view -> 3D Camera rotates to side profile -> Lock side view
    // 2. JOURNEY (0.40 -> 1.00):
    //    Side view locked, truck drives rightward through the story chapters
    const TRANSITION_SPAN = 0.52;
    const transP = t <= TRANSITION_SPAN ? clamp(t / TRANSITION_SPAN, 0, 1) : 1.0;

    /*
     * The truck is already rolling before the camera finishes settling.
     *
     * The brief wants it moving while the camera is still coming round, and
     * the wrong way to get that is a second driver nudging the truck during
     * the transition — two things writing the truck's position is how the
     * handover develops a seam. Instead the journey's own progress simply
     * starts a little earlier than the transition ends, so it is one ramp
     * throughout: still monotone, still continuous, and at the moment the
     * camera locks nothing changes hands because nothing else was ever
     * driving it.
     *
     * Kept small. This much of the journey plays out under a camera that is
     * still tilted, so anything longer would spend the opening chapter's copy
     * while it is not yet readable.
     *
     * Sized against descentCamera.ts rather than picked: the brief has the
     * truck rolling at 0.86 of the transition, the descent's HOLD runs
     * 0.84–0.89, and 0.0728 of the total puts the first turn of the wheels at
     * exactly 0.86 — inside the hold, so the camera is still overhead and
     * still when the truck sets off, and moving under its own power before the
     * orbit begins at 0.89.
     */
    const JOURNEY_PREROLL = 0.0728;
    const journeyFrom = TRANSITION_SPAN - JOURNEY_PREROLL;
    const journeyP = clamp((t - journeyFrom) / (1.0 - journeyFrom), 0, 1);

    journeyProgress.current = journeyP;

    // Throttle state update to keep React rendering lightweight
    if (
      Math.abs(transP - lastTransPRef.current) > 0.002 ||
      transP === 0 ||
      transP === 1 ||
      (transP >= 0.89 && lastTransPRef.current < 0.89)
    ) {
      lastTransPRef.current = transP;
      setTransitionProgress(transP);
    }

    // Explicit Transition State
    let nextState: TransitionState = "GLOBE_IDLE";
    // Boundaries follow descentCamera.ts and AtmosphericCloudLayer.tsx; if
    // those phases move, these are the labels that go stale with them.
    if (transP < 0.08) nextState = "GLOBE_IDLE";
    else if (transP < 0.16) nextState = "GLOBE_LOCATION_SELECTED";
    else if (transP < 0.26) nextState = "GLOBE_ZOOMING_IN";
    else if (transP < 0.44) nextState = "CLOUDS_IN";
    else if (transP < 0.66) nextState = "LAND_DESCENT";
    else if (transP < 0.89) nextState = "TRUCK_OVERHEAD_MOVE";
    else if (transP < 0.99) nextState = "CAMERA_ANGLE_SHIFT";
    else if (t <= TRANSITION_SPAN) nextState = "SIDE_VIEW_LOCKED";
    else nextState = "JOURNEY_ACTIVE";

    if (nextState !== transitionStateRef.current) {
      transitionStateRef.current = nextState;
      setTransitionState(nextState);
    }

    /*
     * The Journey's frame loop has to be running before the Journey can be
     * seen, not when it takes over.
     *
     * Its road, lamps and truck are all drawn from that loop, so starting it
     * at the handover would mean the clouds part over an empty stage and the
     * scene pops in a few frames later. It starts while the cloud deck is
     * still solid, which costs a few hidden frames and is the difference
     * between revealing something that is already there and switching it on.
     */
    const shouldJourneyBeActive = transP >= JOURNEY_RUNS_FROM;
    if (shouldJourneyBeActive !== journeyActiveRef.current) {
      journeyActiveRef.current = shouldJourneyBeActive;
      setJourneyActive(shouldJourneyBeActive);
    }

    // Toggle starting point emphasis tag on Canada
    const canadaStartingActive = transP >= 0.04 && transP < 0.30;
    setIsCanadaStarting(canadaStartingActive);

    const nextEmphasis = canadaStartingActive ? STARTING_SITE_ID : null;
    if (nextEmphasis !== emphasisRef.current) {
      emphasisRef.current = nextEmphasis;
      setEmphasisId(nextEmphasis);
    }

    // --- 1. Camera Aim & Focus (True 3D Perspective Zoom in EarthGlobe) -------------
    const { centre, visibleY, tiltBias } = geometryRef.current;
    if (transP < 0.04) {
      focusRef.current = null;
      engagedRef.current = false;
    } else {
      const engageWeight = smoothstep(0.04, 0.16, transP);
      // As zoom deepens, camera.position.z in EarthGlobe travels from ~6.4 down to 1.30
      const zoomP = smoothstep(0.10, 0.32, transP);
      const cameraDist = 6.4 - (6.4 - 1.30) * easeInOutCubic(zoomP);

      focusRef.current = {
        lat: STARTING_SITE.lat,
        lng: STARTING_SITE.lng,
        tiltBias,
        distance: cameraDist,
        weight: engageWeight,
      };
      engagedRef.current = true;
    }

    // --- 2. Globe CSS Scale and Centering -------------------------------------------
    let scale = 1.0;
    if (transP >= 0.10 && transP < 0.34) {
      const zp = (transP - 0.10) / (0.34 - 0.10);
      scale = 1.0 + (MAX_ZOOM - 1.0) * easeInOutCubic(zp);
    } else if (transP >= 0.34) {
      scale = MAX_ZOOM;
    } else {
      scale = 1.0;
    }

    const aim = aimPointRef.current;
    const px = aim ? aim.x : centre;
    const py = aim ? aim.y : visibleY;
    const engage = smoothstep(0.04, 0.16, transP);
    const dx = (px - centre) * (1 - scale);
    const dy = (py - centre) * (1 - scale) + (visibleY - py) * engage;

    if (!engagedRef.current && transP >= 0.04) {
      box.style.transitionProperty = "none";
      engagedRef.current = true;
    }

    // Globe Opacity: fades out cleanly while fully enclosed in dense clouds
    let globeOpacity = 1.0;
    if (transP >= 0.34 && transP < 0.44) {
      globeOpacity = 1.0 - smoothstep(0.34, 0.44, transP);
    } else if (transP >= 0.44) {
      globeOpacity = 0.0;
    } else {
      globeOpacity = 1.0;
    }

    box.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
    box.style.opacity = globeOpacity.toFixed(3);
    box.style.visibility = globeOpacity <= 0.005 ? "hidden" : "visible";

    // Marker Layer Opacity & Unzoom
    if (layer) {
      layer.style.setProperty("--unzoom", (1 / Math.max(scale, 1)).toFixed(4));
      let markerLayerOpacity = 1.0;
      if (transP >= 0.20 && transP < 0.32) {
        markerLayerOpacity = 1.0 - smoothstep(0.20, 0.32, transP);
      } else if (transP >= 0.32) {
        markerLayerOpacity = 0.0;
      } else {
        markerLayerOpacity = 1.0;
      }
      layer.style.opacity = markerLayerOpacity.toFixed(3);
      layer.style.visibility = markerLayerOpacity <= 0.005 ? "hidden" : "visible";
    }

    // --- 3. The descent camera, flown over the real Journey ---------------------------
    /*
     * One camera over one environment. Everything the descent shows — land,
     * road, markings, truck — is the Journey itself, seen from wherever the
     * camera currently is, so there is nothing to crossfade into and no second
     * truck to crossfade from.
     *
     * The truck is revealed purely by the camera closing distance: pitch is
     * held at the overhead angle through the entire reveal and only turns
     * afterwards. See descentCamera.ts, where that ordering is enforced and
     * checked.
     */
    if (journeyBox) {
      const camera = deriveDescentCamera(transP);
      /*
       * The truck needs to know the camera angle, because which of its faces
       * is toward camera depends on it. It travels in the same box as
       * progress and is read on the Journey's own frame, so the truck and the
       * stage transform are always describing the same camera on the same
       * frame rather than one lagging the other.
       */
      journeyProgress.pitch = camera.pitch;
      journeyBox.style.opacity = camera.opacity.toFixed(3);
      journeyBox.style.visibility = camera.opacity <= 0.005 ? "hidden" : "visible";
      // Only once the camera has settled into the Journey's own composition;
      // a tilted, half-descended stage should not be catching clicks.
      journeyBox.style.pointerEvents = camera.locked ? "auto" : "none";
    }
  }, [journeyProgress]);

  useEffect(() => {
    const range = rangeRef.current;
    if (!range) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    reduceMotionRef.current = reduced;
    // The tour is the only reason the range is taller than one viewport. With it off
    // there is nothing to scroll through, so collapse the range rather than leave
    // several screens of dead scroll over a frozen globe.
    setReduceMotion(reduced);
    if (reduced) return;

    // The one layout read, kept out of the render loop: where the range sits in the
    // document and how far the sticky child stays pinned. Both only change on resize.
    const measureRange = () => {
      const rect = range.getBoundingClientRect();
      rangeMetricsRef.current = {
        top: rect.top + window.scrollY,
        travel: rect.height - window.innerHeight,
      };
    };

    measureRange();
    applyStage();

    const observer = new ResizeObserver(() => {
      measureRange();
      applyStage();
    });
    observer.observe(range);

    /*
     * Fallback only, and the guard is what makes that true.
     *
     * The globe's render loop samples progress every frame. This listener exists for the
     * case where that loop is suspended — tab hidden, or the canvas scrolled out of view
     * — so the hero is correct the moment it comes back. Without the guard it also fired
     * on every scroll event WHILE the loop was running, so the spring was integrated
     * twice per frame with two different dt values, one of them near zero. That is not a
     * smoothing filter any more; it is a filter being stepped at an irregular rate, which
     * is precisely the stutter it was meant to remove.
     *
     * SAMPLE_IDLE is comfortably longer than a frame at any refresh rate this runs at, so
     * while the loop is alive this does nothing at all.
     */
    const onScroll = () => {
      if (performance.now() - lastSampleRef.current < SAMPLE_IDLE) return;
      applyStage();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measureRange);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measureRange);
    };
  }, [applyStage]);

  const handleProject = useCallback((projected: ProjectedAnchor[]) => {
    const { maxY, minX, maxX, fadeX, fadeY } = layoutRef.current;

    // The aim point drifts while the globe swings onto a new stop, so the zoom has to be
    // re-pinned every frame, not only when the scroll position changes.
    const aim = projected.find((a) => a.id === FOCUS_ANCHOR_ID);
    if (aim) aimPointRef.current = { x: aim.x, y: aim.y };

    for (const anchor of projected) {
      const el = markerRefs.current.get(anchor.id);
      if (!el) continue;

      // Fade before the container edge clips the marker, not after.
      const bottomFade = clamp((maxY - anchor.y) / fadeY, 0, 1);
      const leftFade = clamp((anchor.x - minX) / fadeX, 0, 1);
      const rightFade = clamp((maxX - anchor.x) / fadeX, 0, 1);
      const opacity = anchor.opacity * bottomFade * leftFade * rightFade;

      const style = el.style;
      if (opacity <= 0.01) {
        if (style.visibility !== "hidden") style.visibility = "hidden";
        continue;
      }
      if (style.visibility === "hidden") style.visibility = "";

      style.setProperty("--mx", `${anchor.x.toFixed(1)}px`);
      style.setProperty("--my", `${anchor.y.toFixed(1)}px`);
      style.opacity = opacity.toFixed(3);
      style.pointerEvents = opacity >= MARKER_OPACITY_FLOOR ? "auto" : "none";
    }
  }, []);

  const handleReady = useCallback(() => setReady(true), []);

  // Two blocks, and the split is the whole point of the sequence.
  //
  // The copy is an ordinary flow child: it simply scrolls off the top, no pinning, no
  // scroll-linked anything. Underneath it the globe range supplies STAGE_COUNT viewports
  // of travel and pins its own child for all of it.
  //
  // Because the range starts where the copy ends, the range's top edge reaching the top
  // of the viewport is the same instant the copy finishes leaving — and that instant is
  // progress 0, so the tour starts itself with no coordination between the two.
  //
  // Nothing carries hero-rise any more: its fadeInUp holds transform: translateY(0)
  // under fill-mode both, and a lingering transform on a sticky element's ancestor
  // creates a containing block for it. The heading, subtitle and globe each keep their
  // own entrance, so the effect survives without the wrapper's.
  return (
    <section className="relative isolate w-full bg-[#FAF7F2]">
      {/* Single Unified Light Sky & Soft Clouds Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none sticky top-0 -mb-[100vh] h-screen w-full -z-10 overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-cover bg-bottom bg-no-repeat"
          style={{
            backgroundImage: "url('/images/hero-light-sky.jpg')",
          }}
        />
        {/* Soft, natural light sun glow over the right horizon (toned down from yellow) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-5%] sm:right-[5%] lg:right-[10%] bottom-[15%] sm:bottom-[22%] w-[450px] sm:w-[650px] h-[450px] sm:h-[650px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(255,250,230,0.30) 0%, rgba(255,245,215,0.14) 35%, rgba(255,245,225,0.04) 60%, transparent 75%)",
            filter: "blur(30px)",
          }}
        />
        {/* Subtle, soft ambient light wash */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(130% 80% at 50% 100%, rgba(255,250,240,0.18) 0%, rgba(250,247,242,0) 70%)",
          }}
        />

        {/* Floating delicate gold sparkle stars */}
        <svg className="absolute inset-0 w-0 h-0 pointer-events-none" aria-hidden="true">
          <defs>
            <radialGradient id="goldSparkleGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="30%" stopColor="#FFF2B0" stopOpacity="0.95" />
              <stop offset="65%" stopColor="#FFC837" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#B8860B" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
        {SKY_GOLD_SPARKLES.map((s, i) => (
          <div
            key={i}
            aria-hidden="true"
            className="pointer-events-none absolute animate-pulse"
            style={{
              top: s.top,
              left: s.left,
              right: s.right,
              width: s.size,
              height: s.size,
              animationDelay: s.delay,
              animationDuration: s.duration,
              filter: "drop-shadow(0 0 5px rgba(255,200,50,0.85))",
            }}
          >
            <svg viewBox="0 0 24 24" className="w-full h-full">
              <path
                d="M12 0 C12 7 17 12 24 12 C17 12 12 17 12 24 C12 17 7 12 0 12 C7 12 12 7 12 0 Z"
                fill="url(#goldSparkleGrad)"
              />
            </svg>
          </div>
        ))}
      </div>

      {/* Copy — normal flow, scrolls away before anything pins. */}
      <div
        ref={copyRef}
        /*
          TOP PADDING IS THE ONLY THING HOLDING THE HEADLINE OFF THE NAVBAR.
          The header is position:fixed, so it occupies no layout space — the hero starts at
          y=0 underneath it and the bar overlays the first 68px (72px from sm up, where the
          logo goes h-11 -> h-12). Every pixel of clearance has to come from here.

          The floors are what changed most. They were 44/48/52px, all of them SHORTER than
          the navbar, so on a short laptop the clamp bottomed out and the headline sat 20px
          BEHIND the bar rather than merely close to it. Each floor now clears the navbar
          plus a working margin, so the two can never overlap at any viewport.

              1440x900   gap 16px -> 77px
              1280x800   gap -20px -> 41px
              1280x768   gap -20px -> 33px
              1440x1080  gap 52px -> 105px

          BELOW sm THE HEADLINE RUNS ON ITS OWN CLAMP. At the desktop scale's 40px floor
          the three written lines do not fit a phone's measure — "story impossible to" is
          about 12.4em of uppercase Playfair, which needs 272px at 320 wide and has 272px
          to live in only up to ~21px. So each line wrapped in two and the headline became
          five rows, which pushed the globe down to 30px of visible planet on a 320x568
          screen. 6.5vw between 1.3rem and 2.5rem keeps all three lines unwrapped from 320
          up, and hands the globe back 126px there and 117px at 375. The sm: clamp is the
          old one unchanged, and 6.5vw reaches 2.5rem just as sm takes over, so the two
          meet at 40px with no step.

          THE BOTTOM PADDING IS NOT SLACK. The globe range that follows is pulled up over
          this block by -mt-5, and lg:-mt-6, and the sticky card inside it is opaque
          and paints later in the tree — so it covers whatever it reaches.
          The clearance under the buttons is therefore pb MINUS that negative margin, and
          at pb-5 against lg:-mt-6 it was -4px: the card sat over the bottom 4px of the
          CTAs. pb-8 puts it back to +8px on lg and +12px elsewhere. Any future trim to pb
          has to stay above 24px or the buttons start being clipped again.

          THE OTHER CONSTRAINT IS THE GLOBE, and it is what sets these numbers rather
          than taste. Its position is pt + the copy block's height, so re-adding the
          eyebrow would have pushed the planet down by exactly what the eyebrow costs:
          11px of line plus its 16px gap to the headline, 27px from sm up. That is paid
          back precisely — 15px off the padding here, and 4px each off the headline's gap
          to the description, the description's gap to the buttons, and the block's own
          bottom padding. The sum is zero: the globe shows the same 388px at 1440x900 and
          the same 328px at 1280x768 as it did before the line came back.

          So these three values are not free. Changing one without moving the eyebrow's own
          spacing takes the difference straight out of the planet.
        */
        className="flex flex-col items-center px-6 pb-8 pt-[74px] text-center sm:px-10 sm:pt-[clamp(89px,calc(34vh-163px),149px)] lg:pt-[clamp(97px,calc(36vh-183px),169px)]"
      >
        {/*
          Eyebrow, headline, support, CTAs. The wrapper above is untouched - same padding,
          same centred column, same position in the tree - so only the message, its type
          scale and the button row are new. Entrances stay on the existing .hero-rise
          class, which is plain CSS keyframes with a reduced-motion opt-out; nothing here
          adds a scroll listener, and nothing here holds a transform that could become a
          containing block for the sticky globe frame below.
        */}
        <p className="hero-rise [animation-delay:60ms] font-mono text-[10px] font-semibold uppercase leading-none tracking-[0.2em] text-[#B8860B] sm:text-[11px] sm:tracking-[0.22em]">
          Mining Media <span aria-hidden="true">&times;</span> Marketing{" "}
          <span aria-hidden="true">&times;</span> Investor Reach
        </p>

        {/*
          Display caps at 700. The words are written sentence-case in the markup and
          uppercased in CSS, so the reading order a screen reader gets stays natural and
          the caps are a single class to drop if the editorial voice wins out later.
        */}
        {/*
          Still one h1, with the same classes, clamp, measure and three lines — the only
          change is that the breaks are explicit spans rather than natural wrapping, since
          a line cannot be animated on its own while it is just a run of text inside a
          paragraph box. Reading order is unchanged: a screen reader still gets one
          continuous sentence.
        */}
        <h1 className="hero-rise [animation-delay:160ms] mt-2 max-w-[1040px] font-geist text-[clamp(1.2rem,6vw,2.5rem)] font-bold uppercase leading-[0.92] sm:text-[clamp(2.5rem,5vw,4.5rem)] tracking-[-0.02em] text-[#0B1F3A] sm:mt-2">
          {HEADLINE_LINES.map((line, index) => {
            // Where the underlined word starts, so the line can be printed as three runs.
            const at = line.underlineWord
              ? line.text.lastIndexOf(line.underlineWord)
              : -1;

            return (
              /*
                The mask. overflow-hidden is what turns a slow drift into a line leaving:
                the span slides up behind this edge and is simply gone, while the lines
                under it have not started.
  
                pb/-mb cancel each other, so the box is taller than the glyphs by a hair
                without moving anything: the line box at leading-[0.96] is shorter than the
                type it holds, and without that slack the mask would shave the tops of the
                caps at rest.
              */
              <span
                key={line.text}
                className={
                  line.underlineWord
                    ? /*
                      The underlined line needs the SAME trick with more room: the stroke
                      hangs below the line box and this span's overflow-hidden would cut
                      it off at 0.08em. 0.2em clears the 8.1px the stroke needs (1.5px gap
                      + 6.6px of ink) at the clamp's 48px floor, where the em is smallest.
                      pb and -mb still cancel, so the h1's height is byte-for-byte what it
                      was and the paragraph below does not move; the stroke simply paints
                      into the 24px gap that was already there, keeping ~16px of daylight.
                    */
                    "block overflow-hidden pb-[0.45em] -mb-[0.45em] sm:pb-[0.26em] sm:-mb-[0.26em]"
                    : "block overflow-hidden pb-[0.08em] -mb-[0.08em]"
                }
              >
                <span
                  ref={(el) => {
                    lineRefs.current[index] = el;
                  }}
                  className="block will-change-[transform,opacity,filter]"
                >
                  {line.underlineWord && at >= 0 ? (
                    <>
                      {line.text.slice(0, at)}
                      {/*
                      Wraps the word alone, so the stroke's 100% width is the word's width
                      and not the line's. inline-block for the containing block only — no
                      z-index, so no stacking context is created and the stroke paints in
                      the headline's own order: over the starfield behind it, under the
                      globe, pins and arcs that come later in the tree.
                    */}
                      <span className="relative inline-block">
                        {line.underlineWord}
                        <HeadlineUnderline />
                      </span>
                      {line.text.slice(at + line.underlineWord.length)}
                    </>
                  ) : (
                    line.text
                  )}
                </span>
              </span>
            );
          })}
        </h1>

        <p className="hero-rise [animation-delay:260ms] mt-4 max-w-[740px] font-geist text-[clamp(0.95rem,1.2vw,1.125rem)] font-normal leading-[1.55] tracking-[-0.005em] text-[#4A5568] sm:mt-4">
          Mining Discovery combines industry media, digital marketing and investor-focused
          communication to put mining companies in front of the audiences that matter.
        </p>

        {/*
          CTA row. Full-width stacked on phones, side by side from 640px. Gold solid for
          the commercial action, hairline outline for the browse - dark navy on white.
        */}
        <div className="hero-rise [animation-delay:360ms] mt-5 flex w-full flex-col items-stretch gap-3 sm:mt-5 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
          <Link
            href="/contact"
            className="group inline-flex items-center justify-center gap-2 rounded-lg bg-[#A87E2C] px-7 py-3.5 font-sans text-[13px] font-semibold uppercase tracking-[0.08em] text-white shadow-sm transition-colors duration-200 hover:bg-[#8F6B24] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A87E2C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF7F2]"
          >
            Start a Campaign
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>

          <Link
            href="/services"
            className="group inline-flex items-center justify-center gap-2 rounded-lg border border-[#0B1F3A]/20 bg-white/40 backdrop-blur-xs px-7 py-3.5 font-sans text-[13px] font-semibold uppercase tracking-[0.08em] text-[#0B1F3A] transition-colors duration-200 hover:border-[#0B1F3A]/50 hover:bg-white/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B1F3A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF7F2]"
          >
            Explore Our Services
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* Globe range — its top edge is where the tour begins. */}
      <div
        ref={rangeRef}
        className="relative -mt-5 lg:-mt-6"
        // TOTAL_SCROLL_VH of travel for the continuous story.
        style={{ height: reduceMotion ? "100vh" : `${TOTAL_SCROLL_VH}vh` }}
      >
        {/*
          The pinned frame. It is also what the markers are clipped to, so cardRef lives
          here rather than on the section: the visible frame is now one viewport, not the
          whole band, and clipping against the band would never hide anything.
          overflow-hidden crops the planet, and it is safe on this element — only an
          overflow ancestor would break the stickiness, never the sticky element itself.
        */}
        <div
          ref={cardRef}
          className="sticky top-0 h-screen w-full overflow-hidden bg-transparent"
        >
          {/*
            The viewport slot is now the single continuous canvas hosting both the
            3D Globe experience and the 2D Sideways Truck Journey.
          */}
          <div ref={slotRef} className="relative h-full w-full">

            {/* Layer 2 + 3 — 3D globe, clouds and atmosphere */}
            <div
              ref={globeBoxRef}
              className={`
                absolute left-1/2 z-10 -translate-x-1/2 will-change-transform
                transition-[opacity,scale] duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)]
                motion-reduce:transition-none
                ${ready ? "opacity-100 scale-100" : "opacity-0 scale-[0.94] motion-reduce:scale-100"}
              `}
              style={{
                width: metrics.boxSize || undefined,
                height: metrics.boxSize || undefined,
                top: metrics.boxSize ? metrics.boxTop : undefined,
              }}
            >
              {/* Atmosphere bloom */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{ background: ATMOSPHERE_HALO }}
              />

              {metrics.boxSize > 0 && (
                <EarthGlobe
                  style={{ position: "relative" }}
                  className="h-full w-full"
                  anchors={ANCHORS}
                  arcs={HERO_ARCS}
                  onProject={handleProject}
                  onBeforeRender={applyStage}
                  onReady={handleReady}
                  focusRef={focusRef}
                  emphasisId={emphasisId}
                  speedScale={activeId ? 0.25 : 1}
                />
              )}

              {/* Layer 4 — mining markers in globe canvas box space */}
              <div
                ref={markerLayerRef}
                className={`
                  pointer-events-none absolute inset-0 z-10
                  transition-opacity duration-700 delay-500
                  ${ready ? "opacity-100" : "opacity-0"}
                `}
              >
                {MINING_SITES.map((site, index) => {
                  const isCanada = site.id === STARTING_SITE_ID;
                  const isCanadaStartingPoint = isCanada && isCanadaStarting;

                  const isActive = activeId === site.id || isCanadaStartingPoint;
                  const pulse = PIN_PULSE[index % PIN_PULSE.length];

                  return (
                    <div
                      key={site.id}
                      ref={(el) => {
                        markerRefs.current.set(site.id, el);
                      }}
                      style={{
                        transform:
                          "translate3d(var(--mx, -9999px), var(--my, -9999px), 0) scale(var(--unzoom, 1))",
                      }}
                      className="absolute left-0 top-0"
                    >
                      {/* Starting point indicator for Canada */}
                      {isCanadaStartingPoint && (
                        <div className="pointer-events-none absolute -top-14 left-1/2 -translate-x-1/2 flex flex-col items-center whitespace-nowrap z-30 transition-all duration-300">
                          <div className="flex items-center gap-1.5 rounded-md bg-[#0B1F3A]/95 border border-[#B8860B]/70 px-2.5 py-1 shadow-[0_0_16px_rgba(184,134,11,0.5)] backdrop-blur-xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#FFD700] animate-pulse" />
                            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-[#FFD700]">
                              Starting Point
                            </span>
                          </div>
                          <span className="mt-1 rounded bg-[#0B1F3A]/90 border border-white/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-white shadow-xs">
                            {site.country} · Mining Region
                          </span>
                          <div className="h-2 w-[1.5px] bg-gradient-to-b from-[#B8860B] to-transparent" />
                        </div>
                      )}

                      {/* Standard Location Label */}
                      {!isCanadaStartingPoint && (
                        <span
                          className={`pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider shadow-xs backdrop-blur-xs transition-all duration-300 ${
                            isActive
                              ? "bg-[#0B1F3A] text-[#FFD700] border border-[#B8860B]/60 shadow-[0_0_8px_rgba(184,134,11,0.3)] opacity-100 scale-105"
                              : "bg-[#0B1F3A]/80 text-[#FAF7F2] border border-white/10 opacity-90"
                          }`}
                        >
                          {site.country}
                        </span>
                      )}

                      {/* Pin — 44px hit target centred on geographic coordinates */}
                      <button
                        type="button"
                        aria-label={`${site.region}, ${site.country}. ${site.detail}.`}
                        className="absolute left-0 top-0 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8860B] focus-visible:ring-offset-2"
                        onPointerEnter={() => setActiveId(site.id)}
                        onPointerLeave={() => setActiveId((id) => (id === site.id ? null : id))}
                        onFocus={() => setActiveId(site.id)}
                        onBlur={() => setActiveId((id) => (id === site.id ? null : id))}
                        onClick={() => setActiveId((id) => (id === site.id ? null : site.id))}
                      >
                        <span
                          className="globe-pin-ring"
                          style={pulse}
                          aria-hidden="true"
                        />
                        <span
                          className={`globe-pin-dot ${isActive ? "globe-pin-dot--active" : ""}`}
                          style={pulse}
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/*
              Layer 5 — The one environment, with the one truck in it.

              This is the real Journey, and it is the *only* thing the descent
              reveals. It used to sit above a separate `CameraDescentStage`
              that drew its own terrain, highway and hand-drawn SVG truck, and
              the two crossfaded into each other between 0.92 and 0.97 — which
              is where the second truck came from. There was no illusion to
              fix: both were on screen together. That stage is gone, and what
              the camera now flies down to is this.

              It is mounted under the cloud deck rather than over it, and made
              opaque while the deck is still solid, so the land is already
              there to be uncovered. Nothing about the Journey itself changes:
              the camera rig is a transform on its container, so its own
              layout, scroll and composition are untouched, and at the moment
              the rotation completes the transform is exact identity.
            */}
            {/*
              The ground the descent happens over, behind the Journey and in
              front of nothing else. A plane raked to 78 degrees covers a band
              across the frame rather than the frame, so without this the
              Journey read as a lit rectangle floating in the globe section the
              moment the clouds thinned. It draws no terrain, no road and no
              vehicle — see DescentBackdrop.tsx.
            */}
            <DescentBackdrop progress={transitionProgress} />

            <div
              className="pointer-events-none absolute inset-0 z-24 h-full w-full"
            >
              <div
                ref={journeyBoxRef}
                className="h-full w-full"
                style={{
                  opacity: 0,
                }}
              >
                <Journey3D progress={journeyProgress} active={journeyActive} />
              </div>
            </div>

            {/* Layer 6 — Atmospheric cloud deck, above the land it is hiding. */}
            <AtmosphericCloudLayer progress={transitionProgress} />

          </div>
        </div>
      </div>
    </section>
  );
};

export default GlobeHero;
