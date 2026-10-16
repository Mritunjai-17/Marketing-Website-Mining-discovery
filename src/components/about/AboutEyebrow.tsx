"use client";

import React from "react";
import { HIDDEN_RISE } from "./reveal";

interface AboutEyebrowProps {
  text: string;
  theme?: "light" | "dark";
  className?: string;
}

/**
 * Signature brand eyebrow matching Home and Work pages:
 * Flanked gold gradient hairlines + star pips (✦) + uppercase monospace tracking.
 */
export const AboutEyebrow: React.FC<AboutEyebrowProps> = ({
  text,
  theme = "light",
  className = "",
}) => {
  const isDark = theme === "dark";
  const goldColor = isDark ? "#D4AF37" : "#B8860B";
  const ruleGradientL = isDark
    ? "from-transparent to-[#D4AF37]/80"
    : "from-transparent to-[#B8860B]/80";
  const ruleGradientR = isDark
    ? "from-[#D4AF37]/80 to-transparent"
    : "from-[#B8860B]/80 to-transparent";

  return (
    <div
      data-about-reveal
      className={`inline-flex items-center gap-1.5 sm:gap-3 whitespace-nowrap ${HIDDEN_RISE} ${className}`}
    >
      <span
        className={`h-[1.5px] w-3.5 sm:w-10 bg-gradient-to-r ${ruleGradientL}`}
        aria-hidden="true"
      />
      <span
        className="text-[9px] sm:text-xs select-none"
        style={{
          color: goldColor,
          textShadow: isDark
            ? "0 0 8px rgba(212, 175, 55, 0.6)"
            : "0 0 8px rgba(184, 134, 11, 0.4)",
        }}
      >
        ✦
      </span>
      <span
        className="font-mono text-[10.5px] sm:text-[12.5px] font-bold uppercase tracking-[0.14em] sm:tracking-[0.2em]"
        style={{ color: goldColor }}
      >
        {text}
      </span>
      <span
        className="text-[9px] sm:text-xs select-none"
        style={{
          color: goldColor,
          textShadow: isDark
            ? "0 0 8px rgba(212, 175, 55, 0.6)"
            : "0 0 8px rgba(184, 134, 11, 0.4)",
        }}
      >
        ✦
      </span>
      <span
        className={`h-[1.5px] w-3.5 sm:w-10 bg-gradient-to-r ${ruleGradientR}`}
        aria-hidden="true"
      />
    </div>
  );
};

export default AboutEyebrow;
