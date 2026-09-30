import * as THREE from "three";
import { getExtendedPoint, getExtendedSide } from "./journeyPath";

/**
 * Sweeps a surface along the journey curve.
 *
 * Everything that hugs the road is one of these: the asphalt, the shoulders,
 * the lane markings, the curbs, and the terrain corridor itself. They differ
 * only in how wide they are, how far off the centreline they sit, and what
 * height function they use — so there is one sweep here rather than five
 * near-identical loops, and anything added later (a rumble strip, a barrier)
 * is a call rather than a copy.
 */
export interface RibbonOptions {
  /**
   * Lateral offsets from the road centreline, in world units, ordered left to
   * right. Spacing does not have to be uniform — the terrain deliberately
   * packs columns near the road and spreads them out into the distance, so
   * vertices land where they are actually seen.
   */
  offsets: number[];
  /** Samples taken along the curve. One more row of vertices than this. */
  segments: number;
  /** Curve parameter to start at. May be negative, for terrain past the start. */
  from?: number;
  /** Curve parameter to end at. May exceed 1, for terrain past the finish. */
  to?: number;
  /**
   * Height at a given point, in world units above y = 0.
   *
   * @param t curve parameter at this row
   * @param offset lateral offset of this column
   */
  height?: (t: number, offset: number) => number;
  /**
   * Optional per-vertex colour. When supplied the geometry gets a `color`
   * attribute and the material should set `vertexColors`.
   */
  color?: (t: number, offset: number, height: number) => THREE.Color;
  /** Multiplier on the V texture coordinate, to control texture repeat. */
  vScale?: number;
}

/**
 * Builds a swept ribbon as an indexed BufferGeometry.
 *
 * Positions are baked in world space rather than being a local grid the mesh
 * then transforms: the curve bends, so there is no single transform that would
 * place a flat grid correctly, and baking means the mesh can sit at the origin
 * with an identity matrix.
 */
export function buildRibbon(options: RibbonOptions): THREE.BufferGeometry {
  const { offsets, segments, from = 0, to = 1, height, color, vScale = 1 } = options;

  const columns = offsets.length;
  const rows = segments + 1;
  const vertexCount = rows * columns;

  const positions = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const colors = color ? new Float32Array(vertexCount * 3) : null;
  const indices: number[] = [];

  const point = new THREE.Vector3();
  const side = new THREE.Vector3();

  const span = offsets[columns - 1] - offsets[0] || 1;

  for (let row = 0; row < rows; row++) {
    const t = from + ((to - from) * row) / segments;
    getExtendedPoint(t, point);
    getExtendedSide(t, side);

    for (let col = 0; col < columns; col++) {
      const offset = offsets[col];
      const y = height ? height(t, offset) : 0;
      const index = row * columns + col;

      positions[index * 3 + 0] = point.x + side.x * offset;
      positions[index * 3 + 1] = point.y + y;
      positions[index * 3 + 2] = point.z + side.z * offset;

      uvs[index * 2 + 0] = (offset - offsets[0]) / span;
      uvs[index * 2 + 1] = (row / segments) * vScale;

      if (colors && color) {
        const c = color(t, offset, y);
        colors[index * 3 + 0] = c.r;
        colors[index * 3 + 1] = c.g;
        colors[index * 3 + 2] = c.b;
      }

      if (row < segments && col < columns - 1) {
        const a = index;
        const b = index + 1;
        const c = index + columns;
        const d = index + columns + 1;
        indices.push(a, b, c, b, d, c);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  if (colors) geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/**
 * Evenly spaced offsets spanning a width — the common case for road parts.
 */
export function evenOffsets(halfWidth: number, centre: number, count: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    out.push(centre - halfWidth + (2 * halfWidth * i) / (count - 1));
  }
  return out;
}

/**
 * Merges several geometries into one, so N small pieces cost one draw call.
 *
 * Used for the lane dashes and the curbs: dozens of separate strips that share
 * a material and never move relative to each other, which is exactly the case
 * where merging is free performance.
 */
export function mergeRibbons(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = new THREE.BufferGeometry();
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let vertexOffset = 0;

  for (const part of parts) {
    const pos = part.getAttribute("position") as THREE.BufferAttribute;
    const uv = part.getAttribute("uv") as THREE.BufferAttribute;
    const idx = part.getIndex();
    for (let i = 0; i < pos.count; i++) {
      positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
      uvs.push(uv.getX(i), uv.getY(i));
    }
    if (idx) {
      for (let i = 0; i < idx.count; i++) indices.push(idx.getX(i) + vertexOffset);
    }
    vertexOffset += pos.count;
    // The part only ever existed to be merged; releasing it here keeps the
    // caller from having to track dozens of throwaway geometries.
    part.dispose();
  }

  merged.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  merged.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  merged.setIndex(indices);
  merged.computeVertexNormals();
  merged.computeBoundingSphere();
  return merged;
}
