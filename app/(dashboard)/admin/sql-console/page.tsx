"use client";

import React, { useState } from "react";
import clsx from "clsx";
import { Database, Play, AlertTriangle, ShieldCheck } from "lucide-react";
import { executeRawSqlAction } from "@/app/actions/admin-actions";

export default function SqlConsolePage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isDestructive = /drop|delete|truncate|alter/i.test(query);

  async function handleRun() {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await executeRawSqlAction(query);
      setResult(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-6 px-4 animate-in fade-in duration-500">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 shrink-0">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
              SQL <span className="text-indigo-500">Console</span>
            </h1>
            <p className="text-[11px] font-bold text-slate-400 mt-1.5 uppercase tracking-[0.2em]">Raw Database Access & Query Protocol</p>
          </div>
        </div>
        
        {isDestructive && (
          <div className="flex items-center gap-2.5 text-[10px] font-black text-rose-500 bg-rose-50 px-4 py-2 rounded-2xl border border-rose-100 uppercase tracking-widest animate-pulse">
            <AlertTriangle className="w-4 h-4" />
            Destructive Query Detected
          </div>
        )}
      </div>

      {/* Editor Section */}
      <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-800 flex flex-col group transition-all hover:shadow-indigo-500/10">
        <div className="bg-slate-950/50 px-8 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/50" />
            <div className="w-3 h-3 rounded-full bg-amber-500/50" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">PostgreSQL • Online</span>
          </div>
        </div>

        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          spellCheck={false}
          className="w-full h-56 bg-slate-900 text-indigo-300 font-mono text-[13px] p-8 focus:outline-none resize-none placeholder:text-slate-700 leading-relaxed selection:bg-indigo-500/30 selection:text-white"
          placeholder="-- Execute system-level queries here\nSELECT * FROM tickets LIMIT 10;"
        />

        <div className="px-8 py-5 border-t border-white/5 bg-slate-950/50 flex items-center justify-between">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
            Warning: Direct database manipulation bypasses application-level validation.
          </p>
          <button
            onClick={handleRun}
            disabled={loading || !query.trim()}
            className={clsx(
              "flex items-center gap-3 px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all active:scale-95",
              isDestructive
                ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20 hover:bg-rose-600"
                : "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700"
            )}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            {loading ? "Processing..." : isDestructive ? "Force Protocol" : "Execute SQL"}
          </button>
        </div>
      </div>

      {/* Error Output */}
      {error && (
        <div className="p-6 rounded-3xl border border-rose-500/20 bg-rose-500/5 text-rose-500 font-mono text-[11px] flex items-start gap-4 animate-in slide-in-from-top-4">
          <div className="w-8 h-8 bg-rose-500/20 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1 py-1">
            <p className="font-black uppercase tracking-widest text-[9px] opacity-70">Query Exception</p>
            <p className="leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Result Output */}
      {result && result.data && (
        <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/60 shadow-sm overflow-hidden animate-in slide-in-from-top-4 duration-500">
          <div className="px-8 py-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Transmission Success</h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Query returned {result.count} data nodes</p>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
            <table className="w-full text-left text-[11px] whitespace-nowrap font-mono">
              <thead className="bg-slate-50 text-slate-400 border-b border-slate-100 sticky top-0 z-10">
                <tr>
                  {Object.keys(result.data[0] || {}).map(k => (
                    <th key={k} className="px-6 py-4 font-black uppercase tracking-widest">{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.data.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-indigo-50/30 text-slate-600 transition-colors">
                    {Object.values(row).map((val: any, j) => (
                      <td key={j} className="px-6 py-3.5 truncate max-w-xs">{String(val)}</td>
                    ))}
                  </tr>
                ))}
                {result.data.length === 0 && (
                  <tr>
                    <td colSpan={100} className="px-8 py-16 text-center text-slate-400 font-bold uppercase tracking-[0.2em] italic text-[10px]">
                      Void Transmission • No records identified
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
    </div>
  );
}