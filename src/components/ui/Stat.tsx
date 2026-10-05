import React from "react";

export interface StatProps {
  value: string;
  label: string;
  description?: string;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  className?: string;
}

export const Stat: React.FC<StatProps> = ({
  value,
  label,
  description,
  trend,
  trendDirection = "up",
  className = "",
}) => {
  const trendColors = {
    up: "text-[#B8860B]",
    down: "text-rose-600",
    neutral: "text-[#57595E]",
  };

  return (
    <div className={`p-6 bg-white border border-[#E5E5E3] rounded-md ${className}`}>
      <div className="flex items-baseline justify-between">
        <span className="font-space-grotesk text-3xl md:text-4xl font-bold text-[#0B1F3A]">
          {value}
        </span>
        {trend && (
          <span className={`text-xs font-semibold ${trendColors[trendDirection]}`}>
            {trend}
          </span>
        )}
      </div>
      <p className="font-mono text-xs font-bold tracking-wider text-[#1A1D21] mt-2 uppercase">
        {label}
      </p>
      {description && (
        <p className="text-xs text-[#57595E] mt-1 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
};
