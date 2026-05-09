"use client";

import React, { useState } from "react";
import clsx from "clsx";
import Link from "next/link";
import {
  LayoutDashboard, Activity, Database, Users, Ticket,
  ShieldAlert, Zap, TrendingUp, X, ArrowRight, Clock,
  ShieldCheck, AlertTriangle, Eye, Server, Lock, Cpu, Info,
  Settings2, FileText, Layers, Shield
} from "lucide-react";


interface Anomaly {
  id: number;
  action: string;
  details: string;
  created_at: string;
  user_matricule: string;
}

interface AdminControlPanelProps {
  stats: {
    activeConnections: number;
    sqlRuns: number;
    totalUsers: number;
    totalTickets: number;
    pendingTickets: number;
    anomalies: Anomaly[];
  };
  role: string;
}

export function AdminControlPanel({ stats, role }: AdminControlPanelProps) {
  const [selectedItem, setSelectedItem] = useState<{
    title: string;
    details: any;
    type: "stat" | "anomaly" | "function";
  } | null>(null);

  // Helper to format JSON or raw strings into readable messages
  const formatMessage = (input: string) => {
    try {
      const parsed = JSON.parse(input);
      if (typeof parsed === 'object' && parsed !== null) {
        if (parsed.message) return parsed.message;
        if (parsed.error) return parsed.error;
        return Object.entries(parsed)
          .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`)
          .join(" | ");
      }
      return input;
    } catch {
      return input;
    }
  };

  const statCards = [
    { label: "Total Users", icon: Users, val: stats.totalUsers.toString(), desc: "Registered accounts", color: "text-blue-600", bg: "bg-blue-100", details: "View and manage all registered system users and their roles." },
    { label: "Active Sessions", icon: Activity, val: stats.activeConnections.toString(), desc: "Live connections", color: "text-emerald-600", bg: "bg-emerald-100", details: "Real-time monitoring of users currently authenticated in the simulator." },
    { label: "SQL Today", icon: Database, val: stats.sqlRuns.toString(), desc: "Queries executed", color: "text-violet-600", bg: "bg-violet-100", details: "Count of raw SQL statements executed via the administrative console today." },
    { label: "Total Tickets", icon: Ticket, val: stats.totalTickets.toString(), desc: "All-time tickets", color: "text-amber-600", bg: "bg-amber-100", details: "Total volume of tickets ingested and processed across all modules." },
    { label: "Pending", icon: TrendingUp, val: stats.pendingTickets.toString(), desc: "Awaiting action", color: "text-rose-600", bg: "bg-rose-100", details: "Current backlog of active tickets requiring analysis or validation." },
  ];

  const adminFunctions = [
    { label: "User Management", icon: Users, href: "/admin/users", desc: "Manage accounts & roles", color: "text-indigo-600", bg: "bg-indigo-100" },
    { label: "KPI Configuration", icon: Settings2, href: "/admin/kpi-config", desc: "Custom KPI metrics", color: "text-violet-600", bg: "bg-violet-100" },
    { label: "Audit Logs", icon: FileText, href: "/admin/audit", desc: "Security activity logs", color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Fors Explorer", icon: Layers, href: "/database", desc: "Functional data map", color: "text-emerald-600", bg: "bg-emerald-100" },
    { label: "View Control", icon: Shield, href: "/admin/view-control", desc: "UI RBAC settings", color: "text-amber-600", bg: "bg-amber-100" },
  ];

  const superAdminFunctions = [
    ...adminFunctions,
    { label: "Integration Hub", icon: Cpu, href: "/superadmin/integrations", desc: "n8n & ServiceNow", color: "text-rose-600", bg: "bg-rose-100" },
    { label: "Database Explorer", icon: Database, href: "/superadmin/database-explorer", desc: "Direct DB inspection", color: "text-slate-700", bg: "bg-slate-200" },
  ];

  const currentFunctions = role === "superadmin" ? superAdminFunctions : adminFunctions;

  return (
    <div className="w-full space-y-6 py-6 px-8 animate-in fade-in duration-500">

      {/* Minimalist Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-100 shrink-0">
          <LayoutDashboard className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-black text-slate-800 tracking-tight">
            Control <span className="text-indigo-500">Panel</span>
          </h1>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">System Overview & Functions</p>
        </div>
      </div>

      {/* ─── Stats Grid (Old Base with New Theme) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((s, i) => (
          <div
            key={i}
            className="group bg-white/70 backdrop-blur-xl border border-white/60 p-3.5 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col gap-2"
          >
            <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center", s.bg)}>
              <s.icon className={clsx("w-4 h-4", s.color)} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
              <span className="text-xl font-black text-slate-800 tracking-tighter">{s.val}</span>
              <p className="text-[9px] text-slate-400 font-bold mt-0.5">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Admin Functions Overview ─── */}
      <div>
        <div className="flex items-center gap-2 mb-4 px-1">
          <Cpu className="w-4 h-4 text-indigo-500" />
          <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Administrative Functions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {currentFunctions.map((f, i) => (
            <Link
              key={i}
              href={f.href}
              className="group bg-white/70 backdrop-blur-xl border border-white/60 p-3.5 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex items-start gap-3"
            >
              <div className={clsx("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110", f.bg)}>
                <f.icon className={clsx("w-4 h-4", f.color)} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{f.label}</p>
                <p className="text-[9px] text-slate-400 font-bold mt-0.5 truncate">{f.desc}</p>
              </div>
              <ArrowRight className="w-3 h-3 text-slate-300 ml-auto group-hover:text-indigo-500 transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      {/* ─── Recent Security Events (Old Base with New Theme) ─── */}
      <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-4 shadow-sm">
        <h2 className="text-[14px] font-black text-slate-800 flex items-center gap-2 mb-4 uppercase tracking-tight">
          <div className="w-7 h-7 bg-rose-100 rounded-lg flex items-center justify-center shadow-sm">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          Recent Security Events
        </h2>

        {stats.anomalies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <Zap className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">System is Healthy</p>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.anomalies.map((a, i) => (
              <button
                key={i}
                onClick={() => setSelectedItem({ title: a.action.replace(/_/g, " "), details: a, type: "anomaly" })}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/50 border border-slate-100 hover:border-rose-200 hover:bg-rose-50/30 transition-all text-left group"
              >
                <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  {a.action.includes("FAILED") ? <AlertTriangle className="w-4 h-4 text-rose-500" /> : <Lock className="w-4 h-4 text-orange-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{a.action.replace(/_/g, " ")}</p>
                    <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">{a.user_matricule}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5 truncate">{formatMessage(a.details)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="text-[7px] font-bold text-slate-300 mt-0.5">{new Date(a.created_at).toLocaleDateString()}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── Blur Modal Backdrop (Whole Page) ─── */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          {/* THE BLUR COVERING THE WHOLE PAGE */}
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setSelectedItem(null)} />

          <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/60 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={clsx(
                  "w-11 h-11 rounded-xl flex items-center justify-center shadow-md",
                  selectedItem.type === "stat" ? "bg-indigo-600 text-white" : "bg-rose-500 text-white"
                )}>
                  {selectedItem.type === "stat" ? <Info className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase leading-none">{selectedItem.title}</h3>
                  <p className="text-[9px] font-black text-slate-400 mt-1.5 uppercase tracking-[0.2em]">Detailed Inspector</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="w-9 h-9 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8">
              {selectedItem.type === "stat" ? (
                <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100">
                  <p className="text-[13px] font-bold text-slate-700 leading-relaxed">
                    {selectedItem.details}
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">USER</p>
                      <p className="text-[12px] font-black text-slate-800">{(selectedItem.details as Anomaly).user_matricule}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">DATE</p>
                      <p className="text-[12px] font-black text-slate-800">
                        {new Date((selectedItem.details as Anomaly).created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>
                  <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100">
                    <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5" /> SECURITY INCIDENT LOG
                    </p>
                    <p className="text-[13px] font-bold text-rose-800 leading-relaxed">
                      {formatMessage((selectedItem.details as Anomaly).details)}
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={() => setSelectedItem(null)}
                className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-[0.98]"
              >
                Acknowledge Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
