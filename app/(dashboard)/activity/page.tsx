"use client";

import { useState, useMemo, useEffect } from "react";
import { getActivities } from "@/app/actions";
import type { ActivityLog } from "@/lib/types";
import { CheckCircle, XCircle, MessageSquare, Bot, ArrowUpRight, Clock, Search, Filter, Database, Shield, Zap, Info, Ticket, X, ExternalLink, User, Activity } from "lucide-react";
import { useViewPermissions } from "@/contexts/ViewPermissionsContext";
import { translateJsonToNarratives } from "@/lib/translation";

type ActionFilter = "all" | "ai" | "chat" | "other";

const FILTERS: { key: ActionFilter; label: string; icon: React.ElementType }[] = [
  { key: "all", label: "All Activity", icon: ActivityIcon },
  { key: "ai", label: "AI Actions", icon: Bot },
  { key: "chat", label: "Team Chat", icon: MessageSquare },
  { key: "other", label: "System", icon: SettingsIcon },
];

function ActivityIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function SettingsIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function getActionFilter(action: string): ActionFilter {
  const a = action.toLowerCase();
  if (a.includes("sql")) return "ai";
  if (a.includes("ai") || a.includes("gost")) return "ai";
  if (a.includes("chat") || a.includes("message")) return "chat";
  return "other";
}

/* ── Human-readable sentence builder ─────────────────────────────────────── */
function toHumanSentence(log: ActivityLog): string {
  const user = log.performedBy || "System";
  const a = log.action.toLowerCase();
  const ticket = log.ticketId ? `ticket #${log.ticketId}` : "";

  if (a.includes("approved sql") || a.includes("validated sql"))
    return `${user} approved the proposed SQL fix${ticket ? ` for ${ticket}` : ""}`;
  if (a.includes("rejected sql") || a.includes("rejected"))
    return `${user} rejected the proposed resolution${ticket ? ` for ${ticket}` : ""}`;
  if (a.includes("sql") && a.includes("proposed"))
    return `An AI-generated SQL fix was proposed${ticket ? ` for ${ticket}` : ""}`;
  if (a.includes("ai") && a.includes("analysis"))
    return `${user} triggered an AI analysis${ticket ? ` on ${ticket}` : ""}`;
  if (a.includes("gost") || (a.includes("ai") && a.includes("chat")))
    return `${user} started a GHOST AI chat session${ticket ? ` regarding ${ticket}` : ""}`;
  if (a.includes("chat") || a.includes("message"))
    return `${user} sent a team message${ticket ? ` on ${ticket}` : ""}`;
  if (a.includes("login"))
    return `${user} signed into the system`;
  if (a.includes("logout"))
    return `${user} signed out of the system`;
  if (a.includes("created") || a.includes("opened"))
    return `${user} created ${ticket || "a new entry"}`;
  if (a.includes("updated") || a.includes("modified"))
    return `${user} updated ${ticket || "a record"}`;
  if (a.includes("closed") || a.includes("resolved"))
    return `${user} resolved ${ticket || "an incident"}`;

  // Fallback — convert action slug to readable text
  const readable = log.action.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  return `${user} performed "${readable}"${ticket ? ` on ${ticket}` : ""}`;
}

function getStatusBadge(action: string): { label: string; color: string } {
  const a = action.toLowerCase();
  if (a.includes("rejected") || a.includes("failed") || a.includes("error"))
    return { label: "Failed", color: "bg-rose-500 text-white" };
  if (a.includes("approved") || a.includes("validated") || a.includes("resolved") || a.includes("closed"))
    return { label: "Success", color: "bg-emerald-500 text-white" };
  if (a.includes("pending") || a.includes("proposed"))
    return { label: "Pending", color: "bg-amber-500 text-white" };
  return { label: "Info", color: "bg-slate-500 text-white" };
}

function getActionStyle(action: string): {
  icon: React.ReactNode; bg: string; border: string; text: string; glow: string; color: string;
} {
  const a = action.toLowerCase();

  if (a.includes("sql")) return {
    icon: <Database className="w-4 h-4 text-white" />,
    bg: "bg-teal-500", border: "border-teal-200", text: "text-teal-700", glow: "shadow-teal-100", color: "teal"
  };
  if (a.includes("approved") || a.includes("validated")) return {
    icon: <CheckCircle className="w-4 h-4 text-white" />,
    bg: "bg-emerald-500", border: "border-emerald-200", text: "text-emerald-700", glow: "shadow-emerald-100", color: "emerald"
  };
  if (a.includes("rejected")) return {
    icon: <XCircle className="w-4 h-4 text-white" />,
    bg: "bg-rose-500", border: "border-rose-200", text: "text-rose-700", glow: "shadow-rose-100", color: "rose"
  };
  if (a.includes("ai") || a.includes("gost")) return {
    icon: <Zap className="w-4 h-4 text-white" />,
    bg: "bg-blue-500", border: "border-blue-200", text: "text-blue-700", glow: "shadow-blue-100", color: "blue"
  };
  if (a.includes("chat") || a.includes("message")) return {
    icon: <MessageSquare className="w-4 h-4 text-white" />,
    bg: "bg-violet-500", border: "border-violet-200", text: "text-violet-700", glow: "shadow-violet-100", color: "violet"
  };

  return {
    icon: <Info className="w-4 h-4 text-white" />,
    bg: "bg-indigo-500", border: "border-indigo-200", text: "text-indigo-700", glow: "shadow-indigo-100", color: "indigo"
  };
}

export default function ActivityPage() {
  const { permissions } = useViewPermissions();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ActionFilter>("all");
  const [allActivities, setAllActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  useEffect(() => {
    setLoading(true);
    getActivities()
      .catch(() => [])
      .then((data) => {
        setAllActivities(data);
        setLoading(false);
      });
  }, []);

  if (permissions && permissions.activity_logs === false) {
    return null;
  }

  const logs = useMemo(() => {
    let result = [...allActivities];
    if (filter !== "all") result = result.filter((l) => getActionFilter(l.action) === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) => l.action.toLowerCase().includes(q) || l.ticketId.includes(q) || l.performedBy.toLowerCase().includes(q)
      );
    }
    return result;
  }, [search, filter, allActivities]);

  return (
    <div className="min-h-screen bg-transparent">
      <div className="p-8 max-w-5xl mx-auto space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center">
                <Activity className="w-7 h-7 text-indigo-600" />
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Team Activity</h2>
            </div>
            <p className="text-slate-500 text-sm pl-15 max-w-xl">
              Track real-time system interactions, AI diagnostics, and team resolutions across the FORS network.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm shrink-0">
            <div className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-emerald-600 bg-emerald-50 rounded-xl">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              LIVE MONITORING
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pr-2">
              {logs.length} Entries Found
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-5 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ticket, user, or action..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>

          <div className="lg:col-span-7 flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
            {FILTERS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${filter === key
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-[1.02]"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
              >
                <Icon className={`w-3.5 h-3.5 ${filter === key ? "text-white" : "text-slate-400"}`} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline / Log List */}
        <div className="space-y-4 relative">
          {/* Vertical line for timeline look */}
          <div className="absolute left-10 top-0 bottom-0 w-[2px] bg-gradient-to-b from-indigo-500/0 via-indigo-500/20 to-indigo-500/0 hidden md:block" />
          <div className="absolute left-[39px] top-0 bottom-0 w-[4px] bg-indigo-500/10 blur-sm hidden md:block" />

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm font-medium text-slate-400">Syncing audit logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 py-24 flex flex-col items-center justify-center text-center px-6">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">No matching logs found</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-xs">
                We couldn&apos;t find any activity matching your current search or filter criteria.
              </p>
              <button
                onClick={() => { setSearch(""); setFilter("all"); }}
                className="mt-6 px-6 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            logs.map((log, idx) => {
              const style = getActionStyle(log.action);
              const sentence = toHumanSentence(log);
              const badge = getStatusBadge(log.action);
              return (
                <div
                  key={log.id}
                  className="group relative flex items-start gap-6 md:pl-6 animate-in fade-in slide-in-from-bottom-4 duration-300"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  {/* Timeline point */}
                  <div className="hidden md:flex shrink-0 w-8 h-8 rounded-full bg-white border-4 border-slate-100 z-10 items-center justify-center mt-6 shadow-xl group-hover:border-indigo-500 group-hover:scale-125 transition-all duration-500">
                    <div className={`w-2 h-2 rounded-full ${style.bg} animate-pulse`} />
                  </div>

                  <div
                    onClick={() => setSelectedLog(log)}
                    className="flex-1 bg-white/80 backdrop-blur-xl rounded-[2.2rem] border border-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(79,70,229,0.15)] hover:-translate-y-2 transition-all duration-500 cursor-pointer relative overflow-hidden"
                  >
                    {/* Subtle Action Glow */}
                    <div className={`absolute -right-10 -top-10 w-32 h-32 ${style.bg} opacity-0 group-hover:opacity-10 rounded-full blur-3xl transition-opacity duration-700`} />

                    <div className="flex flex-col sm:flex-row sm:items-center gap-5 relative z-10">
                      {/* Icon & Action */}
                      <div className={`w-14 h-14 rounded-2xl ${style.bg} flex items-center justify-center shrink-0 shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                        {style.icon}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-3 flex-wrap">
                          {/* Human-readable sentence instead of raw action */}
                          <p className="text-[15px] font-bold text-slate-800 tracking-tight leading-snug">{sentence}</p>
                          {/* Status badge */}
                          <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-400 font-bold">
                          <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </span>
                          <span className="flex items-center gap-1.5 text-indigo-500/80">
                            <User className="w-3.5 h-3.5" />
                            {log.performedBy}
                          </span>
                        </div>
                      </div>

                      {/* Ticket Badge */}
                      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-2 shrink-0">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-200 group-hover:bg-indigo-600 transition-colors">
                          <Ticket className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-black tracking-tighter">#{log.ticketId || "SYSTEM"}</span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pr-1">
                          {new Date(log.timestamp).toLocaleDateString([], { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="py-10 text-center">
          <p className="text-xs text-slate-400 font-medium flex items-center justify-center gap-2">
            <Shield className="w-3 h-3" />
            FORS Secure Audit Infrastructure &bull; End-to-End Encryption Enabled
          </p>
        </div>
      </div>

      {/* Log Detail Modal — Zero JSON, human-readable */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative h-32 bg-gradient-to-br from-slate-900 to-indigo-950 p-8 flex items-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-8 h-8 rounded-lg ${getActionStyle(selectedLog.action).bg} flex items-center justify-center shadow-lg`}>
                    {getActionStyle(selectedLog.action).icon}
                  </div>
                  <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Audit Entry Details</span>
                  {/* Status badge in header */}
                  <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${getStatusBadge(selectedLog.action).color}`}>
                    {getStatusBadge(selectedLog.action).label}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white tracking-tight">{toHumanSentence(selectedLog)}</h3>
              </div>
            </div>

            {/* Modal Content — Human readable, zero JSON */}
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Incident Number</p>
                  <p className="text-sm font-black text-indigo-600 flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5" />
                    #{selectedLog.ticketId || "System Global"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Performed By</p>
                  <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {selectedLog.performedBy}
                  </p>
                </div>
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Timestamp</p>
                  <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Human-Readable Details — NO JSON */}
              {selectedLog.details && (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Event Details</p>
                  <div className="space-y-2">
                    {translateJsonToNarratives(selectedLog.details, { performedBy: selectedLog.performedBy, defaultAction: selectedLog.action }).map((item, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                          <span className="text-xs font-black text-indigo-500">{item.title.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.title}</p>
                          <p className="text-sm font-bold text-slate-800 mt-0.5 leading-relaxed">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedLog.ticketId && (
                <div className="pt-4 flex justify-end">
                  <a
                    href={`/tickets/${selectedLog.ticketId}`}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-100"
                  >
                    View Associated Incident
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
