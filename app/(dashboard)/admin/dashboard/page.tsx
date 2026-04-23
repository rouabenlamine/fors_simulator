import React from "react";
import { LayoutDashboard, Activity, Database, Users, Ticket, ShieldAlert, Zap, TrendingUp } from "lucide-react";
import { getAdminDashboardStats } from "@/app/actions/admin-actions";

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  const cards = [
    { label: "Total Users", icon: Users, val: stats.totalUsers.toString(), desc: "Registered accounts", gradient: "from-blue-500 to-blue-600", lightBg: "bg-blue-50", lightColor: "text-blue-600", iconBg: "bg-blue-100" },
    { label: "Active Sessions", icon: Activity, val: stats.activeConnections.toString(), desc: "Live connections", gradient: "from-emerald-500 to-emerald-600", lightBg: "bg-emerald-50", lightColor: "text-emerald-600", iconBg: "bg-emerald-100" },
    { label: "SQL Today", icon: Database, val: stats.sqlRuns.toString(), desc: "Queries executed", gradient: "from-violet-500 to-violet-600", lightBg: "bg-violet-50", lightColor: "text-violet-600", iconBg: "bg-violet-100" },
    { label: "Total Tickets", icon: Ticket, val: stats.totalTickets.toString(), desc: "All-time tickets", gradient: "from-amber-500 to-orange-500", lightBg: "bg-amber-50", lightColor: "text-amber-600", iconBg: "bg-amber-100" },
    { label: "Pending", icon: TrendingUp, val: stats.pendingTickets.toString(), desc: "Awaiting action", gradient: "from-rose-500 to-pink-500", lightBg: "bg-rose-50", lightColor: "text-rose-600", iconBg: "bg-rose-100" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-4 px-2">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
          <LayoutDashboard className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Admin Control Panel</h1>
          <p className="text-sm text-slate-500">System overview: connections, queries, and security events.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((s, i) => (
          <div key={i} className="group bg-white border border-gray-200 p-5 rounded-2xl shadow-sm overflow-hidden hover:shadow-md hover:border-gray-300 transition-all duration-300 hover:-translate-y-0.5">
            <div className="flex flex-col gap-3">
              <div className={`w-10 h-10 ${s.iconBg} rounded-xl flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.lightColor}`} />
              </div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{s.label}</p>
              <span className="text-3xl font-extrabold text-slate-800">{s.val}</span>
              <p className="text-[10px] text-slate-400">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Security Anomalies */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          Recent Security Events
        </h2>
        {stats.anomalies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-slate-500 text-sm font-medium">No recent anomalies. System is healthy.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.anomalies.map((a: any, i: number) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-rose-50 border border-rose-100 hover:bg-rose-100/60 transition-colors">
                <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-rose-800">{a.action?.replace(/_/g, " ")}</p>
                  <p className="text-xs text-slate-500 mt-1 font-mono truncate">{a.details}</p>
                  <p className="text-[10px] text-slate-400 mt-2">{new Date(a.created_at).toLocaleString()}</p>
                </div>
                <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-1 rounded border border-gray-200 shrink-0">
                  {a.user_matricule}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
