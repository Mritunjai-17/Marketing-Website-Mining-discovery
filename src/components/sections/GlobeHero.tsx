"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HeroStarfield } from "@/components/sections/hero-layers/HeroStarfield";
import { HeadlineUnderline } from "@/components/sections/hero-layers/HeadlineUnderline";
import { GLOBE_FIT } from "@/components/ui/globe/EarthGlobe";
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
  { id: "sa-br", fromId: "south-america", toId: "brazil", phase: 0.24, onMobile: true },
  { id: "eu-af", fromId: "europe", toId: "africa", phase: 0.31, onMobile: true },
  { id: "eu-ca", fromId: "europe", toId: "central-asia", phase: 0.14 },
  { id: "ca-as", fromId: "central-asia", toId: "asia", phase: 0.35, onMobile: true },
  { id: "af-as", fromId: "africa", toId: "asia", phase: 0.39 },
  { id: "br-af", fromId: "brazil", toId: "africa", phase: 0.44 },
  { id: "sa-af", fromId: "south-america", toId: "africa", phase: 0.48, onMobile: true },
  { id: "as-sea", fromId: "asia", toId: "southeast-asia", phase: 0.53, onMobile: true },
  { id: "as-au", fromId: "asia", toId: "australia", phase: 0.58, onMobile: true },
  { id: "sea-au", fromId: "southeast-asia", toId: "australia", phase: 0.62, onMobile: true },
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
  "brazil",
  "europe",
  "africa",
  "central-asia",
  "asia",
  "australia",
  "southeast-asia",
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

const STAGE_COUNT = TOUR.length;
/**
 * Viewport heights of scroll each continent owns.
 *
/**
 * Viewport heights of scroll each location owns.
 * 100 puts each location on exactly "one scroll distance" (100vh per stop).
 */
const STAGE_VH = 100;

/**
 * Where inside a stage the hop happens. Up to ARRIVE the globe is still settling onto
 * this stop, past DEPART it has started leaving for the next; the span between is the
 * held stop. 0.25/0.75 provides a crisp 50% dwell at each location and smooth 50% transition.
 */
const STAGE_ARRIVE = 0.25;
const STAGE_DEPART = 0.75;
/** Progress over which the globe hands off from free drift to the tour. */
const ENGAGE = 0.03;
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
 * A frame gap longer than this means the loop was parked — tab hidden, or the globe
 * scrolled out of view and its render loop suspended. Damping across that gap would
 * play the whole skipped span back as a slide, so progress snaps instead.
 */
const RESUME_GAP = 0.2;
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
const CURTAIN_START = 0.94;

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

/**
 * The wipe: the hero's navy rising and resolving into Stats' white.
 *
 * This used to be a fall of light down the gold family (#9E7208 -> #B8860B -> #D4AF37 ->
 * #FAF5E8). It was the only gold wash on the page and, at 130vh, by far the largest use
 * of the colour anywhere on the site — gold is an accent here, for a chapter number or a
 * CTA, not a structural surface. Read against the navbar it looked like a decorative
 * band inserted between two sections rather than one of them ending.
 *
 * The colours are now the brand navy resolving to Stats' own white:
 *
 *   #0B1F3A  the navbar's scrolled-state navy, verbatim from Header.tsx. Carries the top.
 *   #36475D  the same navy, 18% of the way to white
 *   #707B8B  42% - the cool slate mid-tone
 *   #AEB5BD  68% - where it reads as light grey
 *   #DEE1E3  88%
 *   #FBFBFA  Stats' own section background, verbatim from Stats.tsx.
 *
 * Every mid-tone is a straight blend of those two endpoints, so the hue never leaves the
 * navy and what changes is lightness alone. That is what keeps it reading as the page
 * getting darker rather than as a second colour arriving.
 *
 * The stop POSITIONS are unchanged from the gold version, and this is the part worth
 * keeping straight. The element is 130vh, bottom-anchored in a 100vh card, so its top
 * 23.1% is clipped and the card shows 23.1% to 100%. Screen position maps as
 * `element% = 23.1 + p * 76.9`:
 *   24%  -> the very top of the screen        -> deepest navy
 *   58%  -> 45% down the screen               -> opaque #0B1F3A
 *   68-90% -> 58% to 87% down                 -> the ramp out through slate to grey
 *   95%  -> 93% down                          -> Stats' colour, and flat from there
 * Placed by screen position instead of by element position, the deep band lands mid view
 * rather than off the top edge.
 *
 * The navy needs a longer run-out than the gold did: gold sits mid-luminance and was
 * already halfway to white, where #0B1F3A is not, so the ramp gets four stops between
 * 58% and 90% instead of one. Compressing it is what would put a visible edge back.
 *
 * The flat #FBFBFA run at the foot is deliberate and load-bearing: the panel's bottom
 * edge and the card's bottom edge coincide, and Stats begins on the next pixel, so that
 * run is what makes the handoff seamless. Everything above 58% is translucent, so the
 * planet still reads through the deep part instead of being covered by it.
 */
const STATS_WIPE = [
  "linear-gradient(180deg,",
  "rgba(11,31,58,0) 0%,",
  "rgba(11,31,58,0.28) 8%,",
  "rgba(11,31,58,0.62) 16%,",
  "rgba(11,31,58,0.88) 24%,",
  "rgba(11,31,58,0.96) 40%,",
  "#0B1F3A 58%,",
  "#36475D 68%,",
  "#707B8B 76%,",
  "#AEB5BD 84%,",
  "#DEE1E3 90%,",
  "#FBFBFA 95%,",
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
}

/**
 * Resolves scroll progress into an aim point.
 *
 * The tour is rotation only: a stage carries a latitude and a longitude and nothing
 * else. There is deliberately no scale, no camera distance and no element offset in it —
 * the globe is mounted in one place and turns under a fixed camera.
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

/**
 * Computes opacity weight [0..1] for a marker during the scroll tour.
 * One scroll distance illuminates one location:
 * - When dwelling on location i, location i is 1.0, others are 0.0.
 * - When hopping to location i+1, location i fades out and location i+1 fades in.
 * - Active/hovered marker always retains 1.0.
 */
function getTourVisibility(
  anchorId: string,
  progress: number,
  activeId: string | null,
): number {
  if (activeId === anchorId) return 1;

  const f = clamp(progress, 0, 1) * STAGE_COUNT;
  const index = Math.min(Math.floor(f), STAGE_COUNT - 1);
  const u = f - index;

  let from = index;
  let to = index;
  let hop = 0;

  if (u < STAGE_ARRIVE && index > 0) {
    from = index - 1;
    to = index;
    hop = 0.5 + 0.5 * (u / STAGE_ARRIVE);
  } else if (u > STAGE_DEPART && index < STAGE_COUNT - 1) {
    from = index;
    to = index + 1;
    hop = 0.5 * ((u - STAGE_DEPART) / (1 - STAGE_DEPART));
  }

  const fromSiteId = TOUR[from];
  const toSiteId = TOUR[to];

  if (anchorId === fromSiteId && anchorId === toSiteId) {
    return 1;
  }
  if (anchorId === fromSiteId) {
    return clamp(1 - hop, 0, 1);
  }
  if (anchorId === toSiteId) {
    return clamp(hop, 0, 1);
  }
  return 0;
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
  const activeIdRef = useRef<string | null>(null);
  activeIdRef.current = activeId;

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
   * Progress as a sprung value rather than as a raw scroll reading. A ref, and mutated
   * in place: it changes every frame and must never re-render the tree.
   */
  const progressSpring = useRef<SpringState>({ value: 0, velocity: 0 });

  /** Aim target handed to the globe; mutated in place, never triggers a render. */
  const focusRef = useRef<GlobeFocus | null>(null);
  /**
   * The extra pitch that lifts an aimed coordinate off the centre of the projected disc
   * and into the slice the card actually shows. A rotation of the sphere, so it changes
   * the globe's orientation and never its framing.
   */
  const geometryRef = useRef({ tiltBias: 0 });
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
  const [isTouring, setIsTouring] = useState(false);
  const touringRef = useRef(false);
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
   * and how the markers should read.
   *
   * THE GLOBE'S FRAMING IS NOT ANIMATED HERE, AND MUST NOT BE. Its box position and size
   * come from `metrics`, which only ever changes on resize, and its camera lives in
   * EarthGlobe at a fixed distance. Scroll drives the sphere's ORIENTATION and nothing
   * else: the element is never translated and never scaled, so the planet holds the exact
   * position, size and crop it has on the first frame for the whole tour.
   *
   * This also used to magnify the box to STOP_ZOOM and re-centre the aimed coordinate
   * under it, which is what read as the globe leaping forward and sliding sideways on the
   * first scroll. Rotation alone still reaches every stop — including Antarctica, which no
   * CSS transform could have found, because the sphere turns the point onto the near face
   * rather than the viewport chasing it.
   */
  const applyStage = useCallback(() => {
    if (reduceMotionRef.current) return;

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
    if (gap > RESUME_GAP) {
      // Parked loop: snap, and kill the velocity with it. Integrating across the skipped
      // span would play it back as a slide, and a spring would ring on top of that.
      progress.value = target;
      progress.velocity = 0;
    } else if (gap > 0) {
      stepSpring(progress, target, gap, PROGRESS_SPRING);
    }
    // gap === 0 means a second call inside the same frame: leave the spring untouched.
    // This used to fall into the snap branch above, so any duplicate sample jumped
    // progress straight onto the raw scroll position — a visible hitch, and the more
    // often the scroll listener fired the worse it got.
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

    const touring = t > 0.015 && t < CURTAIN_START;
    if (touring !== touringRef.current) {
      touringRef.current = touring;
      setIsTouring(touring);
    }

    const engage = smoothstep(0, ENGAGE, t);

    if (engage <= 0) {
      // Back at the very top: hand the globe back to its free drift, so the entry reveal
      // behaves as if the tour did not exist. Nothing to undo on the element itself —
      // the tour writes no styles to it.
      focusRef.current = null;
      engagedRef.current = false;
      return;
    }

    const stage = stageAt(t);
    const { tiltBias } = geometryRef.current;

    // The one thing scroll drives. tiltBias is a pitch applied to the sphere, not to the
    // camera or to the element: it lifts the aimed coordinate from the centre of the
    // projected disc — which the horizon framing puts below the card's floor — up into the
    // visible slice, by turning the globe. Framing is untouched by it.
    focusRef.current = { lat: stage.lat, lng: stage.lng, tiltBias, weight: engage };

    // No transform is written to the box, by design. See the note on this callback:
    // position, size, crop and camera distance are all fixed for the whole tour, and the
    // markers therefore need no counter-scale either — they sit in an unscaled box and
    // keep the size they were designed at.
    engagedRef.current = true;
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

    // The projection also reports where the focus point landed (FOCUS_ANCHOR_ID). Nothing
    // reads it any more: it existed to re-pin the tour's zoom about that point every
    // frame, and there is no zoom to pin. It has no marker element, so the loop below
    // skips it.
    //
    // Unconditional: this is the per-frame heartbeat that samples the scroll position,
    // so it has to run before any focus exists too, or the tour could never engage.
    applyStage();

    const t = progressRef.current;
    const isEngaged = engagedRef.current;
    const currentActiveId = activeIdRef.current;
    const engage = smoothstep(0, ENGAGE, t);

    for (const anchor of projected) {
      const el = markerRefs.current.get(anchor.id);
      if (!el) continue;

      // Fade before the container edge clips the marker, not after.
      const bottomFade = clamp((maxY - anchor.y) / fadeY, 0, 1);
      const leftFade = clamp((anchor.x - minX) / fadeX, 0, 1);
      const rightFade = clamp((maxX - anchor.x) / fadeX, 0, 1);

      // In scroll tour: each scroll distance illuminates its corresponding location
      const rawTourVis = getTourVisibility(anchor.id, t, currentActiveId);
      const tourVis = isEngaged ? (1 - engage) * 1 + engage * rawTourVis : 1;
      const opacity = anchor.opacity * bottomFade * leftFade * rightFade * tourVis;

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
          (bg-[#0A1128]) and paints later in the tree — so it covers whatever it reaches.
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
        className="flex flex-col items-center px-6 pb-8 pt-[clamp(86px,calc(30vh-98px),132px)] text-center sm:px-10 sm:pt-[clamp(89px,calc(34vh-163px),149px)] lg:pt-[clamp(97px,calc(36vh-183px),169px)]"
      >
        {/*
          Eyebrow, headline, support, CTAs. The wrapper above is untouched - same padding,
          same centred column, same position in the tree - so only the message, its type
          scale and the button row are new. Entrances stay on the existing .hero-rise
          class, which is plain CSS keyframes with a reduced-motion opt-out; nothing here
          adds a scroll listener, and nothing here holds a transform that could become a
          containing block for the sticky globe frame below.
        */}
        <p className="hero-rise [animation-delay:60ms] font-mono text-xs sm:text-[13px] md:text-sm font-semibold uppercase leading-none tracking-[0.16em] sm:tracking-[0.18em] text-[#D4AF37]">
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
        <h1 className="hero-rise [animation-delay:160ms] mt-6 max-w-[1040px] font-geist text-[clamp(1.2rem,6vw,2.5rem)] font-bold uppercase leading-[0.92] sm:text-[clamp(2.5rem,5vw,4.5rem)] tracking-[-0.02em] text-white sm:mt-7">
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

        <p className="hero-rise [animation-delay:260ms] mt-6 max-w-[740px] font-geist text-[clamp(0.95rem,1.2vw,1.125rem)] font-normal leading-[1.6] tracking-[-0.005em] text-[#B8BCC8] sm:mt-7">
          Mining Discovery combines industry media, digital marketing and investor-focused
          communication to put mining companies in front of the audiences that matter.
        </p>

        {/*
          CTA row. Full-width stacked on phones, side by side from 640px. Gold solid for
          the commercial action, hairline outline for the browse - navy on white rather
          than the brief's white-on-dark, because this hero's ground is white.
        */}
        <div className="hero-rise [animation-delay:360ms] mt-6 flex w-full flex-col items-stretch gap-3 sm:mt-7 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
          <Link
            href="/contact"
            className="group inline-flex items-center justify-center gap-2 rounded-lg bg-[#B8860B] px-7 py-3.5 font-sans text-[13px] font-semibold uppercase tracking-[0.08em] text-[#0B1F3A] shadow-sm transition-colors duration-200 hover:bg-[#D4AF37] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8860B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A1128]"
          >
            Start a Campaign
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>

          <Link
            href="/services"
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

            {/* Tour Location HUD Indicator - illuminates the active location on each scroll */}
            <div
              className={`pointer-events-none absolute top-6 sm:top-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 sm:gap-3 px-3.5 py-1.5 sm:px-4.5 sm:py-2 rounded-full bg-[#0B1F3A]/90 border border-[#D4AF37]/40 backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.6)] transition-all duration-300 ${
                ready && isTouring
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-3 pointer-events-none"
              }`}
            >
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]" />
              </span>
              <span className="font-mono text-[10px] sm:text-[11px] font-semibold text-[#D4AF37] tracking-wider">
                0{stageIndex + 1} / 0{TOUR.length}
              </span>
              <span className="h-3 w-px bg-white/25" />
              <span className="font-sans text-[11px] sm:text-[12px] font-bold text-white uppercase tracking-[0.08em]">
                {TOUR_SITES[stageIndex]?.country ?? ""}
              </span>
              <span className="hidden sm:inline font-mono text-[10px] text-[#D4AF37]/85 uppercase">
                • {TOUR_SITES[stageIndex]?.region ?? ""}
              </span>
            </div>

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
                        // Position only. The counter-scale that used to sit here existed
                        // to cancel the tour's magnification of the globe box; the box is
                        // never scaled now, so a pin is already at its designed size.
                        transform:
                          "translate3d(var(--mx, -9999px), var(--my, -9999px), 0)",
                        zIndex: isActive ? 30 : 10,
                      }}
                      className="absolute left-0 top-0"
                    >
                      {/* Pin — hit target centred on the geographic point */}
                      <button
                        type="button"
                        aria-label={`${site.region}, ${site.country}. ${site.detail}.`}
                        className="group absolute left-0 top-0 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8860B] focus-visible:ring-offset-2"
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

                        {/* Delicate stem connector from dot to label */}
                        <span
                          className={`absolute left-1/2 -translate-x-1/2 top-[27px] w-px h-[7px] pointer-events-none transition-all duration-200 ${
                            isActive
                              ? "bg-gradient-to-b from-[#D4AF37] to-[#D4AF37]/60"
                              : "bg-gradient-to-b from-[#D4AF37]/75 to-[#D4AF37]/20 group-hover:from-[#D4AF37] group-hover:to-[#D4AF37]/50"
                          }`}
                          aria-hidden="true"
                        />

                        {/* Location Name Pill Badge */}
                        <span
                          className={`absolute left-1/2 top-[34px] -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border backdrop-blur-md transition-all duration-200 whitespace-nowrap shadow-lg ${
                            isActive
                              ? "bg-[#0B1F3A]/95 border-[#D4AF37] shadow-[0_0_16px_rgba(212,175,55,0.45)] scale-105"
                              : "bg-[#0B1F3A]/85 border-[#D4AF37]/35 hover:border-[#D4AF37]/70 group-hover:border-[#D4AF37]/80 group-hover:bg-[#0B1F3A]/95 shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full transition-colors duration-200 ${
                              isActive
                                ? "bg-[#D4AF37] shadow-[0_0_6px_#D4AF37]"
                                : "bg-[#D4AF37]/80 group-hover:bg-[#D4AF37]"
                            }`}
                            aria-hidden="true"
                          />
                          <span className="font-sans text-[9.5px] sm:text-[11px] font-semibold uppercase tracking-[0.07em] text-white">
                            {site.id === "antarctica" ? "Antarctica" : site.country}
                          </span>
                          {isActive && (
                            <span className="text-[8.5px] sm:text-[9.5px] font-mono font-medium tracking-wider uppercase text-[#D4AF37]">
                              • {site.region}
                            </span>
                          )}
                        </span>
                      </button>
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
