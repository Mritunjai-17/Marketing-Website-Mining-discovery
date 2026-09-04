"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useMotionValue, useTransform } from "framer-motion";

/**
 * The scroll-driven mining sequence.
 *
 * A tall track with a pinned viewport: scroll position drives a 300-frame sequence onto
 * a canvas, and the same progress drives which of four editorial panels is showing. One
 * scroll input, two synchronised outputs — the footage and the story never drift apart
 * because neither one owns a clock.
 *
 * FIVE THINGS THIS FILE HAS TO GET RIGHT:
 *
 * 1. NO REACT RENDER PER FRAME. The frame index lives in a ref and reaches the canvas
 *    through requestAnimationFrame, never through state. An earlier revision called
 *    setState on every frame change, which re-rendered this whole subtree — card, list
 *    items, indicator — up to 300 times per scroll pass. The only state that moves while
 *    scrolling now is the panel index, and that changes exactly three times.
 *
 * 2. NO HOLES IN THE SEQUENCE. Frames arrive out of order and the user can scrub to 80%
 *    a second after load. `nearestReady` walks outward from the requested index to the
 *    closest frame actually decoded, so an un-loaded frame shows its neighbour rather
 *    than clearing the canvas. Combined with the coarse-first load order below, there is
 *    no white flash and no blank canvas at any scroll position, ever.
 *
 * 3. BOUNDED CONCURRENCY. The sequence is fetched through a six-wide window, coarse
 *    ladder first. Requesting all 300 at once — which is what this did before — buries
 *    the connection pool and makes the first frames arrive later, not sooner.
 *
 * 4. CONTIGUOUS PANEL RANGES. Panels are derived as `floor(progress * 4)`, so every
 *    position maps to exactly one panel. The previous version used hand-written ranges
 *    with gaps between them (0.22-0.25, 0.47-0.5, 0.72-0.75) where the lookup failed and
 *    fell back to panel 0 — the card flicked back to "Who We Are" and out again three
 *    times per scroll. Deriving the index makes that class of bug unrepresentable.
 *
 * 5. ONE BACKDROP FILTER. The card is a single shell that stays put; only its contents
 *    cross-fade. Four stacked blurred panels would mean four backdrop-filter layers
 *    compositing on every frame, which is the most expensive thing on this page.
 */

const TOTAL_FRAMES = 300;

/**
 * Frame counter, for development only.
 *
 * Flip to true to show `FRAME 001 / 300` over the sequence — useful when re-timing the
 * panel boundaries against the footage. Never ship it true: it reads as a debug artefact
 * to a visitor. It is a plain const so the counter's markup is trivially dead code when
 * false, rather than something that ships and hides behind CSS.
 */
const SHOW_FRAME_DEBUG = false;

/**
 * The two encodes, from scripts/convert-frames.mjs.
 *
 * `step` is the mobile memory lever, not a quality one: taking every second frame halves
 * the decoded bitmaps a phone has to hold, and at 150 frames over a 360vh track the
 * sequence still advances faster than the display refreshes it.
 */
const SOURCES = {
  wide: { dir: "w1280", step: 1 },
  narrow: { dir: "w720", step: 2 },
} as const;

type Source = (typeof SOURCES)[keyof typeof SOURCES];

/**
 * The surfaces either side of this section, read off their own components: Stats above
 * (#FBFBFA) and TrustedBy below (#F4F4F2).
 *
 * The transitions are cross-dissolves against these exact values rather than a generic
 * white, which is what stops the boundary reading as a seam. At full strength the entry
 * pane IS the previous section's colour, so there is no edge to see; it then dissolves
 * to reveal footage that was already being drawn underneath it the whole time.
 */
const ENTRY_SURFACE = "#FBFBFA";
const EXIT_SURFACE = "#F4F4F2";

/*
 * There is no STORY_END any more. It split the track into even quarters with a reserved
 * tail; the stages are now cut where the footage changes instead, and the last one runs
 * to the end of the track because its composition does too — the exit dissolve carries
 * it out rather than it having to finish early.
 */

/**
 * The entry bridge.
 *
 * WHY THE PREVIOUS ATTEMPT STILL SHOWED A LINE. It faded a full-bleed pane of the
 * previous section's colour using opacity. Halfway through that fade the pane is
 * translucent EVERYWHERE, including at its top edge — so the section boundary had
 * opaque white above it and white-over-footage below it, and that difference is the
 * horizontal line. Any approach built on the layer's opacity has this failure mode.
 *
 * WHAT THIS DOES INSTEAD. The bridge is opaque at all times and it is the GRADIENT that
 * moves: a band that is solidly the previous section's colour at the top, dissolving to
 * transparent some distance down, with that distance shrinking as the section arrives.
 * The pixel at the boundary is therefore always exactly the previous section's colour,
 * at every scroll position, so there is nothing there for the eye to catch.
 *
 * The section also reaches UP into the previous one (see the negative margin on the
 * section), which buries the geometric boundary inside the solid part of the band. The
 * numbers below are chosen so that holds: while the boundary is on screen the bridge is
 * never shorter than the value whose solid run still exceeds OVERLAP. At the pin that
 * run is BRIDGE_MAX * BRIDGE_AT_PIN * BRIDGE_SOLID = 91px against a 64px overlap, and it
 * is still 77px by the time the join leaves the top of the screen.
 */
const BRIDGE_MAX = 520;
const BRIDGE_SOLID = 0.5;

/** Bridge length at the moment the section pins, as a fraction of BRIDGE_MAX. */
const BRIDGE_AT_PIN = 0.35;

/**
 * How far past the pin the last of the bridge dissolves, in px of scrolling.
 *
 * In px rather than a fraction of the track on purpose. As a fraction it decays faster
 * on a short viewport — the track is shorter, so the same fraction is fewer pixels — and
 * the solid run drops below OVERLAP while the join is still on screen, which puts the
 * line back on small laptops only. A fixed distance behaves the same everywhere.
 */
const BRIDGE_TAIL_PX = 420;

/** How far the section reaches up into the previous one. Must match the -mt- class. */
const OVERLAP = 64;

/**
 * Track fraction before the first panel is allowed in, so the scene establishes first.
 *
 * Retuned when the track was lengthened: this is a FRACTION, so leaving it at 0.05 would
 * have doubled the physical distance the scene sits empty along with everything else.
 * 0.025 of the longer track is the same ~0.16 of a viewport it always was.
 */
const REVEAL_AT = 0.025;

/**
 * HOW LONG THE SEQUENCE TAKES TO SCRUB, AND WHERE THAT LIVES.
 *
 * There is no ScrollTrigger duration or "end: +=2000" here to raise — the driver derives
 * progress from the track's own geometry:
 *
 *   span     = trackHeight - viewportHeight     (how far the pinned viewport travels)
 *   progress = -rect.top / span
 *   frame    = round(progress * 299)
 *
 * So the ONLY thing that sets the pace is the track height on the section, and the span
 * is the height minus one viewport — not the height itself. That distinction is the
 * whole tuning problem: 420vh does not give 4.2 viewports of scrubbing, it gives 3.2.
 *
 *   before   md:h-[420vh]  ->  span 3.2vh  ->  9.6px of scroll per frame at 900px tall
 *   after    md:h-[740vh]  ->  span 6.4vh  ->  19.2px per frame
 *
 * That is exactly 2.0x on desktop and 1.77x on phones, inside the 1.5-2.5x asked for.
 * Phones get the gentler multiplier deliberately: the same factor there is a great deal
 * more thumb travel for the same footage.
 *
 * Nothing else moves. The mapping is still 0 -> frame 0 and 1 -> frame 299, still read
 * straight off the scroll position every frame, so scrubbing stays exact in both
 * directions and the sequence cannot drift or lag behind the scrollbar.
 */

/** Frames in flight at once. Six keeps the pipe full without starving the first paint. */
const LOAD_CONCURRENCY = 6;

/** Evenly-spaced frames fetched before the sequential fill, so scrubbing anywhere works. */
const LADDER_STOPS = 16;

/** Cap the backing store at 2x. A 3x phone gains nothing here and pays in fill rate. */
const MAX_DPR = 2;

/** Where the type sits. Chosen per stage from the footage — see STAGE ANALYSIS below. */
type Zone = "left" | "right" | "bottom";

interface Panel {
  label: string;
  heading: string;
  body: string;
  items?: string[];
  cta?: { label: string; href: string };
  /** Track progress at which this stage takes over. Measured, not assumed. */
  at: number;
  zone: Zone;
}

/**
 * STAGE ANALYSIS — where these numbers come from.
 *
 * Run `node scripts/analyze-frames.mjs out.json` to reproduce. It decodes all 300
 * frames at low resolution and scores every cell of a 3x3 grid for "quietness" —
 * darkness weighted 0.55, smoothness (inverse gradient density) weighted 0.45. Bright or
 * busy is the machinery; dark and smooth is where type can live without covering it.
 * A dynamic program then cuts the sequence into four stages, forcing adjacent stages to
 * use different zones, maximising total quietness.
 *
 * THE RESULT CONTRADICTS THE OBVIOUS READING OF THE FOOTAGE, so it is worth recording.
 * Over the opening third the machinery is on the LEFT, not the right: across frames
 * 0-61 the left band scores 0.548 against the right band's 0.766. Putting the type on
 * the left there — which is what the composition sketch suggests — lands it directly on
 * the subject. Stage 1 therefore sets type on the RIGHT.
 *
 *   stage  frames    progress       zone     quiet  runner-up
 *   01     0-61      0.0%-20.7%     right    0.772  bottom (+0.010)
 *   02     62-130    20.7%-43.7%    bottom   0.588  right  (+0.001)
 *   03     131-194   43.7%-65.0%    left     0.456  centre (+0.005)
 *   04     195-299   65.0%-100%     right    0.448  bottom (+0.013)
 *
 * Vertical placement comes from the same grid. Stage 1's quietest cells are bottom- and
 * mid-right, so it sits centre-right; stage 2's is bottom-centre; stage 3's is
 * bottom-left; stage 4's best usable cell is bottom-right (its top cells score higher
 * but sit under the navbar).
 *
 * The margins in the back half are small — by stage 3 the frame is busy everywhere and
 * no zone is clearly quiet — which is why the localized scrims below matter more there
 * than the placement does.
 */

/*
 * Four panels, four quarters of the scroll. No `range` field any more — see note 4.
 */
const PANELS: Panel[] = [
  {
    label: "Who We Are",
    heading: "Clarity in an industry crowded with noise.",
    at: 0,
    zone: "right",
    body: "Mining Discovery started from a single conviction — that a sector this consequential deserves reporting that cuts through the noise and the half-truths. Mining was never only rocks and machinery. It is people, communities, economies, and a meaningful share of the planet's future.",
  },
  {
    label: "What We Do",
    heading: "Four ways the story reaches you.",
    at: 0.207,
    zone: "bottom",
    body: "One newsroom, four cadences — from the day's filings to the long read that finally has room to breathe.",
    items: [
      "Daily Mining News",
      "Weekly Newsletter",
      "Monthly Magazine",
      "Interactive Platform",
    ],
  },
  {
    label: "Our Expertise",
    heading: "The beats that actually move markets.",
    at: 0.437,
    zone: "left",
    body: "The industry had no dedicated, trustworthy voice for the stories that carry weight. These are the ones we committed to covering properly.",
    items: [
      "Corporate actions",
      "Sustainability",
      "Exploration",
      "Regulation",
      "Investor relations",
      "Innovation",
    ],
  },
  {
    label: "Our Approach",
    heading: "Industry knowledge paired with digital expertise.",
    at: 0.65,
    zone: "right",
    body: "Our founder leads on a conviction that the global mining industry deserves better communication than it has had. Our co-founder brings deep digital expertise across SEO, paid media and content strategy — building visibility that reaches the audiences who move markets.",
    cta: { label: "Learn More About Us", href: "/about" },
  },
];

/** Long, decelerating, no overshoot. The house ease for everything in this section. */
const EASE = [0.22, 1, 0.36, 1] as const;

/*
 * Panel motion. `custom` carries whether this panel is behind the playhead or ahead of
 * it, so the one leaving lifts out at -30 while the one arriving waits below at +40 —
 * the story always travels the same direction as the scroll.
 */
/** Each stage drifts along its own axis, so the type always moves toward its own side. */
const OFFSET: Record<Zone, { x: number; y: number }> = {
  left: { x: -24, y: 0 },
  right: { x: 24, y: 0 },
  bottom: { x: 0, y: 24 },
};

/**
 * Flex placement per zone.
 *
 * The base classes are the phone layout and they are deliberately NOT the desktop ones:
 * at 390px wide there is no left or right negative space to speak of, so every stage
 * anchors low where the frame is darkest and the machinery is above the type. The md:
 * classes are the measured desktop composition.
 */
const PLACE: Record<Zone, string> = {
  left: "items-end justify-start pb-[15vh] md:pb-[13vh] md:pl-[8vw]",
  right:
    "items-end justify-start pb-[15vh] md:items-center md:justify-end md:pr-[8vw] md:pb-[6vh]",
  bottom: "items-end justify-start pb-[15vh] md:justify-center md:pb-[11vh]",
};

/**
 * Localized scrims, one per zone, cross-faded with the stage.
 *
 * Every chain ends fully transparent well before the opposite edge, so the far side of
 * the frame keeps its real exposure and there is no rectangle anywhere — the darkening
 * is a lit gradient across the footage, not a panel behind the words.
 */
const SCRIM: Record<Zone, string> = {
  left:
    "linear-gradient(90deg, rgba(5,12,24,0.82) 0%, rgba(5,12,24,0.58) 20%, rgba(5,12,24,0.26) 42%, rgba(5,12,24,0) 64%)",
  right:
    "linear-gradient(270deg, rgba(5,12,24,0.82) 0%, rgba(5,12,24,0.58) 20%, rgba(5,12,24,0.26) 42%, rgba(5,12,24,0) 64%)",
  bottom:
    "linear-gradient(0deg, rgba(5,12,24,0.86) 0%, rgba(5,12,24,0.60) 22%, rgba(5,12,24,0.26) 46%, rgba(5,12,24,0) 68%)",
};

/** Cast on the type itself, so a bright frame cannot swallow a thin glyph. */
const INK_SHADOW = "0 1px 12px rgba(5,12,24,0.70)";

const panelVariants = {
  hidden: (offset: { x: number; y: number }) => ({
    opacity: 0,
    x: offset.x,
    y: offset.y,
  }),
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: { duration: 0.7, ease: EASE, staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

/** Eyebrow, heading, body, CTA — same move, staggered by the parent. */
const lineVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export const About: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /** Decoded frames and a parallel "is this one usable" table. Never state — see note 1. */
  const framesRef = useRef<(HTMLImageElement | null)[]>([]);
  const readyRef = useRef<boolean[]>([]);

  /** Frame the scroll wants, frame the canvas is showing, and the pending rAF handle. */
  const targetRef = useRef(0);
  const drawnRef = useRef(-1);
  const rafRef = useRef(0);

  /** Mirrors panelIndex so the scroll callback can compare without reading state. */
  const panelRef = useRef(0);

  /** Mirrors `revealed`, so the loop can compare without reading state. */
  const revealRef = useRef(false);

  /** Frames decoded so far. Read by the debug HUD only. */
  const loadedRef = useRef(0);

  const [panelIndex, setPanelIndex] = useState(0);

  /** Whether the scene has established enough for the first panel to come in. */
  const [revealed, setRevealed] = useState(false);
  const [source, setSource] = useState<Source | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [debug, setDebug] = useState({ frame: 0, drawn: -1, loaded: 0 });

  /**
   * Whether the sequence has been allowed to start downloading.
   *
   * Load-bearing for the rest of the page, not just for this section. The component
   * mounts with the document, so an ungated loader pulls ~18 MB of frames while the
   * visitor is still reading the hero, competing with the globe's textures and the
   * fonts for bandwidth on the one connection that matters. The gate below opens a full
   * viewport before the section arrives, which is far more warning than the coarse
   * ladder needs.
   */
  const [armed, setArmed] = useState(false);

  /** Whether the section is within a viewport of the screen, gating the measuring loop. */
  const [near, setNear] = useState(false);

  /* ---------------------------------------------------------------- scroll progress */

  /*
   * Progress is measured here rather than taken from framer-motion's useScroll.
   *
   * Two reasons, and the second is the one that matters. First, this section already
   * owns an animation frame for the canvas, so reading one rect in that same frame is
   * cheaper than maintaining a parallel scroll subscription. Second, useScroll caches
   * the target's position and refreshes it on resize; this page mutates its own height
   * above the section as the hero's textures and fonts land, and a cached offset taken
   * before that settles maps scroll positions onto the wrong range — the sequence then
   * sits pinned at one end and never advances.
   *
   * Measuring getBoundingClientRect() every frame cannot go stale: the rect is relative
   * to the viewport, so it already accounts for anything that moved above it. It is also
   * indifferent to how scrolling is driven, which matters because Lenis owns the scroll
   * on this site and only GSAP is explicitly wired to it.
   *
   * `progress`  0 when the track's top hits the viewport top, 1 when its bottom does.
   * `approach`  0 while the section is a full viewport below, 1 as its top edge lands.
   */
  const progress = useMotionValue(0);
  const entryT = useMotionValue(1);

  // In on the approach, out on the way through; the mirror image on the far side.
  /*
   * The bridge, as a gradient string rather than an opacity. Stops are in px so the band
   * is the same physical depth on any viewport, and the first stop is always the solid
   * colour — that invariant is the whole fix.
   */
  const bridgeBackground = useTransform(entryT, (t) => {
    if (t <= 0.002) return "none";
    const ramp = t * BRIDGE_MAX;
    const solid = ramp * BRIDGE_SOLID;
    return (
      `linear-gradient(180deg, ${ENTRY_SURFACE} 0px, ${ENTRY_SURFACE} ${solid.toFixed(1)}px, ` +
      `rgba(251,251,250,0) ${ramp.toFixed(1)}px)`
    );
  });

  const exitOpacity = useTransform(progress, [0.88, 1], [0, 1]);
  const scrollYProgress = progress;

  // Parallax. Both tiny, and in opposite directions, which is all it takes to separate
  // the card from the footage without anything reading as "moving".
  const cardY = useTransform(scrollYProgress, [0, 1], [26, -26]);

  /* ------------------------------------------------------------------ environment */

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Only swap encodes when the breakpoint is actually crossed. Setting state on every
    // resize tick would restart the whole load.
    let currentDir: string | null = null;

    const pick = () => {
      setReducedMotion(motionQuery.matches);
      const next = window.innerWidth < 768 ? SOURCES.narrow : SOURCES.wide;
      if (next.dir !== currentDir) {
        currentDir = next.dir;
        setSource(next);
      }
    };

    pick();
    window.addEventListener("resize", pick);
    motionQuery.addEventListener("change", pick);
    return () => {
      window.removeEventListener("resize", pick);
      motionQuery.removeEventListener("change", pick);
    };
  }, []);

  /* ---------------------------------------------------------------------- drawing */

  /** Closest decoded frame to `index`, or -1 if nothing has arrived yet. See note 2. */
  const nearestReady = useCallback((index: number) => {
    const ready = readyRef.current;
    if (ready[index]) return index;
    for (let d = 1; d < TOTAL_FRAMES; d += 1) {
      if (index - d >= 0 && ready[index - d]) return index - d;
      if (index + d < TOTAL_FRAMES && ready[index + d]) return index + d;
    }
    return -1;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const index = nearestReady(targetRef.current);
    if (index < 0 || index === drawnRef.current) return;

    const img = framesRef.current[index];
    if (!img) return;

    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // Resizing the backing store clears it, so only touch it when it actually changed.
    const wantW = Math.round(rect.width * dpr);
    const wantH = Math.round(rect.height * dpr);
    if (canvas.width !== wantW || canvas.height !== wantH) {
      canvas.width = wantW;
      canvas.height = wantH;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // object-fit: cover, by hand.
    const imgRatio = img.width / img.height;
    const boxRatio = rect.width / rect.height;
    let w = rect.width;
    let h = rect.height;
    let x = 0;
    let y = 0;
    if (boxRatio > imgRatio) {
      h = rect.width / imgRatio;
      y = (rect.height - h) / 2;
    } else {
      w = rect.height * imgRatio;
      x = (rect.width - w) / 2;
    }

    // No clearRect: the frame covers the box, and clearing first is what produces a
    // one-frame flash of transparency on a slow paint.
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();

    drawnRef.current = index;
  }, [nearestReady]);

  /**
   * Deferred draw, for callers outside the measuring loop — an image landing while the
   * section is off screen, or a resize. Coalesces to at most one draw per frame; the
   * loop calls draw() directly because it is already inside one.
   */
  const requestDraw = useCallback(
    (force = false) => {
      if (force) drawnRef.current = -1;
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        draw();
      });
    },
    [draw]
  );

  /* ---------------------------------------------------------------------- loading */

  /*
   * One observer, two jobs. `armed` latches on first approach and starts the download;
   * `near` tracks continuously and is what starts and stops the measuring loop, so the
   * rest of the page never pays for a layout read on a section that is nowhere near the
   * screen. The margin gives a full viewport of warning in both directions.
   */
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        setNear(visible);
        if (visible) setArmed(true);
      },
      { rootMargin: "100% 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!source || !armed) return;

    const frames: (HTMLImageElement | null)[] = new Array(TOTAL_FRAMES).fill(null);
    const ready: boolean[] = new Array(TOTAL_FRAMES).fill(false);
    framesRef.current = frames;
    readyRef.current = ready;
    drawnRef.current = -1;
    loadedRef.current = 0;

    // Which frames this device actually uses.
    const indices: number[] = [];
    for (let i = 0; i < TOTAL_FRAMES; i += source.step) indices.push(i);

    /*
     * Load order: a coarse ladder across the whole sequence first, then everything else
     * front to back. The ladder is what makes an early scrub work — sixteen frames in,
     * every scroll position already has something within a few frames of it to show.
     */
    const queue: number[] = [];
    const queued = new Set<number>();
    const stride = Math.max(1, Math.floor(indices.length / LADDER_STOPS));
    for (let i = 0; i < indices.length; i += stride) {
      queue.push(indices[i]);
      queued.add(indices[i]);
    }
    for (const i of indices) if (!queued.has(i)) queue.push(i);

    let cancelled = false;
    let cursor = 0;
    let inFlight = 0;

    const pump = () => {
      if (cancelled) return;
      while (inFlight < LOAD_CONCURRENCY && cursor < queue.length) {
        const index = queue[cursor++];
        const img = new Image();
        // Decoding off the main thread is the difference between a smooth first scroll
        // and a stutter every time a frame lands.
        img.decoding = "async";
        img.src = `/frames/about-sequence/${source.dir}/frame_${String(index).padStart(4, "0")}.webp`;
        inFlight += 1;

        const settle = (ok: boolean) => {
          if (cancelled) return;
          inFlight -= 1;
          if (ok) {
            frames[index] = img;
            ready[index] = true;
            loadedRef.current += 1;
            // Only worth a repaint if this frame is a better match than what is up.
            const showing = drawnRef.current;
            const want = targetRef.current;
            if (showing < 0 || Math.abs(index - want) < Math.abs(showing - want)) {
              requestDraw();
            }
          }
          pump();
        };

        img.onload = () => settle(true);
        img.onerror = () => settle(false);
      }
    };

    pump();

    return () => {
      cancelled = true;
    };
  }, [source, armed, requestDraw]);

  /* ------------------------------------------------------- scroll -> frame + panel */

  /*
   * The driver. One animation frame, running only while the section is near the
   * viewport, that measures the track and fans the result out to everything downstream:
   * the canvas, the panel index, the parallax and the entry fade all read the same
   * number from the same frame, so nothing can disagree about where the story is.
   *
   * Runs off rAF rather than a scroll listener on purpose. Lenis animates the scroll
   * position on its own rAF; a scroll-event subscriber sees that a frame late and in
   * bursts, which is what makes a scrubbed sequence look like it is catching up.
   */
  useEffect(() => {
    if (reducedMotion || !near) return;

    let frame = 0;

    const tick = () => {
      frame = requestAnimationFrame(tick);

      const node = containerRef.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();
      const viewport = window.innerHeight;

      // Entirely off screen, in either direction: nothing to update.
      if (rect.bottom < -viewport || rect.top > viewport * 2) return;

      // How far the pinned viewport has travelled through the track.
      const span = rect.height - viewport;
      const raw = span > 0 ? -rect.top / span : 0;
      const p = raw < 0 ? 0 : raw > 1 ? 1 : raw;

      // How close the section is to landing, for the white-to-dark approach.
      /*
       * Bridge length, in two joined phases so it never jumps:
       *
       *   approaching (rect.top from one viewport down to 0)  1 -> BRIDGE_AT_PIN
       *   pinned      (progress 0 -> BRIDGE_TAIL)             BRIDGE_AT_PIN -> 0
       *
       * Splitting at the pin is what removes the pop. If the bridge finished exactly as
       * the section pinned, a 180px band of daylight would vanish in one frame; carrying
       * the remainder a little way into the track lets the last of it recede instead.
       */
      let t;
      if (rect.top > 0) {
        const toGo = rect.top / viewport;
        t = BRIDGE_AT_PIN + (1 - BRIDGE_AT_PIN) * (toGo > 1 ? 1 : toGo);
      } else {
        const spent = -rect.top / BRIDGE_TAIL_PX;
        t = BRIDGE_AT_PIN * (1 - (spent > 1 ? 1 : spent));
      }
      entryT.set(t);

      if (progress.get() !== p) progress.set(p);

      const wanted = Math.round(p * (TOTAL_FRAMES - 1));
      if (wanted !== targetRef.current) {
        targetRef.current = wanted;
        draw();
        if (SHOW_FRAME_DEBUG) {
          setDebug({
            frame: wanted,
            drawn: drawnRef.current,
            loaded: loadedRef.current,
          });
        }
      }

      // Contiguous by construction — see note 4 — but the cuts are the measured ones
      // from the STAGE ANALYSIS rather than even quarters, so each stage changes where
      // the footage's composition actually changes. Walking down finds the last stage
      // whose start we have passed, which covers every p in exactly one stage.
      let next = 0;
      for (let i = PANELS.length - 1; i >= 0; i -= 1) {
        if (p >= PANELS[i].at) { next = i; break; }
      }
      if (next !== panelRef.current) {
        panelRef.current = next;
        setPanelIndex(next);
      }

      // The first panel waits for the environment rather than arriving with it. Two
      // booleans a scroll apart, so this is two renders for the whole page life.
      const show = p > REVEAL_AT;
      if (show !== revealRef.current) {
        revealRef.current = show;
        setRevealed(show);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reducedMotion, near, entryT, progress, draw]);

  /* ------------------------------------------------------------- resize + teardown */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(() => requestDraw(true));
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [requestDraw]);

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  /* ----------------------------------------------------------------------- markup */

  /*
   * One stage of type. No card: the block is placed in the frame's negative space and
   * the words sit directly on the footage, carried by the zone scrim behind them and a
   * shadow on the glyphs. Every stage is mounted at all times and cross-fades in place,
   * which is what keeps the background from ever restarting when the content changes.
   */
  const stage = (panel: Panel, index: number, isActive: boolean) => (
    <motion.div
      key={panel.label}
      custom={OFFSET[panel.zone]}
      variants={panelVariants}
      initial="hidden"
      animate={isActive ? "visible" : "hidden"}
      aria-hidden={!isActive}
      className={`absolute inset-0 flex px-6 md:px-0 ${PLACE[panel.zone]}`}
      style={{ pointerEvents: isActive ? "auto" : "none" }}
    >
      <div className="w-full max-w-[460px]">
        {/*
          Number, rule, label on ONE row — the pattern this component already used before
          the section became cinematic, and the same one the hero eyebrow uses. Stacking
          them reads as a poster credit; the site's own language is a single quiet line.
          Sizes and tracking are the site's verbatim: mono 11px, 600, 0.22em.
        */}
        <motion.div variants={lineVariants} className="flex items-center gap-4">
          <span className="font-mono text-[11px] tabular-nums text-[#D4AF37]/80">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="h-px w-10 bg-[#B8860B]/50" />
          <p
            className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[#D4AF37]"
            style={{ textShadow: INK_SHADOW }}
          >
            {panel.label}
          </p>
        </motion.div>

        {/*
          24-32px, not the 28-44px it was. The site's section headings run larger than
          this, but they are section headings; this is a panel inside one, and the scale
          that fits is the one this component used for the same content before — text-2xl
          rising to text-3xl. font-geist semibold at -0.035em is the house setting; the
          leading is ordinary 1.25 rather than the 1.05 the display sizes use, because
          tight leading on 28px type is what makes it read as a pull quote.

          No forced breaks anywhere — the 460px measure does the wrapping.
        */}
        <motion.h2
          variants={lineVariants}
          className="mt-5 font-geist text-[clamp(1.5rem,2.2vw,2rem)] font-semibold leading-[1.25] tracking-[-0.035em] text-white"
          style={{ textShadow: INK_SHADOW }}
        >
          {panel.heading}
        </motion.h2>

        {/* #B8BCC8 is the site's body colour on dark surfaces, from the hero. */}
        <motion.p
          variants={lineVariants}
          className="mt-4 text-base font-normal leading-[1.6] text-[#B8BCC8] sm:text-[17px]"
          style={{ textShadow: INK_SHADOW }}
        >
          {panel.body}
        </motion.p>

        {panel.items && (
          <motion.ul
            variants={lineVariants}
            className="mt-5 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2"
            style={{ textShadow: INK_SHADOW }}
          >
            {panel.items.map((item, itemIndex) => (
              <li key={item} className="flex items-baseline gap-3">
                <span className="font-mono text-[11px] tabular-nums text-[#D4AF37]/80">
                  {String(itemIndex + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-medium text-white/85">{item}</span>
              </li>
            ))}
          </motion.ul>
        )}

        {panel.cta && (
          <motion.div variants={lineVariants} className="mt-7">
            {/*
              The site's button, not a new one. Same fill, radius, padding, type and hover
              as the CTA this component shipped with and as the hero's primary action.
            */}
            <Link
              href={panel.cta.href}
              tabIndex={isActive ? 0 : -1}
              className="group inline-flex items-center gap-2 rounded-md bg-[#B8860B] px-6 py-3 font-sans text-sm font-semibold text-[#0B1F3A] transition-colors duration-200 hover:bg-[#D4AF37] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8860B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050C18]"
            >
              {panel.cta.label}
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </motion.div>
        )}
      </div>
    </motion.div>
  );

  /*
   * Reduced motion. Not the old white stacked block — the section keeps its cinematic
   * identity, over one still frame, with every panel present at once and nothing moving.
   */
  if (reducedMotion) {
    return (
      <section id="about" className="relative w-full bg-[#050C18] font-sans text-white">
        <div className="absolute inset-0 overflow-hidden">
          <picture>
            <source
              media="(max-width: 767px)"
              srcSet="/frames/about-sequence/w720/frame_0150.webp"
            />
            <img
              src="/frames/about-sequence/w1280/frame_0150.webp"
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover"
            />
          </picture>
          <div className="absolute inset-0 bg-[#050C18]/85" />
        </div>

        <div className="container-editorial relative z-10 flex flex-col gap-10 py-24">
          {PANELS.map((panel, index) => (
            <div
              key={panel.label}
              className="rounded-2xl border border-white/[0.12] bg-[rgba(7,12,22,0.72)] p-7 md:p-9"
            >
              <div className="flex items-center gap-4">
                <span className="font-mono text-xs tabular-nums text-[#D4AF37]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="h-px w-10 bg-[#B8860B]/50" />
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">
                  {panel.label}
                </p>
              </div>
              <h2 className="mt-6 font-geist text-[clamp(1.6rem,2.6vw,2.4rem)] font-semibold leading-[1.12] tracking-[-0.035em] text-white">
                {panel.heading}
              </h2>
              <p className="mt-5 text-[15px] leading-relaxed text-white/70 md:text-base">
                {panel.body}
              </p>
              {panel.items && (
                <ul className="mt-6 grid grid-cols-1 gap-3 border-t border-white/10 pt-6 sm:grid-cols-2">
                  {panel.items.map((item, itemIndex) => (
                    <li key={item} className="flex items-center gap-3">
                      <span className="font-mono text-xs tabular-nums text-[#D4AF37]">
                        {String(itemIndex + 1).padStart(2, "0")}
                      </span>
                      <span className="text-sm font-medium text-white/85">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              {panel.cta && (
                <div className="mt-8">
                  <Link
                    href={panel.cta.href}
                    className="inline-flex items-center gap-2 rounded-md bg-[#B8860B] px-6 py-3 font-sans text-sm font-semibold text-[#0B1F3A]"
                  >
                    {panel.cta.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      id="about"
      ref={containerRef}
      /*
        The overlap, and it needs both halves to work.

        -mt-16/-mt-20 pulls the section up into the previous one, so the join — and the
        1px border-b that section draws — sits INSIDE this section's bridge rather than
        at its edge. 64/80px is inside the previous section's own py-20 lg:py-28 bottom
        padding, so nothing of its content is covered.

        z-30 is the half that is easy to miss: the previous section is wrapped in
        "relative z-20" by the page, so at the default z-index this section paints UNDER
        it and the overlap is invisible — the boundary would stay exactly where it was.
      */
      className="relative z-30 -mt-16 w-full bg-[#050C18] font-sans text-white h-[560vh] md:h-[740vh]"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/*
          Poster. Plain <picture>, so it is in the server HTML and paints before any
          JavaScript runs; the canvas sits directly on top and covers it from the first
          draw onward. This is what removes the blank-canvas flash on a cold load, and it
          costs one frame-sized request that the sequence loader would have made anyway.
        */}
        <picture>
          <source
            media="(max-width: 767px)"
            srcSet="/frames/about-sequence/w720/frame_0000.webp"
          />
          <img
            src="/frames/about-sequence/w1280/frame_0000.webp"
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </picture>

        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

        {/*
          A light, even wash — enough to seat the type's contrast floor across the whole
          frame without flattening it. The heavy directional gradients that used to live
          here existed to back a card on the left; with the card gone and the type moving
          between stages, the darkening moves with it instead (see the scrims below).
        */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "rgba(5,12,24,0.20)" }}
        />

        {/*
          The zone scrims. All three are mounted and only the active stage's is lit, so
          the darkening slides around the frame as the story moves rather than switching.
        */}
        {(Object.keys(SCRIM) as Zone[]).map((zone) => (
          <motion.div
            key={zone}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ background: SCRIM[zone] }}
            animate={{ opacity: PANELS[panelIndex].zone === zone && revealed ? 1 : 0 }}
            transition={{ duration: 0.9, ease: EASE }}
          />
        ))}

        {/* Vignette, and a top band so the fixed navbar always has something to sit on. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(125% 105% at 50% 45%, rgba(5,12,24,0) 42%, rgba(5,12,24,0.42) 78%, rgba(5,12,24,0.68) 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-32"
          style={{
            background:
              "linear-gradient(180deg, rgba(5,12,24,0.75) 0%, rgba(5,12,24,0) 100%)",
          }}
        />

        {/* Content. pt clears the fixed navbar so a tall panel never runs under it. */}
        {/*
          The type layer. Full-bleed rather than a centred container: each stage places
          itself in the frame, so there is no shared column for them to sit in.
        */}
        <motion.div style={{ y: cardY }} className="absolute inset-0 z-20">
          {PANELS.map((panel, index) =>
            stage(panel, index, index === panelIndex && revealed)
          )}
        </motion.div>



        {SHOW_FRAME_DEBUG && (
          <div className="absolute right-8 top-24 z-30 space-y-1 rounded-lg border border-white/10 bg-black/60 px-4 py-3 font-mono text-[11px] leading-tight text-[#D4AF37] backdrop-blur-md">
            <div>FRAME {String(debug.frame + 1).padStart(3, "0")} / {TOTAL_FRAMES}</div>
            <div className="text-white/60">
              drawn {debug.drawn} · loaded {debug.loaded}
            </div>
            <div className="text-white/60">
              {source ? source.dir : "no source"} · {armed ? "armed" : "idle"} ·{" "}
              {near ? "near" : "far"}
            </div>
          </div>
        )}

        {/*
          The approach. A pane of the previous section's own surface, held over the
          footage and dissolved as the section rises into place, so the page darkens into
          the mine instead of cutting to it. Above the content, below nothing.
        */}
        {/*
          The bridge. Anchored to the top of the sticky viewport, which during the
          approach is the top of the section — i.e. up inside the previous section. No
          opacity of its own: it dissolves by moving its own gradient stops, so the top
          of the band is the previous section's colour at every scroll position and the
          join is buried in it.
        */}
        <motion.div
          aria-hidden="true"
          style={{ background: bridgeBackground, height: BRIDGE_MAX + OVERLAP }}
          className="pointer-events-none absolute inset-x-0 top-0 z-40"
        />

        {/*
          The way out. The same dissolve mirrored: solid at the BOTTOM, so the next
          section's surface rises into the frame from below and meets its own real
          background with nothing between them.
        */}
        <motion.div
          aria-hidden="true"
          style={{
            opacity: exitOpacity,
            background: `linear-gradient(0deg, ${EXIT_SURFACE} 0%, ${EXIT_SURFACE} 38%, rgba(244,244,242,0.86) 100%)`,
          }}
          className="pointer-events-none absolute inset-0 z-40"
        />
      </div>
    </section>
  );
};

export default About;
