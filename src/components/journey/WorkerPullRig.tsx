"use client";

import React, { forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import styles from "./WorkerPullRig.module.css";

export interface WorkerPullRigHandle {
  update: (
    pullProgress: number,
    panelEdgeX: number,
    winW: number,
    winH: number,
    topLag?: number,
    bottomLag?: number,
    isReleasing?: boolean,
    releaseProgress?: number
  ) => void;
}

export const WorkerPullRig = forwardRef<WorkerPullRigHandle>((_, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ropePathRef = useRef<SVGPathElement>(null);
  const ropeShadowRef = useRef<SVGPathElement>(null);
  const edgeShadowRef = useRef<SVGPathElement>(null);

  // 3D Scene Refs
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const animDurationRef = useRef<number>(19.875);
  const characterRef = useRef<THREE.Group | null>(null);
  const shadowMeshRef = useRef<THREE.Mesh | null>(null);
  const rightHandRef = useRef<THREE.Object3D | null>(null);
  const leftHandRef = useRef<THREE.Object3D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = window.innerWidth || 1440;
    const height = window.innerHeight || 900;
    const aspect = width / height;

    // 1. Scene & Camera setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Mobile-adaptive FOV: on narrow portrait mobile screens (aspect < 0.65), expand vertical FOV so the character is fully in view
    const baseFov = aspect < 0.65 ? 46 : aspect < 0.85 ? 39 : 34;
    const camera = new THREE.PerspectiveCamera(baseFov, aspect, 0.1, 100);
    // Camera framed looking across the lower ground level where character pulls
    camera.position.set(0, 0.65, 5.4);
    camera.lookAt(0, 0.35, 0);
    cameraRef.current = camera;

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    rendererRef.current = renderer;

    // 3. Cinematic Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 2.6);
    dirLight.position.set(3.5, 6, 4.5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x93c5fd, 1.8);
    rimLight.position.set(-4, 3, -3);
    scene.add(rimLight);

    // Floor contact shadow receiver plane under character's shoes (wide enough to span entire traverse)
    const shadowGeo = new THREE.PlaneGeometry(36, 16);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.36 });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = width < 640 ? -1.14 : -1.05;
    shadowMesh.receiveShadow = true;
    shadowMeshRef.current = shadowMesh;
    scene.add(shadowMesh);

    // 4. Load 3D Character Model (Mime 01.glb from user's folder)
    const loader = new GLTFLoader();
    loader.load(
      "/models/Mime_01.glb",
      (gltf) => {
        const model = gltf.scene;
        // Responsive human scale stationed at bottom-left matching reference
        const isMob = width < 640;
        const isTab = width < 960;
        const initScale = isMob ? 0.46 : (isTab ? 0.56 : 0.66);
        model.scale.set(initScale, initScale, initScale);
        // Angle in 3/4 perspective toward the rope on the right
        model.position.set(1.9, isMob ? -1.14 : -1.05, 0);
        model.rotation.y = Math.PI * 0.16;

        // Custom tailored executive dark navy / charcoal suit texture
        const texLoader = new THREE.TextureLoader();
        const suitTexture = texLoader.load("/models/avatar_suit_navy.webp", (tex) => {
          tex.flipY = false;
          tex.colorSpace = THREE.SRGBColorSpace;
          renderer.render(scene, camera);
        });
        suitTexture.flipY = false;
        suitTexture.colorSpace = THREE.SRGBColorSpace;

        // Traverse mesh nodes
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            // Remove 3D mask prop attached to the face by filtering mask triangles
            const geom = mesh.geometry;
            const index = geom.index;
            const uv = geom.attributes.uv;

            if (index && uv) {
              const oldIndices = index.array;
              const newIndices: number[] = [];
              const totalTriangles = oldIndices.length / 3;

              for (let i = 0; i < totalTriangles; i++) {
                const a = oldIndices[i * 3];
                const b = oldIndices[i * 3 + 1];
                const c = oldIndices[i * 3 + 2];

                const uA = uv.getX(a), vA = uv.getY(a);
                const uB = uv.getX(b), vB = uv.getY(b);
                const uC = uv.getX(c), vC = uv.getY(c);

                const isMaskA = (uA >= 0.59 && uA <= 0.76 && vA >= 0.34 && vA <= 0.66);
                const isMaskB = (uB >= 0.59 && uB <= 0.76 && vB >= 0.34 && vB <= 0.66);
                const isMaskC = (uC >= 0.59 && uC <= 0.76 && vC >= 0.34 && vC <= 0.66);

                if (!isMaskA && !isMaskB && !isMaskC) {
                  newIndices.push(a, b, c);
                }
              }

              geom.setIndex(new THREE.BufferAttribute(new Uint32Array(newIndices), 1));
              geom.computeVertexNormals();
            }

            if (mesh.material) {
              const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
              mat.map = suitTexture;
              mat.roughness = 0.68;
              mat.metalness = 0.08;
              mat.needsUpdate = true;
              mesh.material = mat;
            }
          }
          if (child.name === "RightHand") {
            rightHandRef.current = child;
          }
          if (child.name === "LeftHand") {
            leftHandRef.current = child;
          }
        });

        // Setup motion-capture pulling animation (Layer1)
        const pullClip = gltf.animations.find((a) => a.name === "Layer1") || gltf.animations[0];
        if (pullClip) {
          animDurationRef.current = pullClip.duration;
          const mixer = new THREE.AnimationMixer(model);
          const action = mixer.clipAction(pullClip);
          action.play();
          mixer.setTime(14.5); // Immediately evaluate skeleton at pulling frame to eliminate T-pose
          mixerRef.current = mixer;
        }

        scene.add(model);
        characterRef.current = model;
        renderer.render(scene, camera);
      },
      undefined,
      (err) => {
        console.error("Failed to load Mime 01 3D character:", err);
      }
    );

    const handleResize = () => {
      const w = window.innerWidth || 1440;
      const h = window.innerHeight || 900;
      const asp = w / h;
      camera.aspect = asp;
      camera.fov = asp < 0.65 ? 46 : asp < 0.85 ? 39 : 34;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);

      if (characterRef.current) {
        const isMob = w < 640;
        const isTab = w < 960;
        const scale = isMob ? 0.42 : (isTab ? 0.54 : 0.66);
        characterRef.current.scale.set(scale, scale, scale);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, []);

  useImperativeHandle(ref, () => ({
    update: (
      pullProgress: number,
      panelEdgeX: number,
      winW: number,
      winH: number,
      topLag: number = 0,
      bottomLag: number = 0,
      isReleasing: boolean = false,
      releaseProgress: number = 0
    ) => {
      const container = containerRef.current;
      if (!container) return;

      if (pullProgress <= 0 || (isReleasing && releaseProgress >= 0.85)) {
        container.style.display = "none";
        container.style.opacity = "0";
        return;
      }
      container.style.display = "block";
      const workerAlpha = isReleasing ? Math.max(0, 1 - releaseProgress * 1.5) : 1;
      container.style.opacity = workerAlpha.toFixed(3);

      const mixer = mixerRef.current;
      const char = characterRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      const renderer = rendererRef.current;

      if (mixer && char && camera && renderer && scene) {
        const isMobile = winW < 640;
        const isTablet = winW < 960;

        // Dynamically scale character to fit mobile viewport gracefully
        const charScale = isMobile ? 0.46 : (isTablet ? 0.56 : 0.66);
        char.scale.set(charScale, charScale, charScale);

        // Ground positioning: slightly lowered on mobile to ground feet accurately
        const floorY = isMobile ? -1.14 : -1.05;
        if (shadowMeshRef.current) {
          shadowMeshRef.current.position.y = floorY;
        }

        // Map pull animation time:
        // Scrubbing maps to heavy pulling strides (12.8s to 19.4s)
        const animProgress = isReleasing ? 1.0 : Math.min(1.0, pullProgress / 0.76);
        const startPullTime = 12.8;
        const endPullTime = 19.4;
        const animTime = startPullTime + animProgress * (endPullTime - startPullTime);
        mixer.setTime(animTime);

        // Position: worker travels from right side towards the left side
        // Proportioned for mobile so character has ample runway across narrow phone viewports
        const ropeGap = isMobile
          ? Math.max(75, Math.min(130, winW * 0.22))
          : Math.max(160, Math.min(260, winW * 0.18));
        const handOffset = isMobile ? 48 : 85;
        const totalOffset = ropeGap + handOffset;
        const minWorkerX = isMobile
          ? Math.max(30, winW * 0.08)
          : Math.max(60, Math.min(130, winW * 0.08));
        const targetScreenX = Math.max(minWorkerX, panelEdgeX - totalOffset);

        // Dynamically compute visible height based on camera FOV & distance (5.4)
        const radFov = THREE.MathUtils.degToRad(camera.fov / 2);
        const visibleHeightWorld = 2 * camera.position.z * Math.tan(radFov);
        const targetWorldX = ((targetScreenX - 0.5 * winW) / winH) * visibleHeightWorld;

        // Compensate for internal Hips translation smoothly, scaled for mobile width
        const hipsCompScale = isMobile ? 0.65 : (isTablet ? 0.95 : 1.33);
        const hipsDeltaCompensation = hipsCompScale * animProgress;
        char.position.set(targetWorldX + hipsDeltaCompensation, floorY, 0);

        // Render 3D frame
        renderer.render(scene, camera);

        // Track BOTH hands in 3D and project to screen coordinates so rope is held in both hands
        let frontHandX = targetScreenX + handOffset;
        let frontHandY = winH * (isMobile ? 0.68 : 0.65);
        let backHandX = targetScreenX + (isMobile ? 20 : 35);
        let backHandY = winH * (isMobile ? 0.69 : 0.66);

        if (rightHandRef.current && leftHandRef.current) {
          const rWorld = new THREE.Vector3();
          const lWorld = new THREE.Vector3();
          rightHandRef.current.getWorldPosition(rWorld);
          leftHandRef.current.getWorldPosition(lWorld);

          const rScreen = rWorld.project(camera);
          const lScreen = lWorld.project(camera);

          const rScreenX = (rScreen.x * 0.5 + 0.5) * winW;
          const rScreenY = (-(rScreen.y * 0.5) + 0.5) * winH;

          const lScreenX = (lScreen.x * 0.5 + 0.5) * winW;
          const lScreenY = (-(lScreen.y * 0.5) + 0.5) * winH;

          // Differentiate front hand (+X closer to page) and back hand (-X closer to body)
          if (rWorld.x > lWorld.x) {
            frontHandX = rScreenX;
            frontHandY = rScreenY;
            backHandX = lScreenX;
            backHandY = lScreenY;
          } else {
            frontHandX = lScreenX;
            frontHandY = lScreenY;
            backHandX = rScreenX;
            backHandY = rScreenY;
          }
        }

        // Exact grommet apex coordinates on the leading edge (54% on mobile, 56% on desktop)
        const grommetY = winH * (isMobile ? 0.54 : 0.56);

        // Trailing rope tail hanging behind the worker's rear hand
        const tailX = backHandX - (isMobile ? 22 : 35);
        const tailY = backHandY + (isMobile ? 28 : 45);
        const tailMidX = (tailX + backHandX) / 2 - (isMobile ? 5 : 8);
        const tailMidY = (tailY + backHandY) / 2 + (isMobile ? 4 : 6);

        // Responsive crisp rope stroke width
        const ropeStroke = isMobile ? 3.8 : 5.5;
        const shadowStroke = isMobile ? 5.2 : 7.0;
        if (ropePathRef.current) ropePathRef.current.setAttribute("stroke-width", ropeStroke.toString());
        if (ropeShadowRef.current) ropeShadowRef.current.setAttribute("stroke-width", shadowStroke.toString());

        if (isReleasing) {
          // ====================================================================
          // ONCE THE PAGE REACHES ITS FINAL POSITION: WORKER RELEASES THE ROPE
          // ====================================================================
          // Smooth fade as tension releases and worker relaxes
          container.style.opacity = Math.max(0, 1 - Math.pow(releaseProgress, 1.4)).toFixed(3);

          // The rope drops slack from both hands: gravity downward parabola + slips from grommet
          const dropSag = releaseProgress * (isMobile ? 120 : 160);
          const releaseFrontY = frontHandY + releaseProgress * 35;
          const releaseBackY = backHandY + releaseProgress * 30;
          const releaseRopeEndY = grommetY + releaseProgress * 90;

          const midX = (frontHandX + panelEdgeX) / 2;
          const midY = (releaseFrontY + releaseRopeEndY) / 2 + dropSag;

          const releaseTailX = tailX - releaseProgress * 15;
          const releaseTailY = tailY + releaseProgress * 40;

          const ropeD = `M ${releaseTailX.toFixed(1)} ${releaseTailY.toFixed(1)} Q ${(backHandX - 15).toFixed(1)} ${(releaseBackY + 18).toFixed(1)} ${backHandX.toFixed(1)} ${releaseBackY.toFixed(1)} L ${frontHandX.toFixed(1)} ${releaseFrontY.toFixed(1)} Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${panelEdgeX.toFixed(1)} ${releaseRopeEndY.toFixed(1)}`;
          if (ropePathRef.current) ropePathRef.current.setAttribute("d", ropeD);
          if (ropeShadowRef.current) ropeShadowRef.current.setAttribute("d", ropeD);
        } else {
          container.style.opacity = "1";

          // Taut heavy industrial braided rope held firmly in BOTH hands under high tension with micro-vibration
          const jitter = Math.sin(pullProgress * 120) * 1.2;
          const midX = (frontHandX + panelEdgeX) / 2;
          const midY = (frontHandY + grommetY) / 2 + jitter;

          // Continuous rope: Tail -> Back Hand -> Front Hand -> Leading Edge Grommet
          const ropeD = `M ${tailX.toFixed(1)} ${tailY.toFixed(1)} Q ${tailMidX.toFixed(1)} ${tailMidY.toFixed(1)} ${backHandX.toFixed(1)} ${backHandY.toFixed(1)} L ${frontHandX.toFixed(1)} ${frontHandY.toFixed(1)} Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${panelEdgeX.toFixed(1)} ${grommetY.toFixed(1)}`;
          if (ropePathRef.current) ropePathRef.current.setAttribute("d", ropeD);
          if (ropeShadowRef.current) ropeShadowRef.current.setAttribute("d", ropeD);
        }

        // Dynamic paper edge curved drop shadow onto backdrop
        if (edgeShadowRef.current) {
          if (isReleasing && releaseProgress > 0.4) {
            edgeShadowRef.current.setAttribute("d", "M 0 0");
          } else {
            const edgeApexX = panelEdgeX;
            const topCornerX = panelEdgeX + topLag;
            const bottomCornerX = panelEdgeX + bottomLag;

            const shadowD = `M ${topCornerX.toFixed(1)} 0 Q ${((edgeApexX + topCornerX) / 2).toFixed(1)} ${(grommetY * 0.45).toFixed(1)} ${edgeApexX.toFixed(1)} ${grommetY.toFixed(1)} L ${bottomCornerX.toFixed(1)} ${winH}`;
            edgeShadowRef.current.setAttribute("d", shadowD);
          }
        }
      }
    },
  }));

  return (
    <div ref={containerRef} className={styles.workerRigContainer} style={{ display: "none" }} aria-hidden="true">
      {/* Paper leading edge drop shadow SVG */}
      <svg className={styles.paperEdgeShadowSvg}>
        <defs>
          <filter id="paperEdgeShadowFilter" x="-50%" y="-20%" width="200%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="9" />
          </filter>
        </defs>
        <path
          ref={edgeShadowRef}
          d="M 0 0"
          stroke="rgba(6, 11, 20, 0.48)"
          strokeWidth="30"
          strokeLinecap="round"
          fill="none"
          filter="url(#paperEdgeShadowFilter)"
        />
      </svg>

      {/* 3D WebGL Canvas rendering the rigged character */}
      <canvas ref={canvasRef} className={styles.worker3DCanvas} />

      {/* Heavy Off-White Braided Rope SVG */}
      <svg className={styles.ropeSvg}>
        <defs>
          <linearGradient id="braidedRopeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="20%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#F8FAFC" />
            <stop offset="75%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>
        </defs>
        {/* Soft drop shadow rope */}
        <path
          ref={ropeShadowRef}
          d="M 0 0"
          stroke="rgba(0, 0, 0, 0.38)"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
          transform="translate(0, 4)"
        />
        {/* Core textured braided rope */}
        <path
          ref={ropePathRef}
          d="M 0 0"
          stroke="url(#braidedRopeGrad)"
          strokeWidth="5.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

    </div>
  );
});

WorkerPullRig.displayName = "WorkerPullRig";
export default WorkerPullRig;
