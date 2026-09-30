"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface CoreSpecimenCanvasProps {
  progress: number;
}

// 96 Realistic 3D glass shard descriptors
const SHARD_COUNT = 96;
interface ShardData {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  rotSpeed: THREE.Vector3;
  basePos: THREE.Vector3;
}

export const CoreSpecimenCanvas: React.FC<CoreSpecimenCanvasProps> = ({ progress }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pRef = useRef(progress);
  pRef.current = progress;

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // 1. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    renderer.setSize(width, height);

    // 2. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.15, 6.0);

    // 3. Balanced Natural Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xfcf6ed, 2.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff1d4, 2.4);
    sunLight.position.set(-3.5, 4.5, 4.0);
    scene.add(sunLight);

    const skyFill = new THREE.DirectionalLight(0xb8d4f0, 1.4);
    skyFill.position.set(4.0, 2.0, 3.5);
    scene.add(skyFill);

    const plinthLight = new THREE.PointLight(0xf59e0b, 2.8, 12);
    plinthLight.position.set(0, -1.0, 0.0);
    scene.add(plinthLight);

    // 4. Load Photorealistic Gold Quartz Rock Textures
    const textureLoader = new THREE.TextureLoader();
    const colorTex = textureLoader.load("/images/gold_quartz_texture.webp");
    colorTex.wrapS = THREE.RepeatWrapping;
    colorTex.wrapT = THREE.RepeatWrapping;
    colorTex.repeat.set(1.6, 1.6);

    const bumpTex = textureLoader.load("/images/gold_quartz_bump.webp");
    bumpTex.wrapS = THREE.RepeatWrapping;
    bumpTex.wrapT = THREE.RepeatWrapping;
    bumpTex.repeat.set(1.6, 1.6);

    // 5. Authentic Geological 3D Mineral Stone
    const stoneGeo = new THREE.DodecahedronGeometry(0.22, 4);
    const pos = stoneGeo.attributes.position;
    const v = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const n = v.clone().normalize();
      let r = 1.0;

      const p1 = Math.abs(n.dot(new THREE.Vector3(0.65, 0.45, 0.60).normalize()));
      const p2 = Math.abs(n.dot(new THREE.Vector3(-0.70, 0.65, -0.30).normalize()));
      r *= 0.88 + 0.22 * Math.sin(p1 * 4.2);
      r *= 0.92 + 0.16 * Math.cos(p2 * 3.8);

      const ridge =
        Math.sin(v.x * 2.8 + v.y * 3.2) * 0.13 +
        Math.cos(v.y * 3.5 + v.z * 2.6) * 0.11 +
        Math.sin(v.z * 3.8 - v.x * 2.4) * 0.09;
      r += ridge;

      const micro =
        (Math.sin(v.x * 9.5) * Math.cos(v.y * 9.5) * Math.sin(v.z * 9.5)) * 0.035;
      r += micro;

      v.set(n.x * r * 1.25, n.y * r * 0.95, n.z * r * 1.10);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    stoneGeo.computeVertexNormals();

    const stoneMat = new THREE.MeshStandardMaterial({
      map: colorTex,
      bumpMap: bumpTex,
      bumpScale: 0.10,
      roughness: 0.52,
      metalness: 0.22,
    });

    const stoneMesh = new THREE.Mesh(stoneGeo, stoneMat);
    stoneMesh.position.set(0, -0.46, -2.2);
    stoneMesh.scale.setScalar(0.85);
    stoneMesh.rotation.set(0.18, 0.45, -0.15);
    scene.add(stoneMesh);

    // 6. Real 3D Physical Glass Shards
    const BACK_WINDOW_Z = -14.0;
    const BACK_WINDOW_Y = 0.82;
    const shards: ShardData[] = [];

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.95,
      opacity: 0.90,
      transparent: true,
      roughness: 0.05,
      metalness: 0.03,
      ior: 1.52,
      reflectivity: 0.98,
      side: THREE.DoubleSide,
    });

    for (let i = 0; i < SHARD_COUNT; i++) {
      const angle = (i / SHARD_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
      const r = (i < 24)
        ? (0.15 + Math.random() * 0.85)
        : (i < 56)
        ? (0.85 + Math.random() * 1.8)
        : (1.8 + Math.random() * 3.2);
      const rawX = Math.cos(angle) * r * 1.35;
      const rawY = BACK_WINDOW_Y + Math.sin(angle) * r * 0.90;
      const sx = Math.max(-4.8, Math.min(4.8, rawX));
      const sy = Math.max(BACK_WINDOW_Y - 3.0, Math.min(BACK_WINDOW_Y + 3.0, rawY));

      const shape = new THREE.Shape();
      const sSize = 0.08 + Math.random() * 0.22;
      shape.moveTo(0, 0);
      shape.lineTo(sSize * (0.8 + Math.random() * 0.6), sSize * (-0.4 + Math.random() * 0.8));
      shape.lineTo(sSize * (-0.3 + Math.random() * 0.6), sSize * (0.8 + Math.random() * 0.7));
      shape.closePath();

      const shardGeo = new THREE.ShapeGeometry(shape);
      const shardMesh = new THREE.Mesh(shardGeo, glassMat);

      shardMesh.position.set(sx, sy, BACK_WINDOW_Z);
      shardMesh.rotation.set(0, 0, Math.random() * Math.PI * 2);
      shardMesh.visible = false;
      scene.add(shardMesh);

      const speed = 4.2 + Math.random() * 7.5;
      shards.push({
        mesh: shardMesh,
        vx: Math.cos(angle) * speed * 1.35,
        vy: Math.sin(angle) * speed * 1.05 - 1.0,
        vz: -(speed * 4.5 + Math.random() * 6.0),
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 18
        ),
        basePos: new THREE.Vector3(sx, sy, BACK_WINDOW_Z),
      });
    }

    // 7. Render / Animation Loop
    let animId: number;

    const BASE_STONE_Z = -2.2;
    const BASE_STONE_Y = -0.46;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const p = pRef.current;

      // Camera Forward Travel & Stone Trajectory
      if (p < 0.06) {
        camera.position.set(0, 0.15, 6.0);
        stoneMesh.visible = true;
        stoneMesh.position.set(0, BASE_STONE_Y, BASE_STONE_Z);
        stoneMesh.scale.setScalar(0.85);
        stoneMesh.rotation.set(0.18, 0.45, -0.15);
        stoneMat.opacity = 1.0;
      } else if (p < 0.35) {
        const pThrow = (p - 0.06) / 0.29;
        const easeThrow = Math.pow(pThrow, 1.30);
        const easeTravel = Math.pow(pThrow, 1.15);

        camera.position.set(0, 0.15 + easeTravel * 0.25, 6.0 - easeTravel * 3.5);

        stoneMesh.visible = true;
        stoneMesh.position.x = 0;
        stoneMesh.position.y = BASE_STONE_Y + easeThrow * (BACK_WINDOW_Y - BASE_STONE_Y);
        stoneMesh.position.z = BASE_STONE_Z + easeThrow * (BACK_WINDOW_Z - BASE_STONE_Z);

        const scaleFactor = Math.max(0.45, 0.85 - easeThrow * 0.40);
        stoneMesh.scale.setScalar(scaleFactor);
        stoneMesh.rotation.set(0.18, 0.45, -0.15);
        stoneMat.opacity = 1.0;
      } else {
        const pFly = Math.min(1, (p - 0.35) / 0.65);
        const easeFly = Math.pow(pFly, 1.20);

        camera.position.set(
          easeFly * 5.8,
          0.40 - easeFly * 1.6,
          2.5 - easeFly * 26.5
        );
        camera.rotation.y = -easeFly * 0.42;
        camera.rotation.z = -easeFly * 0.10;

        const pStonePost = Math.min(1, (p - 0.35) / 0.25);
        if (pStonePost < 1) {
          stoneMesh.visible = true;
          stoneMesh.position.z = -14.0 - pStonePost * 16.0;
          stoneMesh.position.y = 0.82 - pStonePost * 4.0;
          stoneMesh.scale.setScalar(0.45);
          stoneMesh.rotation.set(0.18, 0.45, -0.15);
          stoneMat.opacity = Math.max(0, 1 - pStonePost * 1.6);
        } else {
          stoneMesh.visible = false;
        }
      }

      // Distant 3D Glass Shards Physics
      const isBroken = p >= 0.35;
      const pShatter = isBroken ? Math.min(1, (p - 0.35) / 0.35) : 0;
      const pFlyShards = isBroken ? Math.min(1, (p - 0.35) / 0.65) : 0;

      for (let i = 0; i < shards.length; i++) {
        const s = shards[i];
        if (!isBroken || pShatter <= 0) {
          s.mesh.visible = false;
        } else {
          s.mesh.visible = true;
          const t = Math.pow(pShatter, 0.72);

          s.mesh.position.x = s.basePos.x + s.vx * t;
          s.mesh.position.y = s.basePos.y + s.vy * t - t * t * 2.2;
          s.mesh.position.z = s.basePos.z + s.vz * t;

          s.mesh.rotation.x = s.rotSpeed.x * t * 4;
          s.mesh.rotation.y = s.rotSpeed.y * t * 4;
          s.mesh.rotation.z = s.rotSpeed.z * t * 4;

          glassMat.opacity = Math.max(0, 0.90 * (1 - pFlyShards * 1.6));
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      stoneGeo.dispose();
      stoneMat.dispose();
      glassMat.dispose();
      colorTex.dispose();
      bumpTex.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 14,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

export default CoreSpecimenCanvas;
