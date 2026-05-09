# FORS Simulator - Project Context & Documentation

This document is designed to provide an AI agent with a comprehensive understanding of the FORS Simulator project, its architecture, role-based access control, and file hierarchy.

## 1. Project Overview

**FORS Simulator** is a Next.js-based IT Service Management (ITSM) and Ticketing command center, built specifically to simulate the IT workflows for **LEONI**. 

The application features:
- **Ticketing System**: Ingestion and management of IT support tickets.
- **GHOST AI Integration**: An AI-powered assistant that provides root-cause analysis, ticket resolution recommendations, and SQL query generation.
- **FORS Explorer / Database Introspection**: A module that allows administrative roles to introspect the system's database schema, view tables, menus, transactions, and execute queries.
- **Role-Based Access Control (RBAC)**: Deep component-level and page-level permission systems.
- **KPI Dashboards**: Live telemetry and metric visualization.
- **Audit Logging**: Full activity tracking for users and administrative actions.

## 2. Technology Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS / Vanilla CSS (Glassmorphism, Dark Mode aesthetics)
- **Icons**: Lucide React
- **Database**: MariaDB / MySQL (interfaced via server actions and API routes)
- **State Management**: React Hooks + Context API (e.g., `ViewPermissionsContext`)

## 3. Role-Based Access Control (RBAC)

The system supports the following canonical user roles:
1. `it_support` (Agent): Handles tickets, interacts with the GHOST AI, and uses the analysis lab.
2. `it_report`: Accesses high-level overview reports and KPIs.
3. `it_manager`: Manages team activity, oversees KPIs, and manages support users.
4. `admin`: Accesses the Control Panel, user management, audit logs, and component view permissions.
5. `superadmin`: Has ultimate access, including integration hubs (n8n, ServiceNow) and deep database explorers.

> **Note:** Component visibility is controlled dynamically via `lib/view-components.ts` and managed in the `/admin/view-control` interface.

## 4. Directory Hierarchy & Key Files

### `/app` (Next.js App Router)
- **`/api`**: Backend endpoints.
  - `ai-analysis/route.ts`: AI ticket analysis endpoint.
  - `tickets/route.ts`: Ticket ingestion (e.g., from n8n/ServiceNow).
- **`/(dashboard)`**: Main authenticated wrapper for the application.
  - `tickets/`, `analysis/`, `lab/`, `chat/`: IT Support operational modules.
  - `kpis/`, `activity/`, `report/`: Reporting and telemetry modules.
  - `database/`: FORS Database Explorer (Menus, Tables, Transactions, etc.).
  - **`/admin`**: Admin functionalities (`/users`, `/audit`, `/view-control`, `/kpi-config`).
  - **`/superadmin`**: Superadmin exclusive features (`/database-explorer`, `/integrations`).
- **`/login` & `/admin/login`**: Authentication pages.
- **`globals.css`**: Global stylesheet containing design tokens and utility classes.

### `/components` (UI Components)
- **`/layout`**: Layout shells.
  - `Header.tsx`: Top bar, handles global IT notifications and toasts.
  - `Sidebar.tsx`: Navigation menu, dynamically filtered based on `user.role` and view permissions. Contains the global search functionality.
- **`/tickets`**: Ticket lists, detail views, and status tabs.
- **`/chat`**: GHOST AI conversational interfaces (e.g., `ChatWindow.tsx`, `DeleteConversationButton.tsx`).

### `/lib` (Core Logic & Utilities)
- `ai.ts`: Configuration and logic for the GHOST AI / LLM interactions.
- `audit.ts`: Service for writing audit logs to the database.
- `constants.ts`: System-wide constants.
- `types.ts`: TypeScript interfaces for `User`, `Ticket`, etc.
- `view-components.ts`: Registry for the dynamic View Permissions system mapping UI components to their string IDs.

### Root Files
- `middleware.ts`: Next.js middleware handling route protection, authentication redirects, and role-based blockades.
- `/scratch`: A directory used for testing scripts and one-off developer utilities (e.g., database schema polling).

## 5. Key Concepts & Workflows

1. **Ticket Ingestion**: Tickets arrive via `app/api/tickets/route.ts`, where their payloads are normalized (mapping ServiceNow priority/state integers to human-readable strings).
2. **AI Analysis**: GHOST AI runs asynchronously to provide root-cause analysis. It operates with strict context bounding (preventing hallucinations outside the realm of IT database administration).
3. **View Control**: Navigation items and UI widgets (like `chat_bubble` or `notification_button`) are toggled via the `ViewPermissionsContext`. If a component ID is marked `false` in the database for a specific role, it won't render.
4. **Notifications**: The `Header` component polls for notifications, specifically surfacing automated AI resolutions and new n8n tickets to the `it_support` role.

## 6. Development Rules for AI Agents

- **Aesthetics First**: The UI demands premium, high-energy glassmorphism aesthetics. Avoid generic styling. 
- **Tooling**: Always verify existing tools and scripts in the `/scratch` directory or current files before writing redundant database queries.
- **Role Strictness**: Never bypass the role checks in `middleware.ts` or `Sidebar.tsx`. Always use the predefined canonical roles (`it_support`, `it_report`, `it_manager`, `admin`, `superadmin`).
- **Dependencies**: The project relies heavily on `lucide-react` for iconography. Ensure any new UI uses these icons to maintain consistency.
