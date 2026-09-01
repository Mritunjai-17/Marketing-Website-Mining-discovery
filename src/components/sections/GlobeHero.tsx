"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HeroStarfield } from "@/components/sections/hero-layers/HeroStarfield";
import { FOCUS_ANCHOR_ID, GLOBE_FIT } from "@/components/ui/globe/EarthGlobe";
import type {
  GlobeAnchor,
  GlobeArc,
  GlobeFocus,
  ProjectedAnchor,
} from "@/components/ui/globe/EarthGlobe";

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
  { id: "eu-af", fromId: "europe", toId: "africa", phase: 0.31, onMobile: true },
  { id: "af-as", fromId: "africa", toId: "asia", phase: 0.39 },
  { id: "sa-af", fromId: "south-america", toId: "africa", phase: 0.48, onMobile: true },
  { id: "as-au", fromId: "asia", toId: "australia", phase: 0.58, onMobile: true },
  { id: "eu-au", fromId: "europe", toId: "australia", phase: 0.66, onMobile: true },
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
  `rgba(143,179,217,0) ${SILHOUETTE_STOP - 8}%,`,
  `rgba(150,187,224,0.07) ${SILHOUETTE_STOP - 3.5}%,`,
  `rgba(163,199,233,0.26) ${SILHOUETTE_STOP - 0.4}%,`,
  `rgba(178,210,240,0.34) ${SILHOUETTE_STOP + 0.7}%,`,
  `rgba(163,199,233,0.20) ${SILHOUETTE_STOP + 1.8}%,`,
  `rgba(150,187,224,0.08) ${SILHOUETTE_STOP + 3.4}%,`,
  `rgba(143,179,217,0) ${HALO_OUTER_STOP}%)`,
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
const HEADLINE_LINES = [
  { text: "Make your mining", start: 0.18 },
  { text: "story impossible to", start: 0.34 },
  { text: "ignore.", start: 0.5 },
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

const STAGE_COUNT = TOUR.length;
/**
 * Viewport heights of scroll each continent owns.
 *
 * This is the primary pacing dial. It buys time without touching a single easing curve:
 * every fraction below is a fraction OF a stage, so lengthening the stage stretches the
 * hop and the dwell together and the sequence keeps its shape exactly.
 *
 * 165 puts the range at 7 x 165 = 1155vh, of which 1055vh is actual travel once the
 * sticky card's own viewport is subtracted.
 */
const STAGE_VH = 165;

/** Scale held at every stop, so each continent gets the same treatment. */
const STOP_ZOOM = 2.8;
/** Scale at the midpoint of a hop, so the globe pulls back to travel and dives back in. */
const TRAVEL_ZOOM = 1.55;
/**
 * Where inside a stage the hop happens. Up to ARRIVE the globe is still settling onto
 * this stop, past DEPART it has started leaving for the next; the span between is the
 * held stop. The two halves of a hop straddle a stage boundary and meet at its centre.
 *
 * So the dwell is not an added pause — it is the majority of every stage, and always was.
 * Narrowed from 0.18/0.82 to 0.13/0.87, which takes the moving part of a stage from 36%
 * to 26% and the held part from 64% to 74%. Against the longer STAGE_VH that is a hop
 * with ~19% more scroll behind it and a dwell with ~91% more, so the globe both travels
 * more slowly and rests visibly longer once it arrives.
 */
const STAGE_ARRIVE = 0.13;
const STAGE_DEPART = 0.87;
/** Progress over which the globe hands off from free drift to the tour. */
const ENGAGE = 0.03;
/**
 * How the sampled progress follows the true scroll position.
 *
 * This was a first-order lag, which can only ever decay toward the target — its velocity
 * jumps the instant the wheel moves, so a hard scroll still starts hard. A second-order
 * spring has to accelerate into the move and decelerate out of it, which is the weight
 * that reads as deliberate rather than as 1:1 scrubbing.
 *
 * Overdamped on purpose: zeta = 20 / (2 * sqrt(60)) = 1.29, so progress never overshoots
 * the scroll position and the tour cannot run past a stop and come back. The bounce lives
 * in ZOOM_SPRING instead, where it is a deliberate effect on one property.
 *
 * Raise stiffness to track the wheel harder; lower it to soften further.
 */
const PROGRESS_SPRING = { stiffness: 60, damping: 20 };
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
const RESUME_GAP = 0.2;

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

/**
 * Where in the tour the wipe into Stats begins.
 *
 * The last stage has no hop after it, so Antarctica is held from u = STAGE_ARRIVE to the
 * end of the range — the final zoom has fully settled by progress (6 + 0.13) / 7 = 0.876.
 * Starting at 0.90 puts the wipe inside that dwell, a little over 25vh after the motion
 * has stopped, and gives it the last 10% of a 1055vh range: about 105vh of scroll, and no
 * page height added. Lower it to begin earlier still — 0.876 is the floor, where the wipe
 * would start on top of the final zoom rather than after it.
 */
const CURTAIN_START = 0.90;

/**
 * The wipe: a layered fall of light down the gold family, deep at the top and resolving
 * into Stats at the foot.
 *
 * Every colour is a token already in @theme, and the depth comes from moving DOWN the
 * family rather than from adding one:
 *   #9E7208  --color-gold-hover, the darkest gold on the site. Carries the top.
 *   #B8860B  --color-gold. The rich body.
 *   #D4AF37  --color-gold-muted. The vivid band.
 *   #FAF5E8  --color-gold-light. Where it softens.
 *   #FBFBFA  Stats' own section background, verbatim from Stats.tsx.
 * Hue barely moves across those four (42deg to 46deg) — what changes is saturation and
 * lightness, which is what reads as depth rather than as a second colour.
 *
 * The stop POSITIONS are not arbitrary, and this is the part worth keeping straight. The
 * element is 130vh, bottom-anchored in a 100vh card, so its top 23.1% is clipped and the
 * card shows 23.1% to 100%. Screen position maps as `element% = 23.1 + p * 76.9`:
 *   24%  -> the very top of the screen        -> darkest (#9E7208)
 *   58%  -> 45% down the screen               -> most saturated (#D4AF37, opaque)
 *   74%  -> 66% down                          -> softening to cream
 *   90%  -> 87% down                          -> Stats' colour, and flat from there
 * Placed by screen position instead of by element position, the richest band lands mid
 * view rather than off the top edge, which is what a flat-looking version gets wrong.
 *
 * The flat #FBFBFA run at the foot is deliberate and load-bearing: the panel's bottom
 * edge and the card's bottom edge coincide, and Stats begins on the next pixel, so that
 * run is what makes the handoff seamless. Everything above 58% is translucent, so the
 * planet still reads through the rich part instead of being covered by it.
 */
/**
 * The hero ground.
 *
 * #0D1B2A at the top is the navbar's scrolled-state navy, so the header pinning over
 * the hero produces no colour step; it settles to #0A1128 lower down. The radial pool
 * sits at bottom-centre because that is where the planet sits in the horizon framing —
 * it is depth under the limb, not a second hue. Nothing here is outside the navy range.
 */
const HERO_NAVY = [
  "radial-gradient(130% 90% at 50% 100%, rgba(17,40,71,0.55) 0%, rgba(10,17,40,0) 62%),",
  "linear-gradient(180deg, #0D1B2A 0%, #0B1526 48%, #0A1128 100%)",
].join(" ");

const STATS_WIPE = [
  "linear-gradient(180deg,",
  "rgba(212,175,55,0) 0%,",
  "rgba(212,175,55,0.30) 8%,",
  "rgba(184,134,11,0.65) 16%,",
  "rgba(158,114,8,0.90) 24%,",
  "rgba(184,134,11,0.95) 40%,",
  "rgba(212,175,55,1) 58%,",
  "#FAF5E8 74%,",
  "#FBFBFA 90%,",
  "#FBFBFA 100%)",
].join(" ");

const TOUR_SITES = TOUR.map((id) => {
  const site = MINING_SITES.find((entry) => entry.id === id);
  if (!site) throw new Error(`TOUR references unknown site id: ${id}`);
  return site;
});

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

/**
 * Quintic ease-in-out. Zero first AND second derivative at both ends, where cubic
 * smoothstep only zeroes the first — so a hop leaves and arrives with no acceleration
 * step, and the join to the flat dwell either side of it is invisible rather than merely
 * continuous. This is the curve doing the work that a CSS cubic-bezier would do; it is a
 * function of scroll position rather than of time, so it cannot be expressed as one.
 */
function smootherstep(x: number) {
  const t = Math.min(Math.max(x, 0), 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** Shortest-arc interpolation between two longitudes, in degrees. */
function lerpLongitude(a: number, b: number, k: number) {
  const delta = ((b - a + 540) % 360) - 180;
  return a + delta * k;
}

interface StageState {
  /** Index of the stop that owns this moment, for the label highlight. */
  index: number;
  lat: number;
  lng: number;
  zoom: number;
}

/**
 * Resolves scroll progress into an aim point and a zoom.
 *
 * Progress is cut into STAGE_COUNT equal stages, one per continent. Inside a stage the
 * globe sits on that continent, then hands over to the next across the boundary; the
 * hop is eased and the zoom dips through it, so every stop reads as an arrival.
 */
function stageAt(progress: number): StageState {
  const f = Math.min(Math.max(progress, 0), 1) * STAGE_COUNT;
  const index = Math.min(Math.floor(f), STAGE_COUNT - 1);
  const u = f - index;

  let from = index;
  let to = index;
  let hop = 0;

  if (u < STAGE_ARRIVE && index > 0) {
    // Second half of the hop that began at the end of the previous stage.
    from = index - 1;
    to = index;
    hop = 0.5 + 0.5 * (u / STAGE_ARRIVE);
  } else if (u > STAGE_DEPART && index < STAGE_COUNT - 1) {
    from = index;
    to = index + 1;
    hop = 0.5 * ((u - STAGE_DEPART) / (1 - STAGE_DEPART));
  }

  const a = TOUR_SITES[from];
  const b = TOUR_SITES[to];
  const eased = smootherstep(hop);

  return {
    index: hop > 0.5 ? to : from,
    lat: a.lat + (b.lat - a.lat) * eased,
    lng: lerpLongitude(a.lng, b.lng, eased),
    // sin() puts the shallowest point of the dip exactly at the hop's midpoint and
    // returns to STOP_ZOOM at both ends, so consecutive stages join without a step.
    zoom: STOP_ZOOM - (STOP_ZOOM - TRAVEL_ZOOM) * Math.sin(Math.PI * eased),
  };
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
  const curtainRef = useRef<HTMLDivElement>(null);
  const markerRefs = useRef(new Map<string, HTMLDivElement | null>());

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
            // size the clamp produces, from ~46px on a phone to ~83px at 1440.
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
      setMetrics({ boxSize, boxTop });
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
    if (!box || reduceMotionRef.current) return;

    const layer = markerLayerRef.current;

    // --- Sample and damp -------------------------------------------------------------
    // Progress is read here, inside the frame that is about to draw, rather than being
    // pushed in from a scroll event. Scroll events fire at their own irregular cadence
    // and land a frame or two behind Lenis's own rAF, so sampling from them meant every
    // frame drew a slightly stale, unevenly spaced position — which is what read as
    // stutter. Sampling per frame removes the hop; the damping below absorbs whatever
    // unevenness is left in the underlying scroll position.
    const { top, travel } = rangeMetricsRef.current;
    const target = travel > 0 ? clamp((window.scrollY - top) / travel, 0, 1) : 0;

    const now = performance.now();
    const gap = (now - lastSampleRef.current) / 1000;
    lastSampleRef.current = now;

    const progress = progressSpring.current;
    if (gap <= 0 || gap > RESUME_GAP) {
      // Parked loop: snap, and kill the velocity with it. Integrating across the skipped
      // span would play it back as a slide, and a spring would ring on top of that.
      progress.value = target;
      progress.velocity = 0;
    } else {
      stepSpring(progress, target, gap, PROGRESS_SPRING);
    }
    const t = clamp(progress.value, 0, 1);
    progressRef.current = t;

    // The wipe, written here rather than through framer-motion's useScroll.
    //
    // useScroll with a ref target is what this component already tried and backed out of
    // — see the progressRef comment above — and the curtain has to be a child of the
    // sticky card regardless: that card is the only thing on this screen that stays
    // parked over the globe, so an overlay anywhere else would scroll away from what it
    // is meant to be covering. Sharing this frame also means the wipe cannot drift from
    // the tour by even one frame, which a separate scroll listener could.
    const curtain = curtainRef.current;
    if (curtain) {
      const rise = smootherstep((t - CURTAIN_START) / (1 - CURTAIN_START));
      curtain.style.transform = `translate3d(0, ${((1 - rise) * 100).toFixed(2)}%, 0)`;
    }

    // Only the highlighted stop has to travel through React, and that changes seven
    // times across the whole tour. The ref is updated here rather than further down,
    // because the engage <= 0 path below returns early — leaving it stale there would
    // re-fire setStageIndex every frame once the tour is scrolled back to the top.
    const stop = stageAt(t).index;
    if (stop !== stageIndexRef.current) {
      stageIndexRef.current = stop;
      setStageIndex(stop);
    }

    const engage = smoothstep(0, ENGAGE, t);

    if (engage <= 0) {
      // Back at the very top: hand the globe back to its free drift and every property
      // back to the classes, so the entry reveal behaves as if the tour did not exist.
      focusRef.current = null;
      engagedRef.current = false;
      // Rest the zoom spring too. Leaving stored velocity here means scrolling back down
      // re-enters the tour mid-bounce, which reads as a glitch rather than as a settle.
      zoomSpring.current.value = 1;
      zoomSpring.current.velocity = 0;
      box.style.transitionProperty = "";
      box.style.transform = "";
      box.style.opacity = "";
      layer?.style.removeProperty("--unzoom");
      return;
    }

    const stage = stageAt(t);
    const { centre, visibleY, tiltBias } = geometryRef.current;

    focusRef.current = { lat: stage.lat, lng: stage.lng, tiltBias, weight: engage };

    // Scale eases in from 1 alongside the aim, so engaging the tour is one continuous
    // move rather than a snap to STOP_ZOOM.
    //
    // That target then goes through a spring rather than to the element directly. Two
    // things come out of it: the magnification accelerates and decelerates instead of
    // tracking scroll rigidly, and because the spring is slightly underdamped it passes
    // ~3% beyond the target at an arrival and settles back — the stop lands rather than
    // stopping dead. Mid-hop the target is still moving and the spring just trails it,
    // so the overshoot only ever appears where the motion actually ends.
    const targetScale = 1 + (stage.zoom - 1) * engage;
    if (gap > 0 && gap <= RESUME_GAP) {
      stepSpring(zoomSpring.current, targetScale, gap, ZOOM_SPRING);
    } else {
      zoomSpring.current.value = targetScale;
      zoomSpring.current.velocity = 0;
    }
    // Floored just above 1: the overshoot is upward at an arrival, but on the way back
    // out of the tour the spring can dip under 1 and briefly shrink the globe.
    const scale = Math.max(1, zoomSpring.current.value);

    // Pin the aimed point at the middle of the visible slice and zoom around it.
    //
    // P is where the aim actually landed, reported by the projection rather than assumed
    // — the axial roll swings the tilt-bias offset sideways, so the aimed point is not on
    // the vertical centre line, and at STOP_ZOOM that error would carry it off screen.
    // Scaling happens about the element's own centre O, so:
    //   position = O + d + scale·(P - O), and we want P + (C - P)·engage
    //   =>  d = (P - O)·(1 - scale) + (C - P)·engage
    // which is identity at engage 0 and lands P exactly on C at engage 1.
    //
    // transform-origin is deliberately left at its default: in Tailwind v4 the box's
    // -translate-x-1/2 and its reveal scale are the standalone translate/scale
    // properties, which apply before transform and share its origin.
    const aim = aimPointRef.current;
    const px = aim ? aim.x : centre;
    const py = aim ? aim.y : visibleY;
    const dx = (px - centre) * (1 - scale) + (centre - px) * engage;
    const dy = (py - centre) * (1 - scale) + (visibleY - py) * engage;

    if (!engagedRef.current) {
      // The reveal's 1400ms ease covers opacity; leaving it on would smear every scroll
      // frame through it instead of tracking the wheel. It has finished by now.
      box.style.transitionProperty = "none";
      engagedRef.current = true;
    }
    box.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
    box.style.opacity = "";

    // Pins ride inside the scaled box, which is what keeps them glued to their landmass.
    // This cancels the magnification on the pin art so a marker keeps its designed size.
    layer?.style.setProperty("--unzoom", (1 / scale).toFixed(4));
  }, []);

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

    // The globe's render loop is what samples progress now. This only covers the gap
    // where it is suspended — tab hidden, or the canvas scrolled out of view — so the
    // hero is still correct the moment it comes back.
    const onScroll = () => applyStage();
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
    // Unconditional: this is the per-frame heartbeat that samples the scroll position,
    // so it has to run before any focus exists too, or the tour could never engage.
    applyStage();

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
  }, [applyStage]);

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
    <section className="relative isolate w-full bg-[#0D1B2A]">
      {/*
        isolate is load-bearing, not decoration. position:relative with z-index:auto does
        NOT open a stacking context, so the -z-10 starfield below was painting underneath
        this section's own background colour and was invisible. isolation:isolate makes
        this element a stacking context, which puts its background first and the
        negative-z layer on top of it, while still keeping it under the in-flow copy.
      */}
      {/*
        The hero ground behind the copy. Flat #0D1B2A rather than the full ramp: this
        section is STAGE_COUNT * STAGE_VH tall, so a gradient here would stretch over
        roughly twelve thousand pixels and the copy would see only its first sliver.
        Flat also means the seam where the sticky card's top edge meets it is invisible,
        because the card's ramp starts on this exact value.

        The starfield is pinned to the first viewport for the same reason the old
        backdrop was — across the full band it would be a scattering of dust. -z-10 is
        load-bearing: an absolutely positioned layer at auto z-index paints ABOVE the
        in-flow copy below it, so a positive or default z-index here would lay stars over
        the headline.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-screen"
      >
        <HeroStarfield zone="copy" />
      </div>

      {/* Copy — normal flow, scrolls away before anything pins. */}
      <div
        ref={copyRef}
        className="flex flex-col items-center px-6 pb-8 pt-[clamp(56px,calc(40vh-224px),112px)] text-center sm:px-10 sm:pt-[clamp(60px,calc(48vh-316px),132px)] lg:pt-[clamp(64px,calc(48vh-320px),160px)]"
      >
        {/*
          Eyebrow, headline, support, CTAs. The wrapper above is untouched - same padding,
          same centred column, same position in the tree - so only the message, its type
          scale and the button row are new. Entrances stay on the existing .hero-rise
          class, which is plain CSS keyframes with a reduced-motion opt-out; nothing here
          adds a scroll listener, and nothing here holds a transform that could become a
          containing block for the sticky globe frame below.
        */}
        <p className="hero-rise [animation-delay:60ms] font-mono text-[10px] font-semibold uppercase leading-none tracking-[0.2em] text-[#D4AF37] sm:text-[11px] sm:tracking-[0.22em]">
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
        <h1 className="hero-rise [animation-delay:160ms] mt-4 max-w-[1050px] font-geist text-[clamp(3rem,6vw,5.5rem)] font-bold uppercase leading-[0.96] tracking-[-0.02em] text-white sm:mt-5">
          {HEADLINE_LINES.map((line, index) => (
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
              className="block overflow-hidden pb-[0.08em] -mb-[0.08em]"
            >
              <span
                ref={(el) => {
                  lineRefs.current[index] = el;
                }}
                className="block will-change-[transform,opacity,filter]"
              >
                {line.text}
              </span>
            </span>
          ))}
        </h1>

        <p className="hero-rise [animation-delay:260ms] mt-6 max-w-[600px] font-geist text-[clamp(1rem,1.35vw,1.25rem)] font-normal leading-[1.5] tracking-[-0.005em] text-[#B8BCC8] sm:mt-7">
          Mining Discovery combines industry media, digital marketing and investor-focused
          communication to put mining companies in front of the audiences that matter.
        </p>

        {/*
          CTA row. Full-width stacked on phones, side by side from 640px. Gold solid for
          the commercial action, hairline outline for the browse - navy on white rather
          than the brief's white-on-dark, because this hero's ground is white.
        */}
        <div className="hero-rise [animation-delay:360ms] mt-7 flex w-full flex-col items-stretch gap-3 sm:mt-8 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
          <Link
            href="/#contact"
            className="group inline-flex items-center justify-center gap-2 rounded-lg bg-[#B8860B] px-7 py-3.5 font-sans text-[13px] font-semibold uppercase tracking-[0.08em] text-[#0B1F3A] shadow-sm transition-colors duration-200 hover:bg-[#D4AF37] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8860B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A1128]"
          >
            Start a Campaign
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>

          <Link
            href="/#services"
            className="group inline-flex items-center justify-center gap-2 rounded-lg border border-white/25 px-7 py-3.5 font-sans text-[13px] font-semibold uppercase tracking-[0.08em] text-white transition-colors duration-200 hover:border-white/45 hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A1128]"
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
        // STAGE_VH of travel per stop, derived from the tour so the two cannot drift.
        style={{ height: reduceMotion ? "100vh" : `${STAGE_COUNT * STAGE_VH}vh` }}
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
          className="sticky top-0 h-screen w-full overflow-hidden bg-[#0A1128]"
          style={{ background: HERO_NAVY }}
        >
          {/*
            The globe slot is now the whole pinned viewport rather than the leftovers
            under the copy, so horizonDiameter() sizes the planet against a much squarer
            frame and roughly half the sphere reads instead of a shallow arc. No padding
            to break out of any more — the copy's gutters are on the block above.
          */}
          <div ref={slotRef} className="relative h-full w-full">
            {/*
              The card is opaque and covers the section behind it, so it carries its own
              copy of the starfield. This is the field the globe actually sits against for
              the whole pinned tour. z-0, first in the slot, so it stays under the wash
              below and under the globe box's z-10.
            */}
            <div className="absolute inset-0 z-0">
              <HeroStarfield zone="stage" />
            </div>

            {/*
              The tonal floor that seats the planet: a cool navy wash rising from the
              card's bottom edge, kept under the globe box's z-10 so it can only ever
              show around the limb. Purely a background layer - the globe, its halo and
              its metrics are all untouched by it.
            */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0"
              style={{
                background:
                  "radial-gradient(120% 72% at 50% 100%, rgba(11,31,58,0.05) 0%, rgba(11,31,58,0.021) 44%, rgba(11,31,58,0) 72%)",
              }}
            />

            {/* Layer 2 + 3 — globe, clouds and atmosphere */}
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
              {/*
                Atmosphere bloom. Square box, centred sphere, stops keyed to GLOBE_FIT, so
                it stays concentric with the silhouette at every size. Sits under the
                canvas: where the sphere is opaque the planet covers it, and the only part
                that shows is the ring spilling onto the card.
              */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{ background: ATMOSPHERE_HALO }}
              />

              {metrics.boxSize > 0 && (
                <EarthGlobe
                  // Above the halo, and it composites over it wherever the sphere is lit.
                  style={{ position: "relative" }}
                  className="h-full w-full"
                  anchors={ANCHORS}
                  arcs={HERO_ARCS}
                  onProject={handleProject}
                  onReady={handleReady}
                  focusRef={focusRef}
                  speedScale={activeId ? 0.25 : 1}
                />
              )}

              {/* Layer 4 — mining markers, in the same coordinate box as the globe canvas */}
              <div
                ref={markerLayerRef}
                className={`
                  pointer-events-none absolute inset-0 z-10
                  transition-opacity duration-700 delay-500
                  ${ready ? "opacity-100" : "opacity-0"}
                `}
              >
                {MINING_SITES.map((site, index) => {
                  const isActive =
                    activeId === site.id || TOUR[stageIndex] === site.id;
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
                      {/* Pin — 44px hit target centred on the geographic point */}
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

                      {/*
                        No visible text label. The region, country and detail live only in
                        the pin's aria-label above: the globe is meant to read as surface,
                        atmosphere, dots and arcs, and a rendered name on the sphere read
                        as a stray artefact rather than as a caption.
                      */}
                    </div>
                  );
                })}
              </div>
            </div>

            {/*
              Layer 5 — the wipe into Stats.

              Last child of the sticky card and above every globe layer, so it covers the
              planet, the markers and the halo alike, and the card's own overflow-hidden
              clips it with no extra rule. pointer-events-none: it is scenery, and the
              markers underneath keep their hit targets until the card unpins.

              Bottom-anchored and 130vh tall so that at rest the soft leading edge has
              somewhere to go above the card. The initial inline transform is the resting
              state for reduced motion and for first paint, where applyStage has not run.
            */}
            <div
              ref={curtainRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-[130vh] will-change-transform"
              style={{
                transform: "translate3d(0, 100%, 0)",
                background: STATS_WIPE,
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default GlobeHero;
