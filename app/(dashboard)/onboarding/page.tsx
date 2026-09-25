"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, CheckCircle2, ArrowRight, Wallet, Target, Users } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function OnboardingPage() {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  const [step, setStep] = useState(1);
  const [currency, setCurrency] = useState("INR");
  const [monthlyBudget, setMonthlyBudget] = useState("50000");
  const [initialIncome, setInitialIncome] = useState("100000");
  const [roomName, setRoomName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFinish = async (skip: boolean = false) => {
    setIsSubmitting(true);
    try {
      if (!skip) {
        // 1. Update Profile Currency & onboarding completed
        await fetch("/api/user/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            defaultCurrency: currency,
            onboardingCompleted: true,
          }),
        });

        // 2. Set Initial Monthly Budget
        if (Number(monthlyBudget) > 0) {
          const now = new Date();
          const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
          await fetch("/api/budgets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              period,
              overallLimit: Number(monthlyBudget),
              categoryLimits: [],
              alertThresholds: [50, 75, 90, 100],
            }),
          });
        }

        // 3. Create room if specified
        if (roomName.trim()) {
          await fetch("/api/rooms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: roomName.trim(),
              currency,
              description: "Created during onboarding",
            }),
          });
        }
      } else {
        await fetch("/api/user/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ onboardingCompleted: true }),
        });
      }

      toastSuccess("Your financial workspace is ready!", "Welcome aboard!");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toastError("Failed to save onboarding settings. Continuing to dashboard...");
      router.push("/dashboard");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-xl w-full glass-card p-6 sm:p-10 rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl">
        {/* Progress indicators */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Quick Setup Guide</h2>
              <p className="text-xs text-slate-400">Step {step} of 3</p>
            </div>
          </div>
          <button
            onClick={() => handleFinish(true)}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Skip for now
          </button>
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-xl font-bold mb-2">Select Your Base Currency</h3>
              <p className="text-sm text-slate-400">
                Choose the primary currency you wish your personal budgets and cashflow analytics to display in.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { code: "INR", label: "Indian Rupee (₹)", symbol: "₹" },
                { code: "USD", label: "US Dollar ($)", symbol: "$" },
                { code: "EUR", label: "Euro (€)", symbol: "€" },
                { code: "GBP", label: "British Pound (£)", symbol: "£" },
              ].map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setCurrency(c.code)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    currency === c.code
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                      : "border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="text-2xl font-bold mb-1">{c.symbol}</div>
                  <div className="text-xs font-semibold">{c.label}</div>
                </button>
              ))}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="py-2.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm flex items-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-xl font-bold mb-2">Set Your Monthly Budget Target</h3>
              <p className="text-sm text-slate-400">
                Setting a spending benchmark helps track whether you are ahead or behind your target every month.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Monthly Spending Cap ({currency})
                </label>
                <div className="relative">
                  <Target className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="number"
                    value={monthlyBudget}
                    onChange={(e) => setMonthlyBudget(e.target.value)}
                    placeholder="50000"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950/60 border border-slate-700 text-white text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Estimated Monthly Income ({currency})
                </label>
                <div className="relative">
                  <Wallet className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="number"
                    value={initialIncome}
                    onChange={(e) => setInitialIncome(e.target.value)}
                    placeholder="100000"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950/60 border border-slate-700 text-white text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="py-2.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm flex items-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-xl font-bold mb-2">Shared Room Expenses</h3>
              <p className="text-sm text-slate-400">
                Optionally create your first shared group now for roommates, trips, or dining splits.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Room Name (Optional)
              </label>
              <div className="relative">
                <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. Flatmates, Goa Vacation, Office Lunch"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950/60 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-400 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>You will receive an invite code to share with friends right after this!</span>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                onClick={() => setStep(2)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Back
              </button>
              <button
                onClick={() => handleFinish(false)}
                disabled={isSubmitting}
                className="py-2.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? "Finalizing Workspace..." : "Complete Setup & Go to Dashboard"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
