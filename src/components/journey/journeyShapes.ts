/**
 * Procedural silhouettes, generated as SVG path data.
 *
 * Drawn rather than shipped as images, for the same reason the 3D pass
 * generated its textures: these are large, full-bleed shapes, and a set of
 * mountain and skyline plates at the widths a modern display needs would be
 * several hundred kilobytes of WebP that still go soft when stretched. Path
 * data costs a couple of kilobytes, stays crisp at any size, and can be
 * recoloured per depth layer without exporting anything again.
 *
 * Everything is seeded, so the landscape is identical on every load.
 */

/** Deterministic PRNG (mulberry32). */
export function makeRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export interface RidgeOptions {
  width: number;
  height: number;
  /** Height of the tallest peak, as a fraction of `height`. */
  peak: number;
  /** Baseline the ridge sits on, as a fraction of `height`. */
  base: number;
  /** Number of subdivision passes. More = craggier. */
  detail?: number;
  /** How quickly displacement decays per pass. Lower = sharper peaks. */
  roughness?: number;
  seed: number;
}

/**
 * A mountain ridge, by midpoint displacement.
 *
 * Midpoint displacement rather than a sum of sines: sines give rolling dunes
 * that read as decorative, while recursive displacement produces the
 * self-similar, unevenly spaced peaks that actually look like rock. It is also
 * why these will not read as low-poly — the silhouette has detail at several
 * scales at once, which a handful of triangles cannot.
 */
export function ridgePath(options: RidgeOptions): string {
  const { width, height, peak, base, detail = 6, roughness = 0.54, seed } = options;
  const random = makeRandom(seed);

  const baseY = height * base;
  const peakY = height * (base - peak);

  // Start with a coarse skyline, then subdivide.
  let points: number[] = [baseY, peakY + (baseY - peakY) * random() * 0.4, baseY];
  let displacement = (baseY - peakY) * 0.55;

  for (let pass = 0; pass < detail; pass++) {
    const next: number[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      next.push(a, (a + b) / 2 + (random() - 0.5) * 2 * displacement);
    }
    next.push(points[points.length - 1]);
    points = next;
    displacement *= roughness;
  }

  // Clamp into the band, so a run of lucky rolls cannot spike off the plate.
  points = points.map((y) => Math.min(baseY, Math.max(peakY, y)));

  const step = width / (points.length - 1);
  const segments = points.map((y, i) => `${(i * step).toFixed(1)} ${y.toFixed(1)}`);

  // Closed down to the bottom edge, so the shape fills as a silhouette.
  return `M 0 ${height} L ${segments.join(" L ")} L ${width} ${height} Z`;
}

export interface Building {
  x: number;
  width: number;
  height: number;
  /** Window grid, as rows of lit/unlit flags. */
  windows: { x: number; y: number; w: number; h: number; lit: number }[];
  /** 0 = plain block, 1 = stepped crown, 2 = slim tower with a mast. */
  form: number;
}

export interface SkylineOptions {
  width: number;
  /** Tallest building, in the same units as `width`. */
  maxHeight: number;
  count: number;
  seed: number;
}

/**
 * A small business skyline.
 *
 * Deliberately sparse and varied in height — the brief asks for a destination
 * that reads as a modern business district, not a dense metropolis, and a row
 * of similar blocks is exactly what makes generated cities look generated.
 * A few slim towers carry the silhouette; the rest are low-rise.
 */
export function buildSkyline(options: SkylineOptions): Building[] {
  const { width, maxHeight, count, seed } = options;
  const random = makeRandom(seed);
  const buildings: Building[] = [];

  for (let i = 0; i < count; i++) {
    // Stratified across the span, then jittered, so the skyline has rhythm
    // without the buildings landing on a visible grid.
    const slot = (i + 0.5) / count;
    const w = width * (0.028 + random() * 0.05);
    const x = width * (slot - 0.5) + (random() - 0.5) * width * 0.05;

    /*
     * Most buildings low, a few tall. The exponent is what creates a skyline
     * rather than a wall, and it has to be steep: at 2.1 more than half the
     * district came out above 60% of full height, which reads as a solid block
     * of towers. At 4 it is about five in seventeen, with the rest low-rise —
     * a few landmarks carrying the silhouette, which is the brief's "modern
     * business district, not a metropolis".
     */
    const h = maxHeight * (0.14 + Math.pow(random(), 4) * 0.86);
    const form = random() > 0.82 ? 2 : random() > 0.55 ? 1 : 0;

    const windows: Building["windows"] = [];
    const cols = Math.max(2, Math.floor(w / (width * 0.011)));
    const rows = Math.max(3, Math.floor(h / (maxHeight * 0.055)));
    const cellW = w / cols;
    const cellH = h / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Well under half lit. A fully lit tower reads as a lightbox; scattered
        // occupancy is what makes a building look inhabited at dusk.
        const roll = random();
        if (roll > 0.34) continue;
        windows.push({
          x: x + c * cellW + cellW * 0.26,
          y: -h + r * cellH + cellH * 0.24,
          w: cellW * 0.46,
          h: cellH * 0.44,
          lit: 0.45 + random() * 0.55,
        });
      }
    }

    buildings.push({ x, width: w, height: h, windows, form });
  }

  return buildings.sort((a, b) => a.height - b.height);
}

export interface CloudBand {
  d: string;
  opacity: number;
}

/**
 * Soft cloud bands.
 *
 * Long, flat and low-contrast — dusk stratus rather than cumulus. Built from
 * overlapping cubic curves so the edges stay soft; anything with a defined
 * outline reads as a cartoon cloud, which is the wrong register entirely.
 */
export function buildClouds(width: number, height: number, count: number, seed: number): CloudBand[] {
  const random = makeRandom(seed);
  const bands: CloudBand[] = [];

  for (let i = 0; i < count; i++) {
    const y = height * (0.12 + random() * 0.6);
    const w = width * (0.3 + random() * 0.5);
    const x = random() * width - w * 0.2;
    const thickness = height * (0.012 + random() * 0.03);

    // A shallow lens: one curve over, one back, so the band tapers at both ends.
    const d =
      `M ${x.toFixed(1)} ${y.toFixed(1)} ` +
      `C ${(x + w * 0.2).toFixed(1)} ${(y - thickness * 1.6).toFixed(1)}, ` +
      `${(x + w * 0.42).toFixed(1)} ${(y - thickness * 2.1).toFixed(1)}, ` +
      `${(x + w * 0.6).toFixed(1)} ${(y - thickness * 0.9).toFixed(1)} ` +
      `C ${(x + w * 0.76).toFixed(1)} ${(y - thickness * 1.7).toFixed(1)}, ` +
      `${(x + w * 0.92).toFixed(1)} ${(y - thickness * 0.5).toFixed(1)}, ` +
      `${(x + w).toFixed(1)} ${y.toFixed(1)} ` +
      `C ${(x + w * 0.7).toFixed(1)} ${(y + thickness).toFixed(1)}, ` +
      `${(x + w * 0.3).toFixed(1)} ${(y + thickness * 1.1).toFixed(1)}, ` +
      `${x.toFixed(1)} ${y.toFixed(1)} Z`;

    bands.push({ d, opacity: 0.05 + random() * 0.09 });
  }

  return bands;
}
