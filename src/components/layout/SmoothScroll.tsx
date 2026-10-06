"use client";

import React, { useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export interface SmoothScrollProps {
  children: React.ReactNode;
}

export const SmoothScroll: React.FC<SmoothScrollProps> = ({ children }) => {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Prevent double-initialization in React StrictMode
    if (lenisRef.current) return;

    // Respect accessibility: skip smooth scroll if prefers-reduced-motion is active
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    /*
     * lerp rather than duration + easing, and that swap is the whole change.
     *
     * With `duration`, every wheel event starts a NEW 1.2s tween from wherever the last
     * one had reached. The old easing (expo-out) spends most of its distance in its first
     * fraction, so a burst of events — which is what one continuous scroll gesture
     * actually is — kept re-triggering that fast opening section. The result is a
     * velocity that surges and eases repeatedly instead of holding steady, and that is
     * what reads as choppy while scrolling rather than while stopping.
     *
     * `lerp` is a continuous exponential approach to the target instead of a restarting
     * tween: continuous input gives continuous velocity, and Lenis normalises it for
     * frame rate, so a 120Hz display and a 60Hz one settle at the same speed rather than
     * the faster one arriving twice as quickly.
     *
     * 0.085 is a little below Lenis's 0.1 default — slightly longer glide, still short of
     * the float the 1.2s tween had. Lower is smoother and heavier; raise it toward 0.12
     * to track the wheel more tightly.
     */
    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
      wheelMultiplier: 0.85,
      // Touch is left on the platform's own momentum. Lenis only synthesises touch
      // scrolling when syncTouch is on, and a synthesised curve competes with iOS's
      // native rubber-banding rather than replacing it — reliably worse than leaving it.
      syncTouch: false,
      touchMultiplier: 1.0,
    });

    lenisRef.current = lenis;

    // Expose lenis globally for zero-conflict scrollTo integration
    (window as any).lenis = lenis;

    // Synchronize Lenis momentum scroll updates with GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    const updateGSAP = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateGSAP);
    // Standard lag smoothing prevents stutter/jumps on dropped frames across mobile & desktop
    gsap.ticker.lagSmoothing(500, 33);

    return () => {
      gsap.ticker.remove(updateGSAP);
      lenis.destroy();
      lenisRef.current = null;
      if ((window as any).lenis === lenis) {
        delete (window as any).lenis;
      }
    };
  }, []);

  return <>{children}</>;
};

export default SmoothScroll;
