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
 * Section 03 — Management.
 *
 * Two people, two full-width editorial rows, no cards. A card grid would give Gaurav and
 * Sagar a hundred-odd words each in a box the width of a phone; the whole reason to run
 * them full width is that the bios are the content here, not decoration around a headshot
 * we do not have.
 *
 * Every claim below is from miningdiscovery.com/about-us. Nothing has been rounded up,
 * and no qualification, employer, or achievement has been added.
 */

interface Person {
  name: string;
  initials: string;
  role: string;
  bio: string;
  /** The remit as the source lists it — used as scannable tags beside the prose. */
  focus: string[];
}

const MANAGEMENT: Person[] = [
  {
    name: "Gaurav Sharma",
    initials: "GS",
    role: "Founder, Mining Discovery",
    bio: "Gaurav Sharma established Mining Discovery to change how the global mining industry communicates. Focusing on the U.S. and Canadian mining markets, he directs content strategy, digital marketing, and platform outreach. His expertise spans advertising, PR, eCommerce, and web development — the range behind Mining Discovery's development as a media and marketing platform connecting mining companies, investors, and professionals.",
    focus: [
      "Content Strategy",
      "Digital Marketing",
      "Platform Outreach",
      "Advertising",
      "PR",
      "eCommerce",
      "Web Development",
    ],
  },
  {
    name: "Sagar Bakshi",
    initials: "SB",
    role: "Director & Co-Founder, Mining Discovery",
    bio: "Sagar Bakshi helps build and develop the Mining Discovery platform, connecting the global mining community with a focus on U.S. and Canadian mining activities. He manages company messaging across industry news, corporate updates, and event promotions, working through advertising, public relations, brand marketing, and web development. His earlier work supported eCommerce startups through Shopify, Amazon, dropshipping, and digital marketing.",
    focus: [
      "Industry News",
      "Corporate Updates",
      "Event Promotions",
      "Advertising",
      "Public Relations",
      "Brand Marketing",
      "Web Development",
    ],
  },
];

export const AboutManagement: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const rowsRef = useRef<Array<HTMLElement | null>>([]);

  useAboutMotion(sectionRef, () => {
    if (headerRef.current) revealBlocks(headerRef.current);

    // One trigger per row rather than one for the section: the second bio sits a full
    // viewport below the first, and revealing both off the first row's arrival would play
    // Sagar's entrance to an empty screen.
    rowsRef.current.forEach((row) => {
      if (row) revealBlocks(row, { stagger: 0.05 });
    });
  });

  return (
    <section ref={sectionRef} className="border-b border-[#E5E4DE]">
      <div className="container-editorial py-20 md:py-28">
        <div ref={headerRef}>
          <div data-about-rule-x className={`h-0.5 w-12 bg-[#B8860B] ${HIDDEN_RULE_X}`} />
          <span
            data-about-reveal
            className={`mt-6 block text-xs font-semibold uppercase tracking-[0.15em] text-[#B8860B] ${HIDDEN_RISE}`}
          >
            Management
          </span>
          <h2 className="mt-6 max-w-[22ch] font-serif text-[clamp(2rem,4.2vw,3.25rem)] font-normal leading-[1.1] tracking-[-0.02em] text-[#0B1F3A]">
            <MaskedWords text="The people behind the platform." />
          </h2>
        </div>

        <div className="mt-16 md:mt-20">
          {MANAGEMENT.map((person, index) => (
            <article
              key={person.name}
              ref={(el) => {
                rowsRef.current[index] = el;
              }}
              /*
               * group/person rather than a bare group: the focus tags below run their own
               * hover state, and an unnamed group would have the row and the tag competing
               * for the same modifier.
               */
              className="group/person border-t border-[#E5E4DE] py-12 first:border-t-0 first:pt-0 md:py-16 md:first:pt-0"
            >
              <div className="grid grid-cols-1 gap-x-16 gap-y-8 lg:grid-cols-12">
                {/* --- Identity ------------------------------------------------- */}
                <div className="lg:col-span-5">
                  <div className="flex items-center gap-5">
                    {/* Monogram stands in for a headshot: gold ring, navy initials — the
                        same treatment the leadership cards used before real names existed. */}
                    <div
                      aria-hidden="true"
                      data-about-reveal
                      className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[#B8860B]/35 bg-[#FAF5E8] font-serif text-xl font-normal tracking-[0.02em] text-[#0B1F3A] transition-colors duration-300 group-hover/person:border-[#B8860B]/70 ${HIDDEN_RISE}`}
                    >
                      {person.initials}
                    </div>

                    <span
                      data-about-reveal
                      className={`font-mono text-[11px] tabular-nums text-[#B8860B] ${HIDDEN_RISE}`}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <h3 className="mt-7 font-serif text-[clamp(2rem,4vw,3rem)] font-normal leading-[1.08] tracking-[-0.02em] text-[#0B1F3A] transition-colors duration-300 group-hover/person:text-[#B8860B]">
                    <MaskedWords text={person.name} />
                  </h3>

                  <p
                    data-about-reveal
                    className={`mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-[#57595E] ${HIDDEN_RISE}`}
                  >
                    {person.role}
                  </p>
                </div>

                {/* --- Remit ---------------------------------------------------- */}
                <div className="lg:col-span-7 lg:border-l lg:border-[#E5E4DE] lg:pl-12">
                  <p
                    data-about-reveal
                    className={`text-lg font-normal leading-relaxed text-[#3A3D42] sm:text-xl ${HIDDEN_RISE}`}
                  >
                    {person.bio}
                  </p>

                  <ul className="mt-8 flex flex-wrap gap-2">
                    {person.focus.map((item) => (
                      <li
                        key={item}
                        data-about-reveal
                        className={`rounded-full border border-[#E5E4DE] bg-white px-4 py-1.5 text-xs font-medium tracking-wide text-[#57595E] transition-colors duration-300 hover:border-[#B8860B]/40 hover:text-[#0B1F3A] ${HIDDEN_RISE}`}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutManagement;
