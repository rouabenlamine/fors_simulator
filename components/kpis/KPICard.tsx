import { TrendingUp, TrendingDown } from "lucide-react";
import type { KPI } from "@/lib/types";

interface KPICardProps {
  kpi: KPI;
  accentColor?: string;
}

export function KPICard({ kpi, accentColor = "#3b82f6" }: KPICardProps) {
  const isUp = kpi.changeType === "up";

  return (
    <div
      className="rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 relative group overflow-hidden"
      style={{ backgroundColor: `${accentColor}08` }}
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <TrendingUp className="w-16 h-16" style={{ color: accentColor }} />
      </div>

      <div className="p-6 relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-6 rounded-full" style={{ backgroundColor: accentColor }} />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{kpi.label}</p>
        </div>

        <div className="flex items-end justify-between gap-2">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black tracking-tight" style={{ color: accentColor }}>
              {kpi.value}
            </span>
            {kpi.unit && (
              <span className="text-sm font-bold text-slate-400">{kpi.unit}</span>
            )}
          </div>

          {kpi.change !== undefined && (
            <div
              className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border shadow-sm transition-transform group-hover:scale-110 ${
                isUp
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : "bg-rose-50 text-rose-700 border-rose-100"
              }`}
            >
              {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{Math.abs(kpi.change)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
