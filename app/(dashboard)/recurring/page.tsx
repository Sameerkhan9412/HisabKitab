"use client";

import React, { useState, useEffect } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Repeat,
  Plus,
  X,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Tag,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useSession } from "next-auth/react";

export default function RecurringPage() {
  const { data: session } = useSession();
  const { success: toastSuccess, error: toastError } = useToast();

  const [recurringList, setRecurringList] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [type, setType] = useState<string>("EXPENSE");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [frequency, setFrequency] = useState<string>("MONTHLY");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRecurring = async () => {
    setIsLoading(true);
    try {
      const [rRes, aRes, cRes] = await Promise.all([
        fetch("/api/recurring"),
        fetch("/api/accounts"),
        fetch("/api/categories"),
      ]);

      if (rRes.ok) {
        const data = await rRes.json();
        setRecurringList(data.recurring || []);
      }
      if (aRes.ok) {
        const aData = await aRes.json();
        setAccounts(aData.accounts || []);
        if (aData.accounts?.length > 0 && !accountId) {
          setAccountId(aData.accounts[0]._id);
        }
      }
      if (cRes.ok) {
        const cData = await cRes.json();
        setCategories(cData.categories || []);
        if (cData.categories?.length > 0 && !categoryId) {
          setCategoryId(cData.categories[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecurring();
  }, []);

  const handleCreateRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || Number(amount) <= 0) {
      toastError("Please provide description and valid amount");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          amount: Number(amount),
          accountId,
          categoryId,
          description: description.trim(),
          frequency,
          startDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toastError(data.error || "Failed to create recurring rule");
      } else {
        toastSuccess("Recurring rule established!");
        setIsModalOpen(false);
        setDescription("");
        setAmount("");
        fetchRecurring();
      }
    } catch {
      toastError("Network error setting up recurring rule");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currency = session?.user?.defaultCurrency || "INR";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Recurring Bills & Subscriptions</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Automate tracking for Netflix, rent, utilities, insurance EMIs, and monthly salaries.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 self-start sm:self-auto transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Recurring Rule</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-900/60 border border-slate-800" />
          ))}
        </div>
      ) : recurringList.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/60">
          <Repeat className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white mb-1">No Recurring Rules Configured</h3>
          <p className="text-xs text-slate-400 mb-4">
            Add recurring rent, internet bills, or subscriptions to forecast cash flows.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
          >
            Add First Rule
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recurringList.map((item) => (
            <div
              key={item._id}
              className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/70 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
                  <Repeat className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{item.description}</h4>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>Next: {formatDate(item.nextOccurrence, "dd MMM yyyy")}</span>
                    <span>•</span>
                    <span className="capitalize">{item.frequency.toLowerCase()}</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 truncate">
                    Charged via {item.accountId?.name || "Account"} • Category: {item.categoryId?.name || "General"}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-base font-black text-white">
                  {formatCurrency(item.amount, currency)}
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold">
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Recurring Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md glass-card p-6 rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">New Recurring Transaction</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRecurring} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description / Bill Name</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Netflix Premium, Apartment Rent, Wifi"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-base font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Payment Account</label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs"
                  >
                    {accounts.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">First Scheduled Date</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2 px-4 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Create Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
