"use client";

import React, { useState } from "react";
import { Play, RotateCcw, Download, AlertCircle, RefreshCw, Check, Code2 } from "lucide-react";
import { executeLabSqlAction } from "@/app/actions";

interface SQLRunnerProps {
  initialSql: string;
  ticketId: string;
}

export function SQLRunner({ initialSql, ticketId }: SQLRunnerProps) {
  const [sql, setSql] = useState(initialSql);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [limit, setLimit] = useState(50);
  const [copied, setCopied] = useState(false);

  async function handleExecute() {
    if (!sql.trim()) return;
    setLoading(true);
    setError(null);
    setResults(null);
    
    // Auto-inject limit if it's a SELECT query and doesn't have one
    let finalQuery = sql.replace(/;$/, '');
    if (finalQuery.toLowerCase().trim().startsWith('select') && !finalQuery.toLowerCase().includes('limit')) {
      finalQuery += ` LIMIT ${limit}`;
    }

    try {
      const res = await executeLabSqlAction(finalQuery, ticketId);
      if (!res.success) {
        setError(res.error || "SQL Execution failed.");
      } else {
        setResults(res.data || []);
        setExecutionTime(res.timeMs || 0);
      }
    } catch (err: any) {
      setError(err.message || "SQL Execution failed.");
    }
    setLoading(false);
  }

  function handleReset() {
    setSql(initialSql);
    setResults(null);
    setError(null);
  }

  function handleExportCsv() {
    if (!results || results.length === 0) return;
    const headers = Object.keys(results[0]);
    const csvContent = [
      headers.join(','),
      ...results.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `query_results_${ticketId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="flex flex-col bg-[#0f172a]">
      {/* Editor Area */}
      <div className="relative p-6">
        <textarea
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          spellCheck={false}
          className="w-full min-h-[120px] bg-[#1e293b] text-blue-300 font-mono text-[13px] leading-relaxed p-4 rounded-xl border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-y selection:bg-blue-500/30"
          placeholder="Enter SQL query..."
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-slate-700/50 bg-[#1e293b]/50">
        <div className="flex items-center gap-3">
          <button
            onClick={handleExecute}
            disabled={loading || !sql.trim()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(37,99,235,0.2)]"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Execute
          </button>
          
          <button
            onClick={handleReset}
            disabled={loading || sql === initialSql}
            className="flex items-center gap-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            title="Reset to original proposal"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          
          <div className="h-6 w-px bg-slate-700 mx-1" />
          
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="bg-slate-800 text-slate-300 border border-slate-700 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600 outline-none"
          >
            <option value={10}>Limit: 10</option>
            <option value={50}>Limit: 50</option>
            <option value={100}>Limit: 100</option>
            <option value={500}>Limit: 500</option>
          </select>
        </div>
        
        {results && results.length > 0 && (
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="mx-6 mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl flex items-start gap-3 mt-4">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-red-400 mb-1">Execution Failed</h4>
            <p className="text-xs text-red-300/80 font-mono whitespace-pre-wrap">{error}</p>
          </div>
        </div>
      )}

      {/* Results view */}
      {results && !error && (
        <div className="border-t border-slate-700/50 bg-[#0f172a]">
          <div className="px-6 py-3 border-b border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Query Results</span>
            <span className="text-[11px] text-slate-500 font-mono">
              {results.length} rows · {(executionTime || 0).toFixed(2)}ms
            </span>
          </div>
          
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-3">
              <Code2 className="w-8 h-8 opacity-20" />
              <p className="text-sm">Query returned 0 rows.</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left text-[12px] font-mono whitespace-nowrap">
                <thead className="bg-[#1e293b] text-slate-400 sticky top-0 z-10 shadow-sm">
                  <tr>
                    {Object.keys(results[0]).map(k => (
                      <th key={k} className="px-4 py-2 border-b border-slate-700 font-semibold">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {results.map((row, i) => (
                    <tr key={i} className="hover:bg-blue-900/10 transition-colors text-slate-300">
                      {Object.values(row).map((val: any, j) => (
                        <td key={j} className="px-4 py-2 truncate max-w-[300px]">
                          {val === null ? <span className="text-slate-600 italic">NULL</span> : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
