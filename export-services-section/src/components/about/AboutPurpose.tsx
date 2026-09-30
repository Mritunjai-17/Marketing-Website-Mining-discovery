"use client";

import React, { useRef, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  HIDDEN_RISE,
  HIDDEN_RULE_X,
  MaskedWords,
  revealBlocks,
  useAboutMotion,
} from "./reveal";

/*
 * Section 05 — Our Purpose.
 *
 * Scroll-driven rather than a four-card grid: the four purposes are a sequence of claims
 * about what the platform is for, and reading them one at a time — with the other three
 * present but receded — is the difference between an argument and a menu.
 *
 * The mechanic is a sticky index beside scrolling panels. Deliberately NOT a GSAP pin:
 * a pin injects a spacer element and rewrites the section's height, which is exactly the
 * kind of change that fights Lenis and breaks on resize. `position: sticky` costs no DOM
 * and no measurement, and ScrollTrigger is only asked to answer one question — which panel
 * is currently under the reader's eye.
 *
 * All four purposes are from miningdiscovery.com/about-us, in the source's order.
 */

interface Purpose {
  title: string;
  description: string;
  /** The specifics the source names under this purpose. Empty where it names none. */
  tags: string[];
}

const PURPOSES: Purpose[] = [
  {
    title: "Illuminate the Industry",
    description:
      "Clear reporting across the areas that decide how the sector moves — from the drill bit to the disclosure.",
    tags: ["Exploration", "Production", "Regulation", "Investment", "ESG"],
  },
  {
    title: "Insight into Action",
    description:
      "Interpreting mining news and information so that leaders and investors can make informed decisions.",
    tags: [],
  },
  {
    title: "Foster Transparency",
    description:
      "A clear view of company operations, risks, and community impact.",
    tags: [],
  },
  {
    title: "Build Bridges",
    description:
      "Connecting the sector's constituencies to one another through journalism and data.",
    tags: ["Mining Companies", "Investors", "Regulators", "Communities"],
  },
];

export const AboutPurpose: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const panelsRef = useRef<Array<HTMLElement | null>>([]);

  /*
   * null means "nothing is driving this" — no JS yet, or a reader who asked for reduced
   * motion. In that state every panel renders at full emphasis, so the de-emphasis is
   * something the scroll interaction adds rather than something the content depends on.
   */
  const [active, setActive] = useState<number | null>(null);

  useAboutMotion(sectionRef, () => {
    if (headerRef.current) revealBlocks(headerRef.current);

    panelsRef.current.forEach((panel, index) => {
      if (!panel) return;

      revealBlocks(panel, { stagger: 0.06 });

      // A band across the middle of the viewport: whichever panel is crossing it owns the
      // index. start/end share the same 55% line so the handover between two panels is a
      // single moment rather than an overlap where both, or neither, are active.
      ScrollTrigger.create({
        trigger: panel,
        start: "top 55%",
        end: "bottom 55%",
        onToggle: (self) => {
          if (self.isActive) setActive(index);
        },
      });
    });
  });

  return (
    <section ref={sectionRef} className="border-b border-[#E5E4DE]">
      <div className="container-editorial py-20 md:py-28">
        <div className="grid grid-cols-1 gap-x-16 lg:grid-cols-12">
          {/* --- Sticky index ---------------------------------------------------- */}
          {/*
            No data-about-reveal on this column or any ancestor of it. An animated `y`
            leaves a transform behind, and a transformed ancestor becomes the containing
            block for a sticky descendant — which silently kills the pinning. The children
            inside it animate instead.
          */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-32" ref={headerRef}>
              <div data-about-rule-x className={`h-0.5 w-12 bg-[#B8860B] ${HIDDEN_RULE_X}`} />
              <span
                data-about-reveal
                className={`mt-6 block text-xs font-semibold uppercase tracking-[0.15em] text-[#B8860B] ${HIDDEN_RISE}`}
              >
                Our Purpose
              </span>

              <h2 className="mt-6 max-w-[16ch] font-serif text-[clamp(2rem,4.2vw,3.25rem)] font-normal leading-[1.1] tracking-[-0.02em] text-[#0B1F3A]">
                <MaskedWords text="What the platform is for." />
              </h2>

              {/*
                The index is a reading aid, not a control — there is nothing to click, and
                presenting it as a list of buttons would promise navigation this section
                does not offer. aria-hidden, because the panels below already carry every
                one of these titles as a real heading.
              */}
              <ol
                aria-hidden="true"
                data-about-reveal
                className={`mt-10 hidden lg:block ${HIDDEN_RISE}`}
              >
                {PURPOSES.map((purpose, index) => {
                  const isActive = active === null || active === index;

                  return (
                    <li
                      key={purpose.title}
                      className="flex items-baseline gap-5 border-b border-[#E5E4DE] py-3.5"
                    >
                      <span
                        className={`font-mono text-[11px] tabular-nums transition-colors duration-500 ${
                          isActive ? "text-[#B8860B]" : "text-[#B8860B]/35"
                        }`}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span
                        // translate, not transform: framer and GSAP both write `transform`
                        // elsewhere on this page, and Tailwind v4 keeps translate on its
                        // own property, so a nudge here can never collide with a tween.
                        className={`text-base font-medium transition-all duration-500 sm:text-lg ${
                          isActive
                            ? "translate-x-1 text-[#0B1F3A]"
                            : "translate-x-0 text-[#57595E]/45"
                        }`}
                      >
                        {purpose.title}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>

          {/* --- Panels ---------------------------------------------------------- */}
          <div className="mt-14 lg:col-span-7 lg:mt-0">
            {PURPOSES.map((purpose, index) => {
              const isActive = active === null || active === index;

              return (
                <article
                  key={purpose.title}
                  ref={(el) => {
                    panelsRef.current[index] = el;
                  }}
                  className="border-t border-[#E5E4DE] py-14 first:border-t-0 first:pt-0 md:py-20 md:first:pt-0 lg:min-h-[60vh] lg:py-24"
                >
                  {/*
                    Opacity alone for the receded state — no blur, no scale. The panels the
                    reader is not on are still readable if they choose to look at them,
                    which is the difference between de-emphasis and hiding.
                  */}
                  <div
                    className={`transition-opacity duration-700 ${
                      isActive ? "opacity-100" : "opacity-40"
                    }`}
                  >
                    <span
                      data-about-reveal
                      className={`font-mono text-[11px] tabular-nums text-[#B8860B] ${HIDDEN_RISE}`}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <h3 className="mt-5 font-serif text-[clamp(1.75rem,3.4vw,2.75rem)] font-normal leading-[1.12] tracking-[-0.018em] text-[#0B1F3A]">
                      <MaskedWords text={purpose.title} />
                    </h3>

                    <p
                      data-about-reveal
                      className={`mt-6 max-w-[46ch] text-lg font-normal leading-relaxed text-[#3A3D42] sm:text-xl ${HIDDEN_RISE}`}
                    >
                      {purpose.description}
                    </p>

                    {purpose.tags.length > 0 && (
                      <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
                        {purpose.tags.map((tag) => (
                          <li
                            key={tag}
                            data-about-reveal
                            className={`flex items-center gap-2.5 text-sm font-medium text-[#57595E] sm:text-base ${HIDDEN_RISE}`}
                          >
                            <span
                              aria-hidden="true"
                              className="h-1 w-1 shrink-0 rounded-full bg-[#B8860B]"
                            />
                            {tag}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutPurpose;
