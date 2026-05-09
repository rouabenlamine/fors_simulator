"use client";

import { Database, CheckCircle, Bot, Zap, Search, Target, Sparkles } from "lucide-react";
import type { TicketAnalysis as TAnalysis } from "@/lib/types";
import { clsx } from "clsx";

interface TicketAnalysisProps {
  analysis: TAnalysis;
}

export function TicketAnalysis({ analysis }: TicketAnalysisProps) {
  return (
    <div className="space-y-4">
      {/* ─── AI Diagnostic Header ─── */}
      <div className="flex items-center justify-between px-1 mb-1">
        <div className="flex items-center gap-1.5">
          <Bot className="w-3.5 h-3.5 text-indigo-600" />
          <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">FORS Agent Intelligence</h3>
        </div>
        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 rounded-lg border border-indigo-100">
          <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
          <span className="text-[8px] font-black text-indigo-600 uppercase">Analysis Active</span>
        </div>
      </div>

      {/* Root Cause Analysis */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group hover:border-indigo-400 transition-all duration-300">
        <div className="px-4 py-2 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-lg flex items-center justify-center shadow-md">
              <Target className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em]">Root Cause</span>
          </div>
          <Zap className="w-3 h-3 text-amber-500 fill-amber-500 animate-pulse" />
        </div>
        <div className="p-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 shadow-inner group-hover:bg-white group-hover:border-indigo-100 transition-colors">
            <p className="text-[11px] font-black text-slate-700 leading-relaxed italic whitespace-pre-wrap">
              &quot;{analysis.rootCause?.replace(/\\n/g, '\n')}&quot;
            </p>
          </div>
        </div>
      </div>

      {/* Impacted Tables */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group hover:border-violet-400 transition-all duration-300">
        <div className="px-4 py-2 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-md">
              <Database className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em]">Impacted Entities</span>
          </div>
        </div>
        <div className="p-3 space-y-1.5">
          {analysis.impactedTables.map((table: any) => {
            const barColor = table.confidence >= 90 ? "bg-emerald-500" : table.confidence >= 70 ? "bg-indigo-500" : "bg-amber-500";
            return (
              <div key={table.name} className="flex items-center justify-between px-2.5 py-2 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all group/item cursor-default">
                <code className="text-[10px] text-slate-900 font-mono font-black tracking-tight">{table.name}</code>
                <div className="flex items-center gap-2.5">
                  <div className="w-12 h-1 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                    <div
                      className={clsx("h-full rounded-full transition-all duration-1000 ease-out", barColor)}
                      style={{ width: `${table.confidence}%` }}
                    />
                  </div>
                  <span className="text-[8px] font-black w-6 text-right text-slate-500 group-hover/item:text-slate-900">
                    {table.confidence}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resolution Steps */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group hover:border-emerald-400 transition-all duration-300">
        <div className="px-4 py-2 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-lg flex items-center justify-center shadow-md">
              <CheckCircle className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em]">Remediation</span>
          </div>
        </div>
        <div className="p-3">
          <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-xl shadow-inner border-dashed relative group-hover:bg-emerald-50/80 transition-colors">
             <div className="absolute top-2 right-3">
               <Zap className="w-3 h-3 text-emerald-500" />
             </div>
            <p className="text-[11px] font-bold text-emerald-800 leading-relaxed whitespace-pre-wrap">
              {analysis.recommendation?.replace(/\\n/g, '\n')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
