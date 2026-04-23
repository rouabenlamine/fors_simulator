"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Layers, Table, BookOpen, Plus, Pencil, Trash2, X, Check, Search } from "lucide-react";
import {
  getTransactionsAction, createTransactionAction, updateTransactionAction, deleteTransactionAction,
  getMenusAction, createMenuAction, updateMenuAction, deleteMenuAction,
  getDatabaseTablesAction, createDatabaseTableAction, updateDatabaseTableAction, deleteDatabaseTableAction,
} from "@/app/actions/admin-actions";

type Tab = "transactions" | "menus" | "tables";

export default function FunctionalMappingPage() {
  const [tab, setTab] = useState<Tab>("transactions");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ─── Search state (Section 4) ───────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search at 300ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  // Reset search on tab change
  useEffect(() => { setSearchQuery(""); setDebouncedQuery(""); }, [tab]);

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "transactions") setData(await getTransactionsAction());
      else if (tab === "menus") setData(await getMenusAction());
      else setData(await getDatabaseTablesAction());
    } catch { }
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const FIELDS: Record<Tab, { key: string; label: string; required?: boolean }[]> = {
    transactions: [
      { key: "name", label: "Name", required: true },
      { key: "description", label: "Description" },
      { key: "pgmType", label: "Program Type" },
      { key: "language", label: "Language" },
      { key: "sqlPg", label: "SQL Program" },
      { key: "tables", label: "Related Tables" },
      { key: "pgms", label: "Programs" },
    ],
    menus: [
      { key: "title", label: "Title", required: true },
      { key: "description", label: "Description" },
      { key: "icon", label: "Icon" },
      { key: "path", label: "Path" },
      { key: "order", label: "Sort Order" },
    ],
    tables: [
      { key: "name", label: "Table Name", required: true },
      { key: "description", label: "Description" },
      { key: "path", label: "Path" },
      { key: "schema", label: "Schema" },
    ],
  };

  const COLUMNS: Record<Tab, { key: string; label: string }[]> = {
    transactions: [
      { key: "name", label: "Name" }, { key: "pgmType", label: "Type" },
      { key: "language", label: "Language" }, { key: "tables", label: "Tables" },
    ],
    menus: [
      { key: "title", label: "Title" }, { key: "description", label: "Description" },
      { key: "icon", label: "Icon" }, { key: "path", label: "Path" },
    ],
    tables: [
      { key: "name", label: "Name" }, { key: "description", label: "Description" },
      { key: "schema", label: "Schema" }, { key: "path", label: "Path" },
    ],
  };

  // ─── Filtered data based on search ──────────────────────────────────────
  const filteredData = debouncedQuery.trim()
    ? data.filter((item) => {
        const q = debouncedQuery.toLowerCase();
        return COLUMNS[tab].some((col) => {
          const val = item[col.key];
          return val && String(val).toLowerCase().includes(q);
        });
      })
    : data;

  function openCreate() {
    setEditItem(null);
    const empty: Record<string, string> = {};
    FIELDS[tab].forEach(f => empty[f.key] = "");
    setForm(empty); setError(""); setShowModal(true);
  }

  function openEdit(item: any) {
    setEditItem(item);
    const vals: Record<string, string> = {};
    FIELDS[tab].forEach(f => vals[f.key] = item[f.key] || "");
    setForm(vals); setError(""); setShowModal(true);
  }

  async function handleSave() {
    setSaving(true); setError("");
    try {
      if (editItem) {
        if (tab === "transactions") await updateTransactionAction(editItem.id, form);
        else if (tab === "menus") await updateMenuAction(editItem.id, form);
        else await updateDatabaseTableAction(editItem.id, form);
      } else {
        if (tab === "transactions") await createTransactionAction(form as any);
        else if (tab === "menus") await createMenuAction(form as any);
        else await createDatabaseTableAction(form as any);
      }
      setShowModal(false); await load();
    } catch (e: any) { setError(e.message || "Failed"); }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      if (tab === "transactions") await deleteTransactionAction(deleteId);
      else if (tab === "menus") await deleteMenuAction(deleteId);
      else await deleteDatabaseTableAction(deleteId);
      setDeleteId(null); await load();
    } catch (e: any) { alert(e.message); }
    setDeleting(false);
  }

  const TABS: { id: Tab; label: string; icon: React.ElementType; color: string; bg: string; border: string }[] = [
    { id: "transactions", label: "Transactions", icon: Layers, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-300" },
    { id: "menus", label: "Menus", icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-300" },
    { id: "tables", label: "Database Tables", icon: Table, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-300" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-5 py-4 px-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Functional Mapping</h1>
            <p className="text-sm text-slate-500">Manage FORS transactions, menus, and database table metadata.</p>
          </div>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 text-sm font-semibold rounded-xl shadow-sm shadow-violet-200 transition-all hover:shadow-md active:scale-[0.98]">
          <Plus className="w-4 h-4" />
          Add {tab === "transactions" ? "Transaction" : tab === "menus" ? "Menu" : "Table"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              tab === t.id ? `${t.border} ${t.color} ${t.bg} rounded-t-lg` : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-gray-50 rounded-t-lg"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded ml-1 text-slate-500">{!loading ? data.length : "…"}</span>
          </button>
        ))}
      </div>

      {/* ─── Search Bar (Section 4) ────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search across all ${tab} columns…`}
          className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => { setSearchQuery(""); setDebouncedQuery(""); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-slate-500 text-xs uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-5 py-3.5 font-semibold w-10">#</th>
                {COLUMNS[tab].map(c => <th key={c.key} className="px-5 py-3.5 font-semibold">{c.label}</th>)}
                <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={COLUMNS[tab].length + 2} className="px-5 py-10 text-center text-slate-400 animate-pulse">Loading...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS[tab].length + 2} className="px-5 py-10 text-center">
                    {debouncedQuery ? (
                      <div className="space-y-2">
                        <p className="text-slate-400">No results found for &quot;<span className="font-semibold text-slate-600">{debouncedQuery}</span>&quot;</p>
                        <button
                          onClick={() => { setSearchQuery(""); setDebouncedQuery(""); }}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-800 bg-violet-50 px-3 py-1.5 rounded-lg border border-violet-200 hover:bg-violet-100 transition-all"
                        >
                          <X className="w-3 h-3" /> Clear Search
                        </button>
                      </div>
                    ) : (
                      <p className="text-slate-400">No records found. Click &quot;Add&quot; to create one.</p>
                    )}
                  </td>
                </tr>
              ) : filteredData.map((item, i) => (
                <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-5 py-3 text-slate-400 text-xs font-mono">{i + 1}</td>
                  {COLUMNS[tab].map(c => <td key={c.key} className="px-5 py-3 text-slate-600 text-xs max-w-[200px] truncate">{item[c.key] || "—"}</td>)}
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteId(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Results count when searching */}
        {debouncedQuery && filteredData.length > 0 && (
          <div className="px-5 py-2.5 border-t border-gray-100 bg-violet-50/50 text-xs text-violet-700 font-medium">
            Showing {filteredData.length} of {data.length} results for &quot;{debouncedQuery}&quot;
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-slate-800">
                {editItem ? "Edit" : "Create"} {tab === "transactions" ? "Transaction" : tab === "menus" ? "Menu" : "Table"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {FIELDS[tab].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">{f.label} {f.required && <span className="text-red-500">*</span>}</label>
                  {f.key === "description" ? (
                    <textarea value={form[f.key] || ""} onChange={e => setForm({ ...form, [f.key]: e.target.value })} rows={3} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 resize-none transition-all" />
                  ) : (
                    <input value={form[f.key] || ""} onChange={e => setForm({ ...form, [f.key]: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition-all" />
                  )}
                </div>
              ))}
              {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl border border-red-200">{error}</p>}
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-5 py-2.5 text-sm font-semibold rounded-xl transition-all shadow-sm">
                <Check className="w-4 h-4" />
                {saving ? "Saving..." : editItem ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeleteId(null)}>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-slate-800 mb-2">Confirm Delete</h3>
            <p className="text-sm text-slate-500 mb-6">This will permanently remove the record.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-4 py-2 text-sm font-semibold rounded-xl transition-all shadow-sm">
                <Trash2 className="w-3.5 h-3.5" />
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
