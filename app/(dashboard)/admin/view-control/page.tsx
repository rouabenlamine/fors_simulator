"use client";

import React, { useState, useEffect, useCallback } from "react";
import clsx from "clsx";
import {
  Settings2, Save, Loader2, Check, Eye, EyeOff, Shield, Info,
  Ticket, MessageSquare, BarChart3, Activity, Database, FileText,
  LayoutDashboard, Users, Cpu, FlaskConical, Layers, ShieldCheck,
  BookOpen, ChevronRight, Table, Lock
} from "lucide-react";
import { getAllViewPermissions, updateViewPermissionsAction } from "@/app/actions/view-permissions-actions";
import { getMyRoleAction } from "@/app/actions/admin-actions";
import { VIEW_COMPONENTS } from "@/lib/view-components";
import type { RolePermissions } from "@/lib/view-components";

// ─── Role meta ──────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, {
  label: string; color: string; bg: string; border: string;
  ring: string; iconBg: string; accent: string; dotColor: string;
}> = {
  it_support: {
    label: "IT Support Agent", color: "text-blue-600", bg: "bg-blue-50",
    border: "border-blue-200", ring: "ring-blue-200", iconBg: "bg-blue-100",
    accent: "bg-blue-500", dotColor: "bg-blue-400",
  },
  it_manager: {
    label: "IT Manager", color: "text-violet-600", bg: "bg-violet-50",
    border: "border-violet-200", ring: "ring-violet-200", iconBg: "bg-violet-100",
    accent: "bg-violet-500", dotColor: "bg-violet-400",
  },
  it_report: {
    label: "IT Reporter", color: "text-emerald-600", bg: "bg-emerald-50",
    border: "border-emerald-200", ring: "ring-emerald-200", iconBg: "bg-emerald-100",
    accent: "bg-emerald-500", dotColor: "bg-emerald-400",
  },
  admin: {
    label: "Admin", color: "text-rose-600", bg: "bg-rose-50",
    border: "border-rose-200", ring: "ring-rose-200", iconBg: "bg-rose-100",
    accent: "bg-rose-500", dotColor: "bg-rose-400",
  },
};

// ─── Dashboard layout definition per role ────────────────────────────────────

type NavPage = {
  label: string;
  icon: React.ElementType;
  componentId?: string;
  description: string;
  sub?: { label: string }[];
};

const ROLE_DASHBOARD_NAV: Record<string, NavPage[]> = {
  it_support: [
    { label: "Tickets", icon: Ticket, componentId: "tickets_list", description: "Incident ticket queue" },
    { label: "Analysis Workspace", icon: LayoutDashboard, componentId: "incident_analysis", description: "AI-driven root cause analysis" },
    { label: "Analysis Lab", icon: FlaskConical, componentId: "analysis_lab", description: "SQL execution laboratory" },
    { label: "Chat History", icon: MessageSquare, componentId: "chat_bubble", description: "GOST AI chat sessions" },
    {
      label: "FORS Explorer", icon: Layers, componentId: "fors_explorer", description: "Menus, tables, transactions",
      sub: [{ label: "Menus" }, { label: "Transactions" }, { label: "Tables" }, { label: "Fields" }, { label: "Indexes" }],
    },
    { label: "KPIs", icon: BarChart3, componentId: "kpi_widgets", description: "Live KPI & metrics" },
    { label: "Activity Log", icon: Activity, componentId: "activity_logs", description: "User action history" },
  ],
  it_report: [
    { label: "Overview", icon: LayoutDashboard, description: "Reports dashboard" },
    { label: "KPI", icon: FileText, componentId: "kpi_widgets", description: "Key performance indicators" },
    { label: "Activity Log", icon: Activity, componentId: "activity_logs", description: "Audit trail" },
  ],
  it_manager: [
    { label: "Team Activity", icon: Activity, componentId: "activity_logs", description: "Team audit trail" },
    { label: "KPIs", icon: BarChart3, componentId: "kpi_widgets", description: "Performance metrics" },
    { label: "Team Management", icon: Users, componentId: "user_management", description: "Manage IT Support users" },
  ],
  admin: [
    { label: "Control Panel", icon: LayoutDashboard, componentId: "admin_control_panel", description: "Admin dashboard" },
    { label: "User Management", icon: Users, componentId: "user_management", description: "Create & manage users" },
    { label: "Audit Logs", icon: Activity, componentId: "audit_logs", description: "Full audit trail" },
    {
      label: "FORS Explorer", icon: Layers, componentId: "fors_explorer", description: "Database explorer",
      sub: [{ label: "Menus" }, { label: "Transactions" }, { label: "Tables" }, { label: "Fields" }, { label: "Indexes" }],
    },
    { label: "View Permissions", icon: ShieldCheck, componentId: "view_permissions_management", description: "Component visibility control" },
    { label: "Database Explorer", icon: Database, componentId: "system_db_explorer", description: "Raw SQL console & introspection" },
  ],
};

// Superadmin is always shown as fixed (not configurable here)
const SUPERADMIN_PREVIEW: NavPage[] = [
  { label: "Control Panel", icon: LayoutDashboard, componentId: "admin_control_panel", description: "Superadmin dashboard" },
  { label: "User Management", icon: Users, componentId: "user_management", description: "Full user directory" },
  { label: "Integration Hub", icon: Cpu, componentId: "integration_hub", description: "n8n, ServiceNow, AI settings" },
  { label: "Audit Logs", icon: Activity, componentId: "audit_logs", description: "Global audit trail" },
  { label: "FORS Explorer", icon: Database, componentId: "fors_explorer", description: "Menus, tables, transactions" },
  { label: "View Permissions", icon: ShieldCheck, componentId: "view_permissions_management", description: "Role-based UI control" },
  { label: "Database Explorer", icon: Table, componentId: "system_db_explorer", description: "Full DB introspection + SQL console" },
];

// ─── Mini sidebar preview ─────────────────────────────────────────────────────

function MiniSidebar({ nav, permissions, role, accentColor }: {
  nav: NavPage[];
  permissions: RolePermissions | null;
  role: string;
  accentColor: string;
}) {
  const [openSub, setOpenSub] = useState<string | null>(null);

  return (
    <div className="bg-[#0B1120] rounded-xl overflow-hidden shadow-lg border border-white/5 w-full">
      {/* Mini brand bar - Updated to match current branding */}
      <div className="px-3 py-3 border-b border-white/5 flex items-center gap-2">
        <img
          src="/purpleFors.png"
          alt="FORS"
          className="w-5 h-5 object-contain rounded-md shadow-lg shadow-indigo-950/20"
        />
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-white leading-none tracking-tight">FORS <span className="text-indigo-400">Simulator</span></span>
          <span className="text-[6px] font-bold text-white/30 uppercase tracking-widest mt-0.5">Enterprise</span>
        </div>
      </div>

      {/* Nav items */}
      <div className="py-1.5 space-y-0.5 px-1.5">
        {nav.map(({ label, icon: Icon, componentId, description, sub }) => {
          const isHidden = componentId && permissions
            ? permissions[componentId as keyof RolePermissions] === false
            : false;

          return (
            <div key={label}>
              <div
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold cursor-pointer transition-all ${isHidden
                  ? "text-slate-600 line-through opacity-40"
                  : "text-slate-300 hover:bg-white/5"
                  }`}
                onClick={() => sub && setOpenSub(openSub === label ? null : label)}
                title={isHidden ? `Hidden — "${label}" is toggled off` : description}
              >
                <Icon className={`w-3 h-3 shrink-0 ${isHidden ? "text-slate-600" : "text-slate-400"}`} />
                <span className="flex-1 truncate">{label}</span>
                {isHidden && <Lock className="w-2.5 h-2.5 text-slate-600 shrink-0" />}
                {sub && !isHidden && (
                  <ChevronRight className={`w-2.5 h-2.5 text-slate-600 transition-transform ${openSub === label ? "rotate-90" : ""}`} />
                )}
              </div>
              {sub && openSub === label && !isHidden && (
                <div className="ml-5 pl-2 border-l border-slate-700 space-y-0.5 mb-0.5">
                  {sub.map(s => (
                    <div key={s.label} className="text-[9px] text-slate-500 py-1 px-2 hover:text-slate-400 cursor-pointer rounded">{s.label}</div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* logout stub */}
      <div className="px-3 py-2 border-t border-white/5 mt-1">
        <div className="text-[9px] text-slate-600 font-medium">Logout</div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ViewControlPage() {
  const [permissions, setPermissions] = useState<Record<string, RolePermissions>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<string>("it_support");
  const [myRole, setMyRole] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, role] = await Promise.all([
        getAllViewPermissions(),
        getMyRoleAction()
      ]);
      setPermissions(data);
      setMyRole(role);

      // If activeRole is not in the allowed roles, switch to the first available
      const allowedRoles = Object.keys(data);
      if (allowedRoles.length > 0 && !allowedRoles.includes(activeRole)) {
        setActiveRole(allowedRoles[0]);
      }
    } catch { }
    setLoading(false);
  }, [activeRole]);

  useEffect(() => { load(); }, [load]);

  function toggle(role: string, componentId: string) {
    setPermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [componentId]: !prev[role]?.[componentId as keyof RolePermissions],
      }
    }));
  }

  async function saveRole(role: string) {
    setSaving(role);
    setSaved(null);
    try {
      const result = await updateViewPermissionsAction(role, permissions[role]);
      if (!result.success) {
        alert(result.error || "Failed to save.");
      } else {
        setSaved(role);
        setTimeout(() => setSaved(null), 2500);
      }
    } catch (e: any) {
      alert(e.message);
    }
    setSaving(null);
  }

  const categories = Array.from(new Set(VIEW_COMPONENTS.map(c => c.category)));

  // Calculate role-relevant components for the counter
  const roleNavIds = (ROLE_DASHBOARD_NAV[activeRole] || []).map(n => n.componentId).filter(Boolean);
  const isSystemAdmin = activeRole === "admin";
  const relevantCompsList = VIEW_COMPONENTS.filter(comp => {
    if (roleNavIds.includes(comp.id)) return true;
    if (comp.category === "Header") return true;
    if (comp.category === "System" && isSystemAdmin) return true;
    if (comp.category === "Dashboard" || comp.category === "Management" || comp.category === "Data") return true;
    return false;
  });

  const totalComponents = relevantCompsList.length;
  const enabledCount = relevantCompsList.filter(
    c => permissions[activeRole]?.[c.id as keyof RolePermissions] !== false
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const meta = ROLE_LABELS[activeRole];

  return (
    <div className="max-w-4xl mx-auto space-y-3 py-4 px-6">

      {/* Minimalist Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-100 shrink-0">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-800 tracking-tight leading-none">
              View <span className="text-indigo-500">Permissions</span>
            </h1>
            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">UI Control & View Permissions</p>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-center gap-4 bg-indigo-50/50 backdrop-blur-sm border border-indigo-100 rounded-2xl px-6 py-4">
        <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
          <Info className="w-4 h-4 text-indigo-600" />
        </div>
        <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
          The <strong>Dashboard Preview</strong> reflects live visibility changes for the selected role.
        </p>
      </div>

      {/* Superadmin fixed preview — ONLY for Superadmin caller */}
      {myRole === "superadmin" && (
        <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-800">
          <div className="flex items-center justify-between px-8 py-5 bg-white/5 border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl flex items-center justify-center border border-white/10 shadow-lg">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-widest">Superadmin Matrix</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Root Access • Locked Protocols</p>
              </div>
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 bg-white/5 px-4 py-1.5 rounded-full border border-white/10">immutable_state</span>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
              {SUPERADMIN_PREVIEW.map(({ label, icon: Icon, description }) => (
                <div key={label} className="flex flex-col items-center gap-2 p-4 bg-white/5 border border-white/5 rounded-2xl text-center group hover:bg-white/10 transition-all">
                  <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-4 h-4 text-indigo-400" />
                  </div>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-tight">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Role selector tabs */}
      <div className="flex flex-wrap items-center gap-2 px-2">
        {Object.entries(ROLE_LABELS).filter(([role]) => permissions[role]).map(([role, m]) => (
          <button
            key={role}
            onClick={() => setActiveRole(role)}
            className={clsx(
              "flex items-center gap-2.5 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border",
              activeRole === role
                ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
                : "bg-white text-slate-400 border-slate-100 hover:text-slate-600 hover:border-slate-200"
            )}
          >
            <div className={clsx("w-1.5 h-1.5 rounded-full", activeRole === role ? "bg-white animate-pulse" : "bg-slate-200")} />
            {m.label}
          </button>
        ))}
      </div>

      {/* Active role editor */}
      {meta && permissions[activeRole] && (
        <div key={activeRole} className="bg-white/40 backdrop-blur-3xl border border-white/80 rounded-[2.5rem] shadow-sm overflow-hidden">
          {/* Role header */}
          <div className="flex items-center justify-between px-6 py-4 bg-indigo-50/20 border-b border-indigo-100/30">
            <div className="flex items-center gap-3">
              <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center shadow-sm", meta.iconBg)}>
                <Shield className={clsx("w-3.5 h-3.5", meta.color)} />
              </div>
              <div>
                <h2 className={clsx("text-[13px] font-black uppercase tracking-tight", meta.color)}>{meta.label}</h2>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">
                  {enabledCount}/{totalComponents} Modules Active
                </p>
              </div>
            </div>
            <button
              onClick={() => saveRole(activeRole)}
              disabled={saving === activeRole}
              className={clsx(
                "flex items-center gap-2 px-5 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95",
                saved === activeRole
                  ? "bg-emerald-500 text-white shadow-emerald-100"
                  : saving === activeRole
                    ? "bg-violet-200 text-violet-400 cursor-not-allowed"
                    : "bg-violet-600 text-white hover:bg-violet-400"
              )}
            >
              {saving === activeRole ? <Loader2 className="w-3 h-3 animate-spin" /> : saved === activeRole ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
              {saving === activeRole ? "Syncing..." : saved === activeRole ? "Saved" : "Apply Changes"}
            </button>
          </div>

          {/* Two-column layout: preview + controls */}
          <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100">

            {/* LEFT: Dashboard preview */}
            <div className="lg:w-56 xl:w-60 shrink-0 p-4 bg-slate-50/30">
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">Live Dashboard Interface</p>
              <div className="scale-[0.8] origin-top">
                <MiniSidebar
                  nav={ROLE_DASHBOARD_NAV[activeRole] || []}
                  permissions={permissions[activeRole]}
                  role={activeRole}
                  accentColor={meta.accent}
                />
              </div>
            </div>

            {/* RIGHT: Toggle controls */}
            <div className="flex-1 p-4 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
              {categories.map(cat => {
                const comps = VIEW_COMPONENTS.filter(c => c.category === cat);
                const roleNavIds = (ROLE_DASHBOARD_NAV[activeRole] || []).map(n => n.componentId).filter(Boolean);

                const isSystemAdmin = activeRole === "admin";
                const relevantComps = comps.filter(comp => {
                  if (roleNavIds.includes(comp.id)) return true;
                  if (cat === "Header") return true;
                  if (cat === "System" && isSystemAdmin) return true;
                  if (cat === "Dashboard" || cat === "Management" || cat === "Data") return true;
                  return false;
                });

                if (relevantComps.length === 0) return null;

                return (
                  <div key={`${activeRole}-${cat}`}>
                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">{cat} Modules</h3>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                      {relevantComps.map(comp => {
                        const enabled = permissions[activeRole]?.[comp.id as keyof RolePermissions] !== false;
                        const isInNav = roleNavIds.includes(comp.id);

                        let displayLabel: string = comp.label;
                        if (comp.id === "user_management" && activeRole === "it_manager") {
                          displayLabel = "Team Management";
                        }
                        return (
                          <button
                            key={comp.id}
                            onClick={() => toggle(activeRole, comp.id)}
                            className="group flex items-center gap-3 px-4 py-3 rounded-[1.2rem] border text-left transition-all duration-300 bg-white border-slate-200 hover:border-indigo-400 hover:shadow-md hover:shadow-indigo-50"
                          >
                            {/* Toggle — only element that changes color */}
                            <div className={clsx(
                              "w-8 h-5 rounded-full flex items-center p-0.5 transition-all duration-500 shrink-0",
                              enabled ? "bg-emerald-500" : "bg-slate-200"
                            )}>
                              <div className={clsx(
                                "w-3.5 h-3.5 rounded-full bg-white shadow-sm transform transition-transform duration-500",
                                enabled ? "translate-x-3" : "translate-x-0"
                              )} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-[10px] font-black uppercase tracking-tight truncate text-slate-800">
                                  {displayLabel}
                                </p>
                              </div>
                              <p className="text-[8px] font-bold text-slate-400 truncate mt-0.5">{comp.description}</p>
                            </div>

                            <div className="shrink-0 text-indigo-500">
                              {enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}
