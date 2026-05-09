"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity, BarChart3, Users, Loader2, TrendingUp,
  Clock, CheckCircle, AlertTriangle, UserPlus, Search, X, Info
} from "lucide-react";
import { getActivities } from "@/app/actions";
import { getTeamKpisAction, getTeamMembersAction } from "@/app/actions/admin-actions";
import { useViewPermissions } from "@/contexts/ViewPermissionsContext";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from "recharts";

const COLORS = ['#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

type ActiveTab = "activity" | "kpis" | "team";

export default function ManagerPage() {
  const { permissions } = useViewPermissions();
  const [activeTab, setActiveTab] = useState<ActiveTab>("kpis");
  const [loading, setLoading] = useState(true);

  // Activity data
  const [activities, setActivities] = useState<any[]>([]);
  // KPI data
  const [kpis, setKpis] = useState<any>(null);
  // Team data
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [teamSearch, setTeamSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [acts, kpiData, members] = await Promise.all([
        getActivities().catch(() => []),
        getTeamKpisAction().catch(() => null),
        getTeamMembersAction().catch(() => []),
      ]);
      setActivities(acts);
      setKpis(kpiData);
      setTeamMembers(members);
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredMembers = teamSearch
    ? teamMembers.filter((m: any) =>
      m.name?.toLowerCase().includes(teamSearch.toLowerCase()) ||
      m.matricule?.toLowerCase().includes(teamSearch.toLowerCase()) ||
      m.surname?.toLowerCase().includes(teamSearch.toLowerCase())
    )
    : teamMembers;

  const TABS: { key: ActiveTab; label: string; icon: React.ElementType; color: string }[] = [
    { key: "kpis", label: "Team KPIs", icon: BarChart3, color: "from-violet-500 to-purple-600" },
    ...(permissions?.activity_logs !== false ? [{ key: "activity" as ActiveTab, label: "Team Activity", icon: Activity, color: "from-blue-500 to-indigo-600" }] : []),
    { key: "team", label: "Team Management", icon: Users, color: "from-teal-500 to-cyan-600" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
      </div>
    );
  }

  // Derive basic stats
  const totalActivities = activities.length;
  const recentActivities = activities.slice(0, 20);
  const totalTeamMembers = teamMembers.length;

  const kpiArray = Array.isArray(kpis) ? kpis : [];
  const metrics = kpiArray.filter(k => k.type === "metric");
  const charts = kpiArray.filter(k => k.type === "chart");

  // Add active state for dynamic details view
  const [selectedKpi, setSelectedKpi] = useState<any>(null);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-200">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">IT Manager Dashboard</h2>
            <p className="text-sm font-medium text-slate-400">Team oversight, dynamic telemetry, and personnel</p>
          </div>
        </div>
      </div>

      {/* Dynamic Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Always show team and activity */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 hover:-translate-y-1 group">
          <div className="flex flex-col gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Personnel</p>
            <span className="text-3xl font-black text-slate-800 tracking-tighter">{totalTeamMembers}</span>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 hover:-translate-y-1 group">
          <div className="flex flex-col gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Activity className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Events</p>
            <span className="text-3xl font-black text-slate-800 tracking-tighter">{totalActivities}</span>
          </div>
        </div>

        {/* Map up to 2 dynamic metrics */}
        {metrics.slice(0, 2).map((metric, i) => (
          <div key={metric.id} className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm hover:shadow-xl hover:shadow-violet-500/5 transition-all duration-300 hover:-translate-y-1 group">
            <div className="flex flex-col gap-3">
              <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5 text-violet-600" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate" title={metric.name}>{metric.name}</p>
              <span className="text-3xl font-black text-slate-800 tracking-tighter truncate">{metric.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
        {TABS.map(({ key, label, icon: Icon, color }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === key
                ? `bg-white text-slate-800 shadow-md scale-[1.02] border border-slate-200`
                : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
              }`}
          >
            <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${color} ${activeTab === key ? 'opacity-100' : 'opacity-40'}`} />
            <Icon className={`w-4 h-4 ${activeTab === key ? 'text-slate-800' : 'text-slate-400'}`} />
            {label}
          </button>
        ))}
      </div>

      {/* Activity Log Tab */}
      {activeTab === "activity" && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-200">
                <Activity className="w-4 h-4 text-white" />
              </div>
              Team Activity
            </h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{recentActivities.length} Live Events</span>
            </div>
          </div>
          <div className="p-6 max-h-[600px] overflow-y-auto custom-scrollbar">
            {recentActivities.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200">
                  <Activity className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-400 font-bold">No recent activities found</p>
              </div>
            ) : (
              <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                {recentActivities.map((act: any, i: number) => {
                  const isValidation = act.action?.includes("VALIDATED");
                  const isRejection = act.action?.includes("REJECTED");
                  const isSql = act.action?.includes("SQL");
                  const isChat = act.action?.includes("CHAT");

                  return (
                    <div key={act.id || i} className="relative flex items-start gap-6 animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                      <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xl border-2 ${isValidation ? "bg-white border-emerald-500" :
                          isRejection ? "bg-white border-rose-500" :
                            isSql ? "bg-white border-blue-500" :
                              isChat ? "bg-white border-purple-500" :
                                "bg-white border-slate-300"
                        }`}>
                        {isValidation ? <CheckCircle className="w-5 h-5 text-emerald-500" /> :
                          isRejection ? <AlertTriangle className="w-5 h-5 text-rose-500" /> :
                            isSql ? <BarChart3 className="w-5 h-5 text-blue-500" /> :
                              isChat ? <Activity className="w-5 h-5 text-purple-500" /> :
                                <Activity className="w-5 h-5 text-slate-400" />}
                      </div>

                      <div className="flex-1 bg-slate-50/50 rounded-2xl p-4 border border-slate-100 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isValidation ? "text-emerald-600" :
                              isRejection ? "text-rose-600" :
                                isSql ? "text-blue-600" :
                                  isChat ? "text-purple-600" :
                                    "text-slate-500"
                            }`}>
                            {act.action?.replace(/_/g, " ")}
                          </p>
                          <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600 transition-colors bg-slate-100 px-2 py-1 rounded-md">
                            {new Date(act.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-600">
                            {act.performedBy?.charAt(0) || "U"}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-800 leading-tight">
                              {act.performedBy} <span className="text-slate-400 font-medium">processed ticket</span> <span className="text-indigo-600 font-black">{act.ticketId || "System"}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dynamic KPIs Tab */}
      {activeTab === "kpis" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* TEAM REVIEW COMPONENT */}
          <div className="space-y-4">
            <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-black text-slate-800">Team Review</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

                {/* 2nd - FORS */}
                <div className="border border-slate-100 rounded-2xl p-5 hover:border-blue-200 hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="font-bold text-slate-700 text-sm">2nd - FORS</span>
                    </div>
                    <span className="font-black text-slate-500 text-xs">952 tickets</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mb-2 font-medium">
                    <span>Volume share</span>
                    <span>81%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '81%' }} />
                  </div>
                </div>

                {/* 2nd - LWSF SIGIP Applicatif */}
                <div className="border border-slate-100 rounded-2xl p-5 hover:border-emerald-200 hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="font-bold text-slate-700 text-sm">2nd - LWSF SIGIP</span>
                    </div>
                    <span className="font-black text-slate-500 text-xs">197 tickets</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mb-2 font-medium">
                    <span>Volume share</span>
                    <span>17%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '17%' }} />
                  </div>
                </div>

                {/* IT Support */}
                <div className="border border-slate-100 rounded-2xl p-5 hover:border-amber-200 hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <span className="font-bold text-slate-700 text-sm">IT Support</span>
                    </div>
                    <span className="font-black text-slate-500 text-xs">17 tickets</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mb-2 font-medium">
                    <span>Volume share</span>
                    <span>1%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '1%' }} />
                  </div>
                </div>

                {/* 2nd - FORS - On Call */}
                <div className="border border-slate-100 rounded-2xl p-5 hover:border-red-200 hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="font-bold text-slate-700 text-sm">2nd - FORS - On Call</span>
                    </div>
                    <span className="font-black text-slate-500 text-xs">10 tickets</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mb-2 font-medium">
                    <span>Volume share</span>
                    <span>1%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: '1%' }} />
                  </div>
                </div>

                {/* SAP-FI */}
                <div className="border border-slate-100 rounded-2xl p-5 hover:border-purple-200 hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      <span className="font-bold text-slate-700 text-sm">SAP-FI</span>
                    </div>
                    <span className="font-black text-slate-500 text-xs">1 tickets</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mb-2 font-medium">
                    <span>Volume share</span>
                    <span>0%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-200 rounded-full" style={{ width: '0%' }} />
                  </div>
                </div>

                {/* OVERALL */}
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 hover:border-indigo-300 transition-all">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-indigo-700 text-sm">Overall</span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-4 text-center">
                    <div>
                      <div className="text-xl font-black text-indigo-600 mb-1">1180</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total</div>
                    </div>
                    <div>
                      <div className="text-xl font-black text-emerald-600 mb-1">85%</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Resolution Rate</div>
                    </div>
                    <div>
                      <div className="text-xl font-black text-purple-600 mb-1">83%</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">AI Confidence</div>
                    </div>
                    <div>
                      <div className="text-xl font-black text-amber-500 mb-1">5</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Active Sessions</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Rejected */}
              <div className="bg-red-50/30 border border-red-100 rounded-[1.5rem] p-5 flex items-center gap-4 hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <X className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-800">1</div>
                  <div className="text-xs font-semibold text-slate-500">Rejected</div>
                </div>
              </div>

              {/* Canceled */}
              <div className="bg-slate-50/50 border border-slate-200 rounded-[1.5rem] p-5 flex items-center gap-4 hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-800">158</div>
                  <div className="text-xs font-semibold text-slate-500">Canceled</div>
                </div>
              </div>

              {/* Active Users */}
              <div className="bg-blue-50/30 border border-blue-100 rounded-[1.5rem] p-5 flex items-center gap-4 hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-800">13</div>
                  <div className="text-xs font-semibold text-slate-500">Active Users</div>
                </div>
              </div>

              {/* AI Analyses */}
              <div className="bg-fuchsia-50/30 border border-fuchsia-100 rounded-[1.5rem] p-5 flex items-center gap-4 hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-full bg-fuchsia-100 flex items-center justify-center shrink-0">
                  <Activity className="w-5 h-5 text-fuchsia-600" />
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-800">14</div>
                  <div className="text-xs font-semibold text-slate-500">AI Analyses</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-violet-500" />
              Dynamic Telemetry
            </h3>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{charts.length} Interactive Charts</span>
          </div>

          {/* Render Charts */}
          {charts.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {charts.map((chart, i) => {
                // Determine keys from series data
                const sample = chart.seriesData[0] || {};
                const keys = Object.keys(sample);
                const xKey = keys[0];
                const yKey = keys[1]; // using the second column as value by default

                // If it's a small dataset, render a Pie Chart, otherwise a Bar or Area chart
                const isSmallData = chart.seriesData.length <= 5 && !xKey.toLowerCase().includes("date") && !xKey.toLowerCase().includes("month");

                return (
                  <div
                    key={chart.id}
                    className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300 relative group overflow-hidden cursor-pointer"
                    onClick={() => setSelectedKpi(chart)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">{chart.name}</h4>
                          {chart.description && <p className="text-[10px] font-bold text-slate-400 mt-1">{chart.description}</p>}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Search className="w-4 h-4 text-violet-500" />
                        </div>
                      </div>

                      <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          {isSmallData ? (
                            <PieChart>
                              <Pie
                                data={chart.seriesData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey={yKey}
                                nameKey={xKey}
                              >
                                {chart.seriesData.map((_: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <RechartsTooltip
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ fontWeight: 'bold' }}
                              />
                            </PieChart>
                          ) : (
                            i % 2 === 0 ? (
                              <AreaChart data={chart.seriesData}>
                                <defs>
                                  <linearGradient id={`color-${i}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} dx={-10} />
                                <RechartsTooltip
                                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey={yKey} stroke={COLORS[i % COLORS.length]} strokeWidth={3} fillOpacity={1} fill={`url(#color-${i})`} />
                              </AreaChart>
                            ) : (
                              <BarChart data={chart.seriesData} maxBarSize={40}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} dx={-10} />
                                <RechartsTooltip
                                  cursor={{ fill: '#f8fafc' }}
                                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey={yKey} fill={COLORS[i % COLORS.length]} radius={[6, 6, 0, 0]} />
                              </BarChart>
                            )
                          )}
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-lg font-black text-slate-800">No Dynamic Charts Configured</p>
              <p className="text-sm font-medium text-slate-400 mt-1 max-w-sm mx-auto">
                Configure SQL queries in the KPI settings to instantly generate interactive graphics.
              </p>
            </div>
          )}

          {/* Remaining Metrics */}
          {metrics.length > 2 && (
            <div className="mt-8">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 pl-1">Additional Telemetry</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {metrics.slice(2).map((metric) => (
                  <div key={metric.id} className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-3xl font-black text-violet-600 mb-1">{metric.value}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{metric.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* KPI Detail Modal */}
      {selectedKpi && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedKpi(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-slate-200">
                  <Activity className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">{selectedKpi.name}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{selectedKpi.category || "General Analysis"}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedKpi(null)}
                className="w-10 h-10 rounded-full bg-white hover:bg-slate-100 flex items-center justify-center transition-colors border border-slate-200 shadow-sm"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {selectedKpi.description && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                  <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-indigo-900 leading-relaxed">{selectedKpi.description}</p>
                </div>
              )}

              <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 bg-white">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Raw Data Output</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-200">
                      <tr>
                        {Object.keys(selectedKpi.seriesData[0] || {}).map((key) => (
                          <th key={key} className="px-5 py-3">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white font-medium">
                      {selectedKpi.seriesData.map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          {Object.values(row).map((val: any, j: number) => (
                            <td key={j} className="px-5 py-3 text-slate-700">{String(val)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Management Tab */}
      {activeTab === "team" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                placeholder="Search team members..."
                className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition-all"
              />
              {teamSearch && (
                <button onClick={() => setTeamSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {filteredMembers.map((m: any, i: number) => (
              <div
                key={m.matricule}
                className="group relative bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2 transition-all duration-500"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="relative">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-xl bg-gradient-to-br ${COLORS[i % COLORS.length]} group-hover:scale-110 transition-transform duration-500`}>
                      {m.name?.[0]}{m.surname?.[0] || ""}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full p-0.5 shadow-sm">
                      <div className={`w-full h-full rounded-full ${m.is_active ? "bg-emerald-500 animate-pulse" : "bg-red-400"}`} />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm transition-all ${m.role === 'admin' ? 'bg-violet-600 text-white' :
                        m.role === 'it_manager' ? 'bg-indigo-600 text-white' :
                          'bg-slate-100 text-slate-500'
                      }`}>
                      {m.role || 'IT Support'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.matricule}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-black text-slate-800 leading-none group-hover:text-indigo-600 transition-colors">
                      {m.name} {m.surname}
                    </h4>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <Clock className="w-3 h-3" />
                        Active
                      </div>
                      <span className="text-slate-200">|</span>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                        Online
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {[1, 2].map(j => (
                        <div key={j} className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400">
                          {j}
                        </div>
                      ))}
                    </div>
                    <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-all">
                      View Profile
                    </button>
                  </div>
                </div>

                {/* Decorative background element */}
                <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-br ${COLORS[i % COLORS.length]} opacity-0 group-hover:opacity-10 rounded-full blur-3xl transition-opacity duration-500`} />
              </div>
            ))}

            {/* Add Member Card */}
            <button className="group border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all duration-300 min-h-[200px]">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-indigo-100 group-hover:scale-110 transition-all">
                <UserPlus className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" />
              </div>
              <p className="text-sm font-bold text-slate-500 group-hover:text-indigo-700">Add Team Member</p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
