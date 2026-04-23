"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Activity, Search, Filter, Calendar, User, FileJson, ChevronDown, RefreshCcw } from "lucide-react";
import { getAuditLogsAction, getAuditActionTypes } from "@/app/actions/admin-actions";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [actionTypes, setActionTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [userFilter, setUserFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, types] = await Promise.all([
        getAuditLogsAction({ userMatricule: userFilter || undefined, action: actionFilter || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }),
        getAuditActionTypes(),
      ]);
      setLogs(data);
      setActionTypes(types);
    } catch { }
    setLoading(false);
  }, [userFilter, actionFilter, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const actionColor = (action: string) => {
    if (action.includes("FAIL") || action.includes("REJECT")) return "bg-red-50 text-red-600 border-red-200";
    if (action.includes("LOGIN") || action.includes("LOGOUT")) return "bg-blue-50 text-blue-600 border-blue-200";
    if (action.includes("SQL")) return "bg-emerald-50 text-emerald-600 border-emerald-200";
    if (action.includes("CREATED") || action.includes("UPDATED")) return "bg-indigo-50 text-indigo-600 border-indigo-200";
    if (action.includes("VALIDATED")) return "bg-green-50 text-green-600 border-green-200";
    return "bg-gray-50 text-gray-600 border-gray-200";
  };

  function parseDetails(details: string) {
    try { return JSON.parse(details); } catch { return { raw: details }; }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5 py-4 px-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-200">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Audit & Activity Logs</h1>
            <p className="text-sm text-slate-500">Global audit trail — every action logged to the system.</p>
          </div>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-2 bg-white hover:bg-gray-50 text-slate-700 px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 shadow-sm transition-all active:scale-[0.98]">
          <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={userFilter} onChange={e => setUserFilter(e.target.value)} placeholder="Filter by user..." className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all" />
          </div>
          <div className="relative">
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-400 cursor-pointer appearance-none transition-all">
              <option value="">All Actions</option>
              {actionTypes.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-400 transition-all" />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-400 transition-all" />
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-400 font-mono">{loading ? "Loading..." : `${logs.length} records found`}</div>

      {/* Logs Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-slate-500 text-xs uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-5 py-3.5 font-semibold w-10">#</th>
                <th className="px-5 py-3.5 font-semibold">Timestamp</th>
                <th className="px-5 py-3.5 font-semibold">User</th>
                <th className="px-5 py-3.5 font-semibold">Action</th>
                <th className="px-5 py-3.5 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400 animate-pulse">Loading audit logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">No logs match the current filters.</td></tr>
              ) : logs.map(log => {
                const details = parseDetails(log.details);
                const isExpanded = expandedId === log.id;
                return (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-blue-50/30 transition-colors cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : log.id)}>
                      <td className="px-5 py-3 text-slate-400 text-xs font-mono">{log.id}</td>
                      <td className="px-5 py-3 text-slate-600 text-xs font-mono">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="px-5 py-3"><span className="font-semibold text-slate-700">{log.user_matricule}</span></td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${actionColor(log.action)}`}>{log.action}</span>
                      </td>
                      <td className="px-5 py-3 text-slate-500 text-xs max-w-xs truncate">{details.message || log.details?.slice(0, 80)}</td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="px-5 pb-4 pt-0">
                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mt-1">
                            <div className="flex items-center gap-2 mb-2">
                              <FileJson className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Payload</span>
                            </div>
                            <pre className="text-xs text-indigo-600 font-mono whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
                              {JSON.stringify(details, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
