"use client";

import React, { useRef, useState } from "react";
import gsap from "gsap";
import { TRUSTED_BRANDS, type TrustedBrand } from "@/data/trustedBrands";
import {
  ABOUT_EASE,
  HIDDEN_RISE,
  HIDDEN_RULE_X,
  MaskedWords,
  REVEAL_START,
  revealBlocks,
  useAboutMotion,
} from "@/components/about/reveal";
import { useReducedMotionPreference } from "./useReducedMotionPreference";

/*
 * TRUSTED BRANDS — the brand wall.
 *
 * An asymmetric wall rather than a grid: twelve marks placed on a 12-column field at three
 * different sizes, so the eye moves through them instead of scanning a table. The full
 * roster then runs past once in a slow marquee, which is what says "and twenty-seven more"
 * without a number attached to it.
 *
 * ASSETS ARE THE PROJECT'S OWN. Every logo comes from src/data/trustedBrands.ts — the same
 * verified roster the homepage grid and /about's marquee use. Nothing here invents a client,
 * and no brand appears that is not already in that file.
 *
 * NO "FEATURED" LABEL. Three marks are set larger for editorial rhythm, which is a
 * typographic decision. Calling them featured would be a claim about a commercial
 * relationship the project holds no information about, so the hierarchy is size only.
 *
 * PLAIN <img>, NOT next/image, and deliberately — the same call TrustedBy.tsx and
 * AboutTrustedBrands.tsx already made and documented. These files are hotlinked from
 * miningdiscovery.com: next/image would need that host in images.remotePatterns (a global
 * config change) and would proxy 27 files through the optimiser on a host we do not control.
 * A bare <img> also fires onError, which is the signal the wordmark fallback needs.
 */

type Size = "sm" | "md" | "lg";

/** Where each mark sits on the 12-column field, and how much room it is given. Authored,
 *  not generated: the wall is identical on every render. Below lg it is a plain 2-column
 *  grid and every one of these placements is ignored. */
const WALL: Array<{ name: string; place: string; size: Size }> = [
  { name: "Kodiak Copper", place: "lg:col-start-2 lg:col-span-3", size: "md" },
  { name: "Aurion Resources", place: "lg:col-start-7 lg:col-span-3", size: "md" },
  { name: "Arizona Gold & Silver", place: "lg:col-start-1 lg:col-span-3", size: "sm" },
  { name: "West Red Lake", place: "lg:col-start-5 lg:col-span-4", size: "lg" },
  { name: "Pan Global", place: "lg:col-start-10 lg:col-span-3", size: "sm" },
  { name: "Power Metallic", place: "lg:col-start-3 lg:col-span-3", size: "md" },
  { name: "Arras Minerals", place: "lg:col-start-8 lg:col-span-3", size: "md" },
  { name: "US Gold", place: "lg:col-start-2 lg:col-span-2", size: "sm" },
  { name: "Guanajuato", place: "lg:col-start-5 lg:col-span-4", size: "lg" },
  { name: "Harfang", place: "lg:col-start-10 lg:col-span-2", size: "sm" },
  { name: "Astra Exploration", place: "lg:col-start-3 lg:col-span-3", size: "md" },
  { name: "Mining Investment Event", place: "lg:col-start-7 lg:col-span-4", size: "lg" },
];

/**
 * Size tiers. Opacity rises with size, so the wall has depth without any mark being faint
 * enough to read as broken.
 *
 * Each tier pairs a WIDTH with a shorter CELL HEIGHT, and that pairing is the whole trick.
 * Every logo file is a 1:1 square whose wordmark occupies a median 22% of its height, so
 * sizing by width alone turns each cell into a tall square that is mostly white margin — the
 * mark ends up tiny and the wall reads as sparse. Capping the cell height and clipping
 * crops that margin away, which makes the artwork itself larger without scaling the file up
 * or distorting a single logo. TrustedBy.tsx on the homepage carries the same note.
 */
const SIZE: Record<Size, { width: string; cell: string }> = {
  sm: { width: "max-w-[150px]", cell: "h-[92px]" },
  md: { width: "max-w-[200px]", cell: "h-[116px]" },
  lg: { width: "max-w-[260px]", cell: "h-[150px]" },
};

const HEADING_LINES = ["Trusted by companies", "shaping the future of mining."];

/** The category strip. Words describing the sector, not companies or claims. */
const CATEGORIES = ["Mining", "Exploration", "Investment", "Technology", "Energy"];

const byName = (name: string): TrustedBrand | undefined =>
  TRUSTED_BRANDS.find((brand) => brand.name === name);

/*
 * One mark. Falls back to a text wordmark if the file 404s or is renamed upstream, so a
 * withdrawn logo degrades to the company's name rather than to a hole in the wall.
 */
const BrandMark: React.FC<{ brand: TrustedBrand; width: string }> = ({
  brand,
  width,
}) => {
  const [available, setAvailable] = useState(true);

  if (!available) {
    return (
      <span className="text-center font-sans text-sm font-semibold tracking-tight text-[#57595E]">
        {brand.name}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={brand.logo}
      alt={`${brand.name} logo`}
      /*
       * Sized by WIDTH. Every file is a 1:1 square whose wordmark occupies a median 22% of
       * its height, so a height cap shrinks the CANVAS and takes the mark down with it.
       * h-auto keeps the aspect ratio exactly — nothing here is stretched or distorted.
       */
      className={`h-auto w-full ${width} object-contain transition-all duration-300 ease-out hover:scale-[1.04]`}
      /*
       * The files are RGB on a #FFFFFF ground with no alpha, so without this every mark
       * paints a white tile onto the ivory. multiply maps white onto the backdrop exactly and
       * leaves the ink — which is why the cell below sets an explicit ivory background: a
       * transformed cell is its own stacking context, and multiply needs a real colour under
       * it to blend against.
       */
      style={{ mixBlendMode: "multiply" }}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setAvailable(false)}
    />
  );
};

export const ServicesTrustedBrands: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const wallRef = useRef<HTMLDivElement | null>(null);
  const logoTrackRef = useRef<HTMLDivElement | null>(null);
  const wordTrackRef = useRef<HTMLDivElement | null>(null);
  const tweensRef = useRef<gsap.core.Tween[]>([]);

  /*
   * The marquee is swapped for a static wrapped row, not merely stopped. A halted marquee is
   * not a neutral fallback: its track is deliberately twice as wide as the row and clipped,
   * so parked at x:0 it would hide half the roster.
   */
  const reduced = useReducedMotionPreference();

  useAboutMotion(sectionRef, () => {
    if (headerRef.current) revealBlocks(headerRef.current);

    /*
     * The wall reveals in DOM order with a stagger, so it fills the way the eye reads it
     * rather than all at once. scale lives only in the tween — never as a CSS class — because
     * Tailwind v4 compiles `scale-*` to the standalone `scale` property, which would compose
     * with the transform GSAP writes instead of being replaced by it and leave every mark
     * permanently at 0.95.
     */
    const cells = wallRef.current?.querySelectorAll<HTMLElement>("[data-brand-cell]");
    if (cells?.length) {
      gsap.fromTo(
        cells,
        { y: 24, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.7,
          stagger: 0.055,
          ease: ABOUT_EASE,
          scrollTrigger: { trigger: wallRef.current, start: REVEAL_START, once: true },
        }
      );
    }

    /*
     * Each track holds its content twice, so travelling exactly -50% lands the second copy
     * where the first began and the loop is seamless — no measuring, and it stays seamless
     * through a resize because the distance is a proportion of the track, not a pixel count.
     *
     * 90s and 120s are deliberately slow: at this speed a mark takes several seconds to cross,
     * which reads as drift rather than as something demanding attention.
     */
    tweensRef.current = [];
    const drift = (track: HTMLElement | null, duration: number, reverse = false) => {
      if (!track) return;
      tweensRef.current.push(
        gsap.fromTo(
          track,
          { xPercent: reverse ? -50 : 0 },
          { xPercent: reverse ? 0 : -50, duration, ease: "none", repeat: -1 }
        )
      );
    };

    drift(logoTrackRef.current, 90);
    drift(wordTrackRef.current, 120, true);
  });

  // Hover holds the row still so a reader can actually look at a mark. Pointer-driven, so it
  // simply never fires on touch, where there is no hover to give.
  const hold = (paused: boolean) => () => {
    tweensRef.current.forEach((tween) => (paused ? tween.pause() : tween.resume()));
  };

  const marqueeBrands = TRUSTED_BRANDS;

  return (
    <section ref={sectionRef} className="relative overflow-x-clip border-b border-[#E5E4DE]">
      {/* --- Intro ------------------------------------------------------------- */}
      <div className="container-editorial pt-20 md:pt-28">
        <div ref={headerRef}>
          <div data-about-rule-x className={`h-0.5 w-12 bg-[#B8860B] ${HIDDEN_RULE_X}`} />

          <span
            data-about-reveal
            className={`mt-6 block text-xs font-semibold uppercase tracking-[0.15em] text-[#B8860B] ${HIDDEN_RISE}`}
          >
            Trusted by the Industry
          </span>

          <h2 className="mt-8 text-balance font-geist text-[clamp(1.875rem,4.2vw,3.5rem)] font-bold uppercase leading-[1.02] tracking-[-0.03em] text-[#0B1F3A]">
            {HEADING_LINES.map((line) => (
              <span key={line} className="block">
                <MaskedWords text={line} />
              </span>
            ))}
          </h2>

          <p
            data-about-reveal
            className={`mt-8 max-w-[56ch] text-lg font-normal leading-relaxed text-[#3A3D42] sm:text-xl ${HIDDEN_RISE}`}
          >
            From exploration and development to established mining companies, Mining Discovery
            helps industry voices reach the audiences that matter.
          </p>
        </div>

        {/* --- The wall --------------------------------------------------------- */}
        {/*
          Twelve marks on a 12-column field above lg, each with an authored start column and
          span so the rows break at different points and the wall never reads as a table.
          Below lg every placement is ignored and it becomes a plain two-column arrangement
          with room to breathe, which is what the brief asks for on a phone.
        */}
        <div
          ref={wallRef}
          className="mt-16 grid grid-cols-2 items-center gap-x-8 gap-y-10 md:mt-24 md:gap-x-12 lg:grid-cols-12 lg:gap-y-14"
        >
          {WALL.map(({ name, place, size }) => {
            const brand = byName(name);
            if (!brand) return null;

            return (
              <div
                key={name}
                data-brand-cell
                data-about-reveal
                /*
                 * The explicit ivory ground is load-bearing, not decorative: the mark above
                 * relies on mix-blend-mode: multiply to erase its white background, and
                 * multiply needs an opaque colour beneath it. The reveal puts a transform on
                 * this cell, which makes it its own stacking context — without a real colour
                 * here the white would blend against nothing and survive.
                 */
                className={`flex items-center justify-center overflow-hidden bg-[#F7F5EF] ${SIZE[size].cell} ${place} ${HIDDEN_RISE}`}
              >
                <BrandMark brand={brand} width={SIZE[size].width} />
              </div>
            );
          })}
        </div>
      </div>

      {/* --- The full roster, drifting ----------------------------------------- */}
      <div
        className="relative mt-20 md:mt-28"
        onMouseEnter={hold(true)}
        onMouseLeave={hold(false)}
      >
        {reduced ? (
          <div className="container-editorial">
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-8">
              {marqueeBrands.map((brand) => (
                <div key={brand.name} className="flex h-[100px] w-[150px] items-center justify-center overflow-hidden bg-[#F7F5EF]">
                  <BrandMark brand={brand} width="max-w-[170px]" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/*
              The duplicate copy is aria-hidden and the row is a plain div, not a list: a
              screen reader should hear this roster once, in order, and hear nothing about the
              fact that it is moving.
            */}
            <div ref={logoTrackRef} className="flex w-max items-center">
              {marqueeBrands.map((brand) => (
                <div
                  key={brand.name}
                  className="flex h-[100px] w-[178px] shrink-0 items-center justify-center overflow-hidden bg-[#F7F5EF] px-4"
                >
                  <BrandMark brand={brand} width="max-w-[170px]" />
                </div>
              ))}
              <div aria-hidden="true" className="flex items-center">
                {marqueeBrands.map((brand) => (
                  <div
                    key={`${brand.name}-repeat`}
                    className="flex h-[100px] w-[178px] shrink-0 items-center justify-center overflow-hidden bg-[#F7F5EF] px-4"
                  >
                    <BrandMark brand={brand} width="max-w-[170px]" />
                  </div>
                ))}
              </div>
            </div>

            {/* Edge ramps, so marks arrive and leave rather than being cut off at the
                viewport. Opaque ivory at the outer edge because that is the section ground.
                to-…/0 rather than to-transparent: Tailwind v4 interpolates in oklab and the
                `transparent` keyword is transparent BLACK, which travels through a grey haze. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#F7F5EF] to-[#F7F5EF]/0 md:w-32"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#F7F5EF] to-[#F7F5EF]/0 md:w-32"
            />
          </>
        )}
      </div>

      {/* --- Category strip ----------------------------------------------------- */}
      {/*
        Sector words, not companies — nothing here asserts a relationship. It drifts the
        opposite way to the logos above at two-thirds the speed, which keeps the two strips
        from reading as one belt.
      */}
      <div className="relative mt-14 overflow-hidden border-t border-[#E5E4DE] py-6 md:mt-20">
        {reduced ? (
          <div className="flex flex-wrap items-center justify-center gap-x-6">
            {CATEGORIES.map((word) => (
              <span
                key={word}
                className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0B1F3A]/35"
              >
                {word}
              </span>
            ))}
          </div>
        ) : (
          <div ref={wordTrackRef} className="flex w-max items-center">
            {[0, 1].map((copy) => (
              <div key={copy} aria-hidden={copy === 1} className="flex items-center">
                {CATEGORIES.map((word) => (
                  <span key={word} className="flex items-center">
                    <span className="whitespace-nowrap px-8 text-xs font-semibold uppercase tracking-[0.2em] text-[#0B1F3A]/35">
                      {word}
                    </span>
                    <span aria-hidden="true" className="h-1 w-1 rounded-full bg-[#B8860B]/50" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ServicesTrustedBrands;
