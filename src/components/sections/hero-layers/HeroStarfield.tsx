"use client";

import React, { useEffect, useRef } from "react";

import styles from "./HeroStarfield.module.css";

/**
 * The homepage hero's atmosphere: stars over the navy, two soft corner glows, a slow
 * twinkle on a subset, and a few pixels of mouse parallax.
 *
 * SIX THINGS THIS FILE HAS TO GET RIGHT:
 *
 * 1. DETERMINISM. Positions look random but are generated at module load from fixed
 *    seeds, so the server render and the client render agree and React never reports a
 *    hydration mismatch. `Math.random()` here would flash a different sky on hydration.
 *
 * 2. STARS WHERE THEY CAN ACTUALLY BE SEEN. Easy to get wrong and impossible to spot in
 *    the markup. Scattering N stars uniformly over each surface renders N and shows a
 *    fraction: the planet's silhouette is larger than the viewport and swallows most of
 *    the card, and the opaque card in turn covers the lower half of the copy band. An
 *    earlier revision put 160 stars in the DOM and left roughly thirty visible. Both
 *    zones sample only from navy the viewer can actually see — see `reject`.
 *
 * 3. NO CLIPPED BOXES. The glows are gradients whose last stop is fully transparent, on
 *    a full-size layer. They were once solid blobs behind `filter: blur()`, one of them
 *    seated above the card's top edge, and the card's overflow-hidden sliced the blur
 *    into a hard-edged rectangle. Nothing here may have an edge that a clip can find.
 *
 * 4. PARALLAX WITHOUT RE-RENDERS. Two hundred spans must not re-render on pointermove.
 *    The transform is written straight to the DOM node from a rAF-throttled listener,
 *    and the easing is a CSS transition, so React is not in the loop at all.
 *
 * 5. TEXT CONTRAST. The copy band dims rather than clears behind the headline: a 1-3px
 *    dot at a fraction of an alpha costs a large white glyph nothing, and clearing the
 *    block outright is what emptied the copy band in an earlier pass.
 *
 * 6. CONTAINMENT. Twinkle and parallax easing live in a CSS Module, so their class and
 *    keyframe names are hashed and cannot leak. No global stylesheet is touched.
 *
 * The layer is inert throughout — aria-hidden, and pointer-events-none on the wrapper,
 * which covers every descendant — so it never intercepts a click meant for the globe,
 * the nav or a CTA. The parallax listens on the window instead.
 */

/**
 * Which of the hero's two navy surfaces this instance is painting.
 *
 * "copy"  — the band behind the headline and body copy, pinned to the first viewport.
 *           Only its upper part is ever on screen; the pinned card covers the rest.
 *
 * "stage" — inside the pinned card, behind the globe. This is where the glows live,
 *           because it is the only surface whose corners are not occupied by text.
 */
export type StarfieldZone = "copy" | "stage";

export interface HeroStarfieldProps {
  zone: StarfieldZone;
}

/** Mostly-white tones. Three of them, so the field has depth rather than one flat value. */
const WHITE_TONES = ["#E8E8E8", "#F2F2F2", "#FFFFFF"];
/** The brand gold, for the minority accent stars. */
const STAR_GOLD = "#D4AF37";

/** Share of stars that twinkle. Roughly a ninth, spread across both zones. */
const TWINKLE_SHARE = 0.12;

/** Maximum parallax offset in px. "A few pixels", per the brief — this is the whole range. */
const PARALLAX_PX = 4;

/**
 * Share of stars promoted to "hero" stars - larger, brighter, and carrying a bloom.
 *
 * Selected on a SEPARATE prng stream from the one that places the stars, which is the
 * whole reason elevateHeroStars is a second pass rather than a branch inside
 * buildStars. The position stream is a single sequence: one extra rand() call inside
 * that loop shifts every draw after it and silently re-randomises the entire field.
 * Running the selection afterwards, off its own seed, cannot disturb it.
 */
const HERO_SHARE = 0.075;

/** Blur applied to the nebula layer, inside the brief's 60-100px. */
const NEBULA_BLUR = 80;

/**
 * How far the nebula layer oversizes its container, in px.
 *
 * Load-bearing, not padding. A blur samples past the element's edges, so blurring a
 * layer that ends exactly on the container bounds leaves a soft-but-real edge for the
 * card's overflow-hidden to cut - which is precisely the hard-edged rectangle bug from
 * earlier. Oversizing by more than the blur radius puts every artefact outside the
 * visible area, where the clip removes it harmlessly.
 */
const NEBULA_BLEED = 120;

/**
 * The planet's silhouette in the card's own coordinate space, as percentages.
 *
 * Derived from measure(), not dialled in: at the 1440x900 reference it solves the
 * sphere to 1594px in a 1771px box seated at -40px, which puts the centre at 94% of the
 * card's height with a radius of 55% of its width and 89% of its height. The radii here
 * are a couple of points wider so stars clear the limb instead of crowding it.
 *
 * The horizon framing guarantees diameter > height at every breakpoint, so the planet
 * always crowns near the top and always fills the bottom. The shape drifts a little with
 * aspect ratio; for a decorative layer, being a few percent out at the edges costs
 * nothing, which is why this is a constant rather than a measurement.
 */
const PLANET = { cx: 50, cy: 94, rx: 58, ry: 91 };

/**
 * How far down the copy band the pinned card's top edge sits, as a percentage.
 *
 * Anything below this is behind an opaque element and would never be seen. The real
 * edge moves with the copy's own height (roughly 55-65% across breakpoints); 60 is the
 * middle of that range and erring low only wastes a star or two at the boundary.
 */
const COPY_FLOOR = 60;

interface Star {
  /** Horizontal position, as a percentage of the surface's width. */
  x: number;
  /** Vertical position, as a percentage of the surface's height. */
  y: number;
  /** Diameter in CSS pixels. */
  size: number;
  opacity: number;
  color: string;
  /** Seconds for a full fade-down-and-back cycle, or 0 for a fixed star. */
  twinkleDuration: number;
  /** Seconds of offset, so the twinkling stars never pulse in step. */
  twinkleDelay: number;
  /** Promoted to a foreground star: larger, brighter, and rendered with a bloom. */
  hero: boolean;
}

interface ZoneConfig {
  seed: number;
  /** Total stars on this surface. */
  count: number;
  /** How many of `count` are gold rather than white. */
  goldCount: number;
  /** Rejects a candidate position that would land somewhere the viewer cannot see. */
  reject: (x: number, y: number) => boolean;
  /** Soft mask over the text block, or null where nothing needs protecting. */
  mask: string | null;
  /**
   * The corner glows, as one stacked-radial-gradient background on a full-size layer.
   *
   * Every stop chain ends fully transparent, so there is no edge for the card's
   * overflow-hidden to cut. This layer is deliberately NOT parallaxed: it is the only
   * thing here carrying colour across an area, and holding it still removes any chance
   * of the seam bug returning by way of a shifted gradient.
   */
  glow: string | null;
  /**
   * Wispy cloud patches, behind the stars. Stacked radial gradients, every chain ending
   * fully transparent, drawn on a layer that oversizes its container by NEBULA_BLEED so
   * the blur has somewhere to fall off outside the clip.
   */
  nebula: string | null;
}

/*
 * Counts are apportioned by visible area, not by eye. The stage's accepted region — the
 * navy outside the planet — is only 15.8% of its surface, against 60.3% for the copy
 * band, so equal counts would leave the stage four times denser. These give the stage
 * about 1.6x the copy band's per-area density, which is the "concentrate around the
 * globe" the brief asks for without tipping into a cluster.
 */
const ZONES: Record<StarfieldZone, ZoneConfig> = {
  copy: {
    seed: 0x5eed_1a7f,
    count: 141,
    goldCount: 12,
    // Only the strip above the card is ever on screen.
    reject: (_x, y) => y > COPY_FLOOR,
    /*
     * Dims the centred copy block to about a third rather than clearing it, which keeps
     * the density behind the headline visibly sparse while leaving the band's corners
     * their full complement. Full ink again by 88%.
     */
    mask:
      "radial-gradient(ellipse 50% 40% at 50% 32%, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.35) 45%, #000 88%)",
    glow: null,
    /*
     * Four patches, all clear of the centred copy column. The headline runs to roughly
     * x 13-87% across y 10-58%, so these sit hard left, hard right, in the thin band
     * above the eyebrow, and low-centre — and the zone mask above dims whatever edge
     * does creep inward to about a third.
     *
     * Sized against a numeric sweep of the stacked alphas, not by eye: over the band
     * above COPY_FLOOR these carry >=2% alpha on 36% of the surface, mid-way through the
     * brief's 30-40%, peaking at 13.8% (brief: 8-15%). Left and right sit roughly half
     * off-canvas by design, which is what makes them read as wisps running off the edge
     * rather than as blobs. Peak inside the headline column is 9.6% BEFORE the zone mask
     * above takes it to about a third of that, so the copy's contrast is untouched.
     */
    nebula: [
      "radial-gradient(41% 32% at 2% 25%, rgba(58,74,107,0.14) 0%, rgba(58,74,107,0.07) 44%, rgba(58,74,107,0) 74%),",
      "radial-gradient(37% 29% at 99% 41%, rgba(58,74,107,0.13) 0%, rgba(58,74,107,0.06) 45%, rgba(58,74,107,0) 74%),",
      "radial-gradient(56% 12% at 50% 1%, rgba(58,74,107,0.11) 0%, rgba(58,74,107,0.04) 46%, rgba(58,74,107,0) 76%),",
      "radial-gradient(42% 23% at 44% 79%, rgba(58,74,107,0.10) 0%, rgba(58,74,107,0.04) 48%, rgba(58,74,107,0) 76%)",
    ].join(" "),
  },
  stage: {
    // A different seed from "copy" so the two surfaces are not the same sky twice.
    seed: 0x51a6_e0d1,
    count: 59,
    goldCount: 5,
    // Anything inside the planet is invisible. What survives is the band above the
    // crown and the two wedges of navy either side of it.
    reject: (x, y) =>
      ((x - PLANET.cx) / PLANET.rx) ** 2 + ((y - PLANET.cy) / PLANET.ry) ** 2 <= 1,
    mask: null,
    /*
     * Both glows sit in the wedges of navy that stay visible either side of the planet,
     * and both reach zero well before the card's top edge:
     *
     *   blue-violet  centre (8%, 36%), vertical reach 0.72 x 40% = +/-28.8%
     *                -> spans y 7.2% .. 64.8%, fully transparent at both ends
     *   gold         centre (88%, 34%), vertical reach 0.70 x 34% = +/-23.8%
     *                -> spans y 10.2% .. 57.8%, fully transparent at both ends
     */
    glow: [
      "radial-gradient(58% 40% at 8% 36%,",
      "rgba(43,58,143,0.22) 0%,",
      "rgba(43,58,143,0.13) 34%,",
      "rgba(43,58,143,0.05) 55%,",
      "rgba(43,58,143,0) 72%),",
      "radial-gradient(46% 34% at 88% 34%,",
      "rgba(212,175,55,0.13) 0%,",
      "rgba(212,175,55,0.07) 36%,",
      "rgba(212,175,55,0) 70%)",
    ].join(" "),
    /*
     * Two patches in the wedges of navy either side of the planet, plus a low band above
     * its crown. No text on this surface, so the only constraint is staying where the
     * sphere is not — but that navy is a thin sliver, so these are much smaller than the
     * copy band's. The limb is already inside x 9-91% by y 30%, and patches sized like
     * the copy band's covered 96% of the visible navy, which reads as a flat tint rather
     * than as cloud. Anchored on the very edges and pulled in to 33% coverage instead.
     */
    nebula: [
      "radial-gradient(24% 20% at 0% 30%, rgba(58,74,107,0.15) 0%, rgba(58,74,107,0.07) 44%, rgba(58,74,107,0) 70%),",
      "radial-gradient(21% 17% at 100% 18%, rgba(58,74,107,0.13) 0%, rgba(58,74,107,0.06) 45%, rgba(58,74,107,0) 70%),",
      "radial-gradient(36% 7% at 50% 0%, rgba(58,74,107,0.11) 0%, rgba(58,74,107,0.04) 46%, rgba(58,74,107,0) 72%)",
    ].join(" "),
  },
};

/** mulberry32 — small, fast, and stable across runtimes, which is the point. */
function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildStars(config: ZoneConfig): Star[] {
  const rand = seededRandom(config.seed);
  const stars: Star[] = [];

  // Rejection sampling. The bound is a safety net, not an expected path: the stage's
  // accepted region is the tightest at about a sixth of the surface, so a draw succeeds
  // within a handful of tries.
  let guard = config.count * 400;

  while (stars.length < config.count && guard > 0) {
    guard -= 1;
    const x = rand() * 100;
    const y = rand() * 100;
    if (config.reject(x, y)) continue;

    // The gold accents are taken from the tail of the run rather than a separate pass,
    // so they are scattered among the white rather than laid over them as a set.
    const gold = stars.length >= config.count - config.goldCount;
    const twinkles = rand() < TWINKLE_SHARE;

    stars.push({
      x,
      y,
      // 1-3px and 20-60% for the white, a tighter 20-30% for the gold. Both axes are
      // rolled independently, so size and brightness do not correlate and the field
      // reads as depth rather than as one flat scatter.
      size: 1 + rand() * 2,
      opacity: gold ? 0.2 + rand() * 0.1 : 0.2 + rand() * 0.4,
      color: gold ? STAR_GOLD : WHITE_TONES[Math.floor(rand() * WHITE_TONES.length)],
      // 4-8s, the slow end of "alive" — fast enough to notice if you look, slow enough
      // that it never pulls the eye off the copy.
      twinkleDuration: twinkles ? 4 + rand() * 4 : 0,
      twinkleDelay: twinkles ? rand() * 8 : 0,
      // Set by elevateHeroStars, on its own stream. Never decided here.
      hero: false,
    });
  }

  return stars;
}

/**
 * Promotes a sparse subset to foreground stars.
 *
 * Runs after the field is placed and takes its own prng, so positions, colours, twinkle
 * timings and the total count all survive untouched - only size and opacity move, and
 * only on the stars it picks.
 *
 * Gold stars are deliberately never promoted. The brief puts hero stars at 70-90% alpha
 * while the gold accents are held to 20-30% precisely so they read as a tint rather than
 * a second colour; a gold star at 90% would be the brightest thing on the hero.
 */
function elevateHeroStars(stars: Star[], seed: number): Star[] {
  const rand = seededRandom(seed);

  // An exact count, not a per-star coin flip. A flip at this share lands anywhere from
  // 3% to 11% on a field this size, and the brief asks for 5-10% - so the count is
  // computed and then that many are drawn, which cannot fall outside the band.
  const eligible: number[] = [];
  for (let i = 0; i < stars.length; i += 1) {
    if (stars[i].color !== STAR_GOLD) eligible.push(i);
  }
  const target = Math.round(stars.length * HERO_SHARE);

  // Partial Fisher-Yates: shuffle only as far as we need to draw.
  const picked = new Set<number>();
  for (let i = 0; i < target && i < eligible.length; i += 1) {
    const j = i + Math.floor(rand() * (eligible.length - i));
    const tmp = eligible[i];
    eligible[i] = eligible[j];
    eligible[j] = tmp;
    picked.add(eligible[i]);
  }

  return stars.map((star, i) => {
    if (!picked.has(i)) return star;
    return {
      ...star,
      hero: true,
      // 3-4px and 70-90% alpha, per the brief.
      size: 3 + rand(),
      opacity: 0.7 + rand() * 0.2,
    };
  });
}

/** Both skies are built once, at module load, and reused by every render. */
const STARS: Record<StarfieldZone, Star[]> = {
  copy: elevateHeroStars(buildStars(ZONES.copy), 0xbea1_7a5c),
  stage: elevateHeroStars(buildStars(ZONES.stage), 0x3c0f_11d2),
};

export const HeroStarfield: React.FC<HeroStarfieldProps> = ({ zone }) => {
  const config = ZONES[zone];
  const stars = STARS[zone];
  const driftRef = useRef<HTMLDivElement>(null);

  /*
   * Mouse parallax.
   *
   * The transform is written straight to the node — no state, no re-render. With two
   * hundred spans under it, routing pointermove through React would rebuild the whole
   * subtree on every frame of a mouse sweep.
   *
   * Normalised against the viewport rather than the layer's own rect: the card this sits
   * in is position:sticky, so its rect moves under scroll and reading it per-move would
   * both cost a layout flush and make the parallax centre drift as the page scrolls.
   *
   * The easing is the CSS transition on the class, not a lerp loop here; each move sets a
   * new target and the transition carries it there, which is smooth and costs no frames
   * when the mouse is still.
   */
  useEffect(() => {
    const node = driftRef.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;

    const onMove = (event: PointerEvent) => {
      const { clientX, clientY } = event;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        // -1..1 across the viewport, negated so the field drifts against the cursor.
        const nx = (clientX / window.innerWidth) * 2 - 1;
        const ny = (clientY / window.innerHeight) * 2 - 1;
        node.style.transform = `translate3d(${(-nx * PARALLAX_PX).toFixed(2)}px, ${(
          -ny * PARALLAX_PX
        ).toFixed(2)}px, 0)`;
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={
        config.mask
          ? { maskImage: config.mask, WebkitMaskImage: config.mask }
          : undefined
      }
    >
      {/*
        Nebula, the lowest thing here. Oversized by NEBULA_BLEED on every side so the
        blur falls off outside the container and the clip can never find an edge to cut.
      */}
      {config.nebula && (
        <div
          className="absolute"
          style={{
            top: -NEBULA_BLEED,
            right: -NEBULA_BLEED,
            bottom: -NEBULA_BLEED,
            left: -NEBULA_BLEED,
            background: config.nebula,
            filter: `blur(${NEBULA_BLUR}px)`,
          }}
        />
      )}

      {/* Corner glows. Full-size, transparent-terminated, and deliberately not drifted. */}
      {config.glow && (
        <div className="absolute inset-0" style={{ background: config.glow }} />
      )}

      {/* Only the stars parallax. They are dots on a transparent ground, so shifting
          them a few px can never expose an edge for the clip to turn into a seam. */}
      <div ref={driftRef} className={`absolute inset-0 ${styles.drift}`}>
        {stars.map((star, i) => (
          <span
            key={i}
            className={`absolute rounded-full ${star.twinkleDuration ? styles.twinkle : ""}`}
            style={
              {
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                backgroundColor: star.color,
                opacity: star.opacity,
                // Bloom, on hero stars only. Two stops - a tight core halo and a wider,
                // fainter one - which reads as an optical glow where a single large
                // shadow reads as a smudge. Sized off the star so it scales with it.
                ...(star.hero
                  ? {
                      boxShadow: `0 0 ${(star.size * 1.15).toFixed(1)}px ${(
                        star.size * 0.3
                      ).toFixed(1)}px ${star.color}66, 0 0 ${(star.size * 2.6).toFixed(
                        1
                      )}px ${star.color}2E`,
                    }
                  : null),
                // Read by the keyframes so each star pulses around its own brightness.
                "--star-opacity": star.opacity,
                ...(star.twinkleDuration
                  ? {
                      animationDuration: `${star.twinkleDuration.toFixed(2)}s`,
                      animationDelay: `${star.twinkleDelay.toFixed(2)}s`,
                    }
                  : null),
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
};

export default HeroStarfield;
