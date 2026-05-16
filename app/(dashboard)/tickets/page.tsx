"use client";

import { useState, useEffect } from "react";
import { getTickets } from "@/app/actions";
import { TicketTabs } from "@/components/tickets/TicketTabs";
import type { Ticket, TicketStatus, TicketPriority } from "@/lib/types";
import {
  RefreshCw, Check, Search, Ticket as TicketIcon,
  ArrowUpDown, Clock, Loader2, X
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/constants";
import { clsx } from "clsx";

type TabKey = "all" | TicketStatus;

const PRIORITIES: TicketPriority[] = [
  "1 - Critical",
  "2 - High",
  "3 - Moderate",
  "4 - Low",
  "5 - Planning",
];

const PRIORITY_PASTEL: Record<TicketPriority, { bg: string; text: string; dot: string; ring: string }> = {
  "1 - Critical": { bg: "bg-rose-50", text: "text-rose-600", dot: "bg-rose-400", ring: "ring-rose-200" },
  "2 - High": { bg: "bg-orange-50", text: "text-orange-600", dot: "bg-orange-400", ring: "ring-orange-200" },
  "3 - Moderate": { bg: "bg-violet-50", text: "text-violet-600", dot: "bg-violet-400", ring: "ring-violet-200" },
  "4 - Low": { bg: "bg-sky-50", text: "text-sky-600", dot: "bg-sky-400", ring: "ring-sky-200" },
  "5 - Planning": { bg: "bg-fuchsia-50", text: "text-fuchsia-600", dot: "bg-fuchsia-400", ring: "ring-fuchsia-200" },
};

const STATUS_PASTEL: Record<string, { bg: string; text: string; ring: string }> = {
  pending: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200" },
  analysis_pending: { bg: "bg-indigo-50", text: "text-indigo-700", ring: "ring-indigo-200" },
  sql_proposed: { bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-200" },
  validated: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
  rejected: { bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-200" },
  closed: { bg: "bg-green-50", text: "text-green-700", ring: "ring-green-200" },
  canceled: { bg: "bg-slate-100", text: "text-slate-500", ring: "ring-slate-200" },
};

function StatusBadge({ status }: { status: TicketStatus }) {
  const style = STATUS_PASTEL[status] ?? { bg: "bg-slate-100", text: "text-slate-500", ring: "ring-slate-200" };
  return (
    <span className={clsx(
      "inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
      style.bg, style.text, style.ring
    )}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const p = PRIORITY_PASTEL[priority] ?? { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400", ring: "ring-slate-200" };
  const label = priority.split(" - ")[1] ?? priority;
  return (
    <span className={clsx(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ring-1 ring-inset",
      p.bg, p.text, p.ring
    )}>
      <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", p.dot)} />
      {label}
    </span>
  );
}

function KpiCard({
  label, value, sub, color,
}: { label: string; value: number | string; sub?: string; color: string }) {
  return (
    <div className={clsx("rounded-2xl p-4 ring-1 ring-inset flex flex-col gap-1", color)}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{label}</p>
      <p className="text-2xl font-black">{value}</p>
      {sub && <p className="text-[10px] font-medium opacity-60">{sub}</p>}
    </div>
  );
}

export default function TicketsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const sidPrefix = pathname.match(/^\/s\/[^\/]+/)?.[0] || "";
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [selectedPriorities, setSelectedPriorities] = useState<TicketPriority[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<TicketStatus[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [refreshed, setRefreshed] = useState(false);
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const TEAMS = Array.from(new Set(allTickets.map((t) => t.team))).filter(Boolean);

  const loadData = async () => {
    setLoading(true);
    const data = await getTickets();
    setAllTickets(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  function togglePriority(p: TicketPriority) {
    setSelectedPriorities((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  function toggleStatus(s: TicketStatus) {
    setSelectedStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  function toggleTeam(t: string) {
    setSelectedTeams((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  function clearFilters() {
    setSelectedPriorities([]);
    setSelectedStatuses([]);
    setSelectedTeams([]);
  }

  function handleRefresh() {
    setRefreshed(true);
    loadData().then(() => setTimeout(() => setRefreshed(false), 500));
  }

  const activeFilterCount = selectedPriorities.length + selectedTeams.length + selectedStatuses.length;

  const filtered = allTickets.filter((t) => {
    if (activeTab !== "all" && t.status !== activeTab) return false;
    if (selectedPriorities.length > 0 && !selectedPriorities.includes(t.priority)) return false;
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(t.status)) return false;
    if (selectedTeams.length > 0 && !selectedTeams.includes(t.team)) return false;
    return true;
  });

  const searched = filtered.filter((t) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      t.id?.toLowerCase().includes(s) ||
      t.title?.toLowerCase().includes(s) ||
      t.assignedTo?.toLowerCase().includes(s)
    );
  });

  const counts: Record<TabKey, number> = {
    all: allTickets.length,
    pending: allTickets.filter((t) => t.status === "pending").length,
    canceled: allTickets.filter((t) => t.status === "canceled").length,
    closed: allTickets.filter((t) => t.status === "closed").length,
    sql_proposed: allTickets.filter((t) => t.status === "sql_proposed").length,
    validated: allTickets.filter((t) => t.status === "validated").length,
    rejected: allTickets.filter((t) => t.status === "rejected").length,
    analysis_pending: allTickets.filter((t) => t.status === "analysis_pending").length,
  };

  const STATUS_FILTER_OPTIONS: { key: TicketStatus; label: string; dot: string }[] = [
    { key: "pending", label: "Pending", dot: "bg-amber-400" },
    { key: "analysis_pending", label: "Pending Analysis", dot: "bg-indigo-400" },
    { key: "validated", label: "Validated", dot: "bg-emerald-400" },
    { key: "rejected", label: "Rejected", dot: "bg-rose-400" },
    { key: "closed", label: "Closed", dot: "bg-green-400" },
    { key: "canceled", label: "Canceled", dot: "bg-slate-300" },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-[1700px] mx-auto space-y-5">

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <TicketIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">
              Tickets <span className="text-indigo-500">Dashboard</span>
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Real-time Ingestion
              </p>
            </div>
          </div>
        </div>

        {/* Search + Actions bar */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search ID, title, assignee…"
              className="bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all w-56 shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={clsx(
                "h-9 px-4 flex items-center gap-2 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all shadow-sm",
                filterOpen || activeFilterCount > 0
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                  : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
              )}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              Filter
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 bg-white text-indigo-600 rounded-full flex items-center justify-center text-[9px] font-black">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Filter Dropdown Popover */}
            {filterOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter Matrix</p>
                    {activeFilterCount > 0 && (
                      <button onClick={clearFilters} className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest">Clear All</button>
                    )}
                  </div>

                  {/* Priority Section */}
                  <div className="space-y-2.5">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Priority</p>
                    <div className="flex flex-wrap gap-1.5">
                      {PRIORITIES.map(p => (
                        <button
                          key={p}
                          onClick={() => togglePriority(p)}
                          className={clsx(
                            "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all border",
                            selectedPriorities.includes(p)
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                              : "bg-slate-50 text-slate-500 border-slate-100 hover:border-indigo-300"
                          )}
                        >
                          {p.split(" - ")[1]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Team Section */}
                  <div className="space-y-2.5">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Team</p>
                    <div className="flex flex-wrap gap-1.5">
                      {TEAMS.map(team => (
                        <button
                          key={team}
                          onClick={() => toggleTeam(team)}
                          className={clsx(
                            "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all border",
                            selectedTeams.includes(team)
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                              : "bg-slate-50 text-slate-500 border-slate-100 hover:border-indigo-300"
                          )}
                        >
                          {team}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleRefresh}
            title="Refresh"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-all shadow-sm"
          >
            <RefreshCw className={clsx("w-3.5 h-3.5 transition-all", refreshed && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* ── KPI Summary Row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard
          label="Total Tickets"
          value={counts.all}
          sub="In queue"
          color="bg-slate-50 text-slate-700 ring-slate-200"
        />
        <KpiCard
          label="Pending"
          value={counts.pending + counts.analysis_pending}
          sub={`${counts.pending} ticket · ${counts.analysis_pending} analysis`}
          color="bg-amber-50 text-amber-700 ring-amber-200"
        />
        <KpiCard
          label="Validated"
          value={counts.validated}
          sub="Solutions accepted"
          color="bg-emerald-50 text-emerald-700 ring-emerald-200"
        />
        <KpiCard
          label="Rejected / Canceled"
          value={counts.rejected + counts.canceled}
          sub="Needs attention"
          color="bg-rose-50 text-rose-700 ring-rose-200"
        />
      </div>

      {/* ── Main Content: Table ───────────────────────── */}
      <div className="space-y-3">
        {/* Tabs row */}
        <div className="bg-white rounded-2xl border border-slate-200/80 px-4 py-3 shadow-sm">
          <TicketTabs active={activeTab} onChange={setActiveTab} counts={counts} />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Table header bar */}
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <p className="text-xs font-black text-slate-700 uppercase tracking-widest">
              Incident Queue
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-medium">
                {searched.length} result{searched.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
              <thead>
                <tr className="bg-slate-50/70">
                  <th className="w-36 px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                    <div className="flex items-center gap-1">Ticket ID <ArrowUpDown className="w-3 h-3 opacity-40" /></div>
                  </th>
                  <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Incident</th>
                  <th className="w-36 px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Status</th>
                  <th className="w-32 px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Priority</th>
                  <th className="w-44 px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Assignment</th>
                  <th className="w-28 px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-right">Opened</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                          Synchronising…
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : searched.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <TicketIcon className="w-8 h-8 text-slate-200" />
                        <p className="text-sm font-bold text-slate-400">No matching tickets</p>
                        <p className="text-xs text-slate-300">Try adjusting your search</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  searched.map((ticket, idx) => (
                    <tr
                      key={ticket.id}
                      onClick={() => router.push(`${sidPrefix}/tickets/${ticket.id}`)}
                      className={clsx(
                        "group cursor-pointer border-b border-slate-100/80 transition-all duration-150 last:border-0",
                        idx % 2 === 0 ? "bg-white hover:bg-indigo-50/40" : "bg-slate-50/40 hover:bg-indigo-50/40"
                      )}
                    >
                      {/* Ticket ID */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-black text-indigo-600 bg-indigo-50 group-hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors ring-1 ring-inset ring-indigo-100">
                          {ticket.id}
                        </span>
                      </td>

                      {/* Title */}
                      <td className="px-5 py-3.5 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-indigo-700 transition-colors leading-snug">
                          {ticket.title}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <StatusBadge status={ticket.status} />
                      </td>

                      {/* Priority */}
                      <td className="px-5 py-3.5">
                        <PriorityBadge priority={ticket.priority} />
                      </td>

                      {/* Assignment */}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-slate-700 truncate">{ticket.team}</span>
                          <span className="text-[10px] text-slate-400 truncate">{ticket.assignedTo || "Unassigned"}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-[10px] font-bold text-slate-400">
                          {new Date(ticket.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
