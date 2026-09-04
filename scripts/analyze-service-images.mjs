/**
 * Scores the four ServicesScrollStory photographs for negative space, so the editorial
 * type can be placed where the subject is not. Same metric as analyze-frames.mjs:
 * quiet = dark (0.55) + smooth (0.45). Run: node scripts/analyze-service-images.mjs
 */
import sharp from "sharp";
const W = 96, H = 54;
const FILES = ["01-survey.jpg", "02-drill.jpg", "03-assay.jpg", "04-pit.jpg"];
const quiet = (z) => (1 - z.luma) * 0.55 + (1 - Math.min(1, z.detail * 6)) * 0.45;

for (const f of FILES) {
  const buf = await sharp("public/services/" + f).resize(W, H, { fit: "fill" }).greyscale().raw().toBuffer();
  const cell = (c0, c1, r0, r1) => {
    let sum = 0, grad = 0, n = 0;
    for (let y = r0; y < r1; y++) for (let x = c0; x < c1; x++) {
      const v = buf[y * W + x]; sum += v; n++;
      if (x + 1 < c1) grad += Math.abs(v - buf[y * W + x + 1]);
      if (y + 1 < r1) grad += Math.abs(v - buf[(y + 1) * W + x]);
    }
    return { luma: sum / n / 255, detail: grad / n / 255 };
  };
  const zones = {
    left: cell(0, (W / 3) | 0, 0, H),
    right: cell(((2 * W) / 3) | 0, W, 0, H),
    bottom: cell(0, W, ((2 * H) / 3) | 0, H),
  };
  const q = Object.fromEntries(Object.entries(zones).map(([k, v]) => [k, quiet(v)]));
  const best = Object.entries(q).sort((a, b) => b[1] - a[1]);
  console.log(
    f.padEnd(14) + Object.entries(q).map(([k, v]) => k + " " + v.toFixed(3)).join("   ") +
    "   -> " + best[0][0].toUpperCase() + "  (+" + (best[0][1] - best[1][1]).toFixed(3) + ")"
  );
}
