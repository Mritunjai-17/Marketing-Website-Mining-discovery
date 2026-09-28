/**
 * Encodes the About section's 1080p scroll sequence from JPEG to WebP.
 *
 * Source: src/mining_discovery_300_frames_1080p/ (frame_001.jpg .. frame_300.jpg)
 *
 * Output targets:
 *   1. src/mining_discovery_frames_30fps/   <- 1080p WebP (frame_0000.webp .. frame_0299.webp)
 *   2. public/frames/about-sequence/w1920/   <- 1920w WebP for crisp 1080p desktop display
 *   3. public/frames/about-sequence/w1280/   <- 1280w WebP for tablet/medium displays
 *   4. public/frames/about-sequence/w720/    <- 720w WebP for mobile displays
 */

import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SRC_DIR = "src/mining_discovery_300_frames_1080p";
const TARGET_30FPS_DIR = "src/mining_discovery_frames_30fps";
const PUBLIC_ABOUT_DIR = "public/frames/about-sequence";

const VARIANTS = [
  { dir: TARGET_30FPS_DIR, width: null, quality: 88 }, // 1080p native
  { dir: path.join(PUBLIC_ABOUT_DIR, "w1920"), width: 1920, quality: 90 }, // Desktop crisp 1080p
  { dir: path.join(PUBLIC_ABOUT_DIR, "w1280"), width: 1280, quality: 85 }, // Tablet
  { dir: path.join(PUBLIC_ABOUT_DIR, "w720"), width: 720, quality: 80 },   // Mobile
];

const CONCURRENCY = 8;

async function main() {
  if (!existsSync(SRC_DIR)) {
    console.error(`Source directory not found: ${SRC_DIR}`);
    process.exit(1);
  }

  const files = (await readdir(SRC_DIR))
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || "0", 10);
      const numB = parseInt(b.match(/\d+/)?.[0] || "0", 10);
      return numA - numB;
    });

  if (files.length === 0) {
    console.error(`No source frame files found in ${SRC_DIR}`);
    process.exit(1);
  }

  console.log(`Found ${files.length} source frames in ${SRC_DIR}`);

  for (const variant of VARIANTS) {
    await mkdir(variant.dir, { recursive: true });
  }

  for (const variant of VARIANTS) {
    console.log(`Processing variant target: ${variant.dir}...`);
    let cursor = 0;
    let written = 0;
    let totalBytes = 0;

    const workers = Array.from({ length: CONCURRENCY }, async () => {
      while (cursor < files.length) {
        const index = cursor++;
        const srcFile = files[index];
        const srcPath = path.join(SRC_DIR, srcFile);
        const outName = `frame_${String(index).padStart(4, "0")}.webp`;
        const outPath = path.join(variant.dir, outName);

        let pipeline = sharp(srcPath);
        if (variant.width) {
          pipeline = pipeline.resize({ width: variant.width, withoutEnlargement: true });
        }

        const buf = await pipeline.webp({ quality: variant.quality, effort: 5 }).toBuffer();
        await writeFile(outPath, buf);
        written += 1;
        totalBytes += buf.length;
      }
    });

    await Promise.all(workers);
    console.log(
      `  -> Done: ${written} files written, ${(totalBytes / 1024 / 1024).toFixed(2)} MB total`
    );
  }

  console.log("Frame conversion complete!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
