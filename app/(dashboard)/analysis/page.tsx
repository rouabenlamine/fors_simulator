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
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-sm">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Analysis Workspace</h2>
          <p className="text-sm text-slate-400">AI Agent analysis results for all active tickets</p>
        </div>
      </div>

      <div className="grid gap-4">
        {analyzedTickets.map((ticket) => {
          const color = confidenceColor(ticket.aiConfidence ?? 80);
          return (
            <div
              key={ticket.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              {/* Top accent bar */}
              <div className="h-1" style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }} />

              <div className="p-5 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">#{ticket.id}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[ticket.status]}`}>
                      {STATUS_LABELS[ticket.status]}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 mb-1">{ticket.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{ticket.description.slice(0, 120)}…</p>

                  <div className="flex items-center gap-5 mt-3">
                    {/* Confidence */}
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${ticket.aiConfidence}%`, backgroundColor: color }} />
                      </div>
                      <span className="text-xs font-bold" style={{ color }}>
                        {ticket.aiConfidence}%
                      </span>
                      <span className="text-[10px] text-slate-400">AI Confidence</span>
                    </div>

                    {/* Team */}
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Users className="w-3 h-3 text-slate-400" />
                      {ticket.team}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Link href={`/tickets/${ticket.id}`}>
                    <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:scale-105 shadow-sm"
                      style={{ background: `linear-gradient(135deg, #9937d6ff, #9710f1ff)` }}>
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
