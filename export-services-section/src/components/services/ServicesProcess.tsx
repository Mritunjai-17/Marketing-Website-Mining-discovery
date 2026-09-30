"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ABOUT_EASE,
  HIDDEN_RISE,
  HIDDEN_RULE_X,
  MaskedWords,
  revealBlocks,
  useAboutMotion,
} from "@/components/about/reveal";

/*
 * Step 4 — HOW WE WORK.
 *
 * Five stages as one continuous journey rather than five cards: a horizontal rail across the
 * top with a gold indicator that tracks scroll position exactly, and the active stage's
 * detail crossfading underneath it.
 *
 * PINNING, AND WHY NOT ScrollTrigger's pin. The brief asks for the section to be pinned. A
 * GSAP pin injects a spacer element and rewrites the section's height, which fights Lenis
 * and has to be re-measured on every resize. This uses the pattern the homepage's
 * ServicesScrollStory already established on this codebase instead: a tall outer container
 * with a `position: sticky` inner stage. Same held-in-place effect, no injected DOM, and the
 * browser owns the maths.
 *
 * ONE SET OF CONTENT, TWO LAYOUTS. The five stage panels are written once. Above lg they are
 * stacked absolutely inside the sticky stage and crossfaded; below lg the sticky and the
 * absolute placement simply do not apply, so the same panels fall into normal flow as the
 * vertical timeline the brief asks for on a phone. The rail decorations differ between the
 * two and are duplicated, but they carry no text and are aria-hidden, so nothing a reader or
 * a screen reader can observe is duplicated.
 *
 * CONTENT RULE: the five stages, their descriptions and their keywords are the brief's,
 * verbatim in meaning. The stage visuals are abstract diagrams built from CSS and inline
 * SVG — no numbers, no metrics, no fabricated results.
 */

interface Stage {
  id: string;
  label: string;
  description: string;
  keywords: string[];
}

const STAGES: Stage[] = [
  {
    id: "understand",
    label: "Understand",
    description:
      "We understand your company, project, audience, objectives and the story behind your opportunity.",
    keywords: ["Company", "Project", "Audience", "Objectives"],
  },
  {
    id: "position",
    label: "Position",
    description:
      "We define the right positioning, message and brand direction for your mining story.",
    keywords: ["Positioning", "Message", "Brand", "Story"],
  },
  {
    id: "create",
    label: "Create",
    description:
      "We create the content, digital experiences, campaigns and creative assets that bring your story to life.",
    keywords: ["Content", "Design", "Digital", "Campaigns"],
  },
  {
    id: "amplify",
    label: "Amplify",
    description:
      "We put your story in front of the right mining professionals, industry audiences and investors.",
    keywords: ["Media", "Social", "Advertising", "Reach"],
  },
  {
    id: "measure",
    label: "Measure",
    description:
      "We evaluate performance, identify what works and continuously improve the strategy.",
    keywords: ["Data", "Insight", "Performance", "Optimization"],
  },
];

const HEADING_LINES = ["From strategy", "to impact."];

/* ---------------------------------------------------------------------------------- *
 * Reduced motion, as an external store rather than a hook that guesses.
 *
 * This value decides LAYOUT, not just whether something animates, and that is what makes
 * the usual approaches wrong here.
 *
 * framer-motion's useReducedMotion() reads the media query during the first client render —
 * which is hydration. React does not repair a className that disagrees with the server's at
 * hydration time; it warns and keeps the server's. Normally the next state update papers
 * over it, but under reduced motion this section never has a next update: there is no
 * ScrollTrigger running, so `active` never changes and the wrong classes simply stay. The
 * panels were left stacked on top of each other with one visible — the exact failure the
 * accessibility requirement exists to prevent.
 *
 * useSyncExternalStore is built for precisely this: it renders getServerSnapshot() during
 * hydration so the markup matches, then re-renders for real once it sees the client value
 * differ. A real update DOES apply attribute changes.
 * ---------------------------------------------------------------------------------- */

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const subscribeToReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

const getReducedMotion = () => window.matchMedia(REDUCED_MOTION_QUERY).matches;
const getReducedMotionOnServer = () => false;

/** Dot i sits at this percentage across the rail — the 5 columns put them at 10%..90%. */
const dotPercent = (index: number) => 10 + index * 20;

/* ---------------------------------------------------------------------------------- *
 * Stage visuals.
 *
 * One abstract diagram per stage, drawn from primitives: scattered points converging, lines
 * resolving into one, blocks assembling, a signal expanding, a rising trace. They are
 * decoration that restates the stage's idea — aria-hidden, and carrying no data of any kind,
 * because inventing a chart with numbers on it would be inventing results.
 * ---------------------------------------------------------------------------------- */

const GOLD = "#B8860B";
const NAVY = "#0B1F3A";

const StageVisual: React.FC<{ id: string }> = ({ id }) => {
  const common = {
    viewBox: "0 0 160 160",
    fill: "none",
    "aria-hidden": true as const,
    className: "h-full w-full max-h-[15rem]",
  };

  if (id === "understand") {
    // Scattered points, each tethered to the centre they resolve into.
    const points = [
      [28, 34],
      [124, 28],
      [18, 92],
      [136, 104],
      [62, 20],
      [104, 140],
    ];
    return (
      <svg {...common}>
        <g stroke={NAVY} strokeOpacity="0.18" strokeWidth="1">
          {points.map(([x, y]) => (
            <line key={`${x}-${y}`} x1={x} y1={y} x2="80" y2="80" />
          ))}
        </g>
        {points.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill={NAVY} fillOpacity="0.35" />
        ))}
        <circle cx="80" cy="80" r="7" fill={GOLD} />
      </svg>
    );
  }

  if (id === "position") {
    // Three unaligned lines resolving into one aligned statement.
    return (
      <svg {...common}>
        <g stroke={NAVY} strokeOpacity="0.28" strokeWidth="3" strokeLinecap="round">
          <line x1="34" y1="30" x2="106" y2="30" />
          <line x1="50" y1="52" x2="132" y2="52" />
          <line x1="26" y1="74" x2="88" y2="74" />
        </g>
        <path
          d="M80 92v18m0 0l-8-8m8 8l8-8"
          stroke={GOLD}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line x1="34" y1="132" x2="126" y2="132" stroke={GOLD} strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  if (id === "create") {
    // Blocks assembling into one composition.
    return (
      <svg {...common}>
        <rect x="30" y="26" width="100" height="26" rx="5" stroke={NAVY} strokeOpacity="0.3" strokeWidth="1.5" />
        <rect x="30" y="67" width="100" height="26" rx="5" stroke={NAVY} strokeOpacity="0.3" strokeWidth="1.5" />
        <rect x="30" y="108" width="100" height="26" rx="5" stroke={GOLD} strokeWidth="2" />
        <g stroke={GOLD} strokeWidth="1.5" strokeLinecap="round">
          <path d="M80 55v8M76 59h8" />
          <path d="M80 96v8M76 100h8" />
        </g>
      </svg>
    );
  }

  if (id === "amplify") {
    // A signal leaving a point and widening.
    return (
      <svg {...common}>
        <circle cx="52" cy="80" r="6" fill={GOLD} />
        {[0, 1, 2].map((ring) => (
          <path
            key={ring}
            d={`M68 ${80 - 22 - ring * 18} A ${26 + ring * 18} ${26 + ring * 18} 0 0 1 68 ${80 + 22 + ring * 18}`}
            stroke={GOLD}
            strokeOpacity={0.75 - ring * 0.22}
            strokeWidth="2"
            strokeLinecap="round"
          />
        ))}
      </svg>
    );
  }

  // measure — a rising trace over a baseline. No axis values: the shape is the whole point.
  return (
    <svg {...common}>
      <line x1="26" y1="130" x2="134" y2="130" stroke={NAVY} strokeOpacity="0.2" strokeWidth="1.5" />
      <polyline
        points="30,112 62,92 94,98 130,44"
        stroke={GOLD}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {[
        [30, 112],
        [62, 92],
        [94, 98],
        [130, 44],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="3.5" fill={GOLD} />
      ))}
    </svg>
  );
};

export const ServicesProcess: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const journeyRef = useRef<HTMLDivElement | null>(null);
  const fillRef = useRef<HTMLSpanElement | null>(null);
  const indicatorRef = useRef<HTMLSpanElement | null>(null);
  const panelsRef = useRef<Array<HTMLElement | null>>([]);

  /*
   * Above lg the five panels are stacked on top of each other and crossfaded, which is only
   * readable while something drives the crossfade. So for a reader who has asked for reduced
   * motion they stay in normal flow and all five are simply present — see the store above for
   * why this cannot be a plain hook.
   */
  const reduced = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotion,
    getReducedMotionOnServer
  );

  /** Stage 0 is active from the start, so the stage never renders blank before any scroll. */
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);

  useAboutMotion(sectionRef, () => {
    if (headerRef.current) revealBlocks(headerRef.current);

    // Each panel's content reveals on arrival. Above lg all five sit at the same place inside
    // the sticky stage, so these all fire together and the crossfade takes over from there;
    // below lg they fire one at a time as the timeline scrolls past.
    panelsRef.current.forEach((panel) => {
      if (panel) revealBlocks(panel, { stagger: 0.06, start: "top 85%" });
    });

    const journey = journeyRef.current;
    if (!journey) return;

    /*
     * The whole desktop interaction, from one scrubbed trigger.
     *
     * start/end span exactly the distance the sticky stage is held: from the container's top
     * meeting the viewport top, to its bottom meeting the viewport bottom. Progress is
     * therefore 0 the instant the stage locks and 1 the instant it releases.
     *
     * The rail and the indicator are written directly to the DOM rather than through React
     * state — they move every frame, and re-rendering five panels per frame to slide a dot
     * would be paying for a rerender to do a job a transform already does. Only the integer
     * stage index goes through state, and only when it actually changes.
     */
    ScrollTrigger.create({
      trigger: journey,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.3,
      onUpdate: (self) => {
        const progress = self.progress;

        if (fillRef.current) gsap.set(fillRef.current, { scaleX: progress });
        if (indicatorRef.current) {
          // 10%..90% is where the five dots sit, so the indicator and the fill's leading edge
          // arrive at each dot together.
          gsap.set(indicatorRef.current, { left: `${dotPercent(0) + progress * 80}%` });
        }

        // round, not floor: the stage flips at the midpoint between two dots, so the
        // indicator is sitting ON a dot exactly when that stage is the active one.
        const next = Math.min(STAGES.length - 1, Math.max(0, Math.round(progress * 4)));
        if (next !== activeRef.current) {
          activeRef.current = next;
          setActive(next);
        }
      },
    });
  });

  /*
   * The stage entrance, replayed each time a new stage takes over. Desktop only: below lg all
   * five panels are on the page at once and re-running an entrance on one of them would make
   * an already-read stage flicker as you scroll past it.
   *
   * The breakpoint is read at the moment it runs rather than held in state, so a resize needs
   * no listener — the next activation simply asks again.
   */
  useEffect(() => {
    if (reduced) return;
    if (!window.matchMedia("(min-width: 1024px)").matches) return;

    const items = panelsRef.current[active]?.querySelectorAll<HTMLElement>("[data-stage-item]");
    if (!items?.length) return;

    const tween = gsap.fromTo(
      items,
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55, stagger: 0.07, ease: ABOUT_EASE }
    );

    return () => {
      tween.kill();
    };
  }, [active, reduced]);

  return (
    <section ref={sectionRef} className="border-b border-[#E5E4DE] bg-white">
      {/* --- Intro ------------------------------------------------------------ */}
      <div className="container-editorial pt-20 md:pt-28">
        <div ref={headerRef}>
          <div data-about-rule-x className={`h-0.5 w-12 bg-[#B8860B] ${HIDDEN_RULE_X}`} />

          <span
            data-about-reveal
            className={`mt-6 block text-xs font-semibold uppercase tracking-[0.15em] text-[#B8860B] ${HIDDEN_RISE}`}
          >
            How We Work
          </span>

          <h2 className="mt-8 text-balance font-geist text-[clamp(1.875rem,4.2vw,3.5rem)] font-bold uppercase leading-[1.02] tracking-[-0.03em] text-[#0B1F3A]">
            {HEADING_LINES.map((line) => (
              <span key={line} className="block">
                <MaskedWords text={line} />
              </span>
            ))}
          </h2>

          <p
            data-about-reveal
            className={`mt-8 max-w-[56ch] text-lg font-normal leading-relaxed text-[#3A3D42] sm:text-xl ${HIDDEN_RISE}`}
          >
            We combine mining expertise, creative thinking, digital execution and media reach
            to turn your story into meaningful visibility.
          </p>
        </div>
      </div>

      {/* --- The journey ------------------------------------------------------- */}
      {/*
        The tall container is what the sticky stage inside it has to travel through. It only
        exists above lg and only when motion is welcome; in every other case this is an
        ordinary block and the panels below fall into normal flow.
      */}
      <div ref={journeyRef} className={reduced ? "" : "lg:h-[420vh]"}>
        <div
          className={
            reduced
              ? "container-editorial pb-20 md:pb-28"
              : "container-editorial pb-20 md:pb-28 lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col lg:justify-center lg:pb-0"
          }
        >
          {/* --- Desktop rail ------------------------------------------------- */}
          <div aria-hidden="true" className="mt-16 hidden lg:block">
            {/* Numbers */}
            <div className="grid grid-cols-5">
              {STAGES.map((stage, index) => (
                <span
                  key={stage.id}
                  className={`text-center font-mono text-xs tabular-nums transition-colors duration-500 ${
                    index <= active ? "text-[#B8860B]" : "text-[#B8860B]/30"
                  }`}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
              ))}
            </div>

            {/* The rail itself: a base hairline, the gold fill that grows over it, the five
                dots, and the indicator riding the fill's leading edge. */}
            <div className="relative mt-5 h-3">
              <span className="absolute inset-x-[10%] top-1/2 block h-px -translate-y-1/2 bg-[#E5E4DE]" />
              <span
                ref={fillRef}
                data-about-rule-x
                className="absolute inset-x-[10%] top-1/2 block h-px -translate-y-1/2 origin-left bg-[#B8860B] [transform:scaleX(0)] motion-reduce:[transform:none]"
              />

              <div className="absolute inset-0 grid grid-cols-5">
                {STAGES.map((stage, index) => (
                  <span key={stage.id} className="flex items-center justify-center">
                    <span
                      className={`block h-2.5 w-2.5 rounded-full border transition-colors duration-500 ${
                        index <= active
                          ? "border-[#B8860B] bg-[#B8860B]"
                          : "border-[#E5E4DE] bg-white"
                      }`}
                    />
                  </span>
                ))}
              </div>

              {/*
                Positioned with `left` and centred with negative margins rather than a
                transform: GSAP moves it every frame, and a Tailwind `-translate-x-1/2` would
                be a second thing writing to the same property.
              */}
              <span
                ref={indicatorRef}
                className="absolute top-1/2 -ml-[7px] -mt-[7px] block h-3.5 w-3.5 rounded-full border-2 border-[#B8860B] bg-white"
                style={{ left: reduced ? `${dotPercent(STAGES.length - 1)}%` : `${dotPercent(0)}%` }}
              />
            </div>

            {/* Labels */}
            <div className="mt-5 grid grid-cols-5">
              {STAGES.map((stage, index) => (
                <span
                  key={stage.id}
                  className={`text-center font-geist text-sm font-bold uppercase tracking-[0.12em] transition-colors duration-500 ${
                    index === active ? "text-[#0B1F3A]" : "text-[#0B1F3A]/30"
                  }`}
                >
                  {stage.label}
                </span>
              ))}
            </div>
          </div>

          {/* --- Stage panels -------------------------------------------------- */}
          <div className={`mt-14 lg:mt-16 ${reduced ? "" : "lg:relative lg:h-[22rem]"}`}>
            {STAGES.map((stage, index) => {
              const isActive = index === active;
              const stacked = !reduced;

              return (
                <div
                  key={stage.id}
                  ref={(el) => {
                    panelsRef.current[index] = el;
                  }}
                  className={
                    stacked
                      ? `lg:absolute lg:inset-0 lg:transition-opacity lg:duration-500 ${
                          isActive ? "lg:opacity-100" : "lg:opacity-0 lg:pointer-events-none"
                        }`
                      : ""
                  }
                >
                  {/*
                    The mobile timeline lives on the panel itself — a dot at its head and a
                    rail down its side — so the segments join into one continuous line without
                    any element having to know where the others were placed. Gone above lg,
                    where the horizontal rail is the timeline instead.
                  */}
                  {/*
                    The gap below each stage is decided by index, NOT by a `last:` variant.
                    This div is its parent's only child, so it matches :last-child on every
                    stage — a `last:pb-0` here silently removed the spacing between all five
                    of them rather than just after the fifth.
                  */}
                  <div
                    className={`relative pl-10 lg:pb-0 lg:pl-0 ${
                      index === STAGES.length - 1 ? "pb-0" : "pb-14"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute left-[5px] top-3 block w-px origin-top bg-[#B8860B]/40 [transform:scaleY(0)] motion-reduce:[transform:none] lg:hidden ${
                        index === STAGES.length - 1 ? "hidden" : "bottom-0"
                      }`}
                      {...(index === STAGES.length - 1 ? {} : { "data-about-rule-y": "" })}
                    />
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-1.5 block h-3 w-3 rounded-full border-2 border-[#B8860B] bg-white lg:hidden"
                    />

                    <div
                      data-about-reveal
                      className={`grid grid-cols-1 gap-x-12 lg:grid-cols-12 lg:items-center ${HIDDEN_RISE}`}
                    >
                      <div className="lg:col-span-7">
                        <span
                          data-stage-item
                          className="block font-mono text-xs tabular-nums text-[#B8860B] lg:hidden"
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <h3
                          data-stage-item
                          className="mt-3 font-geist text-[clamp(2rem,4.5vw,3.5rem)] font-black uppercase leading-[0.98] tracking-[-0.03em] text-[#0B1F3A] lg:mt-0"
                        >
                          {stage.label}
                        </h3>

                        <p
                          data-stage-item
                          className="mt-5 max-w-[46ch] text-lg font-normal leading-relaxed text-[#3A3D42] sm:text-xl"
                        >
                          {stage.description}
                        </p>

                        <ul data-stage-item className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2">
                          {stage.keywords.map((keyword) => (
                            <li
                              key={keyword}
                              className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#57595E]"
                            >
                              <span
                                aria-hidden="true"
                                className="h-1 w-1 shrink-0 rounded-full bg-[#B8860B]"
                              />
                              {keyword}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Decorative, and hidden where the column would squeeze it. */}
                      <div
                        data-stage-item
                        className="hidden lg:col-span-5 lg:flex lg:items-center lg:justify-center"
                      >
                        <StageVisual id={stage.id} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesProcess;
