"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity, BarChart3, Users, Loader2, TrendingUp,
  Clock, CheckCircle, AlertTriangle, UserPlus, Search, X,
} from "lucide-react";
import { getActivities } from "@/app/actions";
import { getTeamKpisAction, getTeamMembersAction } from "@/app/actions/admin-actions";
import { useViewPermissions } from "@/contexts/ViewPermissionsContext";

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
        m.prenom?.toLowerCase().includes(teamSearch.toLowerCase())
      )
    : teamMembers;

  const TABS: { key: ActiveTab; label: string; icon: React.ElementType; color: string }[] = [
    { key: "kpis",     label: "Team KPIs",         icon: BarChart3,  color: "from-violet-500 to-purple-600" },
    ...(permissions?.activity_logs !== false ? [{ key: "activity" as ActiveTab, label: "Activity Log",      icon: Activity,    color: "from-blue-500 to-indigo-600" }] : []),
    { key: "team",     label: "Team Management",   icon: Users,       color: "from-teal-500 to-cyan-600" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
      </div>
    );
  }

  // Derive basic KPI stats from activities and team data
  const totalActivities = activities.length;
  const recentActivities = activities.slice(0, 20);
  const totalTeamMembers = teamMembers.length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-sm">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">IT Manager Dashboard</h2>
          <p className="text-sm text-slate-400">Team oversight — activity, KPIs, and team management</p>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Team Members", value: totalTeamMembers, icon: Users, gradient: "from-blue-500 to-blue-600", iconBg: "bg-blue-100", iconColor: "text-blue-600" },
          { label: "Recent Activities", value: totalActivities, icon: Activity, gradient: "from-emerald-500 to-emerald-600", iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
          { label: "Avg Resolution", value: kpis?.avgResolutionTime || "N/A", icon: Clock, gradient: "from-amber-500 to-orange-500", iconBg: "bg-amber-100", iconColor: "text-amber-600" },
          { label: "SLA Compliance", value: kpis?.slaCompliance ? `${kpis.slaCompliance}%` : "N/A", icon: TrendingUp, gradient: "from-violet-500 to-purple-600", iconBg: "bg-violet-100", iconColor: "text-violet-600" },
        ].map((card, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-300 hover:-translate-y-0.5">
            <div className="flex flex-col gap-3">
              <div className={`w-10 h-10 ${card.iconBg} rounded-xl flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{card.label}</p>
              <span className="text-2xl font-extrabold text-slate-800">{card.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === key
                ? "bg-violet-600 text-white shadow-sm"
                : "bg-white border border-gray-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Activity Log Tab */}
      {activeTab === "activity" && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              Team Activity Log
            </h3>
            <span className="text-xs text-slate-400">{recentActivities.length} recent events</span>
          </div>
          <div className="divide-y divide-gray-50 max-h-[480px] overflow-y-auto">
            {recentActivities.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">No recent activity</div>
            ) : (
              recentActivities.map((act: any, i: number) => (
                <div key={act.id || i} className="px-5 py-3.5 hover:bg-blue-50/30 transition-colors flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    act.action?.includes("VALIDATED") ? "bg-green-100" :
                    act.action?.includes("REJECTED") ? "bg-red-100" :
                    act.action?.includes("SQL") ? "bg-blue-100" :
                    "bg-gray-100"
                  }`}>
                    {act.action?.includes("VALIDATED") ? <CheckCircle className="w-4 h-4 text-green-600" /> :
                     act.action?.includes("REJECTED") ? <AlertTriangle className="w-4 h-4 text-red-500" /> :
                     <Activity className="w-4 h-4 text-gray-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700">{act.action?.replace(/_/g, " ")}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {act.performedBy} {act.ticketId ? `· ${act.ticketId}` : ""}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 mt-0.5">
                    {new Date(act.timestamp).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* KPIs Tab */}
      {activeTab === "kpis" && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-violet-500" />
              Team Performance Metrics
            </h3>
            {kpis ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "Tickets Resolved", value: kpis.ticketsResolved || 0, color: "text-green-600", bg: "bg-green-50", borderColor: "border-green-200" },
                  { label: "Avg Response Time", value: kpis.avgResponseTime || "N/A", color: "text-blue-600", bg: "bg-blue-50", borderColor: "border-blue-200" },
                  { label: "Customer Satisfaction", value: kpis.customerSatisfaction ? `${kpis.customerSatisfaction}%` : "N/A", color: "text-purple-600", bg: "bg-purple-50", borderColor: "border-purple-200" },
                  { label: "Open Tickets", value: kpis.openTickets || 0, color: "text-amber-600", bg: "bg-amber-50", borderColor: "border-amber-200" },
                  { label: "SLA Breaches", value: kpis.slaBreaches || 0, color: "text-red-600", bg: "bg-red-50", borderColor: "border-red-200" },
                  { label: "First Call Resolution", value: kpis.firstCallResolution ? `${kpis.firstCallResolution}%` : "N/A", color: "text-teal-600", bg: "bg-teal-50", borderColor: "border-teal-200" },
                ].map((kpi, i) => (
                  <div key={i} className={`${kpi.bg} border ${kpi.borderColor} rounded-xl p-4 text-center`}>
                    <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                    <p className="text-xs text-slate-500 mt-1">{kpi.label}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm">
                <p>KPI data will display when team metrics are configured.</p>
                <p className="text-xs mt-1">Contact your admin to set up team-scoped KPIs.</p>
              </div>
            )}
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

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-500" />
                Team Members
              </h3>
              <span className="text-xs text-slate-400">{filteredMembers.length} members</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-slate-500 text-xs uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Matricule</th>
                    <th className="px-5 py-3 font-semibold">Name</th>
                    <th className="px-5 py-3 font-semibold">Role</th>
                    <th className="px-5 py-3 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-slate-400">
                        {teamSearch ? `No members match "${teamSearch}"` : "No team members found."}
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((m: any) => (
                      <tr key={m.matricule} className="hover:bg-teal-50/30 transition-colors">
                        <td className="px-5 py-3 font-mono text-xs text-slate-600">{m.matricule}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                              {m.name?.[0]}{m.prenom?.[0] || ""}
                            </div>
                            <span className="font-medium text-slate-700">{m.name} {m.prenom}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border bg-blue-50 text-blue-600 border-blue-200">
                            {m.role}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${m.is_active ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${m.is_active ? "bg-emerald-500" : "bg-red-400"}`} />
                            {m.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
