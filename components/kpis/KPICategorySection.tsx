import type { KPI, KPICategory } from "@/lib/types";
import { KPI_CATEGORIES } from "@/lib/constants";
import { KPICard } from "./KPICard";

interface KPICategorySectionProps {
  category: KPICategory;
  kpis: KPI[];
}

export function KPICategorySection({ category, kpis }: KPICategorySectionProps) {
  const meta = KPI_CATEGORIES[category];
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1.5 h-5 rounded-full" style={{ backgroundColor: meta.color }} />
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{meta.label}</h3>
        <div className="flex-1 h-px bg-gray-100" />
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: meta.color }}
        >
          {kpis.length} metrics
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {kpis.map((kpi) => (
          <KPICard key={kpi.id} kpi={kpi} accentColor={meta.color} />
        ))}
      </div>
    </div>
  );
}
