"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { ArrowDown } from "lucide-react";
import {
  ABOUT_EASE,
  HIDDEN_RISE,
  HIDDEN_RULE_X,
  MaskedWords,
  groupWordsByLine,
  maskedFrom,
  maskedTo,
  useAboutMotion,
} from "@/components/about/reveal";

/*
 * The /services hero.
 *
 * Same design language as /about — ivory ground, gold hairline, eyebrow, masked word
 * reveal, scrubbed parallax — but a different composition on purpose. /about opens
 * left-aligned in a serif register, reading like the first page of a document. This one is
 * centred, uppercase and set in Geist Black: a statement rather than an opening paragraph.
 * That is the whole differentiation, and it is enough — nothing here needs a colour, a
 * font, or a spacing rule the site does not already own.
 *
 * It has nothing in common with the homepage's ServicesScrollStory beyond the word
 * "services", which is deliberate: that section is a pinned four-stage scroll story and
 * this is a standalone route. Neither imports the other, so neither can break the other.
 *
 * The motion primitives come from the /about module rather than a second copy. They are
 * page-neutral in behaviour — only the name says "about" — and the alternative was either
 * duplicating them or renaming ten About components that this task was told to leave
 * alone. Worth promoting to a shared name when a third page wants them.
 */

/*
 * The headline as two authored lines, so the break after "companies" is a decision rather
 * than an accident of the current viewport width. Each line still wraps on its own when
 * the screen is too narrow to hold it — on a phone this reads as four lines, and the
 * reveal follows whatever the browser actually did (see the timeline below), not what it
 * did at 1440.
 *
 * IT WAS THREE, WITH "companies" ALONE ON THE MIDDLE LINE. That was not a choice so much
 * as a consequence: at the old clamp's 88px ceiling "We make mining companies" measures
 * about 15.45em = 1360px, and container-editorial gives it 1152px, so the words could not
 * share a line at any laptop width. The type scale below came down with this change, and
 * the two now fall out evenly at 15.45em and 13.45em.
 *
 * Sentence case in the markup with `uppercase` in CSS, not caps in the string: the caps are
 * a typographic treatment, and some screen readers spell out an all-caps word letter by
 * letter when it is caps in the DOM.
 */
const HEADLINE_LINES = ["We make mining companies", "impossible to ignore."];

/** Where the CTA sends the reader. The section it names lives in services/page.tsx. */
const NEXT_SECTION_ID = "capabilities";

export const ServicesHero: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const headlineRef = useRef<HTMLHeadingElement | null>(null);

  useAboutMotion(sectionRef, (scope) => {
    const rule = scope.querySelector<HTMLElement>("[data-about-rule-x]");
    const eyebrow = scope.querySelector<HTMLElement>("[data-hero-eyebrow]");
    const body = scope.querySelector<HTMLElement>("[data-hero-body]");
    const cta = scope.querySelector<HTMLElement>("[data-hero-cta]");
    const lines = groupWordsByLine(headlineRef.current);

    const tl = gsap.timeline({ defaults: { ease: ABOUT_EASE } });

    if (rule) tl.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.9 }, 0);
    if (eyebrow) {
      tl.fromTo(eyebrow, { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, 0.28);
    }

    /*
     * The headline, line by line — on the lines the browser rendered rather than the three
     * we authored, so the phone's five lines each get their own beat instead of three
     * groups moving in a way that has nothing to do with what is on screen.
     */
    lines.forEach((line, index) => {
      tl.fromTo(line, maskedFrom, { ...maskedTo }, 0.46 + index * 0.13);
    });

    // Supporting copy and CTA come after the last line has started, not after it has
    // finished: waiting for the full 1.05s would leave a hole in the middle of the entrance.
    const afterHeadline = 0.46 + lines.length * 0.13;

    if (body) {
      tl.fromTo(body, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.85 }, afterHeadline);
    }
    if (cta) {
      tl.fromTo(cta, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, afterHeadline + 0.18);
    }

    /*
     * Scroll parallax, the same one /about's hero carries. Scrubbed off scroll position
     * rather than fired after the entrance, so it is worth exactly 0px for the whole time
     * the hero is at rest at the top of the page — it can only begin once the reader has
     * started moving. 60px across the section's entire exit is a drift, not a departure:
     * the section keeps its height, the copy never fades out, and the section below simply
     * arrives underneath it.
     */
    if (contentRef.current) {
      gsap.to(contentRef.current, {
        y: -60,
        ease: "none",
        scrollTrigger: { trigger: scope, start: "top top", end: "bottom top", scrub: 0.4 },
      });
    }
  });

  /*
   * Lenis owns scrolling on this site (see SmoothScroll.tsx, which parks the instance on
   * window for exactly this), so hand the jump to it when it is there. When it is not —
   * no JS yet, or a reader with prefers-reduced-motion, for whom SmoothScroll never
   * initialises — this does nothing and the browser follows the href natively. That is why
   * it is a real anchor and not a button: the fallback has to be a working link.
   */
  const handleCtaClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const lenis = (window as unknown as { lenis?: { scrollTo: (t: string) => void } }).lenis;
    if (!lenis) return;

    event.preventDefault();
    lenis.scrollTo(`#${NEXT_SECTION_ID}`);
  };

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-svh items-center border-b border-[#E5E4DE]"
    >
      {/* The same 16px dot grain /about carries, at the same 2% opacity — the page family's
          texture, not a new one. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#000_1px,transparent_1px)] opacity-[0.02] [background-size:16px_16px]" />

      <div
        ref={contentRef}
        className="container-editorial relative w-full py-32 text-center md:py-40"
      >
        <div
          data-about-rule-x
          className={`mx-auto h-0.5 w-12 bg-[#B8860B] ${HIDDEN_RULE_X}`}
        />

        <span
          data-hero-eyebrow
          data-about-reveal
          className={`mt-6 block text-xs font-semibold uppercase tracking-[0.15em] text-[#B8860B] ${HIDDEN_RISE}`}
        >
          Our Services
        </span>

        {/*
          The dominant element, and sized to say so: Geist Black, uppercase, leading below 1
          so the three lines read as one block of type rather than three sentences. The same
          display register TrustedBy uses on the homepage, which is where this site already
          keeps its loud voice.
        */}
        <h1
          ref={headlineRef}
          /*
            text-balance so that when an authored line is too wide for the screen and has to
            wrap, it splits into even halves instead of stranding one word: on a phone
            "impossible to ignore." breaks as IMPOSSIBLE / TO IGNORE. rather than
            IMPOSSIBLE TO / IGNORE. It is inert at any width where the line already fits, so
            the desktop composition is untouched, and browsers without it simply wrap the
            way they did before.
          */
          className="mt-8 text-balance font-geist text-[clamp(2.5rem,5.6vw,4.5rem)] font-black uppercase leading-[0.94] tracking-[-0.035em] text-[#0B1F3A]"
        >
          {HEADLINE_LINES.map((line) => (
            <span key={line} className="block">
              <MaskedWords text={line} />
            </span>
          ))}
        </h1>

        <p
          data-hero-body
          data-about-reveal
          className={`mx-auto mt-10 max-w-[44ch] text-lg font-normal leading-relaxed text-[#3A3D42] sm:text-xl ${HIDDEN_RISE}`}
        >
          Strategic marketing, media and digital solutions built specifically for the mining
          industry.
        </p>

        {/*
          An editorial link, not a filled button. The page's one filled gold button belongs
          to the conversion CTA further down the funnel; a hero that opens with the same
          treatment spends that emphasis on a scroll cue.
        */}
        <div data-hero-cta data-about-reveal className={`mt-14 ${HIDDEN_RISE}`}>
          <a
            href={`#${NEXT_SECTION_ID}`}
            onClick={handleCtaClick}
            className="group inline-flex flex-col items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8860B] focus-visible:ring-offset-4 focus-visible:ring-offset-[#F7F5EF]"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0B1F3A] transition-colors duration-300 group-hover:text-[#B8860B]">
              Explore our capabilities
            </span>

            {/* Hairline under the label, drawn from the centre so it opens both ways on
                hover. `scale` is its own property in Tailwind v4, so this can never collide
                with the transform GSAP writes on the parent. */}
            <span
              aria-hidden="true"
              className="h-px w-14 origin-center scale-x-50 bg-[#B8860B] transition-transform duration-500 ease-out group-hover:scale-x-100"
            />

            {/* No idle bob. The arrow moves once, on hover, because the reader did
                something — an animation that loops forever is a distraction, not a cue. */}
            <ArrowDown
              aria-hidden="true"
              className="h-4 w-4 text-[#B8860B] transition-transform duration-300 group-hover:translate-y-1"
            />
          </a>
        </div>
      </div>
    </section>
  );
};

export default ServicesHero;
