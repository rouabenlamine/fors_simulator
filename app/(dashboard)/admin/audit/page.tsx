"use client";

import React, { useState, useEffect, useCallback } from "react";
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
    <div className="min-h-screen bg-[#EBF2F7] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#2C4E5E] tracking-tight">Audit History</h1>
            <p className="text-slate-500 text-sm mt-1">Monitor real-time system interactions and administrative changes across the platform.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => {}} className="flex items-center gap-2 bg-white text-slate-600 px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all">
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button onClick={load} disabled={loading} className="flex items-center gap-2 bg-[#2C4E5E] text-white px-5 py-2.5 text-xs font-bold rounded-xl shadow-lg shadow-slate-200 hover:bg-[#3d6b81] transition-all active:scale-[0.98]">
              <RefreshCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Logs
            </button>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white overflow-hidden">
          
          {/* Filters Bar */}
          <div className="px-8 py-6 border-b border-slate-100 bg-white flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            
            {/* Horizontal Tabs */}
            <div className="flex items-center gap-2 border-b xl:border-b-0 border-slate-100 pb-4 xl:pb-0">
              {[
                { id: "all", label: "All Logs" },
                { id: "security", label: "Security" },
                { id: "database", label: "Database" },
                { id: "ai", label: "AI Analysis" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 text-sm font-bold transition-all relative ${
                    activeTab === tab.id ? "text-[#2C4E5E]" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2C4E5E] rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Inline Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-slate-900" />
                <input 
                  value={userFilter} 
                  onChange={e => setUserFilter(e.target.value)} 
                  placeholder="Filter by Matricule..." 
                  className="bg-slate-50 border-none rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-slate-200 transition-all w-40" 
                />
              </div>
              <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border-none">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <input 
                  type="date" 
                  value={dateFrom} 
                  onChange={e => setDateFrom(e.target.value)} 
                  className="bg-transparent border-none p-0 text-[11px] font-bold text-slate-600 focus:ring-0 w-24" 
                />
                <span className="text-slate-300 text-[10px] font-black uppercase">To</span>
                <input 
                  type="date" 
                  value={dateTo} 
                  onChange={e => setDateTo(e.target.value)} 
                  className="bg-transparent border-none p-0 text-[11px] font-bold text-slate-600 focus:ring-0 w-24" 
                />
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-20">S No</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry ID</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Performed By</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Action Type</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Description</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-bold animate-pulse uppercase tracking-widest text-[10px]">Syncing Audit Records...</td></tr>
                ) : filteredLogs.length === 0 ? (
                  <tr><td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No audit entries match these criteria</td></tr>
                ) : (
                  filteredLogs.map((log, idx) => {
                    const details = parseDetails(log.details);
                    return (
                      <tr key={log.id} onClick={() => setSelectedLog(log)} className="group hover:bg-slate-50/50 transition-all cursor-pointer">
                        <td className="px-8 py-5 text-xs font-bold text-slate-400">{idx + 1}</td>
                        <td className="px-6 py-5 text-xs font-bold text-slate-800 tracking-tight">#{log.id}</td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
                              {log.user_matricule?.[0] || "S"}
                            </div>
                            <span className="text-xs font-bold text-slate-700">{log.user_matricule}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[9px] font-black rounded-lg border border-slate-200/50 uppercase tracking-widest">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-xs text-slate-500 font-medium max-w-md truncate group-hover:text-slate-700">
                          {details.message || log.details?.slice(0, 100)}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <span className={`text-[10px] uppercase tracking-wider ${getStatusStyle(log.action)}`}>
                            {log.action.includes("FAIL") ? "Rejected" : "Success"}
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
          <div className="px-8 py-6 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Showing {filteredLogs.length} of {logs.length} entries
            </p>
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-white transition-all"><ChevronLeft className="w-4 h-4" /></button>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4].map(p => (
                  <button key={p} className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${p === 1 ? "bg-[#2C4E5E] text-white" : "text-slate-400 hover:bg-white"}`}>{p}</button>
                ))}
                <span className="text-slate-400 mx-1">...</span>
                <button className="w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center text-slate-400 hover:bg-white">12</button>
              </div>
              <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-white transition-all"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Log Detail Modal — Premium Redesign */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col max-h-[85vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header — Smaller height */}
            <div className="relative h-28 bg-gradient-to-br from-[#2C4E5E] to-[#1A2F39] p-6 flex items-end shrink-0">
              <button
                onClick={() => setSelectedLog(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors border border-white/10"
              >
                <X className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shadow-lg border border-white/10">
                    <Activity className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em]">Audit Entry</span>
                  <span className="px-2 py-0.5 text-[8px] font-black bg-white/10 text-white rounded-full border border-white/20 uppercase tracking-widest">{selectedLog.action}</span>
                </div>
                <h3 className="text-lg font-black text-white tracking-tight">
                  {selectedLog.user_matricule} Activity Log
                </h3>
              </div>
            </div>

            {/* Modal Content — Scrollable */}
            <div className="p-6 space-y-6 overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Internal ID</p>
                  <p className="text-xs font-black text-indigo-600 font-mono">
                    #{selectedLog.id}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Performed By</p>
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-300" />
                    {selectedLog.user_matricule}
                  </p>
                </div>
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Timestamp</p>
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-300" />
                    {new Date(selectedLog.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Narrative Details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Event Narrative</p>
                  <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">AI Interpreted</span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {translateJsonToNarratives(selectedLog.details, { performedBy: selectedLog.user_matricule, defaultAction: selectedLog.action }).map((narrative, i) => (
                    <div key={i} className="flex flex-col p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-lg hover:shadow-slate-100 transition-all duration-300">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">{narrative.title}</span>
                      <span className="text-xs font-bold text-slate-700 leading-relaxed">{narrative.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions — Minimal */}
            <div className="p-6 pt-4 flex items-center justify-between border-t border-slate-100 shrink-0">
              <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 italic">
                <Info className="w-3 h-3" />
                End-to-End audit trail secured.
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-2 rounded-xl text-[10px] font-bold transition-all"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
