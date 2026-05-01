"use client";

import React, { useState, useEffect, useCallback } from "react";
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
      {/* Mini brand bar */}
      <div className="px-3 py-2.5 border-b border-white/5 flex items-center gap-2">
        <div className={`w-5 h-5 ${accentColor} rounded-md flex items-center justify-center`}>
          <Cpu className="w-3 h-3 text-white" />
        </div>
        <span className="text-[10px] font-bold text-white uppercase tracking-wide">LEONI</span>
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
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  const meta = ROLE_LABELS[activeRole];

  return (
    <div className="max-w-7xl mx-auto space-y-5 py-4 px-2">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200">
            <Settings2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">View Permissions</h1>
            <p className="text-sm text-slate-500">Control exactly what each role sees in their dashboard.</p>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <Info className="w-4 h-4 text-blue-500 shrink-0" />
        <p className="text-xs text-blue-700">
          The <strong>Dashboard Preview</strong> on the left reflects live changes.
        </p>
      </div>

      {/* Superadmin fixed preview — ONLY for Superadmin caller */}
      {myRole === "superadmin" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800">Superadmin</h2>
                <p className="text-[11px] text-slate-400">Full access — all permissions locked on</p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">Read-only</span>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
              {SUPERADMIN_PREVIEW.map(({ label, icon: Icon, description }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 p-3 bg-slate-50 border border-slate-100 rounded-xl text-center">
                  <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                    <Icon className="w-4 h-4 text-slate-300" />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-700 leading-tight">{label}</span>
                  <span className="text-[9px] text-slate-400 leading-tight hidden sm:block">{description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Role Tabs */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(ROLE_LABELS).filter(([role]) => permissions[role]).map(([role, m]) => (
          <button
            key={role}
            onClick={() => setActiveRole(role)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${activeRole === role
                ? `${m.bg} ${m.border} ${m.color} shadow-sm`
                : "bg-white border-gray-200 text-slate-500 hover:bg-gray-50"
              }`}
          >
            <div className={`w-2 h-2 rounded-full ${activeRole === role ? m.dotColor : "bg-gray-300"}`} />
            {m.label}
          </button>
        ))}
      </div>

      {/* Active role editor */}
      {meta && permissions[activeRole] && (
        <div className={`bg-white border ${meta.border} rounded-2xl shadow-sm overflow-hidden`}>
          {/* Role header */}
          <div className={`flex items-center justify-between px-6 py-4 ${meta.bg} border-b ${meta.border}`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 ${meta.iconBg} rounded-lg flex items-center justify-center`}>
                <Shield className={`w-4 h-4 ${meta.color}`} />
              </div>
              <div>
                <h2 className={`font-bold ${meta.color}`}>{meta.label}</h2>
                <p className="text-[11px] text-slate-500">
                  {enabledCount}/{totalComponents} components enabled
                </p>
              </div>
            </div>
            <button
              onClick={() => saveRole(activeRole)}
              disabled={saving === activeRole}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all shadow-sm ${saved === activeRole
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                  : saving === activeRole
                    ? "bg-gray-100 text-gray-400 border border-gray-200"
                    : "bg-white text-slate-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                } disabled:cursor-not-allowed`}
            >
              {saving === activeRole ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved === activeRole ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Save className="w-3.5 h-3.5" />}
              {saving === activeRole ? "Saving..." : saved === activeRole ? "Saved!" : "Save Changes"}
            </button>
          </div>

          {/* Two-column layout: preview + controls */}
          <div className="flex flex-col lg:flex-row gap-0 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">

            {/* LEFT: Dashboard preview */}
            <div className="lg:w-56 xl:w-64 shrink-0 p-5 bg-gray-50/50">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Dashboard Preview</p>
              <MiniSidebar
                nav={ROLE_DASHBOARD_NAV[activeRole] || []}
                permissions={permissions[activeRole]}
                role={activeRole}
                accentColor={meta.accent}
              />
              <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">
                Items with a <Lock className="w-2.5 h-2.5 inline" /> icon are hidden from this role.
              </p>
            </div>

            {/* RIGHT: Toggle controls */}
            <div className="flex-1 p-5 space-y-5">
              {categories.map(cat => {
                const comps = VIEW_COMPONENTS.filter(c => c.category === cat);
                const roleNavIds = (ROLE_DASHBOARD_NAV[activeRole] || []).map(n => n.componentId).filter(Boolean);

                // FILTER: Only show relevant components
                const isSystemAdmin = activeRole === "admin";
                const relevantComps = comps.filter(comp => {
                  if (roleNavIds.includes(comp.id)) return true; // in their nav
                  if (cat === "Header") return true; // global header items
                  if (cat === "System" && isSystemAdmin) return true; // admin-only items
                  if (cat === "Dashboard" || cat === "Management" || cat === "Data") return true; // general dashboard features
                  return false;
                });

                if (relevantComps.length === 0) return null;

                return (
                  <div key={cat} className="animate-in fade-in slide-in-from-top-1 duration-300">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 px-1">{cat}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
                      {relevantComps.map(comp => {
                        const enabled = permissions[activeRole]?.[comp.id as keyof RolePermissions] !== false;
                        const isInNav = roleNavIds.includes(comp.id);

                        // Role-specific label override
                        let displayLabel = comp.label;
                        if (comp.id === "user_management" && activeRole === "it_manager") {
                          displayLabel = "Team Management";
                        }
                        return (
                          <button
                            key={comp.id}
                            onClick={() => toggle(activeRole, comp.id)}
                            className={`group flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-all duration-200 ${enabled
                                ? "bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-sm"
                                : "bg-gray-50 border-gray-100 opacity-60 hover:opacity-80 hover:bg-gray-100"
                              }`}
                          >
                            {/* Toggle */}
                            <div className={`w-8 h-5 rounded-full flex items-center p-0.5 transition-all duration-300 shrink-0 ${enabled ? "bg-emerald-500 justify-end" : "bg-gray-300 justify-start"
                              }`}>
                              <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <p className={`text-xs font-semibold truncate ${enabled ? "text-slate-800" : "text-slate-400"}`}>
                                  {displayLabel}
                                </p>
                                {!isInNav && (
                                  <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-1 rounded shrink-0">global</span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 truncate leading-relaxed">{comp.description}</p>
                            </div>

                            <div className={`shrink-0 transition-colors ${enabled ? "text-emerald-500" : "text-gray-300"}`}>
                              {enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
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
    </div>
  );
}
