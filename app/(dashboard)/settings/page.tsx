"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  User as UserIcon,
  Globe,
  Lock,
  Download,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const { success: toastSuccess, error: toastError } = useToast();

  const [name, setName] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState("INR");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setName(data.user.name || "");
          setDefaultCurrency(data.user.defaultCurrency || "INR");
          setTimezone(data.user.timezone || "Asia/Kolkata");
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toastError("Name cannot be empty");
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), defaultCurrency, timezone }),
      });

      const data = await res.json();
      if (!res.ok) {
        toastError(data.error || "Failed to update profile");
      } else {
        toastSuccess("Profile preferences saved!");
        await update({ name, defaultCurrency });
      }
    } catch {
      toastError("Network error saving profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toastError("Please enter your current password");
      return;
    }
    if (newPassword.length < 8) {
      toastError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toastError("New passwords do not match");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        toastError(data.error || "Password update failed");
      } else {
        toastSuccess("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      toastError("Error updating password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Account & Security Settings</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage currency preferences, locale conventions, security credentials, and data privacy.
        </p>
      </div>

      {/* Profile & Currency Form */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 bg-slate-900/70">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-emerald-400" />
          <span>Profile & Display Preferences</span>
        </h3>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={session?.user?.email || ""}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950/40 border border-slate-800 text-slate-500 text-xs cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Default Currency
              </label>
              <select
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="INR">₹ INR (Indian Rupee: ₹1,25,000)</option>
                <option value="USD">$ USD (US Dollar: $1,250.00)</option>
                <option value="EUR">€ EUR (Euro: €1.250,00)</option>
                <option value="GBP">£ GBP (British Pound: £1,250.00)</option>
                <option value="AED">AED (UAE Dirham)</option>
                <option value="SGD">S$ SGD (Singapore Dollar)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Timezone</label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="py-2 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
            >
              {isSavingProfile ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        </form>
      </div>

      {/* Password Change Form */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 bg-slate-900/70">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-indigo-400" />
          <span>Security & Password</span>
        </h3>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="py-2 px-5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold transition-all disabled:opacity-50"
            >
              {isChangingPassword ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>

      {/* Data Export & Privacy Notice */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 bg-slate-900/70 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Download className="w-5 h-5 text-emerald-400" />
          <span>Data Portability & Account Privacy</span>
        </h3>

        <p className="text-xs text-slate-400 leading-relaxed">
          You own your data. You can download your complete transaction ledger at any time in RFC-compliant CSV or JSON format. In compliance with financial audit integrity, personal transactions will be anonymized upon soft-deletion, preserving communal settlement history for other room members.
        </p>

        <div className="flex items-center gap-3 pt-2">
          <a
            href="/api/export?format=csv"
            download
            className="py-2 px-4 rounded-xl bg-slate-950 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download All Data (CSV)</span>
          </a>
          <a
            href="/api/export?format=json"
            download
            className="py-2 px-4 rounded-xl bg-slate-950 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download All Data (JSON)</span>
          </a>
        </div>
      </div>
    </div>
  );
}
