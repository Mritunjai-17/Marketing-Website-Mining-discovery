/**
 * The cinematic Journey section.
 *
 * Self-contained: nothing outside this folder is imported by it beyond React
 * and GSAP, and nothing outside this folder needs to change to use it. Render
 * `<JourneySection />` anywhere in a client component.
 *
 * PRESERVED IMPLEMENTATIONS
 * -------------------------
 * `legacy3d/` holds the original WebGL scene (three / R3F / drei).
 * `legacy-perspective/` holds the forward-travel 2D scene this side view
 * replaced — a camera behind the truck looking down the road, with everything
 * converging on a vanishing point. Neither is referenced, so neither is in the
 * bundle; `legacy-perspective` is excluded from typecheck in `tsconfig.json`
 * because its sibling imports no longer resolve.
 *
 * Both are kept rather than deleted because they are otherwise unrecoverable —
 * none of this folder is committed. Delete them once the side view is settled,
 * and the `@react-three/*` dependencies with `legacy3d`. `three` itself must
 * stay: the globe uses it.
 */
export { JourneySection, default } from "./JourneySection";
export { JourneyController } from "./JourneyController";
export { Journey2D } from "./Journey2D";
export { JourneyRoad } from "./JourneyRoad";
export { JourneyTruck } from "./JourneyTruck";
export { JourneyBillboard, BILLBOARD_WORLD_X } from "./JourneyBillboard";
export { JourneyMarkers, passProgress } from "./JourneyMarkers";
export { JourneyNetwork } from "./JourneyNetwork";
export { JourneyStory } from "./JourneyStory";
export { AtmosphericCloudLayer } from "./AtmosphericCloudLayer";
export { DescentBackdrop } from "./DescentBackdrop";
export {
  deriveDescentCamera,
  descentTransform,
  DESCENT_PHASES,
  JOURNEY_RUNS_FROM,
} from "./descentCamera";
export type { DescentCamera } from "./descentCamera";
export {
  SkyLayer,
  CloudLayer,
  RangeLayer,
  DestinationLayer,
  ForegroundLayer,
} from "./JourneyEnvironment";

export {
  WORLD_LENGTH,
  UNITS_VISIBLE,
  DEPTH,
  deriveMetrics,
  updateScene,
  truckScreenFraction,
  roadX,
  layerX,
  layerShift,
  layerClarity,
  onStage,
  smoothstep,
  clamp01,
} from "./journeySideView";
export type { SceneState, StageMetrics } from "./journeySideView";

export {
  CHAPTERS,
  CHAPTER_COUNT,
  OPENING_PAGE,
  PAGES,
  PAGE_BLEED,
  chapterAt,
  BILLBOARD_MESSAGES,
  BILLBOARD_ACTIVATION,
  BILLBOARD_CROSSFADE,
  SIGNAL_RUN,
  ROUTES,
  DIGITISATION,
  CROSSOVER,
  NETWORK_SETTLE,
  NETWORK_CONNECT,
  NETWORK_CONVERGE,
  NETWORK_EXPAND,
  CONVERGE_PULL,
  OPPORTUNITY_ANCHOR,
} from "./journeyChapters";
export type { JourneyChapter, ChapterPage, JourneyRoute } from "./journeyChapters";

export * from "./journeyContent";
export { useJourneyFrame, useStageMetrics, JourneySceneContext } from "./journeyScroll";
export type { JourneyProgress } from "./journeyProgress";
