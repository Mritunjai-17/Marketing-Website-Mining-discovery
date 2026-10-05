"use client";

import React, { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  HIDDEN_RISE,
  HIDDEN_RULE_X,
  MaskedWords,
  revealBlocks,
  useAboutMotion,
} from "./reveal";
import { AboutEyebrow } from "./AboutEyebrow";

/*
 * Section 07 — What Makes Us Unique.
 *
 * Five differentiators on a rail that fills as you read past them, rather than five cards.
 * The rail is the whole argument for the layout: five cards say "here are five things",
 * five marks on a filling line say "here is the fifth of five, and you have read four" —
 * the reader's position in the list becomes part of the list.
 *
 * The fill is scrubbed off scroll position; the marks are toggled by their own triggers.
 * Both are decoration over content that reads correctly with neither.
 *
 * All five are from miningdiscovery.com/about-us.
 */

const DIFFERENTIATORS: Array<{ title: string; description: string }> = [
  {
    title: "Industry-Focused Journalism",
    description: "Mining-focused coverage with depth, context, and consistency.",
  },
  {
    title: "Integrated Approach",
    description: "Reporting, data, and branding connected as part of one story.",
  },
  {
    title: "Dual Perspective",
    description: "Serving both industry professionals and community stakeholders.",
  },
  {
    title: "Media & Digital Strength",
    description: "Editorial work combined with SEO, visual storytelling, and syndication.",
  },
  {
    title: "Founder-Driven Vision",
    description: "A vision guided by the founders' commitment to purpose-driven growth.",
  },
];

export const AboutUnique: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const fillRef = useRef<HTMLSpanElement | null>(null);
  const entriesRef = useRef<Array<HTMLElement | null>>([]);

  /*
   * How many entries the reader has reached. null means nothing is driving it — no JS, or
   * reduced motion — and in that state every mark renders as reached, so the rail reads as
   * a complete list rather than an empty one.
   */
  const [reached, setReached] = useState<number | null>(null);

  useAboutMotion(sectionRef, () => {
    if (headerRef.current) revealBlocks(headerRef.current);

    entriesRef.current.forEach((entry, index) => {
      if (!entry) return;

      revealBlocks(entry, { stagger: 0.05, start: "top 88%" });

      ScrollTrigger.create({
        trigger: entry,
        start: "top 62%",
        onEnter: () => setReached(index + 1),
        onLeaveBack: () => setReached(index),
      });
    });

    /*
     * The fill. start and end are pinned to the same 70% line as each other so the rail is
     * empty exactly when the first entry reaches it and full exactly when the last one
     * leaves, rather than filling against the section's padding.
     */
    if (fillRef.current && listRef.current) {
      gsap.fromTo(
        fillRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: listRef.current,
            start: "top 70%",
            end: "bottom 70%",
            scrub: 0.3,
          },
        }
      );
    }
  });

  return (
    <section ref={sectionRef} className="border-b border-[#E5E4DE]">
      <div className="container-editorial py-20 md:py-28">
        <div ref={headerRef} className="flex flex-col items-center text-center max-w-3xl mx-auto">
          <AboutEyebrow text="What Makes Us Unique" className="justify-center" />
          <h2 className="mt-6 font-space-grotesk text-[clamp(2.25rem,4.5vw,3.5rem)] font-bold uppercase leading-[1.1] tracking-[-0.025em] text-[#0B1F3A]">
            <MaskedWords text="Five things that set us apart." goldWords={["set", "us", "apart"]} />
          </h2>
        </div>

        <div ref={listRef} className="relative mt-14 md:mt-20">
          <ol>
            {DIFFERENTIATORS.map((item, index) => {
              const isReached = reached === null || index < reached;

              return (
                <li
                  key={item.title}
                  ref={(el) => {
                    entriesRef.current[index] = el;
                  }}
                  className="border-t border-[#E5E4DE] py-10 first:border-t-0 first:pt-0 md:py-14 md:first:pt-0"
                >
                  <div className="grid grid-cols-1 gap-x-16 gap-y-6 lg:grid-cols-12">
                    <div className="lg:col-span-5">
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className={`h-[7px] w-[7px] shrink-0 rounded-full border border-[#B8860B] transition-colors duration-500 ${
                            isReached ? "bg-[#B8860B]" : "bg-[#F7F5EF]"
                          }`}
                        />
                        <span
                          data-about-reveal
                          className={`font-mono text-[11px] tabular-nums transition-colors duration-500 ${
                            isReached ? "text-[#B8860B]" : "text-[#B8860B]/40"
                          } ${HIDDEN_RISE}`}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </div>

                      <h3 className="mt-4 font-space-grotesk text-[clamp(1.6rem,3.2vw,2.5rem)] font-bold uppercase leading-[1.12] tracking-[-0.018em] text-[#0B1F3A]">
                        <MaskedWords text={item.title} />
                      </h3>
                    </div>

                    <div className="lg:col-span-7 lg:border-l lg:border-[#E5E4DE] lg:pl-12">
                      <p
                        data-about-reveal
                        className={`max-w-[46ch] text-lg font-normal leading-relaxed text-[#57595E] sm:text-xl ${HIDDEN_RISE}`}
                      >
                        {item.description}
                      </p>
                    </div>
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

export default AboutUnique;
