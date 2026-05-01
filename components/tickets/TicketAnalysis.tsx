"use client";

import { AlertTriangle, Database, CheckCircle, Bot } from "lucide-react";
import type { TicketAnalysis as TAnalysis } from "@/lib/types";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";

interface TicketAnalysisProps {
  analysis: TAnalysis;
}

const urgencyColors = {
  critical: "text-red-700 bg-red-50 border border-red-200",
  high: "text-orange-700 bg-orange-50 border border-orange-200",
  medium: "text-yellow-700 bg-yellow-50 border border-yellow-200",
  low: "text-green-700 bg-green-50 border border-green-200",
};

const urgencyBar = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

export function TicketAnalysis({ analysis }: TicketAnalysisProps) {
  return (
    <div className="space-y-4">
      {/* Root Cause */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[1.5rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_20px_50px_rgba(37,99,235,0.15)] transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="px-5 py-4 border-b border-white/40 bg-white/30 backdrop-blur-sm relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="text-[15px] font-black text-slate-800 tracking-tight">Root Cause Analysis</span>
          </div>
        </div>
        <div className="p-5 relative z-10">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-100/50 shadow-inner">
            <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-red-500 drop-shadow-sm" />
            <p className="text-sm font-semibold text-red-800 leading-relaxed">{analysis.rootCause}</p>
          </div>
        </div>
      </div>

      {/* Impacted Tables */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[1.5rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_20px_50px_rgba(249,115,22,0.15)] transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="px-5 py-4 border-b border-white/40 bg-white/30 backdrop-blur-sm relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Database className="w-4 h-4 text-white" />
            </div>
            <span className="text-[15px] font-black text-slate-800 tracking-tight">Impacted Tables</span>
          </div>
        </div>
        <div className="p-5 space-y-3 relative z-10">
          {analysis.impactedTables.map((table) => {
            const barColor = table.confidence >= 90 ? "#10b981" : table.confidence >= 70 ? "#3b82f6" : "#f97316";
            return (
              <div key={table.name} className="flex items-center justify-between p-3.5 bg-white/50 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow group/item">
                <div className="flex items-center gap-3">
                  <code className="text-[13px] text-orange-600 font-mono font-black">{table.name}</code>
                  {table.lossRate && (
                    <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-md font-black tracking-widest shadow-sm">
                      {table.lossRate}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {table.lostDays && (
                    <span className="text-[11px] text-slate-500 font-bold">-{table.lostDays}d</span>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                        style={{ width: `${table.confidence}%`, backgroundColor: barColor }}
                      />
                    </div>
                    <span className="text-[11px] font-black w-8 text-right" style={{ color: barColor }}>
                      {table.confidence}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendation */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[1.5rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_20px_50px_rgba(16,185,129,0.15)] transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="px-5 py-4 border-b border-white/40 bg-white/30 backdrop-blur-sm relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <span className="text-[15px] font-black text-slate-800 tracking-tight">Recommended Solution</span>
          </div>
        </div>
        <div className="p-5 relative z-10">
          <div className="bg-emerald-50/50 backdrop-blur-sm border border-emerald-100 rounded-xl p-5 shadow-inner">
            <p className="text-sm font-semibold text-slate-700 leading-relaxed">{analysis.recommendation}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
