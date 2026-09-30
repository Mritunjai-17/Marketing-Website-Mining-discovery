"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import {
  ABOUT_EASE,
  HIDDEN_RISE,
  HIDDEN_RULE_X,
  MaskedWords,
  maskedFrom,
  maskedTo,
  useAboutMotion,
  WORD_SELECTOR,
} from "@/components/about/reveal";

/*
 * BUILD STEP 6 — FINAL CTA / CLOSING SECTION for /services.
 *
 * The visual and emotional conclusion of the dedicated /services page experience.
 * Communicates:
 *   "Mining companies have stories worth telling.
 *    Mining Discovery helps those stories get seen."
 *
 * Layout & Motion Specs:
 * - Headline:
 *     YOUR NEXT
 *     DISCOVERY
 *
 *     DESERVES
 *     TO BE SEEN.
 * - Supporting text:
 *     "Turn your mining story into meaningful visibility with strategic marketing,
 *      media and digital solutions built for the industry."
 * - Primary CTA:
 *     START A CONVERSATION → (linking to /#contact)
 * - Visual style:
 *     Dark navy (#0B1F3A) with subtle topographic/geological contour SVG background,
 *     staggered masked-text reveal timeline, and gentle mouse parallax when enabled.
 */

export const ServicesFinalCTA: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const bgRef = useRef<HTMLDivElement | null>(null);

  // Stage 1–5 GSAP Timeline Reveal
  useAboutMotion(sectionRef, (scope) => {
    const bg = bgRef.current;
    const rule = scope.querySelector<HTMLElement>("[data-about-rule-x]");
    const words = scope.querySelectorAll<HTMLElement>(WORD_SELECTOR);
    const blocks = scope.querySelectorAll<HTMLElement>("[data-about-reveal]");

    const tl = gsap.timeline({
      defaults: { ease: ABOUT_EASE },
      scrollTrigger: {
        trigger: scope,
        start: "top 75%",
        once: true,
      },
    });

    // Stage 1: Background visual slowly fades in & scales from 1.05 to 1
    if (bg) {
      tl.fromTo(
        bg,
        { opacity: 0, scale: 1.05 },
        { opacity: 1, scale: 1, duration: 1.4, ease: "power2.out" },
        0
      );
    }

    // Stage 2: Small gold accent line reveals (scaleX 0 -> 1)
    if (rule) {
      tl.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.9 }, 0.2);
    }

    // Stage 3: Headline reveals line by line / word by word
    if (words.length) {
      tl.fromTo(words, maskedFrom, { ...maskedTo, stagger: 0.05 }, 0.35);
    }

    // Stage 4 & 5: Supporting text and CTA appear last
    if (blocks.length) {
      tl.fromTo(
        blocks,
        { y: 28, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.15 },
        0.85
      );
    }
  });

  // Optional subtle mouse-parallax effect on background visual (desktop non-touch only)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if ("ontouchstart" in window || navigator.maxTouchPoints > 0) return;

    const bg = bgRef.current;
    const section = sectionRef.current;
    if (!bg || !section) return;

    const setX = gsap.quickSetter(bg, "x", "px");
    const setY = gsap.quickSetter(bg, "y", "px");

    const handleMouseMove = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect();
      if (e.clientY < rect.top || e.clientY > rect.bottom) return;

      const relX = e.clientX - rect.left - rect.width / 2;
      const relY = e.clientY - rect.top - rect.height / 2;

      // Max 8px subtle drift
      const moveX = (relX / rect.width) * 16;
      const moveY = (relY / rect.height) * 16;

      setX(moveX);
      setY(moveY);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="Final Call to Action"
      className="relative w-full overflow-hidden bg-[#0B1F3A] py-28 text-white md:py-40 lg:py-48"
    >
      {/* --- GEOLOGICAL / TOPOGRAPHIC BACKGROUND VISUAL --- */}
      <div
        ref={bgRef}
        aria-hidden="true"
        className="cta-bg-visual pointer-events-none absolute inset-0 transition-transform duration-75 ease-out opacity-0 [transform:scale(1.05)] motion-reduce:opacity-100 motion-reduce:[transform:none]"
      >
        {/* Radial vignette overlay to maintain center contrast */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(11,31,58,0.3)_0%,rgba(11,31,58,0.85)_70%,rgba(11,31,58,1)_100%)] z-10" />

        {/* Ambient golden depth glow */}
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#B8860B]/10 blur-[120px] pointer-events-none" />

        {/* SVG Geological Contour Map */}
        <svg
          className="h-full w-full text-[#B8860B]/15"
          viewBox="0 0 1440 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Elevation contour curves */}
          <path
            d="M-100 450 C 200 300, 400 600, 720 400 C 1040 200, 1240 500, 1540 350"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.6"
          />
          <path
            d="M-100 520 C 180 380, 440 680, 720 480 C 1000 280, 1280 580, 1540 420"
            stroke="currentColor"
            strokeWidth="1.2"
            opacity="0.8"
          />
          <path
            d="M-100 600 C 150 450, 480 750, 720 560 C 960 370, 1320 650, 1540 500"
            stroke="currentColor"
            strokeWidth="1.5"
            opacity="0.9"
          />
          <path
            d="M-100 680 C 120 520, 520 820, 720 640 C 920 460, 1360 720, 1540 580"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="8 6"
            opacity="0.5"
          />
          <path
            d="M-100 250 C 250 150, 380 400, 720 220 C 1060 40, 1200 350, 1540 200"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.7"
          />
          <path
            d="M-100 180 C 280 80, 350 320, 720 140 C 1090 -40, 1180 280, 1540 120"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            opacity="0.4"
          />

          {/* Geological survey grid & coordinate marks */}
          <circle
            cx="720"
            cy="450"
            r="320"
            stroke="currentColor"
            strokeWidth="0.75"
            strokeDasharray="2 6"
            opacity="0.35"
          />
          <circle
            cx="720"
            cy="450"
            r="540"
            stroke="currentColor"
            strokeWidth="0.75"
            strokeDasharray="2 8"
            opacity="0.2"
          />
          <line
            x1="720"
            y1="50"
            x2="720"
            y2="850"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeDasharray="4 8"
            opacity="0.25"
          />
          <line
            x1="100"
            y1="450"
            x2="1340"
            y2="450"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeDasharray="4 8"
            opacity="0.25"
          />
        </svg>
      </div>

      {/* --- CONTENT CONTAINER --- */}
      <div className="container-editorial relative z-20 mx-auto flex max-w-5xl flex-col items-center px-6 text-center sm:px-8">
        {/* Stage 2: Small Gold Accent Line */}
        <div
          data-about-rule-x
          className={`h-[2px] w-12 bg-[#B8860B] ${HIDDEN_RULE_X}`}
        />

        {/* Stage 3: Editorial Headline */}
        <h2 className="mt-8 font-serif font-normal text-4xl leading-[1.08] tracking-[-0.025em] text-[#F7F5EF] sm:text-6xl md:text-7xl lg:text-[84px] xl:text-[92px]">
          <span className="block">
            <MaskedWords text="YOUR NEXT" />
          </span>
          <span className="block text-white/90">
            <MaskedWords text="DISCOVERY" />
          </span>
          <span className="mt-4 block text-[#B8860B] sm:mt-6">
            <MaskedWords text="DESERVES" />
          </span>
          <span className="block text-[#B8860B]">
            <MaskedWords text="TO BE SEEN." />
          </span>
        </h2>

        {/* Stage 4: Supporting Text */}
        <p
          data-about-reveal
          className={`mt-8 max-w-2xl font-sans text-base font-normal leading-relaxed text-[#D1D5DB] sm:text-lg md:mt-12 md:text-xl ${HIDDEN_RISE}`}
        >
          Turn your mining story into meaningful visibility with strategic
          marketing, media and digital solutions built for the industry.
        </p>

        {/* Stage 5: Primary Call to Action */}
        <div data-about-reveal className={`mt-10 md:mt-14 ${HIDDEN_RISE}`}>
          <Link
            href="/#contact"
            className="group relative inline-flex items-center gap-3 font-sans text-sm font-semibold tracking-[0.18em] uppercase text-[#F7F5EF] transition-colors duration-300 hover:text-[#D4AF37] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8860B] focus-visible:ring-offset-4 focus-visible:ring-offset-[#0B1F3A] sm:text-base"
          >
            <span>START A CONVERSATION</span>
            <ArrowRight className="h-5 w-5 text-[#B8860B] transition-transform duration-300 group-hover:translate-x-1.5 group-hover:text-[#D4AF37]" />

            {/* Expanding Gold Underline on Hover */}
            <span
              aria-hidden="true"
              className="absolute -bottom-1 left-0 h-[2px] w-full origin-left scale-x-0 bg-[#B8860B] transition-transform duration-300 group-hover:scale-x-100 group-hover:bg-[#D4AF37]"
            />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ServicesFinalCTA;
