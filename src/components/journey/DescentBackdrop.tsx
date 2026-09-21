"use client";

import React from "react";
import { DESCENT_PHASES } from "./descentCamera";

export interface DescentBackdropProps {
  /** Master transition progress (0..1). */
  progress: number;
}

function clamp01(x: number) {
  return Math.min(Math.max(x, 0), 1);
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * The ground the descent takes place over.
 *
 * WHY THE DESCENT NEEDS ONE AT ALL, and it is geometry rather than taste. The
 * camera tilts the Journey by rotating its plane 78 degrees about a line low
 * in the frame. A plane at 78 degrees does not fill a viewport: its vertical
 * extent collapses to the cosine of that angle, the perspective divide flares
 * the near end past the sides and shrinks the far end to nothing, and the
 * dolly that carries the camera up to altitude shrinks the whole thing again.
 * Run the numbers at the top of the descent and the Journey occupies a band
 * across the middle of the screen with better than half the frame left over.
 *
 * Whatever is behind that band is what the descent actually looks like. With
 * nothing there it was the hero's own backdrop, so the moment the clouds
 * thinned the user saw a lit rectangle of road floating in the middle of the
 * globe section — which is the single largest reason the descent read as a
 * section transition rather than as a camera coming down through the air.
 *
 * THIS IS NOT A SECOND SCENE. It draws no terrain, no road, no markings and
 * no vehicle; it is a dark ground tone with a horizon-side lift in it, and the
 * Journey paints straight over it wherever the Journey reaches. It is to the
 * descent what a sky is to the Journey's own side view: the thing the frame is
 * filled with where the subject is not. Everything the brief asks the descent
 * to reveal — land, road, markings, truck — is revealed out of the Journey
 * itself and none of it is here.
 *
 * It is also strictly a pure function of progress, like every other part of
 * the descent, so scrolling back up unwinds it with no state to reverse.
 */
export const DescentBackdrop: React.FC<DescentBackdropProps> = ({ progress: p }) => {
  const { MATERIALISE, ROTATE } = DESCENT_PHASES;

  /*
   * In on the same ramp that makes the Journey opaque, so the ground and the
   * scene standing on it arrive together under the cloud deck rather than one
   * appearing against the other.
   *
   * Out across the rotation, because by side view the Journey's own sky and
   * terrain fill the frame edge to edge and anything still behind them is
   * both invisible and a layer the compositor is paying for.
   */
  const rise = smoothstep(MATERIALISE.from, MATERIALISE.to, p);
  const settle = smoothstep(ROTATE.from, ROTATE.to, p);
  const opacity = rise * (1 - settle);

  if (opacity <= 0.004) return null;

  /*
   * The ground opens out as the camera falls. From altitude it is an almost
   * even dark field — air does that to land at night, and a strongly figured
   * backdrop would compete with the scene it exists to sit behind. Lower
   * down the carriageway's own light begins to spill onto it, which is the
   * quiet cue that the band across the middle of the frame is lit by
   * something standing on the same ground as the rest.
   */
  const near = smoothstep(0.5, 0.86, p);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-23 overflow-hidden"
      style={{ opacity: opacity.toFixed(3) }}
    >
      {/* Seamless transition backdrop into the dark obsidian journey */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 70% at 50% 100%, rgba(18, 24, 38, 0.9) 0%, #030509 100%)",
        }}
      />
    </div>
  );
};

export default DescentBackdrop;
