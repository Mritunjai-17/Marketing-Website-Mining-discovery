/**
 * Encodes the About section's scroll sequence from PNG to WebP, at two widths.
 *
 * WHY THIS EXISTS
 *
 * The sequence shipped as 300 PNGs at 1280x720, 287 MB in total, and the section
 * requested every one of them on mount. WebP at these quality settings holds the same
 * frame in roughly 4% of the bytes, which is the difference between a section that can
 * preload sensibly and one that cannot.
 *
 * The PNGs are left exactly where they are. This only writes new directories:
 *
 *   public/frames/about-sequence/            <- untouched PNG originals
 *   public/frames/about-sequence/w1280/      <- desktop WebP
 *   public/frames/about-sequence/w720/       <- mobile WebP
 *
 * Idempotent: a frame whose .webp already exists and is newer than its .png is skipped,
 * so re-running after adding or re-exporting a few frames only does the work that moved.
 * Pass --force to re-encode everything.
 *
 *   node scripts/convert-frames.mjs [--force]
 */

import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SRC = "public/frames/about-sequence";

/**
 * Two variants, not three. 1280 is the source width, so the desktop set is a re-encode
 * rather than a resize; 720 is the mobile set, chosen because a 3x phone showing a
 * ~400px-wide canvas is already oversampled at that width.
 *
 * Quality 78/70 came from a sweep on frames 0, 150 and 299 - the darkest, the busiest
 * and the last. Below about 70 the dust and the rock face start to band in the shadows,
 * which is exactly where this footage lives.
 */
const VARIANTS = [
  { dir: "w1280", width: 1280, quality: 78 },
  { dir: "w720", width: 720, quality: 70 },
];

/** Encode this many frames at once. Enough to saturate the cores, not enough to thrash. */
const CONCURRENCY = 8;

const force = process.argv.includes("--force");

async function main() {
  if (!existsSync(SRC)) {
    console.error(`Source directory not found: ${SRC}`);
    process.exit(1);
  }

  const frames = (await readdir(SRC))
    .filter((f) => f.endsWith(".png"))
    .sort();

  if (frames.length === 0) {
    console.error(`No PNG frames in ${SRC}`);
    process.exit(1);
  }

  console.log(`${frames.length} source frames`);

  for (const variant of VARIANTS) {
    const outDir = path.join(SRC, variant.dir);
    await mkdir(outDir, { recursive: true });

    let written = 0;
    let skipped = 0;
    let bytes = 0;

    // A sliding window rather than Promise.all over all 300: sharp holds the decoded
    // bitmap while it encodes, and 300 concurrent 1280x720 buffers is a memory spike
    // for no throughput gain.
    let cursor = 0;
    const workers = Array.from({ length: CONCURRENCY }, async () => {
      while (cursor < frames.length) {
        const frame = frames[cursor++];
        const src = path.join(SRC, frame);
        const out = path.join(outDir, frame.replace(/\.png$/, ".webp"));

        if (!force && existsSync(out)) {
          const [a, b] = await Promise.all([stat(src), stat(out)]);
          if (b.mtimeMs >= a.mtimeMs) {
            skipped += 1;
            bytes += b.size;
            continue;
          }
        }

        const buf = await sharp(src)
          .resize({ width: variant.width, withoutEnlargement: true })
          .webp({ quality: variant.quality, effort: 5 })
          .toBuffer();

        await writeFile(out, buf);
        written += 1;
        bytes += buf.length;
      }
    });

    await Promise.all(workers);

    console.log(
      `  ${variant.dir}: ${written} encoded, ${skipped} up to date, ` +
        `${(bytes / 1024 / 1024).toFixed(1)} MB total ` +
        `(${(bytes / frames.length / 1024).toFixed(0)} KB average)`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
