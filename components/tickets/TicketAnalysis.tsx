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
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-md flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-800">Root Cause Analysis</span>
          </div>
        </CardHeader>
        <CardBody>
          <div className={`flex items-start gap-2 p-3 rounded-lg ${urgencyColors[analysis.urgency]}`}>
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="text-sm font-medium">{analysis.rootCause}</p>
          </div>

        </CardBody>
      </Card>

      {/* Impacted Tables */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-amber-600 rounded-md flex items-center justify-center">
              <Database className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-800">Impacted Tables</span>
          </div>
        </CardHeader>
        <CardBody className="space-y-2">
          {analysis.impactedTables.map((table) => {
            const barColor = table.confidence >= 90 ? "#22c55e" : table.confidence >= 70 ? "#3b82f6" : "#f97316";
            return (
              <div key={table.name} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2">
                  <code className="text-xs text-orange-600 font-mono font-bold">{table.name}</code>
                  {table.lossRate && (
                    <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold border border-red-200">
                      {table.lossRate}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {table.lostDays && (
                    <span className="text-[10px] text-slate-500 font-medium">-{table.lostDays}d</span>
                  )}
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${table.confidence}%`, backgroundColor: barColor }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold" style={{ color: barColor }}>
                      {table.confidence}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </CardBody>
      </Card>

      {/* Recommendation */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-md flex items-center justify-center">
              <CheckCircle className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-800">Recommended Solution</span>
          </div>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-slate-600 leading-relaxed">{analysis.recommendation}</p>
        </CardBody>
      </Card>
    </div>
  );
}
