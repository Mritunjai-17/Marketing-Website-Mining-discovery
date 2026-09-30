"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import {
  HIDDEN_RISE,
  HIDDEN_RULE_X,
  MaskedWords,
  revealBlocks,
  useAboutMotion,
} from "./reveal";

/*
 * Section 08 — Looking Ahead.
 *
 * The page's one dark section, and the only place it changes ground. Navy is already the
 * site's second surface — the hero on the homepage and the footer both sit on #0B1F3A — so
 * this borrows the existing palette rather than introducing anything, and it gives the
 * closing statement somewhere to land that the seven light sections above it cannot.
 *
 * Gold shifts to #D4AF37 here, the same swap the footer makes: #B8860B is tuned for
 * contrast against near-white and goes muddy on navy.
 *
 * Everything named below — the three regions, the data tools, the video storytelling, the
 * community, and truth over noise — is from miningdiscovery.com/about-us. No market,
 * timeline, or target has been added.
 */

const REGIONS = ["Africa", "Latin America", "Asia"];

const BUILDING = [
  "Advanced data tools",
  "Improved video storytelling",
  "An engaged mining community",
];

export const AboutLookingAhead: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const closerRef = useRef<HTMLDivElement | null>(null);
  const driftRef = useRef<HTMLDivElement | null>(null);

  useAboutMotion(sectionRef, (scope) => {
    if (headerRef.current) revealBlocks(headerRef.current);
    if (bodyRef.current) revealBlocks(bodyRef.current, { stagger: 0.08 });
    if (closerRef.current) revealBlocks(closerRef.current, { start: "top 85%" });

    /*
     * A slow lateral drift on the regions as the section passes — 24px across the whole
     * traversal, which is movement you notice only as depth. The section clips its own
     * overflow, so this can never widen the document or introduce a horizontal scrollbar.
     */
    if (driftRef.current) {
      gsap.fromTo(
        driftRef.current,
        { x: 24 },
        {
          x: -24,
          ease: "none",
          scrollTrigger: { trigger: scope, start: "top bottom", end: "bottom top", scrub: 0.5 },
        }
      );
    }
  });

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[#0B1F3A] text-white"
    >
      {/* The same dot grain the hero carries, inverted for a dark ground. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#FFF_1px,transparent_1px)] opacity-[0.035] [background-size:16px_16px]" />

      <div className="container-editorial relative py-24 md:py-32">
        <div ref={headerRef}>
          <div data-about-rule-x className={`h-0.5 w-12 bg-[#D4AF37] ${HIDDEN_RULE_X}`} />
          <span
            data-about-reveal
            className={`mt-6 block text-xs font-semibold uppercase tracking-[0.15em] text-[#D4AF37] ${HIDDEN_RISE}`}
          >
            Looking Ahead
          </span>

          <h2 className="mt-6 max-w-[16ch] font-serif text-[clamp(2.25rem,5.4vw,4rem)] font-normal leading-[1.06] tracking-[-0.025em] text-white">
            <MaskedWords text="A trusted global voice in mining." />
          </h2>
        </div>

        <div ref={bodyRef} className="mt-16 md:mt-24">
          {/* --- Where ------------------------------------------------------------ */}
          <span
            data-about-reveal
            className={`block text-xs font-semibold uppercase tracking-[0.15em] text-[#F0F4F8]/50 ${HIDDEN_RISE}`}
          >
            Expanding coverage into
          </span>

          <div ref={driftRef} className="mt-8">
            <ul className="flex flex-wrap items-baseline gap-x-10 gap-y-4 sm:gap-x-16">
              {REGIONS.map((region, index) => (
                <li
                  key={region}
                  data-about-reveal
                  className={`flex items-baseline gap-4 ${HIDDEN_RISE}`}
                >
                  <span className="font-mono text-[11px] tabular-nums text-[#D4AF37]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="font-serif text-[clamp(2rem,5.5vw,4rem)] font-normal leading-[1.05] tracking-[-0.03em] text-white">
                    {region}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* --- What ------------------------------------------------------------- */}
          <div className="mt-20 grid grid-cols-1 gap-x-16 gap-y-10 border-t border-white/10 pt-12 md:mt-24 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <span
                data-about-reveal
                className={`block text-xs font-semibold uppercase tracking-[0.15em] text-[#F0F4F8]/50 ${HIDDEN_RISE}`}
              >
                And building
              </span>
            </div>

            <ul className="lg:col-span-8">
              {BUILDING.map((item) => (
                <li
                  key={item}
                  data-about-reveal
                  className={`flex items-baseline gap-5 border-b border-white/10 py-5 first:border-t first:border-white/10 ${HIDDEN_RISE}`}
                >
                  <span
                    aria-hidden="true"
                    className="h-1 w-1 shrink-0 translate-y-[-0.35em] rounded-full bg-[#D4AF37]"
                  />
                  <span className="text-xl font-normal leading-snug text-[#F0F4F8] sm:text-2xl">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* --- The closing commitment -------------------------------------------- */}
        <div ref={closerRef} className="mt-24 border-t border-white/10 pt-14 md:mt-32">
          <p className="max-w-[24ch] font-serif text-[clamp(2rem,5vw,3.75rem)] font-normal leading-[1.08] tracking-[-0.025em] text-[#D4AF37]">
            <MaskedWords text="Truth over noise." />
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutLookingAhead;
