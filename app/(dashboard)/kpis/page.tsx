"use client";

import { useState, useCallback, useEffect } from "react";
import { getKpis } from "@/app/actions";
import type { KPI } from "@/lib/types";
import { KPI_CATEGORIES } from "@/lib/constants";
import { KPICategorySection } from "@/components/kpis/KPICategorySection";
import type { KPICategory } from "@/lib/types";
import { RefreshCw } from "lucide-react";

export default function KPIsPage() {
  const categories = Object.keys(KPI_CATEGORIES) as KPICategory[];
  const [allKpis, setAllKpis] = useState<KPI[]>([]);
  const [refreshKey, setRefreshKey]   = useState(0);
  const [refreshing, setRefreshing]   = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const loadData = useCallback(async () => {
    setRefreshing(true);
    const data = await getKpis();
    setAllKpis(data);
    setLastUpdated(new Date());
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-800">KPI Dashboard</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Grouped by category · Last updated: {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold px-4 py-2 rounded-xl shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div key={refreshKey} className="space-y-8">
        {categories.map((category) => {
          const kpis = allKpis.filter((k) => k.category === category);
          if (kpis.length === 0) return null;
          return (
            <KPICategorySection key={category} category={category} kpis={kpis} />
          );
        })}
      </div>
    </div>
  );
}
