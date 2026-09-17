"use client";

import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import {
  PAVED_HALF_WIDTH,
  ROAD_CROWN,
  ROAD_SEGMENTS,
  ROAD_WIDTH,
  ROAD_Y,
  SHOULDER_WIDTH,
  smoothstep,
} from "./journeyPath";
import { buildRibbon, evenOffsets, mergeRibbons } from "./ribbon";
import { createAsphaltNormalMap, createAsphaltRoughnessMap } from "./proceduralTextures";
import { useJourneyProgress } from "../journeyProgress";

const HALF_ROAD = ROAD_WIDTH / 2;

/** Scratch colour for the asphalt's per-vertex variation. Reused, never stored. */
const ROAD_TINT = new THREE.Color();

/**
 * Cambered road surface: highest on the centreline, falling away to each edge.
 *
 * Quadratic rather than linear, because a linear camber creates a crease down
 * the centre of the road that catches the key light as a hard line.
 */
function camber(_t: number, offset: number): number {
  const across = offset / HALF_ROAD;
  return ROAD_Y + ROAD_CROWN * (1 - across * across);
}

/** Markings sit a hair above the surface they are painted on. */
function markingHeight(t: number, offset: number): number {
  return camber(t, offset) + 0.012;
}

/** Shoulders continue the camber's outward fall, slightly steeper. */
function shoulderHeight(_t: number, offset: number): number {
  const a = Math.abs(offset);
  const beyond = Math.max(0, a - HALF_ROAD);
  return ROAD_Y - 0.02 - beyond * 0.035;
}

/**
 * The road: asphalt, shoulders, curbs, edge lines and a dashed centre line.
 *
 * Understated on purpose. The brief is a premium logistics route, and a
 * premium route reads as expensive because the surface is clean, the camber is
 * right and the markings are crisp — not because anything on it is gold. The
 * only warm note is the centre dashes, pulled a long way down toward bone so
 * they do not announce themselves.
 */
export const Road: React.FC = () => {
  const progress = useJourneyProgress();
  const downGroundMatRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(() => {
    const mat = downGroundMatRef.current;
    if (!mat) return;
    const t = progress.current;
    // In side view (t < 0.82), the down side of the road is solid black.
    // When the camera angle changes (t >= 0.82 to 0.90), smoothly remove the blackness (fade to 0).
    const blackness = 1 - smoothstep(0.82, 0.90, t);
    mat.opacity = blackness;
    mat.visible = blackness > 0.005;
  });

  /*
   * Lateral resolution matters as much as longitudinal here. A single quad
   * across the carriageway would shade the camber as two flat triangles and
   * lose it entirely; 9 columns give the surface something to curve across.
   */
  const ROAD_FROM = -0.35;
  const ROAD_TO = 1.35;

  /**
   * Roadside ground ribbon on the DOWN side (near camera side, +X) of the highway.
   * Solid dark in side view so milestone text is crisp and readable,
   * then fades away to seamless white when the camera angle changes to the rear chase view.
   */
  const downGround = useMemo(
    () =>
      buildRibbon({
        offsets: [HALF_ROAD - 0.44, HALF_ROAD + 250],
        segments: ROAD_SEGMENTS,
        from: ROAD_FROM,
        to: ROAD_TO,
        height: (t, offset) => markingHeight(t, offset),
      }),
    [],
  );

  const asphalt = useMemo(
    () =>
      buildRibbon({
        offsets: evenOffsets(HALF_ROAD, 0, 9),
        segments: ROAD_SEGMENTS,
        from: ROAD_FROM,
        to: ROAD_TO,
        height: camber,
        vScale: 46,
        color: (t, offset) => {
          const s = t * 1003;
          const patch =
            0.055 * Math.sin(s * 0.021 + 1.3) +
            0.035 * Math.sin(s * 0.047 + offset * 0.09) +
            0.02 * Math.sin(s * 0.128 + 2.7);
          // Wheel tracks: two darker, more polished bands per lane.
          const track = Math.exp(-Math.pow((Math.abs(offset) - 3.6) / 1.5, 2)) * 0.06;
          const value = THREE.MathUtils.clamp(0.93 + patch - track, 0.78, 1);
          return ROAD_TINT.setRGB(value, value, value * 1.01);
        },
      }),
    [],
  );

  const shoulders = useMemo(() => {
    const build = (sign: number) =>
      buildRibbon({
        offsets: evenOffsets(SHOULDER_WIDTH / 2, sign * (HALF_ROAD + SHOULDER_WIDTH / 2), 3),
        segments: ROAD_SEGMENTS,
        from: ROAD_FROM,
        to: ROAD_TO,
        height: shoulderHeight,
        vScale: 46,
      });
    return mergeRibbons([build(-1), build(1)]);
  }, []);

  /*
   * A thin vertical face at the outer edge of the shoulder. This is the single
   * cheapest thing in the scene for making the road look built rather than
   * painted on: it gives the carriageway a measurable thickness, and it is
   * what catches a bright rim of key light along the whole route.
   */
  const curbs = useMemo(() => {
    const build = (sign: number) =>
      buildRibbon({
        offsets: [sign * PAVED_HALF_WIDTH, sign * (PAVED_HALF_WIDTH + 0.55)],
        segments: ROAD_SEGMENTS,
        from: ROAD_FROM,
        to: ROAD_TO,
        height: (t, offset) =>
          Math.abs(offset) > PAVED_HALF_WIDTH + 0.2 ? -0.75 : shoulderHeight(t, offset),
      });
    return mergeRibbons([build(-1), build(1)]);
  }, []);


  const edgeLines = useMemo(() => {
    const build = (sign: number) =>
      buildRibbon({
        offsets: [sign * (HALF_ROAD - 0.78), sign * (HALF_ROAD - 0.44)],
        segments: ROAD_SEGMENTS,
        from: ROAD_FROM,
        to: ROAD_TO,
        height: markingHeight,
      });
    return mergeRibbons([build(-1), build(1)]);
  }, []);

  /*
   * Dashes are spaced by curve parameter rather than by metres.
   * Multi-lane dashed white lines on both sides of the truck (-3.6 and +3.6)
   * matching the highway overhead perspective from unitedcarriers.com.
   */
  const centreDashes = useMemo(() => {
    const DASH_COUNT = 86;
    const DUTY = 0.42; // painted fraction of each dash-plus-gap cycle
    const parts: THREE.BufferGeometry[] = [];
    [-3.6, 3.6].forEach((laneOffset) => {
      for (let i = -30; i < DASH_COUNT + 30; i++) {
        const from = i / DASH_COUNT;
        parts.push(
          buildRibbon({
            offsets: [laneOffset - 0.18, laneOffset + 0.18],
            segments: 2,
            from,
            to: from + DUTY / DASH_COUNT,
            height: markingHeight,
          }),
        );
      }
    });
    return mergeRibbons(parts);
  }, []);

  const roughnessMap = useMemo(() => createAsphaltRoughnessMap(256), []);
  const normalMap = useMemo(() => createAsphaltNormalMap(256), []);

  useEffect(() => {
    // Tile textures along the highway at realistic aggregate scale to prevent blurry specular noise
    roughnessMap.wrapS = THREE.RepeatWrapping;
    roughnessMap.wrapT = THREE.RepeatWrapping;
    roughnessMap.repeat.set(4, 60);

    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(4, 60);
  }, [roughnessMap, normalMap]);

  // Geometry and textures are built here rather than declared as JSX, so
  // nothing disposes them automatically. Released explicitly on unmount.
  useEffect(
    () => () => {
      asphalt.dispose();
      shoulders.dispose();
      curbs.dispose();
      downGround.dispose();
      edgeLines.dispose();
      centreDashes.dispose();
      roughnessMap.dispose();
      normalMap.dispose();
    },
    [asphalt, shoulders, curbs, downGround, edgeLines, centreDashes, roughnessMap, normalMap],
  );

  return (
    <group>
      {/* Down-side ground ribbon: black in side view, fades out when camera angle changes */}
      <mesh geometry={downGround}>
        <meshBasicMaterial
          ref={downGroundMatRef}
          color="#0b0d13"
          transparent
          opacity={1}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <mesh geometry={curbs} receiveShadow castShadow>
        <meshStandardMaterial color="#ffffff" roughness={0.9} metalness={0.05} />
      </mesh>

      <mesh geometry={shoulders} receiveShadow>
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.95}
          metalness={0.02}
          roughnessMap={roughnessMap}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.1, 0.1)}
        />
      </mesh>

      {/* Dark sleek obsidian-charcoal asphalt carriageway matching unitedcarriers.com */}
      <mesh geometry={asphalt} receiveShadow>
        <meshStandardMaterial
          color="#16191f"
          roughness={0.88}
          metalness={0.04}
          roughnessMap={roughnessMap}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.1, 0.1)}
          envMapIntensity={0.65}
        />
      </mesh>

      <mesh geometry={edgeLines}>
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.4}
          metalness={0.04}
          emissive="#ffffff"
          emissiveIntensity={0.25}
        />
      </mesh>

      <mesh geometry={centreDashes}>
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.3}
          metalness={0.04}
          emissive="#ffffff"
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
};

export default Road;
