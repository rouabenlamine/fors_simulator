import Link from "next/link";
import { getTickets } from "@/app/actions";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/constants";
import { ExternalLink, Bot, TrendingUp, Users, FlaskConical } from "lucide-react";

const confidenceColor = (c: number) =>
  c >= 90 ? "#22c55e" : c >= 75 ? "#3b82f6" : c >= 60 ? "#f97316" : "#ef4444";

export default async function AnalysisPage() {
  const allTickets = await getTickets();
  const analyzedTickets = allTickets.filter(
    (t) => t.status === "sql_proposed" || t.status === "pending" || t.status === "analysis_pending"
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center shadow-xl shadow-blue-200/50">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Analysis Workspace</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">AI Agent analysis results for all active tickets</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {analyzedTickets.map((ticket, idx) => {
          const color = confidenceColor(ticket.aiConfidence ?? 80);
          return (
            <div
              key={ticket.id}
              className="bg-white/80 backdrop-blur-xl rounded-[1.5rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(79,70,229,0.15)] hover:-translate-y-1 transition-all duration-300 overflow-hidden group relative animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${(idx % 10) * 50}ms` }}
            >
              {/* Subtle background glow on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500" style={{ background: `linear-gradient(to right, ${color}, transparent)` }} />

              <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
                <div className="flex-1 space-y-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black font-mono text-slate-500 bg-slate-100/80 px-2 py-1 rounded-md border border-slate-200/60 shadow-sm">
                      #{ticket.id}
                    </span>
                    <span className={`text-[10px] px-2.5 py-1 rounded-lg font-black uppercase tracking-widest shadow-sm ${STATUS_COLORS[ticket.status]}`}>
                      {STATUS_LABELS[ticket.status]}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">{ticket.title}</h3>
                    <p className="text-[13px] font-medium text-slate-500 leading-relaxed line-clamp-2">{ticket.description}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 pt-2">
                    {/* Confidence */}
                    <div className="flex items-center gap-3 bg-slate-50/80 px-3 py-1.5 rounded-xl border border-slate-100">
                      <div className="w-24 h-2 bg-slate-200/60 rounded-full overflow-hidden shadow-inner">
                        <div className="h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(255,255,255,0.5)]" style={{ width: `${ticket.aiConfidence}%`, backgroundColor: color }} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-black tracking-widest" style={{ color }}>
                          {ticket.aiConfidence}%
                        </span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Confidence</span>
                      </div>
                    </div>

                    {/* Team */}
                    <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center border border-slate-200 shadow-sm">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      {ticket.team}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
                  <Link href={`/tickets/${ticket.id}`} className="w-full sm:w-auto">
                    <button 
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-black text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 group-hover:shadow-indigo-500/25"
                      style={{ background: `linear-gradient(135deg, ${color}, #4f46e5)` }}
                    >
                      <span>Open Diagnostics</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              </div>
              
              {/* Bottom progress accent */}
              <div className="h-1.5 opacity-90 transition-all duration-500 group-hover:h-2" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
