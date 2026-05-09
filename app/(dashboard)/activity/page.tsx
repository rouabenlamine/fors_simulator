"use client";

import { useState, useMemo, useEffect } from "react";
import { getActivities } from "@/app/actions";
import { getMyRoleAction } from "@/app/actions/admin-actions";
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
    return `${user} started a FORS Agent chat session${ticket ? ` regarding ${ticket}` : ""}`;
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
  const [myRole, setMyRole] = useState<string>("");

  useEffect(() => {
    setLoading(true);
    Promise.all([getActivities(), getMyRoleAction()])
      .catch(() => [[], ""])
      .then(([data, role]) => {
        setAllActivities(data as ActivityLog[]);
        setMyRole(role as string);
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
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">
                Team <span className="text-indigo-500">Activity</span>
              </h1>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                Real-time system interactions, AI diagnostics &amp; resolutions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl shrink-0">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">Live</span>
            <span className="text-[10px] font-bold text-emerald-600 ml-1">{logs.length} entries</span>
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
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-150 ${filter === key
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
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
                    className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 cursor-pointer relative overflow-hidden group/card"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* Icon */}
                      <div className={`w-11 h-11 rounded-xl ${style.bg} flex items-center justify-center shrink-0 group-hover/card:scale-105 transition-transform duration-200`}>
                        {style.icon}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-slate-800 leading-snug group-hover/card:text-indigo-700 transition-colors">{sentence}</p>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wide ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-semibold">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className="flex items-center gap-1 text-indigo-500">
                            <User className="w-3 h-3" />
                            {log.performedBy}
                          </span>
                        </div>
                      </div>

                      {/* Ticket badge */}
                      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-100">
                          <Ticket className="w-3 h-3" />
                          <span className="text-[10px] font-black">#{log.ticketId || "SYS"}</span>
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 px-6 py-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${getActionStyle(selectedLog.action).bg} flex items-center justify-center shrink-0`}>
                  {getActionStyle(selectedLog.action).icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[9px] font-black text-indigo-200 uppercase tracking-widest">Audit Entry</span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wide ${getStatusBadge(selectedLog.action).color}`}>
                      {getStatusBadge(selectedLog.action).label}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-white leading-snug">{toHumanSentence(selectedLog)}</h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-9 h-9 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center justify-center transition-colors border border-white/10 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content — Human readable, zero JSON */}
            <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
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

              {selectedLog.ticketId && myRole !== "it_manager" && (
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
