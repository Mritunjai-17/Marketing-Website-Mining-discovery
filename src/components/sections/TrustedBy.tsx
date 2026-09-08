"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { SectionReveal, itemVariants } from "@/components/ui/SectionReveal";

interface Company {
  name: string;
  logo: string;
}


/*
 * Hotlinked straight from miningdiscovery.com rather than copied into /public.
 *
 * The URLs carry literal spaces and are passed through unencoded on purpose. A browser
 * percent-encodes the path when it builds the request, so these resolve; pre-encoding
 * them here would be equivalent, but hand-editing them to %20 or to dashes is how the
 * filenames drift out of sync with the source. They are the source's names, verbatim.
 *
 * "BBluenergies" is not a typo on this side — that is the filename as served.
 */
const companies: Company[] = [
  { name: "Arras Minerals", logo: "https://www.miningdiscovery.com/trustedbrands/ARRAS Minerals LOGO.png" },
  { name: "Afrikor", logo: "https://www.miningdiscovery.com/trustedbrands/Afrikor LOGO.png" },
  { name: "Arizona Gold & Silver", logo: "https://www.miningdiscovery.com/trustedbrands/Arizona Gold & Silver LOGO.png" },
  { name: "Astra Exploration", logo: "https://www.miningdiscovery.com/trustedbrands/Astra Exploration LOGO.png" },
  { name: "Aurion Resources", logo: "https://www.miningdiscovery.com/trustedbrands/Aurion Resources LOGO.png" },
  { name: "Bluenergies", logo: "https://www.miningdiscovery.com/trustedbrands/BBluenergies LOGO.png" },
  { name: "Bactech", logo: "https://www.miningdiscovery.com/trustedbrands/Bactech LOGO.png" },
  { name: "Digipower X", logo: "https://www.miningdiscovery.com/trustedbrands/DIGIPOWER X LOGO.png" },
  { name: "Gold Hunter Resources", logo: "https://www.miningdiscovery.com/trustedbrands/Gold Hunter Resources LOGO.png" },
  { name: "Golkor", logo: "https://www.miningdiscovery.com/trustedbrands/Golkor LOGO.png" },
  { name: "Guanajuato", logo: "https://www.miningdiscovery.com/trustedbrands/Guanajuato LOGO.png" },
  { name: "Harfang", logo: "https://www.miningdiscovery.com/trustedbrands/Harfang LOGO.png" },
  { name: "He Capital", logo: "https://www.miningdiscovery.com/trustedbrands/He Capital LOGO.png" },
  { name: "Kodiak Copper", logo: "https://www.miningdiscovery.com/trustedbrands/Kodiak Copper LOGO.png" },
  { name: "Leviathan", logo: "https://www.miningdiscovery.com/trustedbrands/Leviathan LOGO.png" },
  { name: "Loyalist", logo: "https://www.miningdiscovery.com/trustedbrands/Loyalist LOGO.png" },
  { name: "Mining Investment Event", logo: "https://www.miningdiscovery.com/trustedbrands/Mining Investment Event LOGO.png" },
  { name: "Noble Plains", logo: "https://www.miningdiscovery.com/trustedbrands/Noble Plains LOGO.png" },
  { name: "Pan Global", logo: "https://www.miningdiscovery.com/trustedbrands/Pan Global LOGO.png" },
  { name: "Phenom Resources", logo: "https://www.miningdiscovery.com/trustedbrands/Phenom Resources LOGO.png" },
  { name: "Power Metallic", logo: "https://www.miningdiscovery.com/trustedbrands/Power Metallic LOGO.png" },
  { name: "SilverWolf", logo: "https://www.miningdiscovery.com/trustedbrands/SilverWolf LOGO.png" },
  { name: "Spacekor", logo: "https://www.miningdiscovery.com/trustedbrands/Spacekor LOGO.png" },
  { name: "US Gold", logo: "https://www.miningdiscovery.com/trustedbrands/US GOLD LOGO.png" },
  { name: "USDC", logo: "https://www.miningdiscovery.com/trustedbrands/USDC LOGO.png" },
  { name: "Vivio Power", logo: "https://www.miningdiscovery.com/trustedbrands/Vivio Power LOGO.png" },
  { name: "West Red Lake", logo: "https://www.miningdiscovery.com/trustedbrands/West Red Lake LOGO.png" },
];

/*
 * MEASURED ARTWORK EXTENT, and this table is the whole reason the logos come out the
 * same size. Two numbers per logo: how much of its 400x400 canvas the artwork actually
 * covers, as a fraction of the canvas width and of its height.
 *
 * The problem it solves is not the one it looks like. Every file in this set is already
 * the SAME 400x400 RGB square, so there is no native-dimension variance to normalise -
 * object-fit has nothing to bite on. The variance is INSIDE the canvas: each logo is
 * trimmed to roughly full width (0.78-0.95) but its height runs from 0.147 (West Red
 * Lake, a long thin wordmark) to 0.895 (Mining Investment Event, a square emblem), the
 * rest being white margin. Fitting the CANVAS to the card's 54px logo
 * allowance therefore fits the margin, and a wordmark lands about 8px tall.
 *
 * So the box below is fitted to the ARTWORK instead. Given the extent, the canvas size
 * that makes the artwork exactly fill the card's LOGO_W x LOGO_H allowance is
 *
 *   min(LOGO_W / wFrac, LOGO_H / hFrac)
 *
 * which is what --tb-fit computes in CSS, per logo, from these two custom properties.
 * A wide wordmark hits the width limit and a square emblem hits the height limit - the
 * standard "contain the mark in a common box" rule, applied to the mark rather than to
 * the white paper it happens to be printed on. Every card therefore carries the same
 * artwork footprint, and none is closer to filling its card than any other.
 *
 * Regenerate by decoding each PNG and taking the bounding box of every pixel darker
 * than 240 on any channel; the artwork is centred to within 1% in every file, so the
 * extent alone is enough and no offset is needed. A logo missing from this table falls
 * back through the var() defaults to plain contain-the-canvas, which is safe but small.
 */
const INK_EXTENT: Record<string, [number, number]> = {
  "Arras Minerals": [0.84, 0.165],
  Afrikor: [0.875, 0.23],
  "Arizona Gold & Silver": [0.805, 0.595],
  "Astra Exploration": [0.86, 0.365],
  "Aurion Resources": [0.835, 0.372],
  Bluenergies: [0.95, 0.18],
  Bactech: [0.882, 0.165],
  "Digipower X": [0.87, 0.16],
  "Gold Hunter Resources": [0.775, 0.775],
  Golkor: [0.865, 0.237],
  Guanajuato: [0.915, 0.22],
  Harfang: [0.935, 0.158],
  "He Capital": [0.895, 0.215],
  "Kodiak Copper": [0.89, 0.165],
  Leviathan: [0.927, 0.27],
  Loyalist: [0.848, 0.182],
  "Mining Investment Event": [0.895, 0.895],
  "Noble Plains": [0.915, 0.667],
  "Pan Global": [0.91, 0.19],
  "Power Metallic": [0.82, 0.338],
  SilverWolf: [0.84, 0.247],
  Spacekor: [0.797, 0.168],
  "US Gold": [0.902, 0.21],
  USDC: [0.81, 0.315],
  "Vivio Power": [0.89, 0.18],
  "West Red Lake": [0.885, 0.147],
};

/**
 * Split point. Two rows travelling opposite ways read as a moving field; one row cut in
 * half reads as a strip that ran out. 27 is odd, so the top row carries the extra one.
 */
const SPLIT = Math.ceil(companies.length / 2);
const ROW_ONE = companies.slice(0, SPLIT);
const ROW_TWO = companies.slice(SPLIT);

/**
 * Seconds each logo spends crossing one loop's worth of travel. Duration is derived from
 * the row's length rather than fixed, so the two rows - 14 logos and 13 - run at the same
 * speed instead of the shorter one finishing early and looking hurried.
 *
 * Raised 3.7 -> 4.1 purely to ABSORB the wider card, not to change the pace. Duration is
 * per logo while the distance travelled per logo is the card plus the gap, so widening the
 * card from 160 to 180 would have sped the marquee up by 11% on its own - 49.7px/s to
 * 55.1px/s - as a side effect of a sizing change. 4.1s puts it back at 49.8px/s, which is
 * where it was. Drop it back to 3.7 if the faster scroll is wanted.
 */
const SECONDS_PER_LOGO = 4.1;

/*
 * All of this section's CSS lives here rather than in globals.css, so the redesign stays
 * one file. Nothing leaks: every selector is under .tb-marquee's own class names.
 *
 * The animation is two keyframes on a doubled track and nothing else - no rAF loop, no
 * scroll listener, no per-frame React. translate3d keeps it on the compositor, so a
 * scrolling row costs no layout and no paint.
 */
const MARQUEE_CSS = `
.tb-marquee {
  --tb-card-w: 180px;
  --tb-card-h: 90px;
  --tb-gap: 24px;

  /*
   * The logo's allowance inside the card. Every logo is fitted to THIS box, not to the
   * card, so the margin around the artwork is identical on every card and no logo comes
   * closer to filling its card than any other.
   *
   * Opened up from the original 0.8 x 0.6, which left the artwork sitting in a great deal
   * of white. Both axes now land on +25% over that starting point:
   *
   *   0.60 -> 0.78 of height. 54px -> 70.2px. Binds on the square emblems and the tall
   *   marks, which is where the waste was worst - a 54px mark in a 90px card.
   *
   *   0.80 -> 0.89 of width. 128px -> 160.2px. Binds on the wide wordmarks. The fraction
   *   FELL while the mark grew, because the card went 160 -> 180 underneath it: at the old
   *   160px card a wordmark could only reach +15% before running flush into the wall, and
   *   the extra 20px of card is what buys the remaining 10 points. Keeping the fraction at
   *   0.92 on the wider card would have overshot to +29% and cut the side margin to 7px.
   *
   * The margins come out symmetric as a result - 9.9px on all four sides of the allowance
   * - which is why the artwork now reads as centred in the card rather than as a wide box
   * with a short mark floating in it.
   *
   * Card HEIGHT, radius, border, background and the gap between cards are all unchanged;
   * only the width and this inner margin moved.
   */
  --tb-logo-w: calc(var(--tb-card-w) * 0.89);
  --tb-logo-h: calc(var(--tb-card-h) * 0.78);
}
@media (max-width: 640px) {
  .tb-marquee { --tb-card-w: 144px; --tb-card-h: 72px; --tb-gap: 16px; }
}

/*
 * The window. overflow-hidden is what keeps the second copy of the list invisible until
 * it is scrolled into place; the mask makes a card fade out over roughly its own width
 * at each end, so logos leave frame instead of being sliced against a hard edge.
 */
.tb-row {
  overflow: hidden;
  -webkit-mask-image: linear-gradient(to right, transparent 0, #000 7%, #000 93%, transparent 100%);
  mask-image: linear-gradient(to right, transparent 0, #000 7%, #000 93%, transparent 100%);
}

/*
 * The track holds the list twice and translates by exactly half its own width, which
 * lands copy 2 precisely where copy 1 started - so the loop point is invisible.
 *
 * padding-right is load-bearing, not spacing. Flex puts a gap BETWEEN items, so a
 * doubled list of n cards is 2n cards and 2n-1 gaps: half of that is n cards and n-0.5
 * gaps, which is half a gap short of one copy, and the seam stutters every lap. The
 * extra trailing gap makes the track 2n cards and 2n gaps, so 50% is exactly one copy.
 */
.tb-track {
  display: flex;
  align-items: center;
  gap: var(--tb-gap);
  padding-right: var(--tb-gap);
  margin: 0;
  padding-left: 0;
  list-style: none;
  width: max-content;
  will-change: transform;
  animation: tb-scroll-left calc(var(--tb-count) * ${SECONDS_PER_LOGO}s) linear infinite;
}
.tb-track--reverse { animation-name: tb-scroll-right; }

@keyframes tb-scroll-left {
  from { transform: translate3d(0, 0, 0); }
  to   { transform: translate3d(-50%, 0, 0); }
}
@keyframes tb-scroll-right {
  from { transform: translate3d(-50%, 0, 0); }
  to   { transform: translate3d(0, 0, 0); }
}

/* Hovering a row holds it still, so the card under the pointer can actually be read. */
.tb-row:hover .tb-track { animation-play-state: paused; }

/*
 * The card. One fixed width and height for every logo in both rows, whatever the shape
 * of the artwork it carries.
 *
 * White, not the section's #F4F4F2, and that is not only a look. These files have no
 * alpha channel - they are ink on an opaque white ground - so they are composited with
 * mix-blend-mode: multiply to drop that ground. Multiply against pure white is the
 * identity, so a white card leaves every brand colour exactly as authored, where an
 * off-white card would tint all 27 of them by the same few percent.
 *
 * overflow: hidden clips the canvas's white margin at the rounded edge. Only margin is
 * ever clipped: the artwork itself is fitted well inside the card by --tb-fit below.
 */
.tb-logo {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--tb-card-w);
  height: var(--tb-card-h);
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  background: #ffffff;
}

/*
 * The canvas, sized so the ARTWORK inside it fills the shared logo box. See INK_EXTENT.
 * The var() fallbacks of 1 degrade to min(logo-w, logo-h) - plain contain-the-canvas -
 * for any logo with no measurement, so a new entry renders correctly rather than not
 * at all.
 */
.tb-logo__fit {
  --tb-fit: min(calc(var(--tb-logo-w) / var(--tb-iw, 1)), calc(var(--tb-logo-h) / var(--tb-ih, 1)));
  flex: 0 0 auto;
  display: block;
  width: var(--tb-fit);
  height: var(--tb-fit);
}

/*
 * No filter, no opacity, no hover transition. Every logo renders in its own brand
 * colour at full strength at all times - at rest, mid-scroll and under the pointer.
 */
.tb-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  mix-blend-mode: multiply;
}

/* Wordmark fallback for a logo whose file will not load. Same card, same full strength. */
.tb-logo__word {
  padding: 0 10px;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: -0.01em;
  color: #0b1f3a;
}

/*
 * Reduced motion gets a static, evenly-spaced wall rather than a stopped marquee. A
 * halted track is not a neutral fallback: it is one row's worth of cards frozen
 * mid-travel with the rest clipped off screen, so roughly half the roster would simply
 * be missing. Wrapping the track and dropping the duplicate copy shows every company
 * once, centred, in the same cards.
 */
@media (prefers-reduced-motion: reduce) {
  .tb-track {
    animation: none;
    flex-wrap: wrap;
    justify-content: center;
    width: auto;
    padding-right: 0;
  }
  .tb-track > .tb-logo[aria-hidden="true"] { display: none; }
  .tb-row {
    padding: 0 1.5rem;
    -webkit-mask-image: none;
    mask-image: none;
  }
}
`;

/*
 * One logo. Renders the remote image and falls back to a plain text wordmark if the
 * request fails, so a renamed or withdrawn file downgrades to a wordmark instead of
 * leaving a hole in the row. Phenom Resources currently 404s upstream, and is exactly
 * what this path is for.
 *
 * Plain <img>, not next/image, and deliberately so. next/image would need the host added
 * to images.remotePatterns, and it would proxy all 27 files through the optimizer on a
 * host we do not control - one that could rate-limit or change a filename at any time.
 * A bare <img> also just fires onError on failure, which is the signal the fallback
 * needs; the optimizer surfaces a remote failure as a server-side error instead.
 *
 * `duplicate` marks the second copy of the list. It is the same pixels as the first, so
 * it is hidden from assistive tech and its alt is emptied - a screen reader reads the 27
 * companies once, not 54 times.
 */
const CompanyLogo: React.FC<{ company: Company; duplicate?: boolean }> = ({
  company,
  duplicate = false,
}) => {
  const [logoAvailable, setLogoAvailable] = useState(true);
  const extent = INK_EXTENT[company.name];

  return (
    <li
      className="tb-logo"
      aria-hidden={duplicate || undefined}
      style={
        extent
          ? ({ "--tb-iw": extent[0], "--tb-ih": extent[1] } as React.CSSProperties)
          : undefined
      }
    >
      {logoAvailable ? (
        <span className="tb-logo__fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={company.logo}
            alt={duplicate ? "" : `${company.name} logo`}
            loading="lazy"
            decoding="async"
            draggable={false}
            // Sent without a Referer so the request matches the one these URLs were
            // verified with. Costs nothing if the host does not hotlink-protect, and is
            // the difference between logos and 27 wordmarks if it ever starts to.
            referrerPolicy="no-referrer"
            onError={() => setLogoAvailable(false)}
          />
        </span>
      ) : (
        <span className="tb-logo__word">{company.name}</span>
      )}
    </li>
  );
};

/**
 * One row. The list is rendered twice into a single track: the first copy is the real
 * content, the second exists only to occupy the space the first one vacates as it
 * travels, which is what makes the loop seamless.
 */
const MarqueeRow: React.FC<{ row: Company[]; reverse?: boolean; label: string }> = ({
  row,
  reverse = false,
  label,
}) => (
  <div className="tb-row">
    <ul
      className={`tb-track${reverse ? " tb-track--reverse" : ""}`}
      aria-label={label}
      style={{ "--tb-count": row.length } as React.CSSProperties}
    >
      {row.map((company) => (
        <CompanyLogo key={company.name} company={company} />
      ))}
      {row.map((company) => (
        <CompanyLogo key={`${company.name}-dup`} company={company} duplicate />
      ))}
    </ul>
  </div>
);

export const TrustedBy: React.FC = () => {
  return (
    <section className="relative py-12 md:py-16 bg-[#F4F4F2] border-b border-[#E5E5E3] overflow-hidden font-sans">
      {/*
        Display heading. One line on desktop, black weight.

        Set as a single run of text rather than two block spans, which is what lets it sit
        on one line where there is room and break between the two words where there is not.
        The 0.14em indent that used to offset COMPANIES went with them: it existed to step
        the second line against the first, and with no second line to step it would just be
        a gap in the middle of a phrase.

        The size is deliberately NOT changed. At the clamp's 4rem ceiling the phrase measures
        roughly 710px against ~1040px of interior once the arrow and its gap are taken out,
        so it already fits with room to spare and there is nothing to buy by reflowing it.
        Below about 640px the clamp floor holds the type at 2.25rem while the container keeps
        narrowing, and the line breaks back to two of its own accord - a wrap, not an overflow.

        justify-start, not justify-between: the arrow belongs to COMPANIES, and pushing it
        to the container's right edge left it stranded in a metre of white on a wide
        screen. It now trails the word by one gap.
      */}
      <SectionReveal className="container-editorial mb-6 md:mb-9">
        {/*
          The bridge line. WHO WE ARE ends on the footage, this says what that footage
          was in aid of, and FEATURED COMPANIES then names the proof — three beats of one
          argument instead of two unrelated blocks.

          Classes are Stats' eyebrow verbatim, not a new style: that is the established
          label treatment for a light section on this page, and reusing it is what keeps
          this a bridge rather than a second heading. It sits in container-editorial
          alongside the h2, so all three lines share one left margin.
        */}
        <motion.p
          variants={itemVariants}
          className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-[#B8860B] md:mb-4"
        >
          Trusted across the global mining industry
        </motion.p>

        <div className="flex items-end justify-start gap-4 sm:gap-6">
          {/*
            motion.h2 and motion.svg, both on the shared itemVariants. Neither carries a
            whileInView of its own - they inherit state and stagger from the SectionReveal
            through framer's context, which passes straight through the plain flex div
            between them. So the heading lands, then the arrow, then the grid runs its own
            existing stagger: one reading order rather than three independent reveals.
          */}
          <motion.h2
            variants={itemVariants}
            className="font-geist text-[clamp(2.25rem,5vw,4rem)] font-black uppercase leading-[0.95] tracking-[-0.035em] text-[#0B1F3A]"
          >
            Featured Companies
          </motion.h2>

          {/*
            Down-left arrow, stroke only. Two paths: the diagonal shaft, and an L for the
            head at its lower-left end.

            The bottom margin is the baseline correction, and it has to be in the HEADING's
            scale, not the arrow's: an em on this element resolves against the inherited
            16px, not against the h2's clamp, so a plain mb-[0.1em] buys 1.6px and the
            arrow sits on the line BOX's floor rather than on the text baseline. Hence a
            clamp built from the same vw curve the heading uses.

            THE NUMBER WAS OVERSHOOTING, which is what made the arrow read as detached.
            The correction has to clear the gap between the line box's floor and the
            baseline (~13px at 1440) but PAY BACK the empty run inside the viewBox below
            the ink — the paths stop at y=38 of 48, so a fifth of the box, ~15px, is
            already blank. The two very nearly cancel, and the old clamp's 19.4px was
            spent on top of that: measured at 1440 the ink finished 17px ABOVE the
            heading's baseline and started 21px above its cap line, so the arrow floated
            clear of the word instead of belonging to it. At ~3px the ink bottom lands on
            the baseline and the ink top lands on the cap line — the arrow occupies
            exactly the heading's optical block and reads as part of the phrase.

            Everything about the arrow ITSELF is untouched: same viewBox, same two paths,
            same 4.25 stroke, same colour, same size clamp. Only where it sits changed.

            Stroke scales with the box (no non-scaling-stroke, deliberately) so the arrow
            keeps its proportions as it grows; 4.25 units holds its weight against a 900.
          */}
          <motion.svg
            variants={itemVariants}
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 48 48"
            fill="none"
            stroke="#0B1F3A"
            strokeWidth="4.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mb-[clamp(0.1rem,0.22vw,0.2rem)] h-[clamp(2rem,4.8vw,4.5rem)] w-auto shrink-0"
          >
            {/* shaft, top-right to bottom-left */}
            <path d="M40 8 10 38" />
            {/* arrowhead */}
            <path d="M10 14.5V38h23.5" />
          </motion.svg>
        </div>
      </SectionReveal>

      {/*
        Full-bleed on purpose, where the grid it replaces sat inside container-editorial:
        a marquee that stops at the gutter reads as a box of moving logos, where one
        running edge to edge reads as a field the page is passing through. The heading
        above keeps its container, so the section still starts on the editorial margin.
      */}
      {/*
        gap on a single-column flex container, so this is the vertical space between the
        two marquee rows and nothing else — there is no second column for it to open up,
        and the horizontal space between cards is --tb-gap inside the track, untouched.

        20/24px read as two rows of one block; 40/48px lets each row be seen as its own
        band. The mobile:desktop ratio is unchanged at 0.83, which keeps the gap the same
        fraction of a card's height at both sizes (0.55 against 72px, 0.53 against 90px).
      */}
      <SectionReveal className="tb-marquee flex flex-col gap-10 md:gap-12">
        <style dangerouslySetInnerHTML={{ __html: MARQUEE_CSS }} />
        <motion.div variants={itemVariants}>
          <MarqueeRow row={ROW_ONE} label="Featured companies, first row" />
        </motion.div>
        <motion.div variants={itemVariants}>
          <MarqueeRow row={ROW_TWO} reverse label="Featured companies, second row" />
        </motion.div>
      </SectionReveal>
      {/*
        Seam into ServicesScrollStory. Every other boundary on this page is one near-white
        into another and needs nothing; this one drops #F4F4F2 straight into #0B1220, and
        a 56px ramp is what stops that reading as a cut line. Decorative and inert, and it
        sits inside this section so the pinned section below never has to know about it.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-b from-[#F4F4F2]/0 via-[#0B1220]/45 to-[#0B1220]"
      />

    </section>
  );
};
