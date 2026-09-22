/**
 * The truck artwork configuration.
 *
 * `TRUCK_ASSET` is null until a rendered truck image is supplied, and the
 * journey draws its built-in vector truck instead. Point it at a file and the
 * vector is replaced with no other code change — everything that moves the
 * truck (position, scale, suspension, shadow, road reflection, headlight wash,
 * rear-lamp glow) is a separate layer and keeps working either way.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * SPEC FOR THE IMAGE
 * ────────────────────────────────────────────────────────────────────────────
 *
 * VIEW         Left-to-right side profile, truck facing RIGHT. Camera at
 *              roughly the truck's own eye level. A slight three-quarter is
 *              fine so long as it still reads as a side elevation — the scene
 *              is a side view, and a strong three-quarter will not sit on the
 *              road plane convincingly.
 *
 * BACKGROUND   Fully transparent. PNG-24 with alpha, or WebP with alpha.
 *              No baked shadow, no ground plane, no contact shading — the
 *              scene draws its own shadow and reflection beneath the truck,
 *              and a baked one will double up and look wrong.
 *
 * TRIM         Crop tight to the truck's own bounding box, including mirrors
 *              and exhaust stack. Then set `aspect` to the trimmed image's
 *              width ÷ height, and `contact` to where the tyres touch, as a
 *              fraction of image height from the top (1 = tyres on the very
 *              bottom edge — which is what a tight trim usually gives).
 *
 * RESOLUTION   The truck renders at 14 / 93 of stage width. On a 2560px
 *              display at 2× that is about 770px, so **1600px wide is ample
 *              and 2048px is generous**. Anything beyond that is wasted
 *              bytes on a marketing page.
 *
 * COLOUR       Neutral silver / graphite / dark metallic. Not bright white —
 *              the scene's dusk key light already lifts the body, and a white
 *              truck blows out against the navy.
 *
 * BRANDING     Leave the trailer flank clean. The Mining Discovery mark is
 *              drawn in code over the area `brandPlate` describes, so it stays
 *              crisp at every size and can change without a re-render of the
 *              artwork.
 *
 * WHEELS       A single flat image cannot have turning wheels. If rolling
 *              wheels matter, export the body with the wheels removed plus one
 *              wheel image, and fill in `wheels` below — the scene will place
 *              and rotate copies of it at the distance actually travelled.
 *              Leave `wheels` empty and the truck simply glides, which at this
 *              size and speed is not obviously wrong.
 *
 * ────────────────────────────────────────────────────────────────────────────
 */

export interface TruckWheel {
  /** Wheel centre, as a fraction of image width from the left. */
  x: number;
  /** Wheel centre, as a fraction of image height from the top. */
  y: number;
  /** Wheel diameter, as a fraction of image width. */
  d: number;
}

/**
 * Where an axle's tyres meet the road, so the contact shadow can darken under
 * the rubber instead of under the middle of the trailer.
 *
 * In post-flip fractions of image width, like `brandPlate` — these are screen
 * positions, not positions in the source file.
 */
export interface TruckAxle {
  /** Centre of the contact patch. */
  x: number;
  /** Half the patch's width. A tandem is wider than a single steer tyre. */
  halfWidth: number;
}

export interface TruckAsset {
  /**
   * Mirror the image horizontally.
   *
   * Side-profile stock is as often left-facing as right-facing, and a flip is
   * exact and free — so the direction is corrected here rather than by editing
   * and re-uploading the artwork. Only the image is mirrored; the branding
   * drawn over it is not, or the wordmark would come out backwards. Give
   * brandPlate coordinates as they appear AFTER the flip.
   */
  flip?: boolean;
  /** Path under /public — e.g. "/journey/truck-side.webp". */
  body: string;
  /** Trimmed image aspect ratio, width ÷ height. */
  aspect: number;
  /**
   * Where the tyres meet the ground, as a fraction of image height from the
   * top. 1 means the contact line is the image's bottom edge.
   */
  contact: number;
  /** Optional separate wheel image, so the wheels can turn. */
  wheelImage?: string;
  /** Where those wheels sit. Empty means no wheel animation. */
  wheels?: TruckWheel[];
  /**
   * The clean rectangle on the trailer flank reserved for branding, in
   * fractions of the image. The mark is drawn in code inside it.
   */
  brandPlate?: { x: number; y: number; w: number; h: number };
  /** Contact patches, front to back or back to front — order is irrelevant. */
  axles?: TruckAxle[];
}

/**
 * Set this to use a rendered truck. Null draws the built-in vector.
 *
 * Example once the artwork exists:
 *
 *   export const TRUCK_ASSET: TruckAsset | null = {
 *     body: "/journey/truck-side.webp",
 *     aspect: 2.3,
 *     contact: 1,
 *     brandPlate: { x: 0.08, y: 0.24, w: 0.44, h: 0.3 },
 *   };
 */
export const TRUCK_ASSET: TruckAsset | null = {
  /*
   * Adobe Stock 721460354, free tier, licensed to this account. Background
   * removed with Photoshop's subject cutout, then trimmed to its exact alpha
   * bounds — which is why `contact` is 1: the tyres are the bottom row of
   * pixels, measured rather than estimated.
   *
   * GRADED, and the grade is the point. As licensed, the body averaged luma
   * 119 while the road it stands on runs 23 to 63 — a vehicle two to five
   * times brighter than its own road, lit neutrally, shot on white. That
   * mismatch is what reads as "pasted in", and nothing drawn around the truck
   * can fix a base tone belonging to a different photograph. The shipped file
   * has been taken to luma 76 overall, cooled toward the dusk sky, and given
   * the scene's two static light sources: cool sky on the upward faces, warm
   * bounce off the carriageway on the underside. Roof now reads 100 and the
   * skirt 45, inside the road's own range.
   *
   * The pass is a local, reproducible script rather than a chain of cloud
   * adjustments, so alpha survives exactly and the numbers can be re-tuned:
   * scratchpad/grade.cjs, with the ungraded original beside it as
   * truck-side.ungraded.png. Re-run it against that original, never against
   * the shipped file, or the grade compounds.
   */
  body: "/journey/truck-side.webp",
  aspect: 4.7244,
  contact: 1,
  // The source faces left; the scene needs it facing right.
  flip: true,
  // The trailer flank, in post-flip fractions, inset from the ribbed edges.
  brandPlate: { x: 0.08, y: 0.22, w: 0.45, h: 0.34 },
  /*
   * Measured off the cutout rather than assumed: the image is trimmed to its
   * alpha bounds, so the only columns reaching the bottom rows are the ones
   * standing on the road, and the gaps between them are the wheelbases. That
   * found the expected long-haul layout — a wide trailer bogie, a drive
   * tandem, and a single steer tyre at the front. scratchpad/measureTyres.cjs.
   */
  axles: [
    { x: 0.175, halfWidth: 0.093 }, // trailer bogie
    { x: 0.671, halfWidth: 0.062 }, // drive tandem
    { x: 0.941, halfWidth: 0.025 }, // steer
  ],
};

/**
 * Truck length in world units, against a 93-unit viewport.
 *
 * Raised from 14 when the artwork changed from the stylised vector to a
 * photograph. The vector was a stubby 2.2:1; a real tractor-trailer is 4.7:1,
 * so at the same length it stands less than half as tall. 17 units is as long
 * as the truck can be and still satisfy the brief's own keyframes: those place
 * its centre at 10% of stage width at the start, so anything wider than 20%
 * hangs off the left edge. At 17 the left edge clears by 0.9% of the stage.
 */
export const TRUCK_UNITS = 56;
