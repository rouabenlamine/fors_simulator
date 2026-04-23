"use client";

import { useState } from "react";
import { Settings, Shield, BarChart3, Activity, Cpu, Save, RotateCcw, Pencil, Check, X } from "lucide-react";

interface KpiConfig {
  id: string;
  label: string;
  category: string;
  enabled: boolean;
  target: number;
  current: number;
  unit: string;
}

const INITIAL_CONFIGS: KpiConfig[] = [
  { id: "sla-001",  label: "SLA Compliance Rate",    category: "SLA",            enabled: true,  target: 95, current: 87, unit: "%" },
  { id: "sla-002",  label: "Avg Resolution Time",     category: "SLA",            enabled: true,  target: 4,  current: 3.2, unit: "h" },
  { id: "sla-003",  label: "First Call Resolution",   category: "SLA",            enabled: true,  target: 80, current: 74, unit: "%" },
  { id: "perf-001", label: "AI Approval Rate",        category: "AI Performance", enabled: true,  target: 85, current: 84, unit: "%" },
  { id: "perf-002", label: "Avg GOST Confidence",     category: "AI Performance", enabled: true,  target: 88, current: 87, unit: "%" },
  { id: "perf-003", label: "SQL Proposal Accuracy",   category: "AI Performance", enabled: true,  target: 90, current: 82, unit: "%" },
  { id: "vol-001",  label: "Tickets per Day",         category: "Volume",         enabled: true,  target: 30, current: 24, unit: "" },
  { id: "vol-002",  label: "Open Incidents",          category: "Volume",         enabled: false, target: 10, current: 7,  unit: "" },
  { id: "qual-001", label: "User Satisfaction",       category: "Quality",        enabled: true,  target: 4.5, current: 4.2, unit: "/5" },
  { id: "qual-002", label: "Reopen Rate",             category: "Quality",        enabled: false, target: 5,  current: 8,  unit: "%" },
];

const CAT_COLORS: Record<string, string> = {
  "SLA":            "bg-blue-100 text-blue-700",
  "AI Performance": "bg-purple-100 text-purple-700",
  "Volume":         "bg-orange-100 text-orange-700",
  "Quality":        "bg-green-100 text-green-700",
};

export default function KpiConfigPage() {
  const [configs, setConfigs]   = useState<KpiConfig[]>(INITIAL_CONFIGS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal]   = useState("");
  const [saved, setSaved]       = useState(false);
  const [toast, setToast]       = useState<string | null>(null);

  const enabled = configs.filter((k) => k.enabled).length;
  const aiCount = configs.filter((k) => k.category === "AI Performance").length;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function toggleKpi(id: string) {
    setConfigs((prev) => prev.map((k) => k.id === id ? { ...k, enabled: !k.enabled } : k));
    setSaved(false);
  }

  function startEditTarget(kpi: KpiConfig) {
    setEditingId(kpi.id);
    setEditVal(String(kpi.target));
  }

  function commitEditTarget(id: string) {
    const val = parseFloat(editVal);
    if (!isNaN(val) && val > 0) {
      setConfigs((prev) => prev.map((k) => k.id === id ? { ...k, target: val } : k));
      setSaved(false);
    }
    setEditingId(null);
  }

  function saveAll() {
    setSaved(true);
    showToast(`${enabled} KPIs saved successfully`);
  }

  function resetAll() {
    setConfigs(INITIAL_CONFIGS);
    setSaved(false);
    setEditingId(null);
    showToast("Configuration reset to defaults");
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-teal-600 text-white px-4 py-3 rounded-xl shadow-xl text-sm font-medium z-50">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-cyan-700 flex items-center justify-center shadow-sm">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">KPI Configuration</h2>
            <p className="text-sm text-slate-400">Manage which KPIs are tracked and their targets</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-full">
          <Shield className="w-3.5 h-3.5" />
          Admin only
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-800">{configs.length}</p>
            <p className="text-[10px] text-slate-400">Total KPIs</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
            <Activity className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-800">{enabled}</p>
            <p className="text-[10px] text-slate-400">Active</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-800">{aiCount}</p>
            <p className="text-[10px] text-slate-400">AI metrics</p>
          </div>
        </div>
      </div>

      {/* KPI list */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">KPI Registry</h3>
          <p className="text-[10px] text-slate-400">Click the toggle to enable/disable · Click the target to edit it</p>
        </div>
        <div className="divide-y divide-gray-50">
          {configs.map((kpi) => {
            const pct = Math.round((kpi.current / kpi.target) * 100);
            const onTarget = kpi.current >= kpi.target;
            const isEditing = editingId === kpi.id;
            return (
              <div key={kpi.id} className={`px-5 py-4 flex items-center gap-4 transition-opacity ${!kpi.enabled ? "opacity-40" : ""}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-slate-800">{kpi.label}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${CAT_COLORS[kpi.category]}`}>
                      {kpi.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${onTarget ? "bg-green-500" : "bg-orange-400"}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 shrink-0 flex items-center gap-1">
                      {kpi.current}{kpi.unit} /&nbsp;
                      {isEditing ? (
                        <span className="flex items-center gap-1">
                          <input
                            autoFocus
                            value={editVal}
                            onChange={(e) => setEditVal(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitEditTarget(kpi.id);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            className="w-14 px-1.5 py-0.5 rounded border border-teal-400 text-xs text-slate-800 focus:outline-none"
                          />
                          {kpi.unit}
                          <button onClick={() => commitEditTarget(kpi.id)} className="text-teal-600 hover:text-teal-800"><Check className="w-3 h-3" /></button>
                          <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                        </span>
                      ) : (
                        <button
                          onClick={() => kpi.enabled && startEditTarget(kpi)}
                          className={`flex items-center gap-1 group ${kpi.enabled ? "hover:text-teal-600 cursor-pointer" : "cursor-default"}`}
                          title={kpi.enabled ? "Click to edit target" : ""}
                        >
                          {kpi.target}{kpi.unit} target
                          {kpi.enabled && <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />}
                        </button>
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-bold ${onTarget ? "text-green-600" : "text-orange-500"}`}>
                    {pct}%
                  </span>
                  <button
                    onClick={() => toggleKpi(kpi.id)}
                    title={kpi.enabled ? "Disable this KPI" : "Enable this KPI"}
                    className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-400 ${
                      kpi.enabled ? "bg-teal-500 justify-end" : "bg-gray-300 justify-start"
                    }`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full shadow-sm pointer-events-none" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Save / Reset */}
        <div className="px-5 py-4 border-t border-gray-100 bg-slate-50 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            {saved ? (
              <span className="text-green-600 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Configuration saved
              </span>
            ) : (
              "Unsaved changes — click Save to apply"
            )}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={resetAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-slate-500 hover:bg-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
            <button
              onClick={saveAll}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-xs font-semibold text-white transition-colors shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
