"use client";

import React, { useState } from "react";
import { SectionReveal, RevealItem } from "@/components/ui/SectionReveal";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./FaqSection.module.css";

/*
 * FAQ Section — Mining Discovery Marketing Site
 *
 * Six questions drawn from miningdiscovery.com's actual content and the
 * marketing site's service offering. Accordion: one panel open at a time,
 * gold hairline indicator on the active row, smooth height transition via
 * framer-motion AnimatePresence.
 *
 * Typography tokens match every other section on this page:
 *  - Eyebrow  → IBM Plex Mono, gold #B8860B
 *  - Heading  → Space Grotesk (font-geist), navy #0B1F3A
 *  - Body     → Inter (font-sans), muted #57595E
 */

interface FAQ {
  q: string;
  a: string;
}

const FAQS: FAQ[] = [
  {
    q: "What is Mining Discovery?",
    a: "Mining Discovery is a global mining media and marketing platform — the first choice for mining news, insights, and analysis. It covers exploration, production, regulation, investment, precious metals, and ESG across worldwide mining markets, publishing breaking news, research reports, digital editions, and CEO profiles every day.",
  },
  {
    q: "What types of news and content does Mining Discovery publish?",
    a: "The platform publishes across categories including Gold News, Silver News, Copper News, Corporate News, Announcements, Research Reports, Leadership Thoughts, Sponsored Posts, Projects, and World News — alongside a Daily Newsletter, Digital Magazine, and detailed Company and CEO Profiles.",
  },
  {
    q: "Does Mining Discovery track live metal prices?",
    a: "Yes. The site features a live metals price ticker tracking Gold, Silver, Platinum, and Palladium spot prices in real time — giving investors and professionals immediate market context alongside editorial coverage.",
  },
  {
    q: "How can a mining company get featured or submit a press release?",
    a: "Mining companies can submit news, corporate announcements, and project updates directly via the Submit News page. Mining Discovery also offers paid Sponsored Posts and Company Profiles for brands seeking broader visibility across its industry audience.",
  },
  {
    q: "How can I stay updated with Mining Discovery?",
    a: "Subscribe to the Daily Newsletter at miningdiscovery.com/daily-newsletter, read the monthly Digital Magazine, and follow Mining Discovery on Facebook, X (Twitter), Instagram, LinkedIn, YouTube, and Substack for real-time updates.",
  },
  {
    q: "Who is Mining Discovery's audience?",
    a: "Mining Discovery serves mining executives, investors, geologists, project developers, and industry professionals globally — with a strong focus on U.S. and Canadian mining markets while also covering major regions including Africa, Latin America, and Asia.",
  },
];

const EASE = [0.25, 0.1, 0.25, 1] as const;

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className="w-full border-t border-[#E5E3DC] bg-[#FAF7F2]">
      <SectionReveal className="container-editorial py-14 sm:py-20 md:py-28">

        {/* ── Header (Luxury Editorial Style Matching Publications) ── */}
        <RevealItem className="mb-10 sm:mb-14">
          <header className={styles.header}>
            {/* Editorial Eyebrow with gold gradient rules */}
            <div className={styles.eyebrowRow}>
              <div className={styles.eyebrowRule} aria-hidden="true" />
              <span className={styles.eyebrowPip}>✦</span>
              <span className={styles.eyebrowText}>
                FREQUENTLY ASKED QUESTIONS // DIRECT ANSWERS &amp; GUIDANCE
              </span>
              <span className={styles.eyebrowPip}>✦</span>
              <div className={styles.eyebrowRuleRight} aria-hidden="true" />
            </div>

            {/* Section Headline */}
            <h2 className={styles.mainTitle}>
              <span className={styles.wordSpan}>FREQUENTLY ASKED</span>
              <span className={styles.goldWordSpan}>QUESTIONS</span>
            </h2>

            <p className={styles.description}>
              Everything you need to know about Mining Discovery. Can&apos;t find what you&apos;re looking for?{" "}
              <a
                href="/contact"
                className={styles.contactLink}
              >
                Contact us directly.
              </a>
            </p>
          </header>
        </RevealItem>

        {/* ── Accordion ──────────────────────────────────────────────── */}
        <RevealItem>
          <div className="divide-y divide-[#E5E3DC] border-t border-[#E5E3DC]">
            {FAQS.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div key={index} className="group">
                  <button
                    onClick={() => toggle(index)}
                    aria-expanded={isOpen}
                    className="flex w-full items-start justify-between gap-4 py-5 sm:gap-6 sm:py-6 md:py-7 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8860B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF7F2]"
                  >
                    <div className="flex items-start gap-5">
                      <span
                        className={`mt-1 hidden shrink-0 font-mono text-[0.68rem] tabular-nums transition-colors duration-300 sm:block ${isOpen ? "text-[#B8860B]" : "text-[#B8860B]/35"
                          }`}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={`font-geist text-base font-semibold leading-snug tracking-[-0.01em] transition-colors duration-300 sm:text-lg md:text-xl ${isOpen ? "text-[#0B1F3A]" : "text-[#0B1F3A]/75 group-hover:text-[#0B1F3A]"
                          }`}
                      >
                        {faq.q}
                      </span>
                    </div>

                    {/* Plus / Minus icon */}
                    <span
                      aria-hidden="true"
                      className={`relative mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${isOpen
                        ? "border-[#B8860B] bg-[#B8860B] text-white"
                        : "border-[#D5D2CB] bg-transparent text-[#57595E] group-hover:border-[#B8860B]/50 group-hover:text-[#B8860B]"
                        }`}
                    >
                      <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        className="h-3 w-3"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                      >
                        <line x1="3" y1="8" x2="13" y2="8" />
                        <motion.line
                          x1="8"
                          y1="3"
                          x2="8"
                          y2="13"
                          animate={{ scaleY: isOpen ? 0 : 1, opacity: isOpen ? 0 : 1 }}
                          transition={{ duration: 0.22, ease: EASE as never }}
                          style={{ originY: "50%" }}
                        />
                      </svg>
                    </span>
                  </button>

                  {/* Answer panel */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="answer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.32, ease: EASE as never }}
                        style={{ overflow: "hidden" }}
                      >
                        <div className="pb-8 sm:pl-9">
                          <div className="flex gap-5">
                            <span
                              aria-hidden="true"
                              className="hidden w-px shrink-0 self-stretch rounded-full bg-gradient-to-b from-[#B8860B]/50 to-[#B8860B]/05 sm:block"
                            />
                            <p className="text-base font-normal leading-relaxed text-[#57595E] sm:text-lg">
                              {faq.a}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </RevealItem>

        {/* ── Bottom CTA strip ───────────────────────────────────────── */}
        <RevealItem>
          <div className="mt-14 flex flex-col items-start gap-5 border-t border-[#E5E3DC] pt-10 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-geist text-base font-semibold text-[#0B1F3A] sm:text-lg">
              Ready to get your mining story in front of the right audience?
            </p>
            <a
              href="/contact"
              className="group inline-flex shrink-0 items-center gap-2 rounded-md bg-[#B8860B] px-5 py-2.5 font-sans text-sm font-semibold tracking-wide text-white shadow-[0_0_18px_rgba(184,134,11,0.28)] transition-all duration-300 hover:bg-[#D4AF37] hover:shadow-[0_0_26px_rgba(212,175,55,0.45)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8860B] focus-visible:ring-offset-2"
            >
              Get In Touch
              <svg
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </RevealItem>

      </SectionReveal>
    </section>
  );
};

export default FaqSection;
