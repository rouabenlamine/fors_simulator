"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import {
  Activity, Search, Filter, Calendar, User, FileJson,
  ChevronDown, RefreshCcw, Info, X, Clock, Ticket,
  ExternalLink, ChevronLeft, ChevronRight, Download, Eye
} from "lucide-react";
import { getAuditLogsAction, getAuditActionTypes } from "@/app/actions/admin-actions";
import { translateJsonToNarratives } from "@/lib/translation";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [actionTypes, setActionTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  // Filters
  const [userFilter, setUserFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "security" | "database" | "ai">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, types] = await Promise.all([
        getAuditLogsAction({
          userMatricule: userFilter || undefined,
          action: actionFilter || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined
        }),
        getAuditActionTypes(),
      ]);
      setLogs(data);
      setActionTypes(types);
    } catch { }
    setLoading(false);
  }, [userFilter, actionFilter, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  // Derived filtered logs for tabs (client-side overlay for UX speed)
  const filteredLogs = React.useMemo(() => {
    if (activeTab === "all") return logs;
    if (activeTab === "security") return logs.filter(l => l.action.includes("LOGIN") || l.action.includes("PERMISSIONS"));
    if (activeTab === "database") return logs.filter(l => l.action.includes("SQL") || l.action.includes("DATABASE"));
    if (activeTab === "ai") return logs.filter(l => l.action.includes("AI") || l.action.includes("ANALYSIS"));
    return logs;
  }, [logs, activeTab]);

  const getStatusStyle = (action: string) => {
    const a = action.toUpperCase();
    if (a.includes("FAIL") || a.includes("REJECT") || a.includes("DELETE")) return "text-rose-500 font-bold";
    if (a.includes("VALIDATED") || a.includes("SUCCESS") || a.includes("CREATED")) return "text-emerald-500 font-bold";
    if (a.includes("SQL") || a.includes("AI")) return "text-indigo-500 font-bold";
    return "text-slate-600 font-medium";
  };

  function parseDetails(details: string) {
    try { return JSON.parse(details); } catch { return { raw: details }; }
  }

  return (
    <div className="w-full space-y-6 py-6 px-8 animate-in fade-in duration-700">

      {/* Minimalist Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-100 shrink-0">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-800 tracking-tight">
              Audit <span className="text-indigo-500">Logs</span>
            </h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Surveillance & Monitoring</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white/70 backdrop-blur-md text-slate-600 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all active:scale-95">
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 bg-violet-500 text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-violet-700 transition-all active:scale-95"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Sync
          </button>
        </div>
      </div>

      {/* Main Card with Glassmorphism - Removed heavy shadow to fix brown artifact */}
      <div className="bg-white/40 rounded-[2.5rem] border border-white/80 overflow-hidden ">

        {/* Filters Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-6">

          {/* Horizontal Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
            {[
              { id: "all", label: "All Logs" },
              { id: "security", label: "Security" },
              { id: "database", label: "Database" },
              { id: "ai", label: "AI Analysis" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={clsx(
                  "px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl border whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
                    : "bg-white text-slate-400 border-slate-100 hover:text-slate-600 hover:border-slate-200"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Inline Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                value={userFilter}
                onChange={e => setUserFilter(e.target.value)}
                placeholder="Matricule..."
                className="bg-slate-50/50 border border-slate-100 rounded-xl pl-9 pr-4 py-2 text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all w-32"
              />
            </div>
            <div className="flex items-center gap-2 bg-slate-50/50 rounded-xl px-3 py-1.5 border border-slate-100">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="bg-transparent border-none p-0 text-[10px] font-black text-slate-600 focus:ring-0 w-24 uppercase"
              />
              <span className="text-slate-300 text-[8px] font-black uppercase">To</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="bg-transparent border-none p-0 text-[10px] font-black text-slate-600 focus:ring-0 w-24 uppercase"
              />
            </div>
          </div>
        </div>

        {/* Table Area - Structured & Color-coded */}
        <div className="w-full">
          <table className="w-full text-left table-fixed border-separate border-spacing-y-[2px]">
            <thead>
              <tr className="bg-indigo-50/40 border-b border-indigo-100/50">
                <th className="px-8 py-5 text-[9px] font-black text-indigo-900/60 uppercase tracking-widest w-16">No</th>
                <th className="px-6 py-5 text-[9px] font-black text-indigo-900/60 uppercase tracking-widest w-24">Entry ID</th>
                <th className="px-6 py-5 text-[9px] font-black text-indigo-900/60 uppercase tracking-widest w-40">Employee</th>
                <th className="px-6 py-5 text-[9px] font-black text-indigo-900/60 uppercase tracking-widest text-center w-32">Domain</th>
                <th className="px-6 py-5 text-[9px] font-black text-indigo-900/60 uppercase tracking-widest">Event Description</th>
                <th className="px-8 py-5 text-[9px] font-black text-indigo-900/60 uppercase tracking-widest text-right w-32">Result</th>
              </tr>
            </thead>
            <tbody className="bg-white/10">
              {loading ? (
                <tr><td colSpan={6} className="px-8 py-20 text-center text-indigo-400 font-black uppercase tracking-[0.2em] text-[9px] animate-pulse">Synchronizing Audit Records...</td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr><td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-black uppercase tracking-widest text-[9px]">No audit entries found</td></tr>
              ) : (
                filteredLogs.map((log, idx) => {
                  const details = parseDetails(log.details);
                  const isFailure = log.action.includes("FAIL") || log.action.includes("REJECT") || log.action.includes("DELETE");

                  // Domain Detection & Color Mapping
                  const isSecurity = log.action.includes("LOGIN") || log.action.includes("PERMISSIONS") || log.action.includes("ROLE");
                  const isDB = log.action.includes("SQL") || log.action.includes("DATABASE") || log.action.includes("KPI");
                  const isAI = log.action.includes("AI") || log.action.includes("ANALYSIS") || log.action.includes("VALIDATE");

                  const domainColor = isSecurity ? "border-rose-500 bg-rose-50/30 text-rose-600" :
                    isDB ? "border-emerald-500 bg-emerald-50/30 text-emerald-600" :
                      isAI ? "border-violet-500 bg-violet-50/30 text-violet-600" :
                        "border-slate-400 bg-slate-50/30 text-slate-600";

                  const rowBg = idx % 2 === 0 ? "bg-blue-50/[0.03]" : "bg-transparent";

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className={clsx(
                        "group transition-all duration-300 cursor-pointer relative",
                        rowBg,
                        "hover:bg-indigo-500/[0.04]"
                      )}
                    >
                      <td className="px-8 py-5 text-[10px] font-bold text-slate-300 relative">
                        {/* Structural Vertical Marker */}
                        <div className={clsx("absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full border-l-4 transition-all duration-500", domainColor.split(' ')[0])} />
                        {idx + 1}
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-[10px] font-black text-slate-400 font-mono">#{log.id}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2.5">
                          <div className={clsx("w-7 h-7 rounded-lg shadow-sm border flex items-center justify-center text-[9px] font-black uppercase", domainColor)}>
                            {log.user_matricule?.[0] || "S"}
                          </div>
                          <span className="text-[11px] font-black text-slate-700 tracking-tight group-hover:text-indigo-600 transition-colors truncate">{log.user_matricule}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={clsx("px-2.5 py-1.5 border text-[8px] font-black rounded-lg uppercase tracking-widest shadow-xs", domainColor)}>
                          {isSecurity ? "Security" : isDB ? "Database" : isAI ? "AI Core" : "General"}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-[11px] text-slate-500 font-bold leading-relaxed break-words group-hover:text-slate-800 transition-colors">
                          {details.message || log.details}
                        </p>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className={clsx(
                          "text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-sm",
                          isFailure
                            ? "bg-rose-50 text-rose-600 border-rose-100"
                            : "bg-emerald-50 text-emerald-600 border-emerald-100"
                        )}>
                          {isFailure ? "Critical" : "Success"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Area */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Showing {filteredLogs.length} of {logs.length} entries
          </p>
          <div className="flex items-center gap-2">
            <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-white transition-all"><ChevronLeft className="w-3.5 h-3.5" /></button>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map(p => (
                <button
                  key={p}
                  className={clsx(
                    "w-7 h-7 rounded-lg text-[10px] font-black flex items-center justify-center transition-all",
                    p === 1 ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "text-slate-400 hover:bg-white border border-transparent hover:border-slate-200"
                  )}
                >
                  {p}
                </button>
              ))}
              <span className="text-slate-300 text-[10px] font-black px-1">...</span>
            </div>
            <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-white transition-all"><ChevronRight className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>

      {/* Detail Modal - Portal Rendering to overlap Header */}
      {selectedLog && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-y-0 right-0 left-64 z-[9999] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedLog(null)} />
          <div className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/60 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg text-white">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none">Log Details</h2>
                  <p className="text-[10px] font-black text-slate-400 mt-1.5 uppercase tracking-[0.2em]">Entry #{selectedLog.id} • {selectedLog.action}</p>
                </div>
              </div>
              <button onClick={() => setSelectedLog(null)} className="w-9 h-9 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors"><X className="w-4 h-4 text-slate-400" /></button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><User className="w-3 h-3" /> Performed By</p>
                  <p className="text-sm font-black text-slate-700">{selectedLog.user_matricule || "System"}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock className="w-3 h-3" /> Timestamp</p>
                  <p className="text-sm font-black text-slate-700">{new Date(selectedLog.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Action Narratives</p>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-500 text-[8px] font-black rounded-full uppercase tracking-widest">AI Contextualized</span>
                </div>

                <div className="space-y-4">
                  {translateJsonToNarratives(selectedLog.details, { performedBy: selectedLog.user_matricule, defaultAction: selectedLog.action }).map((narrative, i) => (
                    <div key={i} className="p-5 bg-slate-50/80 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-lg hover:shadow-slate-100 group/item">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover/item:text-indigo-500 transition-colors">{narrative.title}</p>
                      <p className="text-sm font-bold text-slate-700 leading-relaxed">
                        {narrative.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-6 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.getElementById('modal-portal')!
      )}
    </div>
  );
}
