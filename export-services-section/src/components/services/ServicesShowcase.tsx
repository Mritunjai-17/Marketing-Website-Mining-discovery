"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
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
 * OUR EXPERTISE — the editorial card showcase.
 *
 * Five service groups arriving one at a time as printed panels: each slides in from its own
 * direction, turns to show its reverse, then settles back into a stack as the next one lands
 * on top of it. At the end the whole stack leaves and the section states its conclusion.
 *
 * WHY NAVY. The page alternates ivory and white all the way down, and cards on either of
 * those read as boxes drawn on a page. On navy they read as pages — which is the whole
 * conceit — and navy is already this site's second surface (the homepage hero, the footer,
 * /about's Looking Ahead). Gold moves to #D4AF37 here, the same swap those sections make,
 * because #B8860B goes muddy on a dark ground.
 *
 * PINNING. A tall container with a `position: sticky` stage, as in ServicesProcess and the
 * homepage's scroll story — not ScrollTrigger's `pin`, which injects a spacer, rewrites the
 * section height and has to be re-measured on resize.
 *
 * TWO OVERFLOW RULES, BOTH LOAD-BEARING:
 *  - the SECTION uses overflow-x-clip, never overflow-hidden. `hidden` computes overflow-y
 *    to `auto`, which makes the element a scroll container and stops a sticky descendant
 *    pinning to the viewport. `clip` clips just as well without creating one. (src/app/
 *    page.tsx carries the same note for the same reason.)
 *  - the STICKY element itself uses overflow-hidden, which is safe — it is not its own
 *    ancestor — and it is what keeps the cards flying in and out clipped to the viewport
 *    rather than bleeding over the sections above and below.
 *
 * CONTENT RULE: the five groups, their faces and their service lines are the brief's. No
 * clients, no numbers, no claims.
 */

interface ServiceGroup {
  id: string;
  name: string;
  /** The face you see on arrival. */
  front: string[];
  /** The reverse: what the group is for, then the full service lines. */
  description: string;
  back: string[];
  /**
   * The card's photograph. `src` is a file in /public; `alt` describes what is actually in
   * the frame, not what the card is about — those differ on the three cards still waiting
   * for their real photography, and a screen reader should hear the picture, not the pitch.
   *
   * `interim: true` marks a photograph that is standing in. Swapping one is a single line:
   * drop the new file into /public/services/ and change `src`.
   */
  image: { src: string; alt: string; interim?: boolean };
  /** Where the card comes in from, as fractions of the viewport. */
  from: { x: number; y: number; rotate: number };
  /** A degree or two off-square at rest, so a stack of five reads as paper, not as a UI. */
  restRotate: number;
  /** Where it leaves to at the end — a different direction from the one it arrived on. */
  exit: { x: number; y: number; rotate: number };
}

const GROUPS: ServiceGroup[] = [
  {
    id: "brand",
    name: "Brand",
    front: ["Digital Branding", "Visual Design"],
    description: "Build a recognizable identity for your mining company.",
    back: ["Digital Branding", "Logo & Visual Design"],
    image: {
      src: "/services/04-pit.webp",
      alt: "Aerial view of a large open-pit mine, haul trucks working the benches and a processing plant on the rim.",
    },
    from: { x: -0.8, y: 0, rotate: -8 },
    restRotate: -2,
    exit: { x: -0.7, y: -0.2, rotate: -12 },
  },
  {
    id: "digital",
    name: "Digital",
    front: ["Website Development", "App Development"],
    description: "Create digital experiences that communicate your story.",
    back: ["Website Development", "App Development"],
    image: {
      src: "/services/03-assay.webp",
      alt: "A geologist logging drill core in a core shack, recording measurements on a handheld data unit.",
    },
    from: { x: 0.6, y: -0.5, rotate: 7 },
    restRotate: 1.5,
    exit: { x: 0.55, y: -0.5, rotate: 12 },
  },
  {
    id: "media",
    name: "Media",
    /*
     * "Industry Storytelling" is the media capability described, not a tenth service — the
     * brief is explicit about that. It appears on both faces because the brief's card content
     * puts it there; it is deliberately not added to any service list elsewhere on the site.
     */
    front: ["Public Relations", "Industry Storytelling"],
    description: "Give your story the visibility and context it deserves.",
    back: ["Public Relations", "Industry Storytelling"],
    // INTERIM. The brief asks for media/interview/conference photography; the project owns
    // none. This is a mining landscape standing in until that photograph exists.
    image: {
      src: "/about/open-pit-golden-hour.webp",
      alt: "An open-pit mine at sunset, haul trucks descending the access ramp.",
      interim: true,
    },
    from: { x: 0, y: 0.6, rotate: -5 },
    restRotate: -1.2,
    exit: { x: -0.25, y: 0.7, rotate: -10 },
  },
  {
    id: "amplify",
    name: "Amplify",
    front: ["Social Media", "Google Ads", "LinkedIn & Meta Ads"],
    description: "Put your message in front of the right audience.",
    back: ["Social Media Marketing", "Google Ads", "LinkedIn & Meta Ads"],
    // INTERIM. Needs a conference / industry-audience photograph; this crew shot is the
    // closest the project owns and does not communicate reach.
    image: {
      src: "/services/02-drill.webp",
      alt: "A drill crew working a rig at a mountain exploration site at golden hour.",
      interim: true,
    },
    from: { x: 0.9, y: 0, rotate: 8 },
    restRotate: 2,
    exit: { x: 0.8, y: 0.2, rotate: 14 },
  },
  {
    id: "engage",
    name: "Engage",
    front: ["Webinars", "Events"],
    description: "Turn attention into meaningful industry relationships.",
    back: ["Webinars & Events"],
    // INTERIM. Needs an event / stage / panel photograph; none exists in the project.
    image: {
      src: "/services/01-survey.webp",
      alt: "A drill rig and its operator at a remote exploration site in arid hill country.",
      interim: true,
    },
    from: { x: -0.6, y: 0.5, rotate: -7 },
    restRotate: -1.6,
    exit: { x: -0.5, y: 0.6, rotate: -14 },
  },
];

/**
 * A card's photograph, filling the width of the face it sits in.
 *
 * next/image with `fill`: these are 1024x1024 files in /public, and the optimiser is what
 * stops a 1MB square being shipped whole for a 416px-wide band. `sizes` states the real
 * rendered width at each breakpoint so it picks the right variant rather than the largest.
 * No `priority` — the section is a long way down the page, and lazy is correct here. The
 * front face is display:none below lg, so a phone never fetches it at all.
 *
 * Two treatments, both restrained, both there to make five separate photographs read as one
 * collection and belong to this palette:
 *  - a navy wash, which pulls every frame toward the site's own colour
 *  - a short gradient into the face's ground colour, so the photograph resolves into the card
 *    instead of ending on a hard horizontal edge
 */
const CardPhoto: React.FC<{
  image: ServiceGroup["image"];
  className: string;
  blendTo: string;
}> = ({ image, className, blendTo }) => (
  <div className={`relative w-full shrink-0 overflow-hidden ${className}`}>
    <Image
      src={image.src}
      alt={image.alt}
      fill
      sizes="(min-width: 1024px) 26rem, (min-width: 640px) 28rem, 100vw"
      className="object-cover object-center"
    />
    <span aria-hidden="true" className="absolute inset-0 bg-[#0B1F3A]/15" />
    <span
      aria-hidden="true"
      className="absolute inset-x-0 bottom-0 h-14"
      style={{ backgroundImage: `linear-gradient(to bottom, ${blendTo}00, ${blendTo})` }}
    />
  </div>
);

const HEADING_LINES = ["Every story", "needs the right", "amplifier."];
const FINALE_LINES = ["One strategy.", "Many ways", "to be seen."];

/** One card's share of the scrubbed timeline. Everything else is positioned against it. */
const SLOT = 1;

/*
 * How far back a card sits once others have landed on it, indexed by how many arrived after.
 * Held inside the brief's 0.85–0.95 / 0.4–0.7 range: a card that has been buried four deep is
 * still legible, which is the point of a stack rather than a slideshow.
 */
const DEPTH = [
  null,
  { scale: 0.94, y: -26, opacity: 0.62 },
  { scale: 0.9, y: -46, opacity: 0.52 },
  { scale: 0.87, y: -62, opacity: 0.45 },
  { scale: 0.85, y: -74, opacity: 0.4 },
] as const;

export const ServicesShowcase: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const journeyRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<Array<HTMLElement | null>>([]);
  const innersRef = useRef<Array<HTMLElement | null>>([]);
  const finaleRef = useRef<HTMLDivElement | null>(null);

  /*
   * Decides the LAYOUT, not just the motion: above lg the cards are stacked on top of one
   * another and only readable while something is driving them, so a reader who has asked for
   * reduced motion gets them in normal flow instead — one clean card at a time, no flips.
   */
  const reduced = useReducedMotionPreference();

  /*
   * A bespoke effect rather than the shared useAboutMotion, because this section needs
   * gsap.matchMedia: the desktop story and the mobile reveals are different animations, and
   * matchMedia is what reverts one — restoring the inline styles it wrote — when the viewport
   * crosses the breakpoint into the other. Without it, resizing out of the desktop story
   * would strand cards at whatever scale and opacity the timeline last set.
   */
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

        /* ---------------- Desktop: the scrubbed story ---------------- */
        mm.add("(min-width: 1024px)", () => {
          const journey = journeyRef.current;
          const cards = cardsRef.current;
          const inners = innersRef.current;
          const finale = finaleRef.current;
          if (!journey || cards.some((c) => !c)) return;

          const vw = () => window.innerWidth;
          const vh = () => window.innerHeight;

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

          GROUPS.forEach((group, index) => {
            const card = cards[index]!;
            const inner = inners[index]!;
            const at = index * SLOT;

            // Arrival. Function values so a resize re-reads the viewport rather than
            // animating from a distance measured on some earlier screen size.
            tl.fromTo(
              card,
              {
                x: () => group.from.x * vw(),
                y: () => group.from.y * vh(),
                rotate: group.from.rotate,
                scale: 1,
                opacity: 0,
              },
              {
                x: 0,
                y: 0,
                rotate: group.restRotate,
                scale: 1,
                opacity: 1,
                duration: 0.55,
              },
              at
            );

            // The turn. power2.inOut rather than the page's ease-out: a page turning over
            // should leave and arrive at the same speed, or the second half looks dropped.
            tl.to(inner, { rotateY: 180, duration: 0.42, ease: "power2.inOut" }, at + 0.62);

            // Settle back one step for each card that lands afterwards, so the stack deepens
            // instead of the previous card simply vanishing.
            for (let later = index + 1; later < GROUPS.length; later++) {
              const depth = DEPTH[later - index];
              if (!depth) continue;
              tl.to(
                card,
                { scale: depth.scale, y: depth.y, opacity: depth.opacity, duration: 0.5 },
                later * SLOT
              );
            }
          });

          /* ---------------- The stack leaves, the statement lands --------------- */
          const outAt = GROUPS.length * SLOT + 0.15;

          GROUPS.forEach((group, index) => {
            tl.to(
              cards[index]!,
              {
                x: () => group.exit.x * vw(),
                y: () => group.exit.y * vh(),
                rotate: group.exit.rotate,
                opacity: 0,
                duration: 0.7,
              },
              outAt + index * 0.06
            );
          });

          if (finale) {
            const words = finale.querySelectorAll<HTMLElement>(WORD_SELECTOR);
            const line = finale.querySelector<HTMLElement>("[data-finale-line]");

            tl.fromTo(
              finale,
              { y: 28, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.4 },
              outAt + 0.45
            );
            if (words.length) {
              tl.fromTo(words, maskedFrom, { ...maskedTo, duration: 0.7, stagger: 0.06 }, outAt + 0.55);
            }
            if (line) {
              tl.fromTo(line, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45 }, outAt + 1.1);
            }
          }
        });

        /* ---------------- Below lg: one card at a time, in flow ---------------- */
        mm.add("(max-width: 1023.98px)", () => {
          cardsRef.current.forEach((card) => {
            if (!card) return;
            gsap.fromTo(
              card,
              { y: 44, rotate: 2, scale: 0.97, opacity: 0 },
              {
                y: 0,
                rotate: 0,
                scale: 1,
                opacity: 1,
                duration: 0.85,
                ease: ABOUT_EASE,
                scrollTrigger: { trigger: card, start: "top 85%", once: true },
              }
            );
          });

          /*
           * The finale is animated explicitly rather than through revealBlocks, because
           * revealBlocks queries DESCENDANTS and this element is itself the
           * [data-about-reveal] — passing it as the root finds its masked words but never the
           * container holding them, which stays at opacity 0 with the whole conclusion
           * invisible inside it.
           */
          const finale = finaleRef.current;
          if (finale) {
            const words = finale.querySelectorAll<HTMLElement>(WORD_SELECTOR);
            const line = finale.querySelector<HTMLElement>("[data-finale-line]");

            const tl = gsap.timeline({
              defaults: { ease: ABOUT_EASE },
              scrollTrigger: { trigger: finale, start: "top 85%", once: true },
            });

            tl.fromTo(finale, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, 0);
            if (words.length) {
              tl.fromTo(words, maskedFrom, { ...maskedTo, duration: 0.8, stagger: 0.06 }, 0.1);
            }
            if (line) {
              tl.fromTo(line, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, 0.65);
            }
          }
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

  return (
    <section
      ref={sectionRef}
      /*
       * overflow-x-clip, NOT overflow-hidden — see the note at the top of this file. This is
       * an ancestor of the sticky stage, and `hidden` here would silently stop it pinning.
       */
      className="relative overflow-x-clip bg-[#0B1F3A] text-white"
    >
      {/* The same dot grain the other sections carry, inverted for a dark ground. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#FFF_1px,transparent_1px)] opacity-[0.035] [background-size:16px_16px]" />

      {/* --- Intro ------------------------------------------------------------- */}
      <div className="container-editorial relative pt-20 md:pt-28">
        <div ref={headerRef}>
          <div data-about-rule-x className={`h-0.5 w-12 bg-[#D4AF37] ${HIDDEN_RULE_X}`} />

          <span
            data-about-reveal
            className={`mt-6 block text-xs font-semibold uppercase tracking-[0.15em] text-[#D4AF37] ${HIDDEN_RISE}`}
          >
            Our Expertise
          </span>

          <h2 className="mt-8 text-balance font-geist text-[clamp(1.875rem,4.2vw,3.5rem)] font-bold uppercase leading-[1.02] tracking-[-0.03em] text-white">
            {HEADING_LINES.map((line) => (
              <span key={line} className="block">
                <MaskedWords text={line} />
              </span>
            ))}
          </h2>

          <p
            data-about-reveal
            className={`mt-8 max-w-[56ch] text-lg font-normal leading-relaxed text-[#F0F4F8]/70 sm:text-xl ${HIDDEN_RISE}`}
          >
            From brand and digital experiences to media, advertising and industry engagement,
            we build the tools that help mining companies get noticed.
          </p>
        </div>
      </div>

      {/* --- The journey -------------------------------------------------------- */}
      <div ref={journeyRef} className={reduced ? "" : "lg:h-[540vh]"}>
        <div
          className={
            reduced
              ? ""
              : "lg:sticky lg:top-0 lg:h-svh lg:overflow-hidden"
          }
        >
          <div
            className={`container-editorial relative pt-16 pb-20 md:pb-28 ${
              reduced ? "" : "lg:flex lg:h-full lg:items-center lg:pt-0 lg:pb-0"
            }`}
          >
            {/* --- Cards ---------------------------------------------------- */}
            {GROUPS.map((group, index) => (
              <article
                key={group.id}
                ref={(el) => {
                  cardsRef.current[index] = el;
                }}
                data-about-reveal
                className={`mx-auto w-full max-w-[28rem] ${HIDDEN_RISE} ${
                  index > 0 ? "mt-10" : ""
                } ${
                  reduced
                    ? ""
                    : /*
                       * Centred with negative margins — HALF of w-[26rem] and h-[32rem] — and
                       * deliberately not with -translate-x/y-1/2.
                       *
                       * Tailwind v4 compiles those to the standalone `translate` property,
                       * and GSAP does not leave that property alone: when it takes an element
                       * over it folds any existing translate/rotate/scale into its own matrix
                       * and sets them to `none`. The centring then becomes part of the value
                       * every tween overwrites, and the card drifts half its own size off
                       * centre. Margins are layout, not transform, so nothing can absorb them.
                       */
                      "lg:absolute lg:left-1/2 lg:top-1/2 lg:-ml-[13rem] lg:-mt-[16rem] lg:h-[32rem] lg:w-[26rem] lg:max-w-none lg:[perspective:1400px]"
                }`}
              >
                <div
                  ref={(el) => {
                    innersRef.current[index] = el;
                  }}
                  className={reduced ? "" : "lg:relative lg:h-full lg:[transform-style:preserve-3d]"}
                >
                  {/* FRONT — arrival face. Never rendered below lg, and never under reduced
                      motion, where there is no turn to make it the front OF anything. */}
                  <div
                    className={
                      reduced
                        ? "hidden"
                        : // p-10 moved off the face and onto the text block below it, so the
                          // photograph can reach the card's edges. overflow-hidden keeps it
                          // inside the border. The card's own size, position and animation are
                          // untouched — this only reorganises what is inside the face.
                          "hidden lg:absolute lg:inset-0 lg:flex lg:flex-col lg:overflow-hidden lg:border lg:border-[#D4AF37]/30 lg:bg-[#F7F5EF] lg:[backface-visibility:hidden]"
                    }
                  >
                    <CardPhoto image={group.image} className="h-[46%]" blendTo="#F7F5EF" />

                    <div className="flex flex-1 flex-col justify-between px-10 py-7">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs tabular-nums text-[#B8860B]">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="h-px w-12 bg-[#B8860B]/50" />
                      </div>

                      <h3 className="font-geist text-[3.25rem] font-black uppercase leading-[0.92] tracking-[-0.035em] text-[#0B1F3A]">
                        {group.name}
                      </h3>

                      <ul>
                        {group.front.map((item) => (
                          <li
                            key={item}
                            className="border-t border-[#0B1F3A]/12 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#3A3D42]"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* BACK — the reverse. It is also the only face below lg and under reduced
                      motion, because it carries the fuller content: what the group is for,
                      then the complete service lines. */}
                  <div
                    className={`flex flex-col overflow-hidden border border-[#D4AF37]/30 bg-white ${
                      reduced
                        ? ""
                        : "lg:absolute lg:inset-0 lg:[backface-visibility:hidden] lg:[transform:rotateY(180deg)]"
                    }`}
                  >
                    {/*
                      A shallower band than the front's. This face is the reading — the
                      description and the full service lines need the room — and below lg it is
                      the ONLY face, so it is also what gives a phone its photography.
                    */}
                    <CardPhoto image={group.image} className="h-40 lg:h-36" blendTo="#FFFFFF" />

                    <div className="flex flex-1 flex-col justify-between p-8 sm:p-10 lg:px-10 lg:py-7">
                      <div>
                        <div className="flex items-center justify-between">
                        <span
                          className={`font-mono text-xs tabular-nums text-[#B8860B] ${
                            reduced ? "" : "lg:hidden"
                          }`}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className={`h-px w-12 bg-[#B8860B]/50 ${reduced ? "" : "lg:hidden"}`} />
                      </div>

                      <h3
                        className={`font-geist font-black uppercase tracking-[0.12em] text-[#B8860B] ${
                          reduced ? "mt-6 text-sm" : "mt-6 text-sm lg:mt-0"
                        }`}
                      >
                        {group.name}
                      </h3>

                      <p className="mt-5 font-serif text-[clamp(1.5rem,2.4vw,2rem)] font-normal leading-[1.15] tracking-[-0.015em] text-[#0B1F3A]">
                        {group.description}
                      </p>
                    </div>

                      <ul className="mt-8">
                        {group.back.map((item) => (
                          <li
                            key={item}
                            className="border-t border-[#0B1F3A]/12 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#3A3D42]"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </article>
            ))}

            {/* --- The conclusion --------------------------------------------- */}
            {/*
              pointer-events-none: above lg this sits over the card stack for the whole
              journey at opacity 0, and an invisible sheet of text should not be able to
              intercept anything. It carries no controls of its own.
            */}
            <div
              ref={finaleRef}
              data-about-reveal
              className={`pointer-events-none mt-16 text-center ${HIDDEN_RISE} ${
                reduced
                  ? ""
                  : "lg:absolute lg:inset-0 lg:mt-0 lg:flex lg:flex-col lg:items-center lg:justify-center"
              }`}
            >
              <p className="font-geist text-[clamp(1.75rem,4.6vw,4rem)] font-black uppercase leading-[0.98] tracking-[-0.035em] text-white">
                {FINALE_LINES.map((line) => (
                  <span key={line} className="block">
                    <MaskedWords text={line} />
                  </span>
                ))}
              </p>

              {/*
                A statement, not the page's call to action — that arrives in a later step, and
                two competing CTAs in one column is how a page stops having one. Rendered as
                text rather than a link because there is nowhere yet to send anyone.
              */}
              <span
                data-finale-line
                className="mt-10 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]"
              >
                Explore what we can build together
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesShowcase;
