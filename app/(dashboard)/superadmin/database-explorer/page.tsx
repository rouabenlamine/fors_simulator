"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Database, Search, Table, Layers, FileJson2, ChevronRight, Key, Loader2 } from "lucide-react";
import { getSystemTablesAction, getSystemTableSchemaAction, getSystemTableDataAction } from "@/app/actions/admin-actions";

export default function SuperadminDatabaseExplorer() {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [schema, setSchema] = useState<any>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"schemas" | "data" | "indexes">("schemas");

  const load = useCallback(async () => {
    setLoading(true);
    try { setTables(await getSystemTablesAction()); } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function selectTable(name: string) {
    setSelected(name);
    setSchemaLoading(true);
    setActiveTab("schemas");
    try {
      const [schemaResult, dataResult] = await Promise.all([
        getSystemTableSchemaAction(name),
        getSystemTableDataAction(name, 50),
      ]);
      setSchema(schemaResult);
      setTableData(dataResult);
    } catch { }
    setSchemaLoading(false);
  }

  const filtered = tables.filter(t => !search || t.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-full mx-auto space-y-5 py-4 px-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-200">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Global Database Explorer</h1>
            <p className="text-sm text-slate-500">System-level introspection: view all tables, schemas, indexes, and raw data.</p>
          </div>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter tables..." className="bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 w-64 shadow-sm transition-all" />
        </div>
      </div>

      <div className="flex gap-5 min-h-[600px]">
        {/* Left sidebar — table list */}
        <div className="w-72 shrink-0 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tables ({filtered.length})</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 text-teal-500 animate-spin" /></div>
            ) : filtered.map(t => (
              <button key={t.name} onClick={() => selectTable(t.name)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-teal-50/50 transition-colors border-b border-gray-50 group ${
                  selected === t.name ? "bg-teal-50 border-l-2 border-l-teal-500" : ""
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Table className={`w-3.5 h-3.5 shrink-0 ${selected === t.name ? "text-teal-500" : "text-gray-400"}`} />
                  <span className={`text-xs font-semibold truncate ${selected === t.name ? "text-teal-700" : "text-slate-700"}`}>{t.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-slate-400 font-mono">{t.rowCount ?? "?"}</span>
                  <ChevronRight className={`w-3 h-3 text-gray-400 group-hover:text-teal-500 transition-colors ${selected === t.name ? "text-teal-500" : ""}`} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right panel — detail */}
        <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center flex-col gap-4 text-center p-8">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center"><Database className="w-8 h-8 text-gray-300" /></div>
              <div>
                <p className="text-slate-500 font-medium">Select a table</p>
                <p className="text-sm text-slate-400 mt-1">Click on a table from the left panel to inspect it.</p>
              </div>
            </div>
          ) : schemaLoading ? (
            <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 text-teal-500 animate-spin" /></div>
          ) : (
            <>
              {/* Table header */}
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-800">{selected}</h2>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{schema?.rowCount ?? 0} rows · {schema?.columns?.length ?? 0} columns · {schema?.indexes?.length ?? 0} indexes</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 px-5 pt-3 border-b border-gray-100">
                {([
                  { id: "schemas" as const, label: "Columns", icon: Layers },
                  { id: "indexes" as const, label: "Indexes", icon: Key },
                  { id: "data" as const, label: "Data Preview", icon: FileJson2 },
                ]).map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                      activeTab === t.id ? "border-teal-500 text-teal-600 bg-teal-50 rounded-t-lg" : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-gray-50 rounded-t-lg"
                    }`}
                  >
                    <t.icon className="w-3.5 h-3.5" /> {t.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-auto">
                {activeTab === "schemas" && schema?.columns && (
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-gray-50 text-slate-400 border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="px-5 py-3 font-semibold">#</th>
                        <th className="px-5 py-3 font-semibold">Field</th>
                        <th className="px-5 py-3 font-semibold">Type</th>
                        <th className="px-5 py-3 font-semibold">Null</th>
                        <th className="px-5 py-3 font-semibold">Key</th>
                        <th className="px-5 py-3 font-semibold">Default</th>
                        <th className="px-5 py-3 font-semibold">Extra</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {schema.columns.map((col: any, i: number) => (
                        <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-5 py-2.5 text-slate-400 font-mono">{i + 1}</td>
                          <td className="px-5 py-2.5 font-mono font-semibold text-teal-600">{col.Field}</td>
                          <td className="px-5 py-2.5 text-slate-600 font-mono">{col.Type}</td>
                          <td className="px-5 py-2.5"><span className={col.Null === "YES" ? "text-amber-500" : "text-slate-400"}>{col.Null}</span></td>
                          <td className="px-5 py-2.5">
                            {col.Key && <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md border ${
                              col.Key === "PRI" ? "bg-rose-50 text-rose-600 border-rose-200" : col.Key === "UNI" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-gray-50 text-gray-600 border-gray-200"
                            }`}>{col.Key}</span>}
                          </td>
                          <td className="px-5 py-2.5 text-slate-400 font-mono">{col.Default ?? "NULL"}</td>
                          <td className="px-5 py-2.5 text-slate-400 font-mono">{col.Extra || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {activeTab === "indexes" && schema?.indexes && (
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-gray-50 text-slate-400 border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Key Name</th>
                        <th className="px-5 py-3 font-semibold">Column</th>
                        <th className="px-5 py-3 font-semibold">Unique</th>
                        <th className="px-5 py-3 font-semibold">Seq</th>
                        <th className="px-5 py-3 font-semibold">Cardinality</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {schema.indexes.length === 0 ? (
                        <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">No indexes on this table.</td></tr>
                      ) : schema.indexes.map((idx: any, i: number) => (
                        <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-5 py-2.5 font-mono font-semibold text-blue-600">{idx.Key_name}</td>
                          <td className="px-5 py-2.5 font-mono text-slate-600">{idx.Column_name}</td>
                          <td className="px-5 py-2.5"><span className={idx.Non_unique === 0 ? "text-emerald-500" : "text-slate-400"}>{idx.Non_unique === 0 ? "YES" : "NO"}</span></td>
                          <td className="px-5 py-2.5 text-slate-400">{idx.Seq_in_index}</td>
                          <td className="px-5 py-2.5 text-slate-500 font-mono">{idx.Cardinality ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {activeTab === "data" && (
                  tableData.length === 0 ? (
                    <div className="flex items-center justify-center py-16 text-slate-400 text-sm">No data in this table.</div>
                  ) : (
                    <table className="w-full text-left text-xs whitespace-nowrap font-mono">
                      <thead className="bg-gray-50 text-slate-400 border-b border-gray-200 sticky top-0">
                        <tr>{Object.keys(tableData[0]).map(k => <th key={k} className="px-4 py-3 font-semibold">{k}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {tableData.map((row, i) => (
                          <tr key={i} className="hover:bg-blue-50/30 transition-colors text-slate-600">
                            {Object.values(row).map((val: any, j) => (
                              <td key={j} className="px-4 py-2 truncate max-w-[200px]">{val === null ? <span className="text-gray-300 italic">NULL</span> : String(val)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
