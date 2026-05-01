"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { getTeamKpisAction } from "@/app/actions/admin-actions";
import { RefreshCw, BarChart3, TrendingUp, Activity, Search, X, Info, Zap, Users, AlertTriangle, Calendar, HelpCircle, Filter, ChevronDown } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, LineChart, Line
} from "recharts";

// Corporate professional palette: Slate, Navy, Teal
const CORP_COLORS = ['#0F172A', '#1E3A5F', '#0D9488', '#475569', '#14B8A6', '#334155', '#0891B2'];
const CORP_LIGHT = ['#F1F5F9', '#E2E8F0', '#F0FDFA', '#F8FAFC'];

type DateRange = "7d" | "30d" | "custom";

// KPI explanations for the info modals
const KPI_EXPLANATIONS: Record<string, { what: string; how: string }> = {
  "Total Tickets": {
    what: "The total number of IT service tickets submitted to the system across all statuses.",
    how: "Calculated by counting all rows in the tickets table scoped to the IT Support assignment group."
  },
  "Tickets Today": {
    what: "The count of new tickets created within the current business day.",
    how: "Filters the tickets table where sys_created_on matches today's date (CURDATE())."
  },
  "Tickets Solved": {
    what: "Total number of tickets that have been successfully resolved, closed, or validated.",
    how: "Counts tickets where state is either 'Closed' or 'Validated'."
  },
  "Critical Active Tickets": {
    what: "Tickets with Critical or High priority that remain open and require immediate attention.",
    how: "Counts tickets with priority '1 - Critical' or '2 - High' where state is not Closed, Validated, or Canceled."
  },
  "Unassigned Tickets": {
    what: "Active tickets that have not yet been assigned to any support agent.",
    how: "Counts tickets where assigned_to is NULL and state is not 'Closed'."
  },
  "All Tickets Status": {
    what: "A visual breakdown of all tickets grouped by their current lifecycle state.",
    how: "Aggregates the tickets table by the 'state' column and returns counts per status group."
  },
};

export default function KPIsPage() {
  const [allKpis, setAllKpis] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [selectedKpi, setSelectedKpi] = useState<any>(null);
  const [infoKpi, setInfoKpi] = useState<any>(null);
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getTeamKpisAction();
      setAllKpis(Array.isArray(data) ? data : []);
    } catch {
      setAllKpis([]);
    }
    setLastUpdated(new Date());
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set(allKpis.map(k => k.category || "General"));
    return Array.from(cats);
  }, [allKpis]);

  // Initialize activeCategories to all
  useEffect(() => {
    if (categories.length > 0 && activeCategories.size === 0) {
      setActiveCategories(new Set(categories));
    }
  }, [categories]);

  const toggleCategory = (cat: string) => {
    setActiveCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) { next.delete(cat); } else { next.add(cat); }
      return next;
    });
  };

  // Filter KPIs by active categories
  const filteredKpis = useMemo(() => {
    return allKpis.filter(k => activeCategories.has(k.category || "General"));
  }, [allKpis, activeCategories]);

  const metrics = filteredKpis.filter(k => k.type === "metric");
  const charts = filteredKpis.filter(k => k.type === "chart");

  const formatLabel = (label: any) => {
    let str = String(label || "Unknown");
    if (str === '1') return "New";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 min-h-screen">

      {/* Corporate Professional Header */}
      <div className="relative p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-[#1E3A5F] overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px]" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-500/15 border border-teal-500/25 text-xs font-bold text-teal-300 uppercase tracking-widest">
              <BarChart3 className="w-3.5 h-3.5" />
              Analytics Dashboard
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              KPI &amp; Statistics
            </h2>
            <p className="text-slate-400 text-sm max-w-md">
              Real-time operational metrics. Click any card for detailed insights, or the <HelpCircle className="w-3.5 h-3.5 inline text-teal-400" /> icon for metric explanations.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Date Range Picker */}
            <div className="flex items-center bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-1 gap-0.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
              {([
                { key: "7d" as DateRange, label: "7 Days" },
                { key: "30d" as DateRange, label: "30 Days" },
                { key: "custom" as DateRange, label: "Custom" },
              ]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setDateRange(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${dateRange === key
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-300 hover:bg-white/10"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              onClick={loadData}
              disabled={refreshing}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-teal-900/30 hover:-translate-y-0.5 disabled:opacity-70"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Syncing..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      {/* Category Group Filters */}
      {categories.length > 1 && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
            <Filter className="w-3.5 h-3.5" />
            Categories
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${activeCategories.has(cat)
                  ? "bg-slate-900 text-white border-slate-700 shadow-sm"
                  : "bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600"}`}
              >
                {cat}
              </button>
            ))}
          </div>
          <span className="text-[10px] font-bold text-slate-400 ml-2">
            {filteredKpis.length} of {allKpis.length} items
          </span>
        </div>
      )}

      {/* Metric Cards — Corporate Minimalist */}
      {metrics.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {metrics.map((metric, i) => (
            <div
              key={metric.id}
              className="group relative bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
              onClick={() => setSelectedKpi(metric)}
            >
              {/* Top accent line */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${i % 3 === 0 ? "bg-[#0F172A]" : i % 3 === 1 ? "bg-[#1E3A5F]" : "bg-teal-500"}`} />

              {/* Info icon */}
              <button
                onClick={(e) => { e.stopPropagation(); setInfoKpi(metric); }}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-teal-600 hover:border-teal-300 hover:bg-teal-50 transition-all opacity-0 group-hover:opacity-100"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>

              <div className="space-y-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${i % 3 === 0 ? "bg-slate-900 text-white" : i % 3 === 1 ? "bg-[#1E3A5F] text-white" : "bg-teal-500 text-white"}`}>
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{metric.value}</p>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">{metric.name}</p>
                </div>
              </div>

              {/* Minimal sparkline */}
              <div className="absolute bottom-0 right-0 left-0 h-12 opacity-10 pointer-events-none">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[{ v: 10 }, { v: 25 }, { v: 15 }, { v: 40 }, { v: 30 }, { v: 50 }, { v: 45 }, { v: 60 }]}>
                    <Area type="monotone" dataKey="v" stroke={i % 3 === 2 ? "#0D9488" : "#0F172A"} strokeWidth={2} fill={i % 3 === 2 ? "#0D9488" : "#0F172A"} fillOpacity={0.3} isAnimationActive={true} animationDuration={2000} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts — Corporate Professional */}
      {charts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {charts.map((chart, i) => {
            const sample = chart.seriesData[0] || {};
            const keys = Object.keys(sample);
            const xKey = keys[0];
            const yKey = keys[1];
            const isSmallData = chart.seriesData.length <= 6 && !xKey.toLowerCase().includes("date") && !xKey.toLowerCase().includes("month");

            return (
              <div
                key={chart.id}
                className="group bg-white rounded-2xl p-7 shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-300 cursor-pointer relative"
                onClick={() => setSelectedKpi(chart)}
              >
                {/* Info icon */}
                <button
                  onClick={(e) => { e.stopPropagation(); setInfoKpi(chart); }}
                  className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-teal-600 hover:border-teal-300 transition-all opacity-0 group-hover:opacity-100"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>

                <div className="mb-6">
                  <h4 className="text-lg font-extrabold text-slate-900 tracking-tight">{chart.name}</h4>
                  <p className="text-xs font-medium text-slate-400 mt-1">
                    {isSmallData ? "Distribution Analysis" : "Trend Analysis"} · {chart.category || "General"}
                  </p>
                </div>

                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {isSmallData ? (
                      <PieChart>
                        <Pie
                          data={chart.seriesData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={100}
                          paddingAngle={4}
                          dataKey={yKey}
                          nameKey={xKey}
                          stroke="#fff"
                          strokeWidth={3}
                          isAnimationActive={true}
                          animationDuration={1200}
                        >
                          {chart.seriesData.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={CORP_COLORS[index % CORP_COLORS.length]} name={formatLabel(chart.seriesData[index][xKey])} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(value: any, name: any) => [value, formatLabel(name)]}
                          contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', backgroundColor: '#fff', color: '#0f172a', fontSize: '13px' }}
                        />
                        <Legend iconType="circle" formatter={(value) => formatLabel(value)} wrapperStyle={{ fontSize: '12px', fontWeight: '600', color: '#475569' }} />
                      </PieChart>
                    ) : (
                      <BarChart data={chart.seriesData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} maxBarSize={45}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} />
                        <RechartsTooltip
                          contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', backgroundColor: '#fff', color: '#0f172a', fontSize: '13px' }}
                        />
                        <Bar dataKey={yKey} radius={[6, 6, 0, 0]} isAnimationActive={true} animationDuration={1200}>
                          {chart.seriesData.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={CORP_COLORS[index % CORP_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Grouped KPI Sections by Category */}
      {filteredKpis.length === 0 && allKpis.length === 0 && (
        <div className="text-center py-24 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200">
            <BarChart3 className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-xl font-extrabold text-slate-800">Awaiting Telemetry</p>
          <p className="text-slate-400 font-medium mt-2 max-w-md mx-auto">
            No KPI data detected. Ensure your database queries are correctly configured.
          </p>
        </div>
      )}

      {/* Last updated footer */}
      <div className="text-center pb-4">
        <p className="text-[11px] font-medium text-slate-400">
          Last refreshed: {lastUpdated.toLocaleTimeString()} · {dateRange === "7d" ? "7-Day" : dateRange === "30d" ? "30-Day" : "Custom"} window active
        </p>
      </div>

      {/* Insight Details Modal */}
      {selectedKpi && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedKpi(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 bg-gradient-to-br from-slate-900 to-[#1E3A5F] shrink-0 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-teal-500/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-teal-500/30">
                    <Activity className="w-5 h-5 text-teal-300" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-white tracking-tight">{selectedKpi.name}</h3>
                    <p className="text-xs font-medium text-slate-400 mt-0.5">{selectedKpi.category || "Insight Analysis"}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedKpi(null)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 border border-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50 rounded-b-2xl">
              {selectedKpi.description && (
                <div className="p-5 rounded-xl bg-white border border-slate-200 flex gap-3 items-start">
                  <Info className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                  <p className="text-slate-700 font-medium text-sm leading-relaxed">{selectedKpi.description}</p>
                </div>
              )}

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest">Data Breakdown</h4>
                </div>
                <div className="p-4">
                  {selectedKpi.seriesData && selectedKpi.seriesData.length > 0 ? (
                    <div className={`grid gap-2.5 ${selectedKpi.seriesData.length > 3 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                      {selectedKpi.seriesData.map((row: any, i: number) => {
                        const rowKeys = Object.keys(row);
                        const label = row[rowKeys[0]];
                        const value = row[rowKeys[1]] !== undefined ? row[rowKeys[1]] : row[rowKeys[0]];
                        return (
                          <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-teal-50/50 hover:border-teal-100 transition-all">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                                style={{ backgroundColor: CORP_COLORS[i % CORP_COLORS.length] }}
                              >
                                {String(label).charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm font-bold text-slate-700 capitalize">{String(label).replace(/_/g, ' ')}</span>
                            </div>
                            <span className="text-lg font-extrabold text-slate-900 pl-3">{value}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400 text-sm">
                      No breakdown available for this metric.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Info/Help Modal */}
      {infoKpi && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setInfoKpi(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/20">
                  <HelpCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">{infoKpi.name}</h3>
                  <p className="text-xs text-teal-100 font-medium">{infoKpi.category || "Metric Explanation"}</p>
                </div>
              </div>
              <button onClick={() => setInfoKpi(null)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Description from DB config */}
              {infoKpi.description && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</p>
                  <p className="text-sm text-slate-700 font-medium leading-relaxed">{infoKpi.description}</p>
                </div>
              )}

              {/* What does this track? */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">What Does This Track?</p>
                <p className="text-sm text-slate-700 font-medium leading-relaxed">
                  {KPI_EXPLANATIONS[infoKpi.name]?.what || infoKpi.description || "This metric provides quantitative insights into a specific operational dimension of the FORS system."}
                </p>
              </div>

              {/* How is it calculated? */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">How Is It Calculated?</p>
                <p className="text-sm text-slate-700 font-medium leading-relaxed">
                  {KPI_EXPLANATIONS[infoKpi.name]?.how || "This metric is derived from a SQL query executed against the FORS database, configured via the KPI Config panel."}
                </p>
              </div>

              {infoKpi.type === "metric" && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Value</span>
                  <span className="text-2xl font-extrabold text-slate-900">{infoKpi.value}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
