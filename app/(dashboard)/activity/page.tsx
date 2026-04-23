"use client";

import { useState, useMemo, useEffect } from "react";
import { getActivities } from "@/app/actions";
import type { ActivityLog } from "@/lib/types";
import { CheckCircle, XCircle, MessageSquare, Bot, ArrowUpRight, Clock, Search, Download, Filter, Database } from "lucide-react";
import { useViewPermissions } from "@/contexts/ViewPermissionsContext";

type ActionFilter = "all" | "approved" | "rejected" | "ai" | "chat" | "other";

const FILTERS: { key: ActionFilter; label: string }[] = [
  { key: "all",      label: "All" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "ai",       label: "AI" },
  { key: "chat",     label: "Chat" },
  { key: "other",    label: "Other" },
];

function getActionFilter(action: string): ActionFilter {
  const a = action.toLowerCase();
  if (a.includes("approved") || a.includes("validated")) return "approved";
  if (a.includes("rejected")) return "rejected";
  if (a.includes("sql")) return "ai"; // Mapping SQL as technical AI action
  if (a.includes("ai") || a.includes("gost")) return "ai";
  if (a.includes("chat") || a.includes("message")) return "chat";
  return "other";
}

function getActionStyle(action: string): {
  icon: React.ReactNode; bg: string; badge: string; badgeText: string;
} {
  const f = getActionFilter(action);
  const a = action.toLowerCase();

  if (a.includes("sql")) return { icon: <Database className="w-4 h-4 text-white" />, bg: "bg-teal-600 shadow-[0_0_10px_rgba(13,148,136,0.3)]", badge: "bg-teal-50 border border-teal-200/50", badgeText: "text-teal-700" };
  
  if (f === "approved") return { icon: <CheckCircle className="w-4 h-4 text-white" />, bg: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]",  badge: "bg-emerald-50 border border-emerald-200/50",   badgeText: "text-emerald-700"  };
  if (f === "rejected") return { icon: <XCircle      className="w-4 h-4 text-white" />, bg: "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]",    badge: "bg-rose-50 border border-rose-200/50",       badgeText: "text-rose-700"    };
  if (f === "ai")       return { icon: <Bot          className="w-4 h-4 text-white" />, bg: "bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]",   badge: "bg-blue-50 border border-blue-200/50",     badgeText: "text-blue-700"   };
  if (f === "chat")     return { icon: <MessageSquare className="w-4 h-4 text-white" />, bg: "bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.3)]", badge: "bg-violet-50 border border-violet-200/50", badgeText: "text-violet-700" };
  return               { icon: <ArrowUpRight  className="w-4 h-4 text-white" />, bg: "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]",  badge: "bg-amber-50 border border-amber-200/50",   badgeText: "text-amber-700"  };
}

function badgeLabel(action: string): string {
  const a = action.toLowerCase();
  if (a.includes("sql")) return "SQL Exec";
  const f = getActionFilter(action);
  if (f === "approved") return "Approved";
  if (f === "rejected") return "Rejected";
  if (f === "ai")       return "AI";
  if (f === "chat")     return "Chat";
  return "Action";
}

function escapeCSV(v: unknown) {
  const s = String(v ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function ActivityPage() {
  const { permissions } = useViewPermissions();
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState<ActionFilter>("all");
  const [toast, setToast]       = useState<string | null>(null);
  const [allActivities, setAllActivities] = useState<ActivityLog[]>([]);

  useEffect(() => {
    getActivities().catch(() => []).then(setAllActivities);
  }, []);

  if (permissions && permissions.activity_logs === false) {
    return null;
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
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
  }, [search, filter]);

  function exportCSV() {
    const cols = ["Timestamp", "Action", "Ticket ID", "Performed By", "Type"];
    const rows = logs.map((l) => [
      new Date(l.timestamp).toLocaleString(),
      l.action,
      l.ticketId,
      l.performedBy,
      badgeLabel(l.action),
    ]);
    const content = [cols, ...rows].map((r) => r.map(escapeCSV).join(",")).join("\n");
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "fors_activity_log.csv"; a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${logs.length} log entries`);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-3 rounded-xl shadow-xl text-sm font-medium z-50">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Audit &amp; Activity Log</h2>
          <p className="text-sm text-slate-400 mt-0.5">All actions taken on tickets — approve, reject, chat, escalate</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            Live feed
          </span>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold px-3 py-2 rounded-xl shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Search + Filter bar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search actions, tickets, users…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
          />
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <p className="text-[11px] text-slate-400 mb-3">{logs.length} {logs.length === 1 ? "entry" : "entries"}</p>

      {/* Log list */}
      <div className="space-y-2">
        {logs.map((log) => {
          const style = getActionStyle(log.action);
          return (
            <div
              key={log.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 px-4 py-3"
            >
              <div className={`w-8 h-8 rounded-full ${style.bg} flex items-center justify-center shrink-0 shadow-sm`}>
                {style.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{log.action}</p>
                <span className="text-[10px] font-mono text-slate-400">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </div>
              <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 shrink-0">
                #{log.ticketId}
              </span>
              <div className="shrink-0 text-right hidden sm:block">
                <p className="text-xs text-slate-600 font-medium">{log.performedBy}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${style.badge} ${style.badgeText}`}>
                  {badgeLabel(log.action)}
                </span>
              </div>
            </div>
          );
        })}

        {logs.length === 0 && (
          <div className="text-center py-14 text-slate-400">
            <Search className="w-7 h-7 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No log entries match your filter</p>
            <button onClick={() => { setSearch(""); setFilter("all"); }} className="mt-2 text-xs text-blue-600 hover:underline">
              Clear filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
