"use client";

import React from "react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, ArrowLeftRight, ChevronRight, Tag } from "lucide-react";

interface RecentTransactionsListProps {
  transactions: any[];
  currency?: string;
}

export function RecentTransactionsList({
  transactions,
  currency = "INR",
}: RecentTransactionsListProps) {
  return (
    <div className="glass-card p-5 sm:p-6 rounded-2xl border border-slate-800 bg-slate-900/60">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white">Recent Transactions</h3>
          <p className="text-xs text-slate-400 mt-0.5">Latest personal and shared activity</p>
        </div>
        <Link
          href="/transactions"
          className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors"
        >
          <span>View All</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500">
          No recent transactions yet. Use "+ Quick Add" above to record one.
        </div>
      ) : (
        <div className="divide-y divide-slate-800/80">
          {transactions.map((tx) => {
            const isIncome = tx.type === "INCOME";
            const isTransfer = tx.type === "TRANSFER";

            return (
              <div
                key={tx._id}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-800/30 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isIncome
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : isTransfer
                        ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                        : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                    }`}
                  >
                    {isIncome ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : isTransfer ? (
                      <ArrowLeftRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {tx.description}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span>{formatDate(tx.date, "dd MMM yyyy")}</span>
                      <span>•</span>
                      <span className="truncate">
                        {tx.categoryId?.name || tx.merchant || "General"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p
                    className={`text-xs font-bold ${
                      isIncome
                        ? "text-emerald-400"
                        : isTransfer
                        ? "text-cyan-400"
                        : "text-white"
                    }`}
                  >
                    {isIncome ? "+" : isTransfer ? "" : "-"}
                    {formatCurrency(tx.amount, currency)}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate max-w-[100px]">
                    {tx.accountId?.name || "Account"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
