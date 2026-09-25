"use client";

import React from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowUpRight,
  ArrowDownLeft,
  Users2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface KpiCardsProps {
  kpis: {
    totalBalance: number;
    totalIncome: number;
    totalExpenses: number;
    overallBudgetLimit: number;
    remainingBudget: number;
    budgetConsumedPercent: number;
    monthlySavings: number;
    savingsRate: number;
    owedToMe: number;
    iOwe: number;
    activeRoomsCount: number;
  };
  currency?: string;
}

export function KpiCards({ kpis, currency = "INR" }: KpiCardsProps) {
  const isBudgetExceeded = kpis.budgetConsumedPercent >= 100;
  const isBudgetWarning = kpis.budgetConsumedPercent >= 80 && !isBudgetExceeded;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Net Balance */}
      <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/60 relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <span>Net Balance</span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-white tracking-tight">
          {formatCurrency(kpis.totalBalance, currency)}
        </div>
        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
          <span>Across all active bank & cash accounts</span>
        </p>
      </div>

      {/* 2. Monthly Income & Savings Rate */}
      <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/60 relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <span>Monthly Income</span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-emerald-400 tracking-tight">
          {formatCurrency(kpis.totalIncome, currency)}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-emerald-300 mt-1">
          <PiggyBank className="w-3.5 h-3.5" />
          <span>{kpis.savingsRate}% Savings Rate (Saved {formatCurrency(kpis.monthlySavings, currency)})</span>
        </div>
      </div>

      {/* 3. Monthly Expenses & Budget Status */}
      <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/60 relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <span>Monthly Expenses</span>
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-rose-400 tracking-tight">
          {formatCurrency(kpis.totalExpenses, currency)}
        </div>
        <div className="mt-1 flex items-center gap-1 text-[11px]">
          {isBudgetExceeded ? (
            <span className="text-rose-400 flex items-center gap-1 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              Budget Exceeded ({kpis.budgetConsumedPercent}%)
            </span>
          ) : isBudgetWarning ? (
            <span className="text-amber-400 flex items-center gap-1 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              Near Limit ({kpis.budgetConsumedPercent}%)
            </span>
          ) : (
            <span className="text-slate-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              {kpis.overallBudgetLimit > 0
                ? `${kpis.budgetConsumedPercent}% of ${formatCurrency(kpis.overallBudgetLimit, currency)}`
                : "No budget cap set"}
            </span>
          )}
        </div>
      </div>

      {/* 4. Shared Room Dues (Owed to Me vs I Owe) */}
      <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/60 relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <span>Shared Room Dues</span>
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Users2 className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <div>
            <div className="text-[10px] text-emerald-400 font-semibold uppercase flex items-center gap-1">
              <ArrowDownLeft className="w-3 h-3" />
              <span>Owed to You</span>
            </div>
            <div className="text-base font-extrabold text-white">
              {formatCurrency(kpis.owedToMe, currency)}
            </div>
          </div>
          <div className="w-[1px] h-8 bg-slate-800" />
          <div>
            <div className="text-[10px] text-rose-400 font-semibold uppercase flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              <span>You Owe</span>
            </div>
            <div className="text-base font-extrabold text-white">
              {formatCurrency(kpis.iOwe, currency)}
            </div>
          </div>
        </div>
        <div className="text-[10px] text-slate-500 mt-2 text-right">
          Across {kpis.activeRoomsCount} active group rooms
        </div>
      </div>
    </div>
  );
}
