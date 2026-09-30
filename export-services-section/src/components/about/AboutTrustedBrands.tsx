"use client";

import React, { useRef, useState } from "react";
import gsap from "gsap";
import { useReducedMotion } from "framer-motion";
import { TRUSTED_BRANDS, type TrustedBrand } from "@/data/trustedBrands";
import {
  HIDDEN_RISE,
  HIDDEN_RULE_X,
  MaskedWords,
  revealBlocks,
  useAboutMotion,
} from "./reveal";

/*
 * Section 09 — Trusted Brands.
 *
 * The same roster the homepage grid carries, moving instead of sitting still: two rows
 * travelling in opposite directions, which reads as a working wire rather than a logo wall
 * and lets 27 marks occupy the height of about four.
 *
 * Names and files are the source's, verbatim, from src/data/trustedBrands.ts. Nothing here
 * invents a client or renames one.
 */

/** Split near the middle so both rows carry a comparable amount of ink. */
const ROW_A = TRUSTED_BRANDS.slice(0, 14);
const ROW_B = TRUSTED_BRANDS.slice(14);

/*
 * One cell's logo. Renders the remote image and falls back to a plain text wordmark if the
 * request fails, so a renamed or withdrawn file downgrades to a wordmark instead of leaving
 * a hole in the row.
 *
 * Plain <img>, not next/image, for the same reasons the homepage grid gives: next/image
 * would need the host in images.remotePatterns and would proxy 27 files through the
 * optimizer on a host we do not control, and a bare <img> is what surfaces the failure as
 * an onError the fallback can act on.
 */
const BrandLogo: React.FC<{ brand: TrustedBrand }> = ({ brand }) => {
  const [available, setAvailable] = useState(true);

  if (!available) {
    return (
      <span className="px-3 text-center font-sans text-sm font-semibold tracking-tight text-[#57595E]">
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
       * Sized by WIDTH, not height. Every file is a 400x400 square whose wordmark occupies
       * a median 22% of that height, so a height cap shrinks the CANVAS and takes the mark
       * down with it in both directions. Filling the width and letting the cell clip the
       * white margin is what puts the mark at a readable size.
       */
      className="h-auto w-full max-w-[160px] object-contain transition-all duration-300 ease-out"
      /*
       * The files have no alpha channel — RGB on a #FFFFFF ground — so without this every
       * cell would paint a white tile. multiply maps white onto the backdrop exactly and
       * leaves the ink, which is why the cell below carries an explicit bg-white: a
       * transformed track is its own stacking context, and multiply needs a real colour
       * underneath it to blend against.
       */
      style={{ mixBlendMode: "multiply" }}
      // Sent without a Referer so the request matches the one these URLs were verified
      // with — costs nothing, and is the difference between logos and 27 wordmarks if the
      // host ever starts hotlink-protecting.
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setAvailable(false)}
    />
  );
};

const BrandCell: React.FC<{ brand: TrustedBrand }> = ({ brand }) => (
  <div className="flex h-[110px] w-[190px] shrink-0 items-center justify-center overflow-hidden bg-white px-4">
    <BrandLogo brand={brand} />
  </div>
);

export const AboutTrustedBrands: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const trackARef = useRef<HTMLDivElement | null>(null);
  const trackBRef = useRef<HTMLDivElement | null>(null);
  const tweensRef = useRef<gsap.core.Tween[]>([]);

  /*
   * Reduced motion swaps the marquee for a static wrapped set, rather than simply not
   * starting it. A stopped marquee is not a neutral fallback: the track is deliberately
   * twice as wide as the row and clipped, so parked at x=0 it would hide half the roster.
   *
   * framer-motion's hook rather than a matchMedia effect: it is what TrustedBy.tsx already
   * uses for the same decision on the homepage, and it resolves to false on the server so
   * the first client render still matches the server HTML.
   */
  const reduced = useReducedMotion();

  useAboutMotion(sectionRef, () => {
    if (headerRef.current) revealBlocks(headerRef.current);

    tweensRef.current = [];

    /*
     * Each track holds the row twice. Travelling exactly -50% of the track lands the second
     * copy precisely where the first began, so the repeat is seamless — no measuring, and
     * it stays seamless when the viewport resizes because the distance is a proportion of
     * the track rather than a pixel count.
     *
     * ease: "none" is what makes it a conveyor rather than a series of nudges.
     */
    const start = (track: HTMLElement | null, reverse: boolean, duration: number) => {
      if (!track) return;
      tweensRef.current.push(
        gsap.fromTo(
          track,
          { xPercent: reverse ? -50 : 0 },
          { xPercent: reverse ? 0 : -50, duration, ease: "none", repeat: -1 }
        )
      );
    };

    start(trackARef.current, false, 55);
    start(trackBRef.current, true, 62);
  });

  // Hover holds the rows still so a reader can actually look at a mark. Pointer-driven, so
  // it simply never fires on touch, where there is no hover to give.
  const hold = (paused: boolean) => () => {
    tweensRef.current.forEach((tween) => (paused ? tween.pause() : tween.resume()));
  };

  return (
    <section ref={sectionRef} className="overflow-hidden border-b border-[#E5E4DE] bg-white">
      <div className="container-editorial pt-20 md:pt-28">
        <div ref={headerRef}>
          <div data-about-rule-x className={`h-0.5 w-12 bg-[#B8860B] ${HIDDEN_RULE_X}`} />
          <span
            data-about-reveal
            className={`mt-6 block text-xs font-semibold uppercase tracking-[0.15em] text-[#B8860B] ${HIDDEN_RISE}`}
          >
            Trusted Brands
          </span>
          <h2 className="mt-6 max-w-[20ch] font-serif text-[clamp(2rem,4.2vw,3.25rem)] font-normal leading-[1.1] tracking-[-0.02em] text-[#0B1F3A]">
            <MaskedWords text="The companies we work with." />
          </h2>
        </div>
      </div>

      <div
        className="relative mt-14 pb-20 md:mt-20 md:pb-28"
        onMouseEnter={hold(true)}
        onMouseLeave={hold(false)}
      >
        {reduced ? (
          <div className="container-editorial">
            <div className="flex flex-wrap justify-center">
              {TRUSTED_BRANDS.map((brand) => (
                <BrandCell key={brand.name} brand={brand} />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/*
              The duplicate copy is aria-hidden and the row itself is a plain div, not a
              list: a screen reader should hear this roster once, in order, and hear nothing
              about the fact that it is moving.
            */}
            <div className="flex w-max" ref={trackARef}>
              {ROW_A.map((brand) => (
                <BrandCell key={brand.name} brand={brand} />
              ))}
              <div aria-hidden="true" className="flex">
                {ROW_A.map((brand) => (
                  <BrandCell key={`${brand.name}-repeat`} brand={brand} />
                ))}
              </div>
            </div>

            <div className="mt-4 flex w-max" ref={trackBRef}>
              {ROW_B.map((brand) => (
                <BrandCell key={brand.name} brand={brand} />
              ))}
              <div aria-hidden="true" className="flex">
                {ROW_B.map((brand) => (
                  <BrandCell key={`${brand.name}-repeat`} brand={brand} />
                ))}
              </div>
            </div>

            {/*
              Edge ramps, so marks arrive and leave rather than being cut off at the
              viewport. Opaque white at the outer edge, because the section ground is white.

              to-white/0, NOT to-transparent. Tailwind v4 interpolates gradients in oklab,
              and the `transparent` keyword is transparent BLACK — so white→transparent
              travels through a grey haze that reads as dirt over the logos. Fading white to
              its own zero-alpha keeps the hue fixed and only moves the alpha.
            */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-white/0 md:w-32"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-white/0 md:w-32"
            />
          </>
        )}
      </div>
    </section>
  );
};

export default AboutTrustedBrands;
