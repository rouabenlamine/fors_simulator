"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { Settings, Save, Plus, Check, X, ToggleLeft, ToggleRight, Loader2, ChevronDown, Activity, Clock, BarChart3, ShieldCheck, BookOpen, Sparkles, AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { getKpiConfigs, updateKpiConfigAction, createKpiConfigAction, deleteKpiConfigAction } from "@/app/actions/admin-actions";

export default function KpiConfigPage() {
  const [kpis, setKpis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", category: "sla", description: "", sql_query: "" });
  const [creating, setCreating] = useState(false);
  const [edits, setEdits] = useState<Record<string, any>>({});
  const [selectedKpi, setSelectedKpi] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

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

  async function handleDelete(id: string) {
    try {
      await deleteKpiConfigAction(id);
      setDeleteTarget(null);
      setSelectedKpi(null);
      setEdits({});
      await load();
    } catch (e: any) {
      alert(e.message);
    }
  }

  const CATEGORY_MAP: Record<string, { icon: any, label: string, color: string }> = {
    sla: { icon: Clock, label: "SLA", color: "text-blue-600 bg-blue-50 border-blue-100" },
    performance: { icon: Activity, label: "Performance", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
    volume: { icon: BarChart3, label: "Volume", color: "text-amber-600 bg-amber-50 border-amber-100" },
    quality: { icon: ShieldCheck, label: "Quality", color: "text-rose-600 bg-rose-50 border-rose-100" },
    knowledge: { icon: BookOpen, label: "Knowledge", color: "text-violet-600 bg-violet-50 border-violet-100" }
  };

  return (
    <div className="w-full space-y-6 py-6 px-8 animate-in fade-in duration-700">

      {/* Minimalist Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-100 shrink-0">
            <Settings className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-800 tracking-tight">
              KPI <span className="text-indigo-500">Configuration</span>
            </h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 whitespace-nowrap">Control system KPIs and metrics.</p>
          </div>
        </div>

      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Synchronizing KPIs</p>
        </div>
      ) : kpis.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white/50 backdrop-blur-md rounded-[3rem] border-2 border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mb-2">
            <Settings className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest">No KPIs detected</p>
          <button onClick={() => setShowCreate(true)} className="text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:underline mt-2">Create First KPI</button>
        </div>
      ) : (
        <div className="bg-white/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/60 shadow-[0_20px_50px_rgba(79,70,229,0.05)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-indigo-50/30 border-b border-indigo-100/50">
                  <th className="px-8 py-5 text-left text-[9px] font-black text-indigo-900/60 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-5 text-left text-[9px] font-black text-indigo-900/60 uppercase tracking-widest">Metric Identity</th>
                  <th className="px-6 py-5 text-left text-[9px] font-black text-indigo-900/60 uppercase tracking-widest">Classification</th>
                  <th className="px-6 py-5 text-left text-[9px] font-black text-indigo-900/60 uppercase tracking-widest"> SQL Query</th>
                  <th className="px-8 py-5 text-right text-[9px] font-black text-indigo-900/60 uppercase tracking-widest">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-50/20">
                {kpis.map((kpi, idx) => {
                  const info = CATEGORY_MAP[kpi.category] || { icon: Settings, label: kpi.category, color: "text-slate-600 bg-slate-50 border-slate-100" };
                  const Icon = info.icon;

                  return (
                    <tr
                      key={kpi.id}
                      className={clsx(
                        "group transition-all duration-300 cursor-pointer relative",
                        idx % 2 === 0 ? "bg-transparent" : "bg-indigo-50/10",
                        "hover:bg-indigo-500/[0.03] hover:shadow-[inset_0_0_20px_rgba(79,70,229,0.02)]"
                      )}
                      onClick={() => setSelectedKpi(kpi)}
                    >
                      <td className="px-8 py-5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleKpi(kpi)}
                          disabled={savingId === kpi.id}
                          className={clsx(
                            "relative w-9 h-5 rounded-full transition-all duration-500 flex items-center px-0.5",
                            kpi.isEnabled ? "bg-indigo-500 shadow-lg shadow-indigo-200" : "bg-slate-200"
                          )}
                        >
                          <div className={clsx("w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 transform", kpi.isEnabled ? "translate-x-4" : "translate-x-0")} />
                        </button>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className={clsx(
                            "text-[11px] font-black tracking-tight transition-colors duration-300",
                            kpi.isEnabled ? "text-slate-800 group-hover:text-indigo-600" : "text-slate-400 line-through"
                          )}>{kpi.name}</span>
                          <span className="text-[8px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">UID: {kpi.kpiId || kpi.id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className={clsx("inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[8px] font-black uppercase tracking-widest shadow-sm transition-all duration-300 group-hover:scale-105", info.color)}>
                          <Icon className="w-3 h-3" />
                          {info.label}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="max-w-[200px] truncate font-mono text-[9px] text-slate-400 bg-white/50 px-3 py-2 rounded-lg border border-indigo-100/30 group-hover:border-indigo-200/50 transition-colors">
                          {kpi.sql_query || "No KPI defined"}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(kpi); }}
                            className="w-8 h-8 bg-rose-50 text-rose-400 hover:bg-rose-600 hover:text-white rounded-xl flex items-center justify-center transition-all duration-300"
                            title="Delete KPI"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </div>
                          <div className="w-8 h-8 bg-indigo-50 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white rounded-xl flex items-center justify-center transition-all duration-300">
                            <Pencil className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Metric Drawer/Modal */}
      {selectedKpi && mounted && createPortal(
        <div className="fixed inset-0 left-64 z-[99999] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setSelectedKpi(null); setEdits({}); }} />
          <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/60 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 text-white">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Edit KPI</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{selectedKpi.name}</p>
                </div>
              </div>
              <button onClick={() => { setSelectedKpi(null); setEdits({}); }} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-all active:scale-90 text-slate-300 hover:text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">KPI Title</label>
                  <input
                    value={edits[selectedKpi.id]?.name ?? selectedKpi.name}
                    onChange={(e) => setEdit(selectedKpi.id, "name", e.target.value)}
                    className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-3 text-[11px] font-bold text-slate-800 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Classification</label>
                  <select
                    value={edits[selectedKpi.id]?.category ?? selectedKpi.category}
                    onChange={(e) => setEdit(selectedKpi.id, "category", e.target.value)}
                    className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-3 text-[11px] font-bold text-slate-800 focus:ring-2 focus:ring-indigo-100 cursor-pointer appearance-none outline-none transition-all"
                  >
                    {["sla", "performance", "volume", "quality", "knowledge"].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Description</label>
                <textarea
                  value={edits[selectedKpi.id]?.description ?? selectedKpi.description ?? ""}
                  onChange={(e) => setEdit(selectedKpi.id, "description", e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-3 text-[11px] font-bold text-slate-800 focus:ring-2 focus:ring-indigo-100 outline-none h-20 resize-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SQL</label>
                </div>
                <textarea
                  value={edits[selectedKpi.id]?.sql_query ?? selectedKpi.sql_query ?? ""}
                  onChange={(e) => setEdit(selectedKpi.id, "sql_query", e.target.value)}
                  className="w-full bg-slate-900 text-indigo-300 font-mono text-[11px] p-5 rounded-2xl border border-slate-800 focus:border-indigo-500/50 outline-none h-40 resize-none transition-all leading-relaxed"
                />
              </div>
            </div>

            <div className="p-6 flex items-center justify-end gap-4 bg-slate-50/50 border-t border-slate-100">
              <button
                onClick={() => { setSelectedKpi(null); setEdits({}); }}
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { saveKpi(selectedKpi); setSelectedKpi(null); }}
                disabled={savingId === selectedKpi.id || !edits[selectedKpi.id]}
                className="bg-blue-600 text-white px-8 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-800 transition-all active:scale-95 flex items-center gap-2"
              >
                {savingId === selectedKpi.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save
              </button>
            </div>
          </div>
        </div>,
        document.getElementById("modal-portal")!
      )}

      {/* ── Custom Delete Confirmation Modal ───────────────────────── */}
      {deleteTarget && mounted && createPortal(
        <div className="fixed inset-0 left-64 z-[100000] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl border border-white/60 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
                <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200 animate-pulse">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Permanent Deletion</h3>
                <p className="text-xs font-bold text-slate-500 leading-relaxed px-4">
                  Are you sure you want to remove <span className="text-rose-500">{deleteTarget.name}</span>? This action is immediate and cannot be undone.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={() => handleDelete(deleteTarget.id)}
                  className="w-full bg-rose-500 text-white py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-rose-100 hover:bg-rose-600 transition-all active:scale-[0.98]"
                >
                  Confirm Deletion
                </button>
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="w-full bg-slate-50 text-slate-400 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-100 hover:text-slate-600 transition-all active:scale-[0.98]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.getElementById("modal-portal")!
      )}

      <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #312e81; border-radius: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; }
        `}</style>
    </div>
  );
}
