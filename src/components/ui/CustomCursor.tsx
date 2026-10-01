"use client";

import React, { useEffect, useRef, useState } from "react";

export const CustomCursor: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const cursorRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: -100, y: -100 });
  const isVisibleRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isTouch || isReducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;

      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        setIsVisible(true);
      }

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
    };

    const handleMouseDown = () => setIsClicked(true);
    const handleMouseUp = () => setIsClicked(false);

    const handleMouseLeave = () => {
      isVisibleRef.current = false;
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      isVisibleRef.current = true;
      setIsVisible(true);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactiveEl = target.closest(
        'a, button, input, textarea, select, [role="button"], [data-cursor="hover"], .interactive-hover'
      );
      setIsHovered(!!interactiveEl);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mousedown", handleMouseDown, { passive: true });
    window.addEventListener("mouseup", handleMouseUp, { passive: true });
    window.addEventListener("mouseover", handleMouseOver, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, []);

  // Ensure position stays strictly accurate across state updates
  useEffect(() => {
    if (cursorRef.current && mousePos.current.x !== -100) {
      cursorRef.current.style.transform = `translate3d(${mousePos.current.x}px, ${mousePos.current.y}px, 0)`;
    }
  }, [isHovered, isClicked]);

  return (
    <div
      ref={cursorRef}
      className="pointer-events-none fixed top-0 left-0 z-[99999] will-change-transform transition-opacity duration-150"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: "translate3d(-100px, -100px, 0)",
      }}
      aria-hidden="true"
    >
      {/* Outer Luxury Ring - Perfectly Concentric with Dot, Zero Separation */}
      <div
        className="pointer-events-none absolute rounded-full will-change-transform"
        style={{
          width: 36,
          height: 36,
          left: -18,
          top: -18,
          border: isHovered
            ? "1.5px solid rgba(184, 134, 11, 0.95)"
            : "1.25px solid rgba(184, 134, 11, 0.65)",
          background: isHovered
            ? "radial-gradient(circle, rgba(184, 134, 11, 0.16) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(184, 134, 11, 0.06) 0%, transparent 70%)",
          boxShadow: isHovered
            ? "0 0 16px 3px rgba(184, 134, 11, 0.4)"
            : "0 0 8px 1px rgba(184, 134, 11, 0.2)",
          transform: isClicked ? "scale(0.8)" : isHovered ? "scale(1.5)" : "scale(1)",
          transition:
            "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease",
        }}
      />

      {/* Inner Precision Pointer Dot */}
      <div
        className="pointer-events-none absolute rounded-full will-change-transform"
        style={{
          width: 6,
          height: 6,
          left: -3,
          top: -3,
          backgroundColor: isHovered ? "#FFD700" : "#B8860B",
          boxShadow: isHovered
            ? "0 0 10px 2px rgba(255, 215, 0, 0.95)"
            : "0 0 6px 1px rgba(184, 134, 11, 0.85)",
          transform: isClicked ? "scale(0.65)" : isHovered ? "scale(1.3)" : "scale(1)",
          transition:
            "transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s ease, box-shadow 0.15s ease",
        }}
      />
    </div>
  );
};

export default CustomCursor;
