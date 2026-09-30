"use client";

import React, { useCallback, useState } from "react";
import { Journey2D } from "./Journey2D";
import { JourneyController } from "./JourneyController";
import { useCreateJourneyProgress } from "./journeyProgress";

export interface JourneySectionProps {
  /** Scroll height of the section in viewport heights. See JourneyController. */
  scrollLength?: number;
}

/**
 * The Journey experience.
 *
 * Isolated by design: it renders a fixed-height block with its own stage and
 * its own ScrollTrigger, reads nothing from the rest of the site, and writes
 * nothing global. Deleting this folder and its one usage removes it cleanly.
 *
 * Composition, outermost to innermost:
 *   JourneySection    — owns the progress box and visibility state
 *   JourneyController — pins the stage, turns scroll into progress
 *   Journey2D         — the layered cinematic scene
 *
 * The scroll half of that stack is unchanged from the WebGL prototype, and
 * deliberately so: pinning, scrubbing and the progress box never had anything
 * to do with how the scene was drawn, which is exactly why swapping the
 * renderer touched neither of them.
 *
 * No dynamic import here any more. The 3D version needed `ssr: false` because
 * WebGL cannot be server-rendered and three plus R3F was a large chunk to put
 * in front of first paint. This scene is CSS, SVG and one small canvas — it
 * server-renders its markup happily, which gets the editorial copy into the
 * initial HTML and the backdrop onto the screen a round trip sooner.
 */
export const JourneySection: React.FC<JourneySectionProps> = ({ scrollLength = 21 }) => {
  const progress = useCreateJourneyProgress();
  const [active, setActive] = useState(false);

  // Stable identity: JourneyController rebuilds its ScrollTrigger whenever this
  // changes, and rebuilding a pin mid-scroll is visible.
  const handleActiveChange = useCallback((isActive: boolean) => setActive(isActive), []);

  return (
    <JourneyController
      progress={progress}
      scrollLength={scrollLength}
      onActiveChange={handleActiveChange}
    >
      <Journey2D progress={progress} active={active} />
    </JourneyController>
  );
};

export default JourneySection;
