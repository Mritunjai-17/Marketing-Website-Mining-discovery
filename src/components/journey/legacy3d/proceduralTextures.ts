import * as THREE from "three";

/**
 * Textures generated in a canvas at load time rather than shipped as files.
 *
 * The brief asks for compressed textures and no oversized maps. Generating
 * these is the logical end of that: a 256px asphalt roughness map costs zero
 * bytes of download and a fraction of a millisecond to build, and it is the
 * difference between asphalt that has a surface and asphalt that is a flat
 * grey plane with one uniform specular response.
 *
 * Every function here returns a fresh texture the caller owns and must
 * dispose.
 */

function createCanvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");
  return [canvas, ctx];
}

/**
 * Value noise, tiled so the texture repeats without a visible seam.
 *
 * The seam matters here because the road repeats this map dozens of times
 * along its length; a hard edge would show up as regular banding running
 * across the carriageway.
 */
function tileableNoise(size: number, cells: number, seed: number): Float32Array {
  const grid = new Float32Array(cells * cells);
  let a = seed >>> 0;
  for (let i = 0; i < grid.length; i++) {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    grid[i] = ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  }

  const out = new Float32Array(size * size);
  const step = cells / size;
  const fade = (t: number) => t * t * (3 - 2 * t);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const fx = x * step;
      const fy = y * step;
      const x0 = Math.floor(fx) % cells;
      const y0 = Math.floor(fy) % cells;
      const x1 = (x0 + 1) % cells;
      const y1 = (y0 + 1) % cells;
      const tx = fade(fx - Math.floor(fx));
      const ty = fade(fy - Math.floor(fy));

      const top = grid[y0 * cells + x0] * (1 - tx) + grid[y0 * cells + x1] * tx;
      const bottom = grid[y1 * cells + x0] * (1 - tx) + grid[y1 * cells + x1] * tx;
      out[y * size + x] = top * (1 - ty) + bottom * ty;
    }
  }
  return out;
}

/**
 * Asphalt roughness: fine aggregate over a slower blotchy variation.
 *
 * Kept in the upper half of the range — asphalt is rough everywhere, and the
 * variation is about *where the sheen breaks up*, not about creating polished
 * patches. Darker pixels are the smoother, more reflective worn areas.
 */
export function createAsphaltRoughnessMap(size = 256): THREE.Texture {
  const [canvas, ctx] = createCanvas(size);
  const fine = tileableNoise(size, 64, 0x51ed270b);
  const broad = tileableNoise(size, 8, 0x1a9f3c77);
  const image = ctx.createImageData(size, size);

  for (let i = 0; i < size * size; i++) {
    const value = 0.62 + fine[i] * 0.22 + broad[i] * 0.16;
    const v = Math.round(Math.min(1, value) * 255);
    image.data[i * 4 + 0] = v;
    image.data[i * 4 + 1] = v;
    image.data[i * 4 + 2] = v;
    image.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

/**
 * Matching normal map, derived from the same aggregate noise by finite
 * differences so the bumps line up with the rough patches rather than
 * fighting them.
 */
export function createAsphaltNormalMap(size = 256, strength = 1.6): THREE.Texture {
  const [canvas, ctx] = createCanvas(size);
  const height = tileableNoise(size, 64, 0x51ed270b);
  const image = ctx.createImageData(size, size);

  const at = (x: number, y: number) =>
    height[((y + size) % size) * size + ((x + size) % size)];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      // Normalise (-dx, -dy, 1) into the 0..255 tangent-space encoding.
      const length = Math.sqrt(dx * dx + dy * dy + 1);
      const i = (y * size + x) * 4;
      image.data[i + 0] = Math.round(((-dx / length) * 0.5 + 0.5) * 255);
      image.data[i + 1] = Math.round(((-dy / length) * 0.5 + 0.5) * 255);
      image.data[i + 2] = Math.round((1 / length) * 0.5 * 255 + 127);
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

/**
 * A soft round sprite for the dust particles.
 *
 * The falloff is squared rather than linear so the edge disappears completely
 * instead of ending on a faint ring — a ring is what makes cheap particle
 * systems read as overlapping discs rather than as haze.
 */
export function createDustSprite(size = 64): THREE.Texture {
  const [canvas, ctx] = createCanvas(size);
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  gradient.addColorStop(0, "rgba(255,255,255,0.85)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.32)");
  gradient.addColorStop(0.7, "rgba(255,255,255,0.06)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  return new THREE.CanvasTexture(canvas);
}

/**
 * The digital billboard's screen content.
 *
 * Drawn rather than shipped as an image for the same reason as everything else
 * here — but also because the copy is temporary. The final line
 * ("MAKE YOUR STORY VISIBLE.") lands in a later stage, and a generated panel
 * is a one-line change rather than a round trip through a design tool.
 *
 * 1024x512 for a 16x8 panel: about 64 pixels per world unit, which stays crisp
 * at the closest the camera ever gets and is a quarter the memory of the 2K
 * texture the size might tempt you into.
 */
export function createBillboardScreen(
  line1 = "MINING",
  line2 = "DISCOVERY",
): THREE.Texture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");

  // Deep navy ground, lifted very slightly toward the centre so the panel has
  // some internal light rather than reading as a flat rectangle.
  const backdrop = ctx.createLinearGradient(0, 0, 0, height);
  backdrop.addColorStop(0, "#0B1F3A");
  backdrop.addColorStop(0.55, "#102a4b");
  backdrop.addColorStop(1, "#061224");
  ctx.fillStyle = backdrop;
  ctx.fillRect(0, 0, width, height);

  /*
   * Letters are placed individually rather than via ctx.letterSpacing, which
   * is recent enough that it is not safe to rely on. Wide tracking is most of
   * what makes set type read as premium at this scale.
   */
  const drawTracked = (
    text: string,
    centreX: number,
    y: number,
    font: string,
    tracking: number,
  ) => {
    ctx.font = font;
    const widths = [...text].map((c) => ctx.measureText(c).width);
    const total = widths.reduce((sum, w) => sum + w, 0) + tracking * (text.length - 1);
    let x = centreX - total / 2;
    [...text].forEach((char, i) => {
      ctx.fillText(char, x, y);
      x += widths[i] + tracking;
    });
  };

  ctx.textBaseline = "middle";
  ctx.textAlign = "left";

  const stack = '"Helvetica Neue", Helvetica, Arial, sans-serif';

  /*
   * Two lines rather than one. At the distance this is first legible from, a
   * single long line resolves to a smear — stacking the words roughly doubles
   * the cap height for the same panel, which is the difference between a sign
   * you can read from 200 metres and one you can only tell is a sign.
   */
  ctx.fillStyle = "#FFFFFF";
  drawTracked(line1, width / 2, height / 2 - 96, `300 118px ${stack}`, 26);
  drawTracked(line2, width / 2, height / 2 + 34, `600 118px ${stack}`, 18);

  // The single gold element on the panel: a short rule, not a glow.
  ctx.fillStyle = "#D4AF37";
  ctx.fillRect(width / 2 - 120, height / 2 + 132, 240, 5);

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  drawTracked("GLOBAL MINING MEDIA", width / 2, height / 2 + 186, `500 27px ${stack}`, 10);

  /*
   * An LED pixel grid. Without it a lit rectangle reads as a projected image;
   * with it the panel reads as a physical display made of emitters, which is
   * the whole difference between "billboard" and "floating UI element".
   */
  ctx.fillStyle = "rgba(0,0,0,0.14)";
  for (let x = 0; x < width; x += 4) ctx.fillRect(x, 0, 1, height);
  for (let y = 0; y < height; y += 4) ctx.fillRect(0, y, width, 1);

  // Vignette, so the panel edges fall off instead of ending on full brightness.
  // Lighter than before: the panel has to stay readable from a long way out,
  // and a heavy vignette eats exactly the brightness distance already takes.
  const vignette = ctx.createRadialGradient(
    width / 2,
    height / 2,
    height * 0.3,
    width / 2,
    height / 2,
    width * 0.66,
  );
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.32)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  // This one carries colour, unlike the data maps above, so it has to be
  // tagged sRGB or three will treat the navy as linear and wash it out.
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/**
 * A soft radial glow, used as a camera-facing sprite.
 *
 * This is how the distant district and the billboard get their halo without a
 * bloom pass. Real bloom would mean a post-processing chain over the whole
 * frame — expensive, and the brief explicitly rules out excessive bloom.
 * A handful of additive sprites puts the glow exactly where it belongs and
 * nowhere else.
 */
export function createGlowSprite(size = 128): THREE.Texture {
  const [canvas, ctx] = createCanvas(size);
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  // A long, low tail rather than a bright core: a tight falloff reads as a
  // lamp, a wide one reads as light scattering through air, which is what
  // distant city glow actually is.
  gradient.addColorStop(0, "rgba(255,255,255,0.55)");
  gradient.addColorStop(0.18, "rgba(255,255,255,0.26)");
  gradient.addColorStop(0.45, "rgba(255,255,255,0.08)");
  gradient.addColorStop(0.75, "rgba(255,255,255,0.02)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  return new THREE.CanvasTexture(canvas);
}

/**
 * A soft elliptical blob used as a contact shadow under the truck.
 *
 * The directional light already casts a real shadow; this sits underneath it
 * to darken the few centimetres where tyre meets road, which is the contact
 * cue a single shadow map at this range cannot resolve.
 */
export function createContactShadow(size = 128): THREE.Texture {
  const [canvas, ctx] = createCanvas(size);
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  gradient.addColorStop(0, "rgba(0,0,0,0.75)");
  gradient.addColorStop(0.45, "rgba(0,0,0,0.38)");
  gradient.addColorStop(0.8, "rgba(0,0,0,0.07)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  return new THREE.CanvasTexture(canvas);
}
