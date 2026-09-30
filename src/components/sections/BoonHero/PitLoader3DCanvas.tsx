"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export interface PitLoader3DCanvasProps {
  /** Scroll progress from BoonHero (0 to 1) */
  progress: number;
}

export const PitLoader3DCanvas: React.FC<PitLoader3DCanvasProps> = ({ progress }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pRef = useRef(progress);
  pRef.current = progress;

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // ------------------------------------------------------------------------
    // 1. WebGL Renderer
    // ------------------------------------------------------------------------
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    renderer.setSize(width, height);

    // ------------------------------------------------------------------------
    // 2. Scene & Camera Setup (Overhead 3/4 view matching Canva design)
    // ------------------------------------------------------------------------
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0e1117, 0.016);

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.5, 120);
    // Camera positioned high and slightly back, looking down into the open pit
    camera.position.set(0.5, 14.5, 18.0);
    const cameraTarget = new THREE.Vector3(0, 1.2, 0);
    camera.lookAt(cameraTarget);

    // ------------------------------------------------------------------------
    // 3. Lighting (Strong directional mining sun matching Canva shadows)
    // ------------------------------------------------------------------------
    const ambientLight = new THREE.AmbientLight(0x9cb0c6, 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff3db, 3.2);
    // Sun from top-right, casting realistic shadows toward bottom-left
    sunLight.position.set(16, 26, 14);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 2;
    sunLight.shadow.camera.far = 60;
    sunLight.shadow.camera.left = -16;
    sunLight.shadow.camera.right = 16;
    sunLight.shadow.camera.top = 16;
    sunLight.shadow.camera.bottom = -16;
    sunLight.shadow.bias = -0.0006;
    scene.add(sunLight);

    const pitSkyBounce = new THREE.DirectionalLight(0x40556e, 1.1);
    pitSkyBounce.position.set(-14, 10, -10);
    scene.add(pitSkyBounce);

    // ------------------------------------------------------------------------
    // 4. Materials
    // ------------------------------------------------------------------------
    const redPaintMat = new THREE.MeshStandardMaterial({
      color: 0xc42222,
      roughness: 0.35,
      metalness: 0.22,
    });

    const darkOreBedMat = new THREE.MeshStandardMaterial({
      color: 0x6e1b1b,
      roughness: 0.55,
      metalness: 0.15,
    });

    const catYellowMat = new THREE.MeshStandardMaterial({
      color: 0xf5b018,
      roughness: 0.38,
      metalness: 0.20,
    });

    const darkSteelMat = new THREE.MeshStandardMaterial({
      color: 0x222428,
      roughness: 0.52,
      metalness: 0.65,
    });

    const bucketSteelMat = new THREE.MeshStandardMaterial({
      color: 0x3a3d42,
      roughness: 0.44,
      metalness: 0.75,
    });

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      roughness: 0.15,
      metalness: 0.95,
    });

    const tireRubberMat = new THREE.MeshStandardMaterial({
      color: 0x161719,
      roughness: 0.88,
      metalness: 0.05,
    });

    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x8a929a,
      roughness: 0.45,
      metalness: 0.7,
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x182430,
      roughness: 0.12,
      metalness: 0.88,
      transparent: true,
      opacity: 0.78,
    });

    const darkOreRockMat = new THREE.MeshStandardMaterial({
      color: 0x1a1b1e,
      roughness: 0.92,
      metalness: 0.12,
    });

    // ------------------------------------------------------------------------
    // 5. Open-Pit Terrain (Dark coal/ore earth with mounds & tire tracks)
    // ------------------------------------------------------------------------
    const groundGeo = new THREE.PlaneGeometry(65, 65, 48, 48);
    const posAttr = groundGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      // Gentle slope and mounds
      let vz = Math.sin(vx * 0.14) * 0.4 + Math.cos(vy * 0.12) * 0.35;
      // Big spoil mound in the background
      const distToMound = Math.hypot(vx - (-4), vy - 10);
      if (distToMound < 12) {
        vz += (1 - distToMound / 12) * 3.8;
      }
      posAttr.setZ(i, vz);
    }
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1e2024,
      roughness: 0.96,
      metalness: 0.08,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -0.05;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Spoil Pile Mesh behind the loader
    const pileGeo = new THREE.ConeGeometry(7.5, 4.2, 18);
    const pileMesh = new THREE.Mesh(pileGeo, darkOreRockMat);
    pileMesh.position.set(4.5, 2.0, -2.5);
    pileMesh.rotation.y = 0.4;
    pileMesh.castShadow = true;
    pileMesh.receiveShadow = true;
    scene.add(pileMesh);

    // ------------------------------------------------------------------------
    // 6. MACHINE 1: RED SCANIA DUMP TRUCK (Foreground Left)
    // ------------------------------------------------------------------------
    const truckGroup = new THREE.Group();
    truckGroup.position.set(-3.2, 0, 1.2);
    truckGroup.rotation.y = 0.08; // slightly angled toward loader
    scene.add(truckGroup);

    // A. Truck Chassis
    const chassisGeo = new THREE.BoxGeometry(2.3, 0.45, 7.8);
    const chassisMesh = new THREE.Mesh(chassisGeo, darkSteelMat);
    chassisMesh.position.set(0, 0.85, 0);
    chassisMesh.castShadow = true;
    chassisMesh.receiveShadow = true;
    truckGroup.add(chassisMesh);

    // B. Red Cab
    const cabGeo = new THREE.BoxGeometry(2.35, 2.2, 2.2);
    const cabMesh = new THREE.Mesh(cabGeo, redPaintMat);
    cabMesh.position.set(0, 2.1, 2.8);
    cabMesh.castShadow = true;
    cabMesh.receiveShadow = true;
    truckGroup.add(cabMesh);

    // Cab windshield
    const windshieldGeo = new THREE.BoxGeometry(2.1, 0.85, 0.1);
    const windshieldMesh = new THREE.Mesh(windshieldGeo, glassMat);
    windshieldMesh.position.set(0, 2.45, 3.92);
    truckGroup.add(windshieldMesh);

    // Cab front grille
    const grilleGeo = new THREE.BoxGeometry(1.8, 0.75, 0.12);
    const grilleMesh = new THREE.Mesh(grilleGeo, darkSteelMat);
    grilleMesh.position.set(0, 1.45, 3.92);
    truckGroup.add(grilleMesh);

    // Chrome grille horizontal bars
    for (let g = 0; g < 3; g++) {
      const barGeo = new THREE.BoxGeometry(1.6, 0.08, 0.05);
      const barMesh = new THREE.Mesh(barGeo, chromeMat);
      barMesh.position.set(0, 1.35 + g * 0.22, 3.98);
      truckGroup.add(barMesh);
    }

    // Cab roof spoiler
    const spoilerGeo = new THREE.BoxGeometry(2.35, 0.35, 0.8);
    const spoilerMesh = new THREE.Mesh(spoilerGeo, redPaintMat);
    spoilerMesh.position.set(0, 3.3, 2.4);
    truckGroup.add(spoilerMesh);

    // C. Large Red Dump Bed (Hopper Body)
    const dumpBedGroup = new THREE.Group();
    dumpBedGroup.position.set(0, 1.2, -0.6);
    truckGroup.add(dumpBedGroup);

    // Bed floor
    const bedFloorGeo = new THREE.BoxGeometry(2.4, 0.2, 5.0);
    const bedFloorMesh = new THREE.Mesh(bedFloorGeo, darkOreBedMat);
    bedFloorMesh.position.set(0, 0.1, 0);
    bedFloorMesh.castShadow = true;
    bedFloorMesh.receiveShadow = true;
    dumpBedGroup.add(bedFloorMesh);

    // Bed walls (Left, Right, Front, Rear tailgate)
    const sideWallGeo = new THREE.BoxGeometry(0.15, 1.5, 5.0);
    const leftWall = new THREE.Mesh(sideWallGeo, redPaintMat);
    leftWall.position.set(-1.15, 0.85, 0);
    leftWall.castShadow = true;
    dumpBedGroup.add(leftWall);

    const rightWall = new THREE.Mesh(sideWallGeo, redPaintMat);
    rightWall.position.set(1.15, 0.85, 0);
    rightWall.castShadow = true;
    dumpBedGroup.add(rightWall);

    const frontWallGeo = new THREE.BoxGeometry(2.4, 1.5, 0.15);
    const frontWall = new THREE.Mesh(frontWallGeo, redPaintMat);
    frontWall.position.set(0, 0.85, 2.42);
    frontWall.castShadow = true;
    dumpBedGroup.add(frontWall);

    // Cab rock shield overhang
    const shieldGeo = new THREE.BoxGeometry(2.4, 0.15, 1.2);
    const shieldMesh = new THREE.Mesh(shieldGeo, redPaintMat);
    shieldMesh.position.set(0, 1.6, 2.9);
    shieldMesh.rotation.x = -0.15;
    shieldMesh.castShadow = true;
    dumpBedGroup.add(shieldMesh);

    const rearGateGeo = new THREE.BoxGeometry(2.4, 1.5, 0.15);
    const rearGate = new THREE.Mesh(rearGateGeo, redPaintMat);
    rearGate.position.set(0, 0.85, -2.42);
    rearGate.castShadow = true;
    dumpBedGroup.add(rearGate);

    // Dynamic Ore Pile inside Dump Bed (grows as loader dumps)
    const truckOreGeo = new THREE.ConeGeometry(1.05, 1.1, 14);
    const truckOreMesh = new THREE.Mesh(truckOreGeo, darkOreRockMat);
    truckOreMesh.position.set(0, 0.6, 0.2);
    truckOreMesh.scale.set(1.0, 0.3, 2.0); // starts partially filled
    truckOreMesh.castShadow = true;
    dumpBedGroup.add(truckOreMesh);

    // D. Truck Wheels (6 large off-road wheels)
    const truckWheels: THREE.Mesh[] = [];
    const wheelPositions = [
      [-1.25, 0.65, 2.8],  // Front Left
      [1.25, 0.65, 2.8],   // Front Right
      [-1.25, 0.65, -1.3], // Mid-Rear Left
      [1.25, 0.65, -1.3],  // Mid-Rear Right
      [-1.25, 0.65, -2.6], // Rear-Rear Left
      [1.25, 0.65, -2.6],  // Rear-Rear Right
    ];

    const wheelGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.44, 20);
    wheelGeo.rotateZ(Math.PI / 2);
    const rimGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.46, 16);
    rimGeo.rotateZ(Math.PI / 2);

    wheelPositions.forEach(([wx, wy, wz]) => {
      const tire = new THREE.Mesh(wheelGeo, tireRubberMat);
      tire.position.set(wx, wy, wz);
      tire.castShadow = true;
      const rim = new THREE.Mesh(rimGeo, rimMat);
      tire.add(rim);
      truckGroup.add(tire);
      truckWheels.push(tire);
    });

    // ------------------------------------------------------------------------
    // 7. MACHINE 2: GIANT YELLOW WHEEL LOADER (Foreground Right)
    // ------------------------------------------------------------------------
    const loaderGroup = new THREE.Group();
    loaderGroup.position.set(3.8, 0, 0.8);
    loaderGroup.rotation.y = -0.55; // angled toward the truck
    scene.add(loaderGroup);

    // A. Loader Rear Chassis & Engine Bay
    const loaderChassisGeo = new THREE.BoxGeometry(2.8, 1.4, 4.2);
    const loaderChassis = new THREE.Mesh(loaderChassisGeo, catYellowMat);
    loaderChassis.position.set(0, 1.8, -1.2);
    loaderChassis.castShadow = true;
    loaderChassis.receiveShadow = true;
    loaderGroup.add(loaderChassis);

    // Heavy rear counterweight
    const counterweightGeo = new THREE.BoxGeometry(2.9, 1.2, 0.9);
    const counterweight = new THREE.Mesh(counterweightGeo, darkSteelMat);
    counterweight.position.set(0, 1.7, -3.4);
    counterweight.castShadow = true;
    loaderGroup.add(counterweight);

    // Dual black exhaust stacks
    for (let ex = -0.5; ex <= 0.5; ex += 1.0) {
      const exhaustGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.1, 12);
      const exhaust = new THREE.Mesh(exhaustGeo, darkSteelMat);
      exhaust.position.set(ex, 2.9, -2.4);
      exhaust.castShadow = true;
      loaderGroup.add(exhaust);
    }

    // High Elevated Operator Cab
    const cabTowerGeo = new THREE.BoxGeometry(1.8, 1.7, 1.8);
    const loaderCab = new THREE.Mesh(cabTowerGeo, catYellowMat);
    loaderCab.position.set(0, 3.2, -0.6);
    loaderCab.castShadow = true;
    loaderGroup.add(loaderCab);

    // Cab glass
    const loaderCabGlassGeo = new THREE.BoxGeometry(1.6, 1.1, 1.2);
    const loaderCabGlass = new THREE.Mesh(loaderCabGlassGeo, glassMat);
    loaderCabGlass.position.set(0, 3.3, -0.3);
    loaderGroup.add(loaderCabGlass);

    // Amber roof beacon
    const beaconGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.18, 10);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xff8800,
      emissiveIntensity: 0.9,
    });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(0, 4.15, -0.6);
    loaderGroup.add(beacon);

    // Giant Loader Wheels (4 massive deep-tread tires)
    const loaderWheels: THREE.Mesh[] = [];
    const loaderWheelGeo = new THREE.CylinderGeometry(1.15, 1.15, 0.72, 24);
    loaderWheelGeo.rotateZ(Math.PI / 2);
    const loaderRimGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.76, 18);
    loaderRimGeo.rotateZ(Math.PI / 2);

    const loaderWheelPositions = [
      [-1.75, 1.15, 1.5],  // Front Left
      [1.75, 1.15, 1.5],   // Front Right
      [-1.75, 1.15, -2.0], // Rear Left
      [1.75, 1.15, -2.0],  // Rear Right
    ];

    loaderWheelPositions.forEach(([lx, ly, lz]) => {
      const tire = new THREE.Mesh(loaderWheelGeo, tireRubberMat);
      tire.position.set(lx, ly, lz);
      tire.castShadow = true;
      const rim = new THREE.Mesh(loaderRimGeo, catYellowMat);
      tire.add(rim);
      loaderGroup.add(tire);
      loaderWheels.push(tire);
    });

    // B. Articulated Hydraulic Boom Arms & Linkage
    const boomPivot = new THREE.Group();
    boomPivot.position.set(0, 1.6, 1.4); // Pivot point at front chassis
    loaderGroup.add(boomPivot);

    // Twin heavy lift arms
    const leftArmGeo = new THREE.BoxGeometry(0.24, 0.45, 3.8);
    const leftArm = new THREE.Mesh(leftArmGeo, catYellowMat);
    leftArm.position.set(-1.1, 0.2, 1.8);
    leftArm.castShadow = true;
    boomPivot.add(leftArm);

    const rightArm = new THREE.Mesh(leftArmGeo, catYellowMat);
    rightArm.position.set(1.1, 0.2, 1.8);
    rightArm.castShadow = true;
    boomPivot.add(rightArm);

    // Chrome hydraulic cylinder rods
    const cylinderRodGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.4, 12);
    cylinderRodGeo.rotateX(Math.PI / 2);
    const leftRod = new THREE.Mesh(cylinderRodGeo, chromeMat);
    leftRod.position.set(-0.8, -0.2, 1.2);
    boomPivot.add(leftRod);

    const rightRod = new THREE.Mesh(cylinderRodGeo, chromeMat);
    rightRod.position.set(0.8, -0.2, 1.2);
    boomPivot.add(rightRod);

    // C. Articulated Heavy Steel Scoop Bucket
    const bucketPivot = new THREE.Group();
    bucketPivot.position.set(0, 0.2, 3.7); // Mounted at tip of boom
    boomPivot.add(bucketPivot);

    // Bucket scoop geometry
    const bucketBodyGeo = new THREE.BoxGeometry(3.6, 1.6, 1.6);
    const bucketBody = new THREE.Mesh(bucketBodyGeo, bucketSteelMat);
    bucketBody.position.set(0, 0.4, 0.4);
    bucketBody.castShadow = true;
    bucketPivot.add(bucketBody);

    // Bucket cutting teeth
    for (let t = -1.5; t <= 1.5; t += 0.6) {
      const toothGeo = new THREE.ConeGeometry(0.12, 0.4, 4);
      toothGeo.rotateX(Math.PI / 2);
      const tooth = new THREE.Mesh(toothGeo, chromeMat);
      tooth.position.set(t, -0.3, 1.3);
      tooth.castShadow = true;
      bucketPivot.add(tooth);
    }

    // Ore inside the loader bucket
    const bucketOreGeo = new THREE.SphereGeometry(1.2, 12, 8);
    const bucketOre = new THREE.Mesh(bucketOreGeo, darkOreRockMat);
    bucketOre.scale.set(1.3, 0.6, 0.8);
    bucketOre.position.set(0, 0.7, 0.4);
    bucketOre.castShadow = true;
    bucketPivot.add(bucketOre);

    // ------------------------------------------------------------------------
    // 8. 3D Tumbling Ore Cascade System (Dumping from bucket into truck)
    // ------------------------------------------------------------------------
    const ROCK_COUNT = 32;
    const rockGeo = new THREE.DodecahedronGeometry(0.24, 0);
    const rockInstanced = new THREE.InstancedMesh(rockGeo, darkOreRockMat, ROCK_COUNT);
    rockInstanced.castShadow = true;
    scene.add(rockInstanced);

    const dummy = new THREE.Object3D();
    interface RockState {
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      vz: number;
      rotSpeed: THREE.Vector3;
      scale: number;
    }

    const rocks: RockState[] = [];
    for (let r = 0; r < ROCK_COUNT; r++) {
      rocks.push({
        x: 0,
        y: -100, // hidden initially
        z: 0,
        vx: (Math.random() - 0.5) * 0.8 - 1.2,
        vy: -2.0 - Math.random() * 2.5,
        vz: (Math.random() - 0.5) * 0.8,
        rotSpeed: new THREE.Vector3(
          Math.random() * 5,
          Math.random() * 5,
          Math.random() * 5
        ),
        scale: 0.6 + Math.random() * 0.7,
      });
    }

    // ------------------------------------------------------------------------
    // 9. MACHINE 3: BACKGROUND CRAWLER BULLDOZER (Top-Left Mound)
    // ------------------------------------------------------------------------
    const dozerGroup = new THREE.Group();
    dozerGroup.position.set(-6.5, 3.4, -6.5);
    dozerGroup.rotation.y = 0.85; // angled pushing along the berm
    scene.add(dozerGroup);

    // Dozer Tracks
    const trackGeo = new THREE.BoxGeometry(0.5, 0.8, 3.2);
    const leftTrack = new THREE.Mesh(trackGeo, darkSteelMat);
    leftTrack.position.set(-1.1, 0.4, 0);
    leftTrack.castShadow = true;
    dozerGroup.add(leftTrack);

    const rightTrack = new THREE.Mesh(trackGeo, darkSteelMat);
    rightTrack.position.set(1.1, 0.4, 0);
    rightTrack.castShadow = true;
    dozerGroup.add(rightTrack);

    // Dozer Body
    const dozerBodyGeo = new THREE.BoxGeometry(1.8, 1.2, 2.6);
    const dozerBody = new THREE.Mesh(dozerBodyGeo, catYellowMat);
    dozerBody.position.set(0, 1.2, 0);
    dozerBody.castShadow = true;
    dozerGroup.add(dozerBody);

    // Dozer Cab
    const dozerCabGeo = new THREE.BoxGeometry(1.4, 1.2, 1.2);
    const dozerCab = new THREE.Mesh(dozerCabGeo, catYellowMat);
    dozerCab.position.set(0, 2.2, -0.3);
    dozerCab.castShadow = true;
    dozerGroup.add(dozerCab);

    // Dozer Heavy Push Blade
    const bladeGeo = new THREE.BoxGeometry(2.8, 1.1, 0.25);
    const dozerBlade = new THREE.Mesh(bladeGeo, darkSteelMat);
    dozerBlade.position.set(0, 0.6, 1.8);
    dozerBlade.castShadow = true;
    dozerGroup.add(dozerBlade);

    // ------------------------------------------------------------------------
    // 10. Animation Loop Driven Strictly by Scroll Progress `p`
    // ------------------------------------------------------------------------
    let animId: number;

    const renderLoop = () => {
      const p = pRef.current;

      // Internal loading timeline phase [0 to 1] mapped across relevant scroll span
      const phase = Math.min(1, Math.max(0, (p - 0.22) / 0.58));

      // 1. Yellow Loader Hydraulic Motion
      // - phase 0.0 -> 0.30: Loader drives slightly forward, tilts bucket up
      // - phase 0.30 -> 0.60: Boom lifts high up over red truck bed
      // - phase 0.60 -> 0.85: Bucket dumps ore into the red truck
      // - phase 0.85 -> 1.0: Boom begins lowering, red truck prepares to depart
      let boomAngle = 0;
      let bucketAngle = 0;
      let loaderZ = 0.8;
      let loaderWheelRot = 0;

      if (phase < 0.25) {
        // Approaching & scooping
        const tSub = phase / 0.25;
        loaderZ = 1.4 - tSub * 0.6;
        loaderWheelRot = -tSub * Math.PI * 0.8;
        boomAngle = -0.15 + tSub * 0.25;
        bucketAngle = -0.2 + tSub * 0.3;
        bucketOre.visible = true;
      } else if (phase < 0.55) {
        // Raising boom high over the truck
        const tSub = (phase - 0.25) / 0.30;
        boomAngle = 0.10 + tSub * 0.68; // raises up ~45 degrees
        bucketAngle = 0.10 - tSub * 0.20; // curls back to keep ore from spilling
        bucketOre.visible = true;
      } else if (phase < 0.80) {
        // Tilting bucket to dump ore into the red truck!
        const tSub = (phase - 0.55) / 0.25;
        boomAngle = 0.78 - tSub * 0.05;
        bucketAngle = -0.10 + tSub * 0.95; // dumps forward ~55 degrees
        bucketOre.scale.setScalar(Math.max(0.01, 1 - tSub * 0.95));
      } else {
        // Resetting
        const tSub = (phase - 0.80) / 0.20;
        boomAngle = 0.73 - tSub * 0.40;
        bucketAngle = 0.85 - tSub * 0.65;
        bucketOre.visible = false;
      }

      boomPivot.rotation.x = -boomAngle;
      bucketPivot.rotation.x = bucketAngle;
      loaderGroup.position.z = loaderZ;

      // Wheel rotation
      loaderWheels.forEach((w) => {
        w.rotation.x = loaderWheelRot;
      });

      // 2. Cascade of Falling Ore Rocks into Red Truck
      if (phase >= 0.58 && phase <= 0.82) {
        const dumpSub = (phase - 0.58) / 0.24;
        rockInstanced.visible = true;

        // Bucket lip world position in scene
        const bucketTip = new THREE.Vector3(0, 0.4, 1.2);
        bucketPivot.localToWorld(bucketTip);

        rocks.forEach((rock, idx) => {
          // Staggered release
          const rockOffset = idx / ROCK_COUNT;
          const rockProgress = Math.max(0, (dumpSub - rockOffset * 0.5) / 0.5);

          if (rockProgress > 0 && rockProgress < 1.0) {
            const rx = bucketTip.x + rock.vx * rockProgress;
            const ry = bucketTip.y + rock.vy * rockProgress - 4.9 * rockProgress * rockProgress;
            const rz = bucketTip.z + rock.vz * rockProgress;

            dummy.position.set(rx, ry, rz);
            dummy.rotation.x += rock.rotSpeed.x * 0.05;
            dummy.rotation.y += rock.rotSpeed.y * 0.05;
            dummy.scale.setScalar(rock.scale * (1 - rockProgress * 0.2));
            dummy.updateMatrix();
            rockInstanced.setMatrixAt(idx, dummy.matrix);
          } else {
            dummy.position.set(0, -100, 0);
            dummy.updateMatrix();
            rockInstanced.setMatrixAt(idx, dummy.matrix);
          }
        });
        rockInstanced.instanceMatrix.needsUpdate = true;
      } else {
        rockInstanced.visible = false;
      }

      // 3. Red Truck Reactions (suspension dips under ore load, ore pile grows)
      if (phase >= 0.60) {
        const fillP = Math.min(1, (phase - 0.60) / 0.22);
        // Suspension flexes down under the heavy payload
        const suspensionDip = Math.sin(fillP * Math.PI) * 0.08;
        truckGroup.position.y = -suspensionDip;
        // Ore mound inside bed grows
        truckOreMesh.scale.set(1.15, 0.3 + fillP * 0.85, 2.1);
      } else {
        truckGroup.position.y = 0;
        truckOreMesh.scale.set(1.0, 0.3, 2.0);
      }

      // 4. Background Bulldozer blade & push motion
      const dozerP = (phase * 1.5) % 1.0;
      dozerGroup.position.z = -6.5 + dozerP * 0.8;
      dozerBlade.rotation.x = Math.sin(dozerP * Math.PI * 2) * 0.05;

      // 5. Dynamic Camera Flight into the 3D Pit
      // As p increases past 0.35, camera pushes forward into the loading action
      if (p >= 0.35) {
        const pFly = Math.min(1, (p - 0.35) / 0.45);
        const easeFly = Math.pow(pFly, 1.25);
        camera.position.set(
          0.5 - easeFly * 1.5,
          14.5 - easeFly * 6.5,
          18.0 - easeFly * 9.5
        );
        camera.lookAt(
          cameraTarget.x - easeFly * 1.2,
          cameraTarget.y + 0.5,
          cameraTarget.z
        );
      } else {
        camera.position.set(0.5, 14.5, 18.0);
        camera.lookAt(cameraTarget);
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);

    // Resize handling
    const handleResize = () => {
      if (!container) return;
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
      groundGeo.dispose();
      groundMat.dispose();
      chassisGeo.dispose();
      redPaintMat.dispose();
      catYellowMat.dispose();
      darkSteelMat.dispose();
      bucketSteelMat.dispose();
      chromeMat.dispose();
      tireRubberMat.dispose();
      rimMat.dispose();
      glassMat.dispose();
      darkOreRockMat.dispose();
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
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          objectFit: "cover",
        }}
      />
    </div>
  );
};

export default PitLoader3DCanvas;
