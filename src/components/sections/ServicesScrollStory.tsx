"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Compass,
  Palette,
  Share2,
  Target,
  Building2,
  Megaphone,
  Video,
  Globe,
  Smartphone,
  ArrowRight,
} from "lucide-react";

export interface ServiceCardData {
  id: string;
  title: string;
  category: string;
  description: string;
  href: string;
  icon: React.ElementType;
}

// 9 Service Cards mapped 1:1 across 4 Stages (2 / 3 / 2 / 2)
export const STAGE_1_CARDS: ServiceCardData[] = [
  {
    id: "digital-branding",
    title: "Digital Branding",
    category: "Exploration & Identity",
    description: "Establish a high-conviction market narrative and corporate identity for junior explorers & mining leaders.",
    href: "/services#branding",
    icon: Compass,
  },
  {
    id: "logo-design",
    title: "Logo & Visual Design",
    category: "Brand Assets",
    description: "Vector geological typography, technical report templates, and institutional pitch decks.",
    href: "/services#logo-design",
    icon: Palette,
  },
];

export const STAGE_2_CARDS: ServiceCardData[] = [
  {
    id: "social-media",
    title: "Social Media Marketing",
    category: "Discovery Campaign",
    description: "Targeted broadcast of drill core discoveries and mineral assay highlights across X, YouTube & Stockhouse.",
    href: "/services#social-media",
    icon: Share2,
  },
  {
    id: "google-ads",
    title: "Google Ads & Paid Campaigns",
    category: "Investor Reach",
    description: "High-intent search campaign targeting institutional mining funds, retail investors, and sector analysts.",
    href: "/services#google-ads",
    icon: Target,
  },
  {
    id: "paid-social",
    title: "LinkedIn & Meta Ads",
    category: "Executive Audience",
    description: "Geotargeted executive placement in financial capitals (Toronto, Vancouver, Perth, London, New York).",
    href: "/services#paid-social",
    icon: Building2,
  },
];

export const STAGE_3_CARDS: ServiceCardData[] = [
  {
    id: "public-relations",
    title: "Public Relations",
    category: "Assay & Editorial",
    description: "Direct wire distribution of drill intercepts, NI 43-101 technical reports, and quarterly filings.",
    href: "/services#pr",
    icon: Megaphone,
  },
  {
    id: "webinars-events",
    title: "Webinars & Events",
    category: "Executive Q&A",
    description: "Live CEO townhalls, virtual site visits, and 1-on-1 institutional investor conference hosting.",
    href: "/services#events",
    icon: Video,
  },
];

export const STAGE_4_CARDS: ServiceCardData[] = [
  {
    id: "website-dev",
    title: "Website Development",
    category: "Production & Hub",
    description: "Custom Next.js corporate portals with live commodity tickers, interactive property maps & SEC/SEDAR filings.",
    href: "/services#web-dev",
    icon: Globe,
  },
  {
    id: "app-dev",
    title: "App Development",
    category: "Investor Mobile App",
    description: "Native iOS/Android investor relation apps for real-time news alerts, drill results & stock tracking.",
    href: "/services#app-dev",
    icon: Smartphone,
  },
];

/**
 * The services journey: four photographs, four chapters, one pinned track.
 *
 * REWRITTEN AWAY FROM A CARD DECK. What was here rendered each stage as a duplicated
 * block carrying a gold "STAGE 01 // STAKE THE CLAIM" pill with a pulsing dot, two or
 * three glassmorphism cards, and a video-player progress bar pinned to the bottom of the
 * viewport. All of it read as UI sitting on top of a photograph rather than as a caption
 * belonging to one. The photograph is now the section; the type annotates it.
 *
 * WHAT DRIVES IT. One rAF loop measures the track and derives the chapter from it — the
 * same driver the homepage's frame sequence uses, for the same reason: it reads the rect
 * every frame so it cannot hold a stale offset, and it is indifferent to Lenis owning the
 * scroll. Nothing here is on a timer; the pulsing dot was the only autoplaying thing in
 * the section and it is gone.
 *
 * WHERE THE TYPE SITS. Measured, not assumed — run scripts/analyze-service-images.mjs.
 * Each photograph is scored for negative space the same way the mining frames are (dark
 * 0.55 + smooth 0.45), per third:
 *
 *   01-survey   left 0.391  right 0.327  bottom 0.327   -> LEFT   (+0.063)
 *   02-drill    left 0.466  right 0.442  bottom 0.494   -> BOTTOM (+0.028)
 *   03-assay    left 0.261  right 0.339  bottom 0.295   -> RIGHT  (+0.044)
 *   04-pit      left 0.419  right 0.297  bottom 0.320   -> LEFT   (+0.099)
 *
 * That is left / bottom / right / left. The brief asked for left / right / bottom / left;
 * stages 2 and 3 are swapped because the photographs say so — 03-assay's left third is
 * the busiest region in the whole set (0.261), so type on the left there lands squarely
 * on the subject.
 */

/** Where a chapter's type sits. */
type Zone = "left" | "right" | "bottom";

interface StageData {
  /** Two digits, shown as the chapter number. */
  num: string;
  /** The chapter name. Kept verbatim from the old badge, minus the "STAGE 0X //" prefix. */
  label: string;
  title: string;
  description: string;
  imageSrc: string;
  alt: string;
  zone: Zone;
  cards: ServiceCardData[];
}

const STAGES: StageData[] = [
  {
    num: "01",
    label: "Stake the Claim",
    title: "Geological Survey & Identity",
    description:
      "Laying the foundation with high-precision exploration surveying, market positioning, and core brand assets.",
    imageSrc: "/services/01-survey.jpg",
    alt: "Geological exploration survey rig",
    zone: "left",
    cards: STAGE_1_CARDS,
  },
  {
    num: "02",
    label: "Drill & Reach",
    title: "Exploration Drilling & Reach",
    description:
      "Amplifying active drill rig milestones, core discoveries, and paid institutional investor campaigns.",
    imageSrc: "/services/02-drill.jpg",
    alt: "Active exploration drill rig",
    zone: "bottom",
    cards: STAGE_2_CARDS,
  },
  {
    num: "03",
    label: "Assay & Prove",
    title: "Assay Verification & PR",
    description:
      "Broadcasting lab results, technical filings, CEO townhalls, and tier-1 financial press coverage.",
    imageSrc: "/services/03-assay.jpg",
    alt: "Core sample assay laboratory",
    zone: "right",
    cards: STAGE_3_CARDS,
  },
  {
    num: "04",
    label: "Smelt & Ship",
    title: "Commercial Production & Hub",
    description:
      "Deploying enterprise corporate web hubs and mobile apps for continuous capital market engagement.",
    imageSrc: "/services/04-pit.jpg",
    alt: "Open pit mine in commercial production",
    zone: "left",
    cards: STAGE_4_CARDS,
  },
];

/** The section's own ground, and the footer's, for the seam at the bottom. */
const GROUND = "#0B1220";
const FOOTER_GROUND = "#0B1F3A";

/** Long, decelerating, no overshoot — the same curve the rest of the site moves on. */
const EASE = [0.22, 1, 0.36, 1] as const;

/** Each chapter drifts along its own axis. 24px, inside the brief's 20-40px. */
const OFFSET: Record<Zone, { x: number; y: number }> = {
  left: { x: -24, y: 0 },
  right: { x: 24, y: 0 },
  bottom: { x: 0, y: 24 },
};

/**
 * Placement per zone. The base classes are the phone layout: at 390px there is no left
 * or right negative space worth aiming at, so every chapter anchors low and the
 * photograph keeps the top of the frame.
 *
 * The right zone clears 12vw rather than 8vw so it never runs into the chapter index
 * pinned to the right edge.
 */
const PLACE: Record<Zone, string> = {
  left: "items-end justify-start pb-[14vh] md:pb-[12vh] md:pl-[8vw]",
  right:
    "items-end justify-start pb-[14vh] md:items-center md:justify-end md:pr-[12vw] md:pb-[6vh]",
  bottom: "items-end justify-start pb-[14vh] md:justify-start md:pl-[8vw] md:pb-[11vh]",
};

/**
 * Localized scrims. Every chain reaches fully transparent well before the far edge, so
 * the photograph keeps its real exposure across most of the frame and the darkening
 * never closes into a rectangle behind the words.
 */
const SCRIM: Record<Zone, string> = {
  left:
    "linear-gradient(90deg, rgba(11,18,32,0.86) 0%, rgba(11,18,32,0.60) 20%, rgba(11,18,32,0.26) 42%, rgba(11,18,32,0) 64%)",
  right:
    "linear-gradient(270deg, rgba(11,18,32,0.86) 0%, rgba(11,18,32,0.60) 20%, rgba(11,18,32,0.26) 42%, rgba(11,18,32,0) 64%)",
  bottom:
    "linear-gradient(0deg, rgba(11,18,32,0.88) 0%, rgba(11,18,32,0.62) 22%, rgba(11,18,32,0.26) 46%, rgba(11,18,32,0) 68%)",
};

/** Keeps a thin glyph off a bright frame without reading as a glow. */
const INK_SHADOW = "0 1px 12px rgba(11,18,32,0.70)";

const chapterVariants = {
  hidden: (offset: { x: number; y: number }) => ({
    opacity: 0,
    x: offset.x,
    y: offset.y,
  }),
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: { duration: 0.7, ease: EASE, staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const lineVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export const ServicesScrollStory: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);
  const activeRef = useRef(0);

  const [active, setActive] = useState(0);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const check = () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setCompact(reduced || window.innerWidth < 1024);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /*
   * The driver. Measures the track every frame and derives the chapter from it — the
   * same approach as the homepage sequence, and for the same reason: a cached scroll
   * offset goes stale when the content above this section reflows, and this page's
   * scrolling is owned by Lenis rather than by native scroll events alone.
   */
  const tick = useCallback(() => {
    const node = containerRef.current;
    if (!node) return;

    const rect = node.getBoundingClientRect();
    const viewport = window.innerHeight;
    if (rect.bottom < 0 || rect.top > viewport) return;

    const span = rect.height - viewport;
    const raw = span > 0 ? -rect.top / span : 0;
    const p = raw < 0 ? 0 : raw > 1 ? 1 : raw;

    const next = Math.min(STAGES.length - 1, Math.floor(p * STAGES.length));
    if (next !== activeRef.current) {
      activeRef.current = next;
      setActive(next);
    }
  }, []);

  useEffect(() => {
    if (compact) return;
    let frame = requestAnimationFrame(function loop() {
      tick();
      frame = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(frame);
  }, [compact, tick]);

  /* ----------------------------------------------------------------- chapter type */

  const chapter = (stage: StageData, isActive: boolean) => (
    <motion.div
      key={stage.num}
      custom={OFFSET[stage.zone]}
      variants={chapterVariants}
      initial="hidden"
      animate={isActive ? "visible" : "hidden"}
      aria-hidden={!isActive}
      className={`absolute inset-0 flex px-6 md:px-0 ${PLACE[stage.zone]}`}
      style={{ pointerEvents: isActive ? "auto" : "none" }}
    >
      <div className="w-full max-w-[460px]">
        {/* Number, rule, chapter name on one line — the site's small-label pattern. */}
        <motion.div variants={lineVariants} className="flex items-center gap-4">
          <span className="font-mono text-[11px] tabular-nums text-[#D4AF37]/80">
            {stage.num}
          </span>
          <span className="h-px w-10 bg-[#B8860B]/50" />
          <p
            className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[#D4AF37]"
            style={{ textShadow: INK_SHADOW }}
          >
            {stage.label}
          </p>
        </motion.div>

        <motion.h2
          variants={lineVariants}
          className="mt-5 font-geist text-[clamp(1.5rem,2.2vw,2rem)] font-semibold leading-[1.25] tracking-[-0.035em] text-white"
          style={{ textShadow: INK_SHADOW }}
        >
          {stage.title}
        </motion.h2>

        <motion.p
          variants={lineVariants}
          className="mt-4 text-base font-normal leading-[1.6] text-[#B8BCC8] sm:text-[17px]"
          style={{ textShadow: INK_SHADOW }}
        >
          {stage.description}
        </motion.p>

        {/*
          The services themselves. Nine cards became nine lines: name, discipline, link.
          Each card's paragraph used to live inside a glass panel covering a third of the
          photograph; at this size the names carry the information and the /services page
          carries the detail.
        */}
        <motion.ul variants={lineVariants} className="mt-6 space-y-2.5">
          {stage.cards.map((card) => (
            <li key={card.id}>
              <Link
                href={card.href}
                tabIndex={isActive ? 0 : -1}
                className="group inline-flex items-baseline gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-4 focus-visible:ring-offset-[#0B1220]"
                style={{ textShadow: INK_SHADOW }}
              >
                <span className="h-px w-4 shrink-0 translate-y-[-4px] bg-[#B8860B]/50 transition-all duration-300 group-hover:w-7 group-hover:bg-[#D4AF37]" />
                <span className="text-sm font-medium text-white/85 transition-colors duration-200 group-hover:text-white">
                  {card.title}
                </span>
                <span className="font-mono text-[11px] text-white/40">
                  {card.category}
                </span>
              </Link>
            </li>
          ))}
        </motion.ul>

        <motion.div variants={lineVariants} className="mt-7">
          <Link
            href="/services"
            tabIndex={isActive ? 0 : -1}
            className="group inline-flex items-center gap-2 rounded-md bg-[#B8860B] px-6 py-3 font-sans text-sm font-semibold text-[#0B1F3A] transition-colors duration-200 hover:bg-[#D4AF37] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8860B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1220]"
          >
            Explore Our Services
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );

  /* ------------------------------------------------------------ compact / reduced */

  if (compact) {
    return (
      <section
        id="services"
        className="relative font-sans"
        /*
         * FOOTER_GROUND, not GROUND, and only on this branch.
         *
         * The journey branch below sits on GROUND (#0B1220) and dissolves into the
         * footer's #0B1F3A with the seam at the bottom of its sticky viewport. This
         * branch returns before any of that exists, so it was ending on a flat #0B1220
         * butting straight into the footer - two flat navies one step apart, which is
         * exactly the horizontal line a seam is there to prevent. Below 1024px that was
         * the last thing on the page.
         *
         * Taking the ground itself to the footer's colour removes the join rather than
         * hiding it: there is no longer a boundary to blend, so this branch needs no seam
         * of its own. It also happens to soften the join at the OTHER end - the ramp at
         * the bottom of TrustedBy is still mid-transition where it meets this section, and
         * #0B1F3A is nearer that grey than #0B1220 was, so the step there drops from 141
         * to 102 in summed channel distance.
         */
        style={{ backgroundColor: FOOTER_GROUND }}
      >
        <div className="container-editorial flex flex-col gap-16 py-20">
          {STAGES.map((stage) => (
            <article key={stage.num}>
              <div className="relative mb-6 h-56 w-full overflow-hidden sm:h-72">
                <Image
                  src={stage.imageSrc}
                  alt={stage.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{ background: SCRIM.bottom }}
                />
              </div>

              <div className="flex items-center gap-4">
                <span className="font-mono text-[11px] tabular-nums text-[#D4AF37]/80">
                  {stage.num}
                </span>
                <span className="h-px w-10 bg-[#B8860B]/50" />
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">
                  {stage.label}
                </p>
              </div>

              <h2 className="mt-5 font-geist text-[clamp(1.5rem,2.2vw,2rem)] font-semibold leading-[1.25] tracking-[-0.035em] text-white">
                {stage.title}
              </h2>
              <p className="mt-4 text-base leading-[1.6] text-[#B8BCC8]">
                {stage.description}
              </p>

              <ul className="mt-6 space-y-2.5">
                {stage.cards.map((card) => (
                  <li key={card.id}>
                    <Link href={card.href} className="inline-flex items-baseline gap-3">
                      <span className="h-px w-4 shrink-0 translate-y-[-4px] bg-[#B8860B]/50" />
                      <span className="text-sm font-medium text-white/85">
                        {card.title}
                      </span>
                      <span className="font-mono text-[11px] text-white/40">
                        {card.category}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          ))}

          <Link
            href="/services"
            className="inline-flex w-fit items-center gap-2 rounded-md bg-[#B8860B] px-6 py-3 font-sans text-sm font-semibold text-[#0B1F3A]"
          >
            Explore Our Services
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    );
  }

  /* ------------------------------------------------------------------- the journey */

  return (
    <section
      id="services"
      ref={containerRef}
      className="relative h-[500vh] font-sans"
      style={{ backgroundColor: GROUND }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/*
          All four photographs mounted and cross-faded. No Ken Burns: the previous version
          drifted and scaled each one to 1.15, which is the "premium template" move the
          brief rules out, and with the type now anchored to measured negative space a
          moving frame would slide the subject under the words.
        */}
        {STAGES.map((stage, index) => (
          <motion.div
            key={stage.num}
            className="absolute inset-0"
            initial={false}
            animate={{ opacity: index === active ? 1 : 0 }}
            transition={{ duration: 1.1, ease: EASE }}
          >
            <Image
              src={stage.imageSrc}
              alt={stage.alt}
              fill
              priority={index === 0}
              className="object-cover"
              sizes="100vw"
            />
          </motion.div>
        ))}

        {/* A contrast floor, not a darkening. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: "rgba(11,18,32,0.18)" }}
        />

        {/* Zone scrims — only the active chapter's is lit, so the shading travels. */}
        {(Object.keys(SCRIM) as Zone[]).map((zone) => (
          <motion.div
            key={zone}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ background: SCRIM[zone] }}
            initial={false}
            animate={{ opacity: STAGES[active].zone === zone ? 1 : 0 }}
            transition={{ duration: 0.9, ease: EASE }}
          />
        ))}

        {/* Something for the fixed navbar to sit on. */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-28"
          style={{
            background:
              "linear-gradient(180deg, rgba(11,18,32,0.72) 0%, rgba(11,18,32,0) 100%)",
          }}
        />

        <div className="absolute inset-0 z-20">
          {STAGES.map((stage, index) => chapter(stage, index === active))}
        </div>

        {/*
          Chapter index, right edge. Four numerals and a rule that grows beside the
          current one — a table of contents, not a playhead. The bar it replaces was a
          192px track with a percentage readout, which read as a video scrubber and told
          the reader nothing about where they were in the story.
        */}
        <div className="absolute right-6 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-4 md:flex">
          {STAGES.map((stage, index) => (
            <div key={stage.num} className="flex items-center justify-end gap-3">
              <span
                className={`h-px bg-[#D4AF37] transition-all duration-500 ease-out ${
                  index === active ? "w-6 opacity-100" : "w-0 opacity-0"
                }`}
              />
              <span
                className={`font-mono text-[11px] tabular-nums transition-colors duration-500 ${
                  index === active ? "text-[#D4AF37]" : "text-white/35"
                }`}
              >
                {stage.num}
              </span>
            </div>
          ))}
          <span className="sr-only">
            Chapter {active + 1} of {STAGES.length}
          </span>
        </div>

        {/*
          Seam into the footer. This section's ground is #0B1220 and the footer's is
          #0B1F3A — close, but a straight join between two flat navies still shows as a
          line. The entry seam is already handled from the other side, by the ramp at the
          bottom of TrustedBy.
        */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
          style={{
            background: `linear-gradient(180deg, rgba(11,18,32,0) 0%, ${FOOTER_GROUND} 100%)`,
          }}
        />
      </div>
    </section>
  );
};

export default ServicesScrollStory;
