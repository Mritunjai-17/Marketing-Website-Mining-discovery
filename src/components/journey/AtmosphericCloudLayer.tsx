"use client";

import React from "react";

export interface AtmosphericCloudLayerProps {
  /** Master transition progress (0..1) */
  progress: number;
}

function clamp01(x: number) {
  return Math.min(Math.max(x, 0), 1);
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * The cloud deck the camera descends through.
 *
 * WHAT WAS WRONG BEFORE, in two rounds. The first version gave every cloud in
 * the scene one master transform — a single scale and drift on the whole SVG —
 * so there was no parallax at all and the eye saw a flat picture being pushed
 * at it. The second split that into separate decks at separate depths, which
 * fixed the timing but not the look, for three reasons that all have the same
 * root: the decks were still not behaving like volumes.
 *
 *   They all grew from one point. Every deck carried the same
 *   `transformOrigin`, so however different their rates were, they expanded
 *   along the same lines out of the same place — and a set of layers sharing
 *   one focus of expansion is a zoom, not a passage. Each deck now has its own
 *   origin, placed where that deck's mass actually sits, so they open out past
 *   the camera in different directions and the field genuinely comes apart as
 *   it is entered.
 *
 *   They were made of three or four big ellipses. An ellipse has one smooth
 *   silhouette and no internal structure, so at any size it reads as a blob.
 *   A deck is now a cluster of small lobes built around a few mass centres, so
 *   its outline is lumpy and its interior is denser where the lobes pile up —
 *   which is the whole difference between a cloud and a smudge.
 *
 *   Nothing was ever out of focus. Everything in the frame was equally sharp
 *   at every distance, which is the one thing that never happens when
 *   something passes within a few metres of a lens. Each deck now carries a
 *   fixed blur scaled to its depth, so the near ones are soft masses rushing
 *   by and the far one stays crisp. The blur is constant per deck rather than
 *   animated: a filter that does not change is rasterised once and then only
 *   composited, so the softness costs a texture and not a re-render per frame.
 *
 * Depth still drives everything. A near deck rushes (large scale, large drift,
 * heavy blur, short time on screen); a far deck barely moves. Nothing is
 * keyframed by hand — the numbers all come from `z`.
 *
 * The clouds are ABOVE the journey in z-order and the journey is already
 * opaque underneath them, so this does not reveal land by fading into it. It
 * uncovers land that was there the whole time.
 */

/**
 * The window the camera spends inside the weather.
 *
 * Moved later than it was. The brief puts the first cloud at 0.30, after the
 * camera has reached its overhead orientation, and the old 0.18 had the deck
 * arriving while the globe was still being aimed — weather over a planet seen
 * from space, which is a different shot from the one this is.
 */
const ENTER = 0.26;
const EXIT = 0.66;

interface Deck {
  /** Depth. Below 1 is distant, above 1 is close enough to rush past. */
  z: number;
  /** Where in the window this deck passes the camera, 0..1. */
  at: number;
  /** Which gradient it is painted with. */
  fill: string;
  /** Base opacity at its fullest. */
  weight: number;
  /**
   * Where this deck opens out from, in viewBox units.
   *
   * Its own, not the frame's centre. This is the point the camera is heading
   * into as far as this deck is concerned, and having each deck part around a
   * different one is what stops the set reading as a single zoom.
   */
  origin: [number, number];
  /** Fixed softness, in viewBox units. Rises with depth. */
  blur: number;
  /** The masses the deck is built from, in viewBox units. */
  masses: { cx: number; cy: number; rx: number; ry: number; lobes: number; o?: number }[];
}

/*
 * Ordered far to near, and staggered so no two arrive together. The near
 * decks are deliberately given the least time on screen: something a few
 * metres away is past you almost before you see it, and that brevity is most
 * of what sells speed.
 */
const DECKS: Deck[] = [
  {
    z: 0.28,
    at: 0.08,
    fill: "url(#cloudFar)",
    weight: 0.74,
    origin: [560, 300],
    blur: 4,
    masses: [
      { cx: 420, cy: 250, rx: 560, ry: 170, lobes: 9 },
      { cx: 1180, cy: 300, rx: 620, ry: 185, lobes: 9, o: 0.82 },
      { cx: 800, cy: 450, rx: 820, ry: 210, lobes: 10, o: 0.58 },
    ],
  },
  {
    z: 0.5,
    at: 0.3,
    fill: "url(#cloudMid)",
    weight: 0.88,
    origin: [980, 430],
    blur: 7,
    masses: [
      { cx: 300, cy: 420, rx: 460, ry: 290, lobes: 9 },
      { cx: 1300, cy: 455, rx: 500, ry: 305, lobes: 9 },
      { cx: 760, cy: 350, rx: 430, ry: 245, lobes: 8, o: 0.88 },
      { cx: 980, cy: 630, rx: 480, ry: 265, lobes: 8, o: 0.72 },
    ],
  },
  {
    z: 0.95,
    at: 0.54,
    fill: "url(#cloudNear)",
    weight: 0.96,
    origin: [640, 560],
    blur: 13,
    masses: [
      { cx: 520, cy: 520, rx: 550, ry: 350, lobes: 10 },
      { cx: 1140, cy: 395, rx: 520, ry: 335, lobes: 9 },
      { cx: 830, cy: 715, rx: 620, ry: 315, lobes: 9, o: 0.88 },
    ],
  },
  {
    z: 1.65,
    at: 0.76,
    fill: "url(#cloudNear)",
    weight: 0.92,
    origin: [1080, 620],
    blur: 20,
    masses: [
      { cx: 700, cy: 600, rx: 670, ry: 370, lobes: 10 },
      { cx: 280, cy: 300, rx: 500, ry: 285, lobes: 8, o: 0.78 },
      { cx: 1320, cy: 690, rx: 550, ry: 320, lobes: 9, o: 0.78 },
    ],
  },
];

/**
 * A small deterministic generator, so the cloud shapes are built once at
 * module load and are identical on the server and in the browser.
 *
 * Randomness here is a drafting tool rather than a runtime effect: scattering
 * forty lobes by hand would be forty numbers to maintain and would still come
 * out more regular than this does, because a person placing points spaces them
 * more evenly than chance ever does — and that regularity is visible.
 */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Lobe {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rot: number;
  o: number;
}

/**
 * Breaks each mass into overlapping lobes.
 *
 * They are laid around the mass's own ellipse rather than scattered inside a
 * box: a cumulus is a rim of billows around a body, densest where the billows
 * overlap and ragged where they run out, and placing them on the rim is what
 * gives the silhouette its lumps while the body stays solid. Each lobe gets
 * its own rotation, so no two share an axis and the outline never resolves
 * into a row of circles.
 */
const LOBES: Lobe[][] = DECKS.map((deck, deckIndex) => {
  const rand = mulberry32(0x9e37 + deckIndex * 7919);
  const out: Lobe[] = [];

  for (const mass of deck.masses) {
    // The body, holding the middle so the rim has something to build on.
    out.push({
      cx: mass.cx,
      cy: mass.cy,
      rx: mass.rx * 0.62,
      ry: mass.ry * 0.7,
      rot: rand() * 40 - 20,
      o: (mass.o ?? 1) * 0.9,
    });

    for (let i = 0; i < mass.lobes; i++) {
      // Spread around the rim with a jitter, never at an exact even step.
      const angle = ((i + rand() * 0.72) / mass.lobes) * Math.PI * 2;
      const reach = 0.5 + rand() * 0.42;
      const size = 0.3 + rand() * 0.3;
      out.push({
        cx: mass.cx + Math.cos(angle) * mass.rx * reach,
        // Flattened vertically, because a deck of cloud is wider than it is
        // deep and lobes stacked as high as they are wide read as foam.
        cy: mass.cy + Math.sin(angle) * mass.ry * reach * 0.82,
        rx: mass.rx * size,
        ry: mass.ry * size * (0.72 + rand() * 0.4),
        rot: rand() * 70 - 35,
        o: (mass.o ?? 1) * (0.52 + rand() * 0.42),
      });
    }
  }

  return out;
});

/**
 * Where one deck is relative to the camera.
 *
 * `local` runs negative while the deck is still below, zero as the camera
 * reaches it, positive once it is behind. Everything else follows from that
 * and from depth, so a deck's behaviour is described entirely by where it sits
 * rather than by a timeline of its own.
 */
function deckState(p: number, deck: Deck) {
  const span = EXIT - ENTER;
  // How long this deck is in play. Near decks get through it quicker.
  const dwell = 0.42 / (0.6 + deck.z);
  const centre = ENTER + deck.at * span;
  const local = (p - centre) / (dwell * span);

  // Approaching, then past. Opacity peaks a little before the camera arrives:
  // a cloud is densest just as you enter it and thins as you come out the
  // other side into the gap below.
  const arrive = smoothstep(-1.6, -0.15, local);
  const depart = smoothstep(0.1, 1.05, local);
  const opacity = arrive * (1 - depart) * deck.weight;

  // Scale runs away with depth: the near decks blow past the frame edges,
  // the far one hardly changes size at all.
  const push = clamp01((local + 1.6) / 2.65);
  const scale = 1 + push * push * (0.35 + deck.z * 2.4);

  // And they fall past the camera, because the camera is descending.
  const y = push * push * (60 + deck.z * 520);

  // A slow lateral slide, opposed between decks, so the field is never static
  // while it waits. Small — this is drift, not wind.
  const x = Math.sin(deck.at * 12.9) * push * 90 * deck.z;

  /*
   * A slow turn as it goes by. Barely more than a degree or two at the far
   * decks and a handful at the near ones, which is all it takes: a mass that
   * grows without ever rotating is unmistakably a picture being scaled, and
   * the eye catches that long before it can say why.
   */
  const rot = Math.sin(deck.at * 7.3) * push * 5.5 * deck.z;

  return { opacity, scale, x, y, rot };
}

export const AtmosphericCloudLayer: React.FC<AtmosphericCloudLayerProps> = ({ progress: p }) => {
  if (p < ENTER - 0.04 || p > EXIT + 0.02) return null;

  const states = DECKS.map((d) => deckState(p, d));
  const anyVisible = states.some((s) => s.opacity > 0.004);

  /*
   * The interior of the deck, where the decks overlap deepest.
   *
   * The brief asks the cloud to briefly dominate the viewport, and stacked
   * gradients alone never quite do: each one falls to nothing at its own rim,
   * so there are always gaps between the lobes for the ground to read through.
   * This closes them for about a fifth of the transition.
   *
   * IT IS NOT THE WHITE FLASH THAT WAS REMOVED, and the difference is not one
   * of degree. That was #ffffff at 0.98 — opaque, and a colour the site does
   * not otherwise contain, so for a stretch of the descent the navy and gold
   * simply stopped existing. This is a cool blue-grey at luma 104 against the
   * night sky's 51, peaking at just over half opacity: the ground is dimmed
   * and flattened the way it is inside real weather, the palette never leaves
   * the night, and there is no frame in which the scene underneath cannot be
   * made out at all.
   */
  const interior = smoothstep(0.34, 0.47, p) * (1 - smoothstep(0.5, 0.63, p)) * 0.54;

  if (!anyVisible && interior <= 0.004) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-25 overflow-hidden"
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/*
           * Soft edges come from the gradients running out to zero opacity and
           * from a fixed per-deck blur, not from a filter that changes every
           * frame. An earlier version displaced every deck through fractal
           * noise on every frame, which is a full re-raster of a full-screen
           * group per frame for an edge wobble that reads as neither cloud nor
           * motion.
           *
           * COOL BLUE-GREY, AND NOWHERE NEAR WHITE.
           *
           * The brightest value here is luma 144 against a night sky at 51 and
           * pure white at 255: clearly cloud, clearly lit, and clearly still
           * in the same night as everything around it.
           */}
          <radialGradient id="cloudFar" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#6d819b" stopOpacity="0.46" />
            <stop offset="45%" stopColor="#4c5d79" stopOpacity="0.32" />
            <stop offset="78%" stopColor="#2c3a55" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#16203a" stopOpacity="0" />
          </radialGradient>

          {/* Lit from above, shadowed underneath — the one cue that makes a
              blob read as a cloud with mass rather than as a smudge. */}
          <radialGradient id="cloudMid" cx="46%" cy="34%" r="62%">
            <stop offset="0%" stopColor="#7e93ad" stopOpacity="0.58" />
            <stop offset="32%" stopColor="#627695" stopOpacity="0.48" />
            <stop offset="62%" stopColor="#415274" stopOpacity="0.33" />
            <stop offset="86%" stopColor="#24314c" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#141d33" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="cloudNear" cx="44%" cy="30%" r="66%">
            <stop offset="0%" stopColor="#8ea3bd" stopOpacity="0.62" />
            <stop offset="30%" stopColor="#6b7f9d" stopOpacity="0.52" />
            <stop offset="60%" stopColor="#465877" stopOpacity="0.35" />
            <stop offset="85%" stopColor="#222f49" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#121a2e" stopOpacity="0" />
          </radialGradient>

          {/* The deck's interior. Darker underneath than above, because the
              light is coming from over the top of the weather. */}
          <linearGradient id="cloudInterior" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#71849f" />
            <stop offset="46%" stopColor="#5c6e8c" />
            <stop offset="100%" stopColor="#3b4a67" />
          </linearGradient>

          {/* The warm note, kept restrained: a low sun under the deck, not a
              sunset. It sits below the clouds because that is where the light
              is coming from at this hour. */}
          <linearGradient id="cloudWarm" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#c8922f" stopOpacity="0.3" />
            <stop offset="28%" stopColor="#d9ae54" stopOpacity="0.17" />
            <stop offset="62%" stopColor="#e8eef6" stopOpacity="0.06" />
            {/* In-palette rather than white, even though it is fully
                transparent: SVG interpolates colour and opacity as separate
                channels, so a white stop drags everything approaching it
                toward white regardless of its alpha. */}
            <stop offset="100%" stopColor="#8fa2bb" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Under the decks, so the lobes still model against it rather than
            being flattened out by it. */}
        {interior > 0.004 && (
          <rect
            x="0"
            y="0"
            width="1600"
            height="900"
            fill="url(#cloudInterior)"
            opacity={interior.toFixed(3)}
          />
        )}

        {DECKS.map((deck, i) => {
          const s = states[i];
          if (s.opacity <= 0.004) return null;
          return (
            <g
              key={i}
              opacity={s.opacity.toFixed(3)}
              style={{
                transform:
                  `translate3d(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px, 0) ` +
                  `rotate(${s.rot.toFixed(2)}deg) scale(${s.scale.toFixed(3)})`,
                // Its own, so the decks come apart in different directions.
                transformOrigin: `${deck.origin[0]}px ${deck.origin[1]}px`,
                // Constant, so the browser rasterises the softened deck once
                // and spends the rest of the descent only compositing it.
                filter: `blur(${deck.blur}px)`,
                willChange: "transform, opacity",
              }}
            >
              {LOBES[i].map((lobe, j) => (
                <ellipse
                  key={j}
                  cx={lobe.cx}
                  cy={lobe.cy}
                  rx={lobe.rx}
                  ry={lobe.ry}
                  fill={deck.fill}
                  opacity={lobe.o}
                  transform={`rotate(${lobe.rot.toFixed(1)} ${lobe.cx.toFixed(1)} ${lobe.cy.toFixed(1)})`}
                />
              ))}
            </g>
          );
        })}

        {/* Warm scatter rides on top of the whole field, fading as the camera
            drops below the deck into the dusk the Journey is lit by. */}
        <rect
          x="0"
          y="0"
          width="1600"
          height="900"
          fill="url(#cloudWarm)"
          opacity={(1 - smoothstep(0.46, 0.63, p)).toFixed(3)}
        />
      </svg>
    </div>
  );
};

export default AtmosphericCloudLayer;
