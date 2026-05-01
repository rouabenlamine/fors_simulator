"use client";

import { useState, useRef, useEffect } from "react";
import { getTickets } from "@/app/actions";
import { TicketTabs } from "@/components/tickets/TicketTabs";
import type { Ticket, TicketStatus, TicketPriority } from "@/lib/types";
import { Filter, RefreshCw, ChevronDown, Check, Search, Ticket } from "lucide-react";
import { useRouter } from "next/navigation";
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_COLORS } from "@/lib/constants";

type TabKey = "all" | TicketStatus;

const PRIORITIES: TicketPriority[] = ["1 - Critical", "2 - High", "3 - Moderate", "4 - Low", "5 - Planning"];

export default function TicketsPage() {
  const router = useRouter();
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedPriorities, setSelectedPriorities] = useState<TicketPriority[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [refreshed, setRefreshed] = useState(false);
  const [search, setSearch] = useState("");
  const filterRef = useRef<HTMLDivElement>(null);

  const TEAMS = Array.from(new Set(allTickets.map((t) => t.team))).filter(Boolean);

  const loadData = async () => {
    setLoading(true);
    const data = await getTickets();
    setAllTickets(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function togglePriority(p: TicketPriority) {
    setSelectedPriorities((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  function toggleTeam(t: string) {
    setSelectedTeams((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  function clearFilters() {
    setSelectedPriorities([]);
    setSelectedTeams([]);
  }

  function handleRefresh() {
    setRefreshed(true);
    loadData().then(() => {
      setTimeout(() => setRefreshed(false), 500);
    });
  }

  const activeFilterCount = selectedPriorities.length + selectedTeams.length;

  const filtered = allTickets.filter((t) => {
    if (activeTab !== "all" && t.status !== activeTab) return false;
    if (selectedPriorities.length > 0 && !selectedPriorities.includes(t.priority)) return false;
    if (selectedTeams.length > 0 && !selectedTeams.includes(t.team)) return false;
    return true;
  });

  const searched = filtered.filter((t) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      (t.id?.toLowerCase().includes(s)) ||
      (t.title?.toLowerCase().includes(s)) ||
      (t.assignedTo?.toLowerCase().includes(s))
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center shadow-xl shadow-blue-200/50">
            <Ticket className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Tickets Dashboard</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Manage, track, and resolve IT service requests across the network</p>
          </div>
        </div>
      </div>

      {/* Ticket Ingestion Restriction Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 mt-0.5">
          <Filter className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-amber-900">Automated Ingestion Only</p>
          <p className="text-xs text-amber-700 mt-1 leading-relaxed">
            Manual ticket creation is disabled. All ticket data is ingested exclusively via <span className="font-bold">XML Import</span>, <span className="font-bold">ServiceNow Integration</span>, or <span className="font-bold">n8n Webhook</span>. Contact your administrator to configure ingestion pipelines.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Ticket List</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {filtered.length} of {allTickets.length} tickets
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="ml-2 text-accent-blue hover:underline text-[11px]">
                clear filters
              </button>
            )}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative group">
            <input
              type="text"
              placeholder="Search tickets..."
              className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 w-full sm:w-72 transition-all shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" />
          </div>

          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${activeFilterCount > 0
                ? "bg-indigo-600 text-white shadow-indigo-200"
                : "bg-white/80 border border-slate-200/60 text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
                }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Filter
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-white text-accent-blue text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${filterOpen ? "rotate-180" : ""}`} />
            </button>

            {filterOpen && (
              <div className="absolute right-0 top-10 w-56 bg-white border border-gray-100 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="px-3 py-2.5 border-b border-gray-100">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Priority</p>
                </div>
                <div className="px-2 py-2 space-y-0.5">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      onClick={() => togglePriority(p)}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-sm text-slate-800/80">{p}</span>
                      {selectedPriorities.includes(p) && (
                        <Check className="w-3.5 h-3.5 text-accent-blue" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="px-3 py-2.5 border-t border-gray-100">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Team</p>
                </div>
                <div className="px-2 py-2 space-y-0.5">
                  {TEAMS.map((team) => (
                    <button
                      key={team}
                      onClick={() => toggleTeam(team)}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-sm text-slate-800/80 truncate">{team}</span>
                      {selectedTeams.includes(team) && (
                        <Check className="w-3.5 h-3.5 text-accent-blue shrink-0" />
                      )}
                    </button>
                  ))}
                </div>

                {activeFilterCount > 0 && (
                  <div className="px-3 py-2.5 border-t border-gray-100">
                    <button
                      onClick={clearFilters}
                      className="w-full text-center text-xs text-accent-orange hover:text-orange-400 transition-colors"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleRefresh}
            className="flex items-center gap-2.5 px-4 py-2.5 bg-white/80 border border-slate-200/60 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-600 hover:text-indigo-600 transition-all shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 transition-all ${refreshed ? "animate-spin text-emerald-500" : ""}`} />
            <span className="hidden sm:inline">{refreshed ? "Syncing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      <div className="mb-4">
        <TicketTabs active={activeTab} onChange={setActiveTab} counts={counts} />
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/60 shadow-[0_8px_40px_rgb(0,0,0,0.04)] overflow-hidden min-h-[600px] flex flex-col relative">
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm font-medium">Fetching tickets from database...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-32 text-slate-400">
              <p className="text-sm">No tickets found</p>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="mt-2 text-accent-blue text-xs hover:underline">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-gray-100">
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Number</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Short Description</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">State</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Priority</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Group</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned To</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {searched.map((ticket, idx) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-white/90 hover:shadow-[0_4px_20px_rgba(79,70,229,0.08)] transition-all duration-300 cursor-pointer group animate-in fade-in slide-in-from-bottom-2"
                    style={{ animationDelay: `${(idx % 15) * 30}ms` }}
                    onClick={() => router.push(`/tickets/${ticket.id}`)}
                  >
                    <td className="px-4 py-4 text-xs font-mono font-black text-indigo-600 group-hover:text-indigo-700 transition-colors">{ticket.id}</td>
                    <td className="px-4 py-4 text-[13px] text-slate-800 font-bold max-w-md truncate group-hover:text-indigo-900 transition-colors">
                      {ticket.title}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-[9px] px-2.5 py-1 rounded-lg font-black uppercase tracking-widest shadow-sm ${STATUS_COLORS[ticket.status]}`}>
                        {STATUS_LABELS[ticket.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-[10px] px-2.5 py-1 rounded-lg font-black tracking-wider shadow-sm ${PRIORITY_COLORS[ticket.priority]}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs font-bold text-slate-500">{ticket.team}</td>
                    <td className="px-4 py-4 text-xs font-bold text-slate-600">{ticket.assignedTo || "—"}</td>
                    <td className="px-4 py-4 text-[10px] font-bold text-slate-400 text-right uppercase tracking-wider">
                      {new Date(ticket.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
