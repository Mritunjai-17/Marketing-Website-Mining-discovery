import React from "react";

/**
 * The gold brushstroke under the headline's last word.
 *
 * Decorative only — aria-hidden and pointer-events-none. It is absolutely positioned
 * against a `relative inline-block` wrapper around the WORD, never against the line or
 * the h1, which is what makes it follow the word at any viewport: whatever width the
 * word resolves to at the headline's clamp, the stroke is 100% of that width.
 *
 * THREE NUMBERS THAT ARE DERIVED, NOT DIALLED IN:
 *
 * 1. GAP. The brief asks for 4-8px below the BASELINE, but CSS can only position against
 *    the line box, whose bottom sits a little lower. Playfair Display is 1000 upem with
 *    ascent 1082 / descent 251, so its content area is 1.333em; at leading-[0.92] the
 *    half-leading is (0.92 - 1.333) / 2 = -0.2065em and the baseline lands 0.8755em down.
 *    That leaves 0.0445em of the line box below the baseline — 1.78px at the clamp's
 *    40px floor, 3.20px at its 72px ceiling. GAP is what closes the difference: at 2.6px
 *    the stroke starts 4.38px under the baseline on a phone and 5.80px on a wide screen,
 *    inside 4-8px across the whole clamp without a media query.
 *
 *    BOTH NUMBERS MOVED WITH THE HEADLINE. Tightening the leading from 0.96 to 0.92 takes
 *    a third of that dead space away, and the smaller clamp shrinks what is left again;
 *    at the old GAP of 1.5px the stroke had crept to 3.28px on a phone, under the band.
 *    If the headline is rescaled again, this constant has to be re-derived with it.
 *
 * 2. HEIGHT is the path's exact bounding box, and the path is normalised so its top edge
 *    is y=0. That is what lets GAP be read straight off the CSS: with the svg's height in
 *    px equal to the viewBox's height in user units, y maps 1:1 to px, so "top: 100% +
 *    2.6px" really does put the ink 2.6px below the line box rather than 2.6px plus
 *    whatever slack a padded viewBox would have added.
 *
 * 3. The path itself is a FILLED tapered shape, not a stroked line, because a stroke has
 *    one width everywhere and the brief asks for a stroke that is thicker in the middle
 *    and tapers at the ends. Top and bottom edges are one cubic each: the centreline is a
 *    shallow S and the half-thickness is the quadratic bump 4u(1-u), which stays exactly
 *    cubic when added to a cubic, so no polyline fitting is involved. The result runs
 *    1.8px at the ends to 5.0px at its widest, over 4.8px of centreline wave.
 *
 * preserveAspectRatio="none" is deliberate: x stretches to the word, y does not scale, so
 * a long word gives a longer stroke of the same thickness rather than a fatter one.
 */

/** Path bounding box, in user units == px. Normalised so the ink starts at y=0. */
const HEIGHT = 6.6;

/** Px between the line box's bottom edge and the top of the ink. See note 1. */
const GAP = 2.6;

/** The brand gold, matching the eyebrow and the primary CTA. */
const GOLD = "#D4AF37";

const PATH =
  "M2 4.8C30 -2.433 66 2.467 98 0L98 1.8C66 8.533 30 3.633 2 6.6Z";

export const HeadlineUnderline: React.FC = () => (
  <span
    aria-hidden="true"
    className="pointer-events-none absolute inset-x-0 block"
    style={{ top: `calc(100% + ${GAP}px)` }}
  >
    <svg
      viewBox={`0 0 100 ${HEIGHT}`}
      preserveAspectRatio="none"
      focusable="false"
      className="block w-full"
      style={{ height: `${HEIGHT}px` }}
    >
      <path d={PATH} fill={GOLD} />
    </svg>
  </span>
);

export default HeadlineUnderline;
