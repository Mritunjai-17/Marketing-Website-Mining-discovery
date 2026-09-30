"use client";

import React, { useEffect, useRef, useImperativeHandle } from "react";

export interface RoadBuilderOverlayHandle {
  setProgress: (progress: number) => void;
}

export interface RoadBuilderOverlayProps {
  /** 0 to 1: road construction progress from left (0) to right (1) */
  progress?: number;
  /** Whether the overlay is active and visible */
  visible: boolean;
  className?: string;
  style?: React.CSSProperties;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  color: string;
}

/** Cross-browser compatible rounded rectangle */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Draws the sleek haulage truck traveling along the road */
function drawTruck(
  ctx: CanvasRenderingContext2D,
  truckX: number,
  truckY: number,
  angle: number,
  time: number,
  scale: number,
) {
  ctx.save();
  ctx.translate(truckX, truckY);
  ctx.rotate(angle);
  ctx.scale(scale, scale);

  const bob = Math.sin(time * 7) * 0.45;

  // 1. Headlight forward wash onto the asphalt ahead
  const beamGrad = ctx.createRadialGradient(150, 0, 8, 230, 0, 130);
  beamGrad.addColorStop(0, "rgba(255, 248, 220, 0.4)");
  beamGrad.addColorStop(0.35, "rgba(251, 191, 36, 0.18)");
  beamGrad.addColorStop(1, "rgba(251, 191, 36, 0)");
  ctx.save();
  ctx.fillStyle = beamGrad;
  ctx.beginPath();
  ctx.moveTo(130, -5);
  ctx.lineTo(270, -22);
  ctx.lineTo(280, 18);
  ctx.lineTo(130, 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 2. Soft Contact Ground Shadow under the wheels
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
  ctx.beginPath();
  ctx.ellipse(55, 2, 85, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 3. Truck Body Group (with suspension bob)
  ctx.save();
  ctx.translate(0, bob);

  // --- TRAILER (White / silver-grey container matching Image 2) ---
  const trailerW = 95;
  const trailerH = 30;
  const trailerX = -20;
  const trailerY = -34;

  const trailerGrad = ctx.createLinearGradient(trailerX, trailerY, trailerX, trailerY + trailerH);
  trailerGrad.addColorStop(0, "#FFFFFF");
  trailerGrad.addColorStop(0.3, "#F3F4F6");
  trailerGrad.addColorStop(0.85, "#E5E7EB");
  trailerGrad.addColorStop(1, "#D1D5DB");
  ctx.fillStyle = trailerGrad;
  drawRoundedRect(ctx, trailerX, trailerY, trailerW, trailerH, 2.5);
  ctx.fill();

  // Trailer roof trim
  ctx.fillStyle = "#9CA3AF";
  ctx.fillRect(trailerX, trailerY, trailerW, 1.8);

  // Gold Branding Text: MINING DISCOVERY (exact match to Image 2!)
  ctx.save();
  ctx.font = "800 6.5px 'Archivo', system-ui, sans-serif";
  ctx.letterSpacing = "0.08em";
  ctx.fillStyle = "#F59E0B";
  ctx.shadowColor = "rgba(245, 158, 11, 0.4)";
  ctx.shadowBlur = 2;
  ctx.fillText("MINING DISCOVERY", trailerX + 8, trailerY + 18);
  ctx.restore();

  // Trailer undercarriage skirt
  ctx.fillStyle = "#374151";
  ctx.fillRect(trailerX + 4, trailerY + trailerH, trailerW - 8, 3.5);

  // Red rear lamp
  ctx.fillStyle = "#EF4444";
  ctx.shadowColor = "#DC2626";
  ctx.shadowBlur = 4;
  ctx.fillRect(trailerX - 1.5, trailerY + trailerH - 8, 2, 5);

  // --- TRACTOR / CAB (Charcoal/slate matching Image 2) ---
  const cabX = trailerX + trailerW + 3;
  const cabW = 34;
  const cabH = 34;
  const cabY = -38;

  const cabGrad = ctx.createLinearGradient(cabX, cabY, cabX, cabY + cabH);
  cabGrad.addColorStop(0, "#475569");
  cabGrad.addColorStop(0.4, "#334155");
  cabGrad.addColorStop(1, "#1E293B");
  ctx.fillStyle = cabGrad;

  // Cab box
  drawRoundedRect(ctx, cabX, cabY + 6, cabW - 8, cabH - 6, 2.5);
  ctx.fill();

  // Front sloped hood & engine bay
  ctx.beginPath();
  ctx.moveTo(cabX + cabW - 8, cabY + 16);
  ctx.lineTo(cabX + cabW, cabY + 22);
  ctx.lineTo(cabX + cabW, cabY + cabH);
  ctx.lineTo(cabX + cabW - 8, cabY + cabH);
  ctx.closePath();
  ctx.fill();

  // Windshield (dark raked glass)
  ctx.fillStyle = "#0F172A";
  ctx.beginPath();
  ctx.moveTo(cabX + 14, cabY + 8);
  ctx.lineTo(cabX + cabW - 6, cabY + 16);
  ctx.lineTo(cabX + cabW - 8, cabY + 24);
  ctx.lineTo(cabX + 14, cabY + 24);
  ctx.closePath();
  ctx.fill();

  // Windshield specular highlight
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cabX + 16, cabY + 10);
  ctx.lineTo(cabX + cabW - 9, cabY + 17);
  ctx.stroke();

  // Chrome exhaust stack behind cab
  ctx.fillStyle = "#94A3B8";
  ctx.fillRect(cabX - 2, cabY - 4, 2.5, 18);
  ctx.fillStyle = "#64748B";
  ctx.fillRect(cabX - 2, cabY - 6, 2.5, 2);

  // Chrome side mirror
  ctx.fillStyle = "#334155";
  ctx.fillRect(cabX + cabW - 12, cabY + 15, 2, 7);

  // Headlight (glowing amber/white)
  ctx.fillStyle = "#FFFBEB";
  ctx.shadowColor = "#F59E0B";
  ctx.shadowBlur = 8;
  ctx.fillRect(cabX + cabW - 2, cabY + cabH - 12, 3, 5);

  // Bumper
  ctx.fillStyle = "#1E293B";
  ctx.shadowBlur = 0;
  ctx.fillRect(cabX + cabW - 4, cabY + cabH - 5, 5, 5);

  ctx.restore(); // end bob

  // 4. WHEELS (with rotation animation!)
  const wheelRadius = 6.8;
  const wheelPositions = [
    trailerX + 14,
    trailerX + 30,
    cabX + 8,
    cabX + cabW - 6,
  ];

  const wheelRotation = (truckX * 0.15) % (Math.PI * 2);

  wheelPositions.forEach((wx) => {
    const wy = 0;
    // Outer tire
    ctx.save();
    ctx.translate(wx, wy);
    ctx.fillStyle = "#111827";
    ctx.beginPath();
    ctx.arc(0, 0, wheelRadius, 0, Math.PI * 2);
    ctx.fill();

    // Wheel rim
    ctx.fillStyle = "#94A3B8";
    ctx.beginPath();
    ctx.arc(0, 0, wheelRadius * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Hubcap center
    ctx.fillStyle = "#334155";
    ctx.beginPath();
    ctx.arc(0, 0, wheelRadius * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // Rotating spoke marker
    ctx.rotate(wheelRotation);
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -wheelRadius * 0.55);
    ctx.lineTo(0, wheelRadius * 0.55);
    ctx.stroke();
    ctx.restore();
  });

  ctx.restore();
}

/**
 * Draws the underground mine portal exit archway on the left edge.
 * Gives physical origin to the road & truck emerging from Level -450M.
 */
function drawTunnelPortal(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  roadGeom: { topY: number; bottomY: number; centerY: number; halfH: number; angle: number },
  isMobile: boolean
) {
  const portalX = 0;
  const portalW = isMobile ? Math.min(140, width * 0.28) : Math.min(220, width * 0.18);
  const portalH = roadGeom.halfH * 3.2;
  const portalCenterY = roadGeom.centerY - roadGeom.halfH * 0.25;

  ctx.save();

  // 1. Deep Subterranean Cavern Void inside the tunnel
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(portalX, portalCenterY, portalW * 0.9, portalH * 0.65, 0, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.lineTo(-40, roadGeom.bottomY + 40);
  ctx.lineTo(-40, roadGeom.topY - portalH);
  ctx.closePath();

  const interiorGrad = ctx.createRadialGradient(
    portalX - 20,
    portalCenterY,
    10,
    portalX + 60,
    portalCenterY,
    portalW * 1.1
  );
  interiorGrad.addColorStop(0, "#020408");
  interiorGrad.addColorStop(0.6, "#060A12");
  interiorGrad.addColorStop(1, "rgba(8, 14, 24, 0.95)");
  ctx.fillStyle = interiorGrad;
  ctx.fill();

  // Ambient amber work light inside cavern
  const tunnelLightGrad = ctx.createRadialGradient(
    portalX + 20,
    portalCenterY - 10,
    4,
    portalX + 30,
    portalCenterY,
    portalW * 0.8
  );
  tunnelLightGrad.addColorStop(0, "rgba(245, 158, 11, 0.35)");
  tunnelLightGrad.addColorStop(0.5, "rgba(232, 100, 27, 0.12)");
  tunnelLightGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = tunnelLightGrad;
  ctx.fill();
  ctx.restore();

  // 2. Heavy Industrial Mine Portal Frame (Steel & Timber Arch)
  ctx.save();
  const archThick = isMobile ? 12 : 16;
  ctx.beginPath();
  ctx.ellipse(portalX, portalCenterY, portalW * 0.9 + archThick, portalH * 0.65 + archThick, 0, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.ellipse(portalX, portalCenterY, portalW * 0.9, portalH * 0.65, 0, Math.PI * 0.5, -Math.PI * 0.5, true);
  ctx.closePath();

  const steelGrad = ctx.createLinearGradient(0, portalCenterY - portalH, 0, roadGeom.bottomY);
  steelGrad.addColorStop(0, "#334155");
  steelGrad.addColorStop(0.5, "#1E293B");
  steelGrad.addColorStop(1, "#0F172A");
  ctx.fillStyle = steelGrad;
  ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
  ctx.shadowBlur = 12;
  ctx.fill();

  ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Industrial hazard stripes (Yellow / Black caution markings on portal arch)
  ctx.save();
  ctx.clip();
  ctx.fillStyle = "#EAB308";
  for (let s = -40; s < portalW + 40; s += 22) {
    ctx.beginPath();
    ctx.moveTo(s, portalCenterY - portalH);
    ctx.lineTo(s + 11, portalCenterY - portalH);
    ctx.lineTo(s - 14, roadGeom.bottomY + 40);
    ctx.lineTo(s - 25, roadGeom.bottomY + 40);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  ctx.restore();

  // 3. Telemetry Signplate mounted on portal: "PORTAL EXIT · LEVEL -450M"
  ctx.save();
  const signW = isMobile ? 115 : 155;
  const signH = isMobile ? 18 : 22;
  const signX = Math.max(8, portalW * 0.40);
  const signY = portalCenterY - portalH * 0.62;

  ctx.fillStyle = "rgba(11, 18, 32, 0.94)";
  ctx.strokeStyle = "rgba(245, 158, 11, 0.65)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  if (typeof (ctx as any).roundRect === "function") {
    (ctx as any).roundRect(signX, signY, signW, signH, 4);
  } else {
    drawRoundedRect(ctx, signX, signY, signW, signH, 4);
  }
  ctx.fill();
  ctx.stroke();

  ctx.font = isMobile ? "700 8px monospace" : "700 9.5px monospace";
  ctx.fillStyle = "#FBBF24";
  ctx.textBaseline = "middle";
  ctx.fillText("PORTAL EXIT · LEVEL -450M", signX + (isMobile ? 6 : 8), signY + signH / 2);
  ctx.restore();

  // 4. Amber safety warning beacon above portal
  ctx.save();
  const beaconX = portalX + portalW * 0.88;
  const beaconY = portalCenterY - portalH * 0.55;
  const pulse = 0.7 + 0.3 * Math.sin(performance.now() * 0.008);
  const beaconGlow = ctx.createRadialGradient(beaconX, beaconY, 1, beaconX, beaconY, 24);
  beaconGlow.addColorStop(0, `rgba(251, 191, 36, ${0.9 * pulse})`);
  beaconGlow.addColorStop(0.4, `rgba(232, 100, 27, ${0.4 * pulse})`);
  beaconGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = beaconGlow;
  ctx.beginPath();
  ctx.arc(beaconX, beaconY, 24, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#FEF3C7";
  ctx.beginPath();
  ctx.arc(beaconX, beaconY, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * Creative 3D Highway Builder with Alpha Channel.
 * Features a tilted highway emerging under 'Enter capital showcase'
 * with the haulage truck traveling slowly along the paved road.
 */
const RoadBuilderOverlayComponent = React.forwardRef<
  RoadBuilderOverlayHandle,
  RoadBuilderOverlayProps
>(function RoadBuilderOverlay(
  { progress = 0, visible, className = "", style = {} },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparksRef = useRef<Spark[]>([]);
  const pRef = useRef(progress);

  useImperativeHandle(
    ref,
    () => ({
      setProgress: (nextP: number) => {
        pRef.current = Math.max(0, Math.min(1, nextP));
      },
    }),
    []
  );

  useEffect(() => {
    pRef.current = Math.max(0, Math.min(1, progress));
  }, [progress]);

  useEffect(() => {
    if (!visible) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.parentElement?.clientHeight || window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", resize);

    /**
     * 3D Tilted Highway Geometry:
     * - Sits strictly UNDER 'Enter capital showcase' across both desktop and mobile screens.
     * - Has an upward perspective tilt from left to right matching the 3D scene.
     */
    const getRoadGeometry = (x: number) => {
      const w = width || 1400;
      const h = height || 900;
      const nx = Math.max(-0.1, Math.min(1.1, x / w));
      const isMobile = w < 768;

      // Responsive slope and vertical anchor: on mobile, road sits cleanly below compact copy
      const baseCenterFraction = isMobile ? 0.885 : 0.855;
      const tiltFraction = isMobile ? 0.038 : 0.055;

      const tiltOffset = -nx * (h * tiltFraction);
      const roadCenterY = h * baseCenterFraction + tiltOffset;
      const roadHalfH = isMobile
        ? Math.max(18, Math.min(32, h * 0.035))
        : Math.max(28, Math.min(48, h * 0.046));
      const angle = Math.atan2(-h * tiltFraction, w);

      return {
        topY: roadCenterY - roadHalfH,
        bottomY: roadCenterY + roadHalfH,
        centerY: roadCenterY,
        halfH: roadHalfH,
        angle,
      };
    };

    const render = () => {
      if (!ctx) return;
      const curP = pRef.current;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      if (!visible || curP <= 0.001) {
        ctx.restore();
        animId = requestAnimationFrame(render);
        return;
      }

      const headX = curP * (width + 60) - 20;

      // Spawn paving sparks at the leading construction blade
      if (curP > 0.01 && curP < 0.999) {
        const geom = getRoadGeometry(headX);
        const sparkCount = Math.floor(Math.random() * 3) + 2;
        const colors = ["#F59E0B", "#FBBF24", "#E8641B", "#FFFFFF", "#60A5FA"];
        for (let i = 0; i < sparkCount; i++) {
          const spawnY = geom.topY + Math.random() * (geom.bottomY - geom.topY);
          sparksRef.current.push({
            x: headX + (Math.random() - 0.5) * 6,
            y: spawnY,
            vx: -Math.random() * 4.5 - 1.2,
            vy: (Math.random() - 0.5) * 2.8,
            alpha: 0.9 + Math.random() * 0.1,
            size: Math.random() * 2.6 + 1.2,
            color: colors[Math.floor(Math.random() * colors.length)],
          });
        }
      }

      // 1. Clip path: only reveal road from left edge up to headX
      ctx.save();
      ctx.beginPath();
      ctx.rect(-40, 0, headX + 40, height);
      ctx.clip();

      const step = 24;
      const numSteps = Math.ceil(width / step) + 2;

      // 2. Road Foundation / Extruded Vertical Curb Wall & Drop Shadow (3D Depth)
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i <= numSteps; i++) {
        const x = i * step - 20;
        const g = getRoadGeometry(x);
        if (i === 0) ctx.moveTo(x, g.bottomY);
        else ctx.lineTo(x, g.bottomY);
      }
      for (let i = numSteps; i >= 0; i--) {
        const x = i * step - 20;
        const g = getRoadGeometry(x);
        const slabBottom = g.bottomY + g.halfH * 0.45;
        ctx.lineTo(x, slabBottom);
      }
      ctx.closePath();

      // 3D vertical face gradient: dark charcoal with shadow
      const curbGrad = ctx.createLinearGradient(0, height * 0.8, 0, height * 0.95);
      curbGrad.addColorStop(0, "#131b26");
      curbGrad.addColorStop(0.3, "#0d131c");
      curbGrad.addColorStop(1, "#05080d");
      ctx.fillStyle = curbGrad;
      ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 8;
      ctx.fill();

      // Highlight line on the bottom curb bevel edge
      ctx.strokeStyle = "rgba(71, 95, 128, 0.45)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i <= numSteps; i++) {
        const x = i * step - 20;
        const g = getRoadGeometry(x);
        if (i === 0) ctx.moveTo(x, g.bottomY);
        else ctx.lineTo(x, g.bottomY);
      }
      ctx.stroke();
      ctx.restore();

      // 3. Top Verge Shoulder (connecting road to background cavern)
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i <= numSteps; i++) {
        const x = i * step - 20;
        const g = getRoadGeometry(x);
        if (i === 0) ctx.moveTo(x, g.topY);
        else ctx.lineTo(x, g.topY);
      }
      for (let i = numSteps; i >= 0; i--) {
        const x = i * step - 20;
        const g = getRoadGeometry(x);
        const vergeTop = g.topY - g.halfH * 0.22;
        ctx.lineTo(x, vergeTop);
      }
      ctx.closePath();
      const vergeGrad = ctx.createLinearGradient(0, height * 0.74, 0, height * 0.84);
      vergeGrad.addColorStop(0, "rgba(10, 16, 24, 0.3)");
      vergeGrad.addColorStop(1, "rgba(24, 35, 48, 0.75)");
      ctx.fillStyle = vergeGrad;
      ctx.fill();
      ctx.restore();

      // 4. Main Asphalt Carriageway Surface (Tilted 3D plane)
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i <= numSteps; i++) {
        const x = i * step - 20;
        const g = getRoadGeometry(x);
        if (i === 0) ctx.moveTo(x, g.topY);
        else ctx.lineTo(x, g.topY);
      }
      for (let i = numSteps; i >= 0; i--) {
        const x = i * step - 20;
        const g = getRoadGeometry(x);
        ctx.lineTo(x, g.bottomY);
      }
      ctx.closePath();
      const asphaltGrad = ctx.createLinearGradient(0, height * 0.78, 0, height * 0.92);
      asphaltGrad.addColorStop(0, "#2c3e55"); // Sky specular reflection on far edge
      asphaltGrad.addColorStop(0.25, "#1c293a");
      asphaltGrad.addColorStop(0.75, "#121b26");
      asphaltGrad.addColorStop(1, "#0a1017"); // Dark near edge
      ctx.fillStyle = asphaltGrad;
      ctx.fill();
      ctx.restore();

      // 5. Solid White Continuous Edge Lines
      // Far white edge line
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i <= numSteps; i++) {
        const x = i * step - 20;
        const g = getRoadGeometry(x);
        const y = g.topY + g.halfH * 0.12;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = "rgba(224, 234, 248, 0.75)";
      ctx.stroke();

      // Near white edge line
      ctx.beginPath();
      for (let i = 0; i <= numSteps; i++) {
        const x = i * step - 20;
        const g = getRoadGeometry(x);
        const y = g.bottomY - g.halfH * 0.14;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = "rgba(224, 234, 248, 0.55)";
      ctx.stroke();
      ctx.restore();

      // 6. Dashed Highway Center Line (Golden-yellow highway markings)
      ctx.save();
      const dashLength = 34;
      const gapLength = 26;
      const dashCycle = dashLength + gapLength;
      const totalDist = width + 40;
      ctx.strokeStyle = "#FBBF24";
      ctx.lineWidth = 3.0;
      ctx.shadowColor = "rgba(251, 191, 36, 0.45)";
      ctx.shadowBlur = 4;

      for (let d = -20; d < totalDist; d += dashCycle) {
        const dStart = d;
        const dEnd = d + dashLength;
        if (dStart > headX) break;
        const actualEnd = Math.min(dEnd, headX);
        if (actualEnd <= dStart) continue;

        ctx.beginPath();
        const gStart = getRoadGeometry(dStart);
        const gEnd = getRoadGeometry(actualEnd);
        ctx.moveTo(dStart, gStart.centerY);
        ctx.lineTo(actualEnd, gEnd.centerY);
        ctx.stroke();
      }
      ctx.restore();

      // 7. Guardrail Posts along the top tilted curb with safety reflectors
      ctx.save();
      const postSpacing = 52;
      for (let px = 20; px < width; px += postSpacing) {
        if (px > headX) break;
        const g = getRoadGeometry(px);
        const postTopY = g.topY - g.halfH * 0.28;
        const postBotY = g.topY + 2;

        // Post upright
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(px, postBotY);
        ctx.lineTo(px, postTopY);
        ctx.stroke();

        // Top horizontal rail beam
        ctx.strokeStyle = "#64748B";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px - postSpacing * 0.5, postTopY + 3);
        ctx.lineTo(Math.min(headX, px + postSpacing * 0.5), postTopY + 3);
        ctx.stroke();

        // Amber reflector dot
        ctx.fillStyle = "#E8641B";
        ctx.shadowColor = "#F97316";
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(px, postTopY + 4, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // End clipping of road
      ctx.restore();

      // 7b. Underground Mine Portal Archway (Road physically emerges from the Level -450M mine tunnel)
      const isMobile = width < 768;
      drawTunnelPortal(ctx, width, height, getRoadGeometry(0), isMobile);

      // 8. Active Construction Paving Head (Tilted laser blade + Energy Glow)
      if (curP > 0.005 && curP < 0.999) {
        const headGeom = getRoadGeometry(headX);
        const bladeHalfLen = headGeom.halfH * 1.35;
        // Perpendicular angle to the road tilt
        const perpAngle = headGeom.angle + Math.PI / 2;
        const dx = Math.cos(perpAngle) * bladeHalfLen;
        const dy = Math.sin(perpAngle) * bladeHalfLen;

        const p1x = headX - dx;
        const p1y = headGeom.centerY - dy;
        const p2x = headX + dx;
        const p2y = headGeom.centerY + dy;

        // Angled luminous paving laser blade
        ctx.save();
        const laserGrad = ctx.createLinearGradient(p1x, p1y, p2x, p2y);
        laserGrad.addColorStop(0, "rgba(232, 100, 27, 0)");
        laserGrad.addColorStop(0.18, "rgba(245, 158, 11, 0.75)");
        laserGrad.addColorStop(0.5, "#FFFFFF");
        laserGrad.addColorStop(0.82, "rgba(232, 100, 27, 0.85)");
        laserGrad.addColorStop(1, "rgba(232, 100, 27, 0)");

        ctx.strokeStyle = laserGrad;
        ctx.lineWidth = 4.5;
        ctx.shadowColor = "#F59E0B";
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.moveTo(p1x, p1y);
        ctx.lineTo(p2x, p2y);
        ctx.stroke();

        // Leading glowing beacon light
        const headPulse = 0.8 + 0.2 * Math.sin(performance.now() * 0.012);
        const beaconGrad = ctx.createRadialGradient(
          headX,
          headGeom.centerY,
          2,
          headX,
          headGeom.centerY,
          headGeom.halfH * 1.1,
        );
        beaconGrad.addColorStop(0, `rgba(255, 245, 200, ${0.85 * headPulse})`);
        beaconGrad.addColorStop(0.3, `rgba(245, 158, 11, ${0.45 * headPulse})`);
        beaconGrad.addColorStop(0.7, `rgba(232, 100, 27, ${0.15 * headPulse})`);
        beaconGrad.addColorStop(1, "rgba(232, 100, 27, 0)");

        ctx.fillStyle = beaconGrad;
        ctx.beginPath();
        ctx.arc(headX, headGeom.centerY, headGeom.halfH * 1.1, 0, Math.PI * 2);
        ctx.fill();

        // Sleek compact HUD badge right above the paving head
        const isMobileScreen = width < 768;
        ctx.font = isMobileScreen ? "600 8.5px monospace" : "600 10px monospace";
        ctx.letterSpacing = isMobileScreen ? "0.10em" : "0.14em";
        ctx.fillStyle = "#FBBF24";
        ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
        ctx.shadowBlur = 4;
        const pctText = `ROAD PAVING ${Math.round(curP * 100)}%`;
        const badgeOffset = isMobileScreen ? 38 : 55;
        const badgeX = Math.max(8, Math.min(headX - badgeOffset, width - (isMobileScreen ? 85 : 120)));
        ctx.fillText(pctText, badgeX, p1y - 8);

        ctx.restore();
      }

      // 9. Haulage Truck Slowly Traveling on the Newly Built Road
      if (curP > 0.03) {
        const truckTravelP = Math.max(0, (curP - 0.03) / 0.97);
        const isMobileScreen = width < 768;
        const truckScale = isMobileScreen
          ? Math.max(0.48, Math.min(0.60, (width / 500) * 0.58))
          : Math.min(1.0, Math.max(0.65, (width / 1440) * 0.92));

        const startX = -130 * truckScale;
        const maxDist = isMobileScreen ? width * 0.48 : width * 0.44;
        // Truck enters from left and travels smoothly across the road behind the paving head
        const truckX = startX + truckTravelP * (maxDist - startX);
        const tGeom = getRoadGeometry(truckX + 60 * truckScale);
        const truckY = tGeom.centerY + tGeom.halfH * 0.16;

        drawTruck(ctx, truckX, truckY, tGeom.angle, performance.now() * 0.001, truckScale);
      }

      // 10. Spark Particles Update & Draw
      if (sparksRef.current.length > 0) {
        ctx.save();
        for (let i = sparksRef.current.length - 1; i >= 0; i--) {
          const s = sparksRef.current[i];
          s.x += s.vx;
          s.y += s.vy;
          s.vy += 0.07; // subtle gravity
          s.alpha -= 0.024;

          if (s.alpha <= 0.01) {
            sparksRef.current.splice(i, 1);
            continue;
          }

          ctx.fillStyle = s.color;
          ctx.globalAlpha = Math.max(0, Math.min(1, s.alpha));
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("orientationchange", resize);
    };
  }, [visible]);

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-30 h-full w-full overflow-hidden ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 0.2s ease-out",
        ...style,
      }}
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
});

RoadBuilderOverlayComponent.displayName = "RoadBuilderOverlay";

export const RoadBuilderOverlay = React.memo(RoadBuilderOverlayComponent);
export default RoadBuilderOverlay;
