"use client";

import React, { useState, useEffect, useCallback } from "react";
import clsx from "clsx";
import { Database, Search, Table, Layers, FileJson2, ChevronRight, Key, Loader2, Terminal, Play, AlertCircle } from "lucide-react";
import { getSystemTablesAction, getSystemTableSchemaAction, getSystemTableDataAction, executeRawSqlAction } from "@/app/actions/admin-actions";
import { formatZeroJson } from "@/lib/translation";

export default function SuperadminDatabaseExplorer() {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [schema, setSchema] = useState<any>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"schemas" | "data" | "indexes" | "sql">("schemas");

  const [sqlQuery, setSqlQuery] = useState("");
  const [sqlResult, setSqlResult] = useState<any[] | null>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [sqlLoading, setSqlLoading] = useState(false);
  const [sqlTime, setSqlTime] = useState<number | null>(null);
  const [sqlFilter, setSqlFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

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

  async function handleRunSql() {
    if (!sqlQuery.trim()) return;
    setSqlLoading(true);
    setSqlError(null);
    setSqlResult(null);
    setColumnFilters({});
    try {
      const start = performance.now();
      const res = await executeRawSqlAction(sqlQuery);
      setSqlTime(performance.now() - start);
      setSqlResult(res.data);
    } catch (err: any) {
      setSqlError(err.message || "SQL Execution failed");
    }
    setSqlLoading(false);
  }

  function applyCrudTemplate(type: "select" | "insert" | "update" | "delete") {
    const t = selected || "table_name";
    switch (type) {
      case "select": setSqlQuery(`SELECT * FROM ${t} LIMIT 50;`); break;
      case "insert": setSqlQuery(`INSERT INTO ${t} (\n  -- col1, col2\n) VALUES (\n  -- 'val1', 'val2'\n);`); break;
      case "update": setSqlQuery(`UPDATE ${t}\nSET\n  -- col1 = 'val1'\nWHERE id = 1;`); break;
      case "delete": setSqlQuery(`DELETE FROM ${t} WHERE id = 1;`); break;
    }
  }

  const filteredSqlResult = sqlResult?.filter(row => {
    // Global filter
    if (sqlFilter) {
      const term = sqlFilter.toLowerCase();
      const matchesGlobal = Object.values(row).some(val => String(val).toLowerCase().includes(term));
      if (!matchesGlobal) return false;
    }
    // Column filters
    for (const col in columnFilters) {
      if (columnFilters[col]) {
        const term = columnFilters[col].toLowerCase();
        if (!String(row[col] ?? "").toLowerCase().includes(term)) {
          return false;
        }
      }
    }
    return true;
  }) || [];

  return (
    <div className="w-full space-y-4 py-4 px-2 animate-in fade-in duration-500">

      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 shrink-0">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-800 tracking-tight leading-none">
              Database <span className="text-indigo-500">Explorer</span>
            </h1>
            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Application's Database </p>
          </div>
        </div>

        <div className="relative group">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search schemas..."
            className="bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-[11px] font-bold text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 w-64 shadow-sm transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex gap-4 min-h-[850px] animate-in slide-in-from-bottom-4 duration-700">
        {/* Left sidebar — table list */}
        <div className="w-64 shrink-0 bg-white/70 backdrop-blur-xl border border-white/60 rounded-[2rem] shadow-sm overflow-hidden flex flex-col group">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Metadata Nodes</span>
              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{filtered.length}</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
              </div>
            ) : filtered.map(t => (
              <button
                key={t.name}
                onClick={() => selectTable(t.name)}
                className={clsx(
                  "w-full flex items-center justify-between px-5 py-3 text-left transition-all border-b border-slate-50 group/item",
                  selected === t.name
                    ? "bg-indigo-50/80 border-r-4 border-r-indigo-500"
                    : "hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={clsx(
                    "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                    selected === t.name ? "bg-indigo-100" : "bg-slate-100 group-hover/item:bg-slate-200"
                  )}>
                    <Table className={clsx("w-3.5 h-3.5", selected === t.name ? "text-indigo-600" : "text-slate-400")} />
                  </div>
                  <span className={clsx(
                    "text-[10px] font-black uppercase tracking-tight truncate",
                    selected === t.name ? "text-indigo-700" : "text-slate-600"
                  )}>{t.name}</span>
                </div>
                <ChevronRight className={clsx("w-3 h-3 transition-transform", selected === t.name ? "text-indigo-400 translate-x-1" : "text-slate-300 opacity-0 group-hover/item:opacity-100")} />
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white/70 backdrop-blur-xl border border-white/60 rounded-[2rem] shadow-sm flex flex-col overflow-hidden">
          {activeTab === "sql" ? (
            <div className="flex flex-col h-full bg-slate-900">
              <div className="px-8 py-5 border-b border-white/5 bg-slate-950/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                    <Terminal className="w-4 h-4 text-indigo-400" />
                  </div>
                  <span className="text-[11px] font-black text-white uppercase tracking-widest">SQL Console</span>
                </div>
                <button
                  onClick={() => setActiveTab("schemas")}
                  className="text-[9px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl border border-white/5"
                >
                  Terminate Session
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Template Macros</span>
                  <div className="flex gap-2">
                    <button onClick={() => applyCrudTemplate("select")} className="text-[9px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-xl hover:bg-indigo-500/20 transition-all uppercase tracking-widest">Select</button>
                    <button onClick={() => applyCrudTemplate("insert")} className="text-[9px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-xl hover:bg-emerald-500/20 transition-all uppercase tracking-widest">Insert</button>
                    <button onClick={() => applyCrudTemplate("update")} className="text-[9px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-xl hover:bg-amber-500/20 transition-all uppercase tracking-widest">Update</button>
                    <button onClick={() => applyCrudTemplate("delete")} className="text-[9px] font-black bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-xl hover:bg-rose-500/20 transition-all uppercase tracking-widest">Delete</button>
                  </div>
                </div>

                <textarea
                  value={sqlQuery}
                  onChange={e => setSqlQuery(e.target.value)}
                  placeholder="-- ENTER SQL COMMANDS\nSELECT * FROM system_audit_history LIMIT 10;"
                  className="w-full h-40 bg-slate-950/50 text-indigo-300 font-mono text-[13px] p-6 rounded-3xl border border-white/5 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 resize-none leading-relaxed placeholder:text-slate-800"
                  spellCheck={false}
                />

                <div className="flex justify-between items-center px-1">
                  <button
                    onClick={handleRunSql}
                    disabled={sqlLoading || !sqlQuery.trim()}
                    className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-[1.25rem] text-[11px] font-black uppercase tracking-[0.15em] transition-all shadow-xl shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
                  >
                    {sqlLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    {sqlLoading ? "Processing..." : "Execute Command"}
                  </button>
                </div>
              </div>

              <div className="flex-1 border-t border-white/5 overflow-hidden flex flex-col bg-slate-900/50 backdrop-blur-md">
                {sqlError && (
                  <div className="m-8 p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-start gap-4 animate-in slide-in-from-top-4">
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Protocol Error</p>
                      <p className="text-[11px] text-rose-300/80 font-mono leading-relaxed">{sqlError}</p>
                    </div>
                  </div>
                )}

                {sqlResult && !sqlError && (
                  <div className="flex-1 overflow-hidden flex flex-col animate-in fade-in duration-500">
                    <div className="px-8 py-4 border-b border-white/5 flex items-center justify-between bg-slate-950/30 shrink-0">
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Dataset Payload</span>
                          <span className="text-[11px] font-black text-indigo-400 uppercase">{sqlResult.length} Rows Identified</span>
                        </div>
                        <div className="relative group">
                          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-400 transition-colors" />
                          <input
                            type="text"
                            value={sqlFilter}
                            onChange={e => setSqlFilter(e.target.value)}
                            placeholder="Filter stream..."
                            className="bg-slate-950/50 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-indigo-500/50 w-48 placeholder:text-slate-700"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Latency</span>
                        <span className="text-[11px] font-black text-indigo-400 uppercase">{sqlTime?.toFixed(2)} ms</span>
                      </div>
                    </div>

                    <div className="flex-1 overflow-auto custom-scrollbar-dark">
                      {sqlResult.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-600 gap-3">
                          <Layers className="w-8 h-8 opacity-20" />
                          <p className="text-[10px] font-black uppercase tracking-widest italic">Void Sequence • 0 records returned</p>
                        </div>
                      ) : (
                        <table className="w-full text-left text-[11px] font-mono whitespace-nowrap text-slate-300">
                          <thead className="bg-slate-950 text-slate-500 sticky top-0 z-10 border-b border-white/10">
                            <tr>{Object.keys(sqlResult[0]).map(k => (
                              <th key={k} className="px-6 py-4 font-black uppercase tracking-widest align-top">
                                <div className="flex flex-col gap-3">
                                  <span>{k}</span>
                                  <input
                                    type="text"
                                    placeholder="Filter col..."
                                    value={columnFilters[k] || ""}
                                    onChange={(e) => setColumnFilters(prev => ({ ...prev, [k]: e.target.value }))}
                                    className="bg-slate-900 border border-white/5 text-indigo-400 text-[9px] font-black rounded-lg px-3 py-1.5 w-full focus:outline-none focus:border-indigo-500/50 placeholder:text-slate-700 uppercase"
                                  />
                                </div>
                              </th>
                            ))}</tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {filteredSqlResult.map((row, i) => (
                              <tr key={i} className="hover:bg-indigo-500/5 transition-colors group/row">
                                {Object.values(row).map((val: any, j) => (
                                  <td key={j} className="px-6 py-4 truncate max-w-[300px] text-slate-400 group-hover/row:text-slate-200">
                                    {val === null ? <span className="text-slate-800 italic">NULL</span> : formatZeroJson(val)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : !selected ? (
            <div className="flex-1 flex items-center justify-center flex-col gap-6 text-center p-12 relative group/empty">
              <button
                onClick={() => setActiveTab("sql")}
                className="absolute top-6 right-6 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest bg-slate-900 text-white border border-slate-800 px-5 py-2.5 rounded-xl hover:bg-indigo-600 hover:border-indigo-500 transition-all shadow-xl active:scale-95"
              >
                <Terminal className="w-3.5 h-3.5" /> Open Command Console
              </button>

              <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center shadow-inner group-hover/empty:scale-110 transition-transform duration-500">
                <Database className="w-8 h-8 text-slate-200" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">Explore Database</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[280px] leading-relaxed">
                  Select a registered database node from the structural sidebar to initiate inspection.
                </p>
              </div>
            </div>
          ) : schemaLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Schema Nodes...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
                    <Table className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase">{selected}</h2>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Layers className="w-3 h-3" /> {schema?.columns?.length ?? 0} Attributes
                      </span>
                      <div className="w-1 h-1 rounded-full bg-slate-200" />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Database className="w-3 h-3" /> {schema?.rowCount ?? 0} Records
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSqlQuery(`SELECT * FROM ${selected} LIMIT 50;`);
                    setActiveTab("sql");
                  }}
                  className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                >
                  <Terminal className="w-3.5 h-3.5" /> Start Query
                </button>
              </div>

              {/* Tabs */}
              <div className="flex items-center px-8 border-b border-slate-100 bg-white/50">
                {([
                  { id: "schemas" as const, label: "Structural Columns", icon: Layers },
                  { id: "indexes" as const, label: "Index Registry", icon: Key },
                  { id: "data" as const, label: "Data Stream", icon: FileJson2 },
                ]).map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={clsx(
                      "flex items-center gap-3 px-6 py-4 text-[9px] font-black uppercase tracking-widest border-b-2 transition-all relative",
                      activeTab === t.id
                        ? "border-indigo-500 text-indigo-600 bg-indigo-50/50"
                        : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <t.icon className={clsx("w-3.5 h-3.5", activeTab === t.id ? "text-indigo-600" : "text-slate-300")} />
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-auto custom-scrollbar">
                {activeTab === "schemas" && schema?.columns && (
                  <table className="w-full text-left text-[10px] whitespace-nowrap">
                    <thead className="bg-slate-50/80 text-slate-400 border-b border-slate-100 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-3 font-black uppercase tracking-widest">Index</th>
                        <th className="px-6 py-3 font-black uppercase tracking-widest">Field Attribute</th>
                        <th className="px-6 py-3 font-black uppercase tracking-widest">Type Protocol</th>
                        <th className="px-6 py-3 font-black uppercase tracking-widest">Nullability</th>
                        <th className="px-6 py-3 font-black uppercase tracking-widest">Constraint</th>
                        <th className="px-6 py-3 font-black uppercase tracking-widest">Default</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {schema.columns.map((col: any, i: number) => (
                        <tr key={i} className="hover:bg-indigo-50/30 transition-colors group/row">
                          <td className="px-6 py-3 text-slate-400 font-mono text-[9px]">{i + 1}</td>
                          <td className="px-6 py-3 font-black text-slate-700 uppercase tracking-tight">{formatZeroJson(col.Field.replace(/_/g, " "))}</td>
                          <td className="px-6 py-3 text-indigo-600 font-mono font-bold">{col.Type}</td>
                          <td className="px-6 py-3">
                            <span className={clsx(
                              "px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border",
                              col.Null === "YES" ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-slate-50 text-slate-400 border-slate-100"
                            )}>
                              {col.Null === "YES" ? "Nullable" : "Required"}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            {col.Key && (
                              <span className={clsx(
                                "px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border",
                                col.Key === "PRI" ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-blue-50 text-blue-600 border-blue-200"
                              )}>
                                {col.Key === "PRI" ? "Primary Key" : col.Key}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3 text-slate-400 font-mono">{col.Default ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {activeTab === "indexes" && schema?.indexes && (
                  <table className="w-full text-left text-[10px] whitespace-nowrap">
                    <thead className="bg-slate-50/80 text-slate-400 border-b border-slate-100 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-3 font-black uppercase tracking-widest">Identifier</th>
                        <th className="px-6 py-3 font-black uppercase tracking-widest">Member Attribute</th>
                        <th className="px-6 py-3 font-black uppercase tracking-widest">Uniqueness</th>
                        <th className="px-6 py-3 font-black uppercase tracking-widest">Sequence</th>
                        <th className="px-6 py-3 font-black uppercase tracking-widest">Cardinality</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {schema.indexes.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-16 text-center text-slate-400 font-black uppercase tracking-widest italic opacity-50">
                            Zero Index Nodes Registered
                          </td>
                        </tr>
                      ) : schema.indexes.map((idx: any, i: number) => (
                        <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="px-6 py-3 font-black text-indigo-600 uppercase tracking-tight">{formatZeroJson(idx.Key_name.replace(/_/g, " "))}</td>
                          <td className="px-6 py-3 font-mono text-slate-600">{formatZeroJson(idx.Column_name?.replace(/_/g, " "))}</td>
                          <td className="px-6 py-3">
                            <span className={clsx(
                              "px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border",
                              idx.Non_unique === 0 ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-slate-50 text-slate-400 border-slate-100"
                            )}>
                              {idx.Non_unique === 0 ? "Unique" : "Standard"}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-slate-400 font-mono">{idx.Seq_in_index}</td>
                          <td className="px-6 py-3 text-slate-500 font-mono">{idx.Cardinality ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {activeTab === "data" && (
                  tableData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                      <Layers className="w-10 h-10 opacity-10" />
                      <p className="text-[10px] font-black uppercase tracking-widest italic">Void Sequence • 0 records returned</p>
                    </div>
                  ) : (
                    <table className="w-full text-left text-[9px] whitespace-nowrap font-mono">
                      <thead className="bg-slate-50/80 text-slate-400 border-b border-slate-100 sticky top-0 z-10">
                        <tr>{Object.keys(tableData[0]).map(k => <th key={k} className="px-6 py-3 font-black uppercase tracking-widest">{k}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {tableData.map((row, i) => (
                          <tr key={i} className="hover:bg-indigo-50/30 transition-colors text-slate-600">
                            {Object.values(row).map((val: any, j) => (
                              <td key={j} className="px-6 py-2.5 truncate max-w-[250px]">{val === null ? <span className="text-slate-300 italic">NULL</span> : formatZeroJson(val)}</td>
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

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        
        .custom-scrollbar-dark::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar-dark::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}
