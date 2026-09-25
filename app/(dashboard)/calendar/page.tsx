"use client";

import React, { useState, useEffect } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
} from "date-fns";
import { useSession } from "next-auth/react";

export default function CalendarPage() {
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const mStart = format(startOfMonth(currentDate), "yyyy-MM-dd");
    const mEnd = format(endOfMonth(currentDate), "yyyy-MM-dd");

    setIsLoading(true);
    fetch(`/api/transactions?startDate=${mStart}&endDate=${mEnd}&limit=100`)
      .then((r) => r.json())
      .then((d) => setTransactions(d.transactions || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [currentDate]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Starting empty offset
  const startDayOffset = getDay(monthStart);

  // Filter transactions for currently selected day
  const selectedDayTransactions = transactions.filter((t) =>
    isSameDay(new Date(t.date), selectedDate)
  );

  const currency = session?.user?.defaultCurrency || "INR";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Financial Calendar</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Visualize income receipts, bill deadlines, and spending patterns day-by-day.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-white px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
            {format(currentDate, "MMMM yyyy")}
          </span>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid (2 Cols) */}
        <div className="lg:col-span-2 glass-card p-5 sm:p-6 rounded-3xl border border-slate-800 bg-slate-900/70">
          <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {Array.from({ length: startDayOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="h-16 sm:h-20 rounded-xl bg-slate-950/20" />
            ))}

            {daysInMonth.map((day) => {
              const isSelected = isSameDay(day, selectedDate);
              const dayTxs = transactions.filter((t) => isSameDay(new Date(t.date), day));
              const hasIncome = dayTxs.some((t) => t.type === "INCOME");
              const hasExpense = dayTxs.some((t) => t.type === "EXPENSE");

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`h-16 sm:h-20 p-2 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow-md shadow-emerald-500/10"
                      : "border-slate-800/80 bg-slate-950/40 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <span className="text-xs font-bold">{format(day, "d")}</span>

                  <div className="flex items-center gap-1">
                    {hasIncome && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                    {hasExpense && <span className="w-2 h-2 rounded-full bg-rose-400" />}
                    {dayTxs.length > 0 && (
                      <span className="text-[10px] text-slate-400 ml-auto hidden sm:inline">
                        {dayTxs.length}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Detail Drawer (1 Col) */}
        <div className="glass-card p-5 sm:p-6 rounded-3xl border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
              <CalendarIcon className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-white">
                  {formatDate(selectedDate, "EEEE, dd MMMM yyyy")}
                </h3>
                <span className="text-[11px] text-slate-400">
                  {selectedDayTransactions.length} activity records
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-3 overflow-y-auto max-h-[380px] pr-1">
              {selectedDayTransactions.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No transactions recorded on this date.
                </div>
              ) : (
                selectedDayTransactions.map((tx) => {
                  const isIncome = tx.type === "INCOME";
                  const isTransfer = tx.type === "TRANSFER";

                  return (
                    <div
                      key={tx._id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isIncome
                              ? "bg-emerald-500/10 text-emerald-400"
                              : isTransfer
                              ? "bg-cyan-500/10 text-cyan-400"
                              : "bg-rose-500/10 text-rose-400"
                          }`}
                        >
                          {isIncome ? (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          ) : isTransfer ? (
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate">{tx.description}</p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {tx.categoryId?.name || tx.merchant || "General"}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`font-black shrink-0 ${
                          isIncome ? "text-emerald-400" : isTransfer ? "text-cyan-400" : "text-white"
                        }`}
                      >
                        {isIncome ? "+" : isTransfer ? "" : "-"}
                        {formatCurrency(tx.amount, currency)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
