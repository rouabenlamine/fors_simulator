"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getTickets } from "@/app/actions";
import { STATUS_LABELS } from "@/lib/constants";
import { ExternalLink, Bot, Users, Sparkles, Search, Filter, X } from "lucide-react";
import { clsx } from "clsx";
import type { Ticket } from "@/lib/types";

const STATUS_PASTEL: Record<string, { bg: string; text: string; ring: string }> = {
  pending:          { bg: "bg-amber-50",  text: "text-amber-700",  ring: "ring-amber-200"  },
  analysis_pending: { bg: "bg-indigo-50", text: "text-indigo-700", ring: "ring-indigo-200" },
  sql_proposed:     { bg: "bg-sky-50",    text: "text-sky-700",    ring: "ring-sky-200"    },
  validated:        { bg: "bg-emerald-50",text: "text-emerald-700",ring: "ring-emerald-200"},
  rejected:         { bg: "bg-rose-50",   text: "text-rose-700",   ring: "ring-rose-200"   },
  closed:           { bg: "bg-green-50",  text: "text-green-700",  ring: "ring-green-200"  },
  canceled:         { bg: "bg-slate-100", text: "text-slate-500",  ring: "ring-slate-200"  },
};

function confidencePastel(c: number) {
  if (c >= 90) return { bar: "bg-emerald-400", text: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-200" };
  if (c >= 75) return { bar: "bg-indigo-400",  text: "text-indigo-600",  bg: "bg-indigo-50",  ring: "ring-indigo-200"  };
  if (c >= 60) return { bar: "bg-amber-400",   text: "text-amber-600",   bg: "bg-amber-50",   ring: "ring-amber-200"   };
  return             { bar: "bg-rose-400",    text: "text-rose-600",    bg: "bg-rose-50",    ring: "ring-rose-200"    };
}

export default function AnalysisPage() {
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getTickets();
      setAllTickets(data);
      setLoading(false);
    }
    load();
  }, []);

  const analyzedTickets = allTickets.filter(
    (t) => t.status === "sql_proposed" || t.status === "pending" || t.status === "analysis_pending"
  );

  const filtered = analyzedTickets.filter((t) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      t.id.toLowerCase().includes(s) ||
      t.title.toLowerCase().includes(s) ||
      t.team.toLowerCase().includes(s)
    );
  });

  return (
    <div className="p-4 sm:p-5 max-w-5xl mx-auto space-y-4">

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-800 tracking-tight">
              Analysis <span className="text-indigo-500">Workspace</span>
            </h1>
            <p className="text-[10px] font-medium text-slate-400">
              High-density AI diagnostic monitoring
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter anything..."
              className="bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all w-48 shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
              {filtered.length}
            </span>
          </div>
        </div>
      </div>

      {/* ── KPI Strip (Compacted) ─────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-indigo-50/50 rounded-xl px-4 py-3 border border-indigo-100">
          <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest leading-none mb-1">Analysis Queue</p>
          <p className="text-xl font-black text-indigo-700">
            {allTickets.filter(t => t.status === "analysis_pending").length}
          </p>
        </div>
        <div className="bg-amber-50/50 rounded-xl px-4 py-3 border border-amber-100">
          <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest leading-none mb-1">Standard Pending</p>
          <p className="text-xl font-black text-amber-700">
            {allTickets.filter(t => t.status === "pending").length}
          </p>
        </div>
      </div>

      {/* ── Ticket Cards Grid (Reference-Inspired) ──────────────── */}
      <div className="min-h-[500px]">
        {loading ? (
           <div className="py-20 flex flex-col items-center gap-3">
             <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing Workspace...</p>
           </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/40 py-16 flex flex-col items-center gap-2 shadow-sm">
            <Sparkles className="w-6 h-6 text-slate-200" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">No active diagnostics</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {filtered.map((ticket) => {
              const conf = confidencePastel(ticket.aiConfidence ?? 75);
              const statusStyle = STATUS_PASTEL[ticket.status] ?? { bg: "bg-slate-100", text: "text-slate-500", ring: "ring-slate-200" };
              
              return (
                <div
                  key={ticket.id}
                  className={clsx(
                    "group relative backdrop-blur-xl rounded-[22px] border transition-all duration-500 overflow-hidden flex flex-col text-center shadow-lg",
                    conf.bg, conf.ring.replace('ring-', 'border-')
                  )}
                >
                  <div className="p-4 flex flex-col items-center flex-1 relative z-10">
                    {/* Top Icon / ID Section */}
                    <div className="flex flex-col items-center gap-1.5 mb-3">
                       <div className={clsx("w-9 h-9 rounded-full flex items-center justify-center shadow-inner bg-white/60")}>
                         <Bot className={clsx("w-4.5 h-4.5", conf.text)} />
                       </div>
                       <div className="flex flex-col items-center">
                         <span className="font-mono text-[8px] font-black opacity-60 uppercase tracking-widest text-slate-900">
                           {ticket.id}
                         </span>
                         <span className={clsx("text-[8px] font-black uppercase px-2 py-0.5 rounded-full mt-0.5", statusStyle.bg, statusStyle.text, "shadow-sm border border-white/50")}>
                           {STATUS_LABELS[ticket.status]}
                         </span>
                       </div>
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-1.5 mb-4">
                      <h3 className="text-[12px] font-black text-slate-900 leading-tight line-clamp-2">
                        {ticket.title}
                      </h3>
                      <p className="text-[9px] text-slate-500 font-bold line-clamp-2 leading-tight opacity-70">
                        {ticket.description || "Diagnostic synthesis active..."}
                      </p>
                    </div>

                    {/* Confidence Pill */}
                    <div className={clsx("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/60 border border-white/80 mb-3")}>
                       <div className={clsx("w-1.5 h-1.5 rounded-full animate-pulse", conf.bar)} />
                       <span className={clsx("text-[9px] font-black uppercase tracking-tight", conf.text)}>
                         {ticket.aiConfidence ?? "75"}% Conf.
                       </span>
                    </div>
                  </div>

                  {/* Integrated Action Footer */}
                  <div className="px-4 pb-4 mt-auto relative z-10">
                    <Link href={`/tickets/${ticket.id}`} className="block">
                      <button className={clsx(
                        "w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-md group-hover:scale-[1.05] active:scale-95",
                        conf.bar.replace('bg-', 'bg-') // Uses the confidence color for the button
                      )}>
                        Open
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const RefreshCw = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
);
