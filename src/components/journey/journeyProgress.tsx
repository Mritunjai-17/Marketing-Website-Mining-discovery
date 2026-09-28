"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

/**
 * A mutable box holding the journey's normalised progress.
 *
 * Deliberately NOT React state. Scroll produces a value change on more or less
 * every frame, and putting that through `useState` would re-render the whole
 * R3F tree at 60–120Hz to communicate a single float. Instead GSAP writes into
 * `.current` and `useFrame` reads it — React renders once and then stays out of
 * the way entirely.
 */
export interface JourneyProgress {
  /** 0 = start of the road, 1 = destination. Always within that range. */
  current: number;
  /**
   * The descent camera's downward tilt, in degrees. 0 is the Journey's own
   * side elevation, and 0 is what it stays at whenever nothing is flying a
   * camera over the scene.
   *
   * It rides in this box for the same reason progress does: it changes every
   * frame, and the scene needs it. The truck is the one thing that has to know
   * — a vehicle seen from above shows its roof and a vehicle seen from beside
   * shows its flank, and which of those is facing camera is a fact about the
   * camera, not about the truck.
   */
  pitch: number;
  /**
   * Master transition progress (0..1) during the Globe->Journey flydown transition.
   * Drives the camera swooping down from the sky to the land as clouds part.
   */
  descent?: number;
}

const JourneyProgressContext = createContext<JourneyProgress | null>(null);

export const JourneyProgressProvider: React.FC<{
  value: JourneyProgress;
  children: React.ReactNode;
}> = ({ value, children }) => (
  <JourneyProgressContext.Provider value={value}>{children}</JourneyProgressContext.Provider>
);

/**
 * Creates the progress box. One per journey instance, stable for its lifetime.
 */
export function useCreateJourneyProgress(): JourneyProgress {
  // Lazy useState rather than useRef: both give a stable object, but reading a
  // ref during render is exactly the pattern React's lint rules forbid, and
  // the setter is simply never called.
  const [box] = useState<JourneyProgress>(() => ({ current: 0, pitch: 0, descent: 0 }));
  return box;
}

/**
 * Reads the shared progress box.
 *
 * Falls back to a private zeroed box rather than throwing, so a piece of the
 * scene can be rendered on its own (a Storybook-style harness, a unit test)
 * without needing the scroll controller mounted above it.
 */
export function useJourneyProgress(): JourneyProgress {
  const fallback = useMemo<JourneyProgress>(() => ({ current: 0, pitch: 0, descent: 1 }), []);
  return useContext(JourneyProgressContext) ?? fallback;
}
