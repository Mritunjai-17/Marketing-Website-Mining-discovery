"use client";

import React, { useEffect, useRef } from "react";

export interface MineralDustFieldProps {
  className?: string;
  disabled?: boolean;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  baseAlpha: number;
  alpha: number;
  color: string;
}

export const MineralDustField: React.FC<MineralDustFieldProps> = ({
  className = "",
  disabled = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -1000,
    y: -1000,
    active: false,
  });
  const animFrameId = useRef<number | null>(null);
  const isInViewRef = useRef(true);

  useEffect(() => {
    if (disabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isTouch = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 900;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // On mobile touch viewports, skip background particle canvas to maximize frame scrubbing performance
    if (isTouch || prefersReducedMotion) return;

    const particleCount = 50;
    let particles: Particle[] = [];

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const colors = ["#D4AF37", "#B8860B", "#FFFFFF", "#E5E5E3"];

      for (let i = 0; i < particleCount; i++) {
        const baseAlpha = Math.random() * 0.15 + 0.1; // 10-25% opacity
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 3 + 2, // 2-5px
          speedY: -(Math.random() * 0.4 + 0.15), // Upward drift
          speedX: (Math.random() - 0.5) * 0.2,
          baseAlpha,
          alpha: baseAlpha,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    // Intersection Observer to pause rendering when scrolled out
    const observer = new IntersectionObserver(
      ([entry]) => {
        isInViewRef.current = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    const render = () => {
      if (!isInViewRef.current) {
        animFrameId.current = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let p of particles) {
        if (!prefersReducedMotion) {
          p.y += p.speedY;
          p.x += p.speedX;

          // Wrap around top/sides
          if (p.y < -10) p.y = canvas.height + 10;
          if (p.x < -10) p.x = canvas.width + 10;
          if (p.x > canvas.width + 10) p.x = -10;

          // Cursor interaction within 100px radius
          if (mouseRef.current.active) {
            const dx = p.x - mouseRef.current.x;
            const dy = p.y - mouseRef.current.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const radius = 100;

            if (dist < radius) {
              const force = (1 - dist / radius) * 1.5;
              p.x += (dx / dist) * force;
              p.y += (dy / dist) * force;
              p.alpha = Math.min(0.5, p.baseAlpha + 0.25);
            } else {
              p.alpha += (p.baseAlpha - p.alpha) * 0.05;
            }
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = p.size * 1.5;
        ctx.shadowColor = p.color;
        ctx.fill();
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      observer.disconnect();
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [disabled]);

  if (disabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none z-0 ${className}`}
    />
  );
};
