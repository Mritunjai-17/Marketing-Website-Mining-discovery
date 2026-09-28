"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { JourneyProgress } from "./journeyProgress";

export interface JourneyControllerProps {
  /** The progress box this controller drives. */
  progress: JourneyProgress;
  /**
   * Total scroll height of the section, in viewport heights. The pinned stage
   * is one of them, so the journey plays over `scrollLength - 1` screens of
   * scrolling.
   *
   * 9 gives the truck eight screens to cross the route — deliberately slow.
   * At the earlier 5 the truck covered a kilometre of road in about six
   * seconds of steady scrolling, which reads as racing through the landscape
   * rather than travelling across it; the scene only starts to feel like a
   * world once the scenery has time to pass.
   */
  scrollLength?: number;
  /** Told when the section nears or leaves the viewport, to pause rendering. */
  onActiveChange?: (active: boolean) => void;
  /**
   * How far outside the viewport the journey starts rendering, so the first
   * frame is already drawn by the time it scrolls into view.
   */
  activationMargin?: string;
  children: React.ReactNode;
}

/**
 * Pins the journey and converts scroll into normalised progress.
 *
 * The structure is a tall outer section with a viewport-height stage inside
 * it. ScrollTrigger pins the stage for the section's full height, so the user
 * scrolls the page normally while the stage stays put and the journey plays.
 *
 * Note this drives a tween on a proxy object rather than reading
 * `self.progress` in `onUpdate`. That is not stylistic: a numeric `scrub`
 * value only smooths an *attached animation*, so with a bare onUpdate the
 * progress would jump straight to the raw scroll position and the numeric
 * scrub would do nothing at all. The proxy is what gives the journey its
 * catch-up easing, in both directions.
 */
export const JourneyController: React.FC<JourneyControllerProps> = ({
  progress,
  scrollLength = 5,
  onActiveChange,
  activationMargin = "35% 0px 35% 0px",
  children,
}) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;

    gsap.registerPlugin(ScrollTrigger);

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const proxy = { value: 0 };

    /*
     * gsap.context scopes every tween and ScrollTrigger created inside it, so
     * revert() on cleanup removes the pin wrapper and the trigger together.
     * Without it, React StrictMode's double-mount in development leaves a
     * second orphaned pin behind and the section ends up twice as tall.
     */
    const ctx = gsap.context(() => {
      gsap.to(proxy, {
        value: 1,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          pin: stage,
          pinSpacing: false,
          anticipatePin: 1,
          // Reduced motion gets a direct 1:1 mapping — still scroll-driven and
          // still reversible, just without the extra glide on top of it.
          scrub: prefersReducedMotion ? true : 0.6,
          invalidateOnRefresh: true,
          onUpdate: () => {
            progress.current = proxy.value;
          },
        },
      });
    }, section);

    // The canvas mounts at its own pace; make sure the trigger measures the
    // section after layout has actually settled.
    ScrollTrigger.refresh();
    setReady(true);

    /*
     * Rendering is gated on an IntersectionObserver rather than on the
     * ScrollTrigger's own onToggle. onToggle only fires when the trigger
     * crosses its start or end, so a journey sitting far below the fold would
     * never report an initial state at all — and the margin here means the
     * first frame is already drawn before the section appears, instead of the
     * canvas waking up in front of the user.
     */
    const observer = new IntersectionObserver(
      ([entry]) => onActiveChange?.(entry.isIntersecting),
      { rootMargin: activationMargin },
    );
    observer.observe(section);

    return () => {
      observer.disconnect();
      ctx.revert();
    };
  }, [progress, onActiveChange, activationMargin]);

  return (
    <div
      ref={sectionRef}
      // `relative` and a plain block box: the pin wrapper GSAP injects needs a
      // normally-flowing parent to measure against.
      className="relative w-full"
      style={{ height: `${scrollLength * 100}vh` }}
      data-journey-prototype=""
    >
      <div ref={stageRef} className="h-screen w-full overflow-hidden">
        {children}
      </div>
      {/* Until the trigger exists the stage is unpinned; hiding nothing, but
          the flag is useful for a fade-in later. */}
      <span hidden data-journey-ready={ready ? "true" : "false"} />
    </div>
  );
};

export default JourneyController;
