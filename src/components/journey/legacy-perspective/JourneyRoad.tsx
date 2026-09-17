"use client";

import React, { useEffect, useRef } from "react";
import styles from "./Journey2D.module.css";
import {
  NEAR,
  ROAD_FAR,
  ROAD_HALF_WIDTH,
  clarity,
  project,
  relativeRoadX,
  type SceneState,
  type StageMetrics,
} from "./journeyPerspective";
import { useJourneyFrame } from "./journeyScroll";

/**
 * The road, its markings, barriers and lights.
 *
 * This is the one layer drawn to a canvas, and the reason is specific: it is
 * the only thing in the scene whose *shape* changes every frame. The highway
 * winds, so as the camera advances the ribbon's outline is genuinely different
 * each tick, and so is the position of every dash and lamp on it. Expressing
 * that as DOM would mean rewriting an SVG path plus a hundred elements sixty
 * times a second; as canvas it is a few hundred fills, which is nothing.
 *
 * Everything else in the scene stays in CSS and SVG, where transform-only
 * animation keeps it on the compositor.
 */

/** World spacing between centre-line dashes, and the painted fraction of each. */
const DASH_SPACING = 17;
const DASH_DUTY = 0.42;

/** World spacing between lamp posts. They alternate sides. */
const LAMP_SPACING = 62;
const LAMP_HEIGHT = 9.4;
const LAMP_OFFSET = ROAD_HALF_WIDTH + 3.6;

/** Steps used to sweep the road ribbon. */
const RIBBON_STEPS = 60;

/**
 * Samples distances logarithmically between NEAR and FAR.
 *
 * Even steps in world distance would bunch almost every sample into the last
 * few pixels before the horizon and leave the foreground — where the road is
 * hundreds of pixels wide — described by two points. Log spacing puts the
 * samples at roughly even *screen* intervals instead, which is what keeps the
 * near edge smooth without wasting work on the far end.
 */
function sampleZ(index: number): number {
  const t = index / RIBBON_STEPS;
  return NEAR * Math.pow(ROAD_FAR / NEAR, t);
}

interface Edge {
  lx: number;
  rx: number;
  y: number;
  scale: number;
  z: number;
}

function buildEdges(scene: SceneState, halfWidth: number): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i <= RIBBON_STEPS; i++) {
    const z = sampleZ(i);
    const lateral = relativeRoadX(scene, z);
    const left = project(z, lateral - halfWidth, 0, scene.metrics);
    const right = project(z, lateral + halfWidth, 0, scene.metrics);
    edges.push({ lx: left.x, rx: right.x, y: left.y, scale: left.scale, z });
  }
  return edges;
}

function ribbonPath(ctx: CanvasRenderingContext2D, edges: Edge[]) {
  ctx.beginPath();
  ctx.moveTo(edges[0].lx, edges[0].y);
  for (let i = 1; i < edges.length; i++) ctx.lineTo(edges[i].lx, edges[i].y);
  for (let i = edges.length - 1; i >= 0; i--) ctx.lineTo(edges[i].rx, edges[i].y);
  ctx.closePath();
}

/** Projects a world-space quad lying flat on the road and fills it. */
function fillRoadQuad(
  ctx: CanvasRenderingContext2D,
  scene: SceneState,
  zNear: number,
  zFar: number,
  lateralOffset: number,
  halfWidth: number,
  fill: string,
) {
  if (zFar <= NEAR) return;
  const near = Math.max(zNear, NEAR);

  const nearLateral = relativeRoadX(scene, near) + lateralOffset;
  const farLateral = relativeRoadX(scene, zFar) + lateralOffset;

  const a = project(near, nearLateral - halfWidth, 0, scene.metrics);
  const b = project(near, nearLateral + halfWidth, 0, scene.metrics);
  const c = project(zFar, farLateral + halfWidth, 0, scene.metrics);
  const d = project(zFar, farLateral - halfWidth, 0, scene.metrics);

  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(d.x, d.y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawRoad(ctx: CanvasRenderingContext2D, scene: SceneState, dpr: number) {
  const { width, height } = scene.metrics;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const edges = buildEdges(scene, ROAD_HALF_WIDTH);
  const shoulders = buildEdges(scene, ROAD_HALF_WIDTH + 3.2);

  /* -------------------------------------------------- shoulder and surface */

  ribbonPath(ctx, shoulders);
  ctx.fillStyle = "#0a1220";
  ctx.fill();

  /*
   * The surface gradient runs from the horizon down to the foreground. Asphalt
   * lit only by dusk and lamps is lighter far away — it is picking up the sky
   * — and darkest right under the camera. Getting that the right way round is
   * most of what makes the road read as a surface receding rather than a
   * flat grey wedge.
   */
  const surface = ctx.createLinearGradient(0, scene.metrics.horizonY, 0, height);
  surface.addColorStop(0, "#27405e");
  surface.addColorStop(0.18, "#1b2c44");
  surface.addColorStop(0.55, "#131e30");
  surface.addColorStop(1, "#0d1522");
  ribbonPath(ctx, edges);
  ctx.fillStyle = surface;
  ctx.fill();

  /* ------------------------------------------------------------- markings */

  // Continuous edge lines, drawn as quads per step so they follow the bend.
  for (let i = 0; i < edges.length - 1; i++) {
    const zNear = edges[i].z;
    const zFar = edges[i + 1].z;
    const fade = 0.34 + clarity(zNear) * 0.5;
    const paint = `rgba(206, 218, 236, ${fade.toFixed(3)})`;
    fillRoadQuad(ctx, scene, zNear, zFar, -(ROAD_HALF_WIDTH - 0.9), 0.16, paint);
    fillRoadQuad(ctx, scene, zNear, zFar, ROAD_HALF_WIDTH - 0.9, 0.16, paint);
  }

  // Centre dashes. Anchored to world distance, not to the camera, so they
  // travel toward the viewer at exactly the rate the camera advances — which
  // is the single strongest cue that the scene is moving forward at all.
  const firstDash = Math.floor((scene.travel + NEAR) / DASH_SPACING);
  const lastDash = Math.ceil((scene.travel + ROAD_FAR) / DASH_SPACING);
  for (let n = firstDash; n <= lastDash; n++) {
    const worldZ = n * DASH_SPACING;
    const zNear = worldZ - scene.travel;
    const zFar = zNear + DASH_SPACING * DASH_DUTY;
    if (zFar <= NEAR || zNear > ROAD_FAR) continue;
    const fade = 0.3 + clarity(zNear) * 0.55;
    fillRoadQuad(ctx, scene, zNear, zFar, 0, 0.2, `rgba(226, 214, 184, ${fade.toFixed(3)})`);
  }

  /* ------------------------------------------------------------- barriers */

  // A low barrier along each shoulder, drawn as a vertical strip: one edge on
  // the ground, one at barrier height. It gives the road's edge a real profile
  // and catches the lamp light, which is what stops the ribbon looking painted
  // onto the ground.
  for (let i = 0; i < edges.length - 1; i++) {
    const zA = edges[i].z;
    const zB = edges[i + 1].z;
    if (zB > 520) break;
    const fade = 0.25 + clarity(zA) * 0.6;

    for (const side of [-1, 1]) {
      const offset = side * (ROAD_HALF_WIDTH + 2.4);
      const aBase = project(zA, relativeRoadX(scene, zA) + offset, 0, scene.metrics);
      const aTop = project(zA, relativeRoadX(scene, zA) + offset, 0.95, scene.metrics);
      const bBase = project(zB, relativeRoadX(scene, zB) + offset, 0, scene.metrics);
      const bTop = project(zB, relativeRoadX(scene, zB) + offset, 0.95, scene.metrics);

      ctx.beginPath();
      ctx.moveTo(aBase.x, aBase.y);
      ctx.lineTo(aTop.x, aTop.y);
      ctx.lineTo(bTop.x, bTop.y);
      ctx.lineTo(bBase.x, bBase.y);
      ctx.closePath();
      ctx.fillStyle = `rgba(122, 140, 166, ${(fade * 0.34).toFixed(3)})`;
      ctx.fill();
    }
  }

  /* ---------------------------------------------------------------- lamps */

  /*
   * Drawn far-to-near so nearer poles overlap further ones correctly, and so
   * each lamp's glow lands on top of the road it is lighting rather than
   * under it.
   */
  const firstLamp = Math.floor((scene.travel + NEAR) / LAMP_SPACING);
  const lastLamp = Math.ceil((scene.travel + ROAD_FAR) / LAMP_SPACING);

  for (let n = lastLamp; n >= firstLamp; n--) {
    const worldZ = n * LAMP_SPACING;
    const z = worldZ - scene.travel;
    if (z <= NEAR || z > ROAD_FAR) continue;

    const side = n % 2 === 0 ? 1 : -1;
    const lateral = relativeRoadX(scene, z) + side * LAMP_OFFSET;

    const base = project(z, lateral, 0, scene.metrics);
    const head = project(z, lateral, LAMP_HEIGHT, scene.metrics);
    // The arm reaches in over the carriageway, as motorway lighting does.
    const arm = project(z, lateral - side * 2.8, LAMP_HEIGHT, scene.metrics);

    const depth = clarity(z);
    const poleWidth = Math.max(0.6, base.scale * 0.2);

    // Column.
    ctx.strokeStyle = `rgba(58, 74, 100, ${(0.25 + depth * 0.55).toFixed(3)})`;
    ctx.lineWidth = poleWidth;
    ctx.beginPath();
    ctx.moveTo(base.x, base.y);
    ctx.lineTo(head.x, head.y);
    ctx.lineTo(arm.x, arm.y);
    ctx.stroke();

    // Lamp head and its halo. The halo is a radial gradient rather than a
    // blur filter — filters on canvas are expensive per frame, a gradient is
    // effectively free, and at these sizes they are indistinguishable.
    const lampRadius = Math.max(1, base.scale * 0.42);
    const glowRadius = lampRadius * 9;
    const glowAlpha = (0.1 + depth * 0.34).toFixed(3);

    const halo = ctx.createRadialGradient(arm.x, arm.y, 0, arm.x, arm.y, glowRadius);
    halo.addColorStop(0, `rgba(255, 216, 150, ${glowAlpha})`);
    halo.addColorStop(0.35, `rgba(226, 168, 88, ${(Number(glowAlpha) * 0.32).toFixed(3)})`);
    halo.addColorStop(1, "rgba(212, 160, 80, 0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(arm.x, arm.y, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(255, 232, 186, ${(0.45 + depth * 0.5).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(arm.x, arm.y, lampRadius, 0, Math.PI * 2);
    ctx.fill();

    /*
     * A pool of light on the road beneath each lamp, and the wet-looking
     * vertical smear of its reflection. Two ellipses, and between them they do
     * more for the "premium cinematic highway" read than any amount of extra
     * geometry would.
     */
    const pool = project(z, relativeRoadX(scene, z) + side * (LAMP_OFFSET - 2.8), 0, scene.metrics);
    const poolGlow = ctx.createRadialGradient(pool.x, pool.y, 0, pool.x, pool.y, base.scale * 7);
    poolGlow.addColorStop(0, `rgba(226, 174, 98, ${(0.16 * depth).toFixed(3)})`);
    poolGlow.addColorStop(1, "rgba(226, 174, 98, 0)");
    ctx.fillStyle = poolGlow;
    ctx.beginPath();
    ctx.ellipse(pool.x, pool.y, base.scale * 7, base.scale * 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

export const JourneyRoad: React.FC<{ metrics: StageMetrics }> = ({ metrics }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const dprRef = useRef(1);

  // Sizing lives in an effect, not the frame loop: resizing a canvas clears it
  // and is expensive, so it happens when the stage changes shape and not
  // sixty times a second.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Capped at 2: a 3x phone would otherwise rasterise nine times the pixels
    // for a scene whose detail is all soft gradients.
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
