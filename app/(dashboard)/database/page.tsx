"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  getExplorerMenus,
  getExplorerTables,
  getExplorerTransactions,
  getTransactions,
} from "@/app/actions";
import {
  Layout, Layers, Table2, HardDrive, Cpu, Search, X,
  FileCode, Tag, Code2, Link as LinkIcon, ChevronRight,
  AlignLeft, Hash, Compass, Download, CheckSquare, Square,
} from "lucide-react";
import clsx from "clsx";

type Menu = {
  id: string; title: string; description: string;
  parentId: string | null; order: number; childCount: number;
};
type TableRecord = {
  id: string; name: string; description: string;
  indexCount: number; fieldCount: number; txnCount: number;
};
type Txn = {
  id: string; name: string; description: string; pgmType: string;
  language: string; sqlPg: string; tables: string; pgms: string;
};
type DbField = {
  id: string; name: string; type: string; length?: number | null;
  nullable?: boolean; description?: string; position?: number;
};

const COLORS = [
  "from-blue-500 to-cyan-500",
  "from-purple-500 to-pink-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-amber-500",
  "from-indigo-500 to-violet-500",
  "from-rose-500 to-red-500",
];

function getGradient(label: string) {
  let hash = 0;
  for (let i = 0; i < label.length; i++) hash = label.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}


export default function DatabaseExplorerPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full items-center justify-center bg-slate-50">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin" />
          <Compass className="w-8 h-8 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    }>
      <ExplorerContent />
    </Suspense>
  );
}

function ExplorerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const viewParam = searchParams.get("view") ?? "modules";
  const tableParam = searchParams.get("table");
  const menuIdParam = searchParams.get("id");

  // Map "modules" → show menus, else use viewParam directly
  const activeTab: "modules" | "tables" | "transactions" =
    viewParam === "tables" ? "tables" :
      viewParam === "transactions" ? "transactions" : "modules";

  const [menus, setMenus] = useState<Menu[]>([]);
  const [tables, setTables] = useState<TableRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Selections
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableRecord | null>(null);
  const [tableFields, setTableFields] = useState<DbField[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [tableTxns, setTableTxns] = useState<Txn[]>([]);
  const [loadingTxns, setLoadingTxns] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<Txn | null>(null);
  const [allTxns, setAllTxns] = useState<Txn[]>([]);
  const [selectedTxnFromList, setSelectedTxnFromList] = useState<Txn | null>(null);

  const [searchTableQuery, setSearchTableQuery] = useState("");
  const [txnSearch, setTxnSearch] = useState("");
  const [moduleSearch, setModuleSearch] = useState("");

  useEffect(() => {
    Promise.all([getExplorerMenus(), getExplorerTables()]).then(([m, t]) => {
      setMenus(m);
      setTables(t);
      setLoading(false);
    });
    getTransactions().then(setAllTxns);
  }, []);

  // Auto-select table from URL param
  useEffect(() => {
    if (tableParam && tables.length > 0) {
      const found = tables.find(t => t.name.toLowerCase() === tableParam.toLowerCase());
      if (found && (selectedTable?.id !== found.id)) {
        handleTableSelect(found);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableParam, tables]);

  // Auto-select menu from URL param
  useEffect(() => {
    if (menuIdParam && menus.length > 0) {
      const found = menus.find(m => m.id === menuIdParam);
      if (found) setSelectedMenuIds([found.id]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuIdParam, menus]);

  const headMenus = useMemo(() =>
    menus.filter(m => !m.parentId).sort((a, b) => a.order - b.order), [menus]);

  const filteredTables = useMemo(() => {
    if (!searchTableQuery) return tables;
    const q = searchTableQuery.toLowerCase();
    return tables.filter(t =>
      t.name.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q))
    );
  }, [tables, searchTableQuery]);

  const filteredHeadMenus = useMemo(() => {
    if (!moduleSearch) return headMenus;
    const q = moduleSearch.toLowerCase();
    return headMenus.filter(m =>
      m.title?.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q)
    );
  }, [headMenus, moduleSearch]);

  const filteredTxns = useMemo(() => {
    if (!txnSearch) return allTxns;
    const q = txnSearch.toLowerCase();
    return allTxns.filter(t =>
      t.name?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.tables?.toLowerCase().includes(q)
    );
  }, [allTxns, txnSearch]);

  async function handleTableSelect(tb: TableRecord) {
    if (selectedTable?.id === tb.id) return;
    setSelectedTable(tb);
    setSelectedTxn(null);
    setTableFields([]);
    setTableTxns([]);

    // Update URL
    const p = new URLSearchParams(searchParams.toString());
    p.set("view", "tables");
    p.set("table", tb.name);
    router.push(`?${p.toString()}`);

    setLoadingFields(true);
    setLoadingTxns(true);
    try {
      const [txns, fields] = await Promise.all([
        getExplorerTransactions(tb.name),
        fetch(`/api/explorer/fields?tableId=${encodeURIComponent(tb.id)}`).then(r => r.json()).catch(() => []),
      ]);
      setTableTxns(txns);
      setTableFields(fields ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTxns(false);
      setLoadingFields(false);
    }
  }

  function handleMenuSelect(menu: Menu, level: number) {
    const newStack = selectedMenuIds.slice(0, level);
    newStack.push(menu.id);
    setSelectedMenuIds(newStack);
  }

  function setTab(tab: "modules" | "tables" | "transactions") {
    const p = new URLSearchParams();
    p.set("view", tab === "modules" ? "menus" : tab);
    router.push(`/database?${p.toString()}`);
    if (tab !== "tables") setSelectedTable(null);
    if (tab !== "modules") setSelectedMenuIds([]);
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-400 font-bold uppercase tracking-widest animate-pulse border border-slate-200 px-6 py-3 rounded-full bg-white shadow-sm">
            Loading Topology…
          </p>
        </div>
      ) : activeTab === "modules" ? (
        renderModulesView({
          headMenus: filteredHeadMenus,
          menus,
          selectedMenuIds,
          handleMenuSelect,
          setSelectedMenuIds,
          search: moduleSearch,
          setSearch: setModuleSearch,
          totalCount: headMenus.length
        })
      ) : activeTab === "transactions" ? (
        <TransactionsView
          txns={filteredTxns}
          search={txnSearch}
          setSearch={setTxnSearch}
          selectedTxn={selectedTxnFromList}
          onSelectTxn={setSelectedTxnFromList}
          onJumpToTable={(name) => {
            const tb = tables.find(t => t.name.toLowerCase() === name.toLowerCase());
            if (tb) { setTab("tables"); handleTableSelect(tb); }
          }}
        />
      ) : (
        <TablesView
          filteredTables={filteredTables}
          searchTableQuery={searchTableQuery}
          setSearchTableQuery={setSearchTableQuery}
          selectedTable={selectedTable}
          handleTableSelect={handleTableSelect}
          tableFields={tableFields}
          loadingFields={loadingFields}
          tableTxns={tableTxns}
          loadingTxns={loadingTxns}
          selectedTxn={selectedTxn}
          onSelectTxn={setSelectedTxn}
          onClose={() => { setSelectedTable(null); setSelectedTxn(null); }}
          onJumpToTable={(name) => {
            const tb = tables.find(t => t.name.toLowerCase() === name.toLowerCase());
            if (tb) handleTableSelect(tb);
          }}
        />
      )}
    </div>
  );
}

// ─── Modules View ─────────────────────────────────────────────────────────────

function renderModulesView({
  headMenus, menus, selectedMenuIds, handleMenuSelect, setSelectedMenuIds,
  search, setSearch, totalCount
}: {
  headMenus: Menu[], menus: Menu[], selectedMenuIds: string[],
  handleMenuSelect: (m: Menu, lvl: number) => void,
  setSelectedMenuIds: (ids: string[]) => void,
  search: string, setSearch: (s: string) => void,
  totalCount: number
}) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-8 pt-8 pb-5 shrink-0 border-b border-slate-200/60 bg-white/60 backdrop-blur-md z-10 sticky top-0 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/20">
            <Layout className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-xl font-bold font-sans text-slate-800 tracking-tight">FORS Explorer</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs font-normal text-slate-400">Everything connected, Browse Menus.</p>
              <div className="w-1 h-1 rounded-full bg-slate-300" />
              <p className="text-xs font-bold text-blue-600">{totalCount} modules total</p>
            </div>
          </div>
        </div>

        <div className="w-72 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text" placeholder="Search modules…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-100 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {headMenus.map(m => (
              <ModuleCard key={m.id} menu={m} isSelected={selectedMenuIds[0] === m.id} onClick={() => handleMenuSelect(m, 0)} />
            ))}
          </div>
        </div>

        <div className={clsx(
          "w-[400px] border-l border-slate-200 bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.05)] transition-all duration-500 ease-in-out shrink-0 flex flex-col h-full",
          selectedMenuIds.length > 0 ? "translate-x-0" : "translate-x-full absolute right-0"
        )}>
          {selectedMenuIds.length > 0 && (
            <MenuDetailPanel
              menus={menus}
              selectedIds={selectedMenuIds}
              onClose={() => setSelectedMenuIds([])}
              onSelectChild={(m, lvl) => handleMenuSelect(m, lvl)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Transactions View ────────────────────────────────────────────────────────

function TransactionsView({ txns, search, setSearch, selectedTxn, onSelectTxn, onJumpToTable }: {
  txns: Txn[], search: string, setSearch: (s: string) => void,
  selectedTxn: Txn | null, onSelectTxn: (t: Txn | null) => void,
  onJumpToTable: (name: string) => void,
}) {
  return (
    <div className="flex-1 flex overflow-hidden">
      {/* List */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 pt-8 pb-5 shrink-0 border-b border-slate-200/60 bg-white/60 backdrop-blur-md z-10 sticky top-0 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-purple-600/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-xl font-bold font-sans text-slate-800 tracking-tight">FORS Explorer</h4>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs font-normal text-slate-400">Everything connected, Browse Transactions.</p>
                <div className="w-1 h-1 rounded-full bg-slate-300" />
                <p className="text-xs font-bold text-purple-600">{txns.length} transactions total</p>
              </div>
            </div>
          </div>
          <div className="w-72 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text" placeholder="Search transactions…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-100 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-purple-500/20 transition-all"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="space-y-3">
            {txns.map(t => (
              <div
                key={t.id}
                onClick={() => onSelectTxn(t)}
                className={clsx(
                  "group cursor-pointer bg-white rounded-2xl border-2 p-5 transition-all hover:shadow-lg hover:-translate-y-0.5 flex items-start gap-5",
                  selectedTxn?.id === t.id ? "border-purple-500 shadow-md shadow-purple-500/10" : "border-slate-100 hover:border-slate-300"
                )}
              >
                <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
                  <FileCode className="w-5 h-5 text-purple-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-slate-800 truncate group-hover:text-purple-700 transition-colors">{t.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{t.description}</p>
                  <div className="flex gap-2 mt-2">
                    {t.pgmType && <span className="bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-slate-200">{t.pgmType}</span>}
                    {t.language && <span className="bg-blue-50 text-blue-500 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-blue-100">{t.language}</span>}
                    <span className="text-[9px] text-slate-400 font-medium mt-0.5">{t.tables?.split(",").filter(Boolean).length ?? 0} tables</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-purple-500 group-hover:translate-x-1 transition-all mt-1 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedTxn && (
        <div className="w-[460px] border-l border-slate-200 bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.05)] flex flex-col shrink-0 overflow-hidden">
          <TxnDetailPanel txn={selectedTxn} onClose={() => onSelectTxn(null)} onJumpToTable={onJumpToTable} />
        </div>
      )}
    </div>
  );
}

// ─── Tables View ──────────────────────────────────────────────────────────────

function escapeCSV(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function TablesView({
  filteredTables, searchTableQuery, setSearchTableQuery,
  selectedTable, handleTableSelect, tableFields, loadingFields,
  tableTxns, loadingTxns, selectedTxn, onSelectTxn, onClose, onJumpToTable
}: any) {
  const [exportMode, setExportMode] = useState(false);
  const [selectedForExport, setSelectedForExport] = useState<Set<string>>(new Set());
  const [exportingCSV, setExportingCSV] = useState(false);

  function toggleExportSelect(id: string) {
    setSelectedForExport(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedForExport(new Set(filteredTables.map((t: TableRecord) => t.id)));
  }

  function cancelExport() {
    setExportMode(false);
    setSelectedForExport(new Set());
  }

  async function downloadCSV() {
    setExportingCSV(true);
    try {
      const chosen: TableRecord[] = filteredTables.filter((t: TableRecord) => selectedForExport.has(t.id));
      const rows: string[] = ["Table,Field,Type,Length,Nullable,Description"];
      for (const tbl of chosen) {
        const fields: any[] = await fetch(`/api/explorer/fields?tableId=${encodeURIComponent(tbl.id)}`)
          .then(r => r.json()).catch(() => []);
        if (!fields || fields.length === 0) {
          rows.push([tbl.name, "", "", "", "", ""].map(escapeCSV).join(","));
        } else {
          for (const f of fields) {
            rows.push([
              tbl.name, f.name, f.type,
              f.length ?? "",
              f.nullable === false ? "NOT NULL" : "nullable",
              f.description ?? ""
            ].map(escapeCSV).join(","));
          }
        }
      }
      const blob = new Blob([rows.join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fors_schema_export_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      cancelExport();
    } finally {
      setExportingCSV(false);
    }
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Page header */}
        <div className="px-8 pt-8 pb-5 shrink-0 border-b border-slate-200/60 bg-white/60 backdrop-blur-md z-10 sticky top-0">
          <div className="flex items-center justify-between gap-4">
            {/* Title block */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/20">
                <Layout className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-xl font-bold font-sans text-slate-800 tracking-tight">FORS Explorer</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs font-normal text-slate-400">Everything connected, Browse Tables.</p>
                  <div className="w-1 h-1 rounded-full bg-slate-300" />
                  <p className="text-xs font-bold text-indigo-600">{filteredTables.length} tables total</p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text" placeholder="Search everything…"
                  value={searchTableQuery} onChange={e => setSearchTableQuery(e.target.value)}
                  className="w-64 bg-slate-100 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              {exportMode ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={selectAll}
                    className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-all"
                  >
                    Select All
                  </button>
                  <button
                    onClick={downloadCSV}
                    disabled={selectedForExport.size === 0 || exportingCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {exportingCSV ? "Exporting…" : `Download CSV (${selectedForExport.size})`}
                  </button>
                  <button
                    onClick={cancelExport}
                    className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-red-500 border border-slate-200 rounded-xl bg-white hover:bg-red-50 hover:border-red-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setExportMode(true)}
                  className="flex items-center gap-2 px-4 py-2.5 border-2 border-slate-200 hover:border-indigo-400 text-slate-600 hover:text-indigo-600 rounded-xl text-sm font-bold transition-all bg-white hover:bg-indigo-50/40"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              )}
            </div>
          </div>

          {/* Export mode indicator */}
          {exportMode && (
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5">
              <CheckSquare className="w-4 h-4" />
              Export mode active — select tables to include in the CSV download.
              <span className="ml-1 text-indigo-800">{selectedForExport.size} selected</span>
            </div>
          )}
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
              {filteredTables.map((t: TableRecord) => (
                <TableCard
                  key={t.id}
                  table={t}
                  isSelected={selectedTable?.id === t.id}
                  onClick={() => exportMode ? toggleExportSelect(t.id) : handleTableSelect(t)}
                  exportMode={exportMode}
                  exportSelected={selectedForExport.has(t.id)}
                />
              ))}
            </div>
          </div>

          {selectedTable && !exportMode && (
            <div className="w-[480px] border-l border-slate-200 bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.05)] flex flex-col shrink-0 z-20 overflow-hidden">
              <TableDetailPanel
                table={selectedTable}
                fields={tableFields}
                loadingFields={loadingFields}
                txns={tableTxns}
                loadingTxns={loadingTxns}
                selectedTxn={selectedTxn}
                onSelectTxn={onSelectTxn}
                onClose={onClose}
                onJumpToTable={onJumpToTable}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ModuleCard ───────────────────────────────────────────────────────────────

function ModuleCard({ menu, isSelected, onClick }: { menu: Menu, isSelected: boolean, onClick: () => void }) {
  const grad = getGradient(menu.title);
  return (
    <div
      onClick={onClick}
      className={clsx(
        "group cursor-pointer rounded-3xl bg-white border-2 p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-300/50 hover:-translate-y-1 relative overflow-hidden",
        isSelected ? "border-blue-500 shadow-xl shadow-blue-500/20" : "border-slate-100/80 shadow-md"
      )}
    >
      <div className={clsx("absolute top-0 left-0 w-full h-1 bg-gradient-to-r opacity-50 group-hover:opacity-100 transition-opacity", grad)} />
      <div className="flex items-start justify-between mb-8">
        <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br", grad)}>
          <Layers className="w-6 h-6 text-white drop-shadow-md" />
        </div>
        <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-slate-200/50 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" /> {menu.childCount} Sub
        </div>
      </div>
      <h3 className="text-xl font-black text-slate-800 mb-2 group-hover:text-blue-600 transition-colors leading-tight line-clamp-1">{menu.title}</h3>
      <p className="text-sm text-slate-500 font-medium leading-relaxed line-clamp-2 min-h-[40px]">{menu.description || "No description available."}</p>
      {isSelected && (
        <div className="absolute bottom-4 right-4 animate-in fade-in zoom-in w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg">
          <ChevronRight className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}

// ─── MenuDetailPanel ──────────────────────────────────────────────────────────

function MenuDetailPanel({ menus, selectedIds, onClose, onSelectChild }: {
  menus: Menu[], selectedIds: string[], onClose: () => void,
  onSelectChild: (m: Menu, lvl: number) => void,
}) {
  const currentId = selectedIds[selectedIds.length - 1];
  const currentMenu = menus.find(m => m.id === currentId);
  const children = menus.filter(m => m.parentId === currentId).sort((a, b) => a.order - b.order);
  const level = selectedIds.length;
  if (!currentMenu) return null;

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <div className="p-6 bg-white border-b border-slate-200 flex items-start gap-4 sticky top-0 z-10 shrink-0">
        {level > 1 && (
          <button
            onClick={() => onSelectChild(menus.find(m => m.id === selectedIds[level - 2])!, level - 2)}
            className="mt-1 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors text-slate-600 shrink-0"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">Level {level} Menu</span>
            <span className="text-[10px] font-mono text-slate-400">ID: {currentMenu.id.slice(0, 8)}</span>
          </div>
          <h3 className="text-2xl font-black text-slate-800 leading-tight mb-2">{currentMenu.title}</h3>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">{currentMenu.description || "No specific details provided."}</p>
        </div>
        <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 hover:text-red-500 rounded-full transition-colors text-slate-500 shrink-0">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 px-2">Sub-Modules ({children.length})</h4>
        {children.length === 0 ? (
          <div className="p-8 text-center bg-white border border-slate-200/60 border-dashed rounded-2xl mx-2">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Layers className="w-5 h-5 text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-600">No sub-modules</p>
            <p className="text-xs text-slate-400 mt-1">This is a leaf node.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {children.map(child => (
              <div
                key={child.id}
                onClick={() => onSelectChild(child, level)}
                className="flex items-center gap-3 px-2 py-3 hover:bg-slate-100/80 cursor-pointer transition-colors group rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">{child.title}</p>
                  {child.description && (
                    <p className="text-xs text-slate-400 truncate mt-0.5">{child.description}</p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-200 bg-white shrink-0">
        <details className="text-xs text-slate-500 font-mono group cursor-pointer">
          <summary className="font-bold flex items-center gap-2 select-none group-hover:text-slate-800 transition-colors">
            <Code2 className="w-4 h-4" /> View DB Record
          </summary>
          <div className="mt-3 p-4 bg-slate-900 text-green-400 rounded-xl overflow-x-auto">
            <pre>{JSON.stringify(currentMenu, null, 2)}</pre>
          </div>
        </details>
      </div>
    </div>
  );
}

// ─── TableCard ────────────────────────────────────────────────────────────────

function TableCard({
  table, isSelected, onClick, exportMode, exportSelected
}: {
  table: TableRecord, isSelected: boolean, onClick: () => void,
  exportMode?: boolean, exportSelected?: boolean
}) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "group cursor-pointer rounded-3xl bg-white border-2 p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 relative overflow-hidden",
        exportMode
          ? exportSelected
            ? "border-indigo-500 shadow-xl shadow-indigo-500/20 bg-indigo-50/40"
            : "border-slate-200 hover:border-indigo-300"
          : isSelected
            ? "border-indigo-500 shadow-xl shadow-indigo-500/20 bg-indigo-50/30"
            : "border-slate-100 shadow-md"
      )}
    >
      {/* Export checkbox overlay */}
      {exportMode && (
        <div className="absolute top-4 right-4 z-10">
          {exportSelected
            ? <CheckSquare className="w-5 h-5 text-indigo-600" />
            : <Square className="w-5 h-5 text-slate-300 group-hover:text-indigo-400" />}
        </div>
      )}
      <div className="flex items-start justify-between mb-5">
        <div className={clsx(
          "w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-sm",
          (isSelected && !exportMode) ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600"
        )}>
          <Table2 className="w-5 h-5" />
        </div>
        <span className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border border-slate-200">
          {table.txnCount} Txns
        </span>
      </div>
      <h3 className="text-lg font-black text-slate-800 mb-2 font-mono tracking-tight group-hover:text-indigo-600 transition-colors">{table.name}</h3>
      <p className="text-sm text-slate-500 font-medium leading-relaxed line-clamp-2 min-h-[40px] mb-6">{table.description || "No table description."}</p>
      <div className="flex items-center gap-4 border-t border-slate-100 pt-4 mt-auto">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
          <Layout className="w-4 h-4 text-emerald-500" /> {table.fieldCount} Fields
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
          <Tag className="w-4 h-4 text-orange-500" /> {table.indexCount} Indexes
        </div>
      </div>
    </div>
  );
}

// ─── TableDetailPanel ─────────────────────────────────────────────────────────

function TableDetailPanel({ table, fields, loadingFields, txns, loadingTxns, selectedTxn, onSelectTxn, onClose, onJumpToTable }: {
  table: TableRecord, fields: DbField[], loadingFields: boolean,
  txns: Txn[], loadingTxns: boolean, selectedTxn: Txn | null,
  onSelectTxn: (t: Txn | null) => void, onClose: () => void, onJumpToTable: (t: string) => void
}) {
  const [subTab, setSubTab] = useState<"fields" | "txns">("fields");

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* Header */}
      <div className="p-6 bg-slate-900 border-b border-indigo-500/30 flex items-start justify-between sticky top-0 z-20 shrink-0">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Table2 className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Database Table</span>
          </div>
          <h3 className="text-2xl font-black text-white font-mono tracking-tight mb-1">{table.name}</h3>
          <p className="text-sm text-slate-300 font-medium">{table.description || "No description."}</p>
        </div>
        <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 hover:text-red-400 rounded-full transition-colors text-slate-300 shrink-0 shadow-lg">
          <X className="w-5 h-5" />
        </button>
      </div>

      {selectedTxn ? (
        <div className="absolute inset-0 bg-white z-30 flex flex-col pt-0 overflow-hidden">
          <TxnDetailPanel txn={selectedTxn} onClose={() => onSelectTxn(null)} onJumpToTable={onJumpToTable} />
        </div>
      ) : (
        <>
          {/* Sub-tabs */}
          <div className="flex bg-slate-800 mx-4 mt-4 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setSubTab("fields")}
              className={clsx("flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                subTab === "fields" ? "bg-indigo-500 text-white shadow" : "text-slate-400 hover:text-slate-200")}
            >
              <AlignLeft className="w-3.5 h-3.5" /> Fields ({fields.length || table.fieldCount})
            </button>
            <button
              onClick={() => setSubTab("txns")}
              className={clsx("flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                subTab === "txns" ? "bg-purple-500 text-white shadow" : "text-slate-400 hover:text-slate-200")}
            >
              <FileCode className="w-3.5 h-3.5" /> Transactions ({txns.length})
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {subTab === "fields" ? (
              loadingFields ? (
                <div className="py-8 text-center text-slate-400 text-xs animate-pulse">Loading fields…</div>
              ) : fields.length === 0 ? (
                <div className="py-8 text-center">
                  <AlignLeft className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-500">No field data available</p>
                  <p className="text-xs text-slate-400 mt-1">database_fields table may be empty for this record.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {fields.map((f, i) => (
                    <div key={f.id ?? i} className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3 hover:border-indigo-300 transition-colors">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                        <Hash className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-black text-slate-800 text-sm font-mono">{f.name}</span>
                        {f.description && <p className="text-[11px] text-slate-500 truncate mt-0.5">{f.description}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="bg-slate-100 text-slate-500 font-mono text-[10px] px-2 py-0.5 rounded border border-slate-200">{f.type}</span>
                        {f.length ? <span className="text-[10px] text-slate-400">({f.length})</span> : null}
                        {f.nullable === false && <span className="text-[9px] font-black text-orange-500 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded uppercase">NOT NULL</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              // Transactions sub-tab
              loadingTxns ? (
                <div className="py-8 text-center text-slate-400 text-xs animate-pulse">Loading transactions…</div>
              ) : txns.length === 0 ? (
                <div className="py-8 text-center">
                  <HardDrive className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-600">No transactions linked</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {txns.map(t => (
                    <div
                      key={t.id}
                      onClick={() => onSelectTxn(t)}
                      className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                          <FileCode className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{t.name}</h5>
                          <p className="text-[11px] text-slate-500 font-medium truncate">{t.description}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border border-slate-200">{t.pgmType}</span>
                        <span className="bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border border-slate-200">{t.language}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── TxnDetailPanel (shared) ──────────────────────────────────────────────────

function TxnDetailPanel({ txn, onClose, onJumpToTable }: {
  txn: Txn, onClose: () => void, onJumpToTable: (t: string) => void
}) {
  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      <div className="p-5 bg-slate-900 flex items-start justify-between shrink-0">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-emerald-200">{txn.pgmType}</span>
            <span className="bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-blue-200">{txn.language}</span>
          </div>
          <h4 className="text-xl font-black text-white mb-1">{txn.name}</h4>
          <p className="text-sm text-slate-300 font-medium">{txn.description}</p>
        </div>
        <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 hover:text-red-400 rounded-full transition-colors text-slate-300 shrink-0">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-5">
        {/* Linked Tables */}
        <div>
          <h5 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-3">
            <LinkIcon className="w-4 h-4" /> Linked Tables ({txn.tables?.split(",").filter(Boolean).length ?? 0})
          </h5>
          <div className="flex flex-wrap gap-2">
            {txn.tables?.split(",").map(name => {
              const tb = name.trim();
              if (!tb) return null;
              return (
                <button
                  key={tb}
                  onClick={() => onJumpToTable(tb)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-colors border bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border-slate-200"
                >
                  {tb}
                </button>
              );
            })}
          </div>
        </div>

        {/* SQL Profile */}
        <div>
          <h5 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-3">
            <FileCode className="w-4 h-4" /> SQL Profile (sqlPg)
          </h5>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 overflow-x-auto shadow-inner">
            <pre className="text-emerald-400 font-mono text-[11px] font-medium leading-relaxed">
              {txn.sqlPg || "-- No SQL available"}
            </pre>
          </div>
        </div>

        {/* Programs */}
        <div>
          <h5 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-3">
            <Cpu className="w-4 h-4" /> Programs
          </h5>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <span className="font-mono text-xs text-slate-700">{txn.pgms || "None"}</span>
          </div>
        </div>

        <details className="text-xs text-slate-500 font-mono group cursor-pointer bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <summary className="font-bold flex items-center gap-2 select-none group-hover:text-slate-800 transition-colors">
            <Code2 className="w-4 h-4" /> View Full Record
          </summary>
          <div className="mt-3 p-4 bg-slate-900 text-[10px] text-green-400 rounded-xl overflow-x-auto">
            <pre>{JSON.stringify(txn, null, 2)}</pre>
          </div>
        </details>
      </div>
    </div>
  );
}
