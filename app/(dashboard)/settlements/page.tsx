"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { HandCoins, ArrowRight, CheckCircle2, Users2 } from "lucide-react";
import { useSession } from "next-auth/react";

export default function SettlementsPage() {
  const { data: session } = useSession();
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/rooms")
      .then((r) => r.json())
      .then((data) => setRooms(data.rooms || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const currency = session?.user?.defaultCurrency || "INR";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Settlements Hub</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Clear balances, review peer settlement histories, and simplify communal debts.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 rounded-2xl bg-slate-900/60 animate-pulse border border-slate-800" />
      ) : rooms.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/60">
          <HandCoins className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white mb-1">No Active Rooms</h3>
          <p className="text-xs text-slate-400 mb-4">
            Join or create a shared room to track and settle communal debts.
          </p>
          <Link
            href="/rooms"
            className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
          >
            Go to Shared Rooms
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rooms.map((room) => {
              const net = room.userNetBalance || 0;
              const isOwed = net > 0;
              const owes = net < 0;

              return (
                <div
                  key={room._id}
                  className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
                      <Users2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{room.name}</h4>
                      <p className="text-[11px] text-slate-400">
                        {isOwed ? (
                          <span className="text-emerald-400 font-semibold">
                            You are owed {formatCurrency(net, room.currency || currency)}
                          </span>
                        ) : owes ? (
                          <span className="text-rose-400 font-semibold">
                            You owe {formatCurrency(Math.abs(net), room.currency || currency)}
                          </span>
                        ) : (
                          <span className="text-slate-400">All settled up</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/rooms/${room._id}`}
                    className="py-1.5 px-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <span>Settle in Room</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
