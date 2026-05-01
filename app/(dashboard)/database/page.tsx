"use client";

import { useState, useEffect, Suspense, useMemo, useCallback, startTransition, type FormEvent, type ReactNode } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  getExplorerMenus,
  getExplorerTables,
  getExplorerTransactions,
  getTransactions,
  addMenuAction,
  addTableAction,
  addTransactionAction,
  addFieldAction,
  addIndexAction,
} from "@/app/actions";
import { getMyRoleAction } from "@/app/actions/admin-actions";
import {
  Layout, Layers, Table2, HardDrive, Cpu, Search, X,
  FileCode, Tag, Code2, Link as LinkIcon, ChevronRight,
  AlignLeft, Hash, Compass, Download, CheckSquare, Square,
  Plus, Loader2,
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
type DbIndex = {
  id: string;
  name: string;
  isUnique: boolean;
  fields: string;
  description?: string;
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

type ExplorerCreateTarget = "modules" | "tables" | "transactions" | "fields" | "indexes";

type MenuCreatePayload = {
  title: string;
  description: string;
  parentId: string;
  order: string;
};

type TableCreatePayload = {
  name: string;
  description: string;
  fieldsString: string;
  indexesString: string;
};

type TransactionCreatePayload = {
  name: string;
  description: string;
  pgmType: string;
  language: string;
  tables: string;
  pgms: string;
};

type FieldCreatePayload = {
  tableId: string;
  name: string;
  type: string;
  length: string;
  nullable: boolean;
  description: string;
  position: string;
};

type IndexCreatePayload = {
  tableId: string;
  name: string;
  isUnique: boolean;
  fields: string;
  description: string;
};

type ExplorerCreatePayload =
  | MenuCreatePayload
  | TableCreatePayload
  | TransactionCreatePayload
  | FieldCreatePayload
  | IndexCreatePayload;

const MENU_CREATE_DEFAULTS: MenuCreatePayload = {
  title: "",
  description: "",
  parentId: "",
  order: "0",
};

const TABLE_CREATE_DEFAULTS: TableCreatePayload = {
  name: "",
  description: "",
  fieldsString: "",
  indexesString: "",
};

const TRANSACTION_CREATE_DEFAULTS: TransactionCreatePayload = {
  name: "",
  description: "",
  pgmType: "",
  language: "",
  tables: "",
  pgms: "",
};

const FIELD_CREATE_DEFAULTS: FieldCreatePayload = {
  tableId: "",
  name: "",
  type: "VARCHAR",
  length: "",
  nullable: true,
  description: "",
  position: "0",
};

const INDEX_CREATE_DEFAULTS: IndexCreatePayload = {
  tableId: "",
  name: "",
  isUnique: false,
  fields: "",
  description: "",
};

const PROGRAM_TYPE_OPTIONS = ["Batch Job", "API", "Transaction", "Report", "Service", "Function Module"];
const LANGUAGE_OPTIONS = ["ABAP", "SQL", "JavaScript", "TypeScript", "Java", "Python"];
const FIELD_TYPE_OPTIONS = ["VARCHAR", "INT", "BIGINT", "DECIMAL", "DATE", "DATETIME", "BOOLEAN", "TEXT"];

const EXPLORER_CREATE_THEME: Record<ExplorerCreateTarget, {
  label: string;
  helper: string;
  accent: string;
  shadow: string;
  ring: string;
  panelGlow: string;
  pill: string;
  button: string;
}> = {
  modules: {
    label: "Menu",
    helper: "Map the product structure and place new modules exactly where they belong.",
    accent: "from-blue-500 via-cyan-500 to-sky-500",
    shadow: "shadow-blue-500/20",
    ring: "focus:ring-blue-500/25 focus:border-blue-400",
    panelGlow: "from-blue-500/20 via-cyan-400/10 to-transparent",
    pill: "bg-blue-500/10 text-blue-700 border-blue-200/70",
    button: "bg-blue-600 hover:bg-blue-500",
  },
  tables: {
    label: "Table",
    helper: "Register a new business table and describe the data domain it owns.",
    accent: "from-indigo-500 via-violet-500 to-blue-500",
    shadow: "shadow-indigo-500/20",
    ring: "focus:ring-indigo-500/25 focus:border-indigo-400",
    panelGlow: "from-indigo-500/20 via-violet-400/10 to-transparent",
    pill: "bg-indigo-500/10 text-indigo-700 border-indigo-200/70",
    button: "bg-indigo-600 hover:bg-indigo-500",
  },
  transactions: {
    label: "Transaction",
    helper: "Capture backend programs, jobs, or services and link them to their tables.",
    accent: "from-purple-500 via-fuchsia-500 to-pink-500",
    shadow: "shadow-purple-500/20",
    ring: "focus:ring-purple-500/25 focus:border-purple-400",
    panelGlow: "from-purple-500/20 via-fuchsia-400/10 to-transparent",
    pill: "bg-purple-500/10 text-purple-700 border-purple-200/70",
    button: "bg-purple-600 hover:bg-purple-500",
  },
  fields: {
    label: "Field",
    helper: "Define column structure with type, nullability, and order for a selected table.",
    accent: "from-emerald-500 via-teal-500 to-cyan-500",
    shadow: "shadow-emerald-500/20",
    ring: "focus:ring-emerald-500/25 focus:border-emerald-400",
    panelGlow: "from-emerald-500/20 via-teal-400/10 to-transparent",
    pill: "bg-emerald-500/10 text-emerald-700 border-emerald-200/70",
    button: "bg-emerald-600 hover:bg-emerald-500",
  },
  indexes: {
    label: "Index",
    helper: "Create performance metadata and identify which fields participate in each index.",
    accent: "from-amber-500 via-orange-500 to-rose-500",
    shadow: "shadow-amber-500/20",
    ring: "focus:ring-amber-500/25 focus:border-amber-400",
    panelGlow: "from-amber-500/20 via-orange-400/10 to-transparent",
    pill: "bg-amber-500/10 text-amber-700 border-amber-200/70",
    button: "bg-amber-600 hover:bg-amber-500",
  },
};

function buildMenuOptions(menus: Menu[], parentId: string | null = null, depth = 0): { id: string; label: string }[] {
  return menus
    .filter((menu) => menu.parentId === parentId)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
    .flatMap((menu) => {
      const prefix = depth > 0 ? "\u00A0\u00A0\u00A0\u00A0".repeat(depth) + "\u2514\u00A0" : "";
      return [
        { id: menu.id, label: `${prefix}${menu.title}` },
        ...buildMenuOptions(menus, menu.id, depth + 1),
      ];
    });
}

function splitExplorerList(value?: string | null) {
  if (!value) return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function mergeExplorerList(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).join(", ");
}

function toggleExplorerListValue(currentValue: string, value: string) {
  const next = new Set(splitExplorerList(currentValue));
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return mergeExplorerList(Array.from(next));
}

function ExplorerAddButton({ target, onClick }: { target: ExplorerCreateTarget; onClick: () => void }) {
  const theme = EXPLORER_CREATE_THEME[target];

  return (
    <button
      onClick={onClick}
      className={clsx(
        "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-black text-white transition-all active:scale-[0.98]",
        "shadow-lg backdrop-blur-md",
        theme.button,
        theme.shadow,
      )}
    >
      <Plus className="h-4 w-4" />
      Create {theme.label}
    </button>
  );
}

function ExplorerCreateModal({
  open,
  target,
  menus,
  tables,
  saving,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  target: ExplorerCreateTarget | null;
  menus: Menu[];
  tables: TableRecord[];
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (target: ExplorerCreateTarget, payload: ExplorerCreatePayload) => Promise<void>;
}) {
  const [menuForm, setMenuForm] = useState<MenuCreatePayload>(MENU_CREATE_DEFAULTS);
  const [tableForm, setTableForm] = useState<TableCreatePayload>(TABLE_CREATE_DEFAULTS);
  const [transactionForm, setTransactionForm] = useState<TransactionCreatePayload>(TRANSACTION_CREATE_DEFAULTS);
  const [fieldForm, setFieldForm] = useState<FieldCreatePayload>(FIELD_CREATE_DEFAULTS);
  const [indexForm, setIndexForm] = useState<IndexCreatePayload>(INDEX_CREATE_DEFAULTS);
  const [activeTarget, setActiveTarget] = useState<ExplorerCreateTarget>("modules");
  const [tableSearch, setTableSearch] = useState("");
  const [indexFieldSearch, setIndexFieldSearch] = useState("");
  const [tableFieldOptions, setTableFieldOptions] = useState<DbField[]>([]);
  const [loadingTableFields, setLoadingTableFields] = useState(false);

  useEffect(() => {
    if (!open) return;
    setActiveTarget(target ?? "modules");
    setMenuForm(MENU_CREATE_DEFAULTS);
    setTableForm(TABLE_CREATE_DEFAULTS);
    setTransactionForm(TRANSACTION_CREATE_DEFAULTS);
    setFieldForm(FIELD_CREATE_DEFAULTS);
    setIndexForm(INDEX_CREATE_DEFAULTS);
    setTableSearch("");
    setIndexFieldSearch("");
    setTableFieldOptions([]);
  }, [open, target]);

  const menuOptions = useMemo(() => buildMenuOptions(menus), [menus]);
  const filteredTransactionTables = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return tables;
    return tables.filter((table) =>
      table.name.toLowerCase().includes(q) ||
      table.description?.toLowerCase().includes(q),
    );
  }, [tables, tableSearch]);

  const indexFieldOptions = useMemo(() => {
    const q = indexFieldSearch.trim().toLowerCase();
    if (!q) return tableFieldOptions;
    return tableFieldOptions.filter((field) =>
      field.name.toLowerCase().includes(q) ||
      field.type?.toLowerCase().includes(q),
    );
  }, [tableFieldOptions, indexFieldSearch]);
  const modalTarget: ExplorerCreateTarget = target ?? activeTarget;
  const theme = EXPLORER_CREATE_THEME[modalTarget];
  const selectedTransactionTables = splitExplorerList(transactionForm.tables);
  const selectedIndexFields = splitExplorerList(indexForm.fields);
  const selectedFieldTable = tables.find((table) => table.id === fieldForm.tableId);
  const selectedIndexTable = tables.find((table) => table.id === indexForm.tableId);
  const inputClass = clsx(
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm outline-none transition-all",
    "placeholder:text-slate-400 focus:bg-slate-50",
    theme.ring,
  );
  const sectionCardClass = "rounded-[24px] border border-slate-200 bg-slate-50/50 p-5 shadow-sm";

  useEffect(() => {
    if (open && target) setActiveTarget(target);
  }, [open, target]);

  useEffect(() => {
    const selectedTableId = modalTarget === "fields" ? fieldForm.tableId : modalTarget === "indexes" ? indexForm.tableId : "";

    if (!selectedTableId) {
      setTableFieldOptions([]);
      return;
    }

    let cancelled = false;
    setLoadingTableFields(true);

    fetch(`/api/explorer/fields?tableId=${encodeURIComponent(selectedTableId)}`)
      .then((response) => response.json())
      .then((rows) => {
        if (!cancelled) setTableFieldOptions(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!cancelled) setTableFieldOptions([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingTableFields(false);
      });

    return () => {
      cancelled = true;
    };
  }, [modalTarget, fieldForm.tableId, indexForm.tableId]);

  if (!open || !target) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (modalTarget === "modules") {
      await onSubmit("modules", menuForm);
      return;
    }

    if (modalTarget === "tables") {
      await onSubmit("tables", tableForm);
      return;
    }

    if (modalTarget === "transactions") {
      await onSubmit("transactions", transactionForm);
      return;
    }

    if (modalTarget === "fields") {
      await onSubmit("fields", fieldForm);
      return;
    }

    await onSubmit("indexes", indexForm);
  }

  return (
    <div className="fixed top-14 left-56 right-0 bottom-0 z-[999] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-xl" onClick={onClose}>
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_20px_80px_rgba(15,23,42,0.20)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={clsx("pointer-events-none absolute inset-0 bg-gradient-to-br", theme.panelGlow)} />
        <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-white/40 blur-3xl" />

        <div className="relative border-b border-slate-100 px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className={clsx("inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em]", theme.pill)}>
                FORS Command Center
              </div>
              <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-900">Create {theme.label}</h3>
              <p className="mt-2 max-w-3xl text-sm text-slate-500">
                {theme.helper}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border border-white/60 bg-white/70 p-2 text-slate-500 transition-colors hover:text-rose-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>



        <form onSubmit={handleSubmit} className="relative max-h-[55vh] overflow-y-auto px-5 py-5 sm:px-6">
          <div className="space-y-5">
            {modalTarget === "modules" && (
              <>
                <div className="flex flex-col gap-5">
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">Title</label>
                    <input
                      value={menuForm.title}
                      onChange={(event) => setMenuForm((current) => ({ ...current, title: event.target.value }))}
                      placeholder="Inventory Management"
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">Parent Menu</label>
                    <select
                      value={menuForm.parentId}
                      onChange={(event) => setMenuForm((current) => ({ ...current, parentId: event.target.value }))}
                      className={inputClass}
                    >
                      <option value="">+ Add as New Top-Level Menu (No Parent)</option>
                      {menuOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">Order</label>
                    <input
                      type="number"
                      min="0"
                      value={menuForm.order}
                      onChange={(event) => setMenuForm((current) => ({ ...current, order: event.target.value }))}
                      placeholder="0"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">Description</label>
                  <textarea
                    value={menuForm.description}
                    onChange={(event) => setMenuForm((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Describe what this module owns and how it fits into the system."
                    rows={4}
                    className={clsx(inputClass, "resize-none")}
                  />
                </div>
              </>
            )}

            {modalTarget === "tables" && (
              <>
                <div className="flex flex-col gap-5">
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">Table Name</label>
                    <input
                      value={tableForm.name}
                      onChange={(event) => setTableForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder="incidents_archive"
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">Fields</label>
                    <input
                      value={tableForm.fieldsString}
                      onChange={(event) => setTableForm((current) => ({ ...current, fieldsString: event.target.value }))}
                      placeholder="id, name, status, created_at (comma-separated)"
                      className={inputClass}
                    />
                    <p className="mt-2 text-[10px] text-slate-400">Optional. Fields will be created as VARCHAR(255).</p>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">Indexes</label>
                    <input
                      value={tableForm.indexesString}
                      onChange={(event) => setTableForm((current) => ({ ...current, indexesString: event.target.value }))}
                      placeholder="name; status, created_at (semicolon-separated for multiple indexes)"
                      className={inputClass}
                    />
                    <p className="mt-2 text-[10px] text-slate-400">Optional. Indexes will be created as non-unique.</p>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">Description</label>
                    <textarea
                      value={tableForm.description}
                      onChange={(event) => setTableForm((current) => ({ ...current, description: event.target.value }))}
                      placeholder="Explain the purpose of this table and the data it stores."
                      rows={4}
                      className={clsx(inputClass, "resize-none")}
                    />
                  </div>
                </div>
              </>
            )}

            {modalTarget === "transactions" && (
              <>
                <div className="flex flex-col gap-5">
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">Name</label>
                    <input
                      value={transactionForm.name}
                      onChange={(event) => setTransactionForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Z_FORS_SYNC"
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">Program Type</label>
                    <input
                      list="fors-program-types"
                      value={transactionForm.pgmType}
                      onChange={(event) => setTransactionForm((current) => ({ ...current, pgmType: event.target.value }))}
                      placeholder="Batch Job"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">Language</label>
                    <input
                      list="fors-language-types"
                      value={transactionForm.language}
                      onChange={(event) => setTransactionForm((current) => ({ ...current, language: event.target.value }))}
                      placeholder="ABAP"
                      className={inputClass}
                    />
                  </div>
                </div>
                <datalist id="fors-program-types">
                  {PROGRAM_TYPE_OPTIONS.map((option) => <option key={option} value={option} />)}
                </datalist>
                <datalist id="fors-language-types">
                  {LANGUAGE_OPTIONS.map((option) => <option key={option} value={option} />)}
                </datalist>
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">Description</label>
                  <textarea
                    value={transactionForm.description}
                    onChange={(event) => setTransactionForm((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Summarize the job, service, or program behavior."
                    rows={4}
                    className={clsx(inputClass, "resize-none")}
                  />
                </div>
                <div className={sectionCardClass}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-[0.22em] text-slate-500">Associated Tables</label>
                      <p className="mt-2 text-xs text-slate-400">Search and click tables to build the transaction mapping faster.</p>
                    </div>
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">
                      {selectedTransactionTables.length} selected
                    </div>
                  </div>
                  <div className="mt-4 relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={tableSearch}
                      onChange={(event) => setTableSearch(event.target.value)}
                      placeholder="Search registered tables..."
                      className={clsx(inputClass, "pl-10")}
                    />
                  </div>
                  <div className="mt-4 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white/80 p-3">
                    <div className="flex flex-col gap-2">
                      {filteredTransactionTables.map((table) => {
                        const selected = selectedTransactionTables.includes(table.name);
                        return (
                          <button
                            key={table.id}
                            type="button"
                            onClick={() => setTransactionForm((current) => ({
                              ...current,
                              tables: toggleExplorerListValue(current.tables, table.name),
                            }))}
                            className={clsx(
                              "flex items-center gap-2 rounded-2xl border px-3 py-3 text-left transition-all",
                              selected ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                            )}
                          >
                            {selected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4 text-slate-300" />}
                            <div className="min-w-0">
                              <div className="truncate text-sm font-black">{table.name}</div>
                              <div className="truncate text-xs opacity-70">{table.description || "No description"}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-5">
                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">Tables String</label>
                      <input
                        value={transactionForm.tables}
                        onChange={(event) => setTransactionForm((current) => ({ ...current, tables: event.target.value }))}
                        placeholder="tickets, audit_logs, database_tables"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">Programs</label>
                      <input
                        value={transactionForm.pgms}
                        onChange={(event) => setTransactionForm((current) => ({ ...current, pgms: event.target.value }))}
                        placeholder="RPT_FORS_SYNC, ZCL_FORS_WRITER"
                        className={inputClass}
                      />
                      <p className="mt-2 text-xs text-slate-400">Optional related programs, comma-separated.</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {modalTarget === "fields" && (
              <>
                <div className="flex flex-col gap-5">
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">Target Table</label>
                    <select
                      value={fieldForm.tableId}
                      onChange={(event) => setFieldForm((current) => ({ ...current, tableId: event.target.value }))}
                      className={inputClass}
                      required
                    >
                      <option value="">Select a table...</option>
                      {tables.map((table) => (
                        <option key={table.id} value={table.id}>
                          {table.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">Field Name</label>
                    <input
                      value={fieldForm.name}
                      onChange={(event) => setFieldForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder="incident_number"
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">Data Type</label>
                    <input
                      list="fors-field-types"
                      value={fieldForm.type}
                      onChange={(event) => setFieldForm((current) => ({ ...current, type: event.target.value.toUpperCase() }))}
                      className={inputClass}
                      required
                    />
                    <datalist id="fors-field-types">
                      {FIELD_TYPE_OPTIONS.map((option) => <option key={option} value={option} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">Length</label>
                    <input
                      type="number"
                      min="0"
                      value={fieldForm.length}
                      onChange={(event) => setFieldForm((current) => ({ ...current, length: event.target.value }))}
                      placeholder="255"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">Position</label>
                    <input
                      type="number"
                      min="0"
                      value={fieldForm.position}
                      onChange={(event) => setFieldForm((current) => ({ ...current, position: event.target.value }))}
                      placeholder="0"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className={sectionCardClass}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-[0.22em] text-slate-500">Nullability</label>
                      <p className="mt-2 text-xs text-slate-400">Set whether this field may remain empty.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFieldForm((current) => ({ ...current, nullable: !current.nullable }))}
                      className={clsx(
                        "rounded-full border px-4 py-2 text-xs font-black transition-all",
                        fieldForm.nullable ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-orange-200 bg-orange-50 text-orange-700",
                      )}
                    >
                      {fieldForm.nullable ? "Nullable" : "Not Null"}
                    </button>
                  </div>
                  <textarea
                    value={fieldForm.description}
                    onChange={(event) => setFieldForm((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Explain what this field stores and how it is used."
                    rows={5}
                    className={clsx(inputClass, "mt-4 resize-none")}
                  />
                  {selectedFieldTable && (
                    <p className="mt-3 text-xs font-semibold text-slate-500">
                      This field will be attached to <span className="font-black text-slate-700">{selectedFieldTable.name}</span>.
                    </p>
                  )}
                </div>
              </>
            )}

            {modalTarget === "indexes" && (
              <>
                <div className="flex flex-col gap-5">
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">Target Table</label>
                    <select
                      value={indexForm.tableId}
                      onChange={(event) => {
                        setIndexForm((current) => ({ ...current, tableId: event.target.value, fields: "" }));
                        setIndexFieldSearch("");
                      }}
                      className={inputClass}
                      required
                    >
                      <option value="">Select a table...</option>
                      {tables.map((table) => (
                        <option key={table.id} value={table.id}>
                          {table.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">Index Name</label>
                    <input
                      value={indexForm.name}
                      onChange={(event) => setIndexForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder="idx_incident_number"
                      className={inputClass}
                      required
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => setIndexForm((current) => ({ ...current, isUnique: !current.isUnique }))}
                      className={clsx(
                        "w-full rounded-2xl border px-4 py-3 text-sm font-black transition-all",
                        indexForm.isUnique ? "border-amber-300 bg-amber-50 text-amber-700" : "border-slate-200 bg-white text-slate-600",
                      )}
                    >
                      {indexForm.isUnique ? "Unique Index" : "Non-Unique Index"}
                    </button>
                  </div>
                </div>
                <div className={sectionCardClass}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-[0.22em] text-slate-500">Indexed Fields</label>
                      <p className="mt-2 text-xs text-slate-400">Choose one or more fields from the selected table.</p>
                    </div>
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">
                      {selectedIndexFields.length} selected
                    </div>
                  </div>
                  <div className="mt-4 relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={indexFieldSearch}
                      onChange={(event) => setIndexFieldSearch(event.target.value)}
                      placeholder="Search fields..."
                      className={clsx(inputClass, "pl-10")}
                      disabled={!indexForm.tableId}
                    />
                  </div>
                  <div className="mt-4 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white/80 p-3">
                    {!indexForm.tableId ? (
                      <div className="py-10 text-center text-sm font-semibold text-slate-400">Choose a table first to browse its fields.</div>
                    ) : loadingTableFields ? (
                      <div className="py-10 text-center text-sm font-semibold text-slate-400">Loading table fields...</div>
                    ) : indexFieldOptions.length === 0 ? (
                      <div className="py-10 text-center text-sm font-semibold text-slate-400">No fields available for this table.</div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {indexFieldOptions.map((field) => {
                          const selected = selectedIndexFields.includes(field.name);
                          return (
                            <button
                              key={field.id}
                              type="button"
                              onClick={() => setIndexForm((current) => ({
                                ...current,
                                fields: toggleExplorerListValue(current.fields, field.name),
                              }))}
                              className={clsx(
                                "flex items-center gap-2 rounded-2xl border px-3 py-3 text-left transition-all",
                                selected ? "border-amber-300 bg-amber-50 text-amber-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                              )}
                            >
                              {selected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4 text-slate-300" />}
                              <div>
                                <div className="text-sm font-black">{field.name}</div>
                                <div className="text-xs opacity-70">{field.type}{field.length ? ` (${field.length})` : ""}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex flex-col gap-5">
                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">Fields String</label>
                      <input
                        value={indexForm.fields}
                        onChange={(event) => setIndexForm((current) => ({ ...current, fields: event.target.value }))}
                        placeholder="incident_number, sys_created_on"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">Description</label>
                      <input
                        value={indexForm.description}
                        onChange={(event) => setIndexForm((current) => ({ ...current, description: event.target.value }))}
                        placeholder="Optimizes incident lookup"
                        className={inputClass}
                      />
                    </div>
                  </div>
                  {selectedIndexTable && (
                    <p className="mt-3 text-xs font-semibold text-slate-500">
                      This index will be attached to <span className="font-black text-slate-700">{selectedIndexTable.name}</span>.
                    </p>
                  )}
                </div>
              </>
            )}

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm font-medium text-rose-700 shadow-sm">
                {error}
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={clsx(
                "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-60",
                theme.button,
                theme.shadow,
              )}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {saving ? `Creating ${theme.label}...` : `Create ${theme.label}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
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

  // Map view param to active tab
  const activeTab: "modules" | "tables" | "transactions" | "fields" | "indexes" =
    viewParam === "tables" ? "tables" :
      viewParam === "transactions" ? "transactions" :
        viewParam === "fields" ? "fields" :
          viewParam === "indexes" ? "indexes" : "modules";

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
  const [currentRole, setCurrentRole] = useState("user");
  const [createTarget, setCreateTarget] = useState<ExplorerCreateTarget | null>(null);
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);

  const loadExplorerData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);

    try {
      const [nextMenus, nextTables, nextTxns] = await Promise.all([
        getExplorerMenus() as Promise<Menu[]>,
        getExplorerTables() as Promise<TableRecord[]>,
        getTransactions() as Promise<Txn[]>,
      ]);

      setMenus(nextMenus);
      setTables(nextTables);
      setAllTxns(nextTxns);
      setSelectedTable((current) => current ? nextTables.find((table) => table.id === current.id) ?? current : current);
      setSelectedTxn((current) => current ? nextTxns.find((txn) => txn.id === current.id) ?? current : current);
      setSelectedTxnFromList((current) => current ? nextTxns.find((txn) => txn.id === current.id) ?? current : current);

      return { menus: nextMenus, tables: nextTables, txns: nextTxns };
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExplorerData();
  }, [loadExplorerData]);

  useEffect(() => {
    getMyRoleAction()
      .then((role) => setCurrentRole(role))
      .catch(() => setCurrentRole("user"));
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

  const canCreateExplorerRecords = currentRole === "admin" || currentRole === "superadmin";
  const activeCreateTarget =
    activeTab === "modules" ? "modules" :
      activeTab === "tables" ? "tables" :
        activeTab === "transactions" ? "transactions" :
          activeTab === "fields" ? "fields" :
            activeTab === "indexes" ? "indexes" : null;

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

  function setTab(tab: "modules" | "tables" | "transactions" | "fields" | "indexes") {
    const p = new URLSearchParams();
    p.set("view", tab === "modules" ? "menus" : tab);
    router.push(`/database?${p.toString()}`);
    if (tab !== "tables") setSelectedTable(null);
    if (tab !== "modules") setSelectedMenuIds([]);
  }

  function openCreateModal() {
    if (!activeCreateTarget || !canCreateExplorerRecords) return;
    setCreateError("");
    setCreateTarget(activeCreateTarget);
  }

  function closeCreateModal() {
    if (creating) return;
    setCreateTarget(null);
    setCreateError("");
  }

  async function handleCreateSubmit(
    target: ExplorerCreateTarget,
    payload: ExplorerCreatePayload,
  ) {
    setCreating(true);
    setCreateError("");

    try {
      if (target === "modules") {
        const menuPayload = payload as MenuCreatePayload;
        await addMenuAction({
          title: menuPayload.title,
          description: menuPayload.description,
          parentId: menuPayload.parentId || null,
          order: menuPayload.order,
        });
      } else if (target === "tables") {
        const tablePayload = payload as TableCreatePayload;
        await addTableAction({
          name: tablePayload.name,
          description: tablePayload.description,
        });
      } else if (target === "fields") {
        const fieldPayload = payload as FieldCreatePayload;
        await addFieldAction({
          tableId: fieldPayload.tableId,
          name: fieldPayload.name,
          type: fieldPayload.type,
          length: fieldPayload.length,
          nullable: fieldPayload.nullable,
          description: fieldPayload.description,
          position: fieldPayload.position,
        });
      } else if (target === "indexes") {
        const indexPayload = payload as IndexCreatePayload;
        await addIndexAction({
          tableId: indexPayload.tableId,
          name: indexPayload.name,
          isUnique: indexPayload.isUnique,
          fields: indexPayload.fields,
          description: indexPayload.description,
        });
      } else {
        const transactionPayload = payload as TransactionCreatePayload;
        await addTransactionAction({
          name: transactionPayload.name,
          description: transactionPayload.description,
          pgmType: transactionPayload.pgmType,
          language: transactionPayload.language,
          tables: transactionPayload.tables,
          pgms: transactionPayload.pgms,
        });
      }

      const refreshed = await loadExplorerData(false);
      setRefreshVersion((value) => value + 1);
      if (selectedTable && ["fields", "indexes", "transactions"].includes(target)) {
        const refreshedTable = refreshed?.tables.find((table) => table.id === selectedTable.id);
        if (refreshedTable) {
          await handleTableSelect(refreshedTable);
        }
      }
      setCreateTarget(null);
      startTransition(() => router.refresh());
    } catch (error: any) {
      setCreateError(error?.message || "Unable to create the explorer record.");
    } finally {
      setCreating(false);
    }
  }

  const addControl = canCreateExplorerRecords && activeCreateTarget ? (
    <ExplorerAddButton target={activeCreateTarget} onClick={openCreateModal} />
  ) : null;

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
          totalCount: headMenus.length,
          headerAction: addControl,
        })
      ) : activeTab === "transactions" ? (
        <TransactionsView
          txns={filteredTxns}
          search={txnSearch}
          setSearch={setTxnSearch}
          selectedTxn={selectedTxnFromList}
          onSelectTxn={setSelectedTxnFromList}
          headerAction={addControl}
          onJumpToTable={(name: string) => {
            const tb = tables.find(t => t.name.toLowerCase() === name.toLowerCase());
            if (tb) { setTab("tables"); handleTableSelect(tb); }
          }}
        />
      ) : activeTab === "fields" ? (
        <FieldsBrowserView tables={tables} headerAction={addControl} refreshVersion={refreshVersion} />
      ) : activeTab === "indexes" ? (
        <IndexesBrowserView tables={tables} headerAction={addControl} refreshVersion={refreshVersion} />
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
          headerAction={addControl}
          onJumpToTable={(name: string) => {
            const tb = tables.find(t => t.name.toLowerCase() === name.toLowerCase());
            if (tb) handleTableSelect(tb);
          }}
        />
      )}
      <ExplorerCreateModal
        open={createTarget !== null}
        target={createTarget}
        menus={menus}
        tables={tables}
        saving={creating}
        error={createError}
        onClose={closeCreateModal}
        onSubmit={handleCreateSubmit}
      />
    </div>
  );
}

// ─── Modules View ─────────────────────────────────────────────────────────────

function renderModulesView({
  headMenus, menus, selectedMenuIds, handleMenuSelect, setSelectedMenuIds,
  search, setSearch, totalCount, headerAction
}: {
  headMenus: Menu[], menus: Menu[], selectedMenuIds: string[],
  handleMenuSelect: (m: Menu, lvl: number) => void,
  setSelectedMenuIds: (ids: string[]) => void,
  search: string, setSearch: (s: string) => void,
  totalCount: number,
  headerAction?: ReactNode
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

        <div className="flex items-center gap-3">
          <div className="w-72 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text" placeholder="Search modules..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-100 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/20 transition-all"
            />
          </div>
          {headerAction}
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

function TransactionsView({ txns, search, setSearch, selectedTxn, onSelectTxn, onJumpToTable, headerAction }: {
  txns: Txn[], search: string, setSearch: (s: string) => void,
  selectedTxn: Txn | null, onSelectTxn: (t: Txn | null) => void,
  onJumpToTable: (name: string) => void,
  headerAction?: ReactNode,
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
          <div className="flex items-center gap-3">
            <div className="w-72 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text" placeholder="Search transactions..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-100 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-purple-500/20 transition-all"
              />
            </div>
            {headerAction}
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
  tableTxns, loadingTxns, selectedTxn, onSelectTxn, onClose, onJumpToTable, headerAction
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
                  type="text" placeholder="Search everything..."
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
                  {headerAction}
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setExportMode(true)}
                    className="flex items-center gap-2 px-4 py-2.5 border-2 border-slate-200 hover:border-indigo-400 text-slate-600 hover:text-indigo-600 rounded-xl text-sm font-bold transition-all bg-white hover:bg-indigo-50/40"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                  {headerAction}
                </>
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

// ─── Fields Browser View ──────────────────────────────────────────────────────

function FieldsBrowserView({ tables, headerAction, refreshVersion }: { tables: TableRecord[]; headerAction?: ReactNode; refreshVersion: number }) {
  const [search, setSearch] = useState("");
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [fields, setFields] = useState<DbField[]>([]);
  const [loading, setLoading] = useState(false);
  const selectedTable = tables.find((table) => table.id === selectedTableId);

  async function loadFields(tableId: string) {
    setSelectedTableId(tableId);
    setLoading(true);
    try {
      const data = await fetch(`/api/explorer/fields?tableId=${encodeURIComponent(tableId)}`).then(r => r.json()).catch(() => []);
      setFields(data ?? []);
    } catch { setFields([]); }
    setLoading(false);
  }

  const filteredFields = useMemo(() => {
    if (!search) return fields;
    const q = search.toLowerCase();
    return fields.filter(f => f.name.toLowerCase().includes(q) || f.type?.toLowerCase().includes(q) || f.description?.toLowerCase().includes(q));
  }, [fields, search]);

  useEffect(() => {
    if (selectedTableId) loadFields(selectedTableId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshVersion]);

  return (
    <div className="flex-1 flex flex-col p-6 gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Database Fields</h3>
          <p className="text-xs text-slate-400 mt-1">Browse field definitions across all registered tables</p>
        </div>
        {headerAction}
      </div>

      <div className="flex items-center gap-4">
        <select
          value={selectedTableId}
          onChange={(e) => e.target.value && loadFields(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 min-w-[220px]"
        >
          <option value="">Select a table...</option>
          {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>

        {selectedTableId && (
          <div className="relative flex-1 max-w-sm group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter fields..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
            />
          </div>
        )}
      </div>

      {!selectedTableId ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlignLeft className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-sm font-bold text-slate-500">Select a table above to browse its fields</p>
          </div>
        </div>
      ) : loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-400 text-sm animate-pulse font-bold">Loading fields…</p>
        </div>
      ) : filteredFields.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-400 text-sm font-bold">No fields found</p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto pr-1">
          {selectedTable && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-5 py-4 text-sm text-emerald-900">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">Selected Table</p>
                  <p className="mt-1 font-black">{selectedTable.name}</p>
                </div>
                <div className="rounded-full bg-white/80 px-3 py-1 text-xs font-black text-emerald-700">
                  {filteredFields.length} fields
                </div>
              </div>
            </div>
          )}
          {filteredFields.map((f, i) => (
            <div key={f.id ?? i} className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex items-center gap-4 hover:border-indigo-300 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <Hash className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-extrabold text-slate-800 text-sm font-mono">{f.name}</span>
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
      )}
    </div>
  );
}

// ─── Indexes Browser View ─────────────────────────────────────────────────────

type IndexInfo = { id?: string; name: string; fields: string; isUnique: boolean; description?: string };

function IndexesBrowserView({ tables, headerAction, refreshVersion }: { tables: TableRecord[]; headerAction?: ReactNode; refreshVersion: number }) {
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [indexes, setIndexes] = useState<IndexInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const selectedTable = tables.find(t => t.id === selectedTableId);

  async function loadIndexes(tableId: string) {
    setSelectedTableId(tableId);
    setLoading(true);
    try {
      const data = await fetch(`/api/explorer/indexes?tableId=${encodeURIComponent(tableId)}`).then(r => r.json()).catch(() => []);
      setIndexes(Array.isArray(data) ? data : []);
    } catch { setIndexes([]); }
    setLoading(false);
  }

  useEffect(() => {
    if (selectedTableId) loadIndexes(selectedTableId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshVersion]);

  return (
    <div className="flex-1 flex flex-col p-6 gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Database Indexes</h3>
          <p className="text-xs text-slate-400 mt-1">Browse index definitions for performance optimization</p>
        </div>
        {headerAction}
      </div>

      <select
        value={selectedTableId}
        onChange={(e) => e.target.value && loadIndexes(e.target.value)}
        className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 max-w-xs"
      >
        <option value="">Select a table...</option>
        {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>

      {!selectedTableId ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Layers className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-sm font-bold text-slate-500">Select a table above to view its indexes</p>
          </div>
        </div>
      ) : loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-400 text-sm animate-pulse font-bold">Loading indexes…</p>
        </div>
      ) : indexes.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-400 text-sm font-bold">No indexes found for this table</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden overflow-y-auto">
          {selectedTable && (
            <div className="border-b border-slate-100 bg-amber-50/70 px-6 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-600">Selected Table</p>
                  <p className="mt-1 font-black text-slate-900">{selectedTable.name}</p>
                </div>
                <div className="rounded-full bg-white/80 px-3 py-1 text-xs font-black text-amber-700">
                  {indexes.length} indexes
                </div>
              </div>
            </div>
          )}
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-[10px] text-slate-400 font-black uppercase tracking-widest bg-slate-50/50">
                <th className="text-left px-6 py-4 border-b border-slate-100">Index Name</th>
                <th className="text-left px-6 py-4 border-b border-slate-100">Fields</th>
                <th className="text-left px-6 py-4 border-b border-slate-100">Unique</th>
                <th className="text-left px-6 py-4 border-b border-slate-100">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {indexes.map((idx, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold font-mono text-indigo-600">{idx.name}</td>
                  <td className="px-6 py-4 text-sm font-mono text-slate-700">{idx.fields}</td>
                  <td className="px-6 py-4">
                    {idx.isUnique ? (
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded uppercase">Unique</span>
                    ) : (
                      <span className="text-[9px] font-black text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded uppercase">Non-Unique</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-500">{idx.description || "No description"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
