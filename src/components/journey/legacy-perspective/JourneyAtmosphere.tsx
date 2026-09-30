"use client";

import React, { useMemo, useRef } from "react";
import styles from "./Journey2D.module.css";
import { smoothstep, type StageMetrics } from "./journeyPerspective";
import { useJourneyFrame } from "./journeyScroll";
import { makeRandom } from "./journeyShapes";

/**
 * Haze, grade and a handful of drifting motes.
 *
 * Restraint is the point. Three gradient washes and eighteen sub-pixel specks
 * do more to bind the layers into one photographic image than any particle
 * system would, and none of it competes with the road for attention. There is
 * no bloom pass, no lens flare and no glitch — the glows in this scene are all
 * painted where they belong, on the objects that emit them.
 */

const MOTE_COUNT = 18;

interface Mote {
  x: number;
  y: number;
  size: number;
  drift: number;
  phase: number;
  opacity: number;
}

export const JourneyAtmosphere: React.FC<{ metrics: StageMetrics; reducedMotion: boolean }> = ({
  metrics,
  reducedMotion,
}) => {
  const hazeRef = useRef<HTMLDivElement>(null);
  const moteRefs = useRef<(HTMLDivElement | null)[]>([]);

  const motes = useMemo<Mote[]>(() => {
    const random = makeRandom(0x6b21f4);
    return Array.from({ length: MOTE_COUNT }, () => ({
      // Kept to the lower two-thirds, where the air is "closer" to camera.
      x: random() * 100,
      y: 38 + random() * 58,
      size: 1 + random() * 2.2,
      drift: 14 + random() * 30,
      phase: random() * Math.PI * 2,
      opacity: 0.12 + random() * 0.22,
    }));
  }, []);

  useJourneyFrame((scene) => {
    /*
     * The horizon warms as the destination is approached — the city's own
     * light pollution reaching back down the valley. One opacity write, and it
     * is most of what makes the end of the journey feel like arrival.
     */
    if (hazeRef.current) {
      hazeRef.current.style.opacity = (0.25 + smoothstep(0.2, 0.9, scene.progress) * 0.75).toFixed(3);
    }

    if (reducedMotion) return;

    for (let i = 0; i < motes.length; i++) {
      const element = moteRefs.current[i];
      if (!element) continue;
      const mote = motes[i];
      // Slow lateral drift plus a gentle rise, so the air has movement in it
      // without anything reading as falling snow.
      const x = Math.sin(scene.time * 0.12 + mote.phase) * mote.drift;
      const y = -((scene.time * 5 + mote.phase * 40) % 140);
      element.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    }
  });

  return (
    <>
      {/* Warm haze sitting on the horizon band, behind nothing and above all. */}
      <div
        ref={hazeRef}
        className={styles.layer}
        style={{
          opacity: 0.25,
          background: `radial-gradient(76% 34% at 57% ${((metrics.horizonY / metrics.height) * 100).toFixed(1)}%, rgba(214, 152, 74, 0.2) 0%, rgba(178, 126, 62, 0.07) 42%, rgba(11, 31, 58, 0) 78%)`,
        }}
        aria-hidden="true"
      />

      <div className={styles.layer} aria-hidden="true">
        {motes.map((mote, index) => (
          <div
            key={index}
            ref={(node) => {
              moteRefs.current[index] = node;
            }}
            className={styles.mote}
            style={{
              left: `${mote.x}%`,
              top: `${mote.y}%`,
              width: `${mote.size}px`,
              height: `${mote.size}px`,
              opacity: mote.opacity,
            }}
          />
        ))}
      </div>

      {/* Grade and vignette last: they sit over everything, including the
          overlay's backdrop, and unify the whole frame. */}
      <div className={styles.grade} aria-hidden="true" />
      <div className={styles.vignette} aria-hidden="true" />
    </>
  );
};

export default JourneyAtmosphere;
