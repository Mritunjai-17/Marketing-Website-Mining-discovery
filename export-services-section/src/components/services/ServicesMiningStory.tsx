"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ABOUT_EASE,
  HIDDEN_RISE,
  HIDDEN_RULE_X,
  MaskedWords,
  maskedFrom,
  maskedTo,
  revealBlocks,
  settle,
  WORD_SELECTOR,
} from "@/components/about/reveal";
import { useReducedMotionPreference } from "./useReducedMotionPreference";

/*
 * THE MINING STORY — from complexity to clarity.
 *
 * One interaction, scrubbed end to end by the reader's own scrolling: nine fragments of raw
 * company information drift in scattered and off-square, converge on a single point, and are
 * replaced in turn by the story they became, the system that carries it, and the line the
 * section exists to land.
 *
 *   RAW INFORMATION → COMPLEXITY → ORGANISATION → STORY → AUDIENCE → IMPACT
 *
 * HOW THE LAYERS WORK. Everything lives in one pinned stage as a set of overlays that
 * crossfade in sequence — scatter, story, system, clarity, statement. Continuity comes from
 * the scatter converging on exactly the point the story layer then occupies, so the labels
 * read as becoming the story rather than being swapped for it.
 *
 * CENTRING WITHOUT MARGIN MATHS. Each scattered label sits inside its own full-stage flex
 * box, so "converged" is simply x:0, y:0 and the label's own width never enters into it. That
 * also means GSAP owns the entire transform on the label — nothing of the centring lives in
 * a property GSAP might fold into its matrix and clear (which is exactly how a Tailwind
 * -translate-1/2 centring gets eaten on a GSAP-driven element).
 *
 * PINNING is a tall container plus a `position: sticky` stage — the pattern the homepage
 * scroll story and the rest of this page already use — rather than ScrollTrigger's `pin`,
 * which injects a spacer, rewrites the section height and needs re-measuring on resize.
 *
 * CONTENT RULE: every term below is from the brief. No statistics, clients, results or
 * claims of any kind.
 */

/** The raw information, and where each fragment starts — as a percentage of the stage, so
 *  the composition holds its proportions at every width. Deterministic by construction:
 *  these are authored values, never generated, so the scatter is identical on every render. */
const FRAGMENTS: Array<{
  label: string;
  x: number;
  y: number;
  rotate: number;
  tone: "strong" | "mid" | "quiet";
}> = [
  { label: "Company", x: -32, y: -31, rotate: -6, tone: "strong" },
  { label: "Project", x: 24, y: -35, rotate: 5, tone: "mid" },
  { label: "Exploration", x: -6, y: -16, rotate: -3, tone: "strong" },
  { label: "News", x: -41, y: 4, rotate: 4, tone: "quiet" },
  { label: "Market", x: 37, y: -5, rotate: -5, tone: "mid" },
  { label: "Investors", x: 15, y: 17, rotate: 6, tone: "strong" },
  { label: "Geology", x: -28, y: 27, rotate: -4, tone: "quiet" },
  { label: "Audience", x: 33, y: 31, rotate: 3, tone: "mid" },
  { label: "Data", x: -8, y: 39, rotate: -6, tone: "quiet" },
];

const TONE: Record<string, string> = {
  strong: "text-[clamp(1.05rem,2.2vw,1.9rem)] text-[#0B1F3A]",
  mid: "text-[clamp(0.9rem,1.7vw,1.45rem)] text-[#0B1F3A]/75",
  quiet: "text-[clamp(0.8rem,1.35vw,1.15rem)] text-[#0B1F3A]/50",
};

const STORY_ATTRIBUTES = ["Brand", "Message", "Audience", "Purpose"];
const CLARITY_CHAIN = ["Your Story", "Your Audience", "Impact"];
const HEADING_LINES = ["From complexity", "to clarity."];
const STATEMENT_LINES = ["We turn complex", "mining stories into", "clear communication."];

/* ---------------------------------------------------------------------------------- *
 * The marketing system, drawn once as SVG.
 *
 * A fixed viewBox rather than DOM boxes joined by CSS: this diagram is a self-contained
 * composition, so letting one coordinate space own both the labels and the lines means the
 * lines cannot miss the labels at any width — the failure mode that dogs CSS-positioned
 * diagrams on screen sizes nobody tested.
 *
 * The draw-on is set up from each path's OWN measured length (see drawFrom below) rather
 * than from a pathLength="1" normalisation. Normalising looks tidier and does not work here:
 * the dash values still have to be written as a CSS length, and a `stroke-dasharray: 1px` on
 * a line 340 units long renders as a dotted hairline you cannot see rather than as a line
 * waiting to be drawn.
 * ---------------------------------------------------------------------------------- */

const SYSTEM_LINES = [
  "M260 46V88", // story down to the bus
  "M90 88H430", // the bus
  "M90 88v34", // down to brand
  "M260 88v34", // down to media
  "M430 88v34", // down to digital
  "M90 168v34", // brand down
  "M260 168v34", // media down
  "M430 168v34", // digital down
  "M90 202H430", // the return bus
  "M260 202v40", // down to audience
];

/**
 * Prime a set of SVG paths to be drawn, each from its own measured length, and return them
 * ready for a single dashoffset tween. Returns [] when there is nothing to draw so callers
 * can skip the tween entirely.
 */
function drawFrom(lines: NodeListOf<SVGPathElement>): SVGPathElement[] {
  const paths = Array.from(lines);
  paths.forEach((path) => {
    const length = path.getTotalLength();
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
  });
  return paths;
}

const SystemDiagram: React.FC = () => (
  <svg
    viewBox="0 0 520 290"
    fill="none"
    aria-hidden="true"
    className="h-auto w-full max-w-[34rem]"
  >
    <g stroke="#B8860B" strokeOpacity="0.55" strokeWidth="1.25" strokeLinecap="round">
      {SYSTEM_LINES.map((d) => (
        <path key={d} d={d} data-system-line />
      ))}
    </g>

    <g className="font-geist" fill="#0B1F3A" textAnchor="middle">
      <text x="260" y="28" fontSize="22" fontWeight="800" letterSpacing="1.6">
        YOUR STORY
      </text>
      <text x="90" y="152" fontSize="16" fontWeight="700" letterSpacing="1.4">
        BRAND
      </text>
      <text x="260" y="152" fontSize="16" fontWeight="700" letterSpacing="1.4">
        MEDIA
      </text>
      <text x="430" y="152" fontSize="16" fontWeight="700" letterSpacing="1.4">
        DIGITAL
      </text>
      <text x="260" y="272" fontSize="22" fontWeight="800" letterSpacing="1.6" fill="#B8860B">
        AUDIENCE
      </text>
    </g>
  </svg>
);

export const ServicesMiningStory: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const journeyRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const fragmentsRef = useRef<Array<HTMLElement | null>>([]);
  const storyRef = useRef<HTMLDivElement | null>(null);
  const systemRef = useRef<HTMLDivElement | null>(null);
  const clarityRef = useRef<HTMLDivElement | null>(null);
  const statementRef = useRef<HTMLDivElement | null>(null);

  /*
   * Decides LAYOUT, not just motion: on the pinned stage the five layers sit on top of one
   * another and are only legible while something is crossfading them, so a reader who asked
   * for reduced motion gets them in normal flow, already organised, with nothing hidden.
   */
  const reduced = useReducedMotionPreference();

  useEffect(() => {
    const scope = sectionRef.current;
    if (!scope) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      settle(scope);
      return;
    }

    let cancelled = false;
    let ctx: ReturnType<typeof gsap.context> | null = null;
    let mm: ReturnType<typeof gsap.matchMedia> | null = null;

    const start = () => {
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        if (headerRef.current) revealBlocks(headerRef.current);

        mm = gsap.matchMedia();

        /* ------------------- Desktop: the scrubbed transformation ------------------ */
        mm.add("(min-width: 1024px)", () => {
          const journey = journeyRef.current;
          const stage = stageRef.current;
          if (!journey || !stage) return;

          const fragments = fragmentsRef.current.filter(Boolean) as HTMLElement[];
          const layers = {
            story: storyRef.current,
            system: systemRef.current,
            clarity: clarityRef.current,
            statement: statementRef.current,
          };

          const tl = gsap.timeline({
            defaults: { ease: ABOUT_EASE },
            scrollTrigger: {
              trigger: journey,
              start: "top top",
              end: "bottom bottom",
              scrub: 0.6,
              invalidateOnRefresh: true,
            },
          });

          const w = () => stage.offsetWidth;
          const h = () => stage.offsetHeight;

          /* --- Stage 1: complexity. Scattered, off-square, uneven. --- */
          fragments.forEach((fragment, index) => {
            const spec = FRAGMENTS[index];
            tl.fromTo(
              fragment,
              {
                x: () => (spec.x / 100) * w(),
                y: () => (spec.y / 100) * h(),
                rotate: spec.rotate,
                opacity: 0,
                scale: 0.94,
              },
              { opacity: 1, scale: 1, duration: 0.5 },
              index * 0.06
            );
          });

          /* --- Stage 2: convergence. Each fragment drifts to the one point the story
                 layer will occupy, squaring up as it goes, and fades out as it arrives —
                 so it reads as being absorbed rather than deleted. Staggered, so they
                 arrive as a sequence rather than a collapse. --- */
          fragments.forEach((fragment, index) => {
            const at = 1.7 + index * 0.07;
            tl.to(fragment, { x: 0, y: 0, rotate: 0, duration: 1.25 }, at);
            tl.to(fragment, { opacity: 0, scale: 0.9, duration: 0.5 }, at + 0.85);
          });

          /* --- Stage 3: the story it became. --- */
          if (layers.story) {
            tl.fromTo(
              layers.story,
              { y: 26, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.7 },
              3.3
            );
            tl.fromTo(
              layers.story.querySelectorAll("[data-story-item]"),
              { y: 18, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.5, stagger: 0.12 },
              3.8
            );
            tl.to(layers.story, { y: -24, opacity: 0, duration: 0.5 }, 5.5);
          }

          /* --- Stage 4: the system that carries it. Lines draw themselves in. --- */
          if (layers.system) {
            const lines = layers.system.querySelectorAll<SVGPathElement>("[data-system-line]");
            tl.fromTo(
              layers.system,
              { y: 26, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.6 },
              5.7
            );
            const drawable = drawFrom(lines);
            if (drawable.length) {
              tl.to(
                drawable,
                { strokeDashoffset: 0, duration: 0.5, stagger: 0.07, ease: "power2.out" },
                5.9
              );
            }
            tl.to(layers.system, { y: -24, opacity: 0, duration: 0.5 }, 7.4);
          }

          /* --- Final stage: clarity, then the statement. --- */
          if (layers.clarity) {
            tl.fromTo(
              layers.clarity,
              { y: 26, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.6 },
              7.6
            );
            tl.fromTo(
              layers.clarity.querySelectorAll("[data-clarity-item]"),
              { y: 16, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.45, stagger: 0.16 },
              7.8
            );
            tl.to(layers.clarity, { y: -28, opacity: 0, duration: 0.5 }, 9.0);
          }

          if (layers.statement) {
            const words = layers.statement.querySelectorAll<HTMLElement>(WORD_SELECTOR);
            tl.fromTo(layers.statement, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 9.1);
            if (words.length) {
              tl.fromTo(
                words,
                maskedFrom,
                { ...maskedTo, duration: 0.7, stagger: 0.05 },
                9.2
              );
            }
          }
        });

        /* -------- Below lg: the same story told as a vertical sequence, no pin ------- */
        mm.add("(max-width: 1023.98px)", () => {
          const fragments = fragmentsRef.current.filter(Boolean) as HTMLElement[];

          if (fragments.length) {
            gsap.fromTo(
              fragments,
              { y: 26, opacity: 0, rotate: 2 },
              {
                y: 0,
                opacity: 1,
                rotate: 0,
                duration: 0.6,
                stagger: 0.07,
                ease: ABOUT_EASE,
                scrollTrigger: { trigger: fragments[0], start: "top 88%", once: true },
              }
            );
          }

          /*
           * Each block is animated explicitly rather than through revealBlocks, because
           * revealBlocks queries DESCENDANTS: passing a [data-about-reveal] element as the
           * root finds everything inside it but never the element itself, leaving the block
           * at opacity 0 with all its content invisible inside.
           */
          [storyRef, systemRef, clarityRef, statementRef].forEach((ref) => {
            const block = ref.current;
            if (!block) return;

            const words = block.querySelectorAll<HTMLElement>(WORD_SELECTOR);
            const items = block.querySelectorAll<HTMLElement>(
              "[data-story-item], [data-clarity-item]"
            );
            const lines = block.querySelectorAll<SVGPathElement>("[data-system-line]");

            const tl = gsap.timeline({
              defaults: { ease: ABOUT_EASE },
              scrollTrigger: { trigger: block, start: "top 85%", once: true },
            });

            tl.fromTo(block, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.65 }, 0);
            const drawable = drawFrom(lines);
            if (drawable.length) {
              tl.to(
                drawable,
                { strokeDashoffset: 0, duration: 0.6, stagger: 0.06, ease: "power2.out" },
                0.2
              );
            }
            if (items.length) {
              tl.fromTo(items, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.1 }, 0.25);
            }
            if (words.length) {
              tl.fromTo(words, maskedFrom, { ...maskedTo, duration: 0.8, stagger: 0.05 }, 0.15);
            }
          });
        });
      }, scope);
    };

    const fonts = document.fonts;
    if (fonts && fonts.status !== "loaded") {
      fonts.ready.then(start);
    } else {
      start();
    }

    return () => {
      cancelled = true;
      mm?.revert();
      ctx?.revert();
    };
  }, []);

  /** On the pinned stage each layer is an overlay; in flow they are simply blocks. */
  const layerClass = (extra = "") =>
    reduced
      ? `mt-20 flex flex-col items-center text-center ${extra}`
      : `mt-20 flex flex-col items-center text-center lg:absolute lg:inset-0 lg:mt-0 lg:justify-center ${extra}`;

  return (
    <section ref={sectionRef} className="relative overflow-x-clip border-b border-[#E5E4DE]">
      {/*
        Contour lines — the geological texture, five nested closed paths scaled from one
        shape so they nest the way a topographic map does. 3.5% opacity: present in the way
        paper stock is present, never competing with the information on top of it. Inline
        SVG, so no asset and no request.
      */}
      <svg
        aria-hidden="true"
        viewBox="0 0 800 800"
        preserveAspectRatio="xMidYMid slice"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 opacity-[0.035]"
      >
        <g fill="none" stroke="#0B1F3A" strokeWidth="1.5">
          {[1, 0.82, 0.64, 0.46, 0.28].map((scale) => (
            <path
              key={scale}
              transform={`translate(400 400) scale(${scale}) translate(-400 -400)`}
              d="M400 62C556 62 714 172 742 338C770 502 678 662 518 722C378 774 198 730 108 600C28 482 44 280 164 164C234 96 320 62 400 62Z"
            />
          ))}
        </g>
      </svg>

      {/* --- Intro ------------------------------------------------------------- */}
      <div className="container-editorial relative pt-20 md:pt-28">
        <div ref={headerRef}>
          <div data-about-rule-x className={`h-0.5 w-12 bg-[#B8860B] ${HIDDEN_RULE_X}`} />

          <span
            data-about-reveal
            className={`mt-6 block text-xs font-semibold uppercase tracking-[0.15em] text-[#B8860B] ${HIDDEN_RISE}`}
          >
            Our Approach
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
            Mining companies have complex stories. We help turn that complexity into
            communication people can understand, remember and act on.
          </p>
        </div>
      </div>

      {/* --- The transformation ------------------------------------------------- */}
      <div ref={journeyRef} className={reduced ? "" : "lg:h-[460vh]"}>
        <div className={reduced ? "" : "lg:sticky lg:top-0 lg:h-svh lg:overflow-hidden"}>
          <div
            ref={stageRef}
            className={`container-editorial relative pt-16 pb-20 md:pb-28 ${
              reduced ? "" : "lg:h-full lg:pt-0 lg:pb-0"
            }`}
          >
            {/* --- Stage 1 & 2: the raw information ------------------------------ */}
            {/*
              Each fragment gets its own full-stage flex box above lg, which is what makes
              "converged" mean x:0, y:0 for every one of them regardless of how wide the word
              is. Below lg the same wrapper is just a centred row in the flow.
            */}
            {FRAGMENTS.map((fragment, index) => (
              <div
                key={fragment.label}
                className={`pointer-events-none flex justify-center py-1.5 ${
                  reduced
                    ? ""
                    : "lg:absolute lg:inset-0 lg:items-center lg:py-0"
                }`}
              >
                <span
                  ref={(el) => {
                    fragmentsRef.current[index] = el;
                  }}
                  data-about-reveal
                  className={`font-geist font-bold uppercase tracking-[0.14em] ${
                    TONE[fragment.tone]
                  } ${HIDDEN_RISE}`}
                >
                  {fragment.label}
                </span>
              </div>
            ))}

            {/* --- Stage 3: the story ------------------------------------------- */}
            <div ref={storyRef} data-about-reveal className={`${layerClass()} ${HIDDEN_RISE}`}>
              <p className="font-geist text-[clamp(2.25rem,5vw,4rem)] font-black uppercase leading-[0.95] tracking-[-0.035em] text-[#0B1F3A]">
                <span className="block">Your</span>
                <span className="block">Story</span>
              </p>

              <span aria-hidden="true" className="mt-8 block h-px w-40 bg-[#B8860B]" />

              <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
                {STORY_ATTRIBUTES.map((attribute) => (
                  <li
                    key={attribute}
                    data-story-item
                    className="text-xs font-semibold uppercase tracking-[0.16em] text-[#57595E]"
                  >
                    {attribute}
                  </li>
                ))}
              </ul>
            </div>

            {/* --- Stage 4: the system ------------------------------------------ */}
            <div ref={systemRef} data-about-reveal className={`${layerClass()} ${HIDDEN_RISE}`}>
              <SystemDiagram />
            </div>

            {/* --- Final: clarity ------------------------------------------------ */}
            <div ref={clarityRef} data-about-reveal className={`${layerClass()} ${HIDDEN_RISE}`}>
              {CLARITY_CHAIN.map((step, index) => (
                <React.Fragment key={step}>
                  {index > 0 && (
                    <span
                      aria-hidden="true"
                      data-clarity-item
                      className="my-5 block h-10 w-px bg-[#B8860B]/50"
                    />
                  )}
                  <span
                    data-clarity-item
                    className={`font-geist font-black uppercase leading-none tracking-[-0.02em] ${
                      index === CLARITY_CHAIN.length - 1
                        ? "text-[clamp(2rem,4.4vw,3.5rem)] text-[#B8860B]"
                        : "text-[clamp(1.5rem,3.2vw,2.5rem)] text-[#0B1F3A]"
                    }`}
                  >
                    {step}
                  </span>
                </React.Fragment>
              ))}
            </div>

            {/* --- The payoff ---------------------------------------------------- */}
            <div
              ref={statementRef}
              data-about-reveal
              className={`${layerClass("pointer-events-none")} ${HIDDEN_RISE}`}
            >
              <p className="max-w-[18ch] text-balance font-geist text-[clamp(1.75rem,4.6vw,3.75rem)] font-black uppercase leading-[1] tracking-[-0.035em] text-[#0B1F3A]">
                {STATEMENT_LINES.map((line) => (
                  <span key={line} className="block">
                    <MaskedWords text={line} />
                  </span>
                ))}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesMiningStory;
