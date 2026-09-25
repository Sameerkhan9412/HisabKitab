"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface CategoryBreakdownChartProps {
  categories: Array<{
    categoryId: string;
    name: string;
    color: string;
    icon: string;
    amount: number; // minor units
  }>;
  currency?: string;
}

export function CategoryBreakdownChart({ categories, currency = "INR" }: CategoryBreakdownChartProps) {
  const totalExpense = categories.reduce((sum, c) => sum + c.amount, 0);

  const chartData = categories.map((c) => ({
    name: c.name,
    value: c.amount / 100,
    color: c.color || "#6366f1",
    percent: totalExpense > 0 ? Math.round((c.amount / totalExpense) * 100) : 0,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-2.5 rounded-xl bg-slate-900/95 border border-slate-700 shadow-xl text-xs backdrop-blur-md">
          <p className="font-bold text-white mb-0.5">{data.name}</p>
          <p className="text-emerald-400 font-semibold">
            {currency === "INR" ? "₹" : "$"}
            {data.value.toLocaleString()} ({data.percent}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card p-5 sm:p-6 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col">
      <div className="mb-4">
        <h3 className="text-base font-bold text-white">Expense Distribution</h3>
        <p className="text-xs text-slate-400 mt-0.5">Categorical monthly spending</p>
      </div>

      {chartData.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mb-2">
            🏷️
          </div>
          <p className="text-xs text-slate-400">No expenses recorded this month yet.</p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-4 flex-1">
          <div className="h-48 w-48 shrink-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-slate-400 font-medium">Total Spent</span>
              <span className="text-xs font-black text-white">
                {formatCurrency(totalExpense, currency)}
              </span>
            </div>
          </div>

          <div className="flex-1 w-full space-y-2 overflow-y-auto max-h-48 pr-1">
            {chartData.slice(0, 5).map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-300 font-medium truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-slate-400">{item.percent}%</span>
                  <span className="font-semibold text-white">
                    {currency === "INR" ? "₹" : "$"}
                    {item.value.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
