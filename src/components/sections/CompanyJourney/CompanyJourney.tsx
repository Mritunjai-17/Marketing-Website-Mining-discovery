"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./CompanyJourney.module.css";

interface MilestoneData {
  year: string;
  label: string;
  title: string;
  text: string;
}

const MILESTONES: MilestoneData[] = [
  {
    year: "2022",
    label: "THE BEGINNING",
    title: "FOUNDATION OF MINING MEDIA",
    text: "Mining Discovery launched as a digital mining news platform in Chandigarh.",
  },
  {
    year: "2023",
    label: "THE EXPANSION",
    title: "MULTI-CHANNEL MEDIA PLATFORM",
    text: "Expanded into newsletters, monthly magazines, and an interactive digital platform.",
  },
  {
    year: "2024",
    label: "THE TRANSFORMATION",
    title: "BRANDING & INVESTOR ENGAGEMENT",
    text: "Began offering investor campaigns, digital branding, and conference media coverage.",
  },
  {
    year: "2025",
    label: "THE EVOLUTION",
    title: "FULL-SERVICE DIGITAL MEDIA & INVESTOR ENGAGEMENT",
    text: "Operating as a full-service digital media and investor-engagement agency.",
  },
  {
    year: "2026",
    label: "FUTURE HORIZON",
    title: "THE JOURNEY CONTINUES",
    text: "Expanding global investor networks, AI-driven mining intelligence, and strategic media operations.",
  },
];

const LAST = MILESTONES.length - 1;

/*
 * One span is the world distance between two consecutive milestones, and it is the unit
 * everything else is expressed in: the road's wave period, how far the world travels per
 * milestone, and how far a story parallaxes. Keeping a single unit is what makes the road
 * and the content read as one moving scene rather than two animations that happen to run
 * at the same time.
 *
 * PAD only keeps the first milestone's `left` positive inside the world; the road is
 * positioned independently, so it costs nothing.
 */
const PAD = 1;

interface Metrics {
  vw: number;
  span: number;
  /** Road tile width in px. Always an even multiple of span — see the wrap in `render`. */
  tile: number;
  roadH: number;
  path: string;
}

/**
 * The road is drawn once as a tile and then wrapped, never redrawn.
 *
 * Each span is two cubics: anchor → crest → next anchor. Both control handles at an
 * anchor are horizontal (`c` on both ends of the handle), and so are the handles at the
 * crest, which makes the curve C1-continuous at every joint — the road has no kinks, and
 * more importantly it is exactly level where a milestone sits, so the gold marker meets a
 * flat surface instead of a slope. Crests alternate up/down, which is why the tile is an
 * even number of spans and why the wrap below is modulo *two* spans: shifting by the full
 * period lands on pixel-identical geometry, so the wrap is invisible.
 */
function buildRoadPath(span: number, spans: number, c: number, amp: number): string {
  const anchorHandle = span * 0.3;
  const crestHandle = span * 0.24;

  let d = `M 0 ${c}`;

  for (let j = 0; j < spans; j++) {
    const x0 = j * span;
    const xm = x0 + span / 2;
    const x1 = x0 + span;
    const y = j % 2 === 0 ? c - amp : c + amp;

    d += ` C ${x0 + anchorHandle} ${c}, ${xm - crestHandle} ${y}, ${xm} ${y}`;
    d += ` C ${xm + crestHandle} ${y}, ${x1 - anchorHandle} ${c}, ${x1} ${c}`;
  }

  return d;
}

function measure(): Metrics {
  const vw = window.innerWidth;
  const mobile = vw < 768;

  // Span drives the crossing: at the midpoint of a transition the outgoing and incoming
  // stories sit half a span either side of centre, so span has to clear the column width
  // for the two never to share the middle of the stage. On a phone the column is nearly
  // as wide as the screen, which is why that side travels more than a full viewport per
  // milestone while the desktop side travels a little less.
  const span = mobile
    ? Math.max(340, Math.min(vw * 1.15, 620))
    : Math.max(760, Math.min(vw * 0.86, 1240));

  const roadH = mobile ? 200 : 320;
  const amp = mobile ? 44 : 78;

  // The tile has to cover the viewport for every wrap offset in [0, 2·span): worst case
  // needs vw + 2·span of road. Rounded up to an even span count to keep crest parity.
  const spans = 2 * Math.ceil((vw / span + 2) / 2);

  return { vw, span, tile: span * spans, roadH, path: buildRoadPath(span, spans, roadH / 2, amp) };
}

export function CompanyJourney() {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const roadRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const yearRefs = useRef<(HTMLDivElement | null)[]>([]);
  const detailRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Metrics live in both a ref and state on purpose: the scrub loop reads the ref every
  // frame without re-rendering, while the state is what lets the markup lay the road and
  // the milestone columns out again after a resize.
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const metricsRef = useRef<Metrics | null>(null);
  const posRef = useRef(0);

  /*
   * The whole scene, written straight to the DOM.
   *
   * `pos` is a float milestone index — 1.4 means "40% of the way from 2023 to 2024" — so
   * every value below is a pure function of scroll position. Stop mid-transition and the
   * scene stops with it. Nothing here goes through React state: this runs on every
   * scrubbed frame, and a re-render per frame is what made the previous version stutter.
   */
  const render = useCallback((pos: number) => {
    posRef.current = pos;

    const m = metricsRef.current;
    if (!m) return;

    const { span, vw } = m;

    // World travel. One transform carries road and stories alike, so they cannot drift.
    const tx = vw / 2 - (PAD + pos) * span;
    if (worldRef.current) {
      worldRef.current.style.transform = `translate3d(${tx.toFixed(2)}px, 0, 0)`;
    }

    // Road travel: identical velocity, wrapped by one full wave period so a finite tile
    // reads as an endless route. Same frame as the world, so the two stay locked.
    if (roadRef.current) {
      const period = span * 2;
      const wrapped = ((tx % period) + period) % period;
      roadRef.current.style.transform = `translate3d(${(wrapped - period).toFixed(2)}px, 0, 0)`;
    }

    for (let i = 0; i < MILESTONES.length; i++) {
      // Positive = travelled behind the viewer, negative = still approaching.
      const d = pos - i;
      const dist = Math.abs(d);
      const behind = d > 0;

      // Departing milestones fall away harder than arriving ones, so the eye is pulled
      // forward into the story that is coming rather than back to the one that left.
      const opacity = behind
        ? Math.max(0.1, 1 - dist * 0.9)
        : Math.max(0.16, 1 - dist * 0.75);
      const scale = behind
        ? Math.max(0.84, 1 - dist * 0.16)
        : Math.max(0.9, 1 - dist * 0.09);

      // Parallax against the road: the year leads it slightly, the detail lags slightly.
      // Both are multiples of `d`, so at the active milestone (d = 0) they collapse to
      // zero and the column is perfectly stacked — the split only exists mid-travel.
      const yearShift = -d * span * 0.1;
      const detailShift = d * span * 0.05;

      const yearEl = yearRefs.current[i];
      if (yearEl) {
        yearEl.style.opacity = `${opacity}`;
        yearEl.style.transform = `translate3d(calc(-50% + ${yearShift.toFixed(1)}px), 0, 0) scale(${scale.toFixed(3)})`;
      }

      const detailEl = detailRefs.current[i];
      if (detailEl) {
        detailEl.style.opacity = `${opacity}`;
        detailEl.style.transform = `translate3d(calc(-50% + ${detailShift.toFixed(1)}px), 0, 0) scale(${scale.toFixed(3)})`;
      }
    }

    if (railRef.current) {
      railRef.current.style.transform = `scaleX(${(pos / LAST).toFixed(4)})`;
    }
  }, []);

  // Measure on mount, then only when the width actually changes. Height-only resizes are
  // the mobile URL bar sliding, and rebuilding the road for those would thrash mid-scroll.
  useEffect(() => {
    let lastWidth = -1;

    const sync = () => {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;

      const next = measure();
      metricsRef.current = next;
      setMetrics(next);
      // Repaint where the journey already is, not at the start: a resize mid-section
      // must not throw the viewer back to 2022.
      render(posRef.current);
    };

    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [render]);

  useEffect(() => {
    if (!metrics) return;

    const area = scrollAreaRef.current;
    if (!area) return;

    // The reduced-motion layout is a separate, statically laid out tree that CSS swaps in
    // (see the module's prefers-reduced-motion block). All that is left to do here is not
    // drive a scene nobody can see.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const proxy = { p: 0 };

      /*
       * Pinning is CSS `position: sticky` on the viewport, not ScrollTrigger's `pin`.
       * Both would fight each other — the old version had them both on at once — and
       * sticky is what the rest of this site already uses, so it needs no pin-spacer
       * injected into the page around this section.
       *
       * ScrollTrigger's job is purely to scrub. A small scrub value rather than `true`
       * adds a touch of trailing ease on top of Lenis so a flicked wheel arrives instead
       * of snapping; the scene still settles exactly where scrolling stopped.
       */
      gsap.to(proxy, {
        p: 1,
        ease: "none",
        scrollTrigger: {
          trigger: area,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
        onUpdate: () => render(proxy.p * LAST),
      });
    }, area);

    return () => ctx.revert();
  }, [metrics, render]);

  return (
    <section className={styles.section} id="company-journey">
      {/* INTRO — sits above the journey and scrolls away normally. */}
      <div className={styles.intro}>
        <span className={styles.eyebrow}>OUR EVOLUTION</span>
        <h2 className={styles.introTitle}>
          FROM MINING NEWS
          <br />
          TO GLOBAL <span className={styles.introTitleAccent}>INFLUENCE.</span>
        </h2>
      </div>

      {/* JOURNEY SCROLL AREA — its height is the length of the journey. */}
      <div ref={scrollAreaRef} className={styles.scrollArea}>
        <div className={styles.viewport}>
          <div className={styles.stage} style={{ opacity: metrics ? 1 : 0 }}>
            {/* MOVING ROAD */}
            <div
              ref={roadRef}
              className={styles.road}
              style={{
                width: metrics?.tile,
                height: metrics?.roadH,
                // Centre the tile's centreline on the stage's road line. Kept here rather
                // than in CSS so the road's height has one source of truth.
                top: metrics ? `calc(var(--road-y) - ${metrics.roadH / 2}px)` : undefined,
              }}
              aria-hidden="true"
            >
              {metrics && (
                <svg
                  className={styles.roadSvg}
                  width={metrics.tile}
                  height={metrics.roadH}
                  viewBox={`0 0 ${metrics.tile} ${metrics.roadH}`}
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path className={styles.roadEdge} d={metrics.path} />
                  <path className={styles.roadSurface} d={metrics.path} />
                  <path className={styles.roadCentreLine} d={metrics.path} />
                </svg>
              )}
            </div>

            {/* MILESTONE TRACK — the mask is on the static wrapper, not on the moving
                track, so stories dissolve at the viewport edges while the road stays
                solid all the way out of frame. */}
            <div className={styles.trackMask}>
              <div ref={worldRef} className={styles.milestoneTrack}>
                {MILESTONES.map((milestone, i) => (
                  <div
                    key={milestone.year}
                    className={styles.milestone}
                    style={{ left: metrics ? (PAD + i) * metrics.span : 0 }}
                  >
                    {/* ABOVE THE ROAD — the year, and the marker that ties it down. */}
                    <div
                      ref={(el) => {
                        yearRefs.current[i] = el;
                      }}
                      className={styles.yearBlock}
                    >
                      <div className={styles.year}>{milestone.year}</div>
                      <div className={styles.marker}>
                        <span className={styles.markerStem} />
                        <span className={styles.markerDot} />
                      </div>
                    </div>

                    {/* BELOW THE ROAD — the story. */}
                    <div
                      ref={(el) => {
                        detailRefs.current[i] = el;
                      }}
                      className={styles.detailBlock}
                    >
                      <p className={styles.label}>{milestone.label}</p>
                      <h3 className={styles.storyTitle}>{milestone.title}</h3>
                      <p className={styles.storyText}>{milestone.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Journey progress. A hairline, not a control — a 580vh pin needs to say how
              far along it is. */}
          <div className={styles.rail} aria-hidden="true">
            <div ref={railRef} className={styles.railFill} />
          </div>
        </div>
      </div>

      {/* REDUCED MOTION — same content, no travel. Swapped in by CSS so there is no
          hydration flash and no duplicate reading of the text. */}
      <div className={styles.staticJourney}>
        {MILESTONES.map((milestone) => (
          <div key={milestone.year} className={styles.staticItem}>
            <div className={styles.year}>{milestone.year}</div>
            <div className={styles.staticRoad} aria-hidden="true" />
            <p className={styles.label}>{milestone.label}</p>
            <h3 className={styles.storyTitle}>{milestone.title}</h3>
            <p className={styles.storyText}>{milestone.text}</p>
          </div>
        ))}
      </div>

      {/* OUTRO */}
      <div className={styles.outro}>
        <h3 className={styles.outroHeadline}>
          FROM A MINING NEWS PLATFORM
          <br />
          TO A GLOBAL MEDIA &amp; INVESTOR ENGAGEMENT PARTNER.
        </h3>
        <p className={styles.outroCopy}>
          &ldquo;What started as a mining news platform evolved into an integrated
          ecosystem for media, branding, investor engagement and digital growth.&rdquo;
        </p>
      </div>
    </section>
  );
}

export default CompanyJourney;
