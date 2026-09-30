"use client";

import React, { useRef } from "react";
import {
  HIDDEN_RISE,
  HIDDEN_RULE_X,
  MaskedWords,
  revealBlocks,
  useAboutMotion,
} from "./reveal";

/*
 * Section 06 — Our Principles.
 *
 * Five rows at display scale rather than five cards. A principle is a one-word claim with a
 * one-line justification; setting the word large and the justification beside it puts the
 * claim first and lets a reader take all five in one pass down the page.
 *
 * The interaction is hover-only emphasis, and the descriptions are always visible. A
 * disclosure that hid them until hover would be a worse page on every touch device, where
 * there is no hover to give.
 *
 * All five are from miningdiscovery.com/about-us, with the source's meaning intact.
 */

const PRINCIPLES: Array<{ name: string; description: string }> = [
  { name: "Integrity", description: "Truthful and verified reporting." },
  { name: "Clarity", description: "Complex issues explained in clear, impactful language." },
  { name: "Innovation", description: "New tools and formats that keep coverage relevant." },
  {
    name: "Respect",
    description: "Consideration for communities, the environment, investors, and workers.",
  },
  { name: "Partnership", description: "Collaboration with companies, experts, and institutions." },
];

export const AboutPrinciples: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const rowsRef = useRef<Array<HTMLElement | null>>([]);

  useAboutMotion(sectionRef, () => {
    if (headerRef.current) revealBlocks(headerRef.current);

    // Row by row, each on its own arrival. Five rows at this scale span more than a
    // viewport, so one shared trigger would play most of the sequence off screen.
    rowsRef.current.forEach((row) => {
      if (row) revealBlocks(row, { stagger: 0.05, start: "top 88%" });
    });
  });

  return (
    <section ref={sectionRef} className="border-b border-[#E5E4DE] bg-white">
      <div className="container-editorial py-20 md:py-28">
        <div ref={headerRef}>
          <div data-about-rule-x className={`h-0.5 w-12 bg-[#B8860B] ${HIDDEN_RULE_X}`} />
          <span
            data-about-reveal
            className={`mt-6 block text-xs font-semibold uppercase tracking-[0.15em] text-[#B8860B] ${HIDDEN_RISE}`}
          >
            Our Principles
          </span>
          <h2 className="mt-6 max-w-[18ch] font-serif text-[clamp(2rem,4.2vw,3.25rem)] font-normal leading-[1.1] tracking-[-0.02em] text-[#0B1F3A]">
            <MaskedWords text="What we hold to." />
          </h2>
        </div>

        <div className="mt-14 md:mt-20">
          {PRINCIPLES.map((principle, index) => (
            <div
              key={principle.name}
              ref={(el) => {
                rowsRef.current[index] = el;
              }}
              className="group relative border-t border-[#E5E4DE] last:border-b"
            >
              {/*
                The hover rule, sitting on the row's own top border. Driven purely by CSS
                so it never has to coordinate with the GSAP reveal — and it uses Tailwind's
                `scale` utilities, which in v4 compile to the standalone `scale` property
                rather than to `transform`, so it cannot collide with a tween either.
              */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 -top-px h-px origin-left scale-x-0 bg-[#B8860B] transition-transform duration-500 ease-out group-hover:scale-x-100"
              />

              <div className="grid grid-cols-1 items-baseline gap-x-16 gap-y-4 py-8 md:py-10 lg:grid-cols-12">
                <div className="flex items-baseline gap-5 lg:col-span-5">
                  <span
                    data-about-reveal
                    className={`font-mono text-[11px] tabular-nums text-[#B8860B] ${HIDDEN_RISE}`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <h3 className="font-serif text-[clamp(2rem,4.6vw,3.5rem)] font-normal leading-[1.05] tracking-[-0.025em] text-[#0B1F3A] transition-colors duration-500 group-hover:text-[#B8860B]">
                    <MaskedWords text={principle.name} />
                  </h3>
                </div>

                <p
                  data-about-reveal
                  className={`max-w-[44ch] text-lg font-normal leading-relaxed text-[#57595E] transition-colors duration-500 group-hover:text-[#3A3D42] sm:text-xl lg:col-span-7 ${HIDDEN_RISE}`}
                >
                  {principle.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutPrinciples;
