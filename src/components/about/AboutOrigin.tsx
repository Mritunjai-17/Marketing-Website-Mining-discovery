"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import {
  ABOUT_EASE,
  HIDDEN_RISE,
  HIDDEN_RULE_X,
  HIDDEN_RULE_Y,
  MaskedWords,
  REVEAL_START,
  revealBlocks,
  useAboutMotion,
} from "./reveal";
import { AboutEyebrow } from "./AboutEyebrow";

/*
 * Section 02 — Our Origin.
 *
 * The founding, told as a convergence: two people, two backgrounds, one platform. Every
 * fact in here is from miningdiscovery.com/about-us — the year, the two names, the two
 * backgrounds, the six beats, and the closing conviction. There are deliberately no
 * milestones between 2022 and now, because the source names none.
 */

/** The six beats the source lists, in the source's order. */
const BEATS = [
  "Corporate actions",
  "Sustainability",
  "Exploration",
  "Regulation",
  "Investor relations",
  "Innovation",
];

/** The convergence, row by row. Each row is one beat of the diagram's timeline. */
const CONVERGENCE: Array<{ label: string; nodes: Array<{ title: string; meta?: string }> }> = [
  {
    label: "The founders",
    nodes: [
      { title: "Gaurav Sharma", meta: "Founder" },
      { title: "Sagar Bakshi", meta: "Director & Co-Founder" },
    ],
  },
  {
    label: "What they brought",
    nodes: [{ title: "Mining Markets" }, { title: "Strategic Communication" }],
  },
  {
    label: "What it became",
    nodes: [{ title: "Mining Discovery", meta: "Est. 2022" }],
  },
];

export const AboutOrigin: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const diagramRef = useRef<HTMLDivElement | null>(null);
  const storyRef = useRef<HTMLDivElement | null>(null);

  useAboutMotion(sectionRef, () => {
    if (headerRef.current) revealBlocks(headerRef.current);
    if (storyRef.current) revealBlocks(storyRef.current, { stagger: 0.07 });

    /*
     * The diagram gets a bespoke timeline rather than the shared one, because its whole
     * point is sequence: a row lands, the connector draws down from it, the next row lands.
     * Run through revealBlocks it would have arrived as one block and said nothing.
     */
    const diagram = diagramRef.current;
    if (!diagram) return;

    const rows = diagram.querySelectorAll<HTMLElement>("[data-origin-row]");
    const links = diagram.querySelectorAll<HTMLElement>("[data-origin-link]");

    const tl = gsap.timeline({
      defaults: { ease: ABOUT_EASE },
      scrollTrigger: { trigger: diagram, start: REVEAL_START, once: true },
    });

    rows.forEach((row, index) => {
      const at = index * 0.55;
      tl.fromTo(row, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, at);

      const link = links[index];
      if (link) {
        tl.fromTo(link, { scaleY: 0 }, { scaleY: 1, duration: 0.45, ease: "power2.out" }, at + 0.45);
      }
    });
  });

  return (
    <section ref={sectionRef} className="border-b border-[#E5E4DE] bg-white">
      <div className="container-editorial py-20 md:py-28">
        {/* --- Header: the year, and what it was --------------------------------- */}
        <div ref={headerRef} className="flex flex-col items-center text-center max-w-3xl mx-auto">
          <AboutEyebrow text="Our Origin" className="justify-center" />

          <h2 className="mt-6 font-space-grotesk text-[clamp(2.25rem,4.5vw,3.5rem)] font-bold uppercase leading-[1.1] tracking-[-0.025em] text-[#0B1F3A]">
            <MaskedWords text="A shared vision." goldWords={["vision"]} />
          </h2>

          <p
            data-about-reveal
            className={`mt-6 text-lg font-normal leading-relaxed text-[#3A3D42] sm:text-xl ${HIDDEN_RISE}`}
          >
            Mining Discovery began with a shared vision: to bring clarity and depth to a
            mining sector often clouded by noise and half-truths. We recognised the
            industry lacked a strong, trustworthy voice dedicated to the stories that
            actually matter.
          </p>

          <p
            data-about-reveal
            className={`mt-6 font-geist text-[clamp(3.5rem,8vw,5.5rem)] font-semibold leading-none tracking-[-0.05em] tabular-nums text-[#B8860B] ${HIDDEN_RISE}`}
          >
            2022
          </p>
        </div>

        {/* --- The convergence ---------------------------------------------------- */}
        <div ref={diagramRef} className="mt-16 flex flex-col items-center md:mt-20">
          {CONVERGENCE.map((row, rowIndex) => (
            <React.Fragment key={row.label}>
              <div
                data-origin-row
                data-about-reveal
                className={`flex w-full max-w-3xl flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center ${HIDDEN_RISE}`}
              >
                {row.nodes.map((node, nodeIndex) => (
                  <React.Fragment key={node.title}>
                    {/* The plus is punctuation between the two nodes, not content — it
                        carries no meaning a screen reader needs to hear. */}
                    {nodeIndex > 0 && (
                      <span
                        aria-hidden="true"
                        className="shrink-0 self-center font-mono text-xl font-bold leading-none text-[#B8860B] sm:text-2xl"
                      >
                        +
                      </span>
                    )}

                    <div
                      className={`flex-1 rounded-xl border px-6 py-5 text-center transition-colors duration-300 sm:px-8 sm:py-6 ${
                        // The last row is the outcome, so it carries the gold ground the
                        // rest of the page reserves for accents rather than another
                        // neutral card — the diagram has to resolve somewhere.
                        rowIndex === CONVERGENCE.length - 1
                          ? "border-[#B8860B]/35 bg-[#FAF5E8]"
                          : "border-[#E5E4DE] bg-[#FBFBFA]"
                      }`}
                    >
                      <p className="font-space-grotesk text-xl font-bold tracking-[-0.01em] text-[#0B1F3A] sm:text-2xl">
                        {node.title}
                      </p>
                      {node.meta && (
                        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[#B8860B]">
                          {node.meta}
                        </p>
                      )}
                    </div>
                  </React.Fragment>
                ))}
              </div>

              {/* Connector down to the next row. Decorative: the reading order already
                  carries the sequence. */}
              {rowIndex < CONVERGENCE.length - 1 && (
                <span
                  aria-hidden="true"
                  data-origin-link
                  data-about-rule-y
                  className={`my-5 block h-12 w-px bg-gradient-to-b from-[#B8860B]/70 to-[#B8860B]/25 md:h-14 ${HIDDEN_RULE_Y}`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* --- What that platform covers ------------------------------------------ */}
        <div ref={storyRef} className="mt-20 grid grid-cols-1 gap-x-16 gap-y-10 md:mt-24 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <span
              data-about-reveal
              className={`block text-xs font-semibold uppercase tracking-[0.15em] text-[#B8860B] ${HIDDEN_RISE}`}
            >
              What We Cover
            </span>

            <p
              data-about-reveal
              className={`mt-6 text-lg font-normal leading-relaxed text-[#57595E] sm:text-xl ${HIDDEN_RISE}`}
            >
              Mining isn&apos;t just rocks and machines. It is people, communities,
              economies, and a meaningful share of the planet&apos;s future — and we set out
              to build a platform that honours all of that.
            </p>
          </div>

          <div className="lg:col-span-8 lg:border-l lg:border-[#E5E4DE] lg:pl-12">
            {/*
              The six beats as a list rather than a comma run — they are the spine of what
              we cover, and a reader scanning the page should be able to find them without
              parsing a sentence.
            */}
            <ul className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
              {BEATS.map((beat, index) => (
                <li
                  key={beat}
                  data-about-reveal
                  className={`flex items-baseline gap-4 border-b border-[#E5E4DE] py-3.5 ${HIDDEN_RISE}`}
                >
                  <span className="font-mono text-[11px] tabular-nums text-[#B8860B]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-base font-medium text-[#1A1D21] sm:text-lg">
                    {beat}
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

export default AboutOrigin;
