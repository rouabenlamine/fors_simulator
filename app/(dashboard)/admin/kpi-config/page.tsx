"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Settings, Save, Plus, Check, X, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { getKpiConfigs, updateKpiConfigAction, createKpiConfigAction } from "@/app/actions/admin-actions";

export default function KpiConfigPage() {
  const [kpis, setKpis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", category: "sla", description: "", sql_query: "" });
  const [creating, setCreating] = useState(false);
  const [edits, setEdits] = useState<Record<string, any>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try { setKpis(await getKpiConfigs()); setEdits({}); } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function setEdit(id: string, field: string, value: any) {
    setEdits(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: value } }));
  }

  async function saveKpi(kpi: any) {
    const changes = edits[kpi.id];
    if (!changes) return;
    setSavingId(kpi.id);
    try { await updateKpiConfigAction(kpi.id, changes); await load(); } catch (e: any) { alert(e.message); }
    setSavingId(null);
  }

  async function toggleKpi(kpi: any) {
    setSavingId(kpi.id);
    try { await updateKpiConfigAction(kpi.id, { isEnabled: !kpi.isEnabled }); await load(); } catch (e: any) { alert(e.message); }
    setSavingId(null);
  }

  async function handleCreate() {
    if (!createForm.name.trim()) return;
    setCreating(true);
    try { await createKpiConfigAction(createForm); setShowCreate(false); setCreateForm({ name: "", category: "sla", description: "", sql_query: "" }); await load(); } catch (e: any) { alert(e.message); }
    setCreating(false);
  }

  const categoryColor = (cat: string) => {
    const map: Record<string, string> = {
      sla: "text-rose-600 bg-rose-50 border-rose-200",
      quality: "text-violet-600 bg-violet-50 border-violet-200",
      performance: "text-emerald-600 bg-emerald-50 border-emerald-200",
      volume: "text-amber-600 bg-amber-50 border-amber-200",
      knowledge: "text-blue-600 bg-blue-50 border-blue-200",
    };
    return map[cat] || "text-gray-600 bg-gray-50 border-gray-200";
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5 py-4 px-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">KPI Configuration</h1>
            <p className="text-sm text-slate-500">Define SLA targets, toggle visibility, and manage KPI metrics.</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl shadow-sm shadow-blue-200 transition-all font-semibold hover:shadow-md active:scale-[0.98]">
          <Plus className="w-4 h-4" />
          Add KPI
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>
      ) : kpis.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
          <Settings className="w-10 h-10 text-gray-300" />
          <p className="text-slate-400 text-sm">No KPIs configured. Click &quot;Add KPI&quot; to create one.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {kpis.map(kpi => {
            const localEdits = edits[kpi.id] || {};
            const hasChanges = Object.keys(localEdits).length > 0;
            return (
              <div key={kpi.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleKpi(kpi)} className="transition-colors" title={kpi.isEnabled ? "Disable" : "Enable"}>
                      {kpi.isEnabled ? <ToggleRight className="w-7 h-7 text-emerald-500" /> : <ToggleLeft className="w-7 h-7 text-gray-300" />}
                    </button>
                    <div>
                      <h3 className={`font-bold ${kpi.isEnabled ? "text-slate-800" : "text-slate-400 line-through"}`}>{kpi.name}</h3>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {kpi.kpiId || kpi.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${categoryColor(kpi.category)}`}>{kpi.category || "general"}</span>
                    {hasChanges && (
                      <button onClick={() => saveKpi(kpi)} disabled={savingId === kpi.id} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-sm">
                        <Save className="w-3 h-3" />
                        {savingId === kpi.id ? "Saving..." : "Save"}
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Name</label>
                    <input defaultValue={kpi.name} onChange={e => setEdit(kpi.id, "name", e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                    <select defaultValue={kpi.category} onChange={e => setEdit(kpi.id, "category", e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-400 cursor-pointer transition-all">
                      {["sla", "performance", "volume", "quality", "knowledge"].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
                    <input defaultValue={kpi.description || ""} onChange={e => setEdit(kpi.id, "description", e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all" />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">SQL Query</label>
                  <textarea defaultValue={kpi.sql_query || ""} onChange={e => setEdit(kpi.id, "sql_query", e.target.value)} rows={2} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-indigo-600 font-mono focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 resize-none transition-all" placeholder="SELECT COUNT(*) FROM tickets WHERE ..." />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-slate-800">Add KPI Metric</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Name *</label>
                <input value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100" placeholder="SLA Breach Count" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Category</label>
                <select value={createForm.category} onChange={e => setCreateForm({ ...createForm, category: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-400 cursor-pointer">
                  {["sla", "performance", "volume", "quality", "knowledge"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Description</label>
                <input value={createForm.description} onChange={e => setCreateForm({ ...createForm, description: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">SQL Query</label>
                <textarea value={createForm.sql_query} onChange={e => setCreateForm({ ...createForm, sql_query: e.target.value })} rows={3} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-indigo-600 font-mono focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 resize-none" placeholder="SELECT COUNT(*) FROM ..." />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">Cancel</button>
              <button onClick={handleCreate} disabled={creating} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 text-sm font-semibold rounded-xl transition-all shadow-sm">
                <Check className="w-4 h-4" />
                {creating ? "Creating..." : "Create KPI"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
