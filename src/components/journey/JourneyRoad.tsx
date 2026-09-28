"use client";

import React, { useEffect, useRef } from "react";
import styles from "./Journey2D.module.css";
import { SIGNAL_RUN } from "./journeyChapters";
import { roadX, smoothstep, type SceneState, type StageMetrics } from "./journeySideView";
import { useJourneyFrame } from "./journeyScroll";

/**
 * The carriageway, seen from the side.
 *
 * A band rather than a converging ribbon: this camera is beside the road, so
 * there is no vanishing point and the surface is a horizontal strip with a far
 * edge, a near edge and everything on it sliding right to left.
 *
 * Canvas, because this is the one layer whose *contents* move every frame —
 * dashes, guard-rail posts and a dozen lamps all shifting with the camera.
 * Expressing that as DOM would mean rewriting a hundred elements sixty times a
 * second; as canvas it is a few hundred fills, which is nothing. Everything
 * else in the scene stays in SVG and CSS where transform-only animation keeps
 * it on the compositor.
 */

/** World spacing between centre dashes, and the painted fraction of each. */
const DASH_SPACING = 9;
const DASH_DUTY = 0.44;

/*
 * World spacing between lamp posts.
 *
 * Exported so the truck can light itself from the same lamps that are drawn
 * here. Two copies of this number would drift the moment either moved, and
 * the warm wash across the cab is only convincing while it peaks under an
 * actual lamp head.
 */
export const LAMP_SPACING = 46;
const RAIL_SPACING = 11;

function drawRoad(ctx: CanvasRenderingContext2D, scene: SceneState, dpr: number) {
  const m = scene.metrics;
  const { width, height, roadFarY, roadNearY, pxPerUnit } = m;
  const band = roadNearY - roadFarY;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  /* ---------------------------------------------------------- verge */

  // A strip of ground above the road, tying the carriageway to the treeline.
  const verge = ctx.createLinearGradient(0, roadFarY - band * 0.55, 0, roadFarY);
  verge.addColorStop(0, "#0a1522");
  verge.addColorStop(1, "#111d2c");
  ctx.fillStyle = verge;
  ctx.fillRect(0, roadFarY - band * 0.55, width, band * 0.55);

  /* -------------------------------------------------------- surface */

  /*
   * The surface is lighter at its far edge and darkest at the near one. That
   * is the direction real asphalt grades under a low sky — it picks up more
   * sky further away — and getting it the right way round is most of what
   * makes a flat band read as a receding surface rather than a stripe.
   */
  const surface = ctx.createLinearGradient(0, roadFarY, 0, roadNearY);
  surface.addColorStop(0, "#2b4260");
  surface.addColorStop(0.25, "#1d2d43");
  surface.addColorStop(1, "#0f1826");
  ctx.fillStyle = surface;
  ctx.fillRect(0, roadFarY, width, band);

  // Near apron, below the carriageway: the shoulder closest to camera.
  ctx.fillStyle = "#070d16";
  ctx.fillRect(0, roadNearY, width, height - roadNearY);

  /* -------------------------------------------------------- markings */

  // Continuous edge lines along both sides of the band.
  ctx.fillStyle = "rgba(206, 218, 236, 0.5)";
  ctx.fillRect(0, roadFarY + band * 0.08, width, Math.max(1, band * 0.012));
  ctx.fillStyle = "rgba(206, 218, 236, 0.32)";
  ctx.fillRect(0, roadNearY - band * 0.1, width, Math.max(1, band * 0.012));

  /*
   * Centre dashes, anchored to world position rather than to the camera. They
   * travel right to left at exactly the rate the camera advances, which is the
   * single strongest cue that the scene is moving at all.
   */
  const dashY = roadFarY + band * 0.48;
  const dashH = Math.max(1.5, band * 0.026);
  const firstDash = Math.floor(scene.cameraX / DASH_SPACING) - 1;
  const lastDash = Math.ceil((scene.cameraX + width / pxPerUnit) / DASH_SPACING) + 1;
  ctx.fillStyle = "rgba(230, 220, 190, 0.62)";
  for (let n = firstDash; n <= lastDash; n++) {
    const x = roadX(scene, n * DASH_SPACING);
    ctx.fillRect(x, dashY, DASH_SPACING * DASH_DUTY * pxPerUnit, dashH);
  }

  /* ---------------------------------------------------------- rail */

  // Guard rail along the far edge: a continuous beam on regular posts with amber safety reflectors.
  const railY = roadFarY - band * 0.16;
  ctx.fillStyle = "rgba(130, 150, 180, 0.38)";
  ctx.fillRect(0, railY, width, Math.max(1.2, band * 0.022));
  // Bottom flange of W-beam guardrail
  ctx.fillStyle = "rgba(70, 85, 110, 0.45)";
  ctx.fillRect(0, railY + band * 0.02, width, Math.max(1, band * 0.012));

  const firstPost = Math.floor(scene.cameraX / RAIL_SPACING) - 1;
  const lastPost = Math.ceil((scene.cameraX + width / pxPerUnit) / RAIL_SPACING) + 1;
  for (let n = firstPost; n <= lastPost; n++) {
    const x = roadX(scene, n * RAIL_SPACING);
    ctx.fillStyle = "rgba(90, 106, 130, 0.42)";
    ctx.fillRect(x, railY, Math.max(1.2, band * 0.02), band * 0.17);
    // Amber safety reflector on every second post
    if (n % 2 === 0) {
      ctx.fillStyle = "rgba(255, 180, 40, 0.85)";
      ctx.fillRect(x + 0.5, railY + band * 0.005, 2, band * 0.015);
    }
  }

  /* --------------------------------------------------------- lamps */

  /*
   * Streetlights matching reference screenshot:
   * 1. Curved arched highway poles reaching over carriageway
   * 2. Warm golden luminaire heads with radiant halos
   * 3. Downward soft conical light beam cones
   * 4. Wet asphalt specular reflection streaks
   */
  const firstLamp = Math.floor(scene.cameraX / LAMP_SPACING) - 1;
  const lastLamp = Math.ceil((scene.cameraX + width / pxPerUnit) / LAMP_SPACING) + 1;
  const lampH = band * 1.65;

  for (let n = firstLamp; n <= lastLamp; n++) {
    const worldX = n * LAMP_SPACING;
    const x = roadX(scene, worldX);
    if (x < -120 || x > width + 120) continue;

    const baseY = roadFarY - band * 0.05;
    const headY = baseY - lampH;
    const hx = x + band * 0.42;
    const hy = headY + band * 0.04;

    // Gracefully curved arched pole reaching out over the highway
    ctx.strokeStyle = "rgba(85, 105, 135, 0.78)";
    ctx.lineWidth = Math.max(1.2, band * 0.024);
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.lineTo(x, headY + lampH * 0.32);
    ctx.quadraticCurveTo(x, headY, hx, hy);
    ctx.stroke();

    // Luminaire horizontal fixture head
    ctx.strokeStyle = "rgba(110, 130, 160, 0.9)";
    ctx.lineWidth = Math.max(1.8, band * 0.032);
    ctx.beginPath();
    ctx.moveTo(hx - band * 0.06, hy - band * 0.01);
    ctx.lineTo(hx + band * 0.08, hy + band * 0.01);
    ctx.stroke();

    // Proximity to the truck, in world units.
    const nearness = 1 - smoothstep(6, 46, Math.abs(worldX - scene.truckWorldX));
    const intensity = 0.42 + nearness * 0.58;

    // 1. Soft downward conical light beam from the lamp toward the highway
    const beam = ctx.createLinearGradient(hx, hy, hx, roadFarY + band * 0.85);
    beam.addColorStop(0, `rgba(255, 215, 140, ${(0.32 * intensity).toFixed(3)})`);
    beam.addColorStop(0.3, `rgba(255, 185, 90, ${(0.14 * intensity).toFixed(3)})`);
    beam.addColorStop(0.7, `rgba(240, 160, 60, ${(0.06 * intensity).toFixed(3)})`);
    beam.addColorStop(1, "rgba(220, 140, 40, 0)");
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(hx - band * 0.06, hy);
    ctx.lineTo(hx + band * 0.08, hy);
    ctx.lineTo(hx + band * 0.75, roadFarY + band * 0.95);
    ctx.lineTo(hx - band * 0.55, roadFarY + band * 0.95);
    ctx.closePath();
    ctx.fill();

    // 2. Wide warm glowing halo around the lamp head
    const glowR = band * (0.65 + nearness * 0.45);
    const halo = ctx.createRadialGradient(hx, hy, 0, hx, hy, glowR);
    halo.addColorStop(0, `rgba(255, 235, 175, ${(0.55 * intensity).toFixed(3)})`);
    halo.addColorStop(0.3, `rgba(255, 180, 85, ${(0.22 * intensity).toFixed(3)})`);
    halo.addColorStop(0.7, `rgba(225, 140, 55, ${(0.06 * intensity).toFixed(3)})`);
    halo.addColorStop(1, "rgba(210, 130, 45, 0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(hx, hy, glowR, 0, Math.PI * 2);
    ctx.fill();

    // 3. Bright core lamp bulb
    ctx.fillStyle = `rgba(255, 248, 220, ${(0.8 + intensity * 0.2).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(hx, hy, Math.max(1.8, band * 0.038), 0, Math.PI * 2);
    ctx.fill();

    // 4. Wet asphalt specular light pool on the surface beneath each lamp
    const pool = ctx.createRadialGradient(hx, roadFarY + band * 0.55, 0, hx, roadFarY + band * 0.55, band * 1.25);
    pool.addColorStop(0, `rgba(255, 195, 105, ${(0.24 * intensity).toFixed(3)})`);
    pool.addColorStop(0.35, `rgba(235, 155, 75, ${(0.11 * intensity).toFixed(3)})`);
    pool.addColorStop(0.7, `rgba(210, 130, 50, ${(0.03 * intensity).toFixed(3)})`);
    pool.addColorStop(1, "rgba(200, 120, 40, 0)");
    ctx.fillStyle = pool;
    ctx.beginPath();
    ctx.ellipse(hx, roadFarY + band * 0.55, band * 1.25, band * 0.48, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wet asphalt light streak (vertical elongation from surface reflection)
    const streak = ctx.createLinearGradient(hx, roadFarY, hx, roadNearY);
    streak.addColorStop(0, "rgba(255, 210, 130, 0)");
    streak.addColorStop(0.4, `rgba(255, 200, 110, ${(0.15 * intensity).toFixed(3)})`);
    streak.addColorStop(0.7, `rgba(235, 160, 75, ${(0.08 * intensity).toFixed(3)})`);
    streak.addColorStop(1, "rgba(210, 130, 50, 0)");
    ctx.fillStyle = streak;
    ctx.fillRect(hx - band * 0.18, roadFarY + band * 0.2, band * 0.36, band * 0.7);
  }

  /* -------------------------------------------------------- signal */

  /*
   * The signal: a thin gold line that leaves the billboard and runs right
   * along the carriageway. This is the story's physical-to-digital hinge, and
   * it is drawn on the road itself rather than over it — the light is
   * travelling *on* the route, not floating above it.
   */
  const run = smoothstep(SIGNAL_RUN.from, SIGNAL_RUN.to, scene.progress);
  if (run > 0.001) {
    const headWorld = 980 + run * 900;
    const tailWorld = headWorld - 220;
    const hx = roadX(scene, headWorld);
    const tx = roadX(scene, tailWorld);
    const y = roadFarY + band * 0.3;

    const trail = ctx.createLinearGradient(tx, 0, hx, 0);
    trail.addColorStop(0, "rgba(212, 175, 55, 0)");
    trail.addColorStop(0.75, "rgba(212, 175, 55, 0.5)");
    trail.addColorStop(1, "rgba(240, 211, 134, 0.95)");
    ctx.fillStyle = trail;
    ctx.fillRect(tx, y, hx - tx, Math.max(1.2, band * 0.022));

    // A soft head, so the line reads as something travelling rather than drawn.
    const head = ctx.createRadialGradient(hx, y, 0, hx, y, band * 0.5);
    head.addColorStop(0, "rgba(240, 211, 134, 0.5)");
    head.addColorStop(1, "rgba(240, 211, 134, 0)");
    ctx.fillStyle = head;
    ctx.beginPath();
    ctx.arc(hx, y, band * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

export const JourneyRoad: React.FC<{ metrics: StageMetrics }> = ({ metrics }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const dprRef = useRef(1);

  // Sizing lives in an effect, not the frame loop: resizing a canvas clears it
  // and is expensive, so it happens when the stage changes shape.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    dprRef.current = dpr;
    canvas.width = Math.round(metrics.width * dpr);
    canvas.height = Math.round(metrics.height * dpr);
    ctxRef.current = canvas.getContext("2d");
  }, [metrics.width, metrics.height]);

  useJourneyFrame((scene) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    drawRoad(ctx, scene, dprRef.current);
  });

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
};

export default JourneyRoad;
