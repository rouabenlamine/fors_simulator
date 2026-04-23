"use client";

import { useState, useRef, useEffect } from "react";
import { getTickets } from "@/app/actions";
import { TicketTabs } from "@/components/tickets/TicketTabs";
import type { Ticket, TicketStatus, TicketPriority } from "@/lib/types";
import { Filter, RefreshCw, ChevronDown, Check, Search } from "lucide-react";
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
  const [selectedPriorities, setSelectedPriorities] = useState<TicketPriority[]>(["1 - Critical", "2 - High", "3 - Moderate"]);
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
    return (
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.assignedTo?.toLowerCase().includes(search.toLowerCase()))
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
      {/* Page title — only on Tickets page */}
      <h1 className="text-2xl font-black text-slate-800 mb-5 tracking-tight flex items-center gap-3">
        <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></svg>
        </span>
        Tickets Dashboard
      </h1>
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
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search tickets..."
              className="bg-white border border-gray-100 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 w-64 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="w-4 h-4 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeFilterCount > 0
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-slate-600 hover:text-slate-800"
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
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-50 rounded-lg text-sm text-slate-600 hover:text-slate-800 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 transition-all ${refreshed ? "animate-spin text-accent-green" : ""}`} />
            {refreshed ? "Done!" : "Refresh"}
          </button>
        </div>
      </div>

      <div className="mb-4">
        <TicketTabs active={activeTab} onChange={setActiveTab} counts={counts} />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
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
              <tbody className="divide-y divide-gray-50">
                {searched.map((ticket) => (
                  <tr 
                    key={ticket.id} 
                    className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                    onClick={() => router.push(`/tickets/${ticket.id}`)}
                  >
                    <td className="px-4 py-3 text-xs font-mono font-bold text-blue-600">{ticket.id}</td>
                    <td className="px-4 py-3 text-xs text-slate-700 font-medium max-w-md truncate">
                      {ticket.title}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${STATUS_COLORS[ticket.status]}`}>
                        {STATUS_LABELS[ticket.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${PRIORITY_COLORS[ticket.priority]}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{ticket.team}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 font-medium">{ticket.assignedTo || "—"}</td>
                    <td className="px-4 py-3 text-[10px] text-slate-400 text-right font-medium">
                      {new Date(ticket.createdAt).toLocaleDateString()}
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
