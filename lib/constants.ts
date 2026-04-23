import type { KPICategory, TicketStatus, TicketPriority } from "./types";

export const KPI_CATEGORIES: Record<KPICategory, { label: string; color: string }> = {
  sla:        { label: "SLA Compliance",  color: "#3b82f6" }, // Blue
  performance: { label: "Performance",     color: "#10b981" }, // Emerald
  volume:      { label: "Volume",          color: "#f43f5e" }, // Rose
  quality:     { label: "Quality",         color: "#8b5cf6" }, // Violet
  knowledge:   { label: "Knowledge Base",  color: "#f59e0b" }, // Amber
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
  pending: "Pending",
  canceled: "Canceled",
  closed: "Closed",
  sql_proposed: "SQL Proposed",
  validated: "Validated",
  rejected: "Rejected",
  analysis_pending: "Analysis Pending",
};

export const STATUS_COLORS: Record<TicketStatus, string> = {
  pending: "bg-amber-500/10 text-amber-600 border border-amber-200/50 shadow-[0_0_8px_rgba(245,158,11,0.1)]",
  canceled: "bg-slate-500/10 text-slate-600 border border-slate-200/50",
  closed: "bg-emerald-500/10 text-emerald-600 border border-emerald-200/50 shadow-[0_0_8px_rgba(16,185,129,0.1)]",
  sql_proposed: "bg-blue-500/10 text-blue-600 border border-blue-200/50 shadow-[0_0_8px_rgba(59,130,246,0.1)]",
  validated: "bg-green-500/10 text-green-600 border border-green-200/50 shadow-[0_0_8px_rgba(34,197,94,0.1)]",
  rejected: "bg-red-500/10 text-red-600 border border-red-200/50 shadow-[0_0_8px_rgba(239,68,68,0.1)]",
  analysis_pending: "bg-indigo-500/10 text-indigo-600 border border-indigo-200/50 shadow-[0_0_8px_rgba(99,102,241,0.1)]",
};

export const PRIORITY_COLORS: Record<TicketPriority, string> = {
  "1 - Critical": "bg-rose-500/10 text-rose-600 border border-rose-200/50 shadow-[0_0_8px_rgba(244,63,94,0.1)] font-bold",
  "2 - High":     "bg-orange-500/10 text-orange-600 border border-orange-200/50 shadow-[0_0_8px_rgba(249,115,22,0.1)] font-semibold",
  "3 - Moderate": "bg-violet-500/10 text-violet-600 border border-violet-200/50 shadow-[0_0_8px_rgba(139,92,246,0.1)] font-medium",
  "4 - Low":      "bg-blue-500/10 text-blue-600 border border-blue-200/50 shadow-[0_0_8px_rgba(59,130,246,0.1)]",
  "5 - Planning": "bg-fuchsia-500/10 text-fuchsia-600 border border-fuchsia-200/50 shadow-[0_0_8px_rgba(217,70,239,0.1)]",
};

export const TEAM_OPTIONS = ["IT Support", "Database Team", "Infrastructure", "Security", "Applications"];
export const ROLE_OPTIONS = ["agent", "reporter", "manager", "it_support", "it_report", "it_manager", "admin", "superadmin"];
