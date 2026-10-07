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

    // Mobile touch devices natively apply 120Hz/60Hz momentum scrolling.
    // Bypassing Lenis on mobile avoids touch-event fighting, rubber-band clipping,
    // and address bar height shift glitches that snap the scroll to top.
    const isTouch =
      window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;

    if (isTouch) {
      gsap.registerPlugin(ScrollTrigger);
      return;
    }

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
      wheelMultiplier: 0.85,
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
    // Disable GSAP lagSmoothing for Lenis (per official Lenis guidelines)
    // This prevents sudden clock adjustments that cause Lenis to reset/jump scroll to top.
    gsap.ticker.lagSmoothing(0);

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
