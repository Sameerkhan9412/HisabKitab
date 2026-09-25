"use client";

import React, { useEffect, useState } from "react";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { SpendingTrendChart } from "@/components/dashboard/SpendingTrendChart";
import { CategoryBreakdownChart } from "@/components/dashboard/CategoryBreakdownChart";
import { RecentTransactionsList } from "@/components/dashboard/RecentTransactionsList";
import { UpcomingBillsWidget } from "@/components/dashboard/UpcomingBillsWidget";
import { useSession } from "next-auth/react";
import { Sparkles, RefreshCw, Plus, Users2, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";

export default function DashboardPage() {
  const { data: session } = useSession();
  const { success: toastSuccess, error: toastError } = useToast();

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleSeedDemoData = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      if (res.ok) {
        toastSuccess("Demo environment populated with realistic transactions and shared rooms!");
        await fetchDashboard();
      } else {
        toastError("Failed to seed demo data");
      }
    } catch {
      toastError("Error triggering demo seed");
    } finally {
      setIsSeeding(false);
    }
  };

  const currency = session?.user?.defaultCurrency || "INR";

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-800 rounded-xl mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-900/60 border border-slate-800 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-slate-900/60 border border-slate-800 rounded-2xl" />
          <div className="h-80 bg-slate-900/60 border border-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  const hasNoData =
    !data ||
    (data.recentTransactions.length === 0 &&
      data.kpis.totalBalance === 0 &&
      data.kpis.totalIncome === 0);

  return (
    <div className="space-y-6">
      {/* Top Banner for 1-Click Demo Data when workspace is fresh */}
      {hasNoData && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-indigo-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                Workspace is Fresh! Want instant realistic financial data?
              </h4>
              <p className="text-xs text-slate-300">
                Populate realistic bank balances, 30-day spending trends, and active Goa/Flatmate shared rooms.
              </p>
            </div>
          </div>
          <button
            onClick={handleSeedDemoData}
            disabled={isSeeding}
            className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shrink-0 flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? "animate-spin" : ""}`} />
            <span>{isSeeding ? "Populating Data..." : "Load Demo Data (1-Click)"}</span>
          </button>
        </div>
      )}

      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Financial Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time balance, monthly budget consumption, and peer settlement matrix.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/rooms"
            className="py-2 px-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Users2 className="w-4 h-4 text-indigo-400" />
            <span>Shared Rooms</span>
          </Link>
          <Link
            href="/reports"
            className="py-2 px-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>Analytics</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      {data?.kpis && <KpiCards kpis={data.kpis} currency={currency} />}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SpendingTrendChart
            data={data?.spendingTrend || []}
            currency={currency}
          />
        </div>
        <div>
          <CategoryBreakdownChart
            categories={data?.categoryBreakdown || []}
            currency={currency}
          />
        </div>
      </div>

      {/* Recent Activity & Upcoming Bills */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentTransactionsList
            transactions={data?.recentTransactions || []}
            currency={currency}
          />
        </div>
        <div>
          <UpcomingBillsWidget
            bills={data?.upcomingBills || []}
            currency={currency}
          />
        </div>
      </div>
    </div>
  );
}
