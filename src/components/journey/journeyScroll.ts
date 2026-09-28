"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { deriveMetrics, type SceneState, type StageMetrics } from "./journeySideView";

/**
 * How scroll reaches the pixels.
 *
 * The existing scroll architecture is unchanged and deliberately so:
 * JourneyController still pins the section and drives a GSAP-scrubbed proxy
 * into the shared progress box, and journeyProgress still holds that box
 * outside React state. This module is only the other half — the part that
 * takes the box and hands it to the layers.
 *
 * One rAF loop serves every layer. The alternative, a subscription per layer
 * or state lifted into React, would re-render a dozen components sixty times a
 * second to communicate one float. Here the loop computes the scene once and
 * calls each layer's update function, and every layer writes a transform.
 * React renders the markup once and never again.
 */

export type JourneyFrameFn = (scene: SceneState) => void;

export interface JourneySceneApi {
  subscribe: (fn: JourneyFrameFn) => () => void;
  /** Current metrics. Read inside a frame callback, never during render. */
  sceneRef: { current: SceneState | null };
}

export const JourneySceneContext = createContext<JourneySceneApi | null>(null);

/**
 * Registers a per-frame callback.
 *
 * The callback should only write to refs it owns — transforms, canvas, style
 * properties. Anything that triggers a React render from in here defeats the
 * whole arrangement.
 */
export function useJourneyFrame(fn: JourneyFrameFn) {
  const api = useContext(JourneySceneContext);

  /*
   * The latest callback is kept in a ref so the subscription can be set up
   * once and never torn down, even though the callback closes over fresh props
   * each render. Updated from an effect rather than during render — writing to
   * a ref while rendering is the pattern React's lint rules reject, and this
   * effect is ordered before the subscribe effect below, so the first frame
   * already sees the current function.
   */
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });

  useEffect(() => {
    if (!api) return;
    return api.subscribe((scene) => fnRef.current(scene));
  }, [api]);
}

/**
 * Tracks the stage's pixel size and derives the projection constants.
 *
 * This is the one place a resize is allowed to cause a React render: the
 * metrics change shape rarely, and layers that lay out in SVG user units need
 * to re-render when they do.
 */
export function useStageMetrics(ref: React.RefObject<HTMLElement | null>): StageMetrics {
  const [metrics, setMetrics] = useState<StageMetrics>(() => deriveMetrics(1600, 900));

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measure = () => {
      const { width, height } = element.getBoundingClientRect();
      if (width < 1 || height < 1) return;
      setMetrics((previous) =>
        previous.width === width && previous.height === height
          ? previous
          : deriveMetrics(width, height),
      );
    };

    // No explicit first call: ResizeObserver delivers the element's current
    // size on observe, so measuring here as well would only be a second,
    // synchronous setState during the effect.
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return metrics;
}

/**
 * True when the visitor has asked for reduced motion.
 *
 * Used to stand the scene down to its essentials rather than to disable it:
 * the journey is still scroll-driven and still reverses, it simply stops the
 * ambient drift that nobody asked to see moving.
 */
export function usePrefersReducedMotion(): boolean {
  /*
   * useSyncExternalStore rather than state synced from an effect. A media
   * query is exactly the external store this hook exists for: it reads the
   * true value on the first client render instead of rendering `false` and
   * then correcting itself, and it gives the server a defined snapshot without
   * touching `window`.
   */
  const subscribe = useCallback((onChange: () => void) => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    // Server snapshot: assume motion is fine, then correct on hydration.
    () => false,
  );
}
