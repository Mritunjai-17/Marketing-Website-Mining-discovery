import {
  ROAD_HALF_WIDTH,
  project,
  relativeRoadX,
  smoothstep,
  type SceneState,
} from "./journeyPerspective";
import {
  BRANCHES,
  CONVERGE_PULL,
  LINK_NODES,
  NETWORK_CONNECT,
  NETWORK_CONVERGE,
  NETWORK_SETTLE,
  OPPORTUNITY_ANCHOR,
  type JourneyBranch,
} from "./journeyChapters";

/**
 * Where the network's points are, at any moment of the story.
 *
 * Shared by the routes layer and the network layer, because a route's far end
 * and a network node are the same point — computing it twice is how the line
 * and the dot end up a pixel apart.
 */

/** Lateral offset of a route from the road centreline, at parameter u. */
export function branchLateral(branch: JourneyBranch, u: number): number {
  const edge = ROAD_HALF_WIDTH * 0.85;
  /*
   * Quadratic, which matters more than it looks: a linear offset leaves the
   * road at a fixed angle and reads as a T-junction, while a quadratic has
   * zero derivative at u = 0, so the route departs tangentially — running
   * alongside the carriageway before curving away, the way a slip road does.
   */
  return branch.side * (edge + branch.spread * u * u);
}

/** Routes stay on the ground until they are mostly gold, then lift gently. */
export function branchElevation(branch: JourneyBranch, u: number): number {
  return branch.lift * smoothstep(0.45, 1, u);
}

export interface NetworkPoint {
  x: number;
  y: number;
}

export interface NetworkState {
  /** 0 = landscape, 1 = diagram. */
  settle: number;
  /** 0 = separate routes, 1 = linked network. */
  connect: number;
  /** 0 = spread, 1 = drawn in toward the centre. */
  converge: number;
  /** Where the network is rooted to the road. */
  hub: NetworkPoint;
  /** The opportunity point. */
  centre: NetworkPoint;
  /** One per branch, in BRANCHES order. */
  nodes: NetworkPoint[];
  /** One per LINK_NODES entry. */
  linkNodes: NetworkPoint[];
  /** Screen scale of each branch's far end, for node sizing. */
  nodeScales: number[];
}

/**
 * The hub: where the network meets the road.
 *
 * Pinned to a point on the carriageway a little ahead of the truck rather than
 * to the centre of the frame. That is what keeps the diagram rooted in the
 * scene — the network visibly grows out of the road the truck is on, instead
 * of floating in front of it, and it drifts with every bend because the road
 * does.
 */
const HUB_Z = 150;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Resolves the whole network for one frame.
 *
 * Allocates a fresh object per call, which is deliberate: it is called twice a
 * frame at most (once per layer), and the alternative — a shared mutable
 * buffer — would silently couple two components' read order.
 */
export function resolveNetwork(scene: SceneState): NetworkState {
  const m = scene.metrics;
  const p = scene.progress;

  const settle = smoothstep(NETWORK_SETTLE.from, NETWORK_SETTLE.to, p);
  const connect = smoothstep(NETWORK_CONNECT.from, NETWORK_CONNECT.to, p);
  const converge = smoothstep(NETWORK_CONVERGE.from, NETWORK_CONVERGE.to, p);

  const hubProjected = project(HUB_Z, relativeRoadX(scene, HUB_Z), 0, m);
  const hub: NetworkPoint = { x: hubProjected.x, y: hubProjected.y };

  const centre: NetworkPoint = {
    x: m.vanishX + OPPORTUNITY_ANCHOR.x * m.width,
    y: m.horizonY + OPPORTUNITY_ANCHOR.y * m.height,
  };

  const nodes: NetworkPoint[] = [];
  const nodeScales: number[] = [];

  for (const branch of BRANCHES) {
    const originZ = branch.originZ - scene.travel;
    const endZ = originZ + branch.lengthZ;

    /*
     * Clamped because the junction eventually passes under the camera. By then
     * `settle` is 1 and the projected position contributes nothing, but an
     * unclamped negative z would still produce a wild number that NaNs its way
     * into the blend.
     */
    const safeEndZ = Math.max(endZ, 40);
    const projected = project(
      safeEndZ,
      relativeRoadX(scene, safeEndZ) + branchLateral(branch, 1),
      branchElevation(branch, 1),
      m,
    );

    const anchor: NetworkPoint = {
      x: m.vanishX + branch.anchor.x * m.width,
      y: m.horizonY + branch.anchor.y * m.height,
    };

    let x = lerp(projected.x, anchor.x, settle);
    let y = lerp(projected.y, anchor.y, settle);

    // Convergence draws the outer points in, but never all the way: the brief's
    // final figure is a network gathered around a centre, not collapsed into it.
    x = lerp(x, centre.x, converge * CONVERGE_PULL);
    y = lerp(y, centre.y, converge * CONVERGE_PULL);

    nodes.push({ x, y });
    nodeScales.push(projected.scale);
  }

  /*
   * Link nodes exist only in diagram space — they are reached through the
   * connections rather than by road — so they are placed at their anchors
   * directly, with the same convergence applied.
   */
  const linkNodes: NetworkPoint[] = LINK_NODES.map((link) => {
    const ax = m.vanishX + link.anchor.x * m.width;
    const ay = m.horizonY + link.anchor.y * m.height;
    return {
      x: lerp(ax, centre.x, converge * CONVERGE_PULL),
      y: lerp(ay, centre.y, converge * CONVERGE_PULL),
    };
  });

  return { settle, connect, converge, hub, centre, nodes, linkNodes, nodeScales };
}

/**
 * The ring: which points are linked to which.
 *
 * Indices into a combined list of [...branch nodes, ...link nodes]. The order
 * walks the constellation rather than the declaration order, so the ring reads
 * as a closed loop instead of crossing itself.
 */
export const RING_EDGES: [number, number][] = [
  [1, 4], // industry  → link-north
  [4, 0], // link-north → media
  [0, 2], // media     → decision-makers
  [2, 5], // decision-makers → link-south
  [5, 3], // link-south → markets
  [3, 1], // markets   → industry
];

/** Total node count, branches plus link nodes. */
export const NODE_COUNT = BRANCHES.length + LINK_NODES.length;

/** Every point in one list: branch nodes first, then link nodes. */
export function allNodes(state: NetworkState): NetworkPoint[] {
  return [...state.nodes, ...state.linkNodes];
}
