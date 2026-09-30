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
 * Section 04 — Advisor.
 *
 * Laura Stein gets her own section rather than a third card in Management, because the
 * source treats the advisory role as separate from the executive one and because the fact
 * that carries this section — fifty-plus years — deserves to be set as a figure rather
 * than buried in a sentence.
 *
 * "50+" is the source's "50-plus years of exceptional global mining industry experience",
 * set as a numeral. Nothing here is rounded, extrapolated, or added to.
 */

const EXPERTISE = [
  "Exploration",
  "Project Development",
  "Strategic Advisory",
  "Mineral & Market Expertise",
];

export const AboutAdvisor: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const figureRef = useRef<HTMLDivElement | null>(null);

  useAboutMotion(sectionRef, (scope) => {
    if (headerRef.current) revealBlocks(headerRef.current);
    if (bodyRef.current) revealBlocks(bodyRef.current, { stagger: 0.06 });

    /*
     * A slow drift on the figure as the section passes. It rides a WRAPPER, not the
     * numeral itself: the numeral is already carrying a reveal that animates `y`, and two
     * tweens writing the same property on one element is the last one wins, not both.
     */
    if (figureRef.current) {
      gsap.fromTo(
        figureRef.current,
        { y: 28 },
        {
          y: -28,
          ease: "none",
          scrollTrigger: {
            trigger: scope,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.5,
          },
        }
      );
    }
  });

  return (
    <section ref={sectionRef} className="relative border-b border-[#E5E4DE] bg-white">
      <div className="container-editorial py-20 md:py-28">
        {/* --- Who ---------------------------------------------------------------- */}
        <div ref={headerRef}>
          <div data-about-rule-x className={`h-0.5 w-12 bg-[#B8860B] ${HIDDEN_RULE_X}`} />
          <span
            data-about-reveal
            className={`mt-6 block text-xs font-semibold uppercase tracking-[0.15em] text-[#B8860B] ${HIDDEN_RISE}`}
          >
            Advisor
          </span>

          <h2 className="mt-6 font-serif text-[clamp(2.5rem,6vw,4.5rem)] font-normal leading-[1.05] tracking-[-0.025em] text-[#0B1F3A]">
            <MaskedWords text="Laura Stein" />
          </h2>

          <p
            data-about-reveal
            className={`mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-[#57595E] ${HIDDEN_RISE}`}
          >
            Advisor, Mining Discovery
          </p>
        </div>

        {/* --- The figure, and what sits behind it -------------------------------- */}
        <div
          ref={bodyRef}
          className="mt-14 grid grid-cols-1 gap-x-16 gap-y-12 border-t border-[#E5E4DE] pt-12 md:mt-16 lg:grid-cols-12"
        >
          <div className="lg:col-span-5">
            <div ref={figureRef}>
              <p
                data-about-reveal
                className={`font-geist text-[clamp(4.5rem,11vw,8.5rem)] font-semibold leading-[0.85] tracking-[-0.05em] tabular-nums text-[#B8860B] ${HIDDEN_RISE}`}
              >
                50+
              </p>
              <p
                data-about-reveal
                className={`mt-6 max-w-[20ch] font-serif text-2xl font-normal leading-[1.2] tracking-[-0.015em] text-[#0B1F3A] sm:text-3xl ${HIDDEN_RISE}`}
              >
                years of global mining industry experience
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 lg:border-l lg:border-[#E5E4DE] lg:pl-12">
            <p
              data-about-reveal
              className={`text-lg font-normal leading-relaxed text-[#3A3D42] sm:text-xl ${HIDDEN_RISE}`}
            >
              Laura Stein brings 50-plus years of exceptional global mining industry
              experience, spanning exploration, project development, and strategic advisory
              across mineral and market boundaries. Her expertise helps identify, evaluate,
              and advance promising mineral opportunities with confidence and transparency.
            </p>

            <ul className="mt-10">
              {EXPERTISE.map((item, index) => (
                <li
                  key={item}
                  data-about-reveal
                  className={`flex items-baseline gap-5 border-b border-[#E5E4DE] py-4 ${HIDDEN_RISE}`}
                >
                  <span className="font-mono text-[11px] tabular-nums text-[#B8860B]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-base font-medium text-[#1A1D21] sm:text-lg">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutAdvisor;
