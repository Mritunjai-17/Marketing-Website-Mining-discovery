"use client";

import React, { useEffect, useState } from "react";
import { motion, useSpring } from "framer-motion";

export const CustomCursor: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  // Smooth springs for cursor positioning
  const mouseX = useSpring(-100, { stiffness: 1000, damping: 50 });
  const mouseY = useSpring(-100, { stiffness: 1000, damping: 50 });

  // Spring physics for trailing follower ring
  const ringX = useSpring(-100, { stiffness: 220, damping: 22 });
  const ringY = useSpring(-100, { stiffness: 220, damping: 22 });

  useEffect(() => {
    // Only enable on desktop pointer devices
    if (typeof window === "undefined") return;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    const isReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (isTouch || isReducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isVisible) setIsVisible(true);
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      ringX.set(e.clientX);
      ringY.set(e.clientY);
    };

    const handleMouseDown = () => setIsClicked(true);
    const handleMouseUp = () => setIsClicked(false);
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactiveEl = target.closest(
        'a, button, input, textarea, select, [role="button"], [data-cursor="hover"], .interactive-hover'
      );

      if (interactiveEl) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mouseover", handleMouseOver);
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
  }, [isVisible, mouseX, mouseY, ringX, ringY]);

  if (!isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {/* Outer Luxury Trailing Ring */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed rounded-full border border-[#B8860B]/60 bg-radial from-[#B8860B]/10 to-transparent"
        style={{
          x: ringX,
          y: ringY,
          width: 36,
          height: 36,
          left: -18,
          top: -18,
        }}
        animate={{
          scale: isClicked ? 0.8 : isHovered ? 1.75 : 1,
          borderColor: isHovered
            ? "rgba(184, 134, 11, 0.9)"
            : "rgba(184, 134, 11, 0.5)",
          boxShadow: isHovered
            ? "0 0 20px 4px rgba(184, 134, 11, 0.35)"
            : "0 0 10px 1px rgba(184, 134, 11, 0.15)",
        }}
        transition={{
          scale: { type: "spring", stiffness: 350, damping: 25 },
          borderColor: { duration: 0.2 },
          boxShadow: { duration: 0.2 },
        }}
      />

      {/* Inner Precision Pointer Dot */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed rounded-full bg-[#B8860B] shadow-[0_0_8px_rgba(184,134,11,0.8)]"
        style={{
          x: mouseX,
          y: mouseY,
          width: 6,
          height: 6,
          left: -3,
          top: -3,
        }}
        animate={{
          scale: isClicked ? 0.6 : isHovered ? 1.4 : 1,
          backgroundColor: isHovered ? "#FFD700" : "#B8860B",
        }}
        transition={{
          scale: { type: "spring", stiffness: 400, damping: 25 },
          backgroundColor: { duration: 0.15 },
        }}
      />
    </div>
  );
};

export default CustomCursor;
