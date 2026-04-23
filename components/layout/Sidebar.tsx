"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import {
  Ticket, MessageSquare, BarChart3, Activity,
  LogOut, Cpu, Database, FileText, Table, FlaskConical,
  LayoutDashboard, Users, Settings, ChevronRight,
  Search, X, Menu, ArrowRight, Layers, BookOpen, Settings2,
} from "lucide-react";
import type { UserRole } from "@/lib/types";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  getExplorerMenus,
  getExplorerTables,
} from "@/app/actions";
import { useViewPermissions } from "@/contexts/ViewPermissionsContext";
import type { ComponentId } from "@/lib/view-components";

// ─── Component ID mapping for nav items ─────────────────────────────────────
const NAV_COMPONENT_MAP: Record<string, ComponentId> = {
  "/tickets":  "tickets_list",
  "/analysis": "incident_analysis",
  "/lab":      "analysis_lab",
  "/chat":     "chat_bubble",
  "/database": "fors_explorer",
  "/kpis":     "kpi_widgets",
  "/activity": "activity_logs",
  "/report":   "report_export",
  "/users":    "user_management",
  "/kpi-config": "kpi_config",
  "/admin/sql-console": "sql_console",
  "/admin/users": "user_management",
  "/admin/kpi-config": "kpi_config",
};

// ─── Nav definitions ────────────────────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  componentId?: ComponentId;
  sub?: { href: string; label: string }[];
}

const AGENT_NAV: NavItem[] = [
  { href: "/tickets",  label: "Tickets",            icon: Ticket,          componentId: "tickets_list" },
  { href: "/analysis", label: "Analysis Workspace", icon: LayoutDashboard, componentId: "incident_analysis" },
  { href: "/lab",      label: "Analysis Lab",        icon: FlaskConical,   componentId: "analysis_lab" },
  { href: "/chat",     label: "Chat History",        icon: MessageSquare,  componentId: "chat_bubble" },
  {
    href: "/database",
    label: "Fors Explorer",
    icon: Database,
    componentId: "fors_explorer",
    sub: [
      { href: "/database?view=menus",        label: "Menus"        },
      { href: "/database?view=transactions", label: "Transactions" },
      { href: "/database?view=tables",       label: "Tables"       },
    ],
  },
  { href: "/kpis",     label: "KPIs",               icon: BarChart3,      componentId: "kpi_widgets" },
  { href: "/activity", label: "Activity Log",        icon: Activity,       componentId: "activity_logs" },
];

const REPORTER_NAV: NavItem[] = [
  { href: "/report",   label: "Report Dashboard",   icon: BarChart3,      componentId: "report_export" },
  { href: "/kpis",     label: "KPI Overview",        icon: FileText,      componentId: "kpi_widgets" },
  { href: "/activity", label: "Activity Log",        icon: Activity,       componentId: "activity_logs" },
];

const MANAGER_NAV: NavItem[] = [
  { href: "/activity", label: "Activity Log",        icon: Activity,       componentId: "activity_logs" },
  { href: "/kpis",     label: "KPIs",               icon: BarChart3,      componentId: "kpi_widgets" },
  { href: "/users",    label: "Team Management",    icon: Users,          componentId: "user_management" },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin/dashboard",   label: "Control Panel",      icon: LayoutDashboard },
  { href: "/admin/users",       label: "User Management",    icon: Users },
  { href: "/admin/audit",       label: "Audit Logs",         icon: Activity },
  { href: "/admin/mapping",     label: "Functional Mapping", icon: Layers },
  { href: "/admin/kpi-config",  label: "KPI Config",         icon: Settings },
  { href: "/admin/sql-console", label: "Raw SQL Console",    icon: Database },
];

const SUPER_ADMIN_NAV: NavItem[] = [
  { href: "/superadmin/dashboard",         label: "Control Panel",      icon: LayoutDashboard },
  { href: "/admin/users",                  label: "User Management",    icon: Users },
  { href: "/superadmin/integrations",      label: "Integration Hub",    icon: Cpu },
  { href: "/admin/audit",                  label: "Audit Logs",         icon: Activity },
  { href: "/admin/mapping",                label: "Functional Mapping", icon: Layers },
  { href: "/admin/kpi-config",             label: "KPI Config",         icon: Settings },
  { href: "/admin/sql-console",            label: "Raw SQL Console",    icon: Database },
  { href: "/admin/view-control",           label: "View Control",       icon: Settings2 },
  { href: "/superadmin/database-explorer", label: "Global DB Explorer", icon: Table },
];

const ROLE_META: Record<UserRole, { label: string; subtitle: string; accent: string }> = {
  agent:      { label: "LEONI", subtitle: "IT Support",  accent: "bg-blue-500" },
  reporter:   { label: "LEONI", subtitle: "IT Report",   accent: "bg-purple-500" },
  manager:    { label: "LEONI", subtitle: "IT Manager",  accent: "bg-teal-500" },
  admin:      { label: "LEONI", subtitle: "Admin",       accent: "bg-indigo-500" },
  superadmin: { label: "LEONI", subtitle: "Superadmin",  accent: "bg-rose-500" },
  user:       { label: "LEONI", subtitle: "User",        accent: "bg-slate-500" },
  it_support: { label: "LEONI", subtitle: "IT Support",  accent: "bg-blue-500" },
  it_report:  { label: "LEONI", subtitle: "IT Report",   accent: "bg-emerald-500" },
  it_manager: { label: "LEONI", subtitle: "IT Manager",  accent: "bg-violet-500" },
};

function getNav(role?: string): NavItem[] {
  if (role === "reporter" || role === "it_report") return REPORTER_NAV;
  if (role === "manager" || role === "it_manager") return MANAGER_NAV;
  if (role === "admin") return ADMIN_NAV;
  if (role === "superadmin") return SUPER_ADMIN_NAV;
  return AGENT_NAV;
}

// ─── Search result type ──────────────────────────────────────────────────────

type SearchResult = {
  type: "menu" | "table" | "transaction" | "field";
  label: string;
  sublabel?: string;
  href: string;
};

// ─── Main Sidebar ────────────────────────────────────────────────────────────

export function Sidebar({ role }: { role?: UserRole }) {
  const pathname = usePathname();
  const searchParamsHook = useSearchParams();
  const router = useRouter();
  const allNavItems = getNav(role);
  const meta = ROLE_META[role as UserRole] ?? ROLE_META["agent"];
  const { permissions } = useViewPermissions();

  // Filter nav items based on view permissions (CRITICAL FIX — Section 3)
  // Only apply to non-admin/superadmin roles
  const isAdminRole = role === "admin" || role === "superadmin";
  const navItems = isAdminRole
    ? allNavItems
    : allNavItems.filter((item) => {
        if (!item.componentId) return true; // No component ID = always show
        if (!permissions) return true; // No permissions loaded = show by default
        return permissions[item.componentId] !== false;
      });

  // Global search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Explorer expanded state — open if on /database path
  const [explorerOpen, setExplorerOpen] = useState(false);
  useEffect(() => {
    setExplorerOpen(pathname?.startsWith("/database") ?? false);
  }, [pathname]);

  // Pre-fetched data for search
  const [allMenus, setAllMenus] = useState<any[]>([]);
  const [allTables, setAllTables] = useState<any[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Close search on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Lazy-load explorer data when search is first opened
  const ensureData = useCallback(async () => {
    if (dataLoaded) return;
    setSearchLoading(true);
    try {
      const [menus, tables] = await Promise.all([getExplorerMenus(), getExplorerTables()]);
      setAllMenus(menus);
      setAllTables(tables);
      setDataLoaded(true);
    } catch (e) {
      console.error("Search data load failed", e);
    } finally {
      setSearchLoading(false);
    }
  }, [dataLoaded]);

  // Run live search whenever query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    // Menus
    allMenus.forEach((m) => {
      if (m.title?.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q)) {
        results.push({
          type: "menu",
          label: m.title,
          sublabel: m.description || undefined,
          href: `/database?view=menus&id=${m.id}`,
        });
      }
    });

    // Tables + their fields
    allTables.forEach((t) => {
      if (t.name?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)) {
        results.push({
          type: "table",
          label: t.name,
          sublabel: t.description || undefined,
          href: `/database?view=tables&table=${encodeURIComponent(t.name)}`,
        });
      }
    });

    setSearchResults(results.slice(0, 12));
  }, [searchQuery, allMenus, allTables]);

  function handleSearchFocus() {
    setSearchOpen(true);
    ensureData();
  }

  function handleResultClick(href: string) {
    setSearchOpen(false);
    setSearchQuery("");
    router.push(href);
  }

  async function handleLogout() {
    const isAdmin = role === "admin" || role === "superadmin";
    try {
      await fetch("/fors/auth/logout", { method: "POST", redirect: "manual" });
    } catch { /* ignore */ }
    window.location.href = isAdmin ? "/admin/login" : "/login";
  }

  const typeIcon: Record<SearchResult["type"], React.ReactNode> = {
    menu:        <BookOpen className="w-3.5 h-3.5 text-blue-400" />,
    table:       <Database className="w-3.5 h-3.5 text-emerald-400" />,
    transaction: <Layers className="w-3.5 h-3.5 text-purple-400" />,
    field:       <Menu className="w-3.5 h-3.5 text-amber-400" />,
  };

  return (
    <aside className="w-56 flex flex-col h-screen fixed left-0 top-0 z-30 bg-slate-900 shadow-2xl">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 ${meta.accent} rounded-xl flex items-center justify-center shadow-lg`}>
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-wide uppercase">{meta.label}</p>
            <p className="text-[10px] text-slate-400 font-medium">{meta.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Global Search */}
      <div className="px-3 pt-3 pb-1" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleSearchFocus}
            placeholder="Search everything…"
            className="w-full bg-slate-800 border border-white/5 rounded-lg pl-8 pr-7 py-2 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); setSearchResults([]); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown results */}
        {searchOpen && (searchQuery.trim() || searchLoading) && (
          <div className="absolute left-3 right-3 top-auto mt-1 bg-slate-800 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
            {searchLoading && !dataLoaded ? (
              <div className="px-4 py-3 text-xs text-slate-400 animate-pulse">Loading index…</div>
            ) : searchResults.length === 0 && searchQuery ? (
              <div className="px-4 py-3 text-xs text-slate-400">No results for &quot;{searchQuery}&quot;</div>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                {searchResults.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => handleResultClick(r.href)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 text-left transition-colors group"
                  >
                    <div className="shrink-0">{typeIcon[r.type]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate group-hover:text-white">{r.label}</p>
                      {r.sublabel && <p className="text-[10px] text-slate-500 truncate">{r.sublabel}</p>}
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 group-hover:text-slate-400 bg-white/5 px-1.5 py-0.5 rounded shrink-0">
                      {r.type}
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-blue-400 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto custom-scrollbar">
        {navItems.map(({ href, label, icon: Icon, sub }) => {
          const pathBase = href.split("?")[0];
          const isPathActive = pathname ? pathname === pathBase || pathname.startsWith(pathBase + "/") : false;
          const hasExplorerSub = !!sub;
          const isOpen = hasExplorerSub ? (explorerOpen || isPathActive) : false;

          return (
            <div key={href}>
              <div
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer",
                  isPathActive
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
                )}
                onClick={() => {
                  if (hasExplorerSub) {
                    setExplorerOpen((v) => !v);
                  } else {
                    router.push(href);
                  }
                }}
              >
                <Icon className={clsx("w-4 h-4 shrink-0", isPathActive ? "text-blue-400" : "text-slate-500")} />
                <span className="flex-1">{label}</span>
                {hasExplorerSub ? (
                  <ChevronRight className={clsx("w-3.5 h-3.5 text-slate-500 transition-transform duration-200", isOpen && "rotate-90")} />
                ) : isPathActive ? (
                  <div className="w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                ) : null}
              </div>

              {/* Sub-items */}
              {hasExplorerSub && isOpen && (
                <div className="ml-7 mt-0.5 mb-1 space-y-0.5 border-l-2 border-slate-700/60 pl-3">
                  {sub!.map((s) => {
                    const subView = s.href.split("view=")[1]?.split("&")[0];
                    const isSubActive = !!(subView && searchParamsHook?.get("view") === subView && pathname?.startsWith("/database"));
                    return (
                      <Link
                        key={s.href}
                        href={s.href}
                        className={clsx(
                          "block px-2 py-1.5 rounded-md text-xs font-semibold transition-all duration-100",
                          isSubActive
                            ? "text-blue-400 bg-slate-800"
                            : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                        )}
                      >
                        {s.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-5 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>

      {/* eslint-disable-next-line react/no-unknown-property */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </aside>
  );
}
