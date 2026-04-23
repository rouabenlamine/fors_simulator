/**
 * View Control — Component Registry & Types
 * This is a plain (non-server, non-client) module so it can be imported
 * by both server actions and client components without restriction.
 */

export const VIEW_COMPONENTS = [
  {
    id: "notification_button",
    label: "Notification Bell",
    description: "Top-bar notification icon and alert dropdown panel.",
    category: "Header",
  },
  {
    id: "chat_bubble",
    label: "Chat Bubble",
    description: "Floating GOST AI chat button visible across all dashboard pages.",
    category: "Header",
  },
  {
    id: "kpi_widgets",
    label: "KPI Widgets",
    description: "Live KPI & metrics cards displayed on the dashboard overview.",
    category: "Dashboard",
  },
  {
    id: "tickets_list",
    label: "Tickets List",
    description: "Incident ticket queue — list, filter, and status tracking.",
    category: "Dashboard",
  },
  {
    id: "incident_analysis",
    label: "Incident Analysis Workspace",
    description: "AI-driven root cause analysis and resolution recommendation panel.",
    category: "Dashboard",
  },
  {
    id: "analysis_lab",
    label: "Analysis Lab",
    description: "Interactive query and predefined SQL execution laboratory.",
    category: "Dashboard",
  },
  {
    id: "sql_console",
    label: "SQL Console",
    description: "Raw SQL execution terminal for admin-level database operations.",
    category: "Admin",
  },
  {
    id: "activity_logs",
    label: "Activity Logs",
    description: "Full audit trail of user and system actions across the platform.",
    category: "Dashboard",
  },
  {
    id: "report_export",
    label: "Report Export",
    description: "Downloadable incident reports and analytics export functionality.",
    category: "Dashboard",
  },
  {
    id: "fors_explorer",
    label: "FORS Explorer",
    description: "Hierarchical database explorer: menus, tables, and transactions.",
    category: "Data",
  },
  {
    id: "user_management",
    label: "User Management",
    description: "Create, update, and deactivate user accounts and roles.",
    category: "Admin",
  },
  {
    id: "kpi_config",
    label: "KPI Configuration",
    description: "Enable, disable, and customise KPI metric definitions.",
    category: "Admin",
  },
] as const;

export type ComponentId = (typeof VIEW_COMPONENTS)[number]["id"];

export type RolePermissions = Record<ComponentId, boolean>;

/** Build a default permissions map with every component visible. */
export function buildDefaultPermissions(): RolePermissions {
  const perms: any = {};
  for (const c of VIEW_COMPONENTS) {
    perms[c.id] = true;
  }
  return perms as RolePermissions;
}
