"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import {
  ABOUT_EASE,
  HIDDEN_RISE,
  HIDDEN_RULE_X,
  MaskedWords,
  groupWordsByLine,
  maskedFrom,
  maskedTo,
  useAboutMotion,
  WORD_SELECTOR,
} from "./reveal";

/*
 * Section 01 — the hero.
 *
 * The one section on this page that reveals on load rather than on scroll: it is already
 * on screen when the page arrives, so a scroll trigger would either fire instantly or,
 * worse, wait for a scroll that never comes. Everything below it is scroll-driven.
 */

const HEADING = "About Mining Discovery";
/* Curly quotes as characters rather than &ldquo;/&rdquo; entities: identical output, but
 * they survive the String.split(" ") that builds the word masks. */
const QUOTE = "“One platform. Every major mining audience.”";

export const AboutHero: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const quoteRef = useRef<HTMLParagraphElement | null>(null);

  useAboutMotion(sectionRef, (scope) => {
    const rule = scope.querySelector<HTMLElement>("[data-about-rule-x]");
    const eyebrow = scope.querySelector<HTMLElement>("[data-about-reveal]");
    const headingWords = headingRef.current?.querySelectorAll<HTMLElement>(WORD_SELECTOR);
    const quoteLines = groupWordsByLine(quoteRef.current);

    const tl = gsap.timeline({ defaults: { ease: ABOUT_EASE } });

    if (rule) tl.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.9 }, 0);
    if (eyebrow) {
      tl.fromTo(eyebrow, { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, 0.28);
    }
    if (headingWords?.length) {
      tl.fromTo(headingWords, maskedFrom, { ...maskedTo, stagger: 0.09 }, 0.46);
    }

    // The quote reveals line by line, on lines the browser chose rather than lines we
    // guessed — see groupWordsByLine.
    quoteLines.forEach((line, index) => {
      tl.fromTo(line, maskedFrom, { ...maskedTo }, 0.86 + index * 0.13);
    });

    /*
     * Scroll parallax. Scrubbed off scroll position rather than fired after the entrance,
     * which means it is worth exactly 0px for the whole time the hero sits at the top of
     * the page — it can only begin once the reader has started moving, by construction.
     * 60px across the section's entire exit is a drift, not a departure: the section keeps
     * its height and its bottom border, and the copy never fades out.
     */
    if (contentRef.current) {
      gsap.to(contentRef.current, {
        y: -60,
        ease: "none",
        scrollTrigger: {
          trigger: scope,
          start: "top top",
          end: "bottom top",
          scrub: 0.4,
        },
      });
    }
  });

  return (
    <section
      ref={sectionRef}
      className="relative border-b border-[#E5E4DE]"
    >
      {/* Same 16px dot grain the Stats section carries, at the same 2% opacity. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#000_1px,transparent_1px)] opacity-[0.02] [background-size:16px_16px]" />

      <div
        ref={contentRef}
        className="container-editorial relative pt-32 pb-20 md:pt-40 md:pb-28"
      >
        <div
          data-about-rule-x
          className={`h-0.5 w-12 bg-[#B8860B] ${HIDDEN_RULE_X}`}
        />

        <span
          data-about-reveal
          className={`mt-6 block text-xs font-semibold uppercase tracking-[0.15em] text-[#B8860B] ${HIDDEN_RISE}`}
        >
          About Us
        </span>

        <h1
          ref={headingRef}
          className="mt-6 max-w-[16ch] font-geist text-[clamp(2.25rem,5vw,4rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-[#0B1F3A]"
        >
          <MaskedWords text={HEADING} />
        </h1>

        <p
          ref={quoteRef}
          className="mt-8 max-w-3xl font-serif text-3xl font-normal leading-[1.15] tracking-[-0.015em] text-[#0B1F3A] sm:text-4xl lg:text-[44px]"
        >
          <MaskedWords text={QUOTE} />
        </p>
      </div>
    </section>
  );
};

export default AboutHero;
