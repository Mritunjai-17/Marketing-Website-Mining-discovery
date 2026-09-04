import sharp from "sharp";
import { writeFileSync } from "node:fs";

const W = 96, H = 54, N = 300;
const dir = "public/frames/about-sequence/w1280/";

// Per-cell mean luminance and mean gradient magnitude on a 3x3 grid.
// Bright OR busy = the subject. Dark AND smooth = safe for typography.
function stats(buf) {
  const cell = (c0, c1, r0, r1) => {
    let sum = 0, grad = 0, n = 0;
    for (let y = r0; y < r1; y++) {
      for (let x = c0; x < c1; x++) {
        const v = buf[y * W + x];
        sum += v; n++;
        if (x + 1 < c1) grad += Math.abs(v - buf[y * W + x + 1]);
        if (y + 1 < r1) grad += Math.abs(v - buf[(y + 1) * W + x]);
      }
    }
    return { luma: sum / n / 255, detail: grad / n / 255 };
  };
  const cx = [0, W / 3 | 0, (2 * W / 3) | 0, W];
  const cy = [0, H / 3 | 0, (2 * H / 3) | 0, H];
  const g = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) g.push(cell(cx[c], cx[c + 1], cy[r], cy[r + 1]));
  return {
    grid: g,
    left:   cell(0, (W / 3) | 0, 0, H),
    right:  cell(((2 * W) / 3) | 0, W, 0, H),
    bottom: cell(0, W, ((2 * H) / 3) | 0, H),
    all:    cell(0, W, 0, H),
  };
}

const rows = [];
for (let i = 0; i < N; i++) {
  const f = dir + "frame_" + String(i).padStart(4, "0") + ".webp";
  const buf = await sharp(f).resize(W, H, { fit: "fill" }).greyscale().raw().toBuffer();
  rows.push({ i, ...stats(buf) });
}

// "Quiet" = dark and smooth. Higher is better for placing type.
const quiet = (z) => (1 - z.luma) * 0.55 + (1 - Math.min(1, z.detail * 6)) * 0.45;
for (const r of rows) {
  r.qL = quiet(r.left); r.qR = quiet(r.right); r.qB = quiet(r.bottom);
  r.best = r.qL >= r.qR && r.qL >= r.qB ? "LEFT" : r.qR >= r.qB ? "RIGHT" : "BOTTOM";
  // Where is the mass of detail, left vs right?
  r.bias = (r.right.detail + r.right.luma) - (r.left.detail + r.left.luma);
}
writeFileSync(process.argv[2] || "frames.json", JSON.stringify(rows));

console.log("frame | left quiet | right quiet | bottom quiet | subject side | best zone");
for (let i = 0; i < N; i += 15) {
  const r = rows[i];
  console.log(
    String(r.i).padStart(5) + " | " +
    r.qL.toFixed(3).padStart(10) + " | " + r.qR.toFixed(3).padStart(11) + " | " + r.qB.toFixed(3).padStart(12) + " | " +
    (r.bias > 0.02 ? "RIGHT" : r.bias < -0.02 ? "LEFT " : "even ").padStart(12) + " | " + r.best
  );
}
