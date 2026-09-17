"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./CompanyJourney.module.css";

interface MilestoneData {
  year: string;
  chapter: string;
  label: string;
  title: string;
  text: string;
  meta: string;
}

const MILESTONES: MilestoneData[] = [
  {
    year: "2022",
    chapter: "01 — FOUNDATION",
    label: "THE BEGINNING",
    title: "FOUNDATION OF MINING MEDIA",
    text: "Mining Discovery launched as a digital mining news platform in Chandigarh.",
    meta: "DIGITAL NEWS · INDUSTRY INSIGHTS · CHANDIGARH",
  },
  {
    year: "2023",
    chapter: "02 — MEDIA EXPANSION",
    label: "THE EXPANSION",
    title: "MULTI-CHANNEL MEDIA PLATFORM",
    text: "Expanded into newsletters, monthly magazines, and an interactive digital platform.",
    meta: "MONTHLY MAGAZINES · NEWSLETTERS · DIGITAL SUITE",
  },
  {
    year: "2024",
    chapter: "03 — INDUSTRY ENGAGEMENT",
    label: "THE TRANSFORMATION",
    title: "BRANDING & INVESTOR ENGAGEMENT",
    text: "Began offering investor campaigns, digital branding, and conference media coverage.",
    meta: "INVESTOR CAMPAIGNS · CONFERENCES · BRAND STRATEGY",
  },
  {
    year: "2025",
    chapter: "04 — FULL-SERVICE EVOLUTION",
    label: "THE EVOLUTION",
    title: "FULL-SERVICE DIGITAL MEDIA & INVESTOR ENGAGEMENT",
    text: "Operating as a full-service digital media and investor-engagement agency.",
    meta: "FULL-SERVICE AGENCY · GLOBAL REACH · 360° DIGITAL",
  },
  {
    year: "FUTURE",
    chapter: "05 — WHAT COMES NEXT",
    label: "FUTURE HORIZON",
    title: "THE JOURNEY CONTINUES",
    text: "Expanding global investor networks, AI-driven mining intelligence, and strategic media operations.",
    meta: "GLOBAL INVESTOR NETWORKS · AI INTELLIGENCE · STRATEGIC MEDIA",
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
  const atmosphereRefs = useRef<(HTMLDivElement | null)[]>([]);
  const indicatorRefs = useRef<(HTMLDivElement | null)[]>([]);

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

      // Atmospheric background storytelling crossfade & subtle parallax drift
      const atmoEl = atmosphereRefs.current[i];
      if (atmoEl) {
        // Silky smoothstep transition peaking at d = 0, fading cleanly at distance >= 1
        const t = Math.max(0, 1 - dist);
        const smooth = t * t * (3 - 2 * t);
        const atmoShift = -d * 32;
        atmoEl.style.opacity = `${smooth.toFixed(3)}`;
        atmoEl.style.transform = `translate3d(${atmoShift.toFixed(1)}px, 0, 0)`;
      }

      // Subtle side indicator synchronization
      const indEl = indicatorRefs.current[i];
      if (indEl) {
        const isActive = dist < 0.45;
        const indWeight = Math.max(0, 1 - dist * 1.5);
        indEl.style.opacity = (0.28 + indWeight * 0.72).toFixed(3);
        const lineEl = indEl.children[0] as HTMLElement | undefined;
        if (lineEl) {
          lineEl.style.transform = `scaleX(${(0.4 + indWeight * 0.6).toFixed(2)})`;
          lineEl.style.backgroundColor = isActive ? "#B8924A" : "rgba(184, 146, 74, 0.35)";
        }
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
            {/* SUBTLE BACKGROUND STORYTELLING LAYER — HUMAN-DESIGNED EDITORIAL MOTIFS */}
            <div className={styles.atmosphereStage} aria-hidden="true">
              {/* 2022: Foundation — Authentic Geological Field Survey Drafting */}
              <div
                ref={(el) => {
                  atmosphereRefs.current[0] = el;
                }}
                className={styles.atmosphereLayer}
              >
                <svg
                  className={styles.atmosphereSvg}
                  viewBox="0 0 1440 900"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Subtle technical survey grid crosshairs (sparse, deliberate) */}
                  <g stroke="#171613" strokeWidth="0.8" strokeOpacity="0.08" vectorEffect="non-scaling-stroke">
                    <path d="M 180 170 L 180 186 M 172 178 L 188 178" />
                    <path d="M 520 130 L 520 146 M 512 138 L 528 138" />
                    <path d="M 940 160 L 940 176 M 932 168 L 948 168" />
                    <path d="M 1260 210 L 1260 226 M 1252 218 L 1268 218" />
                    <path d="M 320 740 L 320 756 M 312 748 L 328 748" />
                    <path d="M 1120 720 L 1120 736 M 1112 728 L 1128 728" />
                  </g>

                  {/* Geological elevation contour curves (flowing naturally like cartography) */}
                  <path d="M -40 150 C 220 110, 460 200, 760 140 C 1040 85, 1260 170, 1500 130" stroke="#171613" strokeWidth="1" strokeOpacity="0.08" strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />
                  <path d="M -30 220 C 270 190, 510 270, 800 210 C 1090 150, 1310 230, 1510 195" stroke="#B8924A" strokeWidth="1" strokeOpacity="0.12" vectorEffect="non-scaling-stroke" />
                  <path d="M -50 710 C 260 760, 540 680, 840 735 C 1140 785, 1330 715, 1500 750" stroke="#171613" strokeWidth="1" strokeOpacity="0.08" strokeDasharray="8 6" vectorEffect="non-scaling-stroke" />
                  <path d="M -20 780 C 290 830, 580 750, 880 810 C 1180 860, 1350 785, 1520 820" stroke="#B8924A" strokeWidth="1" strokeOpacity="0.10" vectorEffect="non-scaling-stroke" />

                  {/* Exploration survey borehole marker */}
                  <g transform="translate(180, 178)">
                    <circle cx="0" cy="0" r="14" stroke="#B8924A" strokeWidth="1" strokeOpacity="0.15" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
                    <circle cx="0" cy="0" r="3" fill="#B8924A" fillOpacity="0.22" />
                    <text x="24" y="4" fill="#343331" fillOpacity="0.12" fontSize="8.5" fontFamily="var(--font-mono, monospace)" letterSpacing="0.2em">SURVEY BASELINE // BH-01</text>
                  </g>

                  {/* Exploration technical annotations */}
                  <text x="180" y="240" fill="#343331" fillOpacity="0.11" fontSize="8.5" fontFamily="var(--font-mono, monospace)" letterSpacing="0.22em">DATUM: LAT 30.7333° N · LONG 76.7794° E</text>
                  <text x="180" y="258" fill="#B8924A" fillOpacity="0.13" fontSize="8" fontFamily="var(--font-mono, monospace)" letterSpacing="0.18em">ORIGIN: CHANDIGARH // ELEVATION 321M</text>
                  <text x="800" y="200" fill="#B8924A" fillOpacity="0.12" fontSize="8" fontFamily="var(--font-mono, monospace)" letterSpacing="0.18em">CONTOUR INDEX +10M</text>
                </svg>
              </div>

              {/* 2023: Media Expansion — Clean Editorial Grid & Publishing Architecture */}
              <div
                ref={(el) => {
                  atmosphereRefs.current[1] = el;
                }}
                className={styles.atmosphereLayer}
              >
                <svg
                  className={styles.atmosphereSvg}
                  viewBox="0 0 1440 900"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Modernist 12-Column Publication Hairline Grid */}
                  <g stroke="#171613" strokeWidth="0.8" strokeOpacity="0.05" vectorEffect="non-scaling-stroke">
                    <line x1="140" y1="80" x2="140" y2="820" />
                    <line x1="240" y1="80" x2="240" y2="820" strokeDasharray="3 5" />
                    <line x1="340" y1="80" x2="340" y2="820" />
                    <line x1="440" y1="80" x2="440" y2="820" strokeDasharray="3 5" />
                    <line x1="1000" y1="80" x2="1000" y2="820" strokeDasharray="3 5" />
                    <line x1="1100" y1="80" x2="1100" y2="820" />
                    <line x1="1200" y1="80" x2="1200" y2="820" strokeDasharray="3 5" />
                    <line x1="1300" y1="80" x2="1300" y2="820" />
                    <line x1="100" y1="140" x2="1340" y2="140" />
                    <line x1="100" y1="760" x2="1340" y2="760" />
                  </g>

                  {/* Publication spread bounding frame with architectural crop marks */}
                  <g transform="translate(160, 160)">
                    <path d="M -12 0 L 12 0 M 0 -12 L 0 12" stroke="#B8924A" strokeWidth="1" strokeOpacity="0.18" vectorEffect="non-scaling-stroke" />
                    <rect x="0" y="0" width="260" height="150" fill="none" stroke="#171613" strokeWidth="0.8" strokeOpacity="0.06" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
                    <text x="16" y="26" fill="#343331" fillOpacity="0.12" fontSize="8" fontFamily="var(--font-mono, monospace)" letterSpacing="0.22em">EDITORIAL MATRIX // 12-COL</text>
                    <line x1="16" y1="42" x2="200" y2="42" stroke="#B8924A" strokeWidth="1" strokeOpacity="0.12" vectorEffect="non-scaling-stroke" />
                    <line x1="16" y1="56" x2="230" y2="56" stroke="#171613" strokeWidth="0.8" strokeOpacity="0.06" vectorEffect="non-scaling-stroke" />
                    <line x1="16" y1="70" x2="210" y2="70" stroke="#171613" strokeWidth="0.8" strokeOpacity="0.06" vectorEffect="non-scaling-stroke" />
                    <text x="16" y="112" fill="#B8924A" fillOpacity="0.12" fontSize="7.5" fontFamily="var(--font-mono, monospace)" letterSpacing="0.18em">DIGITAL PUBLISHING // ISSUE SUITE</text>
                  </g>

                  {/* Newsletter & Digital broadcast frequency pulse */}
                  <g transform="translate(1080, 180)" stroke="#B8924A" strokeWidth="1.2" strokeOpacity="0.13" vectorEffect="non-scaling-stroke">
                    <line x1="0" y1="18" x2="0" y2="36" />
                    <line x1="8" y1="10" x2="8" y2="44" />
                    <line x1="16" y1="4" x2="16" y2="50" />
                    <line x1="24" y1="14" x2="24" y2="40" />
                    <line x1="32" y1="2" x2="32" y2="52" />
                    <line x1="40" y1="12" x2="40" y2="42" />
                    <line x1="48" y1="20" x2="48" y2="34" />
                    <text x="64" y="30" fill="#343331" fillOpacity="0.11" fontSize="8" fontFamily="var(--font-mono, monospace)" letterSpacing="0.2em">MEDIA BROADCAST // ARCHIVE</text>
                  </g>

                  <text x="140" y="790" fill="#343331" fillOpacity="0.10" fontSize="8" fontFamily="var(--font-mono, monospace)" letterSpacing="0.22em">FOLIO // VOL. 01 — MULTI-CHANNEL MEDIA PLATFORM</text>
                </svg>
              </div>

              {/* 2024: Industry Engagement — Sparse, Intentional Investor Syndicate Constellation */}
              <div
                ref={(el) => {
                  atmosphereRefs.current[2] = el;
                }}
                className={styles.atmosphereLayer}
              >
                <svg
                  className={styles.atmosphereSvg}
                  viewBox="0 0 1440 900"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Sparse connection vectors connecting key capital hubs */}
                  <g stroke="#B8924A" strokeWidth="0.9" strokeOpacity="0.11" vectorEffect="non-scaling-stroke">
                    <line x1="200" y1="220" x2="360" y2="160" />
                    <line x1="360" y1="160" x2="490" y2="230" />
                    <line x1="360" y1="160" x2="290" y2="300" strokeDasharray="3 3" />
                    <line x1="200" y1="220" x2="290" y2="300" />
                    <line x1="970" y1="180" x2="1120" y2="230" />
                    <line x1="1120" y1="230" x2="1270" y2="170" />
                    <line x1="1120" y1="230" x2="1190" y2="310" strokeDasharray="3 3" />
                  </g>

                  {/* Refined Node Dots */}
                  <g fill="#B8924A" fillOpacity="0.18">
                    <circle cx="200" cy="220" r="3.5" />
                    <circle cx="360" cy="160" r="4.5" stroke="#B8924A" strokeWidth="1" strokeOpacity="0.22" />
                    <circle cx="490" cy="230" r="3" />
                    <circle cx="290" cy="300" r="3.5" />
                    <circle cx="970" cy="180" r="3.5" />
                    <circle cx="1120" cy="230" r="5" stroke="#B8924A" strokeWidth="1" strokeOpacity="0.22" />
                    <circle cx="1270" cy="170" r="3.5" />
                    <circle cx="1190" cy="310" r="3" />
                  </g>

                  {/* Conference & Summit Geometry (Auditorium sightlines in lower left) */}
                  <g stroke="#171613" strokeWidth="0.8" strokeOpacity="0.07" vectorEffect="non-scaling-stroke">
                    <line x1="160" y1="810" x2="400" y2="710" />
                    <line x1="160" y1="845" x2="400" y2="745" />
                    <line x1="400" y1="710" x2="520" y2="710" />
                    <line x1="400" y1="745" x2="520" y2="745" />
                    <line x1="400" y1="710" x2="400" y2="745" />
                    <line x1="520" y1="710" x2="520" y2="745" />
                    <line x1="460" y1="710" x2="310" y2="630" strokeDasharray="3 4" stroke="#B8924A" strokeOpacity="0.10" />
                    <line x1="460" y1="710" x2="610" y2="630" strokeDasharray="3 4" stroke="#B8924A" strokeOpacity="0.10" />
                  </g>

                  {/* Technical Editorial Notes */}
                  <text x="200" y="195" fill="#343331" fillOpacity="0.12" fontSize="8" fontFamily="var(--font-mono, monospace)" letterSpacing="0.2em">INVESTOR HUB // SYNDICATE</text>
                  <text x="1120" y="258" fill="#B8924A" fillOpacity="0.14" fontSize="8" fontFamily="var(--font-mono, monospace)" letterSpacing="0.18em">CONFERENCE MEDIA COVERAGE</text>
                  <text x="160" y="790" fill="#343331" fillOpacity="0.10" fontSize="8" fontFamily="var(--font-mono, monospace)" letterSpacing="0.22em">SUMMIT SIGHTLINES // PDAC · MINING INDABA · IMARC</text>
                </svg>
              </div>

              {/* 2025: Full-Service Evolution — Integrated Ecosystem Architecture */}
              <div
                ref={(el) => {
                  atmosphereRefs.current[3] = el;
                }}
                className={styles.atmosphereLayer}
              >
                <svg
                  className={styles.atmosphereSvg}
                  viewBox="0 0 1440 900"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Concentric Full-Service Ecosystem Radar / Rings */}
                  <g transform="translate(240, 240)">
                    <circle cx="0" cy="0" r="64" stroke="#B8924A" strokeWidth="0.9" strokeOpacity="0.11" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
                    <circle cx="0" cy="0" r="110" stroke="#171613" strokeWidth="0.8" strokeOpacity="0.06" vectorEffect="non-scaling-stroke" />
                    <circle cx="0" cy="0" r="156" stroke="#B8924A" strokeWidth="0.8" strokeOpacity="0.07" strokeDasharray="2 5" vectorEffect="non-scaling-stroke" />
                    <line x1="-170" y1="0" x2="170" y2="0" stroke="#171613" strokeWidth="0.8" strokeOpacity="0.05" vectorEffect="non-scaling-stroke" />
                    <line x1="0" y1="-170" x2="0" y2="170" stroke="#171613" strokeWidth="0.8" strokeOpacity="0.05" vectorEffect="non-scaling-stroke" />
                    <circle cx="0" cy="0" r="3.5" fill="#B8924A" fillOpacity="0.22" />
                    <text x="14" y="-10" fill="#B8924A" fillOpacity="0.15" fontSize="8" fontFamily="var(--font-mono, monospace)" letterSpacing="0.18em">360° AGENCY ECOSYSTEM</text>
                    <text x="14" y="22" fill="#343331" fillOpacity="0.10" fontSize="7" fontFamily="var(--font-mono, monospace)" letterSpacing="0.15em">MEDIA · BRANDING · INVESTOR RELATIONS</text>
                  </g>

                  {/* Restrained Mining Infrastructure Silhouette */}
                  <g transform="translate(1040, 195)" stroke="#171613" strokeWidth="0.9" strokeOpacity="0.07" vectorEffect="non-scaling-stroke">
                    <path d="M 0 85 L 45 50 L 110 50 L 110 85 Z" />
                    <line x1="22" y1="68" x2="22" y2="85" />
                    <line x1="78" y1="50" x2="78" y2="85" />
                    <rect x="130" y="36" width="32" height="48" rx="2" />
                    <path d="M 130 36 C 130 26, 162 26, 162 36" />
                    <line x1="162" y1="46" x2="280" y2="14" stroke="#B8924A" strokeOpacity="0.11" />
                    <line x1="162" y1="50" x2="280" y2="18" stroke="#B8924A" strokeOpacity="0.11" />
                    <line x1="210" y1="38" x2="210" y2="85" strokeDasharray="3 3" />
                    <line x1="255" y1="24" x2="255" y2="85" strokeDasharray="3 3" />
                    <text x="0" y="108" fill="#343331" fillOpacity="0.10" fontSize="8" fontFamily="var(--font-mono, monospace)" letterSpacing="0.2em">MINING INDUSTRY // SCALED INTEGRATION</text>
                  </g>

                  {/* Data flow distribution bus */}
                  <g stroke="#B8924A" strokeWidth="0.9" strokeOpacity="0.08" vectorEffect="non-scaling-stroke">
                    <path d="M 140 750 L 460 750 L 520 795 L 1300 795" strokeDasharray="5 4" />
                    <circle cx="460" cy="750" r="3" fill="#B8924A" fillOpacity="0.16" />
                    <circle cx="520" cy="795" r="3" fill="#B8924A" fillOpacity="0.16" />
                  </g>
                  <text x="140" y="740" fill="#343331" fillOpacity="0.10" fontSize="8" fontFamily="var(--font-mono, monospace)" letterSpacing="0.2em">INTEGRATED DATA BUS // 360° DIGITAL PARTNER</text>
                </svg>
              </div>

              {/* 2026: Future Horizon — Open, Calm Global Field & Transcontinental Arcs */}
              <div
                ref={(el) => {
                  atmosphereRefs.current[4] = el;
                }}
                className={styles.atmosphereLayer}
              >
                <svg
                  className={styles.atmosphereSvg}
                  viewBox="0 0 1440 900"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Calming global meridian curvature arcs that open into wide breathing space */}
                  <g stroke="#171613" strokeWidth="0.8" strokeOpacity="0.04" vectorEffect="non-scaling-stroke">
                    <line x1="80" y1="360" x2="1360" y2="360" strokeDasharray="8 8" />
                    <line x1="80" y1="200" x2="1360" y2="200" strokeDasharray="6 6" />
                    <line x1="80" y1="520" x2="1360" y2="520" strokeDasharray="6 6" />
                  </g>

                  {/* Refined Great-Circle Connection Arcs leading forward toward the horizon */}
                  <g stroke="#B8924A" strokeWidth="1.1" strokeOpacity="0.13" vectorEffect="non-scaling-stroke">
                    <path d="M 280 210 Q 460 90, 670 170" strokeDasharray="5 4" />
                    <path d="M 670 170 Q 720 330, 700 520" strokeDasharray="5 4" />
                    <path d="M 670 170 Q 770 180, 870 260" />
                    <path d="M 870 260 Q 980 370, 1080 530" strokeDasharray="5 4" />
                    <path d="M 870 260 Q 1120 220, 1420 180" strokeDasharray="6 5" stroke="#B8924A" strokeOpacity="0.15" />
                  </g>

                  {/* Global Hub Nodes */}
                  <g fill="#B8924A" fillOpacity="0.20">
                    <circle cx="870" cy="260" r="5" stroke="#B8924A" strokeWidth="1.2" strokeOpacity="0.28" />
                    <circle cx="870" cy="260" r="12" stroke="#B8924A" strokeWidth="0.8" strokeOpacity="0.14" strokeDasharray="3 3" />
                    <circle cx="280" cy="210" r="3.5" />
                    <circle cx="670" cy="170" r="3.5" />
                    <circle cx="700" cy="520" r="3.5" />
                    <circle cx="1080" cy="530" r="3.5" />
                  </g>

                  {/* Horizon inscriptions */}
                  <text x="895" y="264" fill="#B8924A" fillOpacity="0.18" fontSize="9" fontFamily="var(--font-mono, monospace)" fontWeight="700" letterSpacing="0.18em">GLOBAL DISCOVERY HQ // CHANDIGARH</text>
                  <text x="280" y="195" fill="#343331" fillOpacity="0.10" fontSize="8" fontFamily="var(--font-mono, monospace)" letterSpacing="0.2em">TORONTO / TSX</text>
                  <text x="670" y="155" fill="#343331" fillOpacity="0.10" fontSize="8" fontFamily="var(--font-mono, monospace)" letterSpacing="0.2em">LONDON / LSE</text>
                  <text x="1080" y="555" fill="#343331" fillOpacity="0.10" fontSize="8" fontFamily="var(--font-mono, monospace)" letterSpacing="0.2em">PERTH / ASX</text>
                  <text x="140" y="800" fill="#343331" fillOpacity="0.11" fontSize="8.5" fontFamily="var(--font-mono, monospace)" letterSpacing="0.22em">OPEN HORIZON // THE STORY IS STILL BEING WRITTEN</text>
                </svg>
              </div>
            </div>

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
                      <p className={styles.chapterLabel}>{milestone.chapter}</p>
                      <h3 className={styles.storyTitle}>{milestone.title}</h3>
                      <p className={styles.storyText}>{milestone.text}</p>
                      <p className={styles.editorialMeta}>{milestone.meta}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Subtle side progress indicator (desktop) */}
          <div className={styles.sideProgress} aria-hidden="true">
            {MILESTONES.map((milestone, i) => (
              <div
                key={milestone.year}
                ref={(el) => {
                  indicatorRefs.current[i] = el;
                }}
                className={styles.indicatorItem}
              >
                <span className={styles.indicatorLine} />
                <span className={styles.indicatorIndex}>0{i + 1}</span>
                <span className={styles.indicatorYear}>{milestone.year}</span>
              </div>
            ))}
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
            <p className={styles.chapterLabel}>{milestone.chapter}</p>
            <h3 className={styles.storyTitle}>{milestone.title}</h3>
            <p className={styles.storyText}>{milestone.text}</p>
            <p className={styles.editorialMeta}>{milestone.meta}</p>
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

      {/* Seamless editorial handoff into Our Impact */}
      <div aria-hidden="true" className={styles.outroSeam} />
    </section>
  );
}

export default CompanyJourney;
