"use client";

import React, { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  Target,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Flame,
  Plus,
  Pencil,
  X,
  PieChart,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useSession } from "next-auth/react";
import { getDaysInMonth } from "date-fns";

export default function BudgetsPage() {
  const { data: session } = useSession();
  const { success: toastSuccess, error: toastError } = useToast();

  const [period, setPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const [budgetData, setBudgetData] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form states
  const [overallLimit, setOverallLimit] = useState("");
  const [categoryLimits, setCategoryLimits] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBudget = async () => {
    setIsLoading(true);
    try {
      const [bRes, cRes] = await Promise.all([
        fetch(`/api/budgets?period=${period}`),
        fetch("/api/categories"),
      ]);

      if (bRes.ok) {
        const bJson = await bRes.json();
        setBudgetData(bJson);
        if (bJson.budget) {
          setOverallLimit((bJson.budget.overallLimit / 100).toString());
          const catMap: Record<string, string> = {};
          for (const cl of bJson.budget.categoryLimits || []) {
            const catId = cl.categoryId?._id || cl.categoryId;
            catMap[catId] = (cl.limit / 100).toString();
          }
          setCategoryLimits(catMap);
        }
      }

      if (cRes.ok) {
        const cJson = await cRes.json();
        setCategories((cJson.categories || []).filter((c: any) => c.type === "EXPENSE"));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBudget();
  }, [period]);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formattedCategoryLimits = Object.entries(categoryLimits)
        .filter(([_, val]) => Number(val) > 0)
        .map(([catId, val]) => ({
          categoryId: catId,
          limit: Number(val),
          rollover: false,
        }));

      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period,
          overallLimit: Number(overallLimit) || 0,
          categoryLimits: formattedCategoryLimits,
          alertThresholds: [50, 75, 90, 100],
        }),
      });

      if (res.ok) {
        toastSuccess("Monthly budget updated successfully!");
        setIsEditModalOpen(false);
        fetchBudget();
      } else {
        toastError("Failed to save budget settings");
      }
    } catch {
      toastError("Error communicating with budget service");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currency = session?.user?.defaultCurrency || "INR";
  const now = new Date();
  const daysInMonth = getDaysInMonth(now);
  const currentDay = now.getDate();
  const daysRemaining = Math.max(1, daysInMonth - currentDay);

  const budget = budgetData?.budget;
  const overallMinor = budget?.overallLimit || 0;
  const spentMinor = budgetData?.totalSpent || 0;
  const remainingMinor = Math.max(0, overallMinor - spentMinor);
  const percentConsumed = overallMinor > 0 ? Math.round((spentMinor / overallMinor) * 100) : 0;
  const dailySuggestedAllowance = remainingMinor > 0 ? Math.round(remainingMinor / daysRemaining) : 0;

  const isExceeded = percentConsumed >= 100;
  const isWarning = percentConsumed >= 75 && !isExceeded;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Monthly Budgets</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Set overall spending ceilings and category targets with proactive alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="py-1.5 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Set / Edit Budget</span>
          </button>
        </div>
      </div>

      {/* Main Budget Card */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 bg-slate-900/80 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400 mb-1">
              <Target className="w-4 h-4 text-emerald-400" />
              <span>Overall Monthly Cap ({period})</span>
            </div>
            <div className="text-3xl font-black text-white">
              {formatCurrency(overallMinor, currency)}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400">Total Spent:</span>
              <div className={`font-bold text-sm ${isExceeded ? "text-rose-400" : "text-white"}`}>
                {formatCurrency(spentMinor, currency)}
              </div>
            </div>

            <div>
              <span className="text-slate-400">Remaining:</span>
              <div className="font-bold text-sm text-emerald-400">
                {formatCurrency(remainingMinor, currency)}
              </div>
            </div>

            <div>
              <span className="text-slate-400">Days Left:</span>
              <div className="font-bold text-sm text-white">
                {daysRemaining} Days
              </div>
            </div>

            <div>
              <span className="text-slate-400">Daily Allowance:</span>
              <div className="font-bold text-sm text-teal-300">
                {formatCurrency(dailySuggestedAllowance, currency)}/day
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar & Status Text */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Budget Consumed</span>
            <span
              className={`font-bold ${
                isExceeded ? "text-rose-400" : isWarning ? "text-amber-400" : "text-emerald-400"
              }`}
            >
              {percentConsumed}%
            </span>
          </div>

          <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isExceeded
                  ? "bg-rose-500"
                  : isWarning
                  ? "bg-amber-500"
                  : "bg-gradient-to-r from-emerald-500 to-teal-400"
              }`}
              style={{ width: `${Math.min(100, percentConsumed)}%` }}
            />
          </div>

          <div className="pt-2 flex items-center gap-2 text-xs">
            {isExceeded ? (
              <div className="flex items-center gap-1.5 text-rose-400 font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  Budget exceeded by {formatCurrency(spentMinor - overallMinor, currency)}. Consider reallocating funds.
                </span>
              </div>
            ) : isWarning ? (
              <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <Flame className="w-4 h-4 shrink-0" />
                <span>
                  Approaching monthly budget threshold ({percentConsumed}% consumed).
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Spending pace is healthy and within target parameters.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Limits Breakdown */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Category Budgets</h2>

        {categories.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 glass-card rounded-2xl border border-slate-800">
            No expense categories found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat) => {
              const catLimitMinor =
                (budget?.categoryLimits?.find(
                  (c: any) => (c.categoryId?._id || c.categoryId) === cat._id
                )?.limit || 0);

              const catSpentMinor = budgetData?.spentByCategory?.[cat._id] || 0;
              const catPercent =
                catLimitMinor > 0 ? Math.round((catSpentMinor / catLimitMinor) * 100) : 0;
              const isCatExceeded = catPercent >= 100 && catLimitMinor > 0;

              return (
                <div
                  key={cat._id}
                  className="glass-card p-4 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-xs font-bold text-white">{cat.name}</span>
                    </div>

                    <div className="text-right text-xs">
                      <span className={`font-bold ${isCatExceeded ? "text-rose-400" : "text-slate-200"}`}>
                        {formatCurrency(catSpentMinor, currency)}
                      </span>
                      {catLimitMinor > 0 && (
                        <span className="text-slate-400 text-[10px]">
                          {" "}
                          / {formatCurrency(catLimitMinor, currency)}
                        </span>
                      )}
                    </div>
                  </div>

                  {catLimitMinor > 0 ? (
                    <>
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isCatExceeded ? "bg-rose-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(100, catPercent)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>{catPercent}% spent</span>
                        <span>
                          {catSpentMinor >= catLimitMinor
                            ? `Over by ${formatCurrency(catSpentMinor - catLimitMinor, currency)}`
                            : `${formatCurrency(catLimitMinor - catSpentMinor, currency)} remaining`}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-[10px] text-slate-500 italic">
                      No dedicated limit set for this category
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Set/Edit Budget Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg glass-card p-6 rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <h3 className="text-base font-bold text-white">
                Set Budget for {period}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4 mt-4 overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Overall Monthly Spending Cap (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={overallLimit}
                  onChange={(e) => setOverallLimit(e.target.value)}
                  placeholder="50000"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-base font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  autoFocus
                />
              </div>

              <div className="pt-2 border-t border-slate-800">
                <p className="text-xs font-bold text-slate-300 mb-3">
                  Category Limits (Optional)
                </p>
                <div className="space-y-2.5">
                  {categories.map((c) => (
                    <div key={c._id} className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-slate-300 truncate">{c.name}</span>
                      <div className="w-36 shrink-0 relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                          ₹
                        </span>
                        <input
                          type="number"
                          step="any"
                          value={categoryLimits[c._id] || ""}
                          onChange={(e) =>
                            setCategoryLimits({
                              ...categoryLimits,
                              [c._id]: e.target.value,
                            })
                          }
                          placeholder="0"
                          className="w-full pl-6 pr-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="py-2 px-4 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Budget"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
