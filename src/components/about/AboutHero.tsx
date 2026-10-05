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
import { AboutEyebrow } from "./AboutEyebrow";

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
      className="relative overflow-hidden border-b border-[#E5E4DE]"
    >
      {/* Same 16px dot grain the Stats section carries, at the same 2% opacity. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#000_1px,transparent_1px)] opacity-[0.02] [background-size:16px_16px]" />

      <div
        ref={contentRef}
        className="container-editorial relative flex flex-col items-center text-center pt-32 pb-24 md:pt-44 md:pb-32"
      >
        {/* Soft atmospheric golden ambient glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[340px] w-[620px] max-w-full rounded-full bg-gradient-to-tr from-[#D4AF37]/12 via-[#B8860B]/05 to-transparent blur-[90px]"
        />

        <AboutEyebrow text="About Us" className="justify-center" />

        <h1
          ref={headingRef}
          className="mt-6 max-w-4xl font-space-grotesk text-[clamp(2.5rem,5.6vw,4.5rem)] font-bold uppercase leading-[1.05] tracking-[-0.03em] text-[#0B1F3A]"
        >
          <MaskedWords text={HEADING} goldWords={["Discovery"]} />
        </h1>

        <p
          ref={quoteRef}
          className="mt-8 max-w-3xl font-space-grotesk text-xl font-medium leading-[1.3] tracking-[-0.015em] text-[#3A3D42] sm:text-2xl lg:text-[clamp(1.5rem,2.6vw,2.15rem)]"
        >
          <MaskedWords text={QUOTE} />
        </p>
      </div>
    </section>
  );
};

export default AboutHero;
