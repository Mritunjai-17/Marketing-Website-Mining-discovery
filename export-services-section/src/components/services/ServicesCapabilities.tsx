"use client";

import React, { useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  HIDDEN_RISE,
  HIDDEN_RULE_X,
  MaskedWords,
  revealBlocks,
  useAboutMotion,
} from "@/components/about/reveal";

/*
 * Step 2 — OUR CAPABILITIES, the main interactive section of /services.
 *
 * Nine services grouped into three, because nine cards is a price list and three
 * capabilities is an argument: build the brand, amplify it, then engage the people it
 * reached. The grouping is the content here — the individual services are evidence
 * underneath each claim, not the top-level structure.
 *
 * Mechanically: a sticky index of numbers beside three scrolling panels, with ScrollTrigger
 * asked only which panel is currently under the reader's eye. Deliberately NOT a GSAP pin —
 * a pin injects a spacer and rewrites the section height, which fights Lenis and breaks on
 * resize. `position: sticky` costs no DOM and no measurement.
 *
 * It shares nothing with the homepage's ServicesScrollStory but the subject. That section is
 * a 500vh four-stage pinned story on navy; this is a standalone route section on white.
 * Neither imports the other.
 *
 * CONTENT RULE: the nine services below are the nine from the official Services page, and
 * nothing else. No counts, no clients, no claims that were not given.
 */

interface Capability {
  id: string;
  name: string;
  /** The claim the capability makes, set in the editorial serif. */
  statement: string;
  services: string[];
}

const CAPABILITIES: Capability[] = [
  {
    id: "build",
    name: "Build",
    statement: "Build a mining brand people recognize.",
    services: [
      "Digital Branding",
      "Logo & Visual Design",
      "Website Development",
      "App Development",
    ],
  },
  {
    id: "amplify",
    name: "Amplify",
    statement: "Put your story in front of the right audience.",
    services: [
      "Social Media Marketing",
      "Google Ads",
      "LinkedIn & Meta Ads",
      "Public Relations",
    ],
  },
  {
    id: "engage",
    name: "Engage",
    statement: "Turn attention into meaningful relationships.",
    services: ["Webinars & Events"],
  },
];

const HEADING_LINES = ["Marketing that moves", "the mining industry", "forward."];

export const ServicesCapabilities: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);
  const panelsRef = useRef<Array<HTMLElement | null>>([]);

  /*
   * Which capability the reader is on. null means nothing is driving it — no JS yet, or a
   * reader who asked for reduced motion — and in that state every panel renders at full
   * strength. The de-emphasis is something the scroll interaction ADDS; it is never what
   * the content depends on to be readable.
   */
  const [active, setActive] = useState<number | null>(null);

  useAboutMotion(sectionRef, () => {
    if (headerRef.current) revealBlocks(headerRef.current);
    if (railRef.current) {
      revealBlocks(railRef.current, { trigger: railRef.current, stagger: 0.1 });
    }

    panelsRef.current.forEach((panel, index) => {
      if (!panel) return;

      /*
       * One reveal per panel, on its own arrival. The order inside is DOM order, which is
       * exactly the order the brief asks for: the statement lands, then the services come in
       * one after another on the stagger. once:true — a list that replays its entrance every
       * time you scroll back past it is what makes a long page feel restless.
       */
      revealBlocks(panel, { stagger: 0.08, start: "top 78%" });

      /*
       * A band across the middle of the viewport: whichever panel is crossing it owns the
       * index. start and end share the same 55% line, so the handover between two panels is
       * a single moment rather than an overlap where both — or neither — are active.
       */
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
    <section
      id="capabilities"
      ref={sectionRef}
      className="scroll-mt-24 border-b border-[#E5E4DE] bg-white"
    >
      <div className="container-editorial py-20 md:py-28">
        {/* --- Section intro -------------------------------------------------- */}
        <div ref={headerRef}>
          <div data-about-rule-x className={`h-0.5 w-12 bg-[#B8860B] ${HIDDEN_RULE_X}`} />

          <span
            data-about-reveal
            className={`mt-6 block text-xs font-semibold uppercase tracking-[0.15em] text-[#B8860B] ${HIDDEN_RISE}`}
          >
            Our Capabilities
          </span>

          {/*
            Bold, not Black. The hero owns this page's heaviest weight and its largest size;
            a section heading that matched it would leave the page with two openings and no
            hierarchy between them.
          */}
          <h2 className="mt-8 text-balance font-geist text-[clamp(1.875rem,4.2vw,3.5rem)] font-bold uppercase leading-[1.02] tracking-[-0.03em] text-[#0B1F3A]">
            {HEADING_LINES.map((line) => (
              <span key={line} className="block">
                <MaskedWords text={line} />
              </span>
            ))}
          </h2>

          <p
            data-about-reveal
            className={`mt-8 max-w-[58ch] text-lg font-normal leading-relaxed text-[#3A3D42] sm:text-xl ${HIDDEN_RISE}`}
          >
            From brand strategy and digital experiences to media, advertising and industry
            engagement, we help mining companies communicate with the audiences that matter.
          </p>
        </div>

        {/* --- The three capabilities ----------------------------------------- */}
        <div className="mt-16 grid grid-cols-1 gap-x-16 md:mt-24 lg:grid-cols-12">
          {/*
            Sticky index. No data-about-reveal on this column or any ancestor of it: an
            animated `y` leaves a transform behind, and a transformed ancestor becomes the
            containing block for a sticky descendant, which silently kills the pinning. The
            rows inside animate instead.

            aria-hidden, and hidden outright below lg — it is a position indicator, not
            navigation. There is nothing to activate, and the panels beside it already carry
            every capability as a real heading in a real ordered list.
          */}
          <div className="hidden lg:col-span-4 lg:block">
            <div className="lg:sticky lg:top-32" ref={railRef}>
              <ol aria-hidden="true">
                {CAPABILITIES.map((capability, index) => {
                  const isActive = active === null || active === index;

                  return (
                    <li
                      key={capability.id}
                      data-about-reveal
                      className={`flex items-center gap-6 py-5 ${HIDDEN_RISE}`}
                    >
                      {/*
                        Colour, not opacity, for the emphasis — GSAP writes an inline opacity
                        on this row when it reveals, and a Tailwind opacity class on the same
                        element would be overridden by it from then on.
                      */}
                      <span
                        className={`font-geist text-[clamp(2.5rem,3.6vw,3.5rem)] font-black leading-none tabular-nums transition-colors duration-500 ${
                          isActive ? "text-[#0B1F3A]" : "text-[#0B1F3A]/20"
                        }`}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      {/*
                        Gold rule that opens as its capability takes over. `scale` is its own
                        property in Tailwind v4, separate from `transform`, so this can never
                        collide with the tween GSAP runs on the row.
                      */}
                      <span
                        className={`h-px flex-1 origin-left bg-[#B8860B] transition-transform duration-700 ease-out ${
                          isActive ? "scale-x-100" : "scale-x-0"
                        }`}
                      />
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>

          {/* --- Panels -------------------------------------------------------- */}
          <ol className="lg:col-span-8">
            {CAPABILITIES.map((capability, index) => {
              const isActive = active === null || active === index;

              return (
                <li
                  key={capability.id}
                  ref={(el) => {
                    panelsRef.current[index] = el;
                  }}
                  className="border-t border-[#E5E4DE] py-14 first:border-t-0 first:pt-0 md:py-20 md:first:pt-0 lg:min-h-[72vh] lg:py-24"
                >
                  {/*
                    Opacity alone for the receded state, and only from lg up — no blur, no
                    scale. Below lg there is no sticky index to be out of step with and only
                    one panel is on screen at a time, so dimming there would just make the
                    page harder to read for no gain.
                  */}
                  <div
                    className={`transition-opacity duration-700 ${
                      isActive ? "lg:opacity-100" : "lg:opacity-40"
                    }`}
                  >
                    {/* The number belongs to the panel on mobile, where the rail is gone.
                        display:none at lg, so it is never announced twice. */}
                    <span
                      data-about-reveal
                      className={`block font-geist text-3xl font-black leading-none tabular-nums text-[#B8860B] lg:hidden ${HIDDEN_RISE}`}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <h3 className="mt-5 font-geist text-[clamp(2.5rem,5.5vw,4.5rem)] font-black uppercase leading-[0.95] tracking-[-0.035em] text-[#0B1F3A] lg:mt-0">
                      <MaskedWords text={capability.name} />
                    </h3>

                    <p
                      data-about-reveal
                      className={`mt-6 max-w-[22ch] text-balance font-serif text-[clamp(1.5rem,2.6vw,2.125rem)] font-normal leading-[1.15] tracking-[-0.015em] text-[#0B1F3A] ${HIDDEN_RISE}`}
                    >
                      {capability.statement}
                    </p>

                    <ul className="mt-10 max-w-2xl">
                      {capability.services.map((service) => (
                        <li
                          key={service}
                          data-about-reveal
                          /*
                           * group/service, not a bare group: the panel above already owns a
                           * hover-free state of its own and an unnamed group would let these
                           * rows and their container compete for the same modifier.
                           *
                           * No cursor-pointer and no link semantics — there is no destination
                           * to send anyone to, and a pointer cursor would promise one.
                           */
                          className={`group/service flex items-center justify-between gap-6 border-b border-[#E5E4DE] px-2 py-4 transition-colors duration-300 hover:bg-[#F7F5EF] ${HIDDEN_RISE}`}
                        >
                          <span className="text-sm font-semibold uppercase tracking-[0.08em] text-[#0B1F3A] transition-transform duration-300 group-hover/service:translate-x-1 sm:text-base">
                            {service}
                          </span>

                          {/*
                            Always rendered, never only-on-hover: the brief's mobile reading
                            shows the arrow beside every service, and hover does not exist on
                            a phone. Desktop hover only sharpens what is already there.
                          */}
                          <ArrowRight
                            aria-hidden="true"
                            className="h-4 w-4 shrink-0 text-[#B8860B] opacity-40 transition-all duration-300 group-hover/service:translate-x-1 group-hover/service:opacity-100"
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
};

export default ServicesCapabilities;
