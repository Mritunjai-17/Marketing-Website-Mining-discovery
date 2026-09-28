"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  LabelList,
} from "recharts";

type ChartDataPoint = {
  label: string;
  value: number;
};

export type MiningChartData = {
  type: "bar" | "line" | "pie" | "doughnut";
  title: string;
  unit?: string;
  data: ChartDataPoint[];
};

type MiningChartProps = {
  chart: MiningChartData;
};

const COLORS = ["#D4AF37", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"];

export default function MiningChart({ chart }: MiningChartProps) {
  if (!chart || !chart.data || chart.data.length === 0) {
    return null;
  }

  const { type, title, unit, data } = chart;

  const isMarketCap =
    /market cap|capitalization|valuation/i.test(title || "") ||
    (typeof unit === "string" && /usd|\$|billion/i.test(unit));

  // Sort descending for market cap or comparative bar charts to display highest at top
  const sortedData = [...data].sort((a, b) => {
    if (type === "bar" || isMarketCap) {
      return b.value - a.value;
    }
    return 0;
  });

  const chartData = sortedData.map((item) => ({
    ...item,
    label: item.label.split("\n")[0].trim(),
  }));

  const tooltipFormatter = (value: any) => {
    if (typeof value === "number") {
      if (isMarketCap) {
        return [`$${value.toFixed(1)}B USD`, "Market Cap"];
      }
      return [`${value.toLocaleString()} ${unit || ""}`.trim(), "Value"];
    }
    return [String(value), "Value"];
  };

  const xAxisTickFormatter = (value: number) => {
    if (isMarketCap) {
      return `$${value}B`;
    }
    return value.toLocaleString();
  };

  const barLabelFormatter = (value: any) => {
    if (typeof value === "number") {
      if (isMarketCap) {
        return `$${value.toFixed(1)}B`;
      }
      return `${value.toLocaleString()}${unit ? ` ${unit}` : ""}`;
    }
    return String(value);
  };

  // Deduplicate by company label and ensure exactly 10 unique companies
  const seenLabels = new Set<string>();
  const uniqueChartData: { label: string; value: number }[] = [];
  for (const item of chartData) {
    const norm = item.label.toLowerCase();
    if (!seenLabels.has(norm)) {
      seenLabels.add(norm);
      uniqueChartData.push(item);
    }
    if (uniqueChartData.length === 10) break;
  }

  const barChartHeight = Math.max(340, uniqueChartData.length * 36);

  return (
    <div className="w-full mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 shadow-sm font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3 pb-2 border-b border-slate-800">
        {title && (
          <h4 className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider">
            {title}
          </h4>
        )}
        <span className="text-[11px] text-slate-400 font-normal">
          {isMarketCap
            ? "Market capitalization: September 11, 2026 | Source: CompaniesMarketCap"
            : unit
            ? `Unit: ${unit}`
            : ""}
        </span>
      </div>

      <div style={{ width: "100%", height: barChartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          {type === "line" ? (
            <LineChart data={uniqueChartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                formatter={tooltipFormatter}
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#fff", borderRadius: 8 }}
              />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#D4AF37" strokeWidth={2} dot={{ r: 4, fill: "#D4AF37" }} activeDot={{ r: 6 }} />
            </LineChart>
          ) : type === "pie" || type === "doughnut" ? (
            <PieChart>
              <Pie
                data={uniqueChartData}
                cx="50%"
                cy="50%"
                innerRadius={type === "doughnut" ? 45 : 0}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={4}
                dataKey="value"
                nameKey="label"
                label
              >
                {uniqueChartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={tooltipFormatter}
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#fff", borderRadius: 8 }}
              />
              <Legend />
            </PieChart>
          ) : (
            <BarChart
              data={uniqueChartData}
              layout="vertical"
              margin={{ top: 8, right: 75, left: 10, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis
                type="number"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                tickFormatter={xAxisTickFormatter}
                domain={isMarketCap ? [0, 250] : [0, (dataMax: number) => Math.ceil(dataMax * 1.15)]}
                ticks={isMarketCap ? [0, 50, 100, 150, 200, 250] : undefined}
                interval={0}
              />
              <YAxis
                dataKey="label"
                type="category"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                width={140}
              />
              <Tooltip
                formatter={tooltipFormatter}
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#fff", borderRadius: 8 }}
              />
              <Bar dataKey="value" fill="#D4AF37" radius={[0, 4, 4, 0]} maxBarSize={20}>
                <LabelList
                  dataKey="value"
                  position="right"
                  formatter={barLabelFormatter}
                  fill="#cbd5e1"
                  fontSize={11}
                  offset={8}
                />
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

