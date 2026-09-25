"use client";

import React, { useState, useEffect } from "react";
import { X, ArrowDownRight, ArrowUpRight, ArrowLeftRight, Users, HandCoins } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function QuickAddModal({ isOpen, onClose, onSuccess }: QuickAddModalProps) {
  const { success: toastSuccess, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<"EXPENSE" | "INCOME" | "TRANSFER">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [merchant, setMerchant] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Fetch accounts and categories
      Promise.all([
        fetch("/api/accounts").then((r) => r.json()),
        fetch("/api/categories").then((r) => r.json()),
      ])
        .then(([accData, catData]) => {
          if (accData.accounts) {
            setAccounts(accData.accounts);
            if (accData.accounts.length > 0 && !accountId) {
              setAccountId(accData.accounts[0]._id);
              if (accData.accounts.length > 1) {
                setToAccountId(accData.accounts[1]._id);
              }
            }
          }
          if (catData.categories) {
            setCategories(catData.categories);
            const filtered = catData.categories.filter((c: any) => c.type === activeTab);
            if (filtered.length > 0) {
              setCategoryId(filtered[0]._id);
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen, activeTab, accountId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toastError("Please enter a valid amount greater than 0");
      return;
    }
    if (!description.trim()) {
      toastError("Please enter a description");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeTab,
          amount: Number(amount),
          accountId,
          toAccountId: activeTab === "TRANSFER" ? toAccountId : undefined,
          categoryId: activeTab === "TRANSFER" ? (categories[0]?._id || "transfer") : categoryId,
          description: description.trim(),
          merchant: merchant.trim() || undefined,
          date,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toastError(data.error || "Failed to record transaction");
      } else {
        toastSuccess(`${activeTab.toLowerCase()} recorded successfully!`);
        setAmount("");
        setDescription("");
        setMerchant("");
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch {
      toastError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === (activeTab === "TRANSFER" ? "EXPENSE" : activeTab));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg glass-card p-6 rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Quick Transaction</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="grid grid-cols-3 gap-2 my-5">
          <button
            type="button"
            onClick={() => setActiveTab("EXPENSE")}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "EXPENSE"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/50"
                : "bg-slate-850 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <ArrowDownRight className="w-4 h-4 text-rose-400" />
            <span>Expense</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("INCOME")}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "INCOME"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
                : "bg-slate-850 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            <span>Income</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("TRANSFER")}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "TRANSFER"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50"
                : "bg-slate-850 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
            <span>Transfer</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                ₹
              </span>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Description
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Grocery restock, Client payment, Cab fare"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {activeTab === "TRANSFER" ? "From Account" : "Account"}
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                {accounts.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name} (₹{(a.currentBalance / 100).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {activeTab === "TRANSFER" ? (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  To Account
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  {accounts
                    .filter((a) => a._id !== accountId)
                    .map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.name}
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  {filteredCategories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Merchant / Payee (Optional)
              </label>
              <input
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="e.g. Swiggy, Amazon, Uber"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Recording..." : `Record ${activeTab}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
