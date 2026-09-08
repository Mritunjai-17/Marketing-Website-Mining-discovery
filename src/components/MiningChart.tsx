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

  const chartData = data.map((item) => ({
    ...item,
    label: item.label.split("\n")[0].trim(),
  }));

  const tooltipFormatter = (value: any) => {
    if (typeof value === "number") {
      return `${value.toLocaleString()} ${unit || ""}`.trim();
    }
    return `${value} ${unit || ""}`.trim();
  };

  const barChartHeight = Math.max(280, data.length * 45);

  return (
    <div className="w-full mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 shadow-md">
      {title && <h4 className="text-xs font-semibold text-[#D4AF37] mb-3">{title}</h4>}
      <div style={{ width: "100%", height: barChartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          {type === "line" ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip formatter={tooltipFormatter} contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#fff" }} />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#D4AF37" strokeWidth={2.5} activeDot={{ r: 6 }} />
            </LineChart>
          ) : type === "pie" || type === "doughnut" ? (
            <PieChart>
              <Pie
                data={chartData}
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
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={tooltipFormatter} contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#fff" }} />
              <Legend />
            </PieChart>
          ) : (
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" stroke="#94a3b8" fontSize={11} />
              <YAxis dataKey="label" type="category" stroke="#94a3b8" fontSize={11} width={100} />
              <Tooltip formatter={tooltipFormatter} contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#fff" }} />
              <Bar dataKey="value" fill="#D4AF37" radius={[0, 6, 6, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
