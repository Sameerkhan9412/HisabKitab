"use client";

import React from "react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CalendarClock, ChevronRight, Repeat } from "lucide-react";

interface UpcomingBillsWidgetProps {
  bills: any[];
  currency?: string;
}

export function UpcomingBillsWidget({ bills, currency = "INR" }: UpcomingBillsWidgetProps) {
  return (
    <div className="glass-card p-5 sm:p-6 rounded-2xl border border-slate-800 bg-slate-900/60">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white">Upcoming Bills</h3>
          <p className="text-xs text-slate-400 mt-0.5">Subscriptions & scheduled outflows</p>
        </div>
        <Link
          href="/recurring"
          className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors"
        >
          <span>Manage</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {bills.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-500">
          No recurring bills scheduled.
        </div>
      ) : (
        <div className="space-y-2.5">
          {bills.map((bill) => (
            <div
              key={bill._id}
              className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
                  <Repeat className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">
                    {bill.description}
                  </p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <CalendarClock className="w-3 h-3 text-slate-500" />
                    <span>Due {formatDate(bill.nextOccurrence, "dd MMM")}</span>
                    <span>•</span>
                    <span className="capitalize">{bill.frequency.toLowerCase()}</span>
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-white">
                  {formatCurrency(bill.amount, currency)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
