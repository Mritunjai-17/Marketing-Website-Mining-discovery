/**
 * PROCEDURAL EARTH TEXTURE BUILDER
 *
 * Renders an equirectangular (2:1) day map and a companion data mask straight from
 * the `world-atlas` TopoJSON already vendored in this project, so the globe ships with
 * real coastlines and no CDN requests. The one image it does use — NASA's night-lights
 * map — is self-hosted out of /public and degrades to a procedural field if it is
 * missing, so a blocked asset costs the lights and never the globe.
 *
 * Outputs
 *  - day  : sRGB colour map in an "Earth at night" key — near-black ocean, dark
 *           green-brown land, and warm amber city lights taken from NASA's night map.
 *           Still the same equirectangular 2:1 map from the same TopoJSON; the palette
 *           and the lights pass are what sit on top of it.
 *  - mask : linear data map where the red channel is 0 over ocean and roughly 0.35..1.0 over
 *           land. The shader reads it for (a) land/ocean specular separation, (b) surface
 *           relief via a gradient, and (c) sparse night-side city lights above a threshold.
 */

import { geoEquirectangular, geoPath } from "d3-geo";
import * as topojson from "topojson-client";
import type { GeoPermissibleObjects } from "d3-geo";

export interface EarthTextureResult {
  day: HTMLCanvasElement;
  mask: HTMLCanvasElement;
  clouds: HTMLCanvasElement;
}

interface NoiseOptions {
  seed: number;
  octaves: number;
  lo: number;
  hi: number;
  falloff: number;
}

/** Deterministic PRNG so the terrain grain is identical on every load. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

/**
 * Approximates fBm by stacking bilinearly upscaled lattices of random values.
 * The browser interpolates natively, which is far cheaper than looping multi-octave
 * value noise over several million pixels in JS.
 *
 * Returns its own canvas rather than painting into the target: the finest octave is only
 * a few hundred rows, so the result is smooth enough to compose onto the (much larger)
 * map in a single scaled drawImage instead of one blend per octave at full resolution.
 */
function createFractalNoise(w: number, h: number, opts: NoiseOptions): HTMLCanvasElement {
  const out = makeCanvas(w, h);
  const ctx = out.getContext("2d");
  const rand = mulberry32(opts.seed);
  const lattice = document.createElement("canvas");
  const lctx = lattice.getContext("2d");
  if (!ctx || !lctx) return out;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  for (let o = 0; o < opts.octaves; o += 1) {
    const rows = 4 * 2 ** o;
    // One column wider than the octave needs. The extra column is a copy of the first,
    // and the draw below scales so that copy lands exactly on the map's right edge —
    // which makes the field wrap at the antimeridian instead of butting two unrelated
    // random columns together and leaving a vertical seam down the Pacific.
    const cols = rows * 2;
    lattice.width = cols + 1;
    lattice.height = rows;

    const img = lctx.createImageData(lattice.width, lattice.height);
    const span = opts.hi - opts.lo;
    for (let i = 0; i < img.data.length; i += 4) {
      // Octave 0 is the opaque base layer, so it stays inside [lo, hi] to guarantee land
      // never darkens into the ocean value range. Detail octaves use the full range
      // because they are blended at low alpha on top.
      const v = o === 0 ? opts.lo + rand() * span : rand() * 255;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    // Close the loop: last column := first column.
    for (let y = 0; y < lattice.height; y += 1) {
      const src = (y * lattice.width) * 4;
      const dst = (y * lattice.width + cols) * 4;
      img.data[dst] = img.data[src];
      img.data[dst + 1] = img.data[src + 1];
      img.data[dst + 2] = img.data[src + 2];
      img.data[dst + 3] = 255;
    }
    lctx.putImageData(img, 0, 0);

    ctx.globalAlpha = o === 0 ? 1 : opts.falloff / 2 ** (o - 1);
    // Stretched by (cols + 1) / cols so the duplicated column sits on x = w.
    ctx.drawImage(lattice, 0, 0, (w * (cols + 1)) / cols, h);
  }

  return out;
}

/** Resolution the noise is generated at before being scaled onto a map. */
function noiseSize(mapWidth: number) {
  const w = Math.min(2048, mapWidth);
  return { w, h: w / 2 };
}

/**
 * Land palette. Latitude-banded, but the bands now carry luminance only.
 *
 * EARTH AT NIGHT, so the biome colouring is gone. A night map has no tundra, no boreal
 * and no tropic: the sun is not on this face, and what little the land shows is the same
 * dark blue everywhere, a shade above the water and no more. The previous pass ran a
 * green/ochre biome ramp through here, which rendered to rgb(36,47,37) — a legible
 * OLIVE continent, and the single largest reason the sphere read as a lit daytime globe
 * with lights stuck on it rather than as a planet at night.
 *
 * Still solved back through the shader rather than picked by eye. The material
 * desaturates by uDesaturate, multiplies by (uAmbient + uSunIntensity) = 1.19, applies
 * ACES at 1.06 exposure and converts to sRGB, so an authored hex and the pixel it
 * becomes are far apart. At uDesaturate 0.06 the stops below land between rgb(20,30,50)
 * and rgb(34,48,72): roughly twice the hero's #0A1128 backdrop and twice the ocean, so a
 * coastline reads, while staying far under the city lights so those stay the brightest
 * thing on the sphere.
 *
 * The poles are the lightest stops, not because of ice cover — paintIceCaps handles that
 * separately — but because a continent that darkens uniformly toward both silhouettes
 * loses its edge against the ocean exactly where limb darkening is already taking it.
 */
function terrainGradient(ctx: CanvasRenderingContext2D, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  //
  // Pulled toward blue and away from grey, and — the point of this pass — held UP while
  // the ocean went down. Land now renders rgb(14,30,48) to rgb(24,45,68) against water at
  // rgb(6,14,26): a luma ratio of 2.5x where the previous pair managed 1.9x. That ratio
  // is what makes a coastline legible without drawing one, which is the whole trick here,
  // since an actual stroked outline around every landmass is the thing that reads as a
  // map rather than as a photograph.
  g.addColorStop(0.0, "#243547");
  g.addColorStop(0.06, "#223343");
  g.addColorStop(0.14, "#203040");
  g.addColorStop(0.26, "#1F2E3F");
  g.addColorStop(0.36, "#1D2C3C");
  g.addColorStop(0.44, "#1B2A39");
  g.addColorStop(0.52, "#1E2D3D");
  g.addColorStop(0.6, "#1F2E3F");
  g.addColorStop(0.68, "#1D2C3C");
  g.addColorStop(0.78, "#1E2D3D");
  g.addColorStop(0.88, "#203040");
  g.addColorStop(1.0, "#243547");
  return g;
}

/** Near-black navy ocean, barely lifted toward the poles. */
function oceanGradient(ctx: CanvasRenderingContext2D, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  // Also solved through the shader, and against one hard floor: the #0A1128 hero
  // backdrop this sphere is drawn over. An ocean darker than the page renders as a hole
  // punched in it rather than as unlit water, so mid-latitude water lands at rgb(10,15,28)
  // — level with the backdrop in luminance but cooler and bluer, which is what lets the
  // disc read as water without ever reading as lit. The old stops carried a grey cast
  // that showed up against the new land; these are the same values pulled toward blue.
  //
  // Taken down another stop and flattened. Two separate notes:
  //
  // DARKER. Mid-latitude water now renders rgb(6,14,26) against the #0A1128 backdrop's
  // rgb(10,17,40) — for the first time the ocean sits BELOW the page it is drawn on, so
  // it recedes into it instead of reading as a lit blue disc. The earlier worry about
  // the globe becoming "a hole punched in the page" is answered by the limb and the
  // lights rather than by keeping the water bright: an ocean that is visibly lit at
  // night is the single thing that stops this reading as a night map.
  //
  // FLATTER. The pole-to-equator spread is cut from 8 luma to 4. A visible vertical
  // ramp across the water is a gradient, and a gradient reads as a lighting effect
  // painted onto a sphere; the real thing is near-uniform black with local texture,
  // which the noise pass below now supplies instead.
  g.addColorStop(0.0, "#131E2A");
  g.addColorStop(0.16, "#121C28");
  g.addColorStop(0.5, "#0F1924");
  g.addColorStop(0.84, "#121C28");
  g.addColorStop(1.0, "#131E2A");
  return g;
}

/**
 * Polar caps, as a faint cool wash rather than white ice.
 *
 * Cut to roughly a third of their previous alpha. At 0.34 they were the brightest
 * non-light pixels anywhere on the sphere, and against oceans that are now near-black
 * that reads as two lamps at the poles — the one thing a night map never shows, since
 * the winter pole is the darkest place on the planet and the summer one is off frame.
 * Kept rather than removed: a trace of cap is what stops Greenland and Antarctica from
 * vanishing into the water entirely.
 */
function paintIceCaps(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const north = ctx.createLinearGradient(0, 0, 0, h * 0.1);
  north.addColorStop(0, "rgba(146,170,204,0.12)");
  north.addColorStop(0.45, "rgba(146,170,204,0.05)");
  north.addColorStop(1, "rgba(146,170,204,0)");
  ctx.fillStyle = north;
  ctx.fillRect(0, 0, w, h * 0.1);

  const south = ctx.createLinearGradient(0, h, 0, h * 0.87);
  south.addColorStop(0, "rgba(150,174,208,0.13)");
  south.addColorStop(0.5, "rgba(150,174,208,0.06)");
  south.addColorStop(1, "rgba(150,174,208,0)");
  ctx.fillStyle = south;
  ctx.fillRect(0, h * 0.87, w, h * 0.13);
}

/**
 * NASA's night-lights map, self-hosted rather than fetched from a CDN.
 *
 * Equirectangular 2:1, the same projection and framing the rest of this file paints in,
 * so it drops onto the map with no reprojection: x = 0 is longitude -180 in both, which
 * is also the convention EarthGlobe's latLngToVector3 uses. Nothing about marker or arc
 * placement reads this image, so their positions cannot move with it.
 *
 * Both files are downsampled with Lanczos from Black Marble 2012's own 13500x6750
 * original, so the 4096 is real detail rather than an upscale, and the 2048 is a
 * cleaner reduction of the same source than a separately published small version.
 *
 * They are lights-only — near-black everywhere else — which is what the compositing
 * step below wants, since it is drawn under "lighter" where black adds nothing.
 */
const NIGHT_LIGHTS_SOURCES = {
  2048: "/textures/earth_lights_2048.jpg",
  4096: "/textures/earth_lights_4096.jpg",
} as const;

/**
 * Which of the two to fetch, keyed to the map this build is painting.
 *
 * The day canvas is 2048 wide on phones and 4096-6144 on desktop. Sending the 4096 file
 * to a phone would be 466KB spent to be thrown away by the downscale into a 2048 canvas,
 * and sending the 2048 file to desktop is what made the lights soft in the first place:
 * it was being stretched 3x across a 6144 map while the coastlines beside it were drawn
 * at native size. Desktop keeps a 1.5x upscale at 6144 rather than none, which the two
 * blur passes absorb — the step from 3x is where the visible sharpening is, and matching
 * 6144 exactly would cost a 75MB decode on top of the canvas's own.
 */
function nightLightsSrc(dayWidth: number) {
  return dayWidth <= 2048 ? NIGHT_LIGHTS_SOURCES[2048] : NIGHT_LIGHTS_SOURCES[4096];
}

/**
 * Loads the lights map, resolving to null rather than rejecting.
 *
 * A missing or blocked image must not take the whole globe down with it: the caller
 * falls back to the procedural lights, so the worst case is the previous look rather
 * than a sphere that never appears.
 */
function loadNightLights(dayWidth: number): Promise<HTMLImageElement | null> {
  const src = nightLightsSrc(dayWidth);
  return new Promise((resolve) => {
    const img = new Image();
    // Same-origin out of /public, so the canvas is never tainted and getImageData
    // elsewhere in this file keeps working.
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn("[earthTexture] night lights map failed to load:", src);
      resolve(null);
    };
    img.src = src;
  });
}

/**
 * The raster, scaled to the map and pulled into the site's amber.
 *
 * NASA's lights are near-white with a faint yellow cast. Multiplying by amber warms
 * them to the sodium-vapour key the rest of the hero uses while leaving the black
 * background black — multiply cannot lift a zero — so the result composites under
 * "lighter" exactly as the procedural layer it replaces did.
 *
 * The tint is the midpoint of the range createCityLights paints, so swapping between
 * the two paths changes where the lights are, never what colour they are.
 */
function tintNightLights(img: HTMLImageElement, w: number, h: number): HTMLCanvasElement {
  const out = makeCanvas(w, h);
  const ctx = out.getContext("2d");
  if (!ctx) return out;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);

  // Deepened from #FFC05C. The shader desaturates the whole albedo before lighting, so
  // the authored tint is not what lands on screen: at the old value a full-brightness
  // city core rendered rgb(234,213,165), a pale cream with barely any hue left in it.
  // This one renders rgb(239,200,118) — sodium-vapour gold, which is what the lights
  // actually photograph as from orbit — while the dimmer 90-odd percent of the raster
  // falls away into warm amber underneath it.
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = "#FFA83C";
  ctx.fillRect(0, 0, w, h);

  return out;
}

/**
 * Warm city-light clusters, as a standalone transparent canvas.
 *
 * Built by thresholding fBm rather than by scattering dots: real night-Earth lights are
 * clustered and filamentary — dense cores trailing into sparse outskirts — which is what
 * the upper tail of a fractal field already looks like. Scattered points read as noise;
 * a threshold on fBm reads as settlement.
 *
 * Two things shape it beyond the raw threshold:
 *
 *  - SETTLEMENT GEOGRAPHY. See createPopulationWeight below. This is the difference
 *    between a band of light and a map.
 *
 *  - A SOFT KNEE. Alpha ramps from the threshold rather than switching at it, so cores
 *    are bright and edges feather out. A hard cut gives speckle.
 *
 * The caller clips this to land, so nothing here needs to know where the coastlines are.
 */
/**
 * Where the world is actually lit at night.
 *
 * The previous pass weighted the lights by LATITUDE alone, and that is what kept the
 * result from reading as the real thing: at a given latitude every landmass glowed
 * equally, so the Sahara lit up like Europe and Siberia like eastern China. On the real
 * night map the lights are a population map, and the empty places — the Sahara, the
 * Amazon, Siberia, the Tibetan plateau, interior Australia, the Canadian north — are as
 * recognisable as the bright ones.
 *
 * These are the major urban regions by centre and rough extent in degrees: a coarse
 * sketch of settlement geography and nothing more. No precision is claimed, and nothing
 * here is data about any person.
 */
const POPULATION_CENTRES: Array<{ lat: number; lng: number; r: number; i: number }> = [
  // North America
  { lat: 40.7, lng: -74.0, r: 9, i: 1.0 }, // northeast corridor
  { lat: 41.9, lng: -87.6, r: 8, i: 0.85 }, // great lakes
  { lat: 34.0, lng: -118.2, r: 7, i: 0.9 }, // california
  { lat: 30.0, lng: -95.4, r: 8, i: 0.7 }, // gulf coast
  { lat: 19.4, lng: -99.1, r: 5, i: 0.75 }, // central mexico
  // Europe
  { lat: 50.5, lng: 5.5, r: 10, i: 1.0 }, // low countries and the rhine
  { lat: 52.0, lng: -1.5, r: 5, i: 0.9 }, // britain
  { lat: 43.5, lng: 12.0, r: 6, i: 0.8 }, // italy
  { lat: 40.4, lng: -3.7, r: 5, i: 0.7 }, // iberia
  { lat: 55.7, lng: 37.6, r: 7, i: 0.75 }, // moscow
  { lat: 40.0, lng: 32.0, r: 6, i: 0.7 }, // anatolia
  // Africa and the Middle East
  { lat: 27.0, lng: 31.0, r: 5, i: 0.8 }, // the nile
  { lat: 6.5, lng: 4.5, r: 7, i: 0.7 }, // west africa
  { lat: -26.2, lng: 28.0, r: 5, i: 0.7 }, // gauteng
  { lat: 26.0, lng: 51.0, r: 6, i: 0.8 }, // the gulf
  { lat: 35.7, lng: 51.4, r: 5, i: 0.7 }, // iran
  // South and East Asia
  { lat: 28.6, lng: 77.2, r: 10, i: 1.0 }, // indo-gangetic plain
  { lat: 13.0, lng: 78.0, r: 8, i: 0.85 }, // south india
  { lat: 23.7, lng: 90.4, r: 5, i: 0.8 }, // bengal delta
  { lat: 30.0, lng: 71.5, r: 6, i: 0.75 }, // the indus
  { lat: 32.0, lng: 118.0, r: 10, i: 1.0 }, // eastern china
  { lat: 23.1, lng: 113.3, r: 7, i: 0.95 }, // pearl river delta
  { lat: 36.0, lng: 137.0, r: 7, i: 1.0 }, // japan and korea
  { lat: 14.0, lng: 101.0, r: 7, i: 0.75 }, // indochina
  { lat: -7.0, lng: 110.0, r: 6, i: 0.8 }, // java
  // South America and Oceania
  { lat: -23.5, lng: -46.6, r: 7, i: 0.9 }, // south-east brazil
  { lat: -34.6, lng: -58.4, r: 5, i: 0.75 }, // rio de la plata
  { lat: 7.0, lng: -73.0, r: 6, i: 0.6 }, // northern andes
  { lat: -33.8, lng: 151.0, r: 4, i: 0.7 }, // sydney
  { lat: -37.8, lng: 145.0, r: 3.5, i: 0.65 }, // melbourne

  /*
   * SECOND TIER. Everything above is a first-magnitude region; these are the smaller
   * ones, and they are here because a map with only the first tier has a characteristic
   * failure — the great regions read correctly and everything between them is empty in a
   * way the real planet never is. Poland, the Maghreb, central Chile and the Australian
   * capitals are not Tokyo, but they are not the Sahara either, and it is the middle of
   * that range that makes the distribution look inhabited rather than sampled.
   *
   * Deliberately capped at i 0.75 and mostly well under it, so nothing here can compete
   * with the first tier: the hierarchy is major region > urban region > settlement, and
   * these occupy the bottom two rungs. Radii are smaller too — a second-tier region is a
   * city and its surroundings, not a corridor.
   */
  // North America
  { lat: 45.5, lng: -73.6, r: 4, i: 0.6 }, // st lawrence
  { lat: 28.0, lng: -81.5, r: 4.5, i: 0.6 }, // florida
  { lat: 47.5, lng: -122.3, r: 3.5, i: 0.55 }, // pacific northwest
  { lat: 39.7, lng: -105.0, r: 3, i: 0.4 }, // front range
  // South America
  { lat: -33.5, lng: -70.7, r: 3.5, i: 0.6 }, // central chile
  { lat: -8.0, lng: -35.5, r: 5, i: 0.5 }, // north-east brazil
  { lat: -12.0, lng: -77.0, r: 3, i: 0.55 }, // peruvian coast
  { lat: 10.5, lng: -67.0, r: 4, i: 0.5 }, // venezuela
  // Europe
  { lat: 52.0, lng: 19.5, r: 5, i: 0.6 }, // poland and central europe
  { lat: 50.0, lng: 31.0, r: 5, i: 0.55 }, // ukraine
  { lat: 44.0, lng: 21.0, r: 4.5, i: 0.5 }, // balkans
  { lat: 59.3, lng: 17.5, r: 4, i: 0.45 }, // southern scandinavia
  // North Africa and the Middle East
  { lat: 36.5, lng: 3.0, r: 5, i: 0.6 }, // maghreb coast
  { lat: 33.5, lng: -7.0, r: 4, i: 0.55 }, // atlantic morocco
  { lat: 32.5, lng: 35.5, r: 4, i: 0.65 }, // the levant
  { lat: 33.3, lng: 44.4, r: 4.5, i: 0.6 }, // mesopotamia
  // South and East Asia
  { lat: 24.9, lng: 67.0, r: 3.5, i: 0.6 }, // karachi
  { lat: 7.5, lng: 80.5, r: 3, i: 0.5 }, // sri lanka
  { lat: 30.6, lng: 104.1, r: 5, i: 0.75 }, // sichuan basin
  { lat: 42.0, lng: 124.0, r: 5, i: 0.6 }, // north-east china
  { lat: 23.8, lng: 121.0, r: 2.5, i: 0.6 }, // taiwan
  // South-east Asia
  { lat: 14.6, lng: 121.0, r: 3.5, i: 0.65 }, // luzon
  { lat: 21.0, lng: 105.8, r: 3.5, i: 0.6 }, // red river delta
  { lat: 3.0, lng: 102.5, r: 4, i: 0.6 }, // malaya and singapore
  // Australia
  { lat: -27.5, lng: 153.0, r: 2.5, i: 0.5 }, // brisbane
  { lat: -31.9, lng: 115.9, r: 2.5, i: 0.45 }, // perth
  { lat: -34.9, lng: 138.6, r: 2, i: 0.4 }, // adelaide
];

/**
 * Rasterises POPULATION_CENTRES into a greyscale weight field.
 *
 * Each centre is one radial gradient composited with "lighter", so the browser does both
 * the falloff and the accumulation. A per-pixel loop over thirty centres at this
 * resolution would be roughly sixty million operations in JS and would visibly stall the
 * texture build.
 *
 * Two details that matter:
 *  - Longitude converges toward the poles, so a circle in degrees is an ellipse in an
 *    equirectangular raster. The x radius is divided by cos(lat), clamped so that a very
 *    high-latitude centre cannot smear across an entire row.
 *  - Each centre is drawn three times, at x - w, x and x + w, so a gradient running off
 *    one edge arrives on the other and the field wraps at the antimeridian like
 *    everything else here.
 */
function createPopulationWeight(w: number, h: number): ImageData | null {
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "lighter";

  for (const c of POPULATION_CENTRES) {
    const x = ((c.lng + 180) / 360) * w;
    const y = ((90 - c.lat) / 180) * h;
    const ry = (c.r / 180) * h;
    const rx = ry / Math.max(0.3, Math.cos((c.lat * Math.PI) / 180));
    const peak = Math.round(c.i * 255);

    for (const offset of [-w, 0, w]) {
      ctx.save();
      ctx.translate(x + offset, y);
      ctx.scale(rx / ry, 1);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, ry);
      g.addColorStop(0, "rgb(" + peak + "," + peak + "," + peak + ")");
      g.addColorStop(0.45, "rgba(" + peak + "," + peak + "," + peak + ",0.45)");
      g.addColorStop(1, "rgba(" + peak + "," + peak + "," + peak + ",0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, ry, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  return ctx.getImageData(0, 0, w, h);
}

function createCityLights(w: number, h: number, seed: number): HTMLCanvasElement {
  const out = makeCanvas(w, h);
  const ctx = out.getContext("2d");
  if (!ctx) return out;

  // Sampled from the same wrapping fBm as everything else, so the lights wrap at the
  // antimeridian too.
  const field = createFractalNoise(w, h, { seed, octaves: 7, lo: 0, hi: 255, falloff: 0.62 });
  const fctx = field.getContext("2d");
  if (!fctx) return out;

  const src = fctx.getImageData(0, 0, w, h);
  const dst = ctx.createImageData(w, h);
  const pop = createPopulationWeight(w, h);

  // Above this the field becomes a settlement. High, because the point is sparse
  // clusters on a dark planet, not a lit continent.
  const THRESHOLD = 178;
  const KNEE = 255 - THRESHOLD;
  // Faint scatter everywhere else, so remote land is not perfectly black. There are
  // roads and small towns off the map too, just not many of them.
  const BASELINE = 0.06;

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4;
      const v = src.data[i];
      if (v <= THRESHOLD) continue;

      // Settlement density at this pixel: ~0 in the empty quarters, 1 in the core of a
      // major region. This is what turns a band of light into a map.
      const density = pop ? pop.data[i] / 255 : 1;
      const weight = BASELINE + (1 - BASELINE) * density;

      const t = (v - THRESHOLD) / KNEE;
      const alpha = t * t * weight;
      if (alpha <= 0.004) continue;

      // Amber core running to gold at the brightest pixels, which is how sodium-vapour
      // lighting photographs from orbit.
      dst.data[i] = 255;
      dst.data[i + 1] = 176 + Math.round(t * 40);
      dst.data[i + 2] = 74 + Math.round(t * 70);
      dst.data[i + 3] = Math.round(Math.min(1, alpha) * 255);
    }
  }

  ctx.putImageData(dst, 0, 0);
  return out;
}

function equirectPath(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const projection = geoEquirectangular()
    .translate([w / 2, h / 2])
    .scale(w / (2 * Math.PI));
  return geoPath(projection, ctx);
}

function paintDayMap(
  land: GeoPermissibleObjects,
  borders: GeoPermissibleObjects,
  w: number,
  nightLights: HTMLImageElement | null
): HTMLCanvasElement {
  const h = w / 2;
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const path = equirectPath(ctx, w, h);
  const unit = w / 2048;
  const noise = noiseSize(w);

  // Ocean
  ctx.fillStyle = oceanGradient(ctx, h);
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  // Raised from 0.12 as the water went dark. This is the pass that keeps the ocean from
  // becoming a flat black silhouette: overlay against a dark base multiplies where the
  // noise falls below mid-grey and lifts where it rises above, so it varies the surface
  // in both directions rather than just tinting it. With the base this dark, 0.12 was no
  // longer resolving to anything visible.
  ctx.globalCompositeOperation = "overlay";
  ctx.globalAlpha = 0.18;
  ctx.drawImage(
    createFractalNoise(noise.w, noise.h, { seed: 90210, octaves: 4, lo: 96, hi: 190, falloff: 0.3 }),
    0,
    0,
    w,
    h
  );
  ctx.restore();

  // Land
  ctx.save();
  ctx.beginPath();
  path(land);
  ctx.clip();

  ctx.fillStyle = terrainGradient(ctx, h);
  ctx.fillRect(0, 0, w, h);

  ctx.globalCompositeOperation = "overlay";
  ctx.globalAlpha = 0.38;
  ctx.drawImage(
    createFractalNoise(noise.w, noise.h, { seed: 1337, octaves: 6, lo: 88, hi: 208, falloff: 0.34 }),
    0,
    0,
    w,
    h
  );

  /*
   * City lights. Still inside the land clip, so nothing can spill onto open ocean.
   *
   * Drawn twice under "lighter": once through a blur for the airglow a city throws into
   * the atmosphere above it, then once sharp for the cores. That two-pass bloom is what
   * separates "glowing settlement" from "orange speckle". ctx.filter is unsupported on a
   * few older engines and simply no-ops there, which costs the halo and keeps the cores,
   * so the fallback degrades instead of breaking.
   *
   * The lights themselves are NASA's night map when it loaded, and the procedural
   * population-weighted field when it did not. Only the SOURCE of the layer changes
   * between the two: the clip, the blur, both alphas and the composite mode below are
   * shared, so the pass reads the same either way.
   */
  const lights = nightLights
    ? tintNightLights(nightLights, w, h)
    : createCityLights(noise.w, noise.h, 5150);

  /*
   * The settlement tier, and only when the raster is already carrying the map.
   *
   * On the fallback path this same generator IS the light layer, so compositing it a
   * second time there would simply double its own brightness and change nothing about
   * where the lights are — hence the null.
   */
  const settlements = nightLights ? createCityLights(noise.w, noise.h, 5150) : null;
  //
  // The two alphas are swapped relative to each other from the previous pass: the blurred
  // halo drops from 0.85 to 0.5 and the sharp cores go from 0.9 to full. The halo was
  // authored against olive land, where it had to do the work of separating a light from
  // the ground under it; against near-black land it needs none of that, and at 0.85 it
  // fused neighbouring towns into continent-sized glows — the "large glowing dots" look
  // rather than the field of individual pinpricks the real map shows. Cutting the halo
  // and taking the cores up trades bloom for count.
  ctx.globalCompositeOperation = "lighter";

  /*
   * REGIONAL TIER, and this one is a correction rather than an addition.
   *
   * Cutting the halo from 0.85 to 0.36 in the previous pass did what it was meant to —
   * neighbouring towns stopped fusing into continent-sized glows — but it also took the
   * faint end of the map down with the fused end, and the faint end is most of the
   * inhabited world. Black Marble is not bright cores on black; it is bright cores
   * inside a much larger, much dimmer wash of small towns, roads and coastal strips, and
   * with that wash gone the land between the great regions went to nothing.
   *
   * A wide, very low blur restores it without undoing the fix: at three times the radius
   * and under half the alpha it spreads far enough to read as regional light rather than
   * as a halo belonging to any one city, and it is far too dim to fuse anything.
   */
  ctx.filter = `blur(${Math.max(2, Math.round(7 * unit))}px)`;
  ctx.globalAlpha = 0.16;
  ctx.drawImage(lights, 0, 0, w, h);

  // City halo and cores, unchanged.
  ctx.filter = `blur(${Math.max(1, Math.round(2.5 * unit))}px)`;
  ctx.globalAlpha = 0.36;
  ctx.drawImage(lights, 0, 0, w, h);
  ctx.filter = "none";
  ctx.globalAlpha = 1.0;
  ctx.drawImage(lights, 0, 0, w, h);

  /*
   * SETTLEMENT TIER. Small, irregular, population-weighted clusters laid over the raster.
   *
   * Additive, which is what keeps the hierarchy intact for free: over a Tokyo or a Rhine
   * the raster underneath is already at or near clipping, so this contributes nothing
   * visible there. It only resolves where the surface is dark — which is precisely the
   * land that was reading as empty — so the tier cannot brighten a major city and cannot
   * flatten the contrast between one and its surroundings.
   *
   * It is not scatter. Every cluster is a threshold on the same fBm the rest of this file
   * uses, weighted by POPULATION_CENTRES, so the shapes are filamentary and the placement
   * is settlement geography; the generator's own 0.06 baseline is all that reaches genuinely
   * empty land, and at these alphas that resolves to about one part in eighty — a few
   * isolated points across a continental interior, not a glow on it.
   *
   * Held to roughly a fifth of the raster's own weight so a new light is always dimmer
   * than an existing city.
   */
  if (settlements) {
    ctx.filter = `blur(${Math.max(1, Math.round(1.5 * unit))}px)`;
    ctx.globalAlpha = 0.12;
    ctx.drawImage(settlements, 0, 0, w, h);
    ctx.filter = "none";
    ctx.globalAlpha = 0.22;
    ctx.drawImage(settlements, 0, 0, w, h);
  }

  ctx.restore();

  // Coastlines and administrative borders
  ctx.save();
  ctx.lineJoin = "round";
  ctx.beginPath();
  path(land);
  ctx.lineWidth = 1.1 * unit;
  // Cooled and dimmed. Against near-black water the old blue-grey at 0.20 drew a
  // continuous lit outline around every landmass, which is a map convention, not
  // something a satellite sees. At 0.13 it survives as a hint of edge where land meets
  // water and disappears everywhere the lights already define the coast.
  ctx.strokeStyle = "rgba(132,164,204,0.13)";
  ctx.stroke();

  ctx.beginPath();
  path(borders);
  ctx.lineWidth = 0.8 * unit;
  // Halved. Administrative borders are the most "HUD" thing on the sphere and the least
  // physical; on a darker surface the old 0.035 had started to read as deliberate.
  ctx.strokeStyle = "rgba(255,255,255,0.018)";
  ctx.stroke();
  ctx.restore();

  paintIceCaps(ctx, w, h);

  return canvas;
}

function paintMaskMap(land: GeoPermissibleObjects, w: number): HTMLCanvasElement {
  const h = w / 2;
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const path = equirectPath(ctx, w, h);

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.beginPath();
  path(land);
  ctx.clip();
  // The base sits well above the shader land cutoff; the fine octaves supply both the
  // relief gradient and the sparse peaks that become night-side city lights.
  ctx.drawImage(
    createFractalNoise(w, h, { seed: 24601, octaves: 7, lo: 132, hi: 236, falloff: 0.36 }),
    0,
    0,
    w,
    h
  );
  ctx.restore();

  return canvas;
}

/**
 * White cloud sheet on its own transparent canvas.
 *
 * fBm luminance is remapped to alpha through a soft threshold, so the low end opens up
 * into clear sky and the high end forms banded cloud masses. Alpha stays well under 1 —
 * this layer is meant to soften the planet, not to hide it.
 */
function paintCloudMap(w: number): HTMLCanvasElement {
  const h = w / 2;
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const noise = createFractalNoise(w, h, {
    seed: 7717,
    octaves: 6,
    lo: 40,
    hi: 232,
    falloff: 0.42,
  });
  ctx.drawImage(noise, 0, 0);

  const image = ctx.getImageData(0, 0, w, h);
  const data = image.data;

  for (let i = 0; i < data.length; i += 4) {
    const luminance = data[i] / 255;
    // Soft threshold: nothing below 0.46, ramping to full cloud by 0.86.
    const t = Math.min(Math.max((luminance - 0.46) / 0.4, 0), 1);
    const coverage = t * t * (3 - 2 * t);

    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
    data[i + 3] = Math.round(coverage * 208);
  }

  ctx.putImageData(image, 0, 0);
  return canvas;
}

/**
 * Builds the maps. The TopoJSON is pulled in via dynamic import so the ~750KB atlas
 * lands in its own chunk, fetched after the hero has already painted.
 */
export async function buildEarthTextures(dayWidth: number): Promise<EarthTextureResult> {
  // Started before the atlas import and awaited alongside it, so the image download
  // overlaps the topology chunk rather than being serialised after it.
  const nightLights = loadNightLights(dayWidth);
  const atlas = await import("world-atlas/countries-50m.json");
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const topology = ((atlas as any).default ?? atlas) as any;

  const land = topojson.merge(
    topology,
    topology.objects.countries.geometries
  ) as unknown as GeoPermissibleObjects;

  const borders = topojson.mesh(
    topology,
    topology.objects.countries,
    (a: any, b: any) => a !== b
  ) as unknown as GeoPermissibleObjects;
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return {
    day: paintDayMap(land, borders, dayWidth, await nightLights),
    mask: paintMaskMap(land, Math.max(1024, Math.round(dayWidth / 2))),
    // Clouds are soft, low-frequency shapes with nothing to resolve, so they are pinned
    // rather than scaled with the day map. Following it to 3072 would cost ~19MB and a
    // per-pixel alpha remap over 2.25x the area to render the same blurry puffs.
    clouds: paintCloudMap(Math.max(1024, Math.min(2048, Math.round(dayWidth / 2)))),
  };
}
