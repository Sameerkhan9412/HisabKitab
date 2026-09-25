"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Users2,
  Plus,
  HandCoins,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  X,
  Copy,
  Check,
  Receipt,
  History,
  Shield,
  LogOut,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useSession } from "next-auth/react";

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const { data: session } = useSession();
  const { success: toastSuccess, error: toastError } = useToast();

  const [roomData, setRoomData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"EXPENSES" | "BALANCES" | "SETTLEMENTS" | "ACTIVITY">("EXPENSES");

  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // New Shared Expense Form
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [splitType, setSplitType] = useState<"EQUAL" | "EXACT" | "PERCENTAGE" | "SHARES">("EQUAL");
  const [notes, setNotes] = useState("");
  const [payers, setPayers] = useState<{ userId: string; amount: string }[]>([]);
  const [splits, setSplits] = useState<{ userId: string; amount?: string; percentage?: string; shares?: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Settlement Form
  const [settleToUser, setSettleToUser] = useState("");
  const [settleAmount, setSettleAmount] = useState("");
  const [settleMethod, setSettleMethod] = useState<string>("UPI");
  const [settleNotes, setSettleNotes] = useState("");

  const fetchRoomData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}`);
      if (res.ok) {
        const data = await res.json();
        setRoomData(data);

        // Prepopulate payers and split participants for expense modal
        if (data.members && data.members.length > 0) {
          const currentUserId = session?.user?.id || data.members[0].userId._id;
          setPayers([{ userId: currentUserId, amount: "" }]);
          setSplits(data.members.map((m: any) => ({ userId: m.userId._id, shares: "1" })));
          setSettleToUser(data.members.find((m: any) => m.userId._id !== currentUserId)?.userId._id || "");
        }
      } else {
        const err = await res.json();
        toastError(err.error || "Failed to load room");
      }
    } catch {
      toastError("Error fetching room details");
    } finally {
      setIsLoading(false);
    }
  }, [roomId, session?.user?.id]);

  useEffect(() => {
    fetchRoomData();
  }, [fetchRoomData]);

  const handleCopyCode = () => {
    if (roomData?.room?.inviteCode) {
      navigator.clipboard.writeText(roomData.room.inviteCode);
      setCopiedCode(true);
      toastSuccess("Invite code copied!");
      setTimeout(() => setCopiedCode(false), 3000);
    }
  };

  const handleLeaveRoom = async () => {
    if (!confirm("Are you sure you want to leave this room? Outstanding balances must be 0.")) return;

    try {
      const res = await fetch(`/api/rooms/${roomId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toastError(data.error || "Cannot leave room");
      } else {
        toastSuccess("You have left the room.");
        router.push("/rooms");
      }
    } catch {
      toastError("Failed to leave room");
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || Number(amount) <= 0) {
      toastError("Please provide a valid title and amount");
      return;
    }

    setIsSubmitting(true);
    try {
      // Format Payers
      const formattedPayers = payers
        .filter((p) => Number(p.amount) > 0)
        .map((p) => ({
          userId: p.userId,
          amount: Number(p.amount),
        }));

      // If single payer quick setup
      if (formattedPayers.length === 0) {
        formattedPayers.push({
          userId: session?.user?.id || roomData.members[0].userId._id,
          amount: Number(amount),
        });
      }

      // Format Splits
      const formattedSplits = splits.map((s) => ({
        userId: s.userId,
        amount: s.amount ? Number(s.amount) : undefined,
        percentage: s.percentage ? Number(s.percentage) : undefined,
        shares: s.shares ? Number(s.shares) : undefined,
      }));

      const res = await fetch(`/api/rooms/${roomId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          amount: Number(amount),
          currency: roomData.room.currency || "INR",
          date,
          splitType,
          payers: formattedPayers,
          splits: formattedSplits,
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toastError(data.error || "Failed to create shared expense");
      } else {
        toastSuccess("Shared expense added and peer balances updated!");
        setIsExpenseModalOpen(false);
        setTitle("");
        setAmount("");
        setNotes("");
        fetchRoomData();
      }
    } catch {
      toastError("Network error recording expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleToUser || !settleAmount || Number(settleAmount) <= 0) {
      toastError("Please specify recipient and settlement amount");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromUserId: session?.user?.id,
          toUserId: settleToUser,
          amount: Number(settleAmount),
          currency: roomData.room.currency || "INR",
          method: settleMethod,
          date: new Date().toISOString(),
          notes: settleNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toastError(data.error || "Failed to record settlement");
      } else {
        toastSuccess("Settlement recorded and debts cleared!");
        setIsSettleModalOpen(false);
        setSettleAmount("");
        setSettleNotes("");
        fetchRoomData();
      }
    } catch {
      toastError("Network error recording settlement");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !roomData) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-72 bg-slate-800 rounded-xl" />
        <div className="h-40 bg-slate-900/60 border border-slate-800 rounded-2xl" />
        <div className="h-96 bg-slate-900/60 border border-slate-800 rounded-2xl" />
      </div>
    );
  }

  const { room, members, expenses, settlements, netBalances, simplifiedDebts, activityLogs } =
    roomData;

  const currentUserId = session?.user?.id || "";
  const myNetBalance = netBalances[currentUserId] || 0;
  const isOwed = myNetBalance > 0;
  const owes = myNetBalance < 0;

  return (
    <div className="space-y-6">
      {/* Room Header Banner */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 bg-slate-900/80 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/20">
              <Users2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-tight">{room.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-semibold border border-indigo-500/30">
                  {roomData.currentUserRole}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                {room.description || "Shared group for collaborative expenses and split settlements."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="py-2 px-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
              title="Copy Invite Code to share"
            >
              {copiedCode ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>Invite: {room.inviteCode}</span>
            </button>

            <button
              onClick={() => setIsSettleModalOpen(true)}
              className="py-2 px-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <HandCoins className="w-4 h-4 text-emerald-400" />
              <span>Settle Up</span>
            </button>

            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Shared Expense</span>
            </button>

            <button
              onClick={handleLeaveRoom}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800/80 transition-colors"
              title="Leave Room"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Financial Net Status Strip */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Your Net Position
            </span>
            <div className="mt-1">
              {isOwed ? (
                <div className="text-xl font-black text-emerald-400 flex items-center gap-1.5">
                  <TrendingUp className="w-5 h-5" />
                  <span>Owed {formatCurrency(myNetBalance, room.currency)}</span>
                </div>
              ) : owes ? (
                <div className="text-xl font-black text-rose-400 flex items-center gap-1.5">
                  <TrendingDown className="w-5 h-5" />
                  <span>You owe {formatCurrency(Math.abs(myNetBalance), room.currency)}</span>
                </div>
              ) : (
                <div className="text-xl font-bold text-slate-400">
                  All settled up (₹0.00)
                </div>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Room Expenses
            </span>
            <div className="text-xl font-black text-white mt-1">
              {formatCurrency(
                expenses.reduce((sum: number, e: any) => sum + e.amount, 0),
                room.currency
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Room Members ({members.length})
            </span>
            <div className="flex items-center gap-1.5 mt-2">
              {members.map((m: any) => (
                <div
                  key={m.userId._id}
                  title={`${m.userId.name} (${m.role})`}
                  className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold text-[10px] flex items-center justify-center"
                >
                  {m.userId.name ? m.userId.name.charAt(0).toUpperCase() : "U"}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        {[
          { key: "EXPENSES", label: `Expenses (${expenses.length})`, icon: Receipt },
          { key: "BALANCES", label: "Debt Matrix & Balances", icon: HandCoins },
          { key: "SETTLEMENTS", label: `Settlements (${settlements.length})`, icon: Clock },
          { key: "ACTIVITY", label: "Audit Timeline", icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Shared Expenses List */}
      {activeTab === "EXPENSES" && (
        <div className="space-y-4">
          {expenses.length === 0 ? (
            <div className="glass-card p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/60">
              <Receipt className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-white mb-1">No shared expenses recorded yet</h3>
              <p className="text-xs text-slate-400 mb-4">
                Add an expense to split it equally, by exact amount, percentage, or shares.
              </p>
              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
              >
                Add First Expense
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80 glass-card rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              {expenses.map((exp: any) => (
                <div key={exp._id} className="p-4 sm:p-5 hover:bg-slate-800/30 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20 mt-0.5">
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white leading-snug">{exp.title}</h4>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                          <span>{formatDate(exp.date, "dd MMM yyyy")}</span>
                          <span>•</span>
                          <span className="text-slate-300">
                            Paid by{" "}
                            <strong className="text-white">
                              {exp.payers.map((p: any) => p.userId?.name || "Member").join(", ")}
                            </strong>
                          </span>
                          <span>•</span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-300 font-semibold uppercase">
                            {exp.splitType} Split
                          </span>
                        </div>
                        {exp.notes && (
                          <p className="text-xs text-slate-500 italic mt-1.5">{exp.notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base font-black text-white">
                        {formatCurrency(exp.amount, room.currency)}
                      </div>
                    </div>
                  </div>

                  {/* Split breakdown participants pills */}
                  <div className="mt-3 pt-3 border-t border-slate-800/50 flex flex-wrap gap-2">
                    {exp.splits.map((s: any) => (
                      <span
                        key={s.userId?._id || Math.random()}
                        className="px-2 py-1 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1.5"
                      >
                        <span className="font-semibold text-slate-200">
                          {s.userId?.name?.split(" ")[0] || "Member"}:
                        </span>
                        <span className="text-emerald-400 font-medium">
                          {formatCurrency(s.amount, room.currency)}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Debt Matrix & Balances */}
      {activeTab === "BALANCES" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Member Net Balances */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
            <h3 className="text-sm font-bold text-white mb-3">Individual Member Balances</h3>
            <div className="divide-y divide-slate-800/80">
              {members.map((m: any) => {
                const uId = m.userId._id.toString();
                const bal = netBalances[uId] || 0;
                return (
                  <div key={uId} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
                        {m.userId.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{m.userId.name}</span>
                          {uId === currentUserId && (
                            <span className="text-[10px] text-emerald-400 font-semibold">(You)</span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">{m.role}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      {bal > 0 ? (
                        <span className="text-xs font-black text-emerald-400">
                          + {formatCurrency(bal, room.currency)}
                        </span>
                      ) : bal < 0 ? (
                        <span className="text-xs font-black text-rose-400">
                          - {formatCurrency(Math.abs(bal), room.currency)}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-500">Settled (0.00)</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Simplified Debts (Min-Cash-Flow Transitive Graph) */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Simplified Settlement Matrix</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Automated debt reduction minimizes total transactions needed to settle.
                </p>
              </div>
            </div>

            {simplifiedDebts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                All balances are perfectly settled! No outstanding payments.
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                {simplifiedDebts.map((debt: any, index: number) => {
                  const isCurrentDebtor = debt.fromUserId === currentUserId;
                  const isCurrentCreditor = debt.toUserId === currentUserId;

                  return (
                    <div
                      key={index}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                        isCurrentDebtor
                          ? "bg-rose-500/10 border-rose-500/30"
                          : isCurrentCreditor
                          ? "bg-emerald-500/10 border-emerald-500/30"
                          : "bg-slate-950/60 border-slate-800"
                      }`}
                    >
                      <div className="text-xs">
                        <span className="font-bold text-white">{debt.fromUserName}</span>
                        <span className="text-slate-400 mx-1.5">owes</span>
                        <span className="font-bold text-white">{debt.toUserName}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-white">
                          {formatCurrency(debt.amount, room.currency)}
                        </span>
                        {isCurrentDebtor && (
                          <button
                            onClick={() => {
                              setSettleToUser(debt.toUserId);
                              setSettleAmount((debt.amount / 100).toString());
                              setIsSettleModalOpen(true);
                            }}
                            className="py-1 px-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] transition-all"
                          >
                            Pay Now
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Settlements History */}
      {activeTab === "SETTLEMENTS" && (
        <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
          <h3 className="text-sm font-bold text-white mb-4">Recorded Settlements</h3>
          {settlements.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No settlements recorded in this room yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {settlements.map((st: any) => (
                <div key={st._id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-white">
                      {st.fromUserId?.name} paid {st.toUserId?.name}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {formatDate(st.date, "dd MMM yyyy")} • Method: {st.method}
                      {st.notes && ` • "${st.notes}"`}
                    </p>
                  </div>
                  <span className="font-black text-emerald-400 text-sm">
                    {formatCurrency(st.amount, room.currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Audit & Activity Log */}
      {activeTab === "ACTIVITY" && (
        <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
          <h3 className="text-sm font-bold text-white mb-4">Room Activity History</h3>
          <div className="space-y-3">
            {activityLogs.map((log: any) => (
              <div key={log._id} className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 flex items-start gap-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-slate-200">
                    <strong className="text-white">{log.userId?.name || "Member"}</strong>{" "}
                    {log.action.replace("_", " ").toLowerCase()}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {formatDate(log.createdAt, "dd MMM yyyy, hh:mm a")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Shared Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg glass-card p-6 rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <h3 className="text-base font-bold text-white">Add Shared Expense</h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4 mt-4 overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Expense Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Seafood Dinner, Beach Villa, Groceries"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Total Amount (₹)</label>
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
                  <label className="block text-xs font-medium text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              {/* Split Type Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Split Type</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["EQUAL", "EXACT", "PERCENTAGE", "SHARES"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSplitType(st)}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all ${
                        splitType === st
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                          : "bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Splits configuration */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-300 block mb-1">
                  Split Configuration ({splitType})
                </span>
                {members.map((m: any, index: number) => (
                  <div key={m.userId._id} className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-slate-300 truncate">{m.userId.name}</span>
                    <div className="w-28 shrink-0">
                      {splitType === "EQUAL" && (
                        <span className="text-emerald-400 font-medium text-[11px]">
                          {amount ? formatCurrency(Math.floor((Number(amount) * 100) / members.length), room.currency) : "1 share"}
                        </span>
                      )}
                      {splitType === "EXACT" && (
                        <input
                          type="number"
                          step="any"
                          placeholder="Amount ₹"
                          value={splits[index]?.amount || ""}
                          onChange={(e) => {
                            const newSplits = [...splits];
                            newSplits[index] = { ...newSplits[index], amount: e.target.value };
                            setSplits(newSplits);
                          }}
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white text-xs"
                        />
                      )}
                      {splitType === "PERCENTAGE" && (
                        <div className="relative">
                          <input
                            type="number"
                            placeholder="%"
                            value={splits[index]?.percentage || ""}
                            onChange={(e) => {
                              const newSplits = [...splits];
                              newSplits[index] = { ...newSplits[index], percentage: e.target.value };
                              setSplits(newSplits);
                            }}
                            className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white text-xs pr-5"
                          />
                          <span className="absolute right-2 top-1 text-slate-500">%</span>
                        </div>
                      )}
                      {splitType === "SHARES" && (
                        <input
                          type="number"
                          placeholder="Shares (e.g. 1, 2)"
                          value={splits[index]?.shares || "1"}
                          onChange={(e) => {
                            const newSplits = [...splits];
                            newSplits[index] = { ...newSplits[index], shares: e.target.value };
                            setSplits(newSplits);
                          }}
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white text-xs"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Notes / Location (Optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Thalassa Restaurant, Bill #4928"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="py-2 px-4 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Calculating & Saving..." : "Record Shared Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Up Modal */}
      {isSettleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm glass-card p-6 rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Record Settlement</h3>
              <button onClick={() => setIsSettleModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordSettlement} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Pay To</label>
                <select
                  value={settleToUser}
                  onChange={(e) => setSettleToUser(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs"
                >
                  {members
                    .filter((m: any) => m.userId._id !== currentUserId)
                    .map((m: any) => (
                      <option key={m.userId._id} value={m.userId._id}>
                        {m.userId.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Settlement Amount (₹)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-base font-bold"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Payment Method</label>
                <select
                  value={settleMethod}
                  onChange={(e) => setSettleMethod(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs"
                >
                  <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                  <option value="CASH">Cash in Hand</option>
                  <option value="BANK_TRANSFER">Bank IMPS / NEFT Transfer</option>
                  <option value="CARD">Debit / Credit Card</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Reference / Note (Optional)</label>
                <input
                  type="text"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  placeholder="e.g. Paid via UPI Txn #8291"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSettleModalOpen(false)}
                  className="py-2 px-4 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Recording..." : "Confirm Settlement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
