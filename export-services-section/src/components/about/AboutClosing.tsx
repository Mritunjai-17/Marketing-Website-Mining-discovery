"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  HIDDEN_RISE,
  HIDDEN_RULE_X,
  MaskedWords,
  revealBlocks,
  useAboutMotion,
} from "./reveal";

/*
 * The closer — the page's positioning statement and its only call to action.
 *
 * Not one of the nine numbered sections, and kept deliberately: it is the existing About
 * page's ending, the statement is the source's own positioning line, and dropping it would
 * leave a nine-section page with nowhere to go at the bottom of it.
 */

export const AboutClosing: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);

  useAboutMotion(sectionRef, (scope) => {
    revealBlocks(scope, { start: "top 85%" });
  });

  return (
    <section ref={sectionRef}>
      <div className="container-editorial py-24 text-center md:py-32">
        <div
          data-about-rule-x
          className={`mx-auto h-0.5 w-12 bg-[#B8860B] ${HIDDEN_RULE_X}`}
        />

        <p className="mx-auto mt-10 max-w-4xl font-serif text-[clamp(1.75rem,3.6vw,3rem)] font-normal leading-[1.18] tracking-[-0.02em] text-[#0B1F3A]">
          <MaskedWords text="Mining Discovery is the first choice for mining news and insights — covering exploration, production, regulation, investment, and ESG across global mining markets." />
        </p>

        <div data-about-reveal className={`mt-12 ${HIDDEN_RISE}`}>
          <Link
            href="/#submit-news"
            className="group inline-flex items-center gap-2 rounded-md bg-[#B8860B] px-6 py-3 font-sans text-sm font-semibold tracking-wide text-[#0B1F3A] shadow-[0_0_20px_rgba(184,134,11,0.35)] transition-all duration-300 hover:bg-[#D4AF37] hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8860B] focus-visible:ring-offset-2"
          >
            Get Featured
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AboutClosing;
