"use client";

import React, { useState, useEffect, useCallback } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Search,
  Filter,
  Download,
  Trash2,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Tag,
  CheckSquare,
  Square,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { QuickAddModal } from "@/components/dashboard/QuickAddModal";
import { useSession } from "next-auth/react";

export default function TransactionsPage() {
  const { data: session } = useSession();
  const { success: toastSuccess, error: toastError } = useToast();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("ALL");
  const [accountId, setAccountId] = useState<string>("ALL");
  const [accounts, setAccounts] = useState<any[]>([]);

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", pagination.page.toString());
      params.set("limit", pagination.limit.toString());
      if (search.trim()) params.set("search", search.trim());
      if (type !== "ALL") params.set("type", type);
      if (accountId !== "ALL") params.set("accountId", accountId);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        if (data.pagination) setPagination(data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search, type, accountId]);

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((d) => setAccounts(d.accounts || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction? Account balance will be reversed.")) {
      return;
    }

    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (res.ok) {
        toastSuccess("Transaction deleted and balance reconciled");
        fetchTransactions();
      } else {
        toastError("Failed to delete transaction");
      }
    } catch {
      toastError("Error deleting transaction");
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} transactions?`)) return;

    try {
      await Promise.all(selectedIds.map((id) => fetch(`/api/transactions/${id}`, { method: "DELETE" })));
      toastSuccess(`Deleted ${selectedIds.length} transactions successfully`);
      setSelectedIds([]);
      fetchTransactions();
    } catch {
      toastError("Error during bulk deletion");
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === transactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(transactions.map((t) => t._id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const currency = session?.user?.defaultCurrency || "INR";

  return (
    <div className="space-y-6">
      {/* Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Transactions</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit, filter, and manage your personal expenses, incomes, and account transfers.
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

          <button
            onClick={() => setIsQuickAddOpen(true)}
            className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            placeholder="Search by description, merchant, tags, notes..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Type Filter */}
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="py-2 px-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            <option value="ALL">All Types</option>
            <option value="EXPENSE">Expenses Only</option>
            <option value="INCOME">Income Only</option>
            <option value="TRANSFER">Transfers Only</option>
          </select>

          {/* Account Filter */}
          <select
            value={accountId}
            onChange={(e) => {
              setAccountId(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="py-2 px-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            <option value="ALL">All Accounts</option>
            {accounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </select>

          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="py-2 px-3 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedIds.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table / List */}
      <div className="glass-card rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-500 mx-auto mb-3">
              <Tag className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">No transactions match your criteria</h3>
            <p className="text-xs text-slate-400">Try adjusting your filters or record a new transaction.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="p-4 w-10 text-center">
                    <button onClick={toggleSelectAll}>
                      {selectedIds.length === transactions.length ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600" />
                      )}
                    </button>
                  </th>
                  <th className="p-4">Transaction</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Account</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {transactions.map((tx) => {
                  const isIncome = tx.type === "INCOME";
                  const isTransfer = tx.type === "TRANSFER";
                  const isSelected = selectedIds.includes(tx._id);

                  return (
                    <tr
                      key={tx._id}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        isSelected ? "bg-emerald-500/5" : ""
                      }`}
                    >
                      <td className="p-4 text-center">
                        <button onClick={() => toggleSelect(tx._id)}>
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600" />
                          )}
                        </button>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isIncome
                                ? "bg-emerald-500/10 text-emerald-400"
                                : isTransfer
                                ? "bg-cyan-500/10 text-cyan-400"
                                : "bg-rose-500/10 text-rose-400"
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
                            <p className="font-semibold text-white truncate">{tx.description}</p>
                            {tx.merchant && (
                              <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                @ {tx.merchant}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="px-2 py-1 rounded-md bg-slate-800 text-[11px] text-slate-300 font-medium">
                          {tx.categoryId?.name || (isTransfer ? "Transfer" : "Uncategorized")}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="text-slate-300 font-medium">
                          {tx.accountId?.name || "Main"}
                          {isTransfer && tx.toAccountId && ` → ${tx.toAccountId.name}`}
                        </span>
                      </td>

                      <td className="p-4 text-slate-400">
                        {formatDate(tx.date, "dd MMM yyyy")}
                      </td>

                      <td className="p-4 text-right">
                        <span
                          className={`font-black text-sm ${
                            isIncome
                              ? "text-emerald-400"
                              : isTransfer
                              ? "text-cyan-400"
                              : "text-white"
                          }`}
                        >
                          {isIncome ? "+" : isTransfer ? "" : "-"}
                          {formatCurrency(tx.amount, currency)}
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDelete(tx._id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="Delete & Reconcile"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSuccess={fetchTransactions}
      />
    </div>
  );
}
