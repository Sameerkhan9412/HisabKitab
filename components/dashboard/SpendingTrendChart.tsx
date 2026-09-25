"use client";

import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface SpendingTrendChartProps {
  data: Array<{
    date: string;
    income: number;
    expense: number;
  }>;
  currency?: string;
}

export function SpendingTrendChart({ data, currency = "INR" }: SpendingTrendChartProps) {
  const [range, setRange] = useState<"7D" | "30D">("30D");

  const displayData = range === "7D" ? data.slice(-7) : data;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 rounded-xl bg-slate-900/95 border border-slate-700 shadow-xl backdrop-blur-md text-xs">
          <p className="font-bold text-white mb-1.5">{label}</p>
          <div className="space-y-1">
            <p className="text-emerald-400 flex items-center justify-between gap-4">
              <span>Income:</span>
              <span className="font-semibold">
                {currency === "INR" ? "₹" : "$"}
                {payload[0]?.value?.toLocaleString()}
              </span>
            </p>
            <p className="text-rose-400 flex items-center justify-between gap-4">
              <span>Expense:</span>
              <span className="font-semibold">
                {currency === "INR" ? "₹" : "$"}
                {payload[1]?.value?.toLocaleString()}
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card p-5 sm:p-6 rounded-2xl border border-slate-800 bg-slate-900/60">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-bold text-white">Cash Flow Dynamics</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare daily income inflows versus out-of-pocket spending
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/60 border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setRange("7D")}
            className={`py-1 px-3 rounded-lg text-xs font-semibold transition-all ${
              range === "7D"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setRange("30D")}
            className={`py-1 px-3 rounded-lg text-xs font-semibold transition-all ${
              range === "30D"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            30 Days
          </button>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full">
        {displayData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500">
            No transactions recorded in this period yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#incomeGradient)"
              />
              <Area
                type="monotone"
                dataKey="expense"
                stroke="#f43f5e"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#expenseGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
