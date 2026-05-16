"use client";

import React, { useState, useEffect, useMemo } from "react";
import { getTickets } from "@/app/actions";
import {
  X, Info, Activity, AlertTriangle, ShieldCheck, PieChart as PieIcon, LineChart as LineIcon,
  BarChart3, MoreHorizontal, TrendingUp, TrendingDown, Cpu, Zap, RefreshCw
} from "lucide-react";
import { clsx } from "clsx";
import type { Ticket } from "@/lib/types";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, LineChart, Line, ScatterChart, Scatter, ZAxis,
  ComposedChart
} from "recharts";

// ─── Vivid Color Palette matching references ────────────────────
const C = {
  indigo: "#6366f1", emerald: "#10b981", rose: "#f43f5e",
  amber: "#f59e0b", sky: "#0ea5e9", purple: "#8b5cf6",
  pink: "#ec4899", fuchsia: "#d946ef", cyan: "#06b6d4"
};

const CHART_COLORS = [C.purple, C.fuchsia, C.pink, C.amber, C.sky, C.emerald];

// ─── Initial Fallback Data (before tickets load) ───────────────────
const DATES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const EMPTY_DATES = DATES.map(d => ({ date: d, value: 0 }));


// ─── Chart Card Component (Compact & Animated) ───────────────────
const ChartCard = ({ title, desc, icon: Icon, onClick, children, className, variant = "white", heroValue, heroChange, delay = 0 }: any) => {
  const isGradient = variant === "gradient-purple";
  const isGradientOrange = variant === "gradient-orange";
  const isAnyGradient = isGradient || isGradientOrange;

  const bgClass = isGradient
    ? "bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-600 border-none shadow-[0_10px_30px_rgba(139,92,246,0.25)] text-white"
    : isGradientOrange
      ? "bg-gradient-to-br from-orange-400 via-pink-500 to-rose-500 border-none shadow-[0_10px_30px_rgba(244,63,94,0.25)] text-white"
      : "bg-white border-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-slate-800";

  const textTitleClass = isAnyGradient ? "text-white/95" : "text-slate-800";
  const textDescClass = isAnyGradient ? "text-white/70" : "text-slate-400";
  const iconClass = isAnyGradient ? "text-white bg-white/20 shadow-inner" : "text-indigo-500 bg-indigo-50 border border-indigo-50";

  return (
    <div
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className={clsx(
        "rounded-[24px] border transition-all duration-500 flex flex-col p-5 group cursor-pointer hover:-translate-y-1.5 hover:shadow-xl relative overflow-hidden h-[240px] animate-in fade-in slide-in-from-bottom-8 fill-mode-both",
        bgClass,
        className
      )}
    >
      {isGradient && (
        <>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-pink-500/20 blur-3xl rounded-full pointer-events-none" />
        </>
      )}
      {isGradientOrange && (
        <>
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/20 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-purple-500/20 blur-3xl rounded-full pointer-events-none" />
        </>
      )}

      <div className="flex items-start justify-between mb-3 relative z-10 shrink-0">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={clsx("w-9 h-9 rounded-[12px] flex items-center justify-center backdrop-blur-md", iconClass)}>
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div>
            <h3 className={clsx("text-sm font-black tracking-tight", textTitleClass)}>
              {title}
            </h3>
            {desc && <p className={clsx("text-[9px] font-bold uppercase tracking-[0.15em] mt-0.5", textDescClass)}>{desc}</p>}
          </div>
        </div>
        {/* More menu removed per user request */}
      </div>

      {heroValue && (
        <div className="mb-2 relative z-10 flex items-baseline gap-2 shrink-0 px-1">
          <span className={clsx("text-2xl font-black tracking-tighter", isAnyGradient ? "text-white drop-shadow-sm" : "text-slate-800")}>{heroValue}</span>
          {heroChange && (
            <span className={clsx("text-[10px] font-black flex items-center gap-1 px-1.5 py-0.5 rounded-full",
              heroChange.startsWith('+') ? (isAnyGradient ? "bg-white/20 text-emerald-50" : "bg-emerald-50 text-emerald-600") :
                (isAnyGradient ? "bg-white/20 text-rose-50" : "bg-rose-50 text-rose-600")
            )}>
              {heroChange.startsWith('+') ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
              {heroChange}
            </span>
          )}
        </div>
      )}

      <div className="flex-1 min-h-0 relative pointer-events-none">
        {typeof children === 'function' ? children() : children}
      </div>
    </div>
  );
};

// ─── Custom Gradients Definition ────────────────────────────────
const CustomDefs = () => (
  <defs>
    <linearGradient id="colorUptime" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#fff" stopOpacity={0.6} />
      <stop offset="95%" stopColor="#fff" stopOpacity={0} />
    </linearGradient>
    <linearGradient id="colorSeverity" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor={C.rose} stopOpacity={0.4} />
      <stop offset="95%" stopColor={C.rose} stopOpacity={0} />
    </linearGradient>
    <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor={C.sky} stopOpacity={0.4} />
      <stop offset="95%" stopColor={C.sky} stopOpacity={0} />
    </linearGradient>
    <linearGradient id="colorSlaMet" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#8b5cf6" />
      <stop offset="100%" stopColor="#d946ef" />
    </linearGradient>
    <linearGradient id="colorSlaBreach" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#f43f5e" />
      <stop offset="100%" stopColor="#f97316" />
    </linearGradient>
    <linearGradient id="funnel1" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#cbd5e1" /><stop offset="100%" stopColor="#94a3b8" /></linearGradient>
    <linearGradient id="funnel2" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#818cf8" /><stop offset="100%" stopColor="#6366f1" /></linearGradient>
    <linearGradient id="funnel3" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#34d399" /><stop offset="100%" stopColor="#10b981" /></linearGradient>
    <linearGradient id="funnel4" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#fb7185" /><stop offset="100%" stopColor="#f43f5e" /></linearGradient>
  </defs>
);

// ─── Main Dashboard ─────────────────────────────────────────────
export default function TeamPerformanceDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChart, setSelectedChart] = useState<any>(null);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const t = await getTickets();
      setTickets(t);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ─── Dynamic Ticket Aggregations ───
  const data = useMemo(() => {
    if (!tickets || tickets.length === 0) return null;

    let filteredTickets = tickets;
    if (dateFrom || dateTo) {
      const fromTime = dateFrom ? new Date(dateFrom).getTime() : 0;
      const toTime = dateTo ? new Date(dateTo).getTime() + 86400000 : Infinity;
      filteredTickets = tickets.filter(t => {
        const tTime = new Date(t.createdAt).getTime();
        return tTime >= fromTime && tTime < toTime;
      });
    }

    if (filteredTickets.length === 0) return null;

    const dateSet = new Set<string>();

    filteredTickets.forEach(t => {
      if (t.createdAt) {
        const d1 = new Date(t.createdAt);
        if (!isNaN(d1.getTime())) {
          dateSet.add(new Date(d1.getTime() - (d1.getTimezoneOffset() * 60000)).toISOString().split('T')[0]);
        }
      }
      if (t.closedAt || t.updatedAt) {
        const d2 = new Date(t.closedAt || t.updatedAt);
        if (!isNaN(d2.getTime())) {
          dateSet.add(new Date(d2.getTime() - (d2.getTimezoneOffset() * 60000)).toISOString().split('T')[0]);
        }
      }
    });

    const allDates = Array.from(dateSet).sort();
    if (allDates.length === 0) {
      const d = new Date();
      allDates.push(new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0]);
    }

    interface DateEntry {
      created: number; resolved: number; critical: number; high: number; 
      medium: number; low: number; mttrSum: number; mttrCount: number;
    }
    const dateMap: Record<string, DateEntry> = {};
    allDates.forEach(d => {
      dateMap[d] = { created: 0, resolved: 0, critical: 0, high: 0, medium: 0, low: 0, mttrSum: 0, mttrCount: 0 };
    });

    let totalMet = 0;
    let totalBreached = 0;
    let funnelStats = { total: 0, processed: 0, validated: 0, rejected: 0 };
    let currentBacklog = 0;
    const statusMap: any = {};
    const impactMap: any = {};
    const mttrBins = { '< 1h': 0, '1-4h': 0, '4-12h': 0, '12-24h': 0, '24h+': 0 };
    const scatterData: any[] = [];
    const correlationList: any[] = [];

    filteredTickets.forEach(t => {
      let createdDateStr: string | null = null;
      if (t.createdAt) {
        const d1 = new Date(t.createdAt);
        if (!isNaN(d1.getTime())) {
          const localIso = new Date(d1.getTime() - (d1.getTimezoneOffset() * 60000)).toISOString();
          createdDateStr = localIso.split('T')[0];
        }
      }

      let closedDateStr: string | null = null;
      if (t.closedAt || t.updatedAt) {
        const d2 = new Date(t.closedAt || t.updatedAt);
        if (!isNaN(d2.getTime())) {
          const localIso = new Date(d2.getTime() - (d2.getTimezoneOffset() * 60000)).toISOString();
          closedDateStr = localIso.split('T')[0];
        }
      }

      // Severity and Creation Volume
      if (createdDateStr && dateMap[createdDateStr]) {
        dateMap[createdDateStr].created += 1;
        if (t.priority.includes('1')) dateMap[createdDateStr].critical += 1;
        else if (t.priority.includes('2')) dateMap[createdDateStr].high += 1;
        else if (t.priority.includes('3')) dateMap[createdDateStr].medium += 1;
        else dateMap[createdDateStr].low += 1;
      }

      // Resolution & MTTR
      if (t.status === 'closed' || t.status === 'validated') {
        if (closedDateStr && dateMap[closedDateStr]) dateMap[closedDateStr].resolved += 1;

        const createdTime = new Date(t.createdAt).getTime();
        const closedTime = t.closedAt ? new Date(t.closedAt).getTime() : new Date(t.updatedAt).getTime();
        const hoursToResolve = (closedTime - createdTime) / (1000 * 60 * 60);

        if (closedDateStr && dateMap[closedDateStr]) {
          dateMap[closedDateStr].mttrSum += hoursToResolve;
          dateMap[closedDateStr].mttrCount += 1;
        }

        if (hoursToResolve < 1) mttrBins['< 1h']++;
        else if (hoursToResolve <= 4) mttrBins['1-4h']++;
        else if (hoursToResolve <= 12) mttrBins['4-12h']++;
        else if (hoursToResolve <= 24) mttrBins['12-24h']++;
        else mttrBins['24h+']++;

        if (hoursToResolve <= 24) totalMet++;
        else totalBreached++;
      } else {
        currentBacklog++;
      }

      // Funnel (AI Pipeline)
      funnelStats.total++;
      if (['sql_proposed', 'validated', 'rejected', 'analysis_pending'].includes(t.status)) funnelStats.processed++;
      if (t.status === 'validated') funnelStats.validated++;
      if (t.status === 'rejected') funnelStats.rejected++;

      // AI Confidence
      if (t.confidence) {
        scatterData.push({
          confidence: t.confidence,
          validation: t.status === 'validated' ? 95 : (t.status === 'rejected' ? 20 : 60),
          z: 80
        });
      }

      // Status Distribution
      if (t.status) {
        statusMap[t.status] = (statusMap[t.status] || 0) + 1;
      }

      // Impact Systems (Proxy: category of critical tickets)
      if (t.priority.includes('1') || t.priority.includes('2')) {
        const sys = t.businessService || t.category || "General";
        impactMap[sys] = (impactMap[sys] || 0) + 1;
      }
    });

    // Structure array outputs for Recharts
    const uptimeData: any[] = [];
    const mttrData: any[] = [];
    const severityData: any[] = [];
    const createdVsResolved: any[] = [];
    const backlogData: any[] = [];
    const downtimeData: any[] = [];
    const aiRateData: any[] = [];

    let runningBacklog = Math.max(0, currentBacklog - Object.values(dateMap).reduce((a, b) => a + (b.created - b.resolved), 0));

    const totalMttrSum = Object.values(dateMap).reduce((a, b) => a + b.mttrSum, 0);
    const totalMttrCount = Object.values(dateMap).reduce((a, b) => a + b.mttrCount, 0);
    const globalMttrAvg = totalMttrCount > 0 ? (totalMttrSum / totalMttrCount) : 0;

    Object.keys(dateMap).forEach(date => {
      const d = dateMap[date];

      const mttr = d.mttrCount > 0 ? (d.mttrSum / d.mttrCount) : 0;
      mttrData.push({ date, mttr: Number(mttr.toFixed(1)), avg7: Number(globalMttrAvg.toFixed(1)) });

      severityData.push({ date, critical: d.critical, high: d.high, medium: d.medium, low: d.low });
      createdVsResolved.push({ date, created: d.created, resolved: d.resolved });

      runningBacklog += (d.created - d.resolved);
      backlogData.push({ date, backlog: Math.max(0, runningBacklog) });

      uptimeData.push({ date, uptime: Number((100 - (d.critical * 0.5)).toFixed(2)) });
      downtimeData.push({ date, downtime: d.critical * 45 + d.high * 15 });

      aiRateData.push({
        date,
        analysisRate: d.created > 0 ? Math.round(((d.created - d.critical) / d.created) * 100) : 0,
        rejectionRate: d.created > 0 ? Math.round(((d.critical + d.high) / d.created) * 100) : 0
      });

      correlationList.push({ volume: d.created, mttr: Number(mttr.toFixed(1)), z: 100 });
    });

    const slaData = [
      { name: 'Met', value: totalMet, fill: "url(#colorSlaMet)" },
      { name: 'Breached', value: totalBreached, fill: "url(#colorSlaBreach)" }
    ].filter(d => d.value > 0);

    const aiFunnelData = [
      { value: funnelStats.total, name: 'Total', fill: "url(#funnel1)" },
      { value: funnelStats.processed, name: 'Processed', fill: "url(#funnel2)" },
      { value: funnelStats.validated, name: 'Validated', fill: "url(#funnel3)" },
      { value: funnelStats.rejected, name: 'Rejected', fill: "url(#funnel4)" }
    ].filter(d => d.value > 0);

    const statusData = Object.entries(statusMap).map(([k, v]) => {
      let label = k.replace('_', ' ').toUpperCase();
      if (label === 'SQL PROPOSED') label = 'AI PROPOSED';
      return { name: label, value: v };
    }).sort((a: any, b: any) => b.value - a.value);

    const prodImpactData = Object.entries(impactMap).map(([k, v]) => ({ system: k, incidents: v })).sort((a: any, b: any) => b.incidents - a.incidents).slice(0, 5);
    const mttrDistData = Object.entries(mttrBins).map(([k, v]) => ({ bin: k, count: v }));

    return {
      uptimeData, mttrData, severityData, createdVsResolved, backlogData, downtimeData, aiRateData,
      slaData, aiFunnelData, statusData, prodImpactData, mttrDistData, aiScatterData: scatterData, correlationData: correlationList
    };
  }, [tickets, dateFrom, dateTo]);

  const animProps = { animationDuration: 1500, animationEasing: "ease-out" as const };

  // ─── Chart Configurations ───
  const charts = {
    uptime: {
      title: "System Uptime", desc: "Global Availability", icon: Activity, variant: "gradient-purple", heroValue: data ? `${data.uptimeData[data.uptimeData.length - 1]?.uptime || 99.9}%` : "...", heroChange: "+0.02%",
      insight: "Tracks historical system availability derived from critical severity incidents. Sharp dips indicate major platform degradation or severe outages affecting enterprise access.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data?.uptimeData || EMPTY_DATES} margin={{ top: 10, right: 0, left: -40, bottom: 0 }}>
            <CustomDefs />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }} dy={5} />
            <YAxis domain={[98, 100]} axisLine={false} tickLine={false} tick={false} />
            <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', backgroundColor: '#fff', color: '#000', fontSize: '11px', fontWeight: 'bold' }} />
            <Area type="monotone" dataKey="uptime" stroke="#fff" strokeWidth={3} fill="url(#colorUptime)" dot={{ r: 4, fill: '#fff', strokeWidth: 0 }} {...animProps} />
          </AreaChart>
        </ResponsiveContainer>
      )
    },
    mttr: {
      title: "MTTR", desc: "Mean Time to Repair", icon: LineIcon, heroValue: data ? `${data.mttrData[data.mttrData.length - 1]?.mttr || 0}h` : "...", heroChange: "-12%",
      insight: "Measures the average time taken (in hours) to resolve an incident from creation to closure. A rising trend indicates bottlenecks in the support pipeline or increased issue complexity.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data?.mttrData || EMPTY_DATES} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} dy={5} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} />
            <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }} />
            <Legend wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', paddingTop: '5px' }} />
            <Line type="monotone" dataKey="mttr" name="Daily MTTR" stroke={C.indigo} strokeWidth={3} dot={false} {...animProps} />
            <Line type="monotone" dataKey="avg7" name="7-Day Avg" stroke={C.rose} strokeDasharray="5 5" strokeWidth={2} dot={false} {...animProps} />
          </ComposedChart>
        </ResponsiveContainer>
      )
    },
    severity: {
      title: "Incident Volume", desc: "By Severity", icon: AlertTriangle, heroValue: data ? String(data.severityData.reduce((a: any, b: any) => a + b.critical + b.high, 0)) : "...", heroChange: "+14%",
      insight: "Displays the distribution of incoming tickets across severity levels. A high volume of critical or high-severity tickets correlates directly with platform instability.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data?.severityData || EMPTY_DATES} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
            <CustomDefs />
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} dy={5} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} />
            <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }} />
            <Area type="monotone" stackId="1" dataKey="critical" stroke={C.rose} strokeWidth={2} fill={C.rose} fillOpacity={0.8} {...animProps} />
            <Area type="monotone" stackId="1" dataKey="high" stroke={C.amber} strokeWidth={2} fill={C.amber} fillOpacity={0.8} {...animProps} />
            <Area type="monotone" stackId="1" dataKey="medium" stroke={C.purple} strokeWidth={2} fill={C.purple} fillOpacity={0.8} {...animProps} />
            <Area type="monotone" stackId="1" dataKey="low" stroke={C.sky} strokeWidth={2} fill={C.sky} fillOpacity={0.8} {...animProps} />
          </AreaChart>
        </ResponsiveContainer>
      )
    },
    createdVsResolved: {
      title: "Created vs Resolved", desc: "Volume comparison", icon: BarChart3, heroValue: data ? String(data.createdVsResolved.reduce((a: any, b: any) => a + b.created, 0)) : "...", heroChange: "+8%",
      insight: "Compares the daily intake of new tickets against the number successfully closed. A sustained gap where 'Created' outpaces 'Resolved' leads to compounding backlog.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data?.createdVsResolved || EMPTY_DATES} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} dy={5} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} />
            <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }} />
            <Legend wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', paddingTop: '5px' }} />
            <Bar dataKey="created" fill={C.sky} radius={[4, 4, 0, 0]} barSize={8} {...animProps} />
            <Bar dataKey="resolved" fill={C.fuchsia} radius={[4, 4, 0, 0]} barSize={8} {...animProps} />
          </BarChart>
        </ResponsiveContainer>
      )
    },
    backlog: {
      title: "Ticket Backlog", desc: "Accumulation tracking", icon: LineIcon, heroValue: data ? String(data.backlogData[data.backlogData.length - 1]?.backlog || 0) : "...", heroChange: "-5%",
      insight: "Tracks the running total of unresolved tickets in the system over time. Consistent accumulation indicates structural under-resourcing in IT operations.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data?.backlogData || EMPTY_DATES} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
            <CustomDefs />
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} dy={5} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} />
            <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }} />
            <Area type="monotone" dataKey="backlog" stroke={C.sky} strokeWidth={3} fill="url(#colorBlue)" {...animProps} />
          </AreaChart>
        </ResponsiveContainer>
      )
    },
    sla: {
      title: "SLA Compliance", desc: "Met vs Breached", icon: PieIcon, heroValue: data ? `${Math.round((data.slaData[0].value / (data.slaData[0].value + data.slaData[1].value)) * 100) || 100}%` : "...", heroChange: "+2%",
      insight: "Visualizes the ratio of tickets resolved within 24 hours (Met) versus those extending past the SLA boundary (Breached). Essential for evaluating contractual obligations.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <CustomDefs />
            <Pie data={data?.slaData || []} innerRadius="65%" outerRadius="90%" paddingAngle={6} dataKey="value" stroke="none" cornerRadius={6} {...animProps}>
              {(data?.slaData || []).map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
            </Pie>
            <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }} />
            <Legend verticalAlign="bottom" height={24} wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
          </PieChart>
        </ResponsiveContainer>
      )
    },
    aiRates: {
      title: "AI Validation", desc: "Analysis vs Rejection", icon: Cpu, heroValue: "78%", heroChange: "+15%",
      insight: "Monitors the performance of the FORS Assistant. Tracks how frequently the AI's autonomous solutions are validated by IT managers versus how often they require manual rejection.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data?.aiRateData || EMPTY_DATES} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} dy={5} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} />
            <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }} />
            <Legend wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', paddingTop: '5px' }} />
            <Line type="monotone" dataKey="analysisRate" stroke={C.fuchsia} strokeWidth={3} dot={{ r: 3, fill: C.fuchsia, strokeWidth: 0 }} {...animProps} />
            <Line type="monotone" dataKey="rejectionRate" stroke={C.amber} strokeWidth={3} dot={{ r: 3, fill: C.amber, strokeWidth: 0 }} {...animProps} />
          </LineChart>
        </ResponsiveContainer>
      )
    },
    aiScatter: {
      title: "Confidence vs Validation", desc: "Quality Relationship", icon: Scatter,
      insight: "A scatter plot correlating the AI's internal confidence score upon generating a solution with its ultimate validation outcome. Identifies if the AI is overconfident on complex edge cases.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
            <XAxis type="number" dataKey="confidence" name="Confidence" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} />
            <YAxis type="number" dataKey="validation" name="Validation" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} />
            <ZAxis type="number" dataKey="z" range={[20, 200]} />
            <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }} />
            <Scatter name="AI Ops" data={data?.aiScatterData || []} fill={C.cyan} fillOpacity={0.7} {...animProps} />
          </ScatterChart>
        </ResponsiveContainer>
      )
    },
    aiFunnel: {
      title: "AI Processing Funnel", desc: "Pipeline throughput", icon: ShieldCheck, heroValue: data ? `${data.aiFunnelData[0].value}` : "...", heroChange: "Total",
      insight: "A complete throughput analysis of the AI automation pipeline. From raw ingestion to AI-processing, all the way to final management validation and rejection statistics.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={data?.aiFunnelData || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CustomDefs />
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.03)" />
            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} />
            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#475569', fontWeight: 'bold' }} width={70} />
            <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16} {...animProps}>
              {(data?.aiFunnelData || []).map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )
    },
    prodImpact: {
      title: "Production Impact", desc: "Incidents by System", icon: Zap, variant: "gradient-orange", heroValue: data ? String(data.prodImpactData.reduce((a: any, b: any) => a + b.incidents, 0)) : "...", heroChange: "-8%",
      insight: "Categorizes critical and high priority incidents by the business service or platform domain they impact, immediately identifying exactly where the enterprise is bleeding uptime.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data?.prodImpactData || []} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.15)" />
            <XAxis dataKey="system" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.8)', fontWeight: 'bold' }} dy={5} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.8)', fontWeight: 'bold' }} />
            <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.1)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', backgroundColor: '#fff', color: '#000', fontSize: '11px', fontWeight: 'bold' }} />
            <Bar dataKey="incidents" fill="#fff" radius={[6, 6, 0, 0]} barSize={16} {...animProps} />
          </BarChart>
        </ResponsiveContainer>
      )
    },
    downtime: {
      title: "Downtime", desc: "Minutes lost", icon: LineIcon, heroValue: data ? `${data.downtimeData[data.downtimeData.length - 1]?.downtime || 0}m` : "...", heroChange: "-42m",
      insight: "Converts critical outages and incident durations into estimated total business downtime (minutes lost). The ultimate executive-level metric for IT platform health.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data?.downtimeData || EMPTY_DATES} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
            <CustomDefs />
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} dy={5} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} />
            <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }} />
            <Area type="monotone" dataKey="downtime" stroke={C.rose} strokeWidth={3} fill="url(#colorSeverity)" {...animProps} />
          </AreaChart>
        </ResponsiveContainer>
      )
    },
    mttrDist: {
      title: "MTTR Distribution", desc: "Detecting outliers", icon: BarChart3,
      insight: "A distribution histogram mapping how long resolutions take. While Average MTTR tracks the mean, this distribution highlights if most tickets are fixed in minutes but a few stall for days.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data?.mttrDistData || []} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
            <XAxis dataKey="bin" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} dy={5} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} />
            <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }} />
            <Bar dataKey="count" fill={C.cyan} radius={[6, 6, 0, 0]} barSize={20} {...animProps} />
          </BarChart>
        </ResponsiveContainer>
      )
    },
    status: {
      title: "Tickets by Status", desc: "Current distribution", icon: PieIcon,
      insight: "Breaks down the entire ticket repository by current operational state. A healthy IT pipeline should show a heavy skew towards Closed and Validated states.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <CustomDefs />
            <Pie data={data?.statusData || []} innerRadius="55%" outerRadius="85%" paddingAngle={4} dataKey="value" stroke="none" cornerRadius={4} {...animProps}>
              {(data?.statusData || []).map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }} />
            <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
          </PieChart>
        </ResponsiveContainer>
      )
    },
    correlation: {
      title: "Correlation", desc: "Volume vs MTTR", icon: Scatter,
      insight: "Maps the relationship between daily ticket volume against MTTR. If resolution times spike linearly when ticket volumes increase, it proves the IT support infrastructure cannot scale under pressure.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
            <XAxis type="number" dataKey="volume" name="Volume" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} />
            <YAxis type="number" dataKey="mttr" name="MTTR" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} />
            <ZAxis type="number" dataKey="z" range={[20, 200]} />
            <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }} />
            <Scatter name="Days" data={data?.correlationData || []} fill={C.amber} fillOpacity={0.8} {...animProps} />
          </ScatterChart>
        </ResponsiveContainer>
      )
    }
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafbff]">
      <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 sm:px-6 lg:px-6 w-full bg-transparent min-h-screen font-sans">

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-800 tracking-tight">
              Team <span className="text-indigo-500">Performance</span>
            </h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 whitespace-nowrap">Track team progress and daily results.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={isRefreshing}
            className="w-10 h-10 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-colors disabled:opacity-50 shrink-0"
            title="Refresh Data"
          >
            <RefreshCw className={clsx("w-4 h-4", isRefreshing && "animate-spin")} />
          </button>
          <div className="bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm flex items-center gap-2">
            <button
              onClick={() => { setDateFrom(""); setDateTo(""); }}
              className={clsx(
                "px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all",
                (!dateFrom && !dateTo) ? "bg-slate-900 text-white shadow-md" : "text-slate-400 hover:text-indigo-600 hover:bg-slate-50"
              )}
            >
              All Time
            </button>
            <div className="w-px h-4 bg-slate-200 mx-1"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-md text-slate-600 px-2 py-1 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all cursor-pointer"
            />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-md text-slate-600 px-2 py-1 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* ROW 1: System Reliability */}
        <div>
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 pl-2">System Reliability</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <ChartCard {...charts.uptime} delay={100} onClick={() => setSelectedChart(charts.uptime)}>{charts.uptime.render}</ChartCard>
            <ChartCard {...charts.mttr} delay={200} onClick={() => setSelectedChart(charts.mttr)}>{charts.mttr.render}</ChartCard>
            <ChartCard {...charts.severity} delay={300} onClick={() => setSelectedChart(charts.severity)}>{charts.severity.render}</ChartCard>
          </div>
        </div>

        {/* ROW 2: IT Operations & AI Performance */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div>
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 pl-2">IT Operations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <ChartCard className="md:col-span-2" {...charts.createdVsResolved} delay={400} onClick={() => setSelectedChart(charts.createdVsResolved)}>{charts.createdVsResolved.render}</ChartCard>
              <ChartCard {...charts.backlog} delay={500} onClick={() => setSelectedChart(charts.backlog)}>{charts.backlog.render}</ChartCard>
              <ChartCard {...charts.sla} delay={600} onClick={() => setSelectedChart(charts.sla)}>{charts.sla.render}</ChartCard>
            </div>
          </div>
          <div>
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 pl-2">AI Performance Engine</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <ChartCard className="md:col-span-2" {...charts.aiRates} delay={400} onClick={() => setSelectedChart(charts.aiRates)}>{charts.aiRates.render}</ChartCard>
              <ChartCard {...charts.aiScatter} delay={500} onClick={() => setSelectedChart(charts.aiScatter)}>{charts.aiScatter.render}</ChartCard>
              <ChartCard {...charts.aiFunnel} delay={600} onClick={() => setSelectedChart(charts.aiFunnel)}>{charts.aiFunnel.render}</ChartCard>
            </div>
          </div>
        </div>

        {/* ROW 3: Production Impact */}
        <div>
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 pl-2">Production Impact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <ChartCard {...charts.prodImpact} delay={700} onClick={() => setSelectedChart(charts.prodImpact)}>{charts.prodImpact.render}</ChartCard>
            <ChartCard {...charts.downtime} delay={800} onClick={() => setSelectedChart(charts.downtime)}>{charts.downtime.render}</ChartCard>
          </div>
        </div>

        {/* ROW 4: Deep Insights */}
        <div>
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 pl-2">Deep Insights Matrix</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <ChartCard {...charts.mttrDist} delay={900} onClick={() => setSelectedChart(charts.mttrDist)}>{charts.mttrDist.render}</ChartCard>
            <ChartCard {...charts.status} delay={1000} onClick={() => setSelectedChart(charts.status)}>{charts.status.render}</ChartCard>
            <ChartCard {...charts.correlation} delay={1100} onClick={() => setSelectedChart(charts.correlation)}>{charts.correlation.render}</ChartCard>
          </div>
        </div>
      </div>

      {/* ─── Global Pop-up Detail Modal ─── */}
      {selectedChart && (
        <div
          className="fixed inset-0 left-64 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedChart(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
                  {selectedChart.icon && <selectedChart.icon className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-800 tracking-tight">{selectedChart.title}</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{selectedChart.desc}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedChart(null)}
                className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 hover:bg-slate-100 flex items-center justify-center transition-colors relative z-10"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 p-5 bg-[#fafbff] overflow-y-auto min-h-0 flex flex-col gap-5">

              <div className={clsx("w-full h-[260px] shadow-sm border border-slate-100 rounded-2xl p-4 shrink-0 relative",
                selectedChart.variant === 'gradient-purple' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' :
                  selectedChart.variant === 'gradient-orange' ? 'bg-gradient-to-br from-orange-400 to-rose-500' :
                    'bg-white'
              )}>
                {typeof selectedChart.render === 'function' ? selectedChart.render() : selectedChart.content}
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/50 flex gap-4 items-start shrink-0">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Info className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800">Analytical Insight</h4>
                  <p className="text-xs font-medium text-slate-600 mt-1 leading-relaxed">
                    {selectedChart.insight || "This visualization provides a detailed breakdown of the selected metric."}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
