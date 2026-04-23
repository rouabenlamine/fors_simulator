"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Settings2, Save, Loader2, Check, Eye, EyeOff, Shield, Info } from "lucide-react";
import { getAllViewPermissions, updateViewPermissionsAction } from "@/app/actions/view-permissions-actions";
import { VIEW_COMPONENTS } from "@/lib/view-components";
import type { RolePermissions } from "@/lib/view-components";

const ROLE_LABELS: Record<string, { label: string; shortLabel: string; color: string; bg: string; border: string; ring: string; iconBg: string }> = {
  it_support: { label: "IT Support", shortLabel: "Support", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", ring: "ring-blue-200", iconBg: "bg-blue-100" },
  it_manager: { label: "IT Manager", shortLabel: "Manager", color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200", ring: "ring-violet-200", iconBg: "bg-violet-100" },
  it_report:  { label: "IT Reporter", shortLabel: "Reporter", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", ring: "ring-emerald-200", iconBg: "bg-emerald-100" },
  admin:      { label: "Admin", shortLabel: "Admin", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200", ring: "ring-rose-200", iconBg: "bg-rose-100" },
};

export default function ViewControlPage() {
  const [permissions, setPermissions] = useState<Record<string, RolePermissions>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllViewPermissions();
      setPermissions(data);
    } catch { }
    setLoading(false);
  }, []);

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

  // Group components by category
  const categories = Array.from(new Set(VIEW_COMPONENTS.map(c => c.category)));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-4 px-2">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200">
            <Settings2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">View Control Panel</h1>
            <p className="text-sm text-slate-500">
              Toggle UI components on/off for each role. Changes apply on next page load.
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <Info className="w-4 h-4 text-blue-500 shrink-0" />
        <p className="text-xs text-blue-700">
          Toggling a component <strong>off</strong> hides it from the user&apos;s interface. Toggle it back <strong>on</strong> to restore visibility. Click <strong>Save</strong> to persist changes.
        </p>
      </div>

      {/* Per-role sections */}
      {Object.entries(ROLE_LABELS).filter(([role]) => permissions[role]).map(([role, meta]) => {
        const enabledCount = Object.values(permissions[role] || {}).filter(Boolean).length;
        const totalCount = VIEW_COMPONENTS.length;

        return (
          <div key={role} className={`bg-white border ${meta.border} rounded-2xl shadow-sm overflow-hidden transition-all hover:shadow-md`}>
            {/* Role Header */}
            <div className={`flex items-center justify-between px-6 py-4 ${meta.bg} border-b ${meta.border}`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 ${meta.iconBg} rounded-lg flex items-center justify-center`}>
                  <Shield className={`w-4 h-4 ${meta.color}`} />
                </div>
                <div>
                  <h2 className={`font-bold ${meta.color}`}>{meta.label}</h2>
                  <p className="text-[11px] text-slate-500">
                    {enabledCount}/{totalCount} components visible
                  </p>
                </div>
              </div>
              <button
                onClick={() => saveRole(role)}
                disabled={saving === role}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all shadow-sm ${
                  saved === role
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : saving === role
                      ? "bg-gray-100 text-gray-400 border border-gray-200"
                      : "bg-white text-slate-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98]"
                } disabled:cursor-not-allowed`}
              >
                {saving === role ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : saved === role ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                {saving === role ? "Saving..." : saved === role ? "Saved!" : "Save Changes"}
              </button>
            </div>

            {/* Components Grid */}
            <div className="p-5 space-y-5">
              {categories.map(cat => {
                const comps = VIEW_COMPONENTS.filter(c => c.category === cat);
                return (
                  <div key={cat}>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 px-1">{cat}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {comps.map(comp => {
                        const enabled = permissions[role]?.[comp.id as keyof RolePermissions] !== false;
                        return (
                          <button
                            key={comp.id}
                            onClick={() => toggle(role, comp.id)}
                            className={`group flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-all duration-200 ${
                              enabled
                                ? "bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-sm"
                                : "bg-gray-50 border-gray-100 opacity-60 hover:opacity-80 hover:bg-gray-100"
                            }`}
                          >
                            {/* Toggle indicator */}
                            <div className={`w-8 h-5 rounded-full flex items-center p-0.5 transition-all duration-300 shrink-0 ${
                              enabled ? "bg-emerald-500 justify-end" : "bg-gray-300 justify-start"
                            }`}>
                              <div className="w-4 h-4 rounded-full bg-white shadow-sm transition-all" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className={`text-xs font-semibold truncate ${enabled ? "text-slate-800" : "text-slate-400"}`}>
                                {comp.label}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate leading-relaxed">
                                {comp.description}
                              </p>
                            </div>

                            {/* Status icon */}
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
        );
      })}
    </div>
  );
}
