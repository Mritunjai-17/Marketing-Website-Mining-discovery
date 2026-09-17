import { PAVED_HALF_WIDTH, clamp01, journeyLength, smoothstep } from "./journeyPath";

/**
 * How far the landscape extends either side of the road.
 *
 * Paired with the scene's fog density, the far edge sits at roughly 8% opacity
 * — far enough that the corridor's boundary is never a visible line, close
 * enough that we are not paying for vertices nobody can see.
 */
export const CORRIDOR_HALF_WIDTH = 720;

/** Terrain stays dead flat out to here, so the road always has a clean verge. */
const VERGE = PAVED_HALF_WIDTH + 0.4;

/**
 * Height of the landscape at a point, in world units.
 *
 * Shaped rather than noise-generated, and deliberately so: a noise field gives
 * you hills you cannot control, and this scene needs the ground to be exactly
 * flat at the roadside, to rise into middle-distance hills, and to come back
 * to zero at the corridor edge so the sweep never ends on a visible cliff.
 * Three shaping terms do that, and each one is adjustable on its own.
 *
 * @param t curve parameter, valid outside [0, 1] for the extended corridor
 * @param offset lateral distance from the road centreline, signed
 */
export function terrainHeight(t: number, offset: number): number {
  const a = Math.abs(offset);

  /*
   * The window is the key to the whole shape: a half-sine that is zero at the
   * verge, peaks in the middle distance and returns to zero at the corridor
   * edge. Multiplying every other term by it guarantees both boundaries are
   * flat no matter how the terms are retuned later.
   */
  const f = clamp01((a - VERGE) / (CORRIDOR_HALF_WIDTH - VERGE));
  const window = Math.sin(Math.PI * f);

  // Holds the immediate roadside flatter than the window alone would, so the
  // ground does not start climbing the moment it leaves the shoulder.
  const nearRamp = smoothstep(VERGE, 120, a);

  // Distance in world units, so wavelengths below are metres rather than
  // curve parameter — the hills stay the same size if the route is retimed.
  const s = t * journeyLength;

  /*
   * Broad landform, then two finer passes for relief. The amplitude is up from
   * 34 because the corridor now reaches 720 units: the same height spread over
   * a wider span reads as flatter, and the brief wants distant hills doing real
   * work in the background layer.
   */
  let h = 46 * window * nearRamp;
  h += 9.2 * Math.sin(s * 0.0062 + offset * 0.0031) * window * nearRamp;
  h += 5.1 * Math.sin(s * 0.0131 - offset * 0.0072 + 1.7) * window * nearRamp;
  h += 2.2 * Math.sin(s * 0.0287 + offset * 0.0169 + 4.1) * window * nearRamp;

  /*
   * A drainage swale just beyond the shoulder. Small, but it is what stops the
   * road reading as a decal laid on a field: the ground falls away from the
   * carriageway before it rises, so the road sits *in* the landscape.
   */
  const swale = -1.35 * Math.exp(-Math.pow((a - VERGE - 7) / 6.5, 2));

  return h + swale;
}

/**
 * Deterministic PRNG (mulberry32).
 *
 * Scatter has to be identical on every load. `Math.random` would reshuffle
 * every tree on each navigation, which reads as a scene that cannot make up
 * its mind, and would make any visual regression impossible to judge.
 */
export function makeRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export interface ScatterItem {
  /** Curve parameter where this item sits. */
  t: number;
  /** Signed lateral offset from the centreline. */
  offset: number;
  /** Ground height at that point. */
  y: number;
  /** Per-item size multiplier. */
  scale: number;
  /** Per-item yaw, so instances do not all face the same way. */
  rotation: number;
  /**
   * Per-axis multipliers on top of `scale`.
   *
   * Uniform scaling alone is what makes instanced scatter read as copies: a
   * hundred identical shapes at a hundred sizes are still visibly one shape.
   * Stretching each instance independently breaks the silhouette, which is the
   * cue the eye actually uses to spot repetition.
   */
  stretch: [number, number, number];
  /** Which mesh variant this item belongs to, for mixed-species scatter. */
  variant: number;
  /** 0..1 tonal variation, applied as a per-instance colour. */
  tone: number;
  /** Small lean off vertical, in radians. Nothing in nature is plumb. */
  tilt: number;
}

export interface ScatterOptions {
  count: number;
  seed: number;
  /** Nearest the item may be placed to the road centreline. */
  minOffset: number;
  /** Furthest the item may be placed. */
  maxOffset: number;
  from?: number;
  to?: number;
  minScale?: number;
  maxScale?: number;
  /**
   * Bias toward the road (values > 1) or toward the distance (< 1). Trees look
   * natural clustered away from the carriageway; roadside grass does not.
   */
  offsetBias?: number;
  /** How many mesh variants to distribute items across. */
  variants?: number;
  /** Maximum per-axis stretch away from 1. 0.3 means each axis lands in 0.7..1.3. */
  stretchRange?: number;
  /** Maximum lean off vertical, in radians. */
  maxTilt?: number;
  /**
   * Number of clumps to gather the items into. Zero spreads them evenly.
   *
   * Even spacing is what makes scattered vegetation read as filler: real
   * planting occurs in copses with open ground between them, and the open
   * ground is as much of the effect as the trees. Clustering is also what
   * lets the count come down sharply without the landscape looking bald —
   * a hundred trees in twenty stands cover more convincingly than three
   * hundred spread thin.
   */
  clusters?: number;
  /** Spread of a clump along the route, in curve parameter. */
  clusterSpread?: number;
  /** Spread of a clump across the corridor, in world units. */
  clusterWidth?: number;
}

/**
 * Places items across the corridor, deterministically and off the road.
 *
 * Offsets are drawn from [minOffset, maxOffset] and never below it, which is
 * what keeps vegetation out of the carriageway without needing a collision
 * test against the road geometry.
 */
export function scatter(options: ScatterOptions): ScatterItem[] {
  const {
    count,
    seed,
    minOffset,
    maxOffset,
    from = -0.04,
    to = 1.04,
    minScale = 0.8,
    maxScale = 1.3,
    offsetBias = 1,
    variants = 1,
    stretchRange = 0.28,
    maxTilt = 0,
    clusters = 0,
    clusterSpread = 0.012,
    clusterWidth = 26,
  } = options;

  const random = makeRandom(seed);
  const items: ScatterItem[] = [];

  /*
   * Clump centres, stratified along the route so the stands themselves are
   * spaced out even though the trees within each are not.
   */
  const centres: { t: number; offset: number }[] = [];
  for (let c = 0; c < clusters; c++) {
    const stratum = (c + random()) / clusters;
    const spread = Math.pow(random(), offsetBias);
    centres.push({
      t: from + (to - from) * stratum,
      offset: (minOffset + (maxOffset - minOffset) * spread) * (random() < 0.5 ? -1 : 1),
    });
  }

  for (let i = 0; i < count; i++) {
    let t: number;
    let offset: number;

    if (clusters > 0) {
      const centre = centres[i % clusters];
      t = centre.t + (random() - 0.5) * clusterSpread;
      offset = centre.offset + (random() - 0.5) * clusterWidth;
      /*
       * A clump near the inner edge can scatter an item back toward the
       * carriageway, so the floor is reapplied here. Without it the "nothing
       * on the road" guarantee would hold for the centres but not the members.
       */
      if (Math.abs(offset) < minOffset) {
        offset = (offset < 0 ? -1 : 1) * minOffset;
      }
    } else {
      // Stratified along the route rather than uniform-random: pure random
      // clumps and leaves visible bald stretches, and at these counts a gap
      // reads as a mistake rather than as nature.
      const stratum = (i + random()) / count;
      t = from + (to - from) * stratum;

      const spread = Math.pow(random(), offsetBias);
      offset = (minOffset + (maxOffset - minOffset) * spread) * (random() < 0.5 ? -1 : 1);
    }

    const stretchOf = () => 1 + (random() - 0.5) * 2 * stretchRange;

    items.push({
      t,
      offset,
      y: terrainHeight(t, offset),
      scale: minScale + (maxScale - minScale) * random(),
      rotation: random() * Math.PI * 2,
      stretch: [stretchOf(), stretchOf(), stretchOf()],
      // Cycled rather than drawn at random, so every variant gets an even
      // share however few items there are. Randomising the assignment can
      // leave a variant with a handful of instances purely by chance.
      variant: i % variants,
      tone: random(),
      tilt: maxTilt ? (random() - 0.5) * 2 * maxTilt : 0,
    });
  }

  return items;
}

/** Splits a scatter into one bucket per variant, for separate instanced meshes. */
export function byVariant(items: ScatterItem[], variants: number): ScatterItem[][] {
  const buckets: ScatterItem[][] = Array.from({ length: variants }, () => []);
  for (const item of items) buckets[item.variant % variants].push(item);
  return buckets;
}
