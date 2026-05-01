"use client";

import { useState, useEffect, useRef } from "react";
import {
  BarChart3, FileText, Download, TrendingUp, CheckCircle,
  XCircle, AlertTriangle, Clock, Calendar, Loader2,
  PieChart, Activity, Users, Zap, FileDown, Search, X, Info
} from "lucide-react";
import { getReportKpisAction } from "@/app/actions/admin-actions";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, Legend,
  LineChart, Line, Area, AreaChart,
} from "recharts";

type DateRange = "7d" | "30d" | "90d" | "all";

const VIBRANT_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#F43F5E'];
const CARD_GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-purple-500 to-fuchsia-600",
];

const DATE_RANGES: { key: DateRange; label: string }[] = [
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "all", label: "All time" },
];

// Bold color palettes
const STATUS_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"];
const PIE_COLORS = ["#6366F1", "#22C55E", "#F59E0B", "#EF4444", "#EC4899", "#14B8A6", "#F97316", "#8B5CF6"];
const TEAM_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6"];

export default function ReportPage() {
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPdfConfig, setShowPdfConfig] = useState(false);
  const [selectedKpi, setSelectedKpi] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    getReportKpisAction().then((data) => {
      setKpis(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (!kpis) {
    return (
      <div className="flex items-center justify-center py-32 text-slate-400">
        <p>Failed to load report data. Please try again.</p>
      </div>
    );
  }

  // Derived data for charts
  const statusData = [
    { name: "Closed", value: kpis.closedTickets - kpis.validatedTickets, color: "#10B981" },
    { name: "Validated", value: kpis.validatedTickets, color: "#3B82F6" },
    { name: "Pending", value: kpis.pendingTickets, color: "#F59E0B" },
    { name: "Rejected", value: kpis.rejectedTickets, color: "#EF4444" },
    { name: "Canceled", value: kpis.canceledTickets, color: "#94A3B8" },
    { name: "SQL Proposed", value: kpis.sqlProposedTickets, color: "#8B5CF6" },
    { name: "Analysis Pending", value: kpis.analysisPendingTickets, color: "#06B6D4" },
  ].filter(d => d.value > 0);

  const priorityData = (kpis.priorityDistribution || []).map((p: any, i: number) => ({
    name: p.priority || `P${i + 1}`,
    value: p.c,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  const teamData = (kpis.teamDistribution || []).map((t: any, i: number) => ({
    name: t.team || "Unknown",
    tickets: t.c,
    color: TEAM_COLORS[i % TEAM_COLORS.length],
  }));

  const monthlyData = (kpis.monthlyTrend || []).map((m: any) => ({
    month: m.month,
    total: m.total,
    resolved: m.resolved,
    rejected: m.rejected,
  }));

  const resolutionRate = kpis.totalTickets > 0
    ? Math.round((kpis.closedTickets / kpis.totalTickets) * 100)
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Super Vibrant Header */}
      <div className="relative p-8 rounded-[2.5rem] bg-slate-900 overflow-hidden shadow-2xl shadow-indigo-900/20 animate-in fade-in slide-in-from-top-10 duration-700">
        {/* Animated Background Elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-fuchsia-500 rounded-full mix-blend-multiply filter blur-[128px] animate-pulse opacity-50" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-[128px] animate-pulse opacity-50 delay-1000" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-xs font-black text-cyan-300 uppercase tracking-widest shadow-[0_0_15px_rgba(32,215,255,0.3)]">
              <Zap className="w-4 h-4 text-yellow-400 animate-bounce" />
              Reporting Engine Active
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-cyan-300 tracking-tighter">
                Overview
              </h2>
              <p className="text-slate-300 text-sm font-medium max-w-xl leading-relaxed">
                Real-time statistics and analytics. Click any card or chart for detailed insights.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-1 shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-slate-300 ml-2" />
              {DATE_RANGES.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setDateRange(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${dateRange === key
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-300 hover:bg-white/10"
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowPdfConfig(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all hover:-translate-y-0.5"
            >
              <FileDown className="w-4 h-4" />
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards (Glow Aesthetic) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Tickets", value: kpis.totalTickets, icon: FileText, gradient: CARD_GRADIENTS[0] },
          { label: "Resolved", value: kpis.closedTickets, icon: CheckCircle, gradient: CARD_GRADIENTS[1], seriesData: [{ name: "Closed", value: kpis.closedTickets }] },
          { label: "Pending", value: kpis.pendingTickets, icon: Clock, gradient: CARD_GRADIENTS[2], seriesData: [{ name: "Pending", value: kpis.pendingTickets }] },
          { label: "AI Confidence", value: `${kpis.avgAiConfidence}%`, icon: Zap, gradient: CARD_GRADIENTS[3] },
        ].map((card, i) => (
          <div
            key={i}
            onClick={() => setSelectedKpi({ name: card.label, value: card.value, category: "High-Level Metric", seriesData: card.seriesData || [] })}
            className={`relative p-[1.5px] rounded-[2rem] shadow-lg hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] transition-all duration-500 hover:-translate-y-2 group cursor-pointer overflow-hidden`}
          >
            {/* Animated Border Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-r ${card.gradient} animate-spin-slow opacity-60 group-hover:opacity-100 transition-opacity`} style={{ animationDuration: '8s' }} />

            <div className="bg-white/10 backdrop-blur-2xl h-full rounded-[1.9rem] p-7 flex flex-col justify-between overflow-hidden relative border border-white/20 shadow-xl group-hover:bg-white/20 transition-all duration-500">
              {/* Pulsing Glow Background */}
              <div className={`absolute -right-8 -top-8 w-32 h-32 bg-white rounded-full filter blur-[45px] opacity-20 group-hover:opacity-40 group-hover:scale-150 transition-all duration-1000 animate-pulse`} />

              <div className="relative z-10 flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md shadow-xl border border-white/30 group-hover:border-white/60 group-hover:scale-110 transition-all duration-500 flex items-center justify-center`}>
                  <card.icon className="w-6 h-6 text-white animate-pulse" />
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all duration-500">
                    <Search className="w-4 h-4 text-white/80" />
                  </div>
                  <span className="text-[10px] font-black text-white/60 uppercase tracking-widest group-hover:text-white transition-colors">Live</span>
                </div>
              </div>

              <div className="relative z-10">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-white tracking-tighter drop-shadow-2xl group-hover:scale-105 transition-transform duration-500 origin-left">
                    {card.value}
                  </span>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mb-2 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                </div>
                <p className="text-xs font-bold text-white/80 uppercase tracking-[0.15em] mt-3 group-hover:text-white transition-colors duration-500 leading-tight">
                  {card.label}
                </p>
              </div>

              {/* Dynamic Sparkline Area */}
              <div className="absolute bottom-0 right-0 left-0 h-20 opacity-20 group-hover:opacity-50 transition-all duration-700 pointer-events-none">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[{ v: 10 }, { v: 25 }, { v: 15 }, { v: 40 }, { v: 30 }, { v: 50 }, { v: 45 }, { v: 60 }]}>
                    <Area type="monotone" dataKey="v" stroke="#fff" strokeWidth={3} fill="#fff" fillOpacity={0.1} isAnimationActive={true} animationDuration={2000} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1: Status Donut + Priority Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-both">
        {/* Status Distribution — Donut Chart */}
        <div
          className="bg-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 relative group cursor-pointer"
          onClick={() => setSelectedKpi({ name: "Ticket Status Distribution", category: "Report Analysis", seriesData: statusData })}
        >
          <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
            <div className="w-1.5 h-4 rounded-full bg-blue-500" />
            Ticket Status Distribution
          </h3>
          {statusData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <defs>
                    <linearGradient id="pieGrad0" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3B82F6" /><stop offset="100%" stopColor="#1D4ED8" /></linearGradient>
                    <linearGradient id="pieGrad1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10B981" /><stop offset="100%" stopColor="#047857" /></linearGradient>
                    <linearGradient id="pieGrad2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F59E0B" /><stop offset="100%" stopColor="#D97706" /></linearGradient>
                    <linearGradient id="pieGrad3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#EF4444" /><stop offset="100%" stopColor="#B91C1C" /></linearGradient>
                    <linearGradient id="pieGrad4" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8B5CF6" /><stop offset="100%" stopColor="#6D28D9" /></linearGradient>
                    <linearGradient id="pieGrad5" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#EC4899" /><stop offset="100%" stopColor="#BE185D" /></linearGradient>
                    <linearGradient id="pieGrad6" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06B6D4" /><stop offset="100%" stopColor="#0891B2" /></linearGradient>
                  </defs>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                    isAnimationActive={true}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  >
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={`url(#pieGrad${index % 7})`} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', color: '#fff' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value: string) => <span className="text-xs font-bold text-slate-500">{value}</span>}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-12">No ticket data available</p>
          )}
        </div>

        {/* Priority Distribution — Bar Chart */}
        <div
          className="bg-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 relative group cursor-pointer"
          onClick={() => setSelectedKpi({ name: "Priority Distribution", category: "Report Analysis", seriesData: priorityData })}
        >
          <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
            <div className="w-1.5 h-4 rounded-full bg-red-500" />
            Priority Distribution
          </h3>
          {priorityData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData} barSize={45}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1} />
                      <stop offset="100%" stopColor="#4F46E5" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: 12 }}
                    cursor={{ fill: '#f8fafc', radius: 10 }}
                  />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]} isAnimationActive={true} animationDuration={1500}>
                    {priorityData.map((_, index: number) => (
                      <Cell key={`cell-${index}`} fill={`url(#pieGrad${(index + 2) % 7})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-12">No priority data</p>
          )}
        </div>
      </div>

      {/* Charts Row 2: Monthly Trend + Team Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both">
        {/* Monthly Trend — Area Chart */}
        <div
          className="bg-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 relative group cursor-pointer"
          onClick={() => setSelectedKpi({ name: "Monthly Ticket Trend", category: "Report Analysis", seriesData: monthlyData.map((m: any) => ({ month: m.month, "Total Tickets": m.total, Resolved: m.resolved })) })}
        >
          <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
            <div className="w-1.5 h-4 rounded-full bg-purple-500" />
            Monthly Ticket Trend
          </h3>
          {monthlyData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="areaGradTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="areaGradResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} />
                  <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: 12 }} />
                  <Area type="monotone" dataKey="total" stroke="#8B5CF6" fill="url(#areaGradTotal)" strokeWidth={4} name="Total" isAnimationActive={true} animationDuration={2000} />
                  <Area type="monotone" dataKey="resolved" stroke="#10B981" fill="url(#areaGradResolved)" strokeWidth={4} name="Resolved" isAnimationActive={true} animationDuration={2000} />
                  <Legend formatter={(value: string) => <span className="text-xs font-bold text-slate-500">{value}</span>} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-12">No trend data available</p>
          )}
        </div>

        {/* Team Distribution — Horizontal Bar */}
        <div
          className="bg-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 relative group cursor-pointer"
          onClick={() => setSelectedKpi({ name: "Tickets by Team", category: "Report Analysis", seriesData: teamData.map((t: any) => ({ team: t.name, count: t.tickets })) })}
        >
          <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
            <div className="w-1.5 h-4 rounded-full bg-indigo-500" />
            Tickets by Team
          </h3>
          {teamData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamData} layout="vertical" barSize={25}>
                  <defs>
                    <linearGradient id="teamBarGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#6366F1" />
                      <stop offset="100%" stopColor="#A855F7" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }} width={120} />
                  <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: 12 }} />
                  <Bar dataKey="tickets" radius={[0, 10, 10, 0]} isAnimationActive={true} animationDuration={1500}>
                    {teamData.map((_, index: number) => (
                      <Cell key={`cell-${index}`} fill={`url(#pieGrad${(index + 4) % 7})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-12">No team data</p>
          )}
        </div>
      </div>

      {/* Team Review Section */}
      <div className="bg-slate-100 rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both hover:shadow-xl transition-all">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <Users className="w-5 h-5 text-white" />
            </div>
            Team Review
          </h3>
          <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-full">Active Distribution</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Per-team blocks */}
          {teamData.length > 0 ? teamData.slice(0, 5).map((team: any, i: number) => {
            const pct = kpis.totalTickets > 0 ? Math.round((team.tickets / kpis.totalTickets) * 100) : 0;
            return (
              <div
                key={i}
                className="border border-slate-200 bg-slate-50 rounded-2xl p-5 hover:border-indigo-300 hover:bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                onClick={() => setSelectedKpi({ name: `Team: ${team.name}`, category: "Team Drill-down", seriesData: [{ "Total Tickets": team.tickets, "Volume Share": `${pct}%` }] })}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white shadow-sm" style={{ color: team.color }}>
                      <Activity className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">{team.name}</p>
                  </div>
                  <span className="text-xs font-black px-2 py-1 bg-white rounded-lg shadow-sm" style={{ color: team.color }}>{team.tickets}</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 font-medium mb-2">
                      <span>Volume share</span>
                      <span className="font-bold text-slate-700">{pct}%</span>
                    </div>
                    <div className="h-2.5 bg-slate-200/60 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%`, backgroundColor: team.color }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          }) : null}

          {/* Overall Block */}
          <div
            className="border border-indigo-200 bg-indigo-50 rounded-2xl p-5 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
            onClick={() => setSelectedKpi({ name: "Overall Network Health", category: "Aggregated Metric", seriesData: [{ "Total": kpis.totalTickets, "Resolution Rate": `${resolutionRate}%`, "AI Confidence": `${kpis.avgAiConfidence}%` }] })}
          >
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-400 rounded-full blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-500 rounded-xl flex items-center justify-center shadow-md">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm font-bold text-indigo-800">Overall View</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 relative z-10">
              <div className="bg-white/60 p-3 rounded-xl backdrop-blur-sm border border-white">
                <p className="text-xl font-black text-indigo-700">{kpis.totalTickets}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Total</p>
              </div>
              <div className="bg-white/60 p-3 rounded-xl backdrop-blur-sm border border-white">
                <p className="text-xl font-black text-emerald-600">{resolutionRate}%</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Resolution</p>
              </div>
              <div className="bg-white/60 p-3 rounded-xl backdrop-blur-sm border border-white">
                <p className="text-xl font-black text-purple-600">{kpis.avgAiConfidence}%</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400">AI Score</p>
              </div>
              <div className="bg-white/60 p-3 rounded-xl backdrop-blur-sm border border-white">
                <p className="text-xl font-black text-amber-600">{kpis.activeSessions}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Sessions</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Health Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500 fill-mode-both">
        {[
          { label: "Rejected", value: kpis.rejectedTickets, icon: XCircle, color: "text-red-600", bg: "bg-red-50/30", border: "border-red-100", seriesData: [{ name: "Rejected", value: kpis.rejectedTickets }] },
          { label: "Canceled", value: kpis.canceledTickets, icon: AlertTriangle, color: "text-slate-600", bg: "bg-slate-50/50", border: "border-slate-200", seriesData: [{ name: "Canceled", value: kpis.canceledTickets }] },
          { label: "Active Users", value: kpis.totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-50/30", border: "border-blue-100", seriesData: [{ name: "Active Users", value: kpis.totalUsers }] },
          { label: "AI Analyses", value: kpis.aiAnalysisCount, icon: Zap, color: "text-fuchsia-600", bg: "bg-fuchsia-50/30", border: "border-fuchsia-100", seriesData: [{ name: "AI Analyses", value: kpis.aiAnalysisCount }] },
        ].map((stat, i) => (
          <div
            key={i}
            className={`${stat.bg} border ${stat.border} rounded-[1.5rem] p-5 flex items-center gap-4 hover:shadow-sm transition-all cursor-pointer group`}
            onClick={() => setSelectedKpi({ name: stat.label, value: stat.value, category: "System Health", seriesData: stat.seriesData })}
          >
            <div className={`w-10 h-10 rounded-full ${stat.border.replace('border', 'bg').replace('200', '200').replace('100', '100')} flex items-center justify-center shrink-0`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className={`text-2xl font-black text-slate-800`}>{stat.value}</p>
              <p className="text-xs font-semibold text-slate-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Insight Detail Modal */}
      {selectedKpi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedKpi(null)} />
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 sm:p-8 bg-slate-900 shrink-0 relative overflow-hidden rounded-t-3xl">
              <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[60px]" />
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
                    <Activity className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tight">{selectedKpi.name}</h3>
                    <div className="inline-flex items-center gap-2 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.1em]">{selectedKpi.category || "Insight Analysis"}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedKpi(null)}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/10 text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-slate-50 rounded-b-3xl">
              {selectedKpi.description && (
                <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                    <Info className="w-5 h-5 text-indigo-600" />
                  </div>
                  <p className="text-slate-700 font-medium leading-relaxed pt-2">{selectedKpi.description}</p>
                </div>
              )}

              <div className="bg-white rounded-[1.5rem] border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/50">
                <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-b from-white to-slate-50/50">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    Insight Details
                  </h4>
                  <p className="text-xs text-slate-400 font-medium mt-1">Breakdown of the specific metrics driving this visualization.</p>
                </div>

                <div className="p-5">
                  {selectedKpi.seriesData && selectedKpi.seriesData.length > 0 ? (
                    <div className={`grid gap-3 ${selectedKpi.seriesData.length > 3 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                      {selectedKpi.seriesData.map((row: any, i: number) => {
                        const keys = Object.keys(row);
                        const label = row[keys[0]];
                        const value = row[keys[1]] !== undefined ? row[keys[1]] : row[keys[0]];

                        return (
                          <div key={i} className="flex items-center justify-between p-4 rounded-[1.25rem] bg-slate-50 border border-slate-100 hover:bg-indigo-50/50 hover:border-indigo-100 transition-all group">
                            <div className="flex items-center gap-4">
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-base shadow-sm shrink-0"
                                style={{ backgroundColor: VIBRANT_COLORS[i % VIBRANT_COLORS.length] }}
                              >
                                {String(label).charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm font-bold text-slate-700 capitalize break-all">{String(label).replace(/_/g, ' ')}</span>
                            </div>
                            <span className="text-xl font-black text-slate-900 group-hover:scale-110 transition-transform origin-right pl-4">
                              {value}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-slate-400">
                      No breakdown available for this metric.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Config Modal (Section 8) */}
      {showPdfConfig && (
        <PdfConfigModal onClose={() => setShowPdfConfig(false)} kpis={kpis} />
      )}
    </div>
  );
}

// ─── PDF Configuration Modal (Section 8) ────────────────────────────────────

function PdfConfigModal({ onClose, kpis }: { onClose: () => void; kpis: any }) {
  const [step, setStep] = useState(1);
  const [exportFormat, setExportFormat] = useState<"pdf" | "pptx" | "">("")
  const [selectedSections, setSelectedSections] = useState<Record<string, boolean>>({
    summary: true,
    statusChart: true,
    priorityChart: true,
    teamChart: true,
    trendChart: true,
    teamReview: true,
    systemHealth: true,
  });
  const [comments, setComments] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  function toggleSection(key: string) {
    setSelectedSections(prev => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleGenerate() {
    setGenerating(true);
    // Simulate PDF generation
    await new Promise(r => setTimeout(r, 2000));

    // Build PDF content using browser
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      const selectedCount = Object.values(selectedSections).filter(Boolean).length;
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

      printWindow.document.write(`
        <html>
        <head>
          <title>FORS IT Report — ${dateStr}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1e293b; padding: 40px; }
            .cover { page-break-after: always; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 90vh; text-align: center; }
            .cover h1 { font-size: 36px; color: #4f46e5; margin-bottom: 12px; }
            .cover h2 { font-size: 18px; color: #64748b; font-weight: 400; }
            .cover .date { margin-top: 24px; font-size: 14px; color: #94a3b8; }
            .cover .logo { width: 80px; height: 80px; background: linear-gradient(135deg, #7c3aed, #4f46e5); border-radius: 20px; display: flex; align-items: center; justify-content: center; color: white; font-size: 32px; font-weight: bold; margin-bottom: 32px; }
            .toc { page-break-after: always; padding-top: 60px; }
            .toc h2 { font-size: 24px; color: #4f46e5; margin-bottom: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
            .toc ul { list-style: none; }
            .toc li { padding: 8px 0; font-size: 14px; color: #475569; border-bottom: 1px solid #f1f5f9; }
            .toc li span { color: #94a3b8; float: right; }
            .section { page-break-inside: avoid; margin-bottom: 40px; }
            .section h3 { font-size: 18px; color: #1e293b; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; }
            .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
            .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: center; }
            .kpi-card .value { font-size: 28px; font-weight: 800; color: #4f46e5; }
            .kpi-card .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
            .bar { height: 20px; border-radius: 4px; margin: 4px 0; }
            .team-row { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
            .team-name { width: 150px; font-size: 12px; color: #475569; }
            .team-bar-wrap { flex: 1; height: 16px; background: #f1f5f9; border-radius: 8px; overflow: hidden; }
            .team-bar { height: 100%; border-radius: 8px; }
            .team-val { width: 40px; text-align: right; font-size: 12px; font-weight: 700; color: #1e293b; }
            .footer { margin-top: 60px; padding-top: 16px; border-top: 2px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 11px; }
            .manual-text { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; font-size: 13px; line-height: 1.7; color: #334155; white-space: pre-wrap; margin-top: 16px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <!-- Cover Page -->
          <div class="cover">
            <div class="logo">F</div>
            <h1>FORS IT Report</h1>
            <h2>Incident Management System — Analytics Report</h2>
            <div class="date">${dateStr}</div>
            <div class="date" style="margin-top:8px">LEONI — IT Support Division</div>
          </div>

          <!-- Table of Contents -->
          <div class="toc">
            <h2>Table of Contents</h2>
            <ul>
              ${selectedSections.summary ? '<li>1. Executive Summary <span>3</span></li>' : ''}
              ${selectedSections.statusChart ? '<li>2. Status Distribution <span>4</span></li>' : ''}
              ${selectedSections.priorityChart ? '<li>3. Priority Analysis <span>5</span></li>' : ''}
              ${selectedSections.teamChart ? '<li>4. Team Performance <span>6</span></li>' : ''}
              ${selectedSections.trendChart ? '<li>5. Monthly Trend <span>7</span></li>' : ''}
              ${selectedSections.teamReview ? '<li>6. Team Review <span>8</span></li>' : ''}
              ${selectedSections.systemHealth ? '<li>7. System Health <span>9</span></li>' : ''}
            </ul>
          </div>

          ${selectedSections.summary ? `
          <div class="section">
            <h3>1. Executive Summary</h3>
            <div class="kpi-grid">
              <div class="kpi-card"><div class="value">${kpis.totalTickets}</div><div class="label">Total Tickets</div></div>
              <div class="kpi-card"><div class="value">${kpis.closedTickets}</div><div class="label">Resolved</div></div>
              <div class="kpi-card"><div class="value">${kpis.pendingTickets}</div><div class="label">Pending</div></div>
              <div class="kpi-card"><div class="value">${kpis.avgAiConfidence}%</div><div class="label">AI Confidence</div></div>
            </div>
            <p style="font-size:13px;line-height:1.8;color:#334155;">This report covers the comprehensive analysis of ${kpis.totalTickets} tickets processed through the FORS Incident Management System. The overall resolution rate stands at ${kpis.totalTickets > 0 ? Math.round((kpis.closedTickets / kpis.totalTickets) * 100) : 0}%, with ${kpis.closedTickets} tickets successfully resolved. The AI analysis engine has processed ${kpis.aiAnalysisCount} analyses with an average confidence score of ${kpis.avgAiConfidence}%. Currently, ${kpis.pendingTickets} tickets remain pending, ${kpis.rejectedTickets} have been rejected, and ${kpis.canceledTickets} were canceled. The system maintains ${kpis.activeSessions} active user sessions across ${kpis.totalUsers} registered users.</p>
            ${comments ? `<div class="manual-text"><strong>Notes:</strong><br/>${comments}</div>` : ''}
          </div>` : ''}

          ${selectedSections.teamChart ? `
          <div class="section">
            <h3>4. Team Performance</h3>
            ${(kpis.teamDistribution || []).map((t: any) => {
            const maxTeam = Math.max(...(kpis.teamDistribution || []).map((x: any) => x.c));
            return `<div class="team-row">
                <div class="team-name">${t.team || 'Unknown'}</div>
                <div class="team-bar-wrap"><div class="team-bar" style="width:${Math.round((t.c / maxTeam) * 100)}%;background:#6366f1"></div></div>
                <div class="team-val">${t.c}</div>
              </div>`;
          }).join('')}
          </div>` : ''}

          ${selectedSections.systemHealth ? `
          <div class="section">
            <h3>7. System Health</h3>
            <div class="kpi-grid">
              <div class="kpi-card"><div class="value">${kpis.rejectedTickets}</div><div class="label">Rejected</div></div>
              <div class="kpi-card"><div class="value">${kpis.canceledTickets}</div><div class="label">Canceled</div></div>
              <div class="kpi-card"><div class="value">${kpis.totalUsers}</div><div class="label">Users</div></div>
              <div class="kpi-card"><div class="value">${kpis.aiAnalysisCount}</div><div class="label">AI Analyses</div></div>
            </div>
          </div>` : ''}

          <div class="footer">
            <p>FORS Incident Management System — LEONI IT Support Division</p>
            <p style="margin-top:4px">Report generated on ${dateStr} • Confidential</p>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }

    setGenerating(false);
    setGenerated(true);
    setTimeout(() => setGenerated(false), 3000);
  }

  const SECTIONS = [
    { key: "summary", label: "Executive Summary", desc: "KPI overview and analysis commentary" },
    { key: "statusChart", label: "Status Distribution", desc: "Donut chart of ticket statuses" },
    { key: "priorityChart", label: "Priority Analysis", desc: "Bar chart by priority level" },
    { key: "teamChart", label: "Team Performance", desc: "Tickets per assignment group" },
    { key: "trendChart", label: "Monthly Trend", desc: "6-month area chart of ticket flow" },
    { key: "teamReview", label: "Team Review", desc: "Per-team KPI blocks and overall aggregate" },
    { key: "systemHealth", label: "System Health", desc: "Rejected, canceled, users, AI stats" },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <FileDown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Generate Report</h3>
              <p className="text-xs text-slate-400">Step {step} of 2 — {step === 1 ? "Configure report" : "Generate & Export"}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><XCircle className="w-5 h-5" /></button>
        </div>

        {/* Step indicator */}
        <div className="px-6 py-3 border-b border-gray-50 bg-gray-50/50">
          <div className="flex items-center gap-2">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${s <= step ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-500"
                  }`}>{s}</div>
                {s < 2 && <div className={`w-12 h-0.5 rounded ${s < step ? "bg-purple-400" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-6">
              {/* Section Selection */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">Report Sections</p>
                <div className="space-y-2">
                  {SECTIONS.map(sec => (
                    <button
                      key={sec.key}
                      onClick={() => toggleSection(sec.key)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${selectedSections[sec.key]
                        ? "bg-purple-50 border-purple-200 hover:border-purple-300"
                        : "bg-gray-50 border-gray-200 hover:border-gray-300 opacity-60"}`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedSections[sec.key] ? "bg-purple-600 border-purple-600" : "border-gray-300"}`}>
                        {selectedSections[sec.key] && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-700">{sec.label}</p>
                        <p className="text-[10px] text-slate-400">{sec.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Export Format (Mandatory) */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">Export Format <span className="text-rose-500">*</span></p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setExportFormat("pdf")}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all ${exportFormat === "pdf" ? "border-purple-400 bg-purple-50" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <FileDown className={`w-5 h-5 ${exportFormat === "pdf" ? "text-purple-600" : "text-gray-400"}`} />
                    <div>
                      <p className="text-xs font-bold text-slate-800">PDF</p>
                      <p className="text-[10px] text-slate-400">Print-ready document</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setExportFormat("pptx")}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all ${exportFormat === "pptx" ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <FileText className={`w-5 h-5 ${exportFormat === "pptx" ? "text-blue-600" : "text-gray-400"}`} />
                    <div>
                      <p className="text-xs font-bold text-slate-800">PowerPoint</p>
                      <p className="text-[10px] text-slate-400">Slide presentation</p>
                    </div>
                  </button>
                </div>
                {!exportFormat && <p className="text-[10px] text-rose-500 mt-2 font-medium">Please select an export format to continue</p>}
              </div>

              {/* Comments / Notes */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Comments / Notes <span className="text-slate-400 font-normal">(optional)</span></p>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                  placeholder="Add notes, observations, or context for this report export..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-100 resize-none"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="text-center py-8 space-y-4">
              {!generating && !generated && (
                <>
                  <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto">
                    <FileDown className="w-8 h-8 text-purple-600" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800">Ready to Generate</h4>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto">
                    Your report will include {Object.values(selectedSections).filter(Boolean).length} sections with {mode === "ai" ? "AI-generated" : "manual"} commentary.
                  </p>
                </>
              )}
              {generating && (
                <>
                  <Loader2 className="w-10 h-10 text-purple-500 animate-spin mx-auto" />
                  <p className="text-sm text-slate-600 mt-2">Generating your report...</p>
                </>
              )}
              {generated && (
                <>
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="text-lg font-bold text-green-700">Report Generated!</h4>
                  <p className="text-sm text-slate-500">The print dialog has been opened. Save as PDF.</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            {step === 1 ? "Cancel" : "Back"}
          </button>
          {step < 2 ? (
            <button
              onClick={() => exportFormat ? setStep(step + 1) : null}
              disabled={!exportFormat}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 text-sm font-semibold rounded-xl shadow-sm transition-all"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={generating || generated}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              <FileDown className="w-4 h-4" />
              {generating ? "Generating..." : generated ? "Done!" : `Export as ${exportFormat === "pdf" ? "PDF" : "PowerPoint"}`}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeScaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-in { animation: fadeScaleIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}
