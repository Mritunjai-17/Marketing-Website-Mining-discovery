"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { buildEarthTextures } from "./earthTexture";
import {
  arcFragmentShader,
  arcVertexShader,
  atmosphereFragmentShader,
  atmosphereVertexShader,
  cloudFragmentShader,
  cloudVertexShader,
  earthFragmentShader,
  earthVertexShader,
  arcNodeVertexShader,
  arcNodeFragmentShader,
} from "./shaders";

export interface GlobeAnchor {
  id: string;
  lat: number;
  lng: number;
}

export interface ProjectedAnchor {
  id: string;
  /** Surface point, in CSS pixels relative to the canvas box. */
  x: number;
  y: number;
  /** Unit vector pointing radially away from the globe centre, in screen space. */
  dirX: number;
  dirY: number;
  /** 0 when the anchor has rotated onto the far side, 1 when it faces the camera. */
  opacity: number;
}

/**
 * A connection between two anchors, drawn as a great-circle arc in the earth's frame.
 *
 * Endpoints are given as anchor ids rather than coordinates so the arc cannot drift from
 * the marker it lands on: both read the same entry in `anchors`, and moving a region
 * moves its connections with it.
 */
export interface GlobeArc {
  id: string;
  fromId: string;
  toId: string;
  /**
   * Where this arc sits in the shared pulse cycle, 0..1. Spacing these unevenly is what
   * keeps the set from reading as a metronome.
   */
  phase: number;
  /** Set true to keep this arc on small viewports, where the set is thinned. */
  onMobile?: boolean;
}

/**
 * An orientation the globe can be aimed at, written through a ref so the hero can
 * retarget it every frame without re-rendering this component.
 */
export interface GlobeFocus {
  lat: number;
  lng: number;
  /**
   * Radians of extra upward pitch. Aiming alone puts the coordinate at the centre of
   * the projected disc, which sits below the container's crop in a horizon framing;
   * this lifts it into the part that is actually on screen. The caller owns it because
   * only the caller knows how much of the sphere its container leaves visible.
   */
  tiltBias: number;
  /** 0 = free drift, 1 = fully aimed. Blended, so entering focus never snaps. */
  weight: number;
}

export interface EarthGlobeProps {
  className?: string;
  style?: React.CSSProperties;
  /** Aim target, read every frame. Null or weight 0 leaves the globe drifting. */
  focusRef?: React.RefObject<GlobeFocus | null>;
  /** Geographic points the caller wants projected to screen space every frame. */
  anchors?: GlobeAnchor[];
  /** Connections to draw between anchors. Read once, when the scene is built. */
  arcs?: GlobeArc[];
  /**
   * Anchor the viewer is pointing at. Arcs touching it strengthen; every other arc holds
   * its resting weight. Eased inside the render loop, so changing it never snaps.
   */
  emphasisId?: string | null;
  /** Fired once per frame with projected anchors. Write to DOM refs here, never to state. */
  onProject?: (anchors: ProjectedAnchor[]) => void;
  /** Fired once the textures are built and the first frame has rendered. */
  onReady?: () => void;
  /** Seconds for one full revolution. */
  rotationPeriod?: number;
  /** Longitude facing the camera on first paint. */
  initialLongitude?: number;
  /**
   * Multiplier on the rotation speed, eased rather than applied instantly. 1 is the
   * normal drift; the hero drops it while a marker is hovered so the site stays under
   * the cursor without the globe snapping to a stop.
   */
  speedScale?: number;
}

/**
 * Id of the synthetic anchor reporting where the current focus point landed on screen.
 *
 * Solving for it analytically is not enough: the axial roll sits outside the pitch, so
 * it swings the tilt-bias offset sideways, and perspective bends the result again. The
 * projection already knows the answer exactly, so it reports it instead.
 */
export const FOCUS_ANCHOR_ID = "__focus";

/** Vertical field of view, kept narrow so a planet-scale sphere reads near-orthographic. */
const FOV = 20;
/**
 * Fraction of the canvas box the sphere silhouette fills, leaving room for the haze.
 * Exported so the hero can derive a canvas size from the sphere diameter it wants.
 */
export const GLOBE_FIT = 0.9;
const FIT = GLOBE_FIT;

/** Radians the spin axis leans, close to the real 23.4 degree obliquity. */
const AXIAL_TILT = THREE.MathUtils.degToRad(-19);
/**
 * Radians of pitch. The container only leaves a shallow cap of the sphere on screen, and
 * a negative pitch swings the populated northern mid-latitudes up into it — at 0 the cap
 * shows little but the Arctic, and GlobeHero's markers would sit below the crop for most
 * of every revolution. Tuned together with AXIAL_TILT (which is applied first, so the two
 * interact) to keep one to three markers on screen at all times.
 */
const VIEW_PITCH = THREE.MathUtils.degToRad(-15);

/**
 * Ambient light drift — the whole of the section's "atmospheric motion", and deliberately
 * the smallest moving part on screen.
 *
 * The sun vector swings AMBIENT_SUN_SWING radians either side of its rest direction on a
 * AMBIENT_SUN_PERIOD cycle: 3.2 degrees either way, 140 seconds a cycle, so the light
 * travels about 0.09 degrees a second against the planet's own 6.2. Under a seventieth of
 * the rate of the thing it is lighting is the whole design — it is well beneath the speed
 * at which the eye will track it, so it is never the subject, and what it buys is that the
 * terminator and the ocean glint are not quite where they were a minute ago.
 *
 * Chosen over particles or a bloom pulse on purpose: it adds no draw call, no geometry and
 * no second element to composite — one uniform, already uploaded every frame, is written
 * to a slightly different value. Set the swing to 0 to remove the effect entirely.
 */
// 0 parks the sun on its rest bearing and holds it there. The swing was the moving
// half of the shading: it walked the terminator and the ocean glint back and forth
// across the disc on a 140s cycle, which is the band that was sweeping the surface.
// The accumulator below still runs and still resolves to cos 1 / sin 0, so the vector
// is written to exactly its rest value every frame and no code path goes stale.
const AMBIENT_SUN_SWING = 0;
const AMBIENT_SUN_PERIOD = 140;

/**
 * --- Connection arcs ---------------------------------------------------------------
 *
 * Vertices per arc. A great circle across half the planet subtends ~180 degrees, so 96
 * segments is a vertex every two degrees — smooth at the tour's 2.8x magnification, and
 * 480 vertices across the whole set, which is less geometry than a single one of the
 * sphere's latitude bands.
 */
const ARC_SEGMENTS = 96;
/**
 * Radius the arc leaves and re-enters the surface at. Just clear of the sphere so the
 * ends read as touching down on their region rather than floating over it.
 */
const ARC_RADIUS = 1.006;
/**
 * How high an arc bows, as a fraction of the planet's radius: a fixed floor plus a share
 * proportional to how far the arc has to travel, so a short hop between Sweden and
 * Mongolia stays flat while a crossing to Australia is allowed a little more air.
 *
 * Both numbers are small on purpose. At their maximum — an antipodal pair — the peak is
 * 8.3% of the radius, which reads as a trajectory lifting off the surface and never as
 * an arch thrown over the planet. Raising ARC_LIFT_SPAN much past ~0.1 starts to make
 * the set look like flight paths, which is the one reference this section must not
 * suggest.
 */
const ARC_LIFT_BASE = 0.028;
const ARC_LIFT_SPAN = 0.055;
/** Seconds for one arc's pulse cycle, counting the long idle between crossings. */
const ARC_PULSE_PERIOD = 16;
/**
 * Share of that cycle the pulse is actually in flight. At 0.22 a head takes ~3.5s to
 * cross and the arc then rests for ~12.5s; with the phases spread across the set, close
 * to one arc in the whole system is carrying a pulse at any moment.
 */
const ARC_PULSE_TRAVEL = 0.22;
/** Exponential rate the emphasis eases toward its target. */
const ARC_EMPHASIS_EASE = 4.5;
/** Resting alpha of the hairline, before emphasis. Thinned on small viewports. */
const ARC_OPACITY = 0.85;
const ARC_OPACITY_COMPACT = 0.70;

/**
 * Arc endpoint nodes: shiny starburst sparkle points.
 */
const ARC_NODE_SIZE = 34;
const ARC_NODE_OPACITY = 1.0;
/** Pulse periods, in seconds. Spread across the brief's 2-3s so no two nodes share one. */
const ARC_NODE_PERIOD_MIN = 2.0;
const ARC_NODE_PERIOD_SPAN = 1.0;

/**
 * Rate the drift speed eases toward its target, as an exponential time constant.
 *
 * Written as 1 - exp(-dt * k) rather than as the old dt * k, which is that curve's
 * first-order Taylor term: it agrees at small dt and runs increasingly ahead of it as
 * frames lengthen (7% high at 60fps, 9% at the loop's 0.05s delta clamp, and past dt =
 * 0.29s it would exceed 1 outright, were the clamp not there to stop it).
 *
 * The clamp meant the old form was never unstable, so this is not a bug fix. It is that
 * the deceleration is now the same curve on a 120Hz display and on a machine dropping
 * frames, instead of being slightly quicker on whichever device is struggling — the
 * hover slow-down settles identically everywhere.
 */
const SPEED_EASE = 3.5;

/**
 * Converts a coordinate to a point on the unit sphere using the same convention as
 * THREE.SphereGeometry UVs, so markers land exactly on their painted landmass.
 * With phiStart = 0, u = 0 maps to (-1, 0, 0), which is longitude -180.
 */
function latLngToVector3(lat: number, lng: number, target = new THREE.Vector3()) {
  const phi = THREE.MathUtils.degToRad(lng + 180);
  const theta = THREE.MathUtils.degToRad(90 - lat);
  const sinTheta = Math.sin(theta);
  return target.set(
    -Math.cos(phi) * sinTheta,
    Math.cos(theta),
    Math.sin(phi) * sinTheta
  );
}

/** Signed shortest way from a to b, so a blend never unwinds the long way round. */
function shortestAngle(a: number, b: number) {
  return ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

export const EarthGlobe: React.FC<EarthGlobeProps> = ({
  className = "",
  style,
  focusRef,
  anchors,
  arcs,
  emphasisId = null,
  onProject,
  onReady,
  // 58, not 52. The brief for this pass was "slow, elegant, non-distracting", and the
  // drift was already close — this is a ~11% slowing, which is under the threshold where
  // the change reads as a different animation but is enough that the eye stops tracking
  // the rotation and starts reading the surface. Anything much past 70 and the globe
  // reads as stalled rather than as turning.
  rotationPeriod = 58,
  initialLongitude = 18,
  speedScale = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Props consumed inside the render loop live in refs so changing them never
  // tears down the WebGL context.
  const onProjectRef = useRef(onProject);
  const onReadyRef = useRef(onReady);
  const anchorsRef = useRef(anchors);
  const arcsRef = useRef(arcs);
  const emphasisIdRef = useRef(emphasisId);
  const rotationPeriodRef = useRef(rotationPeriod);
  const speedScaleRef = useRef(speedScale);
  const focusSourceRef = useRef(focusRef);

  useEffect(() => {
    onProjectRef.current = onProject;
    onReadyRef.current = onReady;
    anchorsRef.current = anchors;
    arcsRef.current = arcs;
    emphasisIdRef.current = emphasisId;
    rotationPeriodRef.current = rotationPeriod;
    speedScaleRef.current = speedScale;
    focusSourceRef.current = focusRef;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let frameId: number | null = null;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        // MSAA is deliberately off. It smooths *geometry* edges only — the limb and the
        // atmosphere shell — and does nothing for the surface texture, which is what goes
        // soft when the box is CSS-scaled at a tour stop. Its memory (a multisampled
        // renderbuffer, commonly 4x) buys far more sharpness spent on drawing-buffer
        // resolution instead: the larger buffer is downsampled to the element at rest,
        // which supersamples those same edges, *and* it holds real detail to magnify
        // into when the zoom arrives. See applySize for the resulting budget.
        antialias: false,
        // No depth buffer. Nothing in this scene writes depth — all three materials set
        // depthWrite: false and order themselves with renderOrder (earth 1, clouds 2,
        // atmosphere 10) — so the attachment is allocated and never read. At the buffer
        // sizes below that is ~130MB of pure waste, and spending it on drawing-buffer
        // edge instead is what makes the higher pixel ratio affordable. Output is
        // pixel-identical; only the allocation changes.
        depth: false,
        powerPreference: "high-performance",
      });
    } catch {
      // No WebGL: the hero degrades to typography on a plain card.
      return;
    }

    const isSmallViewport = window.matchMedia("(max-width: 767px)").matches;
    /**
     * A phone held sideways is still a phone, and isSmallViewport is a WIDTH test.
     * A 844x390 handset reports false there, so it took the DESKTOP drawing-buffer
     * budget: 4064 square rather than 3048, 63MB against 35MB of GPU memory, on the
     * weakest hardware the site runs on — and which of the two it got depended only on
     * the orientation the page happened to load in, since this is read once at mount.
     * No desktop or tablet viewport is under 500 CSS pixels tall, so the height test
     * catches handsets in landscape and nothing else.
     *
     * Deliberately NOT folded into isSmallViewport. That flag decides which arcs draw,
     * which texture loads and how the haze reads — appearance — and this must decide
     * buffer size alone, so no viewport renders a different picture than it does today.
     */
    const isCompactDevice =
      isSmallViewport || window.matchMedia("(max-height: 500px)").matches;
    // Live, not a snapshot. The preference can be toggled while the page is open — on
    // Windows it rides the "animation effects" system switch — and a globe that keeps
    // spinning after the user has asked it to stop is the failure this guards against.
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let prefersReducedMotion = motionQuery.matches;

    renderer.setClearAlpha(0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();

    const halfFov = THREE.MathUtils.degToRad(FOV) / 2;
    const silhouetteAngle = Math.atan(FIT * Math.tan(halfFov));
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
    camera.position.set(0, 0, 1 / Math.sin(silhouetteAngle));
    camera.lookAt(0, 0, 0);

    // Three nested frames, and the nesting order is load-bearing.
    //
    // Aiming a coordinate at the camera is Rx(lat)·Ry(-(lng + 90))·v = (0, 0, 1). That
    // identity only holds if nothing sits between the pitch and the spin, so the axial
    // lean moves OUT to a parent and becomes a roll about the view axis — which leaves
    // an already-centred point exactly where it is. With the lean in its old slot
    // (rotation.z on the same group, applied to v before the pitch) every aim would be
    // off by the tilt.
    const rollGroup = new THREE.Group();
    rollGroup.rotation.z = AXIAL_TILT;
    scene.add(rollGroup);

    // tiltGroup carries the viewing pitch; the earth spins inside it.
    const tiltGroup = new THREE.Group();
    tiltGroup.rotation.x = VIEW_PITCH;
    rollGroup.add(tiltGroup);

    const sunDirection = new THREE.Vector3(-0.62, 0.34, 0.7).normalize();

    // --- Atmosphere shell -------------------------------------------------------
    // Front-faced and depth-test free, so the haze washes over the limb of the earth
    // and fades to nothing at the centre of the disc.
    const ATMOSPHERE_RADIUS = 1.055;
    const atmosphereGeometry = new THREE.SphereGeometry(ATMOSPHERE_RADIUS, 96, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      uniforms: {
        uColor: { value: new THREE.Color("#8FB3D9") },
        uSunDirection: { value: sunDirection },
        // 0.22. The shell and the surface's own limb darkening are one adjustment, not
        // two: taking the surface down at the silhouette and laying the haze over it is
        // what separates shell from ball, and it is that separation — not brightness —
        // that reads as atmosphere. Cut from 0.38 as the planet went dark, because the
        // same alpha over a near-black limb is a far larger fraction of the pixel; at the
        // old value the shell had become the brightest thing on the globe's edge.
        uStrength: { value: 0.22 },
        uLimb: { value: Math.sqrt(1 - 1 / (ATMOSPHERE_RADIUS * ATMOSPHERE_RADIUS)) },
        // Higher falloff pulls the shell back onto the limb. Raised from 8.2 to 14: the
        // earlier value deliberately spread the band inward so the cropped framing could
        // show it, but spread inward is exactly what a halo is, and the brief here is a
        // rim that supports the silhouette rather than one that sits on top of it. At 14
        // the shell is effectively gone by a tenth of the way in from the edge.
        uInnerFalloff: { value: 14.0 },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      side: THREE.FrontSide,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    atmosphere.renderOrder = 10;
    tiltGroup.add(atmosphere);

    // --- Earth ------------------------------------------------------------------
    const earthGeometry = new THREE.SphereGeometry(
      1,
      isSmallViewport ? 96 : 160,
      isSmallViewport ? 64 : 96
    );
    // Placeholder until the textures finish building; swapped out in the promise below.
    const placeholderMaterial = new THREE.MeshBasicMaterial({ visible: false });
    const earth = new THREE.Mesh<THREE.SphereGeometry, THREE.Material>(
      earthGeometry,
      placeholderMaterial
    );
    earth.rotation.y = THREE.MathUtils.degToRad(-(initialLongitude + 90));
    earth.visible = false;
    earth.renderOrder = 1;
    tiltGroup.add(earth);

    // --- Cloud shell ------------------------------------------------------------
    // Its own mesh just above the surface, drifting slightly faster than the ground so
    // the two layers separate as the planet turns.
    const cloudGeometry = new THREE.SphereGeometry(
      1.012,
      isSmallViewport ? 64 : 96,
      isSmallViewport ? 48 : 64
    );
    const cloudPlaceholder = new THREE.MeshBasicMaterial({ visible: false });
    const clouds = new THREE.Mesh<THREE.SphereGeometry, THREE.Material>(
      cloudGeometry,
      cloudPlaceholder
    );
    clouds.visible = false;
    clouds.renderOrder = 2;
    tiltGroup.add(clouds);

    // --- Connection arcs ----------------------------------------------------------
    //
    // Parented to the earth MESH rather than to tiltGroup, and that is the whole of the
    // "arcs must rotate with the globe" requirement: earth.rotation.y is the only thing
    // the drift and the tour's aim ever write, so anything under it inherits both exactly
    // and cannot drift out of step by construction. There is no second transform to keep
    // in sync and nothing to update per frame.
    //
    // renderOrder 5 places them after the surface (1) and the clouds (2) and before the
    // atmosphere (10). With no depth buffer that ordering is what decides occlusion
    // between layers, so the arcs sit over the planet and the limb haze still washes over
    // them — an arc running out toward the silhouette recedes into the atmosphere instead
    // of staying crisp on top of it. Being hidden by the planet ITSELF is not ordering;
    // that is solved per fragment in arcFragmentShader.
    interface ArcRecord {
      /** The two anchor ids this arc joins, for the emphasis test. */
      fromId: string;
      toId: string;
      phase: number;
      material: THREE.ShaderMaterial;
      geometry: THREE.BufferGeometry;
      /** Eased toward 1 while either endpoint is the emphasised region. */
      emphasis: number;
    }
    const arcRecords: ArcRecord[] = [];
    const arcGroup = new THREE.Group();
    earth.add(arcGroup);

    // One Points draw for every endpoint in the set, built after the arcs so it can take
    // its positions from whichever arcs actually survived the mobile filter.
    let arcNodes: THREE.Points | null = null;
    let arcNodeGeometry: THREE.BufferGeometry | null = null;
    let arcNodeMaterial: THREE.ShaderMaterial | null = null;

    const buildArcs = () => {
      const list = arcsRef.current ?? [];
      const points = anchorsRef.current ?? [];
      const byId = new Map(points.map((a) => [a.id, a]));

      for (const arc of list) {
        // Small viewports carry only the arcs marked for them. Fewer lines over less
        // planet is the whole of the mobile answer — the ones that remain keep their
        // geometry and their pacing rather than being shrunk or sped up.
        if (isSmallViewport && !arc.onMobile) continue;

        const from = byId.get(arc.fromId);
        const to = byId.get(arc.toId);
        if (!from || !to) {
          console.warn("[EarthGlobe] arc references unknown anchor", arc.id);
          continue;
        }

        const a = latLngToVector3(from.lat, from.lng);
        const b = latLngToVector3(to.lat, to.lng);
        const angle = a.angleTo(b);
        const sinAngle = Math.sin(angle);
        // Coincident or antipodal endpoints have no unique great circle to follow.
        if (sinAngle < 1e-4) continue;

        const lift = ARC_LIFT_BASE + ARC_LIFT_SPAN * (angle / Math.PI);
        const curvePoints: THREE.Vector3[] = [];

        for (let i = 0; i <= ARC_SEGMENTS; i += 1) {
          const t = i / ARC_SEGMENTS;
          // Spherical interpolation, so the path is the great circle between the two
          // regions rather than a chord through the planet reprojected onto it.
          const pt = new THREE.Vector3()
            .copy(a)
            .multiplyScalar(Math.sin((1 - t) * angle) / sinAngle)
            .addScaledVector(b, Math.sin(t * angle) / sinAngle)
            .normalize()
            // sin gives zero lift at both ends and the peak at the midpoint, so the arc
            // leaves and rejoins the surface tangentially instead of stepping off it.
            .multiplyScalar(ARC_RADIUS + lift * Math.sin(Math.PI * t));

          curvePoints.push(pt);
        }

        const curve = new THREE.CatmullRomCurve3(curvePoints);
        // Ultra-fine, hair-thin glowing dark gold lines
        const tubeRadius = isSmallViewport ? 0.00075 : 0.00095;
        const geometry = new THREE.TubeGeometry(curve, 96, tubeRadius, 5, false);

        const material = new THREE.ShaderMaterial({
          vertexShader: arcVertexShader,
          fragmentShader: arcFragmentShader,
          uniforms: {
            uColor: { value: new THREE.Color("#B27300") },
            uPulseColor: { value: new THREE.Color("#E89B17") },
            uOpacity: {
              value: 0.98,
            },
            uEmphasis: { value: 0 },
            uPulse: { value: -1 },
            uPulseGain: { value: prefersReducedMotion ? 0 : 1 },
          },
          transparent: true,
          depthWrite: false,
          depthTest: false,
          side: THREE.DoubleSide,
        });

        const line = new THREE.Mesh(geometry, material);
        line.renderOrder = 5;
        // The arc is a fixed shape in the earth's frame; only its parent ever moves.
        line.matrixAutoUpdate = false;
        line.updateMatrix();
        // Its own bounds are meaningless with depthTest off and the camera this close.
        line.frustumCulled = false;
        arcGroup.add(line);

        arcRecords.push({
          fromId: arc.fromId,
          toId: arc.toId,
          phase: arc.phase,
          material,
          geometry,
          emphasis: 0,
        });
      }

      // --- Endpoint nodes ---------------------------------------------------------
      // Deduplicated: a point shared by three arcs is one node, not three stacked on the
      // same pixel, which would triple its alpha and desynchronise nothing.
      const nodeIds = new Set<string>();
      for (const record of arcRecords) {
        nodeIds.add(record.fromId);
        nodeIds.add(record.toId);
      }
      if (nodeIds.size === 0) return;

      const positions = new Float32Array(nodeIds.size * 3);
      const phases = new Float32Array(nodeIds.size);
      const periods = new Float32Array(nodeIds.size);

      let n = 0;
      for (const id of nodeIds) {
        const anchor = byId.get(id);
        if (!anchor) continue;
        const v = latLngToVector3(anchor.lat, anchor.lng).multiplyScalar(ARC_RADIUS);
        positions[n * 3] = v.x;
        positions[n * 3 + 1] = v.y;
        positions[n * 3 + 2] = v.z;
        // Golden-ratio stride for the phase and an irrational-ish walk for the period:
        // both are deterministic, and neither divides evenly into the other, so the set
        // has no common cycle to drift back into sync on.
        phases[n] = (n * 0.618034 * Math.PI * 2) % (Math.PI * 2);
        periods[n] = ARC_NODE_PERIOD_MIN + ((n * 0.381966) % 1) * ARC_NODE_PERIOD_SPAN;
        n += 1;
      }

      arcNodeGeometry = new THREE.BufferGeometry();
      arcNodeGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      arcNodeGeometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
      arcNodeGeometry.setAttribute("aPeriod", new THREE.BufferAttribute(periods, 1));

      arcNodeMaterial = new THREE.ShaderMaterial({
        vertexShader: arcNodeVertexShader,
        fragmentShader: arcNodeFragmentShader,
        uniforms: {
          uColor: { value: new THREE.Color("#FFC837") },
          uOpacity: { value: ARC_NODE_OPACITY },
          uSize: { value: ARC_NODE_SIZE },
          uPixelRatio: { value: renderer.getPixelRatio() },
          uTime: { value: 0 },
          uPulseGain: { value: prefersReducedMotion ? 0 : 1 },
        },
        transparent: true,
        depthWrite: false,
        depthTest: false,
      });

      arcNodes = new THREE.Points(arcNodeGeometry, arcNodeMaterial);
      // Above the arcs, so a node sits on top of the hairlines meeting it.
      arcNodes.renderOrder = 6;
      arcNodes.frustumCulled = false;
      arcGroup.add(arcNodes);
    };
    buildArcs();

    let earthMaterial: THREE.ShaderMaterial | null = null;
    let cloudMaterial: THREE.ShaderMaterial | null = null;
    let dayTexture: THREE.CanvasTexture | null = null;
    let maskTexture: THREE.CanvasTexture | null = null;
    let cloudTexture: THREE.CanvasTexture | null = null;

    // --- Sizing -----------------------------------------------------------------
    // Start at 0 so the first applySize() always passes the unchanged-size guard below.
    let width = 0;
    let height = 0;

    /**
     * Resizes the drawing buffer, and reports whether it actually had to.
     *
     * The guard is not a micro-optimisation. setPixelRatio + setSize reallocate the
     * drawing buffer, which at the sizes this component asks for is tens of megabytes of
     * GPU memory freed and re-acquired — and a ResizeObserver on a full-height element
     * fires continuously on mobile, where showing or hiding the URL bar changes 100vh by
     * a hundred pixels mid-scroll. Reallocating through that is what turns a scroll into
     * a stutter. Same-size notifications now cost a pair of integer compares.
     */
    const applySize = () => {
      const nextWidth = Math.max(canvas.clientWidth, 1);
      const nextHeight = Math.max(canvas.clientHeight, 1);
      if (nextWidth === width && nextHeight === height) return false;
      width = nextWidth;
      height = nextHeight;

      // The box is deliberately far wider than the viewport, so a raw devicePixelRatio
      // would allocate an enormous framebuffer. Cap the longest drawing-buffer edge; the
      // globe is smooth-gradient heavy and holds up well below 2x.
      //
      // SUPERSAMPLE is why the ratio is not simply capped at devicePixelRatio. It was
      // sized for a tour that magnified this element with a CSS scale() — a buffer sized
      // to the resting box had no detail left once it was stretched, which read as blur.
      // The tour no longer scales anything: the globe holds one fixed size, so this is now
      // plain supersampling of a smooth-gradient sphere whose limb and terminator are the
      // parts that show aliasing first. Kept at its existing value so the planet renders
      // exactly as sharp as it does today. It is an ask, not a promise — ratioCap below is
      // what actually binds on a box this large.
      const SUPERSAMPLE = 2.8;
      // Longest drawing-buffer edge. Raised from 4096; the depth buffer dropped above
      // pays for it, so total framebuffer memory is roughly unchanged. Clamped by what
      // the driver will really allocate — past maxTextureSize the buffer is silently
      // clamped or the context is lost, and that is a blank globe rather than a soft one.
      const driverCap = renderer.capabilities.maxTextureSize || 4096;
      const maxEdge = Math.min(isCompactDevice ? 3200 : 5760, driverCap);
      const ratioCap = maxEdge / Math.max(width, height);
      renderer.setPixelRatio(
        Math.max(
          1,
          Math.min(
            (window.devicePixelRatio || 1) * SUPERSAMPLE,
            isCompactDevice ? 3 : 4,
            ratioCap
          )
        )
      );

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      return true;
    };
    applySize();

    // --- Anchor projection ------------------------------------------------------
    const anchorBase = new Map<string, THREE.Vector3>();
    const worldPoint = new THREE.Vector3();
    const surfaceNormal = new THREE.Vector3();
    const toCamera = new THREE.Vector3();
    const projected = new THREE.Vector3();
    const outerPoint = new THREE.Vector3();
    const focusPoint = new THREE.Vector3();
    const results: ProjectedAnchor[] = [];

    const projectAnchors = () => {
      const list = anchorsRef.current;
      const report = onProjectRef.current;
      if (!report) return;

      results.length = 0;
      earth.updateMatrixWorld();

      for (const anchor of list ?? []) {
        let base = anchorBase.get(anchor.id);
        if (!base) {
          base = latLngToVector3(anchor.lat, anchor.lng);
          anchorBase.set(anchor.id, base);
        }

        worldPoint.copy(base).applyMatrix4(earth.matrixWorld);
        // The globe sits at the world origin, so the position doubles as the normal.
        surfaceNormal.copy(worldPoint).normalize();
        toCamera.copy(camera.position).sub(worldPoint).normalize();

        const facing = surfaceNormal.dot(toCamera);

        projected.copy(worldPoint).project(camera);
        const x = (projected.x * 0.5 + 0.5) * width;
        const y = (-projected.y * 0.5 + 0.5) * height;

        outerPoint.copy(worldPoint).addScaledVector(surfaceNormal, 0.3).project(camera);
        let dirX = (outerPoint.x * 0.5 + 0.5) * width - x;
        let dirY = (-outerPoint.y * 0.5 + 0.5) * height - y;
        const length = Math.hypot(dirX, dirY) || 1;
        dirX /= length;
        dirY /= length;

        results.push({
          id: anchor.id,
          x,
          y,
          dirX,
          dirY,
          // Anything with facing > 0 is on the near side. The cap the hero leaves visible
          // sits near the top of the sphere, where normals point up and away from the
          // camera, so this has to stay low — a high threshold would fade out pins that
          // are plainly on screen. It only needs to catch the silhouette, where facing → 0.
          opacity: smoothstep(0.03, 0.16, facing),
        });
      }

      // Report where the aim landed, so the caller can pin it under a CSS zoom without
      // having to re-derive the projection.
      const focus = focusSourceRef.current?.current ?? null;
      if (focus && focus.weight > 0) {
        latLngToVector3(focus.lat, focus.lng, focusPoint);
        worldPoint.copy(focusPoint).applyMatrix4(earth.matrixWorld);
        surfaceNormal.copy(worldPoint).normalize();
        toCamera.copy(camera.position).sub(worldPoint).normalize();
        projected.copy(worldPoint).project(camera);
        results.push({
          id: FOCUS_ANCHOR_ID,
          x: (projected.x * 0.5 + 0.5) * width,
          y: (-projected.y * 0.5 + 0.5) * height,
          dirX: 0,
          dirY: 0,
          opacity: smoothstep(0.03, 0.16, surfaceNormal.dot(toCamera)),
        });
      }

      report(results);
    };

    // Eased toward the requested scale so hovering a marker slows the drift smoothly
    // instead of snapping it.
    //
    // Starts at rest rather than at full drift. The planet's first move is then an
    // acceleration into the turn instead of a cut into one already at speed, which is the
    // difference between the globe arriving and the globe having been running off screen
    // all along. No new curve for it: the same SPEED_EASE the hover slow-down uses carries
    // it, ~0.9s to 95% of the drift, which sits inside the 1400ms reveal the hero fades
    // the canvas up over — so the fade and the spin-up read as one gesture, not two.
    //
    // It costs nothing afterwards. start()/stop() do not touch this, so a globe that
    // scrolls out of view and back resumes at the speed it was already at rather than
    // easing in a second time, and the hover slow-down is unaffected in either direction.
    let currentSpeed = 0;
    // The free drift is tracked separately from what is finally written to the mesh, so
    // focus can blend against it and releasing focus resumes mid-drift with no jump.
    let freeYaw = earth.rotation.y;
    let cloudLead = 0;
    /**
     * Free-running phase for the light drift. Accumulated from the same clamped delta the
     * rotation uses rather than read from the clock, so a backgrounded tab resumes the
     * swing where it left off instead of jumping to wherever wall time had reached.
     */
    let sunPhase = 0;
    /** Shared pulse clock. Every arc reads it and offsets by its own phase. */
    let arcClock = 0;
    // The rest direction, kept intact: sunDirection itself is rewritten every frame, and
    // the swing has to be measured from a fixed origin or it would integrate into a slow
    // drift all the way round the planet.
    const sunRestX = sunDirection.x;
    const sunRestZ = sunDirection.z;

    // --- Hand / Mouse 360-degree drag rotation ----------------------------------
    let isPointerDown = false;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let pointerLastX = 0;
    let pointerLastY = 0;
    let pointerVelocityX = 0;
    let pointerVelocityY = 0;
    let lastPointerTime = 0;
    let userPitch = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      isPointerDown = true;
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {}
      canvas.style.cursor = "grabbing";
      pointerStartX = e.clientX;
      pointerStartY = e.clientY;
      pointerLastX = e.clientX;
      pointerLastY = e.clientY;
      pointerVelocityX = 0;
      pointerVelocityY = 0;
      lastPointerTime = performance.now();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isPointerDown) return;
      const now = performance.now();
      const dt = Math.max((now - lastPointerTime) / 1000, 0.001);
      lastPointerTime = now;

      const dx = e.clientX - pointerLastX;
      const dy = e.clientY - pointerLastY;
      pointerLastX = e.clientX;
      pointerLastY = e.clientY;

      const instantVx = dx / dt;
      const instantVy = dy / dt;
      pointerVelocityX = pointerVelocityX * 0.35 + instantVx * 0.65;
      pointerVelocityY = pointerVelocityY * 0.35 + instantVy * 0.65;

      const w = width || canvas.clientWidth || 800;
      const sens = (Math.PI * 2.2) / w;

      freeYaw += dx * sens;
      userPitch = Math.max(-0.75, Math.min(0.75, userPitch - dy * sens * 0.6));
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isPointerDown) return;
      isPointerDown = false;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {}
      canvas.style.cursor = "grab";
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    const renderFrame = (delta: number) => {
      if (delta > 0) {
        const target = speedScaleRef.current;
        currentSpeed += (target - currentSpeed) * (1 - Math.exp(-delta * SPEED_EASE));

        const turn = (delta * Math.PI * 2 * currentSpeed) / rotationPeriodRef.current;
        freeYaw += turn;
        // Slight parallax: the cloud sheet runs a touch ahead of the surface.
        cloudLead += turn * 0.12;

        // Ambient light drift. One rotation of the sun vector about the world's vertical,
        // written in place — the earth, cloud and atmosphere materials all hold a
        // reference to this same Vector3, so all three stay lit by one consistent source
        // for free. y is untouched, so the sun keeps its elevation and only its bearing
        // moves; swinging it vertically instead would walk the terminator across the
        // poles, which reads as the planet nodding.
        sunPhase += delta;
        const swing =
          Math.sin((sunPhase / AMBIENT_SUN_PERIOD) * Math.PI * 2) * AMBIENT_SUN_SWING;
        const cos = Math.cos(swing);
        const sin = Math.sin(swing);
        sunDirection.x = sunRestX * cos + sunRestZ * sin;
        sunDirection.z = -sunRestX * sin + sunRestZ * cos;

        arcClock += delta;
      }

      // Inertia after hand release
      if (!isPointerDown && delta > 0) {
        if (Math.abs(pointerVelocityX) > 5) {
          const w = width || canvas.clientWidth || 800;
          const sens = (Math.PI * 2.2) / w;
          freeYaw += pointerVelocityX * sens * delta;
          pointerVelocityX *= Math.exp(-delta * 3.2);
        } else {
          pointerVelocityX = 0;
        }

        if (Math.abs(userPitch) > 0.001) {
          userPitch *= Math.exp(-delta * 1.5);
        } else {
          userPitch = 0;
        }
      }

      // --- Arcs ---------------------------------------------------------------------
      // One shared clock and one loop over at most five records: no arc owns a timer, a
      // tween or an animation loop of its own, which is what keeps the layer's cost flat
      // whatever the set grows to.
      if (arcRecords.length > 0) {
        const emphasised = emphasisIdRef.current;
        for (const arc of arcRecords) {
          // Phase is per arc, so the heads are spread around the cycle rather than
          // leaving together. Outside the travel window uPulse parks at -1, which is far
          // enough from the 0..1 the shader samples that the head evaluates to nothing.
          const cycle = (arcClock / ARC_PULSE_PERIOD + arc.phase) % 1;
          arc.material.uniforms.uPulse.value =
            cycle < ARC_PULSE_TRAVEL ? cycle / ARC_PULSE_TRAVEL : -1;

          // The node pulse reads the same clock. Written once per frame regardless of
          // how many nodes there are — the per-node offset lives in the attributes.
          if (arcNodeMaterial) arcNodeMaterial.uniforms.uTime.value = arcClock;

          // Only the arcs touching the region being pointed at respond; the rest hold
          // their resting weight, so one regional network is emphasised at a time.
          const target =
            emphasised !== null &&
            (arc.fromId === emphasised || arc.toId === emphasised)
              ? 1
              : 0;
          if (delta > 0 && arc.emphasis !== target) {
            arc.emphasis +=
              (target - arc.emphasis) * (1 - Math.exp(-delta * ARC_EMPHASIS_EASE));
            if (Math.abs(target - arc.emphasis) < 1e-3) arc.emphasis = target;
          } else if (delta <= 0) {
            arc.emphasis = target;
          }
          arc.material.uniforms.uEmphasis.value = arc.emphasis;
        }
      }

      const focus = focusSourceRef.current?.current ?? null;
      const weight = focus ? Math.min(Math.max(focus.weight, 0), 1) : 0;
      const effectiveWeight = isPointerDown ? 0 : weight;

      if (effectiveWeight > 0 && focus) {
        // Ry brings the target's meridian round to face the camera, Rx lifts its
        // latitude to the centre of the disc, and tiltBias then pushes it up into the
        // slice of sphere the container actually shows.
        const aimYaw = THREE.MathUtils.degToRad(-(focus.lng + 90));
        const aimPitch = THREE.MathUtils.degToRad(focus.lat) - focus.tiltBias;
        earth.rotation.y = freeYaw + shortestAngle(freeYaw, aimYaw) * effectiveWeight;
        tiltGroup.rotation.x = VIEW_PITCH + (aimPitch - VIEW_PITCH) * effectiveWeight + userPitch;
      } else {
        earth.rotation.y = freeYaw;
        tiltGroup.rotation.x = VIEW_PITCH + userPitch;
      }
      clouds.rotation.y = earth.rotation.y + cloudLead;

      renderer.render(scene, camera);
      projectAnchors();
    };

    // --- Loop -------------------------------------------------------------------
    let lastTime = 0;
    let running = false;
    let inViewport = true;

    const tick = (now: number) => {
      if (disposed) return;
      // Clamped so a backgrounded tab does not resume with a visible jump.
      const delta = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0;
      lastTime = now;
      renderFrame(delta);
      frameId = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running || disposed || !earthMaterial) return;
      running = true;
      lastTime = 0;
      frameId = requestAnimationFrame(tick);
    };

    const stop = () => {
      running = false;
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
    };

    const syncRunState = () => {
      if (prefersReducedMotion) return;
      if (inViewport && document.visibilityState === "visible") start();
      else stop();
    };

    /**
     * Resizes are coalesced into the next frame rather than handled on the notification.
     *
     * A ResizeObserver can fire several times for one visual change — a CSS transition on
     * the box, or the tour's own scale settling — and each notification arrives before
     * paint. Doing the reallocation on every one of them meant the buffer could be thrown
     * away and rebuilt two or three times for a single resize the user perceives as one.
     * Batching to a frame collapses those into the last size that was actually asked for.
     */
    let resizeFrame: number | null = null;
    const resizeObserver = new ResizeObserver(() => {
      if (resizeFrame !== null) return;
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = null;
        if (disposed) return;
        // Keep a paused globe (reduced motion, or scrolled out of view) in sync — but
        // only when the size genuinely moved, since a running loop redraws anyway.
        if (applySize() && !running) renderFrame(0);
      });
    });
    resizeObserver.observe(canvas);

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        inViewport = entries.some((entry) => entry.isIntersecting);
        syncRunState();
      },
      { threshold: 0 }
    );
    intersectionObserver.observe(canvas);

    document.addEventListener("visibilitychange", syncRunState);

    // Reduced motion, honoured live. Turning it on parks the loop and leaves the planet
    // on screen, lit and fully rendered, exactly as it looks at rest — the globe is
    // content here, not decoration, so it is the motion that goes and not the sphere.
    const onMotionPreferenceChange = () => {
      prefersReducedMotion = motionQuery.matches;
      // The arcs stay, and stay lit; it is only the travelling head that goes. Killing
      // the gain rather than the layer is what "do not remove the entire visual" asks
      // for, and it leaves emphasis on hover working exactly as it does otherwise.
      for (const arc of arcRecords) {
        arc.material.uniforms.uPulseGain.value = prefersReducedMotion ? 0 : 1;
      }
      // Nodes park at full brightness rather than vanishing: the dot is content, it is
      // only its breathing that reduced motion asks to stop.
      if (arcNodeMaterial) arcNodeMaterial.uniforms.uPulseGain.value = prefersReducedMotion ? 0 : 1;
      if (prefersReducedMotion) {
        stop();
        renderFrame(0);
      } else {
        syncRunState();
      }
    };
    motionQuery.addEventListener("change", onMotionPreferenceChange);

    // --- Async texture build ----------------------------------------------------
    //
    // The framebuffer is only half the sharpness story. An equirectangular map spends its
    // width on 360 degrees, so 4096 carries 11.4 texels per degree; at a stop the sphere
    // shows ~51 screen pixels per degree, so every texel was stretched over ~4.5 of them
    // and the coastlines stayed soft no matter how large the buffer grew. 6144 brings
    // that to ~3.0.
    //
    // Deliberately NOT 8192: that needs a 134MB source canvas plus ~180MB uploaded, which
    // on top of the buffer above is what a mid-range GPU refuses — and a refused upload
    // is the blank globe from the last attempt, not a degraded one. Clamped by the driver
    // and by device memory where the browser reports it.
    const driverTextureCap = renderer.capabilities.maxTextureSize || 4096;
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const desktopWidth = deviceMemory && deviceMemory < 8 ? 4096 : 6144;
    const dayWidth = Math.min(isSmallViewport ? 2048 : desktopWidth, driverTextureCap);

    // One step down, tried if the first size fails to allocate. Without this a failed
    // build leaves earth.visible false for good, which reads as the globe having vanished
    // while the CSS halo carries on.
    const buildWithFallback = () =>
      buildEarthTextures(dayWidth).catch((err) => {
        if (dayWidth <= 2048) throw err;
        console.warn(
          "[EarthGlobe] texture build failed at",
          dayWidth,
          "- retrying at 2048",
          err
        );
        return buildEarthTextures(2048);
      });

    buildWithFallback()
      .then(({ day, mask, clouds: cloudMap }) => {
        if (disposed) return;

        const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

        dayTexture = new THREE.CanvasTexture(day);
        dayTexture.colorSpace = THREE.SRGBColorSpace;
        dayTexture.wrapS = THREE.RepeatWrapping;
        dayTexture.wrapT = THREE.ClampToEdgeWrapping;
        dayTexture.anisotropy = maxAnisotropy;

        maskTexture = new THREE.CanvasTexture(mask);
        maskTexture.colorSpace = THREE.NoColorSpace;
        maskTexture.wrapS = THREE.RepeatWrapping;
        maskTexture.wrapT = THREE.ClampToEdgeWrapping;
        maskTexture.anisotropy = maxAnisotropy;

        earthMaterial = new THREE.ShaderMaterial({
          vertexShader: earthVertexShader,
          fragmentShader: earthFragmentShader,
          uniforms: {
            uDayMap: { value: dayTexture },
            uMaskMap: { value: maskTexture },
            uMaskTexel: { value: new THREE.Vector2(1 / mask.width, 1 / mask.height) },
            uSunDirection: { value: sunDirection },
            uHazeColor: { value: new THREE.Color("#9FC0DE") },
            // Ambient is the flatness dial. Held high it lifts the unlit hemisphere up
            // to meet the lit one and the sphere reads as a printed disc; dropped here
            // to roughly a third, so the surface visibly turns away from the sun while
            // the night side still keeps enough light to read against a white band.
            uAmbient: { value: 0.17 },
            uSunIntensity: { value: 1.02 },
            // Relief is the only depth cue left once the tour zooms past the silhouette,
            // so terrain has to carry it at close range.
            uReliefStrength: { value: 0.45 },
            // The haze that sits on the sphere itself, just inside the silhouette,
            // separate from the atmosphere shell. Eased back with the surface it lies over:
            // the same 0.34 of blue over a near-black limb is a far larger fraction of the
            // pixel than it was over the old lit-looking one.
            uHazeStrength: { value: 0.1 },
            // Full opacity: at 0.74 a quarter of the white band bled through every pixel
            // and flattened the shading before it reached the screen.
            uOpacity: { value: 1.0 },
            // 0.06, down from 0.16. This dial runs over the WHOLE albedo, city lights
            // included, so it was doing two jobs at once: muting a green biome ramp that
            // no longer exists, and quietly draining the hue out of the night lights on
            // its way past. With the land now authored blue there is nothing left to mute,
            // and the lights keep the gold they were tinted with. Not taken to zero — a
            // few percent still holds the brightest cores back from going fully saturated.
            uDesaturate: { value: 0.06 },
            // Sun glint on water, cut to a fifth. It is a daylight cue: a specular
            // highlight is the sun's own reflection, and there is no sun on this face any
            // more. At 0.55 it put a blue-white smear across the ocean that fought the
            // near-black water harder than anything else in the frame. Left non-zero
            // because it slides as the planet turns, and that motion is a curvature cue
            // nothing else in the shader provides.
            uSpecularStrength: { value: 0.1 },
            // 0.36, down from 0.44. This is the one sphericality cue that survives the
            // tour's magnification — a terminator can rotate off screen and a specular
            // glint can miss the visible cap, but the falloff toward the silhouette is in
            // every frame at every zoom — so it is kept, not removed. Lowered because at
            // 0.44 the surface lost nearly half its value before reaching the edge, and
            // against a backdrop this dark that is land fading out well before the
            // silhouette instead of at it.
            uLimbDarkening: { value: 0.36 },
            // The sunset band. Written as a hex so three converts it out of sRGB the
            // same way uHazeColor above is converted, which puts it in the linear space
            // the shader adds it in; the linear triple it lands on is ~(0.55, 0.34, 0.15)
            // — a warm ochre inside the site's existing gold family rather than a new
            // colour introduced at the terminator.
            //
            // 0.32 is set against the band's own peak of 0.25, so the strongest fragment
            // anywhere on the planet gains ~0.04 of red over what it had. That is a
            // quarter-stop of warmth on the one strip where a sunset belongs and nothing
            // anywhere else — visible as the terminator drifts across, invisible as an
            // effect, which is the order this section asks for.
            uTerminatorColor: { value: new THREE.Color("#C49E6C") },
            uTerminatorStrength: { value: 0.32 },
          },
          transparent: true,
          depthWrite: false,
          side: THREE.FrontSide,
        });

        cloudTexture = new THREE.CanvasTexture(cloudMap);
        cloudTexture.colorSpace = THREE.SRGBColorSpace;
        cloudTexture.wrapS = THREE.RepeatWrapping;
        cloudTexture.wrapT = THREE.ClampToEdgeWrapping;
        cloudTexture.anisotropy = maxAnisotropy;

        cloudMaterial = new THREE.ShaderMaterial({
          vertexShader: cloudVertexShader,
          fragmentShader: cloudFragmentShader,
          uniforms: {
            uCloudMap: { value: cloudTexture },
            uSunDirection: { value: sunDirection },
            // From 0.5 to 0.09, and worth being precise about why this one matters more
            // than its size suggests: the cloud sheet is pure white and covers the WHOLE
            // disc, so unlike the surface haze and the atmosphere shell — both of which
            // fall off toward the limb — it is the only term that lifts the CENTRE of the
            // planet. At 0.5 its thickest coverage laid ~40% white over the ocean, and at
            // 0.2 still ~16%: that was the milky wash, more than any other single source.
            // The system is untouched and clouds still break up the surface; they simply
            // no longer dominate the thing they are drawn over.
            uOpacity: { value: isSmallViewport ? 0.07 : 0.09 },
          },
          transparent: true,
          depthWrite: false,
          side: THREE.FrontSide,
        });

        earth.material = earthMaterial;
        earth.visible = true;
        clouds.material = cloudMaterial;
        clouds.visible = true;

        renderFrame(0);
        onReadyRef.current?.();

        if (prefersReducedMotion) return;
        syncRunState();
      })
      .catch((err) => {
        // The hero stays readable without the globe, but this must not be silent: an
        // invisible sphere and a working one differ only by this promise.
        console.error("[EarthGlobe] textures unavailable, globe will not render", err);
      });

    return () => {
      disposed = true;
      stop();
      if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", syncRunState);
      motionQuery.removeEventListener("change", onMotionPreferenceChange);

      for (const arc of arcRecords) {
        arc.geometry.dispose();
        arc.material.dispose();
      }
      arcNodeGeometry?.dispose();
      arcNodeMaterial?.dispose();
      earthGeometry.dispose();
      cloudGeometry.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      placeholderMaterial.dispose();
      cloudPlaceholder.dispose();
      earthMaterial?.dispose();
      cloudMaterial?.dispose();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      dayTexture?.dispose();
      maskTexture?.dispose();
      cloudTexture?.dispose();
      renderer.dispose();
    };
  }, [initialLongitude]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ ...style, cursor: "grab", touchAction: "none" }}
      aria-hidden="true"
    />
  );
};

export default EarthGlobe;
