"use client";

import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import {
  PAVED_HALF_WIDTH,
  ROAD_CROWN,
  ROAD_SEGMENTS,
  ROAD_WIDTH,
  ROAD_Y,
  SHOULDER_WIDTH,
} from "./journeyPath";
import { buildRibbon, evenOffsets, mergeRibbons } from "./ribbon";
import { createAsphaltNormalMap, createAsphaltRoughnessMap } from "./proceduralTextures";

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
  /*
   * Lateral resolution matters as much as longitudinal here. A single quad
   * across the carriageway would shade the camber as two flat triangles and
   * lose it entirely; 9 columns give the surface something to curve across.
   */
  const asphalt = useMemo(
    () =>
      buildRibbon({
        offsets: evenOffsets(HALF_ROAD, 0, 9),
        segments: ROAD_SEGMENTS,
        height: camber,
        vScale: 46,
        /*
         * Low-frequency surface variation: resurfacing patches, the darker
         * lane where traffic polishes the aggregate, and a faint seam down the
         * centre. The roughness map already breaks up the specular, but it
         * tiles every few metres — this works at the scale of tens of metres,
         * which is what stops a kilometre of road reading as one extruded
         * material.
         *
         * Multiplied against the base colour, so these stay near white.
         */
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
        height: markingHeight,
      });
    return mergeRibbons([build(-1), build(1)]);
  }, []);

  /*
   * Dashes are spaced by curve parameter rather than by metres. Because the
   * curve is arc-length parameterised (see journeyPath), equal steps in t are
   * equal steps in distance, so the spacing stays even through the bends
   * instead of bunching up on the inside of each turn.
   */
  const centreDashes = useMemo(() => {
    const DASH_COUNT = 86;
    const DUTY = 0.42; // painted fraction of each dash-plus-gap cycle
    const parts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < DASH_COUNT; i++) {
      const from = i / DASH_COUNT;
      parts.push(
        buildRibbon({
          offsets: [-0.19, 0.19],
          segments: 2,
          from,
          to: from + DUTY / DASH_COUNT,
          height: markingHeight,
        }),
      );
    }
    return mergeRibbons(parts);
  }, []);

  const roughnessMap = useMemo(() => createAsphaltRoughnessMap(256), []);
  const normalMap = useMemo(() => createAsphaltNormalMap(256), []);

  useEffect(() => {
    // The texture repeats along the road's length, not across its width: the
    // V coordinate is scaled in the ribbon, so only the U side needs setting.
    for (const map of [roughnessMap, normalMap]) {
      map.repeat.set(2, 1);
    }
  }, [roughnessMap, normalMap]);

  // Geometry and textures are built here rather than declared as JSX, so
  // nothing disposes them automatically. Released explicitly on unmount.
  useEffect(
    () => () => {
      asphalt.dispose();
      shoulders.dispose();
      curbs.dispose();
      edgeLines.dispose();
      centreDashes.dispose();
      roughnessMap.dispose();
      normalMap.dispose();
    },
    [asphalt, shoulders, curbs, edgeLines, centreDashes, roughnessMap, normalMap],
  );

  return (
    <group>
      <mesh geometry={curbs} receiveShadow castShadow>
        <meshStandardMaterial color="#19212e" roughness={0.94} metalness={0.05} />
      </mesh>

      <mesh geometry={shoulders} receiveShadow>
        <meshStandardMaterial
          color="#242d3c"
          roughness={0.97}
          metalness={0.02}
          roughnessMap={roughnessMap}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.8, 0.8)}
        />
      </mesh>

      {/*
       * Physical rather than standard material for the carriageway alone.
       * Clearcoat is what gives asphalt its faint wet sheen under a low key
       * light — a broad, soft reflection sitting on top of a rough diffuse
       * base, which a standard material cannot express at any roughness.
       */}
      <mesh geometry={asphalt} receiveShadow>
        <meshPhysicalMaterial
          vertexColors
          color="#2a3243"
          roughness={0.7}
          metalness={0.06}
          roughnessMap={roughnessMap}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.55, 0.55)}
          clearcoat={0.72}
          clearcoatRoughness={0.36}
          envMapIntensity={1.35}
        />
      </mesh>

      <mesh geometry={edgeLines}>
        <meshStandardMaterial
          color="#d7deea"
          roughness={0.52}
          metalness={0.04}
          emissive="#5a688f"
          emissiveIntensity={0.5}
        />
      </mesh>

      <mesh geometry={centreDashes}>
        <meshStandardMaterial
          color="#e8dcbe"
          roughness={0.5}
          metalness={0.04}
          emissive="#5c5236"
          emissiveIntensity={0.42}
        />
      </mesh>
    </group>
  );
};

export default Road;
