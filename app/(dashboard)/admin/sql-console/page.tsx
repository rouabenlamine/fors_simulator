"use client";

import React, { useState } from "react";
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
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 drop-shadow-sm flex items-center gap-3">
          <Database className="w-8 h-8 text-emerald-400" />
          Raw SQL Console
        </h1>
        <p className="text-slate-400 text-sm">
          Run raw queries directly against the database. Ensure inputs are sanitized.
        </p>
      </div>

      <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Editor constraints */}
        <div className="bg-slate-950 p-2 border-b border-white/5 flex items-center justify-between">
          <div className="flex gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
          </div>
          {isDestructive && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-md">
              <AlertTriangle className="w-3.5 h-3.5" />
              Destructive Query Detected
            </span>
          )}
        </div>

        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          spellCheck={false}
          className="w-full h-48 bg-slate-900 text-emerald-400 font-mono text-sm p-4 focus:outline-none resize-none placeholder:text-slate-700"
          placeholder="SELECT * FROM tickets LIMIT 10;"
        />

        <div className="p-4 border-t border-white/5 bg-slate-800/50 flex justify-end">
          <button
            onClick={handleRun}
            disabled={loading || !query.trim()}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${isDestructive
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              }`}
          >
            <Play className="w-4 h-4 fill-current" />
            {loading ? "Executing..." : isDestructive ? "Force Execute" : "Run Query"}
          </button>
        </div>
      </div>

      {/* Results */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 font-mono text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="mt-0.5">{error}</span>
        </div>
      )}

      {result && result.data && (
        <div className="bg-slate-900 rounded-2xl border border-white/5 shadow-xl overflow-hidden">
          <div className="p-3 border-b border-white/5 bg-slate-800/80 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Query Success
            </h3>
            <span className="text-[10px] text-slate-400 bg-black/40 px-2 py-1 rounded font-mono">{result.count} rows</span>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap font-mono">
              <thead className="bg-[#0f172a] text-slate-400 border-b border-white/5">
                <tr>
                  {Object.keys(result.data[0] || {}).map(k => (
                    <th key={k} className="px-4 py-3 font-semibold">{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {result.data.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-white/[0.02] text-slate-300">
                    {Object.values(row).map((val: any, j) => (
                      <td key={j} className="px-4 py-2 truncate max-w-xs">{String(val)}</td>
                    ))}
                  </tr>
                ))}
                {result.data.length === 0 && (
                  <tr><td colSpan={100} className="px-4 py-8 text-center text-slate-500 italic">No results returned</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}