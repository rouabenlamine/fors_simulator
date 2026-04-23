"use client";

import { useState, useEffect, useRef } from "react";
import {
  BarChart3, FileText, Download, TrendingUp, CheckCircle,
  XCircle, AlertTriangle, Clock, Calendar, Loader2,
  PieChart, Activity, Users, Zap, FileDown,
} from "lucide-react";
import { getReportKpisAction } from "@/app/actions/admin-actions";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, Legend,
  LineChart, Line, Area, AreaChart,
} from "recharts";

type DateRange = "7d" | "30d" | "90d" | "all";

const DATE_RANGES: { key: DateRange; label: string }[] = [
  { key: "7d",  label: "7 days" },
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
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-sm">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">IT Report Dashboard</h2>
            <p className="text-sm text-slate-400">Real-time statistics and analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2" />
            {DATE_RANGES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setDateRange(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  dateRange === key
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowPdfConfig(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all hover:shadow-lg"
          >
            <FileDown className="w-4 h-4" />
            Generate Report
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Tickets", value: kpis.totalTickets, icon: FileText, gradient: "from-blue-500 to-blue-700", iconBg: "bg-blue-100", iconColor: "text-blue-600" },
          { label: "Resolved", value: kpis.closedTickets, icon: CheckCircle, gradient: "from-emerald-500 to-emerald-700", iconBg: "bg-emerald-100", iconColor: "text-emerald-600", sub: `${resolutionRate}% resolution rate` },
          { label: "Pending", value: kpis.pendingTickets, icon: Clock, gradient: "from-amber-500 to-orange-600", iconBg: "bg-amber-100", iconColor: "text-amber-600" },
          { label: "AI Confidence", value: `${kpis.avgAiConfidence}%`, icon: Zap, gradient: "from-purple-500 to-violet-700", iconBg: "bg-purple-100", iconColor: "text-purple-600", sub: `${kpis.aiAnalysisCount} analyses run` },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{card.label}</p>
                <p className="text-3xl font-extrabold text-slate-800">{card.value}</p>
                {card.sub && <p className="text-[10px] text-slate-400 mt-1">{card.sub}</p>}
              </div>
              <div className={`w-10 h-10 ${card.iconBg} rounded-xl flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1: Status Donut + Priority Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status Distribution — Donut Chart */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <div className="w-1.5 h-4 rounded-full bg-blue-500" />
            Ticket Status Distribution
          </h3>
          {statusData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value: string) => <span className="text-xs text-slate-600">{value}</span>}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-12">No ticket data available</p>
          )}
        </div>

        {/* Priority Distribution — Bar Chart */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <div className="w-1.5 h-4 rounded-full bg-red-500" />
            Priority Distribution
          </h3>
          {priorityData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {priorityData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Trend — Area Chart */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <div className="w-1.5 h-4 rounded-full bg-purple-500" />
            Monthly Ticket Trend
          </h3>
          {monthlyData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Area type="monotone" dataKey="total" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.15} strokeWidth={2} name="Total" />
                  <Area type="monotone" dataKey="resolved" stroke="#10B981" fill="#10B981" fillOpacity={0.1} strokeWidth={2} name="Resolved" />
                  <Legend formatter={(value: string) => <span className="text-xs text-slate-600">{value}</span>} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-12">No trend data available</p>
          )}
        </div>

        {/* Team Distribution — Horizontal Bar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <div className="w-1.5 h-4 rounded-full bg-indigo-500" />
            Tickets by Team
          </h3>
          {teamData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamData} layout="vertical" barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#64748b" }} width={120} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Bar dataKey="tickets" radius={[0, 6, 6, 0]}>
                    {teamData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
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
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
          Team Review
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Per-team blocks */}
          {teamData.length > 0 ? teamData.slice(0, 5).map((team: any, i: number) => {
            const pct = kpis.totalTickets > 0 ? Math.round((team.tickets / kpis.totalTickets) * 100) : 0;
            return (
              <div key={i} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
                    <p className="text-xs font-bold text-slate-700">{team.name}</p>
                  </div>
                  <span className="text-xs font-bold text-slate-500">{team.tickets} tickets</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Volume share</span>
                      <span className="font-bold">{pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: team.color }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          }) : null}

          {/* Overall Block */}
          <div className="border-2 border-indigo-200 bg-indigo-50/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-indigo-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-xs font-bold text-indigo-700">Overall</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <p className="text-lg font-bold text-indigo-600">{kpis.totalTickets}</p>
                <p className="text-[10px] text-slate-400">Total</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-emerald-600">{resolutionRate}%</p>
                <p className="text-[10px] text-slate-400">Resolution Rate</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-purple-600">{kpis.avgAiConfidence}%</p>
                <p className="text-[10px] text-slate-400">AI Confidence</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-amber-600">{kpis.activeSessions}</p>
                <p className="text-[10px] text-slate-400">Active Sessions</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Health Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Rejected", value: kpis.rejectedTickets, icon: XCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
          { label: "Canceled", value: kpis.canceledTickets, icon: AlertTriangle, color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200" },
          { label: "Active Users", value: kpis.totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
          { label: "AI Analyses", value: kpis.aiAnalysisCount, icon: Zap, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
        ].map((stat, i) => (
          <div key={i} className={`${stat.bg} border ${stat.border} rounded-xl p-4 flex items-center gap-3`}>
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
            <div>
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] text-slate-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

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
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [selectedSections, setSelectedSections] = useState<Record<string, boolean>>({
    summary: true,
    statusChart: true,
    priorityChart: true,
    teamChart: true,
    trendChart: true,
    teamReview: true,
    systemHealth: true,
  });
  const [manualText, setManualText] = useState("");
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
            ${mode === 'ai'
              ? `<p style="font-size:13px;line-height:1.8;color:#334155;">This report covers the comprehensive analysis of ${kpis.totalTickets} tickets processed through the FORS Incident Management System. The overall resolution rate stands at ${kpis.totalTickets > 0 ? Math.round((kpis.closedTickets / kpis.totalTickets) * 100) : 0}%, with ${kpis.closedTickets} tickets successfully resolved. The AI analysis engine has processed ${kpis.aiAnalysisCount} analyses with an average confidence score of ${kpis.avgAiConfidence}%. Currently, ${kpis.pendingTickets} tickets remain pending, ${kpis.rejectedTickets} have been rejected, and ${kpis.canceledTickets} were canceled. The system maintains ${kpis.activeSessions} active user sessions across ${kpis.totalUsers} registered users.</p>`
              : `<div class="manual-text">${manualText || 'No commentary provided.'}</div>`
            }
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
              <h3 className="text-base font-bold text-slate-800">Generate PDF Report</h3>
              <p className="text-xs text-slate-400">Step {step} of 3 — {step === 1 ? "Select sections" : step === 2 ? "Choose mode" : "Generate"}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><XCircle className="w-5 h-5" /></button>
        </div>

        {/* Step indicator */}
        <div className="px-6 py-3 border-b border-gray-50 bg-gray-50/50">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  s <= step ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-500"
                }`}>{s}</div>
                {s < 3 && <div className={`w-8 h-0.5 rounded ${s < step ? "bg-purple-400" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 mb-4">Select which sections to include in your report:</p>
              {SECTIONS.map(sec => (
                <button
                  key={sec.key}
                  onClick={() => toggleSection(sec.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                    selectedSections[sec.key]
                      ? "bg-purple-50 border-purple-200 hover:border-purple-300"
                      : "bg-gray-50 border-gray-200 hover:border-gray-300 opacity-60"
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    selectedSections[sec.key] ? "bg-purple-600 border-purple-600" : "border-gray-300"
                  }`}>
                    {selectedSections[sec.key] && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-700">{sec.label}</p>
                    <p className="text-[10px] text-slate-400">{sec.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 mb-4">Choose how the report should be narrated:</p>
              {[
                { key: "ai" as const, label: "AI-Generated", desc: "AI narrates metrics, highlights trends, and adds contextual commentary", icon: Zap, color: "purple" },
                { key: "manual" as const, label: "Manual", desc: "You write your own text alongside the selected charts and data", icon: FileText, color: "blue" },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setMode(opt.key)}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border-2 text-left transition-all ${
                    mode === opt.key
                      ? opt.color === "purple" ? "border-purple-400 bg-purple-50" : "border-blue-400 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    mode === opt.key
                      ? opt.color === "purple" ? "bg-purple-500" : "bg-blue-500"
                      : "bg-gray-100"
                  }`}>
                    <opt.icon className={`w-5 h-5 ${mode === opt.key ? "text-white" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{opt.label}</p>
                    <p className="text-xs text-slate-500">{opt.desc}</p>
                  </div>
                </button>
              ))}

              {mode === "manual" && (
                <div className="mt-4">
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Your Commentary</label>
                  <textarea
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    rows={6}
                    placeholder="Enter your analysis, commentary, and observations..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-100 resize-none"
                  />
                </div>
              )}
            </div>
          )}

          {step === 3 && (
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
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 text-sm font-semibold rounded-xl shadow-sm transition-all"
            >
              Next Step
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={generating || generated}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              <FileDown className="w-4 h-4" />
              {generating ? "Generating..." : generated ? "Done!" : "Generate PDF"}
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
