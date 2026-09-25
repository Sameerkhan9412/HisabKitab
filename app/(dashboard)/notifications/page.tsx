"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Bell, CheckCheck, ExternalLink, Sparkles, Users2, AlertTriangle, Coins } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function NotificationsPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      if (res.ok) {
        toastSuccess("All notifications marked as read");
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch {
      toastError("Failed to update notifications");
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Notification Center</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit alerts for communal settlements, shared room invites, and budget limits.
          </p>
        </div>

        {notifications.some((n) => !n.read) && (
          <button
            onClick={handleMarkAllRead}
            className="py-2 px-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-slate-900/60 border border-slate-800" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/60">
          <Bell className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white mb-1">No Notifications</h3>
          <p className="text-xs text-slate-400">
            You are completely up to date. You will receive notifications when shared expenses or settlements occur.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif._id}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                !notif.read
                  ? "bg-slate-900/90 border-emerald-500/30 shadow-lg shadow-emerald-500/5"
                  : "bg-slate-900/50 border-slate-800/80 text-slate-400"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    !notif.read
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                      : "bg-slate-800 text-slate-500 border-slate-700"
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${!notif.read ? "text-white" : "text-slate-300"}`}>
                    {notif.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-snug">{notif.message}</p>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    {formatDate(notif.createdAt, "dd MMM yyyy, hh:mm a")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {notif.link && (
                  <Link
                    href={notif.link}
                    onClick={() => handleMarkRead(notif._id)}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-850 text-slate-300 hover:text-white transition-colors"
                    title="View related record"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
                {!notif.read && (
                  <button
                    onClick={() => handleMarkRead(notif._id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-400 transition-colors"
                    title="Mark as read"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
