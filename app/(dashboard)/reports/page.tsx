"use client";

import React, { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart3,
  Download,
  TrendingUp,
  TrendingDown,
  PieChart,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useSession } from "next-auth/react";

export default function ReportsPage() {
  const { data: session } = useSession();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => setDashboardData(d))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const currency = session?.user?.defaultCurrency || "INR";

  if (isLoading || !dashboardData) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-72 bg-slate-800 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-900/60 border border-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  const { kpis, spendingTrend, categoryBreakdown } = dashboardData;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 rounded-xl bg-slate-900/95 border border-slate-700 shadow-xl text-xs">
          <p className="font-bold text-white mb-1">{label}</p>
          <p className="text-emerald-400 font-semibold">
            Income: ₹{payload[0]?.value?.toLocaleString()}
          </p>
          <p className="text-rose-400 font-semibold">
            Expense: ₹{payload[1]?.value?.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Financial Reports & Insights</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Holistic analytics on capital retention, categorical leakages, and savings trends.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/export?format=csv"
            download
            className="py-2 px-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
          <a
            href="/api/export?format=json"
            download
            className="py-2 px-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </a>
        </div>
      </div>

      {/* Analytics KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
          <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
            Net Monthly Cashflow
          </span>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {formatCurrency(kpis.monthlySavings, currency)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Positive retained surplus after personal outflows
          </p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
          <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
            Savings Efficiency Rate
          </span>
          <div className="text-2xl font-black text-teal-300 mt-1">
            {kpis.savingsRate}%
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Percent of total inflows preserved for wealth building
          </p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
          <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
            Budget Consumption Pace
          </span>
          <div className="text-2xl font-black text-white mt-1">
            {kpis.budgetConsumedPercent}%
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Of {formatCurrency(kpis.overallBudgetLimit, currency)} spending limit
          </p>
        </div>
      </div>

      {/* Bar Chart Inflow vs Outflow */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 bg-slate-900/70">
        <div className="mb-6">
          <h3 className="text-base font-bold text-white">Daily Cashflow Comparison (Last 30 Days)</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Visual inspection of high outflow peaks and payroll inflow days
          </p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={spendingTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Spending Table */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 bg-slate-900/70">
        <h3 className="text-base font-bold text-white mb-4">Category Outflow Summary</h3>
        {categoryBreakdown.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">No expenses recorded.</div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {categoryBreakdown.map((c: any) => {
              const totalExp = kpis.totalExpenses || 1;
              const pct = Math.round((c.amount / totalExp) * 100);

              return (
                <div key={c.categoryId} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="font-semibold text-white">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400 text-[11px]">{pct}% of spending</span>
                    <span className="font-black text-white">{formatCurrency(c.amount, currency)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
