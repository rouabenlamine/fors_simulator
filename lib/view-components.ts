/**
 * View Control — Component Registry & Types
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
    label: "Chat History",
    icon: "MessageSquare",
    componentId: "chat_bubble",
    description: "FORS Agent chat sessions",
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
    category: "Management",
  },
  {
    id: "kpi_config",
    label: "KPI Configuration",
    description: "Enable, disable, and customise KPI metric definitions.",
    category: "Management",
  },
  {
    id: "admin_control_panel",
    label: "Admin Control Panel",
    description: "Central administrative dashboard with system health and quick stats.",
    category: "System",
  },
  {
    id: "audit_logs",
    label: "Audit Logs",
    description: "System-level audit trail for administrative changes and security events.",
    category: "System",
  },
  {
    id: "view_permissions_management",
    label: "View Permissions Manager",
    description: "Interface for configuring role-based component visibility and access.",
    category: "System",
  },
  {
    id: "integration_hub",
    label: "Integration Hub",
    description: "Configure external service connections for ServiceNow, n8n, and AI providers.",
    category: "System",
  },
  {
    id: "system_db_explorer",
    label: "Database Explorer",
    description: "Unified system introspection: browse schemas, indexes, and execute raw SQL queries.",
    category: "System",
  },
] as const;

export type ComponentId = (typeof VIEW_COMPONENTS)[number]["id"];

export type RolePermissions = Record<ComponentId, boolean>;

export function buildDefaultPermissions(): RolePermissions {
  const perms: any = {};
  for (const c of VIEW_COMPONENTS) {
    perms[c.id] = true;
  }
  return perms as RolePermissions;
}
