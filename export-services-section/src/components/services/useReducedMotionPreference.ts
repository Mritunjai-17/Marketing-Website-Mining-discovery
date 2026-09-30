"use client";

import { useSyncExternalStore } from "react";

/*
 * prefers-reduced-motion as an external store.
 *
 * Use this — rather than framer's useReducedMotion or a matchMedia effect — whenever the
 * answer decides LAYOUT rather than just whether something animates.
 *
 * A hook that reads the media query during the first client render reads it during
 * HYDRATION, and React does not repair a className that disagrees with the server's at
 * hydration time: it warns and keeps the server's. Usually the next state update papers over
 * it, but a section whose scroll animation is switched off has no next update — so the wrong
 * layout classes simply stay, which is precisely the case the accessibility requirement
 * exists to protect.
 *
 * useSyncExternalStore renders getServerSnapshot() during hydration so the markup matches,
 * then re-renders for real once it sees the client value differ. A real update does apply
 * attribute changes.
 *
 * NOTE: ServicesProcess.tsx carries its own copy of this, inlined. It was built in an earlier
 * step that this task was told not to modify, so it was left alone; pointing it here is a
 * two-line change whenever that file is next open.
 */

const QUERY = "(prefers-reduced-motion: reduce)";

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

const getSnapshot = () => window.matchMedia(QUERY).matches;
const getServerSnapshot = () => false;

export function useReducedMotionPreference(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
