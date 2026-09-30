"use client";

import React, { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * The About page's shared motion vocabulary.
 *
 * Every section on /about reveals through the same three primitives declared here — a
 * masked word rise, a fade-and-rise block, and a rule that draws itself — so the page
 * reads as one document rather than as nine separately-authored blocks. The numbers live
 * in this file precisely so that retuning the feel is one edit, not nine.
 *
 * This is the About-page sibling of SectionReveal.tsx, not a replacement for it. That file
 * owns the framer-motion rhythm the homepage sections share; this one owns the GSAP
 * rhythm, which is what /about needs because its sections are scroll-scrubbed rather than
 * simply triggered, and because SmoothScroll.tsx already feeds Lenis into ScrollTrigger.
 */

/** Shared ease. A long flat tail and no overshoot — editorial rather than springy. */
export const ABOUT_EASE = "power3.out";

/** How far a masked word starts below its mask, as a percentage of its own height. It has
 *  to clear the mask's 0.2em descender allowance, hence >100. */
export const RISE_PERCENT = 120;

/** Where a section commits: its top edge 82% of the way down the viewport. Late enough
 *  that nothing fires while still off screen, early enough that it is moving as it lands. */
export const REVEAL_START = "top 82%";

/* ------------------------------------------------------------------------------------ *
 * Initial states.
 *
 * Written as CSS classes, not inline styles or a JS gsap.set, and that ordering is the
 * whole point: the server-rendered HTML paints before hydration, so a JS-only hidden state
 * would flash the finished section first. `motion-reduce:` neutralises them for readers
 * who have asked for less motion, and page.tsx carries a <noscript> override for readers
 * with no JS at all.
 *
 * These set the `transform` property rather than Tailwind's `translate-y-*` utilities.
 * Tailwind v4 compiles those to the separate `translate` property, which COMPOSES with the
 * `transform` GSAP writes instead of being replaced by it — the element would end up
 * permanently offset by its own start distance.
 * ------------------------------------------------------------------------------------ */

/** A block that fades and rises into place. Pair with data-about-reveal. */
export const HIDDEN_RISE =
  "opacity-0 [transform:translateY(28px)] motion-reduce:opacity-100 motion-reduce:[transform:none]";

/** A horizontal rule that draws left to right. Pair with data-about-rule-x. */
export const HIDDEN_RULE_X =
  "origin-left [transform:scaleX(0)] motion-reduce:[transform:none]";

/** A vertical connector that draws top to bottom. Pair with data-about-rule-y. */
export const HIDDEN_RULE_Y =
  "origin-top [transform:scaleY(0)] motion-reduce:[transform:none]";

export const WORD_SELECTOR = ".about-mask__word";

/**
 * One word behind its own mask.
 *
 * inline-flex, not inline-block, and that is load-bearing: a block container with
 * `overflow: hidden` takes its baseline from its bottom margin edge, which would lift every
 * word off the baseline and visibly reposition the heading. A flex container keeps the
 * baseline of its first item, so the masked word sits exactly where the bare text sat.
 * Measured across 1440/1024/768/390: every word lands within 0.06px of where the
 * unmasked text renders, and the element boxes are identical.
 *
 * The padding/negative-margin pairs enlarge the clipping box without contributing anything
 * to layout: the bottom 0.2em stops descenders being shaved off at rest, and the
 * horizontal 0.08em gives the last glyph the room that negative tracking would otherwise
 * clip. Both are cancelled by their negative margins.
 */
export const MaskedWords: React.FC<{ text: string }> = ({ text }) => {
  const words = text.split(" ");

  return (
    <>
      {words.map((word, index) => (
        <React.Fragment key={`${word}-${index}`}>
          <span className="about-mask inline-flex overflow-hidden px-[0.08em] -mx-[0.08em] pb-[0.2em] -mb-[0.2em]">
            <span className="about-mask__word about-mask__word--hidden inline-block opacity-0 [transform:translateY(120%)] motion-reduce:opacity-100 motion-reduce:[transform:none]">
              {word}
            </span>
          </span>
          {/* A plain space between masks, so the line still wraps exactly where it wrapped
              when this was one uninterrupted text node. */}
          {index < words.length - 1 ? " " : null}
        </React.Fragment>
      ))}
    </>
  );
};

/**
 * Group a masked run of text by the line each word actually landed on.
 *
 * Which words share a line is a question only the browser can answer — the copy wraps to
 * three lines on a phone and two at 1440 — so hard-coding a split would freeze one of those
 * and break the rest. offsetTop rather than a bounding rect, because it ignores the
 * transforms the words are already carrying.
 */
export function groupWordsByLine(root: HTMLElement | null): HTMLElement[][] {
  if (!root) return [];

  const lines: HTMLElement[][] = [];
  let lineTop = Number.NaN;

  root.querySelectorAll<HTMLElement>(".about-mask").forEach((mask) => {
    const word = mask.querySelector<HTMLElement>(WORD_SELECTOR);
    if (!word) return;

    if (!lines.length || Math.abs(mask.offsetTop - lineTop) > 4) {
      lines.push([]);
      lineTop = mask.offsetTop;
    }

    lines[lines.length - 1].push(word);
  });

  return lines;
}

/** The from/to pair for a masked word rise. fromTo rather than to, throughout: the resting
 *  position is written in CSS, and GSAP would otherwise read that as the destination. */
export const maskedFrom = { yPercent: RISE_PERCENT, y: 0, opacity: 0 } as const;
export const maskedTo = { yPercent: 0, opacity: 1, duration: 1.05, ease: ABOUT_EASE } as const;

/**
 * Reveal every marked element inside `scope` on a single scroll trigger.
 *
 * The default for a section that simply arrives. Sections that need scrubbing or an active
 * index build their own timelines instead and call this for whatever is left over.
 */
export function revealBlocks(
  scope: HTMLElement,
  options: { trigger?: Element; stagger?: number; start?: string } = {}
) {
  const rules = scope.querySelectorAll<HTMLElement>("[data-about-rule-x]");
  const rulesY = scope.querySelectorAll<HTMLElement>("[data-about-rule-y]");
  const blocks = scope.querySelectorAll<HTMLElement>("[data-about-reveal]");
  const words = scope.querySelectorAll<HTMLElement>(WORD_SELECTOR);

  const tl = gsap.timeline({
    defaults: { ease: ABOUT_EASE },
    scrollTrigger: {
      trigger: options.trigger ?? scope,
      start: options.start ?? REVEAL_START,
      once: true,
    },
  });

  if (rules.length) {
    tl.fromTo(rules, { scaleX: 0 }, { scaleX: 1, duration: 0.9 }, 0);
  }
  if (rulesY.length) {
    tl.fromTo(rulesY, { scaleY: 0 }, { scaleY: 1, duration: 0.7, stagger: 0.12 }, 0.2);
  }
  if (words.length) {
    tl.fromTo(words, maskedFrom, { ...maskedTo, stagger: 0.07 }, 0.14);
  }
  if (blocks.length) {
    tl.fromTo(
      blocks,
      { y: 28, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.75, stagger: options.stagger ?? 0.09 },
      0.24
    );
  }

  return tl;
}

/** Write the finished state in, inline, where it outranks the CSS initial state. Used for
 *  readers who have asked for reduced motion: skipping the animation must not mean
 *  skipping the content. */
export function settle(scope: HTMLElement) {
  gsap.set(scope.querySelectorAll("[data-about-reveal]"), { y: 0, opacity: 1 });
  gsap.set(scope.querySelectorAll("[data-about-rule-x]"), { scaleX: 1 });
  gsap.set(scope.querySelectorAll("[data-about-rule-y]"), { scaleY: 1 });
  gsap.set(scope.querySelectorAll(WORD_SELECTOR), { yPercent: 0, y: 0, opacity: 1 });
}

/**
 * The boilerplate every About section repeats, in one place: honour reduced motion, wait
 * for webfonts so ScrollTrigger measures a settled layout, scope everything to this
 * section's own element, and revert on unmount.
 *
 * `build` receives the section element and runs inside a gsap.context bound to it, so any
 * selector string used within is resolved against this section alone — nothing declared
 * here can reach another page.
 */
export function useAboutMotion(
  scopeRef: React.RefObject<HTMLElement | null>,
  build: (scope: HTMLElement) => void
) {
  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      settle(scope);
      return;
    }

    let cancelled = false;
    let ctx: ReturnType<typeof gsap.context> | null = null;

    const start = () => {
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => build(scope), scope);
    };

    const fonts = document.fonts;
    if (fonts && fonts.status !== "loaded") {
      fonts.ready.then(start);
    } else {
      start();
    }

    return () => {
      cancelled = true;
      ctx?.revert();
    };
    // build is redeclared every render by design; the effect is keyed to the element only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
