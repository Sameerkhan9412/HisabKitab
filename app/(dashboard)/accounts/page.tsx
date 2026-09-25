"use client";

import React, { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  Wallet,
  Landmark,
  CreditCard,
  Plus,
  X,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Coins,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useSession } from "next-auth/react";

export default function AccountsPage() {
  const { data: session } = useSession();
  const { success: toastSuccess, error: toastError } = useToast();

  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New account form state
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("BANK");
  const [openingBalance, setOpeningBalance] = useState("0");
  const [creditLimit, setCreditLimit] = useState("");
  const [statementDate, setStatementDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toastError("Please enter an account name");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          currency: session?.user?.defaultCurrency || "INR",
          openingBalance: Number(openingBalance) || 0,
          creditLimit: type === "CREDIT_CARD" && creditLimit ? Number(creditLimit) : undefined,
          statementDate: statementDate ? Number(statementDate) : undefined,
          dueDate: dueDate ? Number(dueDate) : undefined,
          color,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toastError(data.error || "Failed to create account");
      } else {
        toastSuccess(`Account "${name}" created successfully`);
        setIsModalOpen(false);
        setName("");
        setOpeningBalance("0");
        setCreditLimit("");
        fetchAccounts();
      }
    } catch {
      toastError("Network error creating account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currency = session?.user?.defaultCurrency || "INR";
  const totalAssets = accounts
    .filter((a) => a.type !== "CREDIT_CARD")
    .reduce((sum, a) => sum + (a.currentBalance || 0), 0);

  const totalLiabilities = accounts
    .filter((a) => a.type === "CREDIT_CARD")
    .reduce((sum, a) => sum + Math.abs(a.currentBalance || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Accounts & Wallets</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor liquid bank balances, cash in hand, and credit card limits without sharing credentials.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 self-start sm:self-auto transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Account</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
          <div className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider mb-1">
            Total Liquid Assets
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {formatCurrency(totalAssets, currency)}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Cash + Bank Accounts</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
          <div className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider mb-1">
            Credit Outstanding
          </div>
          <div className="text-2xl font-black text-rose-400">
            {formatCurrency(totalLiabilities, currency)}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Current Credit Card balances</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
          <div className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider mb-1">
            Net Financial Worth
          </div>
          <div className="text-2xl font-black text-white">
            {formatCurrency(totalAssets - totalLiabilities, currency)}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Assets minus short-term credit</p>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {accounts.map((acc) => {
          const isCredit = acc.type === "CREDIT_CARD";
          const isCash = acc.type === "CASH";

          const availableCredit =
            isCredit && acc.creditLimit ? acc.creditLimit - (acc.currentBalance || 0) : 0;

          return (
            <div
              key={acc._id}
              className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/70 relative overflow-hidden flex flex-col justify-between"
            >
              {/* Account Card Header */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: `${acc.color}20`,
                        borderColor: `${acc.color}40`,
                        color: acc.color,
                      }}
                    >
                      {isCredit ? (
                        <CreditCard className="w-5 h-5" />
                      ) : isCash ? (
                        <Coins className="w-5 h-5" />
                      ) : (
                        <Landmark className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white truncate max-w-[150px]">
                        {acc.name}
                      </h3>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        {acc.type.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: acc.color }}
                  />
                </div>

                {/* Balances */}
                <div className="mt-4">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    {isCredit ? "Current Outstanding" : "Available Balance"}
                  </div>
                  <div
                    className={`text-2xl font-black mt-0.5 ${
                      isCredit ? "text-rose-400" : "text-white"
                    }`}
                  >
                    {formatCurrency(acc.currentBalance || 0, currency)}
                  </div>
                </div>

                {/* Credit Card Specific Metrics */}
                {isCredit && acc.creditLimit && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Total Limit:</span>
                      <span className="font-semibold text-slate-200">
                        {formatCurrency(acc.creditLimit, currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Available Credit:</span>
                      <span className="font-semibold text-emerald-400">
                        {formatCurrency(availableCredit, currency)}
                      </span>
                    </div>
                    {acc.dueDate && (
                      <div className="flex items-center gap-1.5 text-[10px] text-amber-400 mt-1">
                        <Calendar className="w-3 h-3" />
                        <span>Due on {acc.dueDate}th of every month</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                <span>Opening: {formatCurrency(acc.openingBalance || 0, currency)}</span>
                <span className="text-emerald-400 font-medium">Active</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md glass-card p-6 rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Create New Financial Account</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. ICICI Bank, Cash Wallet, Amex Platinum"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Account Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="BANK">Bank Account</option>
                    <option value="CASH">Cash in Hand</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="WALLET">Digital Wallet</option>
                    <option value="INVESTMENT">Investment Account</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Opening Balance
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              {type === "CREDIT_CARD" && (
                <div className="space-y-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Total Credit Limit (₹)
                    </label>
                    <input
                      type="number"
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(e.target.value)}
                      placeholder="e.g. 200000"
                      className="w-full px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Statement Date
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={statementDate}
                        onChange={(e) => setStatementDate(e.target.value)}
                        placeholder="Day (1-31)"
                        className="w-full px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Due Date
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        placeholder="Day (1-31)"
                        className="w-full px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Card Theme Accent
                </label>
                <div className="flex items-center gap-2">
                  {["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        color === c ? "scale-110 border-white" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
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
                  {isSubmitting ? "Creating..." : "Save Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
