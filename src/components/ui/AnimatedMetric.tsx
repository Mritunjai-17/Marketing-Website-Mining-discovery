"use client";

import React, { useEffect, useState, useRef } from "react";

export interface AnimatedMetricProps {
  value: string;
  inView?: boolean;
  className?: string;
  duration?: number;
}

interface ParsedNumberMetric {
  isNumeric: true;
  prefix: string;
  target: number;
  suffix: string;
  decimals: number;
  hasCommas: boolean;
}

interface ParsedTextMetric {
  isNumeric: false;
  text: string;
}

type ParsedMetric = ParsedNumberMetric | ParsedTextMetric;

function parseMetricValue(raw: string): ParsedMetric {
  // Regex to extract prefix, numeric value (with possible decimals or commas), and suffix
  const match = raw.match(/^([^0-9.]*)([0-9,.]+)(.*)$/);
  if (!match) {
    return { isNumeric: false, text: raw };
  }

  const prefix = match[1] || "";
  const numStr = match[2] || "";
  const suffix = match[3] || "";

  // Check if string had commas
  const hasCommas = numStr.includes(",");
  const cleanNumStr = numStr.replace(/,/g, "");
  const num = parseFloat(cleanNumStr);

  if (isNaN(num)) {
    return { isNumeric: false, text: raw };
  }

  const decimalParts = cleanNumStr.split(".");
  const decimals = decimalParts.length > 1 ? decimalParts[1].length : 0;

  return {
    isNumeric: true,
    prefix,
    target: num,
    suffix,
    decimals,
    hasCommas,
  };
}

function formatNumber(
  val: number,
  decimals: number,
  hasCommas: boolean
): string {
  const fixed = val.toFixed(decimals);
  if (!hasCommas) return fixed;

  const parts = fixed.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

export const AnimatedMetric: React.FC<AnimatedMetricProps> = ({
  value,
  inView = true,
  className = "",
  duration = 800,
}) => {
  const spanRef = useRef<HTMLSpanElement>(null);
  const [displayValue, setDisplayValue] = useState<string>(value);
  const hasAnimated = useRef(false);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;

    const startAnimation = () => {
      if (hasAnimated.current) return;
      hasAnimated.current = true;

      const p = parseMetricValue(value);
      if (!p.isNumeric) {
        setDisplayValue(p.text);
        return;
      }

      const startVal = 0;
      const endVal = p.target;
      const startTime = performance.now();
      let animId: number;

      // Fallback timer ensures that after duration, final value is guaranteed to show
      const safetyTimer = setTimeout(() => {
        setDisplayValue(
          `${p.prefix}${formatNumber(endVal, p.decimals, p.hasCommas)}${p.suffix}`
        );
      }, duration + 50);

      const step = (now: number) => {
        const elapsed = Math.max(0, now - startTime);
        const progress = Math.min(elapsed / Math.max(duration, 1), 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentVal = startVal + (endVal - startVal) * easeProgress;

        setDisplayValue(
          `${p.prefix}${formatNumber(currentVal, p.decimals, p.hasCommas)}${p.suffix}`
        );

        if (progress < 1) {
          animId = requestAnimationFrame(step);
        } else {
          setDisplayValue(
            `${p.prefix}${formatNumber(endVal, p.decimals, p.hasCommas)}${p.suffix}`
          );
        }
      };

      animId = requestAnimationFrame(step);
      return () => {
        cancelAnimationFrame(animId);
        clearTimeout(safetyTimer);
      };
    };

    if (inView) {
      const cleanup = startAnimation();
      return cleanup;
    }

    if (typeof IntersectionObserver !== "undefined") {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            startAnimation();
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(el);
      return () => observer.disconnect();
    }
  }, [inView, value, duration]);

  return (
    <span ref={spanRef} className={className}>
      {displayValue}
    </span>
  );
};

export default AnimatedMetric;
