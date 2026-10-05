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
import { AboutEyebrow } from "./AboutEyebrow";

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
      <div className="container-editorial py-20 text-center md:py-28">
        <AboutEyebrow text="Mining Discovery" className="justify-center" />

        <p className="mx-auto mt-10 max-w-4xl font-space-grotesk text-[clamp(1.75rem,3.6vw,3rem)] font-bold leading-[1.18] tracking-[-0.02em] text-[#0B1F3A]">
          <MaskedWords
            text="Mining Discovery is the first choice for mining news and insights — covering exploration, production, regulation, investment, and ESG across global mining markets."
            goldWords={["first", "choice"]}
          />
        </p>

        <div data-about-reveal className={`mt-12 ${HIDDEN_RISE}`}>
          <Link
            href="/contact"
            className="group inline-flex items-center justify-center gap-2.5 rounded-full border-[1.5px] border-[#C89A32]/70 bg-[#C89A32]/[0.06] px-7 py-3 font-sans text-[13.5px] sm:text-[14px] font-bold uppercase tracking-[0.16em] text-[#0B1F3A] backdrop-blur-sm shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-300 hover:border-[#D6A84F] hover:bg-gradient-to-r hover:from-[#D6A84F] hover:via-[#F3DC96] hover:to-[#C89A32] hover:text-[#0C141E] hover:shadow-[0_0_24px_rgba(214,168,79,0.45)] hover:scale-[1.03] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C89A32] focus-visible:ring-offset-2"
          >
            <span>GET FEATURED</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AboutClosing;
