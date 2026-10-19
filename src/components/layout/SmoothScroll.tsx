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

    // Detect device input capabilities:
    // Any device with a fine pointer (mouse, precision trackpad on laptops & desktops)
    // receives butter-smooth Lenis momentum scrolling.
    // Pure touch mobile devices (iPhone, Android, standalone tablets without trackpad)
    // use native 120Hz/60Hz hardware momentum scrolling to avoid touch-event contention.
    const isMobileWidth = window.innerWidth <= 840;
    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
    // Pure touch mobile devices and all mobile screen ratios (iPhone, Android, Foldables, Tablets)
    // use native 120Hz/60Hz hardware momentum scrolling for frictionless mobile swiping.
    const isTouchOnly = isMobileWidth || isCoarsePointer || !hasFinePointer;

    gsap.registerPlugin(ScrollTrigger);

    if (isTouchOnly) {
      document.documentElement.classList.add("touch-scroller");
      document.documentElement.style.scrollBehavior = "auto";
      document.body.style.scrollBehavior = "auto";
      // Provide a zero-overhead native shim so scrollTo, start, stop, and listeners
      // work seamlessly across the site on touch mobile/tablets without errors or lag
      const scrollListeners = new Set<(e: any) => void>();
      const handleNativeScroll = () => {
        ScrollTrigger.update();
        const ev = { scroll: window.scrollY };
        scrollListeners.forEach((fn) => fn(ev));
      };

      window.addEventListener("scroll", handleNativeScroll, { passive: true });

      const touchShim = {
        scrollTo: (target: string | number | HTMLElement, options?: { offset?: number; immediate?: boolean }) => {
          if (typeof target === "string") {
            const el = document.querySelector(target);
            if (el) {
              const top = el.getBoundingClientRect().top + window.scrollY + (options?.offset || 0);
              window.scrollTo({ top, behavior: options?.immediate ? "auto" : "smooth" });
            }
          } else if (typeof target === "number") {
            window.scrollTo({ top: target, behavior: options?.immediate ? "auto" : "smooth" });
          } else if (target instanceof HTMLElement) {
            const top = target.getBoundingClientRect().top + window.scrollY + (options?.offset || 0);
            window.scrollTo({ top, behavior: options?.immediate ? "auto" : "smooth" });
          }
        },
        on: (event: string, callback: (e: any) => void) => {
          if (event === "scroll") scrollListeners.add(callback);
        },
        off: (event: string, callback: (e: any) => void) => {
          if (event === "scroll") scrollListeners.delete(callback);
        },
        start: () => {},
        stop: () => {},
      };

      (window as any).lenis = touchShim;

      return () => {
        document.documentElement.classList.remove("touch-scroller");
        document.documentElement.style.scrollBehavior = "";
        document.body.style.scrollBehavior = "";
        window.removeEventListener("scroll", handleNativeScroll);
        scrollListeners.clear();
        if ((window as any).lenis === touchShim) {
          delete (window as any).lenis;
        }
      };
    }

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const lenis = new Lenis({
      lerp: 0.085,
      smoothWheel: true,
      wheelMultiplier: 0.88,
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
