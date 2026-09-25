"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import {
  Users2,
  Plus,
  KeyRound,
  Shield,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  X,
  Copy,
  Check,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useSession } from "next-auth/react";

export default function RoomsPage() {
  const { data: session } = useSession();
  const { success: toastSuccess, error: toastError } = useToast();

  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  // Form states
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDesc, setNewRoomDesc] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/rooms");
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) {
      toastError("Room name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRoomName.trim(),
          description: newRoomDesc.trim(),
          currency: session?.user?.defaultCurrency || "INR",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toastError(data.error || "Failed to create room");
      } else {
        toastSuccess(`Room "${newRoomName}" created!`);
        setIsCreateModalOpen(false);
        setNewRoomName("");
        setNewRoomDesc("");
        fetchRooms();
      }
    } catch {
      toastError("Network error creating room");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      toastError("Please enter an invite code");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: joinCode.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        toastError(data.error || "Invalid invite code");
      } else {
        toastSuccess(data.message || "Joined room successfully!");
        setIsJoinModalOpen(false);
        setJoinCode("");
        fetchRooms();
      }
    } catch {
      toastError("Network error joining room");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toastSuccess(`Invite code ${code} copied to clipboard!`);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const currency = session?.user?.defaultCurrency || "INR";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Shared Expense Rooms</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Collaborate on group expenses, trips, flatmate bills, and automated debt settlement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsJoinModalOpen(true)}
            className="py-2 px-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
            <span>Join with Code</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Room</span>
          </button>
        </div>
      </div>

      {/* Rooms Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-slate-900/60 border border-slate-800" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-3xl border border-slate-800 bg-slate-900/40">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
            <Users2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">No Shared Rooms Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
            Track expenses together with roommates, friends on vacation, or office lunch groups.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setIsJoinModalOpen(true)}
              className="py-2 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300"
            >
              Join with Code
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
            >
              Create New Room
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rooms.map((room) => {
            const net = room.userNetBalance || 0;
            const isOwed = net > 0;
            const owes = net < 0;

            return (
              <div
                key={room._id}
                className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/70 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                        <Users2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white leading-tight">
                          {room.name}
                        </h3>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Shield className="w-3 h-3 text-slate-500" />
                          <span>{room.userRole}</span>
                          <span>•</span>
                          <span>{room.memberCount} members</span>
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCopyCode(room.inviteCode)}
                      title="Copy Room Invite Code"
                      className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-[11px]"
                    >
                      {copiedCode === room.inviteCode ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span className="font-mono">{room.inviteCode}</span>
                    </button>
                  </div>

                  {room.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 mt-2 mb-4">
                      {room.description}
                    </p>
                  )}

                  {/* Net Position Badge */}
                  <div className="my-4 p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">Your Balance:</span>
                    <div className="text-right">
                      {isOwed ? (
                        <div className="text-xs font-black text-emerald-400 flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>Owed {formatCurrency(net, room.currency || currency)}</span>
                        </div>
                      ) : owes ? (
                        <div className="text-xs font-black text-rose-400 flex items-center gap-1">
                          <TrendingDown className="w-3.5 h-3.5" />
                          <span>You owe {formatCurrency(Math.abs(net), room.currency || currency)}</span>
                        </div>
                      ) : (
                        <div className="text-xs font-bold text-slate-400">
                          All settled up
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end">
                  <Link
                    href={`/rooms/${room._id}`}
                    className="py-1.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all group"
                  >
                    <span>Open Room</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Room Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md glass-card p-6 rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Create Shared Room</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Room Name
                </label>
                <input
                  type="text"
                  required
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. Goa Beach Trip 2026, Flat 402, Office Lunch"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Description / Purpose (Optional)
                </label>
                <textarea
                  rows={2}
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  placeholder="e.g. Shared expenses for hotel villa, food bills, and vehicle rental."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="py-2 px-4 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Room"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Room Modal */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm glass-card p-6 rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Join Room</h3>
              <button
                onClick={() => setIsJoinModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleJoinRoom} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  8-Character Invite Code
                </label>
                <input
                  type="text"
                  required
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. GOATRIP1"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white font-mono text-center text-sm font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500/50 uppercase"
                  autoFocus
                  maxLength={12}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsJoinModalOpen(false)}
                  className="py-2 px-4 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Joining..." : "Join Room"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
